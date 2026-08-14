'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ehPlanoMiniPage } from '../../lib/planos'
import PainelSidebar from '@/app/components/PainelSidebar'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.20),transparent 32%),radial-gradient(circle at top right,rgba(236,72,153,.14),transparent 28%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:900px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.kpi{padding:16px 18px;border:2px solid rgba(236,72,153,.20)}
.kpi-lbl{font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.kpi-val{font-size:20px;font-weight:800;color:#F8F4F7;letter-spacing:-0.02em}
.at-card{padding:16px 20px;margin-bottom:10px;border:2px solid rgba(236,72,153,.18)}
@media(max-width:760px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.bdy{padding:20px 16px 60px}.kpi-grid{grid-template-columns:1fr 1fr}}
`

type Atendimento = {
  id: string
  cliente_nome: string
  servico_nome: string
  data_hora: string
  valor: number
  status: string
}

const PERIODOS = [
  { v: 'hoje', l: 'Hoje' },
  { v: 'semana', l: 'Semana' },
  { v: 'mes', l: 'Mês' },
  { v: 'todos', l: 'Todo período' },
]

export default function MeuDesempenho() {
  const [bloqueadoMiniPage, setBloqueadoMiniPage] = useState(false)
  const [verificandoPlanoMiniPage, setVerificandoPlanoMiniPage] = useState(true)
  useEffect(() => {
    async function verificarPlanoMiniPage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setVerificandoPlanoMiniPage(false); return }
      const { data: perfil } = await supabase.from('perfis').select('plano_tipo').eq('user_id', user.id).maybeSingle()
      if (perfil && ehPlanoMiniPage(perfil.plano_tipo)) setBloqueadoMiniPage(true)
      setVerificandoPlanoMiniPage(false)
    }
    verificarPlanoMiniPage()
  }, [])
  const [periodo, setPeriodo] = useState('mes')
  const [totalProduzido, setTotalProduzido] = useState(0)
  const [totalAtendimentos, setTotalAtendimentos] = useState(0)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [servicoMaisRealizado, setServicoMaisRealizado] = useState('')
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar(p: string) {
    setLoading(true)
    setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setErro('Sessão expirada. Faça login novamente.'); setLoading(false); return }
    try {
      const res = await fetch('/api/equipe/meu-desempenho?periodo=' + p, { headers: { 'Authorization': 'Bearer ' + token } })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao carregar desempenho.'); setLoading(false); return }
      setTotalProduzido(data.totalProduzido || 0)
      setTotalAtendimentos(data.totalAtendimentos || 0)
      setTicketMedio(data.ticketMedio || 0)
      setServicoMaisRealizado(data.servicoMaisRealizado || '')
      setAtendimentos(data.atendimentos || [])
    } catch (e) {
      setErro('Erro ao carregar desempenho.')
    }
    setLoading(false)
  }

  useEffect(() => { carregar(periodo) }, [periodo])

  function formatarMoeda(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function formatarData(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (!verificandoPlanoMiniPage && bloqueadoMiniPage) {
    return (
      <div style={{display:'flex',minHeight:'100vh',background:'#08060A'}}>
        <PainelSidebar tituloMobile="Meu desempenho"/>
        <div className="psb-main">
          <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
            <div style={{maxWidth:'460px',textAlign:'center',background:'radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'44px 32px'}}>
              <p style={{fontSize:'19px',fontWeight:800,color:'#F8F4F7',marginBottom:'10px'}}>Este recurso está disponível no Plano Profissional.</p>
              <p style={{fontSize:'14px',color:'#B8AAB8',lineHeight:1.6,marginBottom:'26px'}}>Sua MiniPage está ativa, mas agenda, clientes, financeiro e relatórios fazem parte de um plano com mais recursos.</p>
              <div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
                <a href="/painel/plano" style={{background:'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)',color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',padding:'12px 24px',fontSize:'14px',fontWeight:700,textDecoration:'none',display:'inline-block'}}>Ver planos</a>
                <a href="/painel" style={{background:'rgba(24,16,27,.92)',color:'#F8F4F7',border:'1px solid rgba(229,72,184,.28)',borderRadius:'12px',padding:'12px 24px',fontSize:'14px',fontWeight:600,textDecoration:'none',display:'inline-block'}}>Voltar ao início</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Meu desempenho" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.04em', marginBottom: '5px' }}>Meu desempenho</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5 }}>Acompanhe seus atendimentos realizados e sua produção individual.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {PERIODOS.map(p => (
              <button key={p.v} onClick={() => setPeriodo(p.v)}
                style={{ background: periodo === p.v ? 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)' : 'rgba(24,16,27,.85)', color: periodo === p.v ? '#fff' : '#B8AAB8', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p.l}
              </button>
            ))}
          </div>

          {erro && <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{erro}</p>}

          <div className="kpi-grid">
            <div className="crd kpi">
              <p className="kpi-lbl">Produção no período</p>
              <p className="kpi-val" style={{ color: '#F9A8D4' }}>{formatarMoeda(totalProduzido)}</p>
            </div>
            <div className="crd kpi">
              <p className="kpi-lbl">Atendimentos realizados</p>
              <p className="kpi-val">{totalAtendimentos}</p>
            </div>
            <div className="crd kpi">
              <p className="kpi-lbl">Ticket médio</p>
              <p className="kpi-val">{formatarMoeda(ticketMedio)}</p>
            </div>
            <div className="crd kpi">
              <p className="kpi-lbl">Serviço mais realizado</p>
              <p className="kpi-val" style={{ fontSize: '15px' }}>{servicoMaisRealizado || '—'}</p>
            </div>
          </div>

          <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '12px' }}>Atendimentos realizados</p>

          {loading && <p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p>}

          {!loading && !erro && atendimentos.length === 0 && (
            <div className="crd" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#B8AAB8' }}>Você ainda não possui atendimentos realizados neste período.</p>
            </div>
          )}

          {!loading && atendimentos.map(a => (
            <div key={a.id} className="crd at-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '3px' }}>{a.cliente_nome}</p>
                  <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '2px' }}>{a.servico_nome}</p>
                  <p style={{ fontSize: '12px', color: '#B8AAB8' }}>🕐 {formatarData(a.data_hora)}</p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#F9A8D4', marginBottom: '4px' }}>{formatarMoeda(a.valor)}</p>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'rgba(34,197,94,.14)', color: '#22C55E', border: '1px solid rgba(34,197,94,.32)' }}>Realizado</span>
                </div>
              </div>
            </div>
          ))}

        </div></div>
      </div>
    </div>
  )
}
