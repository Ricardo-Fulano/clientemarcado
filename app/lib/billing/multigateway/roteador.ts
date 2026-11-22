import { CONJUNTO_EBANX, moedaReferencia, MOEDAS_LOCAIS_EBANX } from './cobertura'
import { metodosCandidatos } from './metodos'
import { validarPaisGlobal, validarPlanoGlobal, type DecisaoRoteamento, type EntidadeVendedoraGlobal, type HabilitacaoProvedorGlobal, type MetodoGlobal, type PlanoGlobal, type ProvedorGlobal } from './esquema'

export type EntradaRoteamento = {
  plano: unknown
  paisComprador: unknown
  entidade: EntidadeVendedoraGlobal | null
  habilitacoes: readonly HabilitacaoProvedorGlobal[]
}

/** Checkout somente roteia. NAO precifica, NAO cria assinatura e NAO ativa acesso.
 * 'habilitado' quer dizer comercialmente roteavel em memoria, NÃO gateway conectado.
 * O adaptador real permanece propositalmente inacessível ate homologação.
 */
export function decidirCheckoutGlobal(entrada: EntradaRoteamento): DecisaoRoteamento {
  const plano = validarPlanoGlobal(entrada.plano)
  const pais = validarPaisGlobal(entrada.paisComprador)
  if (plano === 'free') return { situacao:'gratuito', plano, pais, mensagem:'Free nao requer checkout nem autorizacao de cobranca.' }
  const preferido: ProvedorGlobal = CONJUNTO_EBANX.has(pais) ? 'ebanx' : 'stripe'
  const moeda = moedaReferencia(pais)
  const entidades = entrada.entidade
  const ordem: readonly ProvedorGlobal[] = preferido==='ebanx' ? ['ebanx','stripe'] : ['stripe','ebanx']
  const motivos: string[] = []
  if (!entidades) motivos.push('EMPRESA_VENDEDORA_NAO_CONFIGURADA')
  for (const provedor of ordem) {
    if (provedor==='ebanx' && !CONJUNTO_EBANX.has(pais)) continue
    // Stripe funciona para compradores de muitos paises, mas so se a EMPRESA tiver conta aprovada.
    if (!entidades?.provedoresAprovados.includes(provedor)) { motivos.push(`${provedor.toUpperCase()}_NAO_APROVADO_PARA_ENTIDADE`); continue }
    const liberacoes = entrada.habilitacoes.filter(h=> h.entidadeId === entidades.id && h.provedor===provedor && h.aprovadoComercialmente && h.homologacaoRecorrenciaAprovada && h.paisesCompradores.includes(pais) && h.moedasAutorizadas.includes(moeda))
    if (liberacoes.length === 0) { motivos.push(`${provedor.toUpperCase()}_MERCADO_RECURRENCIA_OU_MOEDA_NAO_HABILITADOS`); continue }
    const candidatos = metodosCandidatos(provedor,pais)
    // PayPal por ora somente em integracao futura separada; nunca aparecera sem novo adaptador.
    const permitidos = new Set<MetodoGlobal>(liberacoes.flatMap(l=>l.metodosAutorizados))
    const metodos = candidatos.filter(c=>permitidos.has(c.metodo))
    if (metodos.length===0) { motivos.push(`${provedor.toUpperCase()}_SEM_METODO_RECORRENTE`); continue }
    if (provedor==='ebanx') {
      const moedaLocal = MOEDAS_LOCAIS_EBANX[pais]
      // Sem aprovacao explicita de alternativa de moeda/FX, evitar cobrarem em moeda diferente.
      if (moedaLocal !== moeda) { motivos.push(`EBANX_MOEDA_LOCAL_${moedaLocal}_DIFERE_DO_PRECO_${moeda}`); continue }
    }
    return { situacao:'habilitado', plano, pais, entidadeId:entidades.id, provedor, moeda, metodos, aviso:'Cobrar somente via adaptador homologado, com idempotencia e webhook verificado.' }
  }
  return { situacao:'nao_habilitado', plano, pais, provedorPreferencial:preferido, moedaReferencia:moeda, metodosCandidatos:metodosCandidatos(preferido,pais), motivos:[...new Set(motivos)] }
}

/** Simulacao exclusivamente visual, SEM habilitar pagamentos. */
export function simularMercadoGlobal(plano: PlanoGlobal,paisComprador: string): DecisaoRoteamento {
  return decidirCheckoutGlobal({ plano,paisComprador,entidade:null,habilitacoes:[] })
}
