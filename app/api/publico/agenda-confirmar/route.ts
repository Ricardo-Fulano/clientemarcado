import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularHorarios, duracaoMinutos, type HorarioAgenda, type BloqueioAgenda } from '@/app/lib/agenda-segura/calcular-horarios'

export const dynamic = 'force-dynamic'

function responder(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
function uuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}
function dataValida(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(v + 'T12:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}
function horaValida(v: unknown): v is string {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
}

// Desligada por padrao. Requer RPC instalada, validada e ativacao EXPLICITA
// no servidor + no frontend (duas variaveis independentes).
export async function POST(request: NextRequest) {
  if (process.env.AGENDA_CONFIRMACAO_SEGURA_SERVER !== '1') return responder({ error: 'Indisponivel' }, 503)
  if ((Number(request.headers.get('content-length')) || 0) > 4096) return responder({ error: 'Conteudo muito grande' }, 413)
  const origin = request.headers.get('origin')
  if (origin) {
    try { if (new URL(origin).host !== request.nextUrl.host) return responder({ error: 'Origem invalida' }, 403) }
    catch { return responder({ error: 'Origem invalida' }, 403) }
  }
  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > 4096) return responder({ error: 'Conteudo muito grande' }, 413)
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return responder({ error: 'Parametros invalidos' }, 400)
    body = parsed as Record<string, unknown>
  } catch { return responder({ error: 'Parametros invalidos' }, 400) }

  const slug = typeof body.slug === 'string' ? body.slug.replace(/^@/, '').trim() : ''
  const servicoId = body.servico_id
  const profissionalId = body.profissional_id
  const data = body.data
  const horario = body.horario
  const nome = typeof body.cliente_nome === 'string' ? body.cliente_nome.trim() : ''
  const telefone = typeof body.cliente_telefone === 'string' ? body.cliente_telefone.replace(/\D/g, '') : ''
  if (!/^[a-z0-9_-]{2,80}$/i.test(slug) || !uuid(servicoId) || !uuid(profissionalId) ||
      !dataValida(data) || !horaValida(horario) || nome.length < 2 || nome.length > 120 ||
      telefone.length < 10 || telefone.length > 13) return responder({ error: 'Parametros invalidos' }, 400)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return responder({ error: 'Indisponivel' }, 503)
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    const { data: perfil, error: ep } = await db.from('perfis_publicos').select('*').eq('slug', slug).maybeSingle()
    if (ep || !perfil || !['agenda', 'loja', 'essencial', 'equipe'].includes(String(perfil.plano_tipo || '').toLowerCase()) ||
        perfil.pagina_mostrar_agenda === false) return responder({ error: 'Agenda indisponivel' }, 404)
    const dono = String(perfil.user_id)
    const [{ data: servico, error: es }, { data: profissional, error: epr }] = await Promise.all([
      db.from('servicos').select('id,user_id,ativo,duracao,duracao_minutos,profissionais_ids').eq('id', servicoId).maybeSingle(),
      db.from('profissionais').select('id,user_id,perfil_id,ativo,aparece_na_agenda').eq('id', profissionalId).maybeSingle(),
    ])
    if (es || epr) throw es || epr
    if (!servico || !profissional || servico.user_id !== dono ||
        (profissional.user_id !== dono && profissional.perfil_id !== perfil.id) ||
        servico.ativo === false || profissional.ativo === false || profissional.aparece_na_agenda === false ||
        (Array.isArray(servico.profissionais_ids) && servico.profissionais_ids.length > 0 &&
          !servico.profissionais_ids.includes(profissionalId))) {
      return responder({ error: 'Servico ou profissional indisponivel' }, 404)
    }
    // Verificacao de horario (boa experiencia); a verificacao definitiva e feita
    // novamente no PostgreSQL sob lock, pelo RPC/trigger. Nao e TOCTOU inseguro.
    const [{ data: ags, error: ea }, { data: ba, error: eb }, { data: bl, error: el }] = await Promise.all([
      db.from('agendamentos').select('data_hora,servico_id,profissional_id,status').eq('user_id', dono)
        .gte('data_hora', data + 'T00:00:00').lt('data_hora', data + 'T23:59:59.999999'),
      db.from('bloqueios_agenda').select('profissional_id,horario_inicio,horario_fim').eq('user_id', dono).eq('data', data),
      db.from('bloqueios').select('profissional_id,hora_inicio,hora_fim').eq('user_id', dono).eq('data', data),
    ])
    if (ea || eb || el) throw ea || eb || el
    const ocupados = (ags || []) as HorarioAgenda[]
    const ids = [...new Set(ocupados.map(a => a.servico_id).filter((id): id is string => typeof id === 'string'))]
    const duracoes: Record<string, number> = {}
    if (ids.length) {
      const { data: anteriores, error: ed } = await db.from('servicos').select('id,duracao,duracao_minutos').in('id', ids)
      if (ed) throw ed
      for (const s of anteriores || []) duracoes[s.id] = duracaoMinutos(s)
    }
    const horarios = calcularHorarios({ data, profissionalId, perfil, servico,
      agendamentos: ocupados, bloqueios: [...(ba || []), ...(bl || [])] as BloqueioAgenda[],
      duracoesReservas: duracoes })
    if (!horarios.includes(horario)) return responder({ error: 'Horario indisponivel', codigo: 'horario_ocupado' }, 409)

    // Se a RPC nao estiver instalada, a gravacao FALHA de forma segura.
    // Nunca usar service_role .insert() nesta rota como fallback.
    const { data: id, error } = await db.rpc('mp_agenda_confirmar_publico_v1', {
      p_slug: slug, p_servico_id: servicoId, p_profissional_id: profissionalId,
      p_data_hora: `${data}T${horario}:00`, p_cliente_nome: nome, p_cliente_telefone: telefone,
    })
    if (error) {
      if (error.code === '23P01') return responder({ error: 'Horario indisponivel', codigo: 'horario_ocupado' }, 409)
      if (error.code === '22023' || error.code === '23514') return responder({ error: 'Dados ou horario invalidos' }, 422)
      console.error('[agenda-confirmar] Falha no RPC:', error.code || 'desconhecido')
      return responder({ error: 'Nao foi possivel confirmar' }, 503)
    }
    if (!uuid(id)) return responder({ error: 'Confirmacao sem identificador' }, 503)
    return responder({ ok: true, id }, 201)
  } catch (e) {
    console.error('[agenda-confirmar] Falha interna sem dados pessoais:', e instanceof Error ? e.name : 'erro')
    return responder({ error: 'Nao foi possivel confirmar' }, 503)
  }
}
