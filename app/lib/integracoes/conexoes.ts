import { randomUUID } from 'node:crypto'
import { cifrarSegredo, ErroCripto, gerarPublicId, gerarSegredoDeWebhook } from './cripto'
import { CATALOGO_PROVEDORES, type ProvedorUI } from './catalogo'
import type { AcaoConexao, ConexaoVisao, EstadoEfetivo, RespostaComToken, RespostaConexao, RespostaErro, RespostaLista, StatusConexao } from './conexoesTipos'
import { registrarEChecar } from './limitador'
import { obterAdaptador } from './provedores'
import { ErroDeValidacao, type ProviderAdapter } from './tipos'
import { urlDoWebhook } from './urlWebhook'
import { ehUuid, lerCorpoLimitado, limparTexto } from './utilitarios'

// Gestao das conexoes externas do dono (listar, criar, pausar, reativar, ativar, renomear, girar token, remover).
// Toda a logica fica aqui, com dependencias injetaveis (DepsConexoes); as rotas do Next so a ligam ao Supabase.
// Identidade: SEMPRE do token de login (Authorization: Bearer). Nenhum id de usuario vem do corpo da requisicao.

export interface LinhaConexao {
  id: string; user_id: string; public_id: string; provider: string; label: string | null; status: StatusConexao
  config: Record<string, unknown>; last_event_at: string | null; dropped_count: number; last_dropped_at: string | null; created_at: string; updated_at: string
}
export interface MetaSegredo { conexao_id: string; rotated_at: string; prev_expires_at: string | null }
export interface LinhaSegredo { conexao_id: string; ciphertext: string; key_version: number; prev_ciphertext: string | null; prev_key_version: number | null; prev_expires_at: string | null; rotated_at: string }
export interface NovaConexao { id: string; public_id: string; user_id: string; provider: string; label: string | null; status: 'test'; config: Record<string, unknown> }
export interface SegredoNovo { ciphertext: string; key_version: number }
export interface SegredoAnterior { ciphertext: string; key_version: number; expires_at: string }

export class ErroDados extends Error {
  constructor(public readonly codigo: string, mensagem: string) { super(mensagem); this.name = 'ErroDados' }
}
export interface DepsConexoes {
  usuarioDoToken(token: string): Promise<{ id: string } | null>
  elegivel(userId: string): Promise<boolean>
  listar(userId: string): Promise<LinhaConexao[]> // so as nao revogadas, da mais antiga para a mais nova
  buscar(userId: string, id: string): Promise<LinhaConexao | null> // so se for do usuario (revogadas incluidas)
  contarNaoRevogadas(userId: string): Promise<number>
  inserirConexao(nova: NovaConexao): Promise<'ok' | 'public_id_duplicado'>
  apagarConexao(userId: string, id: string): Promise<void>
  atualizarConexao(userId: string, id: string, patch: { status?: StatusConexao; label?: string | null }, statusEsperado?: StatusConexao): Promise<boolean>
  metasSegredos(ids: string[]): Promise<MetaSegredo[]>
  lerSegredo(conexaoId: string): Promise<LinhaSegredo | null>
  inserirSegredo(conexaoId: string, novo: SegredoNovo): Promise<boolean>
  trocarSegredo(conexaoId: string, ciphertextAtual: string, novo: SegredoNovo, anterior: SegredoAnterior): Promise<boolean>
  limparAnterior(conexaoId: string): Promise<void>
  apagarSegredo(conexaoId: string): Promise<void>
}
export interface OpcoesConexoes {
  agora?: () => number
  obterAdaptador?: (id: string) => ProviderAdapter | null
  catalogo?: readonly ProvedorUI[]
}
export interface RotaConexoes { id?: string; sub?: 'rotacionar' }
export interface ResultadoRota { status: number; corpo: unknown; log: Record<string, unknown> }

export const JANELA_ROTACAO_MS = 24 * 60 * 60 * 1000 // a Kiwify recomenda esperar pelo menos um dia antes de recusar o token antigo
export const ROTACAO_INTERVALO_MIN_MS = 10_000 // evita giros em sequencia (duplo clique, duas abas): so existe 1 vaga de 'token anterior', e um token ja mostrado ao usuario nao pode deixar de valer em silencio
export const LIMITE_TECNICO_CONEXOES = 50 // trava anti-abuso (nao e limite de plano: nao ha diferenca entre planos)
export const LIMITE_REQUISICOES_POR_MINUTO = 60
const TOKEN_MIN = 16 // o adaptador ignora segredos menores que isso (nunca valida com chave curta)
const TOKEN_MAX = 256

