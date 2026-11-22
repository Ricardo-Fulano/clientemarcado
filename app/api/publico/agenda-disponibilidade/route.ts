import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularHorarios, duracaoMinutos, type HorarioAgenda, type BloqueioAgenda } from '@/app/lib/agenda-segura/calcular-horarios'

export const dynamic = 'force-dynamic'

function responder(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
}
function validoUuid(id: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) }
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const slug = (p.get('slug') || '').replace(/^@/, '').trim()
  const data = p.get('data') || ''
  const servicoId = p.get('servico_id') || ''
  const profissionalId = p.get('profissional_id') || ''
  if (!/^[a-z0-9_-]{2,80}$/i.test(slug) || !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !validoUuid(servicoId) || !validoUuid(profissionalId)) return responder({ error: 'Parametros invalidos' }, 400)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return responder({ error: 'Indisponivel' }, 503)
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    const { data: perfil, error: ep } = await db.from('perfis_publicos').select('*').eq('slug', slug).maybeSingle()
    if (ep) throw ep
    if (!perfil || !['agenda', 'loja', 'essencial', 'equipe'].includes(String(perfil.plano_tipo || '').toLowerCase()) ||
      perfil.pagina_mostrar_agenda === false) return responder({ horarios: [] })
    const [{ data: servico, error: es }, { data: profissional, error: epr }] = await Promise.all([
      db.from('servicos').select('id,user_id,ativo,duracao,duracao_minutos,profissionais_ids').eq('id', servicoId).maybeSingle(),
      db.from('profissionais').select('id,user_id,perfil_id,ativo,aparece_na_agenda').eq('id', profissionalId).maybeSingle(),
    ])
    if (es || epr) throw es || epr
    const dono = String(perfil.user_id || '')
    if (!servico || !profissional || servico.user_id !== dono ||
        (profissional.user_id !== dono && profissional.perfil_id !== perfil.id) ||
        servico.ativo === false || profissional.ativo === false || profissional.aparece_na_agenda === false ||
        (Array.isArray(servico.profissionais_ids) && servico.profissionais_ids.length > 0 && !servico.profissionais_ids.includes(profissionalId))) {
      return responder({ horarios: [] })
    }
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
      const { data: sv, error: ed } = await db.from('servicos').select('id,duracao,duracao_minutos').in('id', ids)
      if (ed) throw ed
      for (const s of sv || []) duracoes[s.id] = duracaoMinutos(s)
    }
    const horarios = calcularHorarios({
      data, profissionalId, perfil, servico, agendamentos: ocupados,
      bloqueios: [...(ba || []), ...(bl || [])] as BloqueioAgenda[], duracoesReservas: duracoes,
    })
    return responder({ horarios })
  } catch (err) {
    console.error('[agenda-disponibilidade] Falha na consulta de disponibilidade:', err)
    return responder({ error: 'Nao foi possivel consultar a agenda' }, 503)
  }
}
