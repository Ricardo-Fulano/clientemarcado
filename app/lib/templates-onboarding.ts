import type { SupabaseClient } from '@supabase/supabase-js'

// Logica das rotas de TEMPLATES do onboarding, separada das rotas para ser testavel
// (mesmo padrao de app/lib/convite-aceite.ts). So roda no servidor: recebe um client com service_role.
//
// Regras de seguranca:
//  - o user_id vem SEMPRE do token validado na rota; nunca do corpo, da query nem de header;
//  - o navegador nunca consulta minipage_templates (a tabela nao tem nenhum acesso para anon/authenticated);
//  - a clonagem em si e feita pela funcao do banco aplicar_template_minipage (transacao unica, idempotente);
//    esta camada NAO altera plano, status, tema nem nenhum dado do perfil.
//
// Logs (Runtime Logs da Vercel, filtre por "[onboarding/templates]"). Nunca logamos token nem e-mail.

export type ResultadoHttp = { status: number; body: Record<string, unknown> }

export type TemplateDisponivel = {
  id: string
  nome: string
  descricao: string | null
  resumo: string | null
  preview_slug: string | null
  preview_url: string | null
  versao: number
  tema_sugerido: string | null
}

// Dominio das paginas publicas (o link curto). "Ver modelo" abre {SITE_PUBLICO}/{preview_slug}.
const SITE_PUBLICO = 'https://minipage.pro'
const TEMPLATE_ID_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MSG_GENERICA = 'Não foi possível aplicar o modelo agora. Tente novamente em instantes.'

export function templateIdValido(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= 64 && TEMPLATE_ID_REGEX.test(v)
}

// Mesma comparacao da funcao SQL: lower(btrim(plano_tipo)) = any(planos).
export function normalizarPlanoTemplate(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function logar(etapa: string, dados: Record<string, unknown> = {}) {
  console.log(`[onboarding/templates] ${etapa}`, JSON.stringify(dados))
}

function curto(userId: string): string {
  return String(userId || '').slice(0, 8)
}

// Em producao a resposta nunca carrega detalhe tecnico; fora dela devolve o erro real para diagnostico.
function comDetalhe(body: Record<string, unknown>, detalhe: unknown): Record<string, unknown> {
  return process.env.NODE_ENV !== 'production' && detalhe ? { ...body, detalhe } : body
}

// ----- codigos da funcao aplicar_template_minipage -> resposta HTTP -----
// O texto da excecao do banco COMECA pelo codigo (ex.: "MODULO_NAO_SUPORTADO: pagina_videos").
const ERROS_APLICACAO: Array<{ codigo: string; status: number; error: string }> = [
  { codigo: 'PARAMETRO_INVALIDO', status: 400, error: 'Dados inválidos. Tente novamente.' },
  { codigo: 'TEMPLATE_NAO_ENCONTRADO', status: 404, error: 'Este modelo não foi encontrado.' },
  { codigo: 'PERFIL_NAO_ENCONTRADO', status: 404, error: 'Não encontramos a sua MiniPage. Saia e entre novamente.' },
  { codigo: 'TEMPLATE_INDISPONIVEL', status: 409, error: 'Este modelo não está disponível no momento.' },
  { codigo: 'PLANO_INCOMPATIVEL', status: 403, error: 'Este modelo não está disponível para o seu plano.' },
  { codigo: 'STATUS_NAO_ATIVO', status: 403, error: 'Sua assinatura precisa estar ativa para usar este modelo.' },
  { codigo: 'CONTA_JA_TEM_CONTEUDO', status: 409, error: 'Sua MiniPage já possui conteúdo e não pode receber um modelo automaticamente.' },
  { codigo: 'CONTA_ANTERIOR_AO_MODELO', status: 403, error: 'Este modelo não está disponível para a sua conta.' },
  { codigo: 'MODELO_VAZIO', status: 409, error: 'Este modelo está sem conteúdo no momento. Escolha outro modelo ou comece do zero.' },
  { codigo: 'MODULO_NAO_SUPORTADO', status: 422, error: 'Este modelo possui um recurso ainda não suportado pela aplicação automática.' },
  { codigo: 'USUARIO_E_A_PROPRIA_FONTE', status: 409, error: 'Esta conta é a origem do modelo e não pode recebê-lo.' },
  { codigo: 'INCONSISTENCIA_CLONAGEM', status: 500, error: MSG_GENERICA },
]

export function mapearErroAplicacao(mensagem: string | null | undefined): ResultadoHttp {
  const msg = String(mensagem || '').trim()
  for (const e of ERROS_APLICACAO) {
    if (msg.startsWith(e.codigo)) {
      // INCONSISTENCIA_CLONAGEM e falha interna (a transacao foi desfeita): o cliente pode tentar de novo.
      const codigo = e.codigo === 'INCONSISTENCIA_CLONAGEM' ? 'APLICACAO_FALHOU' : e.codigo
      return { status: e.status, body: { codigo, error: e.error } }
    }
  }
  return { status: 500, body: { codigo: 'ERRO_INESPERADO', error: MSG_GENERICA } }
}

// ----- barreira de PRIMEIRA CRIACAO (espelho da funcao do banco) -----
// So conta criada A PARTIR do corte do modelo (minipage_templates.elegivel_desde) pode receber o modelo. A data da conta e a de
// auth.users.created_at (aqui, user.created_at do token). Compara em MICROSSEGUNDOS, como o Postgres (Date do JS so tem milissegundos).
// Sem data da conta OU sem corte: ninguem e elegivel (fail-closed, igual a funcao do banco).
function instanteEmMicros(v: unknown): { seg: number; micro: number } | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}(?::?\d{2})?)$/.exec(v.trim())
  if (!m) return null
  let tz = m[4]
  if (tz !== 'Z') tz = tz.length === 3 ? tz + ':00' : tz.length === 5 ? tz.slice(0, 3) + ':' + tz.slice(3) : tz
  const seg = Date.parse(`${m[1]}T${m[2]}${tz}`)
  if (Number.isNaN(seg)) return null
  return { seg, micro: Number(((m[3] || '') + '000000').slice(0, 6)) }
}