// ---------------- validacoes (puras) ----------------
export function validarLabel(v: unknown): { ok: true; valor: string | null } | { ok: false } {
  if (v === undefined || v === null) return { ok: true, valor: null }
  if (typeof v !== 'string') return { ok: false }
  const limpo = limparTexto(v.replace(/\s+/g, ' '), 1000)
  if (limpo === undefined) return { ok: true, valor: null }
  return limpo.length > 60 ? { ok: false } : { ok: true, valor: limpo }
}
export function validarTokenInformado(v: unknown): { ok: true; valor: string } | { ok: false } {
  if (typeof v !== 'string') return { ok: false }
  const t = v.trim()
  if (t.length < TOKEN_MIN || t.length > TOKEN_MAX || !/^[\x21-\x7E]+$/.test(t)) return { ok: false } // ASCII visivel, sem espacos
  return { ok: true, valor: t }
}
// Maquina de estados. null = transicao invalida.
export function proximoStatus(acao: 'pausar' | 'reativar' | 'ativar', atual: StatusConexao): StatusConexao | null {
  if (atual === 'revoked') return null
  if (acao === 'pausar') return atual === 'test' || atual === 'active' ? 'paused' : atual === 'paused' ? 'paused' : null
  if (acao === 'reativar') return atual === 'paused' ? 'active' : atual === 'active' ? 'active' : null
  if (acao === 'ativar') return atual === 'test' || atual === 'paused' ? 'active' : atual === 'active' ? 'active' : null
  return null
}
export function estadoEfetivo(status: Exclude<StatusConexao, 'revoked'>, elegivel: boolean, usaToken: boolean, temToken: boolean): EstadoEfetivo {
  if (!elegivel) return 'suspensa_plano'
  if (usaToken && !temToken) return 'sem_token'
  if (status === 'paused') return 'pausada'
  return status === 'test' ? 'teste' : 'ativa'
}

const erro = (status: number, codigo: string, mensagem: string): { status: number; corpo: RespostaErro } => ({ status, corpo: { error: mensagem, codigo } })
const MSG = {
  nao_autenticado: 'Sessão expirada. Entre novamente.',
  plano: 'Seu plano atual não inclui integrações de vendas externas.',
  nao_encontrada: 'Conexão não encontrada.',
  invalido: 'Dados inválidos.',
}

function montarVisao(l: LinhaConexao, meta: MetaSegredo | undefined, elegivel: boolean, adaptador: ProviderAdapter | null, agoraMs: number): ConexaoVisao {
  const usaToken = adaptador ? adaptador.needsSecret : true
  const anterior = meta?.prev_expires_at && Date.parse(meta.prev_expires_at) > agoraMs ? meta.prev_expires_at : null
  const status = l.status === 'revoked' ? 'paused' : l.status
  return {
    id: l.id, provider: l.provider, label: l.label, status, efetivo: estadoEfetivo(status, elegivel, usaToken, Boolean(meta)),
    url: urlDoWebhook(l.provider, l.public_id), usa_token: usaToken, config: l.config ?? {},
    last_event_at: l.last_event_at, dropped_count: l.dropped_count, last_dropped_at: l.last_dropped_at, created_at: l.created_at,
    token: { existe: Boolean(meta), rotated_at: meta?.rotated_at ?? null, anterior_ate: anterior },
  }
}

