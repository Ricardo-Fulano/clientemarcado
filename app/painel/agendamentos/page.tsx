'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const statusCfg: Record<string, {t:string,bg:string,c:string,bd:string}> = {
  pendente:    {t:'Pendente',    bg:'rgba(245,158,11,.12)', c:'#FCD34D', bd:'rgba(245,158,11,.25)'},
  confirmado:  {t:'Confirmado',  bg:'rgba(34,197,94,.12)',  c:'#4ADE80', bd:'rgba(34,197,94,.25)'},
  realizado:   {t:'Realizado',   bg:'rgba(34,197,94,.10)',  c:'#22C55E', bd:'rgba(34,197,94,.20)'},
  cancelado:   {t:'Cancelado',   bg:'rgba(239,68,68,.10)',  c:'#F87171', bd:'rgba(239,68,68,.22)'},
  retorno:     {t:'Retorno',     bg:'rgba(124,58,237,.12)', c:'#C4B5FD', bd:'rgba(124,58,237,.25)'},
  compareceu:  {t:'Compareceu',  bg:'rgba(34,197,94,.12)',  c:'#4ADE80', bd:'rgba(34,197,94,.25)'},
  faltou:      {t:'Faltou',      bg:'rgba(239,68,68,.10)',  c:'#F87171', bd:'rgba(239,68,68,.22)'},
  em_atendimento:{t:'Em atendimento',bg:'rgba(59,130,246,.12)',c:'#60A5FA',bd:'rgba(59,130,246,.25)'},
}

function fH(dh: string) {
  const d = new Date(dh)
  return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
}
function fData(dh: string) {
  const d = new Date(dh)
  return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})
}
function fDataCurta(dh: string) {
  const d = new Date(dh)
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}

const css = `
  *{box-sizing:border-box}
  .pg{min-height:100vh;background:linear-gradient(180deg,#060C18,#050B16);color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding-bottom:60px}
  .bdy{max-width:1100px;margin:0 auto;padding:24px 20px}
  .hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
  .hdr-txt h1{font-size:28px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:4px}
  .hdr-txt p{font-size:14px;color:#64748B;line-height:1.5}
  .hdr-btns{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap}
  .btn-prim{background:${G};color:#fff;border:none;border-radius:12px;padding:0 20px;height:42px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 4px 16px rgba(59,130,246,.25);transition:opacity .15s}
  .btn-prim:hover{opacity:.9}
  .btn-sec{background:rgba(15,23,42,.88);color:#94A3B8;border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:0 18px;height:42px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .15s}
  .btn-sec:hover{border-color:rgba(148,163,184,.35);color:#F8FAFC}
  .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}
  .kpi-card{background:radial-gradient(circle at top left,rgba(124,58,237,.07),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:18px 20px}
  .kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin-bottom:8px}
  .kpi-num{font-size:32px;font-weight:900;letter-spacing:-0.03em}
  .ctrl{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap}
  .aba{background:transparent;border:1px solid rgba(148,163,184,.14);border-radius:10px;padding:0 18px;height:38px;font-size:13px;font-weight:600;cursor:pointer;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap}
  .aba.on{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.35);color:#60A5FA}
  .aba:hover:not(.on){border-color:rgba(148,163,184,.28);color:#94A3B8}
  .filtros{display:flex;gap:8px;flex-wrap:wrap;flex:1}
  .filt{background:transparent;border:1px solid rgba(148,163,184,.12);border-radius:8px;padding:0 14px;height:34px;font-size:12px;font-weight:600;cursor:pointer;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap}
  .filt.on{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.30);color:#60A5FA}
  .filt:hover:not(.on){color:#94A3B8}
  .prof-sel{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:10px;padding:0 14px;height:36px;font-size:12px;color:#94A3B8;font-family:inherit;cursor:pointer;outline:none;margin-left:auto}
  .dia-titulo{font-size:13px;font-weight:700;color:#475569;text-transform:capitalize;margin:20px 0 10px;letter-spacing:.02em}
  .card-ag{background:radial-gradient(circle at top left,rgba(124,58,237,.05),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:16px 18px;margin-bottom:10px;display:flex;gap:14px;align-items:flex-start;transition:border-color .15s}
  .card-ag:hover{border-color:rgba(148,163,184,.22)}
  .hora-badge{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.22);border-radius:10px;padding:8px 10px;min-width:58px;text-align:center;flex-shrink:0}
  .hora-badge span{font-size:15px;font-weight:800;color:#60A5FA;display:block;letter-spacing:-0.01em}
  .ag-info{flex:1;min-width:0}
  .ag-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px}
  .ag-nome{font-size:15px;font-weight:800;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .st-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;line-height:18px}
  .ag-sub{font-size:12px;color:#64748B;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ag-acoes{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
  .ac-btn{border-radius:9px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;transition:opacity .15s;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
  .ac-btn:hover{opacity:.8}
  .ac-mais{background:rgba(255,255,255,.04);border-color:rgba(148,163,184,.18);color:#64748B;position:relative}
  .menu-mais{position:absolute;top:calc(100% + 6px);left:0;background:rgba(15,23,42,.98);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:8px;min-width:160px;z-index:50;box-shadow:0 16px 48px rgba(0,0,0,.5)}
  .menu-item{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#CBD5E1;border:none;background:none;font-family:inherit;width:100%;text-align:left;white-space:nowrap;transition:background .1s}
  .menu-item:hover{background:rgba(255,255,255,.06)}
  .vazio{text-align:center;padding:60px 24px;background:radial-gradient(circle at center,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.10);border-radius:18px}
  .sem-wrap{display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:500px;padding:16px}
  .sem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
  .sem-dia{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.10);border-radius:12px;overflow:hidden;min-height:120px}
  .sem-dia-hdr{background:rgba(59,130,246,.08);padding:6px 8px;text-align:center;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:1px solid rgba(148,163,184,.08)}
  .sem-dia-hdr.hj{color:#60A5FA;background:rgba(59,130,246,.15)}
  .sem-ag{background:rgba(59,130,246,.10);border-radius:6px;padding:4px 6px;margin:4px;font-size:10px;color:#93C5FD;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(59,130,246,.15)}
  .toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.97);border:1px solid rgba(59,130,246,.30);border-radius:12px;padding:12px 24px;font-size:13px;font-weight:600;color:#F8FAFC;z-index:100;box-shadow:0 8px 32px rgba(0,0,0,.4)}
  @media(max-width:768px){
    .bdy{padding:16px 14px}
    .hdr{flex-direction:column}
    .hdr-btns{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .hdr-btns .btn-prim,.hdr-btns .btn-sec{width:100%;justify-content:center}
    .kpi{grid-template-columns:repeat(3,1fr);gap:10px}
    .kpi-card{padding:14px 12px}
    .kpi-num{font-size:24px}
    .ctrl{gap:8px}
    .filtros{gap:6px}
    .prof-sel{margin-left:0;width:100%}
    .hdr-txt h1{font-size:22px}
  }
  @media(max-width:480px){
    .kpi{grid-template-columns:repeat(3,1fr)}
    .kpi-label{font-size:9px}
    .sem-grid{grid-template-columns:repeat(7,1fr);gap:3px}
  }
`

