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

  async function marcarStatus(id: string, status: 'realizado' | 'pendente') {
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
    } catch (e) { console.warn('Erro ao atualizar status:', e) }
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
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: jaRealizado(a.status) ? 'rgba(34,197,94,.14)' : 'rgba(139,92,246,.14)', color: jaRealizado(a.status) ? '#22C55E' : '#C4B5FD', border: `1px solid ${jaRealizado(a.status) ? 'rgba(34,197,94,.32)' : 'rgba(139,92,246,.28)'}` }}>
                    {jaRealizado(a.status) ? 'Realizado' : a.status || 'Pendente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {wpp && <a href={wpp} target="_blank" rel="noreferrer" className="ag-btn ag-btn-wpp" style={{ textDecoration: 'none', display: 'inline-flex' }}>WhatsApp</a>}
                  {!jaRealizado(a.status) && (
                    <button onClick={() => marcarStatus(a.id, 'realizado')} className="ag-btn ag-btn-real">✓ Realizado</button>
                  )}
                </div>
              </div>
            )
          })}

        </div></div>
      </div>
    </div>
  )
}