// ---------------- entrada unica ----------------
export async function tratarConexoes(req: Request, rota: RotaConexoes, deps: DepsConexoes, opcoes: OpcoesConexoes = {}): Promise<ResultadoRota> {
  const agora = opcoes.agora ?? Date.now
  const inicio = agora()
  const adaptadorDe = opcoes.obterAdaptador ?? obterAdaptador
  const catalogo = opcoes.catalogo ?? CATALOGO_PROVEDORES
  const log: Record<string, unknown> = { evt: 'integracoes_conexoes', metodo: req.method, acao: rota.sub ?? 'base' }
  const fim = (r: { status: number; corpo: unknown }): ResultadoRota => { log.status = r.status; log.ms = agora() - inicio; return { status: r.status, corpo: r.corpo, log } }
  try {
    // 1) identidade (somente pelo token de login)
    const auth = req.headers.get('authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    if (!token) return fim(erro(401, 'nao_autenticado', MSG.nao_autenticado))
    const usuario = await deps.usuarioDoToken(token)
    if (!usuario) return fim(erro(401, 'nao_autenticado', MSG.nao_autenticado))
    if (!registrarEChecar(`conx:${usuario.id}`, agora(), LIMITE_REQUISICOES_POR_MINUTO)) return fim(erro(429, 'muitas_requisicoes', 'Muitas tentativas em pouco tempo. Aguarde um minuto.'))

    // 2) id do caminho (se houver) precisa ser UUID; qualquer outro valor = 404
    if (rota.id !== undefined && !ehUuid(rota.id)) return fim(erro(404, 'nao_encontrada', MSG.nao_encontrada))
    const metodo = req.method.toUpperCase()

    const visaoDe = async (l: LinhaConexao, elegivel: boolean): Promise<ConexaoVisao> => {
      const metas = await deps.metasSegredos([l.id])
      return montarVisao(l, metas.find((m) => m.conexao_id === l.id), elegivel, adaptadorDe(l.provider), agora())
    }
    const corpoJson = async (): Promise<{ ok: true; dados: Record<string, unknown> } | { ok: false; r: { status: number; corpo: unknown } }> => {
      const tipo = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
      const cru = await lerCorpoLimitado(req, 8192)
      if (cru === null) return { ok: false, r: erro(413, 'corpo_grande', 'Requisição grande demais.') }
      if (cru.byteLength === 0) return { ok: true, dados: {} }
      if (tipo !== 'application/json') return { ok: false, r: erro(415, 'tipo_invalido', 'Formato de requisição inválido.') }
      try {
        const d: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(cru))
        if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, r: erro(400, 'invalido', MSG.invalido) }
        return { ok: true, dados: d as Record<string, unknown> }
      } catch { return { ok: false, r: erro(400, 'invalido', MSG.invalido) } }
    }

    // ============ GET /conexoes ============
    if (rota.id === undefined && metodo === 'GET') {
      const [elegivel, linhas] = await Promise.all([deps.elegivel(usuario.id), deps.listar(usuario.id)])
      const metas = linhas.length ? await deps.metasSegredos(linhas.map((l) => l.id)) : []
      const corpo: RespostaLista = {
        elegivel,
        conexoes: linhas.map((l) => montarVisao(l, metas.find((m) => m.conexao_id === l.id), elegivel, adaptadorDe(l.provider), agora())),
        provedores: catalogo.filter((p) => adaptadorDe(p.id) !== null).map((p) => p.id),
      }
      return fim({ status: 200, corpo })
    }

    // ============ POST /conexoes (criar) ============
    if (rota.id === undefined && metodo === 'POST') {
      const b = await corpoJson(); if (!b.ok) return fim(b.r)
      const provider = typeof b.dados.provider === 'string' ? b.dados.provider : ''
      const adaptador = /^[a-z0-9_]{2,40}$/.test(provider) ? adaptadorDe(provider) : null
      const ui = catalogo.find((p) => p.id === provider)
      if (!adaptador || !ui) return fim(erro(400, 'provedor_invalido', 'Plataforma não disponível.'))
      log.provider = provider
      const label = validarLabel(b.dados.label); if (!label.ok) return fim(erro(400, 'apelido_invalido', 'O apelido pode ter no máximo 60 caracteres.'))
      let config: Record<string, unknown>
      try { config = adaptador.validateConfig(b.dados.config ?? {}) } catch (e) { return fim(erro(400, e instanceof ErroDeValidacao ? e.codigo : 'config_invalida', 'Configuração inválida.')) }
      let segredo: string | null = null
      if (adaptador.needsSecret) {
        if (b.dados.token !== undefined && b.dados.token !== null && b.dados.token !== '') {
          const t = validarTokenInformado(b.dados.token); if (!t.ok) return fim(erro(400, 'token_invalido', `O token deve ter de ${TOKEN_MIN} a ${TOKEN_MAX} caracteres, sem espaços.`))
          segredo = t.valor
        } else segredo = gerarSegredoDeWebhook()
      } else if (b.dados.token !== undefined && b.dados.token !== null && b.dados.token !== '') return fim(erro(400, 'token_invalido', 'Esta plataforma não usa token.'))
      if (!(await deps.elegivel(usuario.id))) return fim(erro(403, 'plano_sem_acesso', MSG.plano))
      if ((await deps.contarNaoRevogadas(usuario.id)) >= LIMITE_TECNICO_CONEXOES) return fim(erro(409, 'limite_tecnico', `Limite de ${LIMITE_TECNICO_CONEXOES} conexões atingido. Remova alguma para criar outra.`))
      const id = randomUUID()
      let cifrado: SegredoNovo | null = null
      if (segredo !== null) {
        try { const c = cifrarSegredo(segredo, { conexaoId: id, provider }); cifrado = { ciphertext: c.ciphertext, key_version: c.keyVersion } } // antes de gravar qualquer coisa
        catch (e) { log.erro_cripto = e instanceof ErroCripto ? e.codigo : 'desconhecido'; return fim(erro(500, 'configuracao_seguranca', 'Configuração de segurança do servidor incompleta. Fale com o suporte.')) }
      }
      let publicId = ''
      let gravou = false
      for (let i = 0; i < 4 && !gravou; i++) {
        publicId = gerarPublicId()
        gravou = (await deps.inserirConexao({ id, public_id: publicId, user_id: usuario.id, provider, label: label.valor, status: 'test', config })) === 'ok'
      }
      if (!gravou) return fim(erro(500, 'falha_gravar', 'Não foi possível criar a conexão agora. Tente novamente.'))
      if (cifrado !== null && !(await deps.inserirSegredo(id, cifrado))) {
        await deps.apagarConexao(usuario.id, id).catch(() => undefined) // desfaz: nunca deixa conexao sem token
        return fim(erro(500, 'falha_gravar', 'Não foi possível criar a conexão agora. Tente novamente.'))
      }
      const linha = await deps.buscar(usuario.id, id)
      if (!linha) return fim(erro(500, 'falha_gravar', 'Não foi possível criar a conexão agora. Tente novamente.'))
      const corpo: RespostaComToken = { conexao: await visaoDe(linha, true), token: segredo }
      return fim({ status: 201, corpo })
    }

    // ============ rotas com {id} ============
    if (rota.id !== undefined) {
      const linha = await deps.buscar(usuario.id, rota.id) // so devolve se for do usuario autenticado
      if (!linha) return fim(erro(404, 'nao_encontrada', MSG.nao_encontrada))
      log.provider = linha.provider
      const adaptador = adaptadorDe(linha.provider)

      // ---- DELETE: revogar ----
      if (!rota.sub && metodo === 'DELETE') {
        if (linha.status !== 'revoked') {
          if (!(await deps.atualizarConexao(usuario.id, linha.id, { status: 'revoked' }))) return fim(erro(500, 'falha_gravar', 'Não foi possível remover agora. Tente novamente.'))
        }
        let segredoRemovido = true
        try { await deps.apagarSegredo(linha.id) } catch { segredoRemovido = false } // o webhook ja nega (404) antes de ler o segredo
        return fim({ status: 200, corpo: { ok: true, segredo_removido: segredoRemovido } })
      }

      if (linha.status === 'revoked') return fim(erro(409, 'conexao_removida', 'Esta conexão já foi removida.'))

      // ---- POST /{id}/rotacionar ----
      if (rota.sub === 'rotacionar' && metodo === 'POST') {
        if (!adaptador || !adaptador.needsSecret) return fim(erro(400, 'provedor_sem_token', 'Esta plataforma não usa token.'))
        const b = await corpoJson(); if (!b.ok) return fim(b.r)
        let novoSegredo: string
        if (b.dados.token !== undefined && b.dados.token !== null && b.dados.token !== '') {
          const t = validarTokenInformado(b.dados.token); if (!t.ok) return fim(erro(400, 'token_invalido', `O token deve ter de ${TOKEN_MIN} a ${TOKEN_MAX} caracteres, sem espaços.`))
          novoSegredo = t.valor
        } else novoSegredo = gerarSegredoDeWebhook()
        const elegivel = await deps.elegivel(usuario.id)
        if (!elegivel) return fim(erro(403, 'plano_sem_acesso', MSG.plano))
        let cifrado: SegredoNovo
        try { const c = cifrarSegredo(novoSegredo, { conexaoId: linha.id, provider: linha.provider }); cifrado = { ciphertext: c.ciphertext, key_version: c.keyVersion } }
        catch (e) { log.erro_cripto = e instanceof ErroCripto ? e.codigo : 'desconhecido'; return fim(erro(500, 'configuracao_seguranca', 'Configuração de segurança do servidor incompleta. Fale com o suporte.')) }
        const atual = await deps.lerSegredo(linha.id)
        if (atual && agora() - Date.parse(atual.rotated_at) < ROTACAO_INTERVALO_MIN_MS) return fim(erro(409, 'rotacao_recente', 'O token foi gerado há poucos segundos. Aguarde um instante antes de gerar outro.'))
        let ok: boolean
        if (!atual) ok = await deps.inserirSegredo(linha.id, cifrado) // conexao sem token (falha antiga): so cria
        else ok = await deps.trocarSegredo(linha.id, atual.ciphertext, cifrado, { ciphertext: atual.ciphertext, key_version: atual.key_version, expires_at: new Date(agora() + JANELA_ROTACAO_MS).toISOString() })
        if (!ok) return fim(erro(409, 'conflito', 'O token foi alterado em outra aba. Atualize a página e tente de novo.'))
        const corpo: RespostaComToken = { conexao: await visaoDe((await deps.buscar(usuario.id, linha.id)) ?? linha, elegivel), token: novoSegredo }
        return fim({ status: 200, corpo })
      }

      // ---- PATCH: pausar / reativar / ativar / renomear / encerrar_token_anterior ----
      if (!rota.sub && metodo === 'PATCH') {
        const b = await corpoJson(); if (!b.ok) return fim(b.r)
        const acao = b.dados.acao as AcaoConexao
        log.acao = typeof acao === 'string' ? acao : 'invalida'
        const elegivel = await deps.elegivel(usuario.id)
        if (acao === 'pausar' || acao === 'reativar' || acao === 'ativar') {
          if (acao !== 'pausar' && !elegivel) return fim(erro(403, 'plano_sem_acesso', MSG.plano))
          const destino = proximoStatus(acao, linha.status)
          if (destino === null) return fim(erro(409, 'transicao_invalida', 'Esta ação não está disponível para o estado atual da conexão.'))
          if (destino !== linha.status) {
            if (!(await deps.atualizarConexao(usuario.id, linha.id, { status: destino }, linha.status))) return fim(erro(409, 'conflito', 'A conexão mudou em outra aba. Atualize a página.'))
          }
        } else if (acao === 'renomear') {
          const label = validarLabel(b.dados.label); if (!label.ok) return fim(erro(400, 'apelido_invalido', 'O apelido pode ter no máximo 60 caracteres.'))
          if (!(await deps.atualizarConexao(usuario.id, linha.id, { label: label.valor }))) return fim(erro(500, 'falha_gravar', 'Não foi possível salvar agora. Tente novamente.'))
        } else if (acao === 'encerrar_token_anterior') {
          await deps.limparAnterior(linha.id)
        } else return fim(erro(400, 'acao_invalida', 'Ação inválida.'))
        const atualizada = await deps.buscar(usuario.id, linha.id)
        if (!atualizada) return fim(erro(404, 'nao_encontrada', MSG.nao_encontrada))
        const corpo: RespostaConexao = { conexao: await visaoDe(atualizada, elegivel) }
        return fim({ status: 200, corpo })
      }
    }
    return fim(erro(405, 'metodo_nao_permitido', 'Método não permitido.'))
  } catch (e) {
    log.excecao = e instanceof Error ? e.name : 'desconhecida'
    if (e instanceof ErroDados) log.erro_banco = e.codigo
    return fim(erro(500, 'erro_interno', 'Erro interno. Tente novamente em instantes.'))
  }
}
