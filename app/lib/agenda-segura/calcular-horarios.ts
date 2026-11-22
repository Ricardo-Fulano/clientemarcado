// Funcoes puras: sem chaves Supabase ou dados de clientes.
// Timezone do estabelecimento: fallback America/Sao_Paulo. Ao expandir para outros paises,
// salvar o fuso IANA no perfil e padronizar os timestamps de agendamentos.
export type HorarioAgenda = { data_hora: string; profissional_id: string | null; servico_id: string | null; status: string | null }
export type BloqueioAgenda = { profissional_id: string | null; horario_inicio?: string; horario_fim?: string; hora_inicio?: string; hora_fim?: string }

function horaEmMinutos(v: unknown): number | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(v.trim())
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null
}
function inteiroPositivo(v: unknown): number | null {
  const n = Number(v)
  return Number.isSafeInteger(n) && n > 0 && n <= 1440 ? n : null
}
export function duracaoMinutos(servico: { duracao_minutos?: unknown; duracao?: unknown } | null | undefined): number {
  return inteiroPositivo(servico?.duracao_minutos) ?? inteiroPositivo(servico?.duracao) ?? 30
}
function intervaloMinutos(p: Record<string, unknown>): number {
  const raw = typeof p.intervalo === 'string' ? p.intervalo.trim().toLowerCase() : ''
  const val = /^\d+/.exec(raw)?.[0]
  const n = val ? Number(val) * (raw.includes('hora') ? 60 : 1) : null
  return inteiroPositivo(n) ?? inteiroPositivo(p.intervalo_agenda) ?? 30
}
function antecedenciaMinutos(p: Record<string, unknown>): number {
  if (typeof p.antecedencia === 'string') {
    const s = p.antecedencia.toLowerCase().trim()
    if (s.startsWith('sem restri')) return 0
    const n = Number(/^\d+/.exec(s)?.[0])
    if (Number.isFinite(n) && n > 0) return n * (s.includes('dia') ? 1440 : s.includes('hora') ? 60 : 1)
  }
  return Math.max(0, Number(p.antecedencia_minima) || 0)
}
function validoDia(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const x = new Date(d + 'T12:00:00Z')
  return !Number.isNaN(x.getTime()) && x.toISOString().slice(0, 10) === d
}
function negocioAgora(timeZone: string, agora: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(agora)
  const v = (k: string) => parts.find(p => p.type === k)?.value ?? ''
  return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}`
}
export function calcularHorarios(args: {
  data: string; profissionalId: string; perfil: Record<string, unknown>;
  servico: { duracao_minutos?: unknown; duracao?: unknown };
  agendamentos: HorarioAgenda[]; bloqueios: BloqueioAgenda[];
  duracoesReservas: Record<string, number>;
  agora?: Date; timeZone?: string;
}): string[] {
  const { data, profissionalId, perfil, servico, agendamentos, bloqueios, duracoesReservas } = args
  if (!validoDia(data) || !profissionalId) return []
  const dia = new Date(data + 'T12:00:00Z').getUTCDay()
  const ativos = Array.isArray(perfil.dias_ativos) ? perfil.dias_ativos : [false, true, true, true, true, true, true]
  if (ativos[dia] !== true) return []
  const periodos = Array.isArray(perfil.horarios) ? perfil.horarios : []
  const periodo = periodos[dia] && typeof periodos[dia] === 'object' ? periodos[dia] as Record<string, unknown> : {}
  const inicio = horaEmMinutos(periodo.abertura ?? perfil.abertura_geral ?? perfil.hora_abertura ?? '08:00')
  const fim = horaEmMinutos(periodo.fechamento ?? perfil.fechamento_geral ?? perfil.hora_fechamento ?? '18:00')
  const duracao = duracaoMinutos(servico), intervalo = intervaloMinutos(perfil)
  if (inicio === null || fim === null || fim <= inicio || !intervalo) return []
  let agora = ''
  try { agora = negocioAgora(args.timeZone || 'America/Sao_Paulo', args.agora || new Date()) }
  catch { return [] }
  const antecedencia = antecedenciaMinutos(perfil)
  const ocupados = agendamentos.filter(a => a.profissional_id === profissionalId || a.profissional_id === null)
    .filter(a => !['cancelado', 'faltou'].includes((a.status || '').trim().toLowerCase()))
    .map(a => {
      const min = horaEmMinutos(String(a.data_hora).slice(11, 16))
      const dur = a.servico_id ? duracoesReservas[a.servico_id] ?? 30 : 30
      return min === null ? null : { inicio: min, fim: min + dur }
    }).filter((a): a is {inicio:number;fim:number} => a !== null)
  const intervalosBloqueados = bloqueios.filter(b => !b.profissional_id || b.profissional_id === profissionalId)
    .map(b => {
      const bi = horaEmMinutos(b.horario_inicio ?? b.hora_inicio)
      const bf = horaEmMinutos(b.horario_fim ?? b.hora_fim)
      return bi !== null && bf !== null && bf > bi ? {inicio:bi,fim:bf} : null
    }).filter((b): b is {inicio:number;fim:number} => b !== null)
  const todos = [...ocupados, ...intervalosBloqueados]
  const resultado: string[] = []
  for (let min = inicio; min + duracao <= fim; min += intervalo) {
    if (todos.some(b => min < b.fim && min + duracao > b.inicio)) continue
    const hora = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
    // Comparacao de horario local feita em minutos por data, sem conversao UTC de banco legado.
    const dataHora = `${data}T${hora}`
    if (dataHora <= agora) continue
    if (antecedencia > 0) {
      const limite = new Date(args.agora?.getTime() ?? Date.now()).getTime() + antecedencia * 60000
      // Usa data/hora negocio contra horario de agora convertido para a zona de negocio.
      const limiteLocal = negocioAgora(args.timeZone || 'America/Sao_Paulo', new Date(limite))
      if (dataHora < limiteLocal) continue
    }
    resultado.push(hora)
  }
  return resultado
}