export function contaElegivelPeloCorte(contaCriadaEm: unknown, elegivelDesde: unknown): boolean {
  const c = instanteEmMicros(contaCriadaEm)
  const e = instanteEmMicros(elegivelDesde)
  if (!c || !e) return false
  return c.seg > e.seg || (c.seg === e.seg && c.micro >= e.micro)
}

// ----- POST: aplicar o modelo -----
export async function aplicarTemplate(admin: SupabaseClient, userId: string, templateId: unknown): Promise<ResultadoHttp> {
  if (!templateIdValido(templateId)) {
    return { status: 400, body: { codigo: 'TEMPLATE_INVALIDO', error: 'Modelo inválido.' } }
  }

  // A funcao roda numa transacao unica: ou aplica tudo, ou nada. Chamada repetida devolve "ja_aplicado".
  const { data, error } = await admin.rpc('aplicar_template_minipage', { p_user_id: userId, p_template_id: templateId })

  if (error) {
    const r = mapearErroAplicacao(error.message)
    logar('APLICAR_RECUSADO', { user: curto(userId), template: templateId, codigo: r.body.codigo })
    return { status: r.status, body: comDetalhe(r.body, error.message) }
  }

  const resp = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
  const status = resp?.status
  if (status === 'aplicado' || status === 'ja_aplicado') {
    logar('APLICAR_OK', { user: curto(userId), template: templateId, status, origem: resp?.origem })
    return { status: 200, body: { ok: true, status, origem: resp?.origem ?? null } }
  }

  logar('APLICAR_RESPOSTA_INESPERADA', { user: curto(userId), template: templateId })
  return { status: 500, body: { codigo: 'ERRO_INESPERADO', error: MSG_GENERICA } }
}

