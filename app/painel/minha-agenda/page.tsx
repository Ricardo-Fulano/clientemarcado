'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.20),transparent 32%),radial-gradient(circle at top right,rgba(236,72,153,.14),transparent 28%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:800px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34)}
.ag-card{padding:18px 20px;margin-bottom:12px;border:2px solid rgba(236,72,153,.22);box-shadow:0 0 0 1px rgba(236,72,153,.08),0 18px 45px rgba(0,0,0,.22)}
.ag-btn{border-radius:9px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border:1px solid transparent;transition:all .18s;background:rgba(24,16,27,.75);color:#F8F4F7}
.ag-btn-wpp:hover{background:rgba(34,197,94,.10)!important;border-color:rgba(34,197,94,.35)!important;color:#22C55E!important}
.ag-btn-real:hover{background:rgba(74,222,128,.12)!important;border-color:rgba(74,222,128,.40)!important;color:#4ADE80!important}
.ag-btn-mais:hover{background:rgba(196,181,253,.08)!important;border-color:rgba(196,181,253,.35)!important;color:#C4B5FD!important}
.bs-ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:60;opacity:0;pointer-events:none;transition:opacity .25s}
.bs-ovl.open{opacity:1;pointer-events:auto}
.bs{position:fixed;bottom:0;left:0;right:0;background:#120A14;border-top:1px solid rgba(255,255,255,.10);border-radius:22px 22px 0 0;padding:24px 24px 36px;z-index:61;transform:translateY(100%);transition:transform .28s ease;max-height:82vh;overflow-y:auto;box-sizing:border-box;max-width:500px;margin:0 auto}
.bs.open{transform:translateY(0)}
.bs-handle{width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 20px}
.bs-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:14px;font-weight:500;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit;width:100%;text-align:left;min-height:48px}
.bs-item:last-child{border-bottom:none}
.bs-item-desfazer:hover{color:#EC4899!important}
.bs-label{font-size:10px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 6px}
.toast-msg{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(139,92,246,.18);border:1px solid rgba(139,92,246,.40);border-radius:10px;padding:10px 20px;z-index:99;color:#C4B5FD;font-size:13px;font-weight:700;backdrop-filter:blur(20px);white-space:nowrap}
@media(max-width:640px){.bdy{padding:20px 16px 60px}}
`

type Agendamento = {
  id: string
  cliente_nome: string
  cliente_whatsapp: string | null
  data_hora: string
  status: string
  observacoes: string | null
  servicos: { nome: string } | null
}

export default function MinhaAgenda() {
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [nomeProfissional, setNomeProfissional] = useState('')
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<'proximos' | 'todos'>('proximos')
  const [bsAg, setBsAg] = useState<Agendamento | null>(null)
  const [msg, setMsg] = useState('')

  function toast(texto: string) {
    setMsg(texto)
    setTimeout(() => setMsg(''), 2500)
  }

  async function carregar() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setErro('Sessão expirada. Faça login novamente.'); setLoading(false); return }
    try {
      const res = await fetch('/api/equipe/minha-agenda', { headers: { 'Authorization': 'Bearer ' + token } })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao carregar agenda.'); setLoading(false); return }
      setNomeNegocio(data.nome_negocio || '')
      setNomeProfissional(data.nome_profissional || '')
      setAgendamentos(data.agendamentos || [])
    } catch (e) {
      setErro('Erro ao carregar agenda.')
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function marcarStatus(id: string, status: 'realizado' | 'pendente' | 'faltou' | 'cancelado') {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    try {
      await fetch('/api/equipe/minha-agenda', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ agendamento_id: id, status }),
      })
      toast('Status atualizado!')
    } catch (e) { console.warn('Erro ao atualizar status:', e) }
  }

  async function copiarContato(a: Agendamento) {
    const tel = a.cliente_whatsapp || ''
    if (!tel) { toast('Telefone não informado.'); return }
    try { await navigator.clipboard.writeText(tel); toast('Contato copiado com sucesso.') }
    catch { toast('Não foi possível copiar.') }
  }

  function resgatarCliente(a: Agendamento) {
    const tel = a.cliente_whatsapp ? a.cliente_whatsapp.replace(/\D/g, '') : ''
    if (!tel) { toast('Cliente sem WhatsApp cadastrado.'); return }
    const nomeCliente = a.cliente_nome?.trim() || 'cliente'
    const negocio = nomeNegocio?.trim() || 'nosso espaço'
    const msgTexto = `Olá, ${nomeCliente}! Tudo bem?\n\nAqui é da ${negocio}. Vi que você tinha um horário conosco e queria saber se deseja reagendar seu atendimento.\n\nPosso te ajudar a escolher um novo horário?`
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msgTexto)}`, '_blank')
  }

  function formatarData(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function montarMensagemWhatsapp(a: Agendamento) {
    const d = new Date(a.data_hora)
    const dataFmt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const horaFmt = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const nomeCliente = a.cliente_nome?.trim() || 'cliente'
    const negocio = nomeNegocio?.trim() || 'nosso espaço'
    const servico = a.servicos?.nome?.trim() || 'seu atendimento'
    const profissional = nomeProfissional?.trim() || ''
    let msg = `Olá, ${nomeCliente}! Tudo bem?\n\nAqui é da ${negocio}. Passando para confirmar seu agendamento:\n\nServiço: ${servico}\nData: ${dataFmt}\nHorário: ${horaFmt}`
    if (profissional) msg += `\nProfissional: ${profissional}`
    msg += `\n\nVocê confirma sua presença?`
    return msg
  }

  const jaRealizado = (s: string) => ['realizado', 'concluido', 'concluído', 'compareceu'].includes(s)
  const jaFaltou = (s: string) => s === 'faltou'
  const jaCancelado = (s: string) => s === 'cancelado'
  const agora = new Date()
  const listados = agendamentos.filter(a => filtro === 'todos' || new Date(a.data_hora) >= new Date(agora.toDateString()))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={nomeProfissional} tituloMobile="Minha agenda" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.04em', marginBottom: '5px' }}>Minha agenda</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5 }}>
              {nomeProfissional ? `Olá, ${nomeProfissional}` : 'Seus agendamentos'}{nomeNegocio ? ` — ${nomeNegocio}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            {[{ v: 'proximos', l: 'Próximos' }, { v: 'todos', l: 'Todos' }].map(f => (
              <button key={f.v} onClick={() => setFiltro(f.v as any)}
                style={{ background: filtro === f.v ? 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)' : 'rgba(24,16,27,.85)', color: filtro === f.v ? '#fff' : '#B8AAB8', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {f.l}
              </button>
            ))}
          </div>

          {loading && <p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p>}
          {erro && <p style={{ color: '#EF4444', fontSize: '14px' }}>{erro}</p>}

          {!loading && !erro && listados.length === 0 && (
            <div className="crd" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#B8AAB8' }}>Nenhum agendamento por aqui.</p>
            </div>
          )}

          {!loading && listados.map(a => {
            const wpp = a.cliente_whatsapp ? `https://wa.me/55${a.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(montarMensagemWhatsapp(a))}` : null
            return (
              <div key={a.id} className="crd ag-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '3px' }}>{a.cliente_nome}</p>
                    <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '2px' }}>{a.servicos?.nome || 'Serviço'}</p>
                    <p style={{ fontSize: '12px', color: '#B8AAB8' }}>🕐 {formatarData(a.data_hora)}</p>
                    {a.observacoes && <p style={{ fontSize: '11px', color: '#B8AAB8', marginTop: '4px', fontStyle: 'italic' as const }}>{a.observacoes}</p>}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: jaRealizado(a.status) ? 'rgba(34,197,94,.14)' : (jaFaltou(a.status) || jaCancelado(a.status)) ? 'rgba(239,68,68,.12)' : 'rgba(139,92,246,.14)', color: jaRealizado(a.status) ? '#22C55E' : (jaFaltou(a.status) || jaCancelado(a.status)) ? '#EF4444' : '#C4B5FD', border: `1px solid ${jaRealizado(a.status) ? 'rgba(34,197,94,.32)' : (jaFaltou(a.status) || jaCancelado(a.status)) ? 'rgba(239,68,68,.22)' : 'rgba(139,92,246,.28)'}` }}>
                    {jaRealizado(a.status) ? 'Realizado' : jaFaltou(a.status) ? 'Faltou' : jaCancelado(a.status) ? 'Cancelado' : a.status || 'Pendente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {wpp && <a href={wpp} target="_blank" rel="noreferrer" className="ag-btn ag-btn-wpp" style={{ textDecoration: 'none', display: 'inline-flex' }}>WhatsApp</a>}
                  {!jaRealizado(a.status) && !jaCancelado(a.status) && (
                    <button onClick={() => marcarStatus(a.id, 'realizado')} className="ag-btn ag-btn-real">✓ Realizado</button>
                  )}
                  <button onClick={() => setBsAg(a)} className="ag-btn ag-btn-mais">⋯ Mais</button>
                </div>
              </div>
            )
          })}

        </div></div>
      </div>

      {msg && <div className="toast-msg">{msg}</div>}

      <div className={'bs-ovl' + (bsAg ? ' open' : '')} onClick={() => setBsAg(null)} />
      <div className={'bs' + (bsAg ? ' open' : '')}>
        <div className="bs-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#F8F4F7' }}>Ações do atendimento</p>
            {bsAg && <p style={{ fontSize: 12, color: '#B8AAB8' }}>{bsAg.cliente_nome || '—'} · {formatarData(bsAg.data_hora)}</p>}
          </div>
          <button onClick={() => setBsAg(null)} style={{ background: 'none', border: 'none', color: '#B8AAB8', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <p className="bs-label">Contato</p>
        <button className="bs-item" style={{ color: '#B8AAB8' }} onClick={() => { bsAg && copiarContato(bsAg); setBsAg(null) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          Copiar contato
        </button>
        <button className="bs-item" style={{ color: '#EC4899' }} onClick={() => { bsAg && resgatarCliente(bsAg); setBsAg(null) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          Resgatar cliente
        </button>

        <p className="bs-label">Status do atendimento</p>
        {bsAg && (() => {
          const st = (bsAg.status || '').toLowerCase()
          const realizadoAtivo = jaRealizado(st)
          const faltouAtivo = jaFaltou(st)
          const canceladoAtivo = jaCancelado(st)
          return (<>
            {realizadoAtivo ? (
              <>
                <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 14, color: '#22C55E', fontWeight: 500 }}>Atendimento já realizado</span>
                </div>
                <button className="bs-item bs-item-desfazer" style={{ color: '#B8AAB8' }} onClick={() => { if (window.confirm('Deseja desfazer o status de realizado e voltar este atendimento para pendente?')) { marcarStatus(bsAg.id, 'pendente'); setBsAg(null) } }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9" /><polyline points="3 4 3 12 11 12" /></svg>
                  Desfazer realizado
                </button>
              </>
            ) : canceladoAtivo ? null : (
              <button className="bs-item" style={{ color: '#22C55E' }} onClick={() => { marcarStatus(bsAg.id, 'realizado'); setBsAg(null) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ✓ Marcar como realizado
              </button>
            )}
            {faltouAtivo ? (
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <span style={{ fontSize: 14, color: '#EF4444', fontWeight: 500 }}>Cliente marcado como faltou</span>
              </div>
            ) : canceladoAtivo ? null : (
              <button className="bs-item" style={{ color: '#EF4444' }} onClick={() => { marcarStatus(bsAg.id, 'faltou'); setBsAg(null) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                Marcar como faltou
              </button>
            )}
            {canceladoAtivo ? (
              <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8AAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                <span style={{ fontSize: 14, color: '#B8AAB8', fontWeight: 500 }}>Atendimento cancelado</span>
              </div>
            ) : (
              <button className="bs-item" style={{ color: '#EF4444' }} onClick={() => { marcarStatus(bsAg.id, 'cancelado'); setBsAg(null) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Cancelar atendimento
              </button>
            )}
          </>)
        })()}
      </div>
    </div>
  )
}
