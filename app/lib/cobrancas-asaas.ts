
/**
 * MiniPage Pro - Listagem paginada de cobrancas.
 *
 * Apenas consulta dados fornecidos pelo servidor.
 * Nao altera assinaturas, pagamentos ou perfis.
 *
 * Falha de forma conservadora se a API retornar
 * dados incompletos, duplicados ou inconsistentes.
 */

export type ConsultarAsaas = (
  caminho: string
) => Promise<unknown>

export type CobrancaListadaAsaas = {
  id: string
  customer: string
  subscription: string
  status?: string
  dueDate?: string
  deleted?: boolean
  [campo: string]: unknown
}

export type ResultadoListagemAsaas =
  | {
      ok: true
      cobrancas: CobrancaListadaAsaas[]
      paginasConsultadas: number
    }
  | {
      ok: false
      motivo: string
      paginasConsultadas: number
    }

/**
 * Consulta o historico de uma assinatura.
 *
 * O servidor deve fornecer uma funcao de consulta
 * autenticada, utilizando o ambiente Asaas correto.
 *
 * Esta funcao nao prova que os dados permaneceram
 * imutaveis durante a paginacao. Antes de qualquer
 * operacao financeira, o servidor deve revalidar
 * o estado da assinatura e da cobranca relevante.
 */
export async function listarCobrancasAssinatura(
  consultar: ConsultarAsaas,
  subscriptionId: string,
  customerId: string
): Promise<ResultadoListagemAsaas> {
  const LIMITE = 100
  const MAX_PAGINAS = 100

  let paginasConsultadas = 0
  let offset = 0

  const cobrancas: CobrancaListadaAsaas[] = []
  const identificadores = new Set<string>()

  const falhar = (
    motivo: string
  ): ResultadoListagemAsaas => ({
    ok: false,
    motivo,
    paginasConsultadas,
  })

  if (
    typeof subscriptionId !== 'string' ||
    !subscriptionId.trim() ||
    typeof customerId !== 'string' ||
    !customerId.trim()
  ) {
    return falhar('Identificadores da assinatura incompletos')
  }

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const caminho =
      `/payments?subscription=${encodeURIComponent(subscriptionId)}` +
      `&limit=${LIMITE}&offset=${offset}`

    let resposta: unknown

    try {
      resposta = await consultar(caminho)
    } catch {
      return falhar('Falha ao consultar cobrancas no Asaas')
    }

    paginasConsultadas++

    if (
      !resposta ||
      typeof resposta !== 'object' ||
      Array.isArray(resposta)
    ) {
      return falhar('Resposta financeira invalida')
    }

    const dados = resposta as Record<string, unknown>

    if (
      !Array.isArray(dados.data) ||
      typeof dados.hasMore !== 'boolean'
    ) {
      return falhar('Paginacao financeira inconclusiva')
    }

    if (
      dados.data.length > LIMITE ||
      (dados.hasMore && dados.data.length === 0)
    ) {
      return falhar('Quantidade de cobrancas inconsistente')
    }

    if (
      dados.totalCount !== undefined &&
      (
        !Number.isSafeInteger(dados.totalCount) ||
        Number(dados.totalCount) < 0
      )
    ) {
      return falhar('Total de cobrancas invalido')
    }

    for (const item of dados.data) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item)
      ) {
        return falhar('Cobranca com formato invalido')
      }

      const cobranca = item as Record<string, unknown>

      if (
        typeof cobranca.id !== 'string' ||
        !cobranca.id.trim() ||
        cobranca.subscription !== subscriptionId ||
        cobranca.customer !== customerId ||
        cobranca.deleted === true
      ) {
        return falhar(
          'Cobranca invalida ou de outra assinatura'
        )
      }

      if (identificadores.has(cobranca.id)) {
        return falhar(
          'Cobranca duplicada entre paginas'
        )
      }

      identificadores.add(cobranca.id)

      cobrancas.push(
        cobranca as CobrancaListadaAsaas
      )
    }

    if (dados.hasMore === false) {
      if (
        dados.totalCount !== undefined &&
        cobrancas.length !== dados.totalCount
      ) {
        return falhar(
          'Total de cobrancas nao corresponde ao historico'
        )
      }

      if (cobrancas.length === 0) {
        return falhar(
          'Assinatura sem cobrancas para conciliacao'
        )
      }

      return {
        ok: true,
        cobrancas,
        paginasConsultadas,
      }
    }

    offset += LIMITE
  }

  return falhar(
    'Limite de paginas atingido; historico inconclusivo'
  )
}