// ----- GET: modelos que ESTE usuario pode usar agora -----
export async function listarTemplatesDisponiveis(admin: SupabaseClient, userId: string, contaCriadaEm?: string | null): Promise<ResultadoHttp> {
  const falha = (etapa: string, detalhe: unknown): ResultadoHttp => {
    console.error(`[onboarding/templates] ${etapa}`, (detalhe as { message?: string } | null)?.message)
    return { status: 500, body: comDetalhe({ codigo: 'ERRO_INTERNO', error: 'Não foi possível carregar os modelos agora. Tente novamente.' }, (detalhe as { message?: string } | null)?.message) }
  }

  // Plano e status vem do banco (service_role), nunca do cliente.
  const { data: perfil, error: erroPerfil } = await admin
    .from('perfis')
    .select('plano_tipo, status_acesso, template_origem')
    .eq('user_id', userId)
    .maybeSingle()
  if (erroPerfil) return falha('PERFIL_LEITURA_FALHOU', erroPerfil)
  if (!perfil) return { status: 404, body: { codigo: 'PERFIL_NAO_ENCONTRADO', error: 'Não encontramos a sua MiniPage. Saia e entre novamente.' } }

  // Quem ja recebeu um modelo, ou nao esta com a assinatura ativa, nao ve a etapa de escolha.
  if (perfil.template_origem) return { status: 200, body: { templates: [], motivo: 'JA_APLICADO' } }
  if (perfil.status_acesso !== 'ativo') return { status: 200, body: { templates: [], motivo: 'STATUS_NAO_ATIVO' } }

  const { data: modelos, error: erroModelos } = await admin
    .from('minipage_templates')
    .select('id, nome, descricao, resumo, source_user_id, preview_slug, planos, versao, ordem, elegivel_desde')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('id', { ascending: true })
  if (erroModelos) return falha('TEMPLATES_LEITURA_FALHOU', erroModelos)

  const ativos = (modelos || []) as Array<Record<string, any>>
  const plano = normalizarPlanoTemplate(perfil.plano_tipo)
  const compativeis = ativos.filter(
    (m) => !!m.source_user_id && Array.isArray(m.planos) && m.planos.some((p: unknown) => normalizarPlanoTemplate(p) === plano)
  )
  if (compativeis.length === 0) {
    return { status: 200, body: { templates: [], motivo: ativos.length === 0 ? 'NENHUM_MODELO_ATIVO' : 'PLANO_INCOMPATIVEL' } }
  }

  // Barreira de primeira criacao: conta anterior ao corte do modelo (ou corte nulo) NAO recebe. Vem DEPOIS de plano e status,
  // na mesma ordem de precedencia da funcao do banco. Conta antiga continua com o onboarding de sempre (lista vazia).
  const elegiveis = compativeis.filter((m) => contaElegivelPeloCorte(contaCriadaEm, m.elegivel_desde))
  if (elegiveis.length === 0) {
    return { status: 200, body: { templates: [], motivo: 'CONTA_ANTERIOR_AO_MODELO' } }
  }

  // Tema sugerido para pre-selecionar na etapa Visual: o public_theme da conta-fonte (so leitura).
  const idsFonte = Array.from(new Set(elegiveis.map((m) => m.source_user_id as string)))
  const { data: temas, error: erroTemas } = await admin.from('perfis').select('user_id, public_theme').in('user_id', idsFonte)
  if (erroTemas) return falha('TEMAS_LEITURA_FALHOU', erroTemas)
  const temaPorFonte = new Map<string, string | null>()
  for (const t of (temas || []) as Array<{ user_id: string; public_theme: string | null }>) temaPorFonte.set(t.user_id, t.public_theme || null)

  // So o que a interface precisa. NAO sai daqui: source_user_id, planos, ativo, ordem.
  const templates: TemplateDisponivel[] = elegiveis.map((m) => ({
    id: m.id,
    nome: m.nome,
    descricao: m.descricao ?? null,
    resumo: m.resumo ?? null,
    preview_slug: m.preview_slug ?? null,
    preview_url: m.preview_slug ? `${SITE_PUBLICO}/${encodeURIComponent(m.preview_slug)}` : null,
    versao: m.versao,
    tema_sugerido: temaPorFonte.get(m.source_user_id) ?? null,
  }))

  logar('LISTAR_OK', { user: curto(userId), quantidade: templates.length })
  return { status: 200, body: { templates } }
}