export default function Agendamentos() {
  const [perfil, setPerfil] = useState<any>(null)
  const [profs, setProfs] = useState<any[]>([])
  const [ags, setAgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'hoje'|'semana'>('hoje')
  const [fSt, setFSt] = useState('todos')
  const [fPr, setFPr] = useState('todos')
  const [semOff, setSemOff] = useState(0)
  const [msg, setMsg] = useState('')
  const [menuAberto, setMenuAberto] = useState<string|null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => { load() }, [])

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(null)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)
    const { data: pr } = await supabase.from('profissionais').select('*').eq('user_id', user.id)
    setProfs(pr || [])
    const fim = new Date(); fim.setDate(fim.getDate() + 60)
    const atas = new Date(); atas.setDate(atas.getDate() - 30)
    const { data: a } = await supabase.from('agendamentos')
      .select('*,servicos(nome,preco),profissionais(nome)')
      .eq('user_id', user.id)
      .gte('data_hora', atas.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora', { ascending: true })
    setAgs(a || [])
    setLoading(false)
  }

  function toast(m: string) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    setAgs(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setMenuAberto(null)
    toast('Status atualizado!')
  }

  function wppLink(a: any, tipo: 'confirmar'|'lembrete') {
    const tel = (a.cliente_whatsapp || a.cliente_telefone || '').replace(/\D/g, '')
    if (!tel) return null
    const d = new Date(a.data_hora)
    const dataFmt = d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'})
    const horaFmt = d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})
    const msg = tipo === 'confirmar'
      ? encodeURIComponent('Ola, '+a.cliente_nome+'! Seu agendamento foi confirmado.\n\nServico: '+(a.servicos?.nome||'')+'\nProfissional: '+(a.profissionais?.nome||'')+'\nData: '+dataFmt+'\nHorario: '+horaFmt+'\n\n'+(perfil?.nome_negocio||''))
      : encodeURIComponent('Ola, '+a.cliente_nome+'! Passando para lembrar do seu agendamento.\n\nServico: '+(a.servicos?.nome||'')+'\nData: '+dataFmt+'\nHorario: '+horaFmt+'\n\nTe esperamos!\n'+(perfil?.nome_negocio||''))
    return 'https://wa.me/55'+tel+'?text='+msg
  }

  const agsFiltrados = ags.filter(a => {
    if (fSt !== 'todos' && a.status !== fSt) return false
    if (fPr !== 'todos' && a.profissional_id !== fPr) return false
    if (view === 'hoje') {
      const d = new Date(a.data_hora).toISOString().split('T')[0]
      return d === hoje
    }
    return true
  })

  // KPIs do dia
  const agsHoje = ags.filter(a => new Date(a.data_hora).toISOString().split('T')[0] === hoje)
  const confirmados = agsHoje.filter(a => a.status === 'confirmado').length
  const pendentes = agsHoje.filter(a => a.status === 'pendente').length

  // Semana
  function getInicioSemana(off: number) {
    const d = new Date(); d.setHours(0,0,0,0)
    const dow = d.getDay()
    d.setDate(d.getDate() - dow + off * 7)
    return d
  }
  const inicioSem = getInicioSemana(semOff)
  const diasSem = Array.from({length:7}, (_,i) => {
    const d = new Date(inicioSem); d.setDate(inicioSem.getDate()+i)
    return d
  })

  // Agrupar por data para visão lista
  const grupos: Record<string, any[]> = {}
  agsFiltrados.forEach(a => {
    const d = new Date(a.data_hora).toISOString().split('T')[0]
    if (!grupos[d]) grupos[d] = []
    grupos[d].push(a)
  })

  function CardAg({ a }: { a: any }) {
    const sc = statusCfg[a.status] || statusCfg.pendente
    const wppC = wppLink(a, 'confirmar')
    const wppL = wppLink(a, 'lembrete')
    const aberto = menuAberto === a.id

    return (
      <div className="card-ag">
        <div className="hora-badge">
          <span>{fH(a.data_hora)}</span>
        </div>
        <div className="ag-info">
          <div className="ag-top">
            <p className="ag-nome">{a.cliente_nome || '—'}</p>
            <span className="st-badge" style={{background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`}}>{sc.t}</span>
          </div>
          <p className="ag-sub">
            {a.servicos?.nome || 'Servico nao informado'}
            {a.profissionais?.nome ? ' · Prof. '+a.profissionais.nome : ''}
            {a.servicos?.preco ? ' · R$ '+a.servicos.preco : ''}
          </p>
          <div className="ag-acoes" ref={aberto ? menuRef : undefined}>
            {wppC && (a.status === 'pendente' || a.status === 'retorno') && (
              <a href={wppC} target="_blank" rel="noreferrer" className="ac-btn" style={{background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'}}>
                ✓ Confirmar
              </a>
            )}
            {wppL && (
              <a href={wppL} target="_blank" rel="noreferrer" className="ac-btn" style={{background:'rgba(59,130,246,.10)',borderColor:'rgba(59,130,246,.25)',color:'#60A5FA'}}>
                🔔 Lembrete
              </a>
            )}
            <div style={{position:'relative'}}>
              <button className="ac-btn ac-mais" onClick={()=>setMenuAberto(aberto?null:a.id)}>
                ··· Mais
              </button>
              {aberto && (
                <div className="menu-mais">
                  {a.status !== 'compareceu' && <button className="menu-item" onClick={()=>atualizarStatus(a.id,'compareceu')}><span style={{color:'#22C55E'}}>✓</span> Compareceu</button>}
                  {a.status !== 'faltou' && <button className="menu-item" onClick={()=>atualizarStatus(a.id,'faltou')}><span style={{color:'#F87171'}}>✗</span> Faltou</button>}
                  {a.status !== 'realizado' && <button className="menu-item" onClick={()=>atualizarStatus(a.id,'realizado')}><span style={{color:'#4ADE80'}}>★</span> Realizado</button>}
                  {a.status !== 'retorno' && <button className="menu-item" onClick={()=>atualizarStatus(a.id,'retorno')}><span style={{color:'#C4B5FD'}}>↩</span> Retorno</button>}
                  {a.status !== 'cancelado' && <button className="menu-item" onClick={()=>atualizarStatus(a.id,'cancelado')}><span style={{color:'#F87171'}}>✕</span> Cancelar</button>}
                  {a.status !== 'confirmado' && <button className="menu-item" onClick={()=>atualizarStatus(a.id,'confirmado')}><span style={{color:'#4ADE80'}}>✓</span> Confirmar</button>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'#475569',fontSize:'14px'}}>Carregando agenda...</p>
    </div>
  )

  return (
    <div className="pg">
      <style>{css}</style>
      {msg && <div className="toast">{msg}</div>}

      <div className="bdy">
        {/* Header */}
        <div className="hdr">
          <div className="hdr-txt">
            <h1>Agenda</h1>
            <p>Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
          </div>
          <div className="hdr-btns">
            <Link href="/painel/agendamentos/novo" className="btn-prim">+ Novo agendamento</Link>
            <Link href="/painel/bloqueios" className="btn-sec">Bloquear horario</Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi">
          <div className="kpi-card">
            <p className="kpi-label">Hoje</p>
            <p className="kpi-num" style={{color:'#60A5FA'}}>{agsHoje.length}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Confirmados</p>
            <p className="kpi-num" style={{color:'#4ADE80'}}>{confirmados}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Pendentes</p>
            <p className="kpi-num" style={{color:'#FCD34D'}}>{pendentes}</p>
          </div>
        </div>

        {/* Controles */}
        <div className="ctrl">
          <button className={'aba'+(view==='hoje'?' on':'')} onClick={()=>setView('hoje')}>Hoje</button>
          <button className={'aba'+(view==='semana'?' on':'')} onClick={()=>setView('semana')}>Semana</button>

          {view === 'hoje' && (
            <div className="filtros">
              {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
                <button key={f} className={'filt'+(fSt===f?' on':'')} onClick={()=>setFSt(f)}>
                  {f==='todos'?'Todos':statusCfg[f]?.t||f}
                </button>
              ))}
            </div>
          )}

          <select className="prof-sel" value={fPr} onChange={e=>setFPr(e.target.value)}>
            <option value="todos">Todos profissionais</option>
            {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        {/* VISÃO HOJE */}
        {view === 'hoje' && (
          <div>
            <p className="dia-titulo">
              {fSt === 'todos' ? 'Proximos atendimentos de hoje' : (statusCfg[fSt]?.t||fSt)+' hoje'}
            </p>
            {agsFiltrados.length === 0 ? (
              <div className="vazio">
                <div style={{fontSize:'40px',marginBottom:'16px',opacity:.4}}>📅</div>
                <h3 style={{fontSize:'18px',fontWeight:800,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum atendimento para hoje</h3>
                <p style={{fontSize:'14px',color:'#64748B',marginBottom:'24px',lineHeight:1.6}}>Quando seus clientes agendarem, os horarios aparecerão aqui.</p>
                <Link href="/painel/agendamentos/novo" className="btn-prim" style={{display:'inline-flex',margin:'0 auto'}}>+ Novo agendamento</Link>
              </div>
            ) : (
              agsFiltrados.map(a => <CardAg key={a.id} a={a} />)
            )}
          </div>
        )}

        {/* VISÃO SEMANA */}
        {view === 'semana' && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#94A3B8'}}>
                {inicioSem.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} – {diasSem[6].toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}
              </p>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn-sec" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s-1)}>‹ Anterior</button>
                <button className="btn-sec" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(0)}>Hoje</button>
                <button className="btn-sec" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s+1)}>Próxima ›</button>
              </div>
            </div>
            <div className="sem-grid">
              {diasSem.map((d,i) => {
                const dStr = d.toISOString().split('T')[0]
                const ehHoje = dStr === hoje
                const diasAgs = ags.filter(a => {
                  const ad = new Date(a.data_hora).toISOString().split('T')[0]
                  if (ad !== dStr) return false
                  if (fPr !== 'todos' && a.profissional_id !== fPr) return false
                  return true
                })
                return (
                  <div key={i} className="sem-dia">
                    <div className={'sem-dia-hdr'+(ehHoje?' hj':'')}>
                      <div>{['D','S','T','Q','Q','S','S'][d.getDay()]}</div>
                      <div style={{fontSize:'12px',fontWeight:800}}>{d.getDate()}</div>
                    </div>
                    {diasAgs.map(a => (
                      <div key={a.id} className="sem-ag" title={a.cliente_nome+' - '+fH(a.data_hora)}>
                        {fH(a.data_hora)} {(a.cliente_nome||'').split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
