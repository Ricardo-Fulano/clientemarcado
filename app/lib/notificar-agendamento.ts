import type { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { ehPlanoEquipe } from './planos'

// Notificacao de "novo agendamento" disparada pela pagina publica de agendamento. So roda no servidor (client service_role).
//
// SEGURANCA (hotfix N2): a rota e PUBLICA, entao nada do corpo e confiavel. So notifica quando existe um AGENDAMENTO REAL e
// RECENTE correspondente, da MESMA conta, e dentro dos limites de frequencia. Servico e profissional so entram se forem da conta.
// Resposta uniforme (a pagina ignora a resposta): nao revela se conta ou agendamento existem.

export const LIMITE_IP = { max: 15, janelaSeg: 600 }          // por IP, em 10 min
export const LIMITE_CONTA = { max: 60, janelaSeg: 600 }       // por conta, em 10 min
export const LIMITE_DEDUPE = { max: 1, janelaSeg: 86400 }     // 1 notificacao por agendamento
export const JANELA_AGENDAMENTO_MIN = 10                       // o agendamento precisa ter sido criado ha no maximo 10 min
const NOME_MAX = 120
const NOME_NA_MENSAGEM_MAX = 60
const TEXTO_MAX = 80

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATA_HORA_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
const CONTROLE_REGEX = /[\u0000-\u001F\u007F-\u009F]/

export type EntradaNotificacao = {
  userId: string
  servicoId: string | null
  profissionalId: string | null
  dataHora: string      // normalizada: AAAA-MM-DDTHH:MM:SS (texto local, sem fuso, igual ao que a pagina grava)
  clienteNome: string   // CRU: e comparado com o que a pagina inseriu
}
export type ResultadoValidacao = { ok: true; dados: EntradaNotificacao } | { ok: false; motivo: string }

// undefined/null/'' = ausente (null). String UUID valida = ela mesma. Qualquer outra coisa = invalido (undefined).
function lerUuidOpcional(v: unknown): string | null | undefined {
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'string' && UUID_REGEX.test(v)) return v
  return undefined
}

export function validarEntrada(corpo: unknown, agora: Date = new Date()): ResultadoValidacao {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return { ok: false, motivo: 'CORPO_INVALIDO' }
  const c = corpo as Record<string, unknown>
  if (typeof c.user_id !== 'string' || !UUID_REGEX.test(c.user_id)) return { ok: false, motivo: 'USER_ID_INVALIDO' }
  const servicoId = lerUuidOpcional(c.servico_id)
  if (servicoId === undefined) return { ok: false, motivo: 'SERVICO_ID_INVALIDO' }
  const profissionalId = lerUuidOpcional(c.profissional_id)
  if (profissionalId === undefined) return { ok: false, motivo: 'PROFISSIONAL_ID_INVALIDO' }

  if (typeof c.data_hora !== 'string') return { ok: false, motivo: 'DATA_HORA_INVALIDA' }
  const m = DATA_HORA_REGEX.exec(c.data_hora)
  if (!m) return { ok: false, motivo: 'DATA_HORA_INVALIDA' }
  const [ano, mes, dia, hora, min, seg] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), m[6] === undefined ? 0 : Number(m[6])]
  const ms = Date.UTC(ano, mes - 1, dia, hora, min, seg)
  const d = new Date(ms)
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia || hora > 23 || min > 59 || seg > 59) return { ok: false, motivo: 'DATA_HORA_INVALIDA' }
  if (ms < agora.getTime() - 86400000 || ms > agora.getTime() + 400 * 86400000) return { ok: false, motivo: 'DATA_HORA_FORA_DA_FAIXA' }
  const dataHora = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${String(seg).padStart(2, '0')}`

  if (typeof c.cliente_nome !== 'string') return { ok: false, motivo: 'NOME_INVALIDO' }
  if (c.cliente_nome.length < 1 || c.cliente_nome.length > NOME_MAX || c.cliente_nome.trim().length < 1 || CONTROLE_REGEX.test(c.cliente_nome)) return { ok: false, motivo: 'NOME_INVALIDO' }

  return { ok: true, dados: { userId: c.user_id, servicoId, profissionalId, dataHora, clienteNome: c.cliente_nome } }
}

// So para EXIBICAO (a comparacao com o agendamento usa o nome cru).
export function sanearTexto(s: string, max: number): string {
  const limpo = s.replace(CONTROLE_REGEX, ' ').replace(/\s+/g, ' ').trim()
  return limpo.length > max ? limpo.slice(0, max - 1) + '…' : limpo
}

// '2026-10-30T14:30:00' -> { data: '30/10', hora: '14:30' } (mesmo formato que a rota antiga produzia)
export function formatarDataHora(dataHora: string): { data: string; hora: string } {
  return { data: `${dataHora.slice(8, 10)}/${dataHora.slice(5, 7)}`, hora: dataHora.slice(11, 16) }
}

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 32)
const textoNaive = (d: Date) => d.toISOString().slice(0, 19)

// true = pode seguir. Se a funcao do banco falhar seguimos (fail-open, como o cadastro) mas deixamos um erro ALTO no log.
async function dentroDoLimite(supabase: SupabaseClient, chave: string, lim: { max: number; janelaSeg: number }): Promise<boolean> {
  const { data, error } = await supabase.rpc('checar_rate_limit', { p_chave: chave, p_max: lim.max, p_janela_segundos: lim.janelaSeg })
  if (error) { console.error('[notificar-agendamento] NOTIF_RATE_LIMIT_INDISPONIVEL', JSON.stringify({ erro: error.message })); return true }
  return data === true
}

export type ResultadoNotificacao = { limitado: boolean; motivo: string; admin: boolean; profissional: boolean }

export async function processarNotificacao(supabase: SupabaseClient, e: EntradaNotificacao, ctx: { ip: string | null; agora?: Date }): Promise<ResultadoNotificacao> {
  const agora = ctx.agora ?? new Date()
  const fim = (motivo: string, limitado = false): ResultadoNotificacao => ({ limitado, motivo, admin: false, profissional: false })

  // 1) limites de frequencia, ANTES de qualquer leitura
  if (!(await dentroDoLimite(supabase, 'notif-ag-ip:' + (ctx.ip ? sha(ctx.ip) : 'desconhecido'), LIMITE_IP))) return fim('LIMITE_IP', true)
  if (!(await dentroDoLimite(supabase, 'notif-ag-conta:' + e.userId, LIMITE_CONTA))) return fim('LIMITE_CONTA', true)

  // 2) conta e PLANO EFETIVO (a visao devolve free para conta sem pagamento confirmado, bloqueada ou cancelada)
  const { data: perfil, error: erroPerfil } = await supabase.from('perfis_publicos').select('id, user_id, plano_tipo').eq('user_id', e.userId).maybeSingle()
  if (erroPerfil || !perfil) return fim('CONTA_NAO_ENCONTRADA')

  // 3) agendamento REAL, da mesma conta, com os mesmos dados e criado ha poucos minutos
  const corte = textoNaive(new Date(agora.getTime() - JANELA_AGENDAMENTO_MIN * 60000))
  const base = supabase.from('agendamentos').select('id, servico_id, profissional_id, created_at')
    .eq('user_id', e.userId).eq('data_hora', e.dataHora).eq('cliente_nome', e.clienteNome)
  const comServico = e.servicoId ? base.eq('servico_id', e.servicoId) : base.is('servico_id', null)
  const comProfissional = e.profissionalId ? comServico.eq('profissional_id', e.profissionalId) : comServico.is('profissional_id', null)
  const { data: ags, error: erroAg } = await comProfissional.gte('created_at', corte).order('created_at', { ascending: false }).limit(1)
  if (erroAg) { console.error('[notificar-agendamento] NOTIF_CONSULTA_FALHOU', JSON.stringify({ erro: erroAg.message })); return fim('ERRO_CONSULTA') }
  const agendamento = ags && ags[0]
  if (!agendamento) { console.warn('[notificar-agendamento] NOTIF_AGENDAMENTO_NAO_ENCONTRADO', JSON.stringify({ conta: e.userId })); return fim('AGENDAMENTO_NAO_ENCONTRADO') }

  // 4) uma notificacao por agendamento
  if (!(await dentroDoLimite(supabase, 'notif-ag-ag:' + agendamento.id, LIMITE_DEDUPE))) return fim('DUPLICADA')

  // 5) servico e profissional SO entram se forem da conta
  let servicoNome = ''
  if (agendamento.servico_id) {
    const { data: servico } = await supabase.from('servicos').select('nome').eq('id', agendamento.servico_id).eq('user_id', e.userId).maybeSingle()
    servicoNome = servico?.nome ? sanearTexto(String(servico.nome), TEXTO_MAX) : ''
  }
  let profissional: { id: string; nome: string } | null = null
  if (agendamento.profissional_id) {
    const { data: prof } = await supabase.from('profissionais').select('id, nome').eq('id', agendamento.profissional_id).eq('user_id', e.userId).maybeSingle()
    if (prof) profissional = { id: String(prof.id), nome: sanearTexto(String(prof.nome ?? ''), TEXTO_MAX) }
  }

  const { data: dataFmt, hora: horaFmt } = formatarDataHora(e.dataHora)
  const nome = sanearTexto(e.clienteNome, NOME_NA_MENSAGEM_MAX)
  const resultado: ResultadoNotificacao = { limitado: false, motivo: 'NOTIFICADO', admin: false, profissional: false }

  // 6) administradora (qualquer plano, como antes)
  const { error: erroAdmin } = await supabase.from('notificacoes').insert({
    perfil_id: perfil.id,
    destinatario_user_id: perfil.user_id,
    tipo: 'novo_agendamento',
    titulo: 'Novo agendamento',
    mensagem: `${nome} agendou ${servicoNome || 'um atendimento'}${profissional?.nome ? ` com ${profissional.nome}` : ''} para ${dataFmt} às ${horaFmt}.`,
    link: '/painel/agendamentos',
  })
  if (erroAdmin) console.error('[notificar-agendamento] NOTIF_INSERT_FALHOU', JSON.stringify({ destino: 'admin', erro: erroAdmin.message })); else resultado.admin = true

  // 7) profissional: so Plano Equipe EFETIVO, profissional DA CONTA e vinculo ativo do MESMO perfil
  if (profissional && ehPlanoEquipe(perfil.plano_tipo)) {
    const { data: vinculo } = await supabase.from('membros_equipe').select('profissional_id, ativo, role')
      .eq('profissional_id', profissional.id).eq('perfil_id', perfil.id).eq('ativo', true).eq('role', 'profissional').maybeSingle()
    if (vinculo) {
      const { error: erroProf } = await supabase.from('notificacoes').insert({
        perfil_id: perfil.id,
        destinatario_profissional_id: profissional.id,
        tipo: 'novo_agendamento',
        titulo: 'Novo agendamento na sua agenda',
        mensagem: `${nome} agendou ${servicoNome || 'um atendimento'} com você para ${dataFmt} às ${horaFmt}.`,
        link: '/painel/minha-agenda',
      })
      if (erroProf) console.error('[notificar-agendamento] NOTIF_INSERT_FALHOU', JSON.stringify({ destino: 'profissional', erro: erroProf.message })); else resultado.profissional = true
    }
  }
  return resultado
}
