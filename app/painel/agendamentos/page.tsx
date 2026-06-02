'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const statusCfg: Record<string, {t:string,bg:string,c:string,bd:string}> = {
  pendente:      {t:'Pendente',       bg:'rgba(245,158,11,.14)', c:'#FCD34D', bd:'rgba(245,158,11,.30)'},
  confirmado:    {t:'Confirmado',     bg:'rgba(34,197,94,.14)',  c:'#4ADE80', bd:'rgba(34,197,94,.30)'},
  realizado:     {t:'Realizado',      bg:'rgba(34,197,94,.12)',  c:'#22C55E', bd:'rgba(34,197,94,.25)'},
  cancelado:     {t:'Cancelado',      bg:'rgba(239,68,68,.12)',  c:'#F87171', bd:'rgba(239,68,68,.28)'},
  retorno:       {t:'Retorno',        bg:'rgba(124,58,237,.14)', c:'#C4B5FD', bd:'rgba(124,58,237,.30)'},
  compareceu:    {t:'Compareceu',     bg:'rgba(34,197,94,.14)',  c:'#4ADE80', bd:'rgba(34,197,94,.30)'},
  faltou:        {t:'Faltou',         bg:'rgba(239,68,68,.12)',  c:'#F87171', bd:'rgba(239,68,68,.28)'},
  em_atendimento:{t:'Em atendimento', bg:'rgba(59,130,246,.14)', c:'#60A5FA', bd:'rgba(59,130,246,.30)'},
}

function fH(dh: string) {
  return new Date(dh).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
}
function fDataExtenso(dh: string) {
  return new Date(dh).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})
}
function fDataCurta(d: Date) {
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}
function fTel(t: string) {
  if (!t) return ''
  const n = t.replace(/\D/g,'')
  if (n.length === 11) return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7)
  if (n.length === 10) return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6)
  return t
}

const css = `
*{box-sizing:border-box;margin:0;padding:0}
.pg{min-height:100vh;background:linear-gradient(180deg,#060C18 0%,#050B16 100%);color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding-bottom:80px}
.bdy{max-width:1000px;margin:0 auto;padding:28px 20px}

/* Header */
.hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.hdr h1{font-size:26px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:4px}
.hdr-sub{font-size:14px;color:#94A3B8;line-height:1.5}
.hdr-btns{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap}

/* Buttons */
.btn-p{background:${G};color:#fff;border:none;border-radius:12px;padding:0 20px;height:42px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 4px 16px rgba(59,130,246,.25);transition:opacity .15s;-webkit-tap-highlight-color:transparent}
.btn-p:hover{opacity:.9}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;padding:0 18px;height:42px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;transition:all .15s;-webkit-tap-highlight-color:transparent}
.btn-s:hover{border-color:rgba(148,163,184,.40);color:#F8FAFC}

/* KPI */
.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.kpi-c{background:linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:16px;padding:16px 18px;transition:border-color .15s}
.kpi-c:hover{border-color:rgba(148,163,184,.28)}
.kpi-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748B;margin-bottom:6px}
.kpi-n{font-size:30px;font-weight:900;letter-spacing:-0.03em;line-height:1}

/* Abas e filtros */
.ctrl-row{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.aba{height:38px;padding:0 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);background:transparent;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.aba.on{background:rgba(59,130,246,.14);border-color:rgba(59,130,246,.35);color:#60A5FA}
.aba:hover:not(.on){border-color:rgba(148,163,184,.30);color:#94A3B8}
.filtros-row{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.filt{height:34px;padding:0 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.14);background:transparent;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.filt.on{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.28);color:#60A5FA}
.filt:hover:not(.on){color:#94A3B8}
.prof-sel{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:0 14px;height:36px;font-size:12px;color:#CBD5E1;font-family:inherit;cursor:pointer;outline:none;margin-left:auto}

/* Agendamento Card */
.dia-lbl{font-size:12px;font-weight:700;color:#64748B;text-transform:capitalize;margin:22px 0 10px;letter-spacing:.04em;display:flex;align-items:center;gap:8px}
.dia-lbl::after{content:'';flex:1;height:1px;background:rgba(148,163,184,.08)}
.ag-card{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:18px;padding:18px;margin-bottom:10px;display:grid;grid-template-columns:70px 1fr;gap:14px;transition:border-color .15s}
.ag-card:hover{border-color:rgba(148,163,184,.26)}
.hora-col{display:flex;flex-direction:column;align-items:center;gap:4px}
.hora-box{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.22);border-radius:10px;padding:8px 6px;width:58px;text-align:center}
.hora-txt{font-size:16px;font-weight:800;color:#60A5FA;letter-spacing:-0.01em;display:block}
.ag-col{min-width:0}
.ag-row1{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px}
.ag-nome{font-size:15px;font-weight:800;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.st-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;line-height:18px}
.ag-tel{font-size:12px;color:#CBD5E1;margin-bottom:4px;display:flex;align-items:center;gap:5px}
.ag-info-line{font-size:12px;color:#94A3B8;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ag-acoes{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.ac{border-radius:9px;padding:6px 11px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;transition:opacity .15s;text-decoration:none;display:inline-flex;align-items:center;gap:4px;-webkit-tap-highlight-color:transparent}
.ac:hover{opacity:.8}
.ac-mais{background:rgba(255,255,255,.04);border-color:rgba(148,163,184,.18);color:#94A3B8;position:relative}
.menu{position:absolute;top:calc(100% + 6px);left:0;background:rgba(10,15,25,.98);border:1px solid rgba(148,163,184,.20);border-radius:14px;padding:8px;min-width:170px;z-index:50;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.mi{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#CBD5E1;border:none;background:none;font-family:inherit;width:100%;text-align:left;white-space:nowrap;transition:background .1s;-webkit-tap-highlight-color:transparent}
.mi:hover{background:rgba(255,255,255,.06)}
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.97);border:1px solid rgba(59,130,246,.30);border-radius:12px;padding:12px 24px;font-size:13px;font-weight:600;color:#F8FAFC;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,.5);pointer-events:none}
.vazio{text-align:center;padding:60px 24px;background:linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;margin-top:8px}

/* Semana desktop */
.sem-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px}
.sem-periodo{font-size:14px;font-weight:700;color:#CBD5E1}
.sem-nav-btns{display:flex;gap:8px}
.sem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.sem-col{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.10);border-radius:12px;overflow:hidden;min-height:130px}
.sem-hdr{padding:8px 6px;text-align:center;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:1px solid rgba(148,163,184,.08);background:rgba(59,130,246,.05)}
.sem-hdr.hj{color:#60A5FA;background:rgba(59,130,246,.14)}
.sem-data{font-size:13px;font-weight:800;color:#F8FAFC;margin-top:2px}
.sem-item{background:rgba(59,130,246,.10);border-radius:6px;padding:4px 6px;margin:4px;font-size:10px;color:#93C5FD;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(59,130,246,.16);line-height:1.4}

/* Semana mobile = lista */
.sem-mob-dia{margin-bottom:16px}
.sem-mob-hdr{font-size:12px;font-weight:700;color:#60A5FA;margin-bottom:8px;text-transform:capitalize;padding-bottom:6px;border-bottom:1px solid rgba(59,130,246,.15)}
.sem-mob-item{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:12px 14px;margin-bottom:6px;display:flex;gap:12px;align-items:center}
.sem-mob-hora{font-size:13px;font-weight:800;color:#60A5FA;flex-shrink:0;min-width:40px}
.sem-mob-info{min-width:0}
.sem-mob-nome{font-size:13px;font-weight:700;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sem-mob-sub{font-size:11px;color:#64748B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sem-mob-vazio{font-size:12px;color:#334155;text-align:center;padding:12px}

@media(max-width:768px){
  .bdy{padding:16px 14px}
  .hdr{gap:12px}
  .hdr h1{font-size:22px}
  .hdr-btns{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .hdr-btns a,.hdr-btns button{width:100%;justify-content:center}
  .kpi{gap:8px}
  .kpi-c{padding:12px 10px}
  .kpi-n{font-size:24px}
  .kpi-lbl{font-size:9px}
  .ctrl-row{gap:6px}
  .filtros-row{gap:5px;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .filtros-row::-webkit-scrollbar{display:none}
  .prof-sel{margin-left:0;width:100%}
  .ag-card{grid-template-columns:54px 1fr;gap:10px;padding:14px}
  .hora-box{width:48px;padding:7px 4px}
  .hora-txt{font-size:14px}
  .ag-nome{font-size:14px}
  .ag-acoes{gap:5px}
  .ac{font-size:10px;padding:5px 9px}
  .sem-grid{display:none}
}
@media(min-width:769px){
  .sem-mob{display:none}
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
  const [menuId, setMenuId] = useState<string|null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => { load() }, [])

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null)
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
    const { data: a } = await supabase
      .from('agendamentos')
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
    setMenuId(null)
    toast('Status atualizado!')
  }

  function getTel(a: any) {
    return (a.cliente_whatsapp || a.cliente_telefone || '').replace(/\D/g, '')
  }

  function wppLink(a: any, tipo: 'confirmar'|'lembrete'|'contato') {
    const tel = getTel(a)
    if (!tel) return null
    const d = new Date(a.data_hora)
    const dt = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
    const hr = d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    let txt = ''
    if (tipo === 'confirmar') txt = 'Ola, '+a.cliente_nome+'! Seu agendamento foi confirmado.\n\nServico: '+(a.servicos?.nome||'')+'\nProfissional: '+(a.profissionais?.nome||'')+'\nData: '+dt+'\nHorario: '+hr+'\n\n'+(perfil?.nome_negocio||'')
    else if (tipo === 'lembrete') txt = 'Ola, '+a.cliente_nome+'! Passando para lembrar do seu agendamento.\n\nServico: '+(a.servicos?.nome||'')+'\nData: '+dt+'\nHorario: '+hr+'\n\nTe esperamos!\n'+(perfil?.nome_negocio||'')
    else txt = 'Ola, '+a.cliente_nome+'!'
    return 'https://wa.me/55'+tel+'?text='+encodeURIComponent(txt)
  }

  async function copiarContato(a: any) {
    const tel = a.cliente_whatsapp || a.cliente_telefone || ''
    if (!tel) { toast('Telefone nao informado'); return }
    try {
      await navigator.clipboard.writeText(tel)
      toast('Contato copiado!')
    } catch {
      toast('Nao foi possivel copiar')
    }
    setMenuId(null)
  }

  const agsHoje = ags.filter(a => new Date(a.data_hora).toISOString().split('T')[0] === hoje)
  const confirmados = agsHoje.filter(a => a.status === 'confirmado').length
  const pendentes = agsHoje.filter(a => !a.status || a.status === 'pendente').length

  const agsFiltrados = ags.filter(a => {
    const d = new Date(a.data_hora).toISOString().split('T')[0]
    if (view === 'hoje' && d !== hoje) return false
    if (fSt !== 'todos' && a.status !== fSt) return false
    if (fPr !== 'todos' && a.profissional_id !== fPr) return false
    return true
  })

  const grupos: Record<string, any[]> = {}
  agsFiltrados.forEach(a => {
    const d = new Date(a.data_hora).toISOString().split('T')[0]
    if (!grupos[d]) grupos[d] = []
    grupos[d].push(a)
  })

  function getInicioSemana(off: number) {
    const d = new Date(); d.setHours(0,0,0,0)
    d.setDate(d.getDate() - d.getDay() + off * 7)
    return d
  }
  const inicioSem = getInicioSemana(semOff)
  const diasSem = Array.from({length:7}, (_,i) => { const d = new Date(inicioSem); d.setDate(inicioSem.getDate()+i); return d })

  function CardAg({ a }: { a: any }) {
    const sc = statusCfg[a.status] || statusCfg.pendente
    const tel = getTel(a)
    const telFmt = fTel(a.cliente_whatsapp || a.cliente_telefone || '')
    const wppC = wppLink(a, 'confirmar')
    const wppL = wppLink(a, 'lembrete')
    const wppW = wppLink(a, 'contato')
    const aberto = menuId === a.id

    return (
      <div className="ag-card">
        <div className="hora-col">
          <div className="hora-box">
            <span className="hora-txt">{fH(a.data_hora)}</span>
          </div>
        </div>
        <div className="ag-col">
          <div className="ag-row1">
            <p className="ag-nome">{a.cliente_nome || '—'}</p>
            <span className="st-badge" style={{background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`}}>{sc.t}</span>
          </div>
          {telFmt ? (
            <p className="ag-tel">
              <span style={{color:'#64748B',fontSize:'11px'}}>📱</span>
              <span style={{color:'#CBD5E1'}}>{telFmt}</span>
            </p>
          ) : (
            <p className="ag-tel" style={{color:'#334155'}}>Sem telefone</p>
          )}
          <p className="ag-info-line">
            {a.servicos?.nome || 'Servico nao informado'}
            {a.profissionais?.nome ? ' · Prof. '+a.profissionais.nome : ''}
            {a.servicos?.preco ? <span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span> : null}
          </p>
          <div className="ag-acoes" ref={aberto ? menuRef : undefined}>
            {wppC && (a.status === 'pendente' || !a.status || a.status === 'retorno') && (
              <a href={wppC} target="_blank" rel="noreferrer" className="ac" style={{background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'}}>
                ✓ Confirmar
              </a>
            )}
            {wppL && (
              <a href={wppL} target="_blank" rel="noreferrer" className="ac" style={{background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'}}>
                🔔 Lembrete
              </a>
            )}
            {wppW && (
              <a href={wppW} target="_blank" rel="noreferrer" className="ac" style={{background:'rgba(37,211,102,.10)',borderColor:'rgba(37,211,102,.22)',color:'#25D366'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            <div style={{position:'relative'}}>
              <button className="ac ac-mais" onClick={()=>setMenuId(aberto?null:a.id)}>
                ··· Mais
              </button>
              {aberto && (
                <div className="menu">
                  <button className="mi" onClick={()=>copiarContato(a)}><span>📋</span> Copiar contato</button>
                  {a.status !== 'compareceu' && <button className="mi" onClick={()=>atualizarStatus(a.id,'compareceu')}><span style={{color:'#4ADE80'}}>✓</span> Compareceu</button>}
                  {a.status !== 'faltou' && <button className="mi" onClick={()=>atualizarStatus(a.id,'faltou')}><span style={{color:'#F87171'}}>✗</span> Faltou</button>}
                  {a.status !== 'realizado' && <button className="mi" onClick={()=>atualizarStatus(a.id,'realizado')}><span style={{color:'#22C55E'}}>★</span> Realizado</button>}
                  {a.status !== 'retorno' && <button className="mi" onClick={()=>atualizarStatus(a.id,'retorno')}><span style={{color:'#C4B5FD'}}>↩</span> Retorno</button>}
                  {a.status !== 'confirmado' && <button className="mi" onClick={()=>atualizarStatus(a.id,'confirmado')}><span style={{color:'#4ADE80'}}>✓</span> Confirmar</button>}
                  {a.status !== 'cancelado' && <button className="mi" onClick={()=>atualizarStatus(a.id,'cancelado')}><span style={{color:'#F87171'}}>✕</span> Cancelar</button>}
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
          <div>
            <h1>Agenda</h1>
            <p className="hdr-sub">Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
          </div>
          <div className="hdr-btns">
            <Link href="/painel/agendamentos/novo" className="btn-p">+ Novo agendamento</Link>
            <Link href="/painel/bloqueios" className="btn-s">Bloquear horario</Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi">
          <div className="kpi-c" style={{borderColor:'rgba(59,130,246,.20)'}}>
            <p className="kpi-lbl">Hoje</p>
            <p className="kpi-n" style={{color:'#60A5FA'}}>{agsHoje.length}</p>
          </div>
          <div className="kpi-c" style={{borderColor:'rgba(34,197,94,.18)'}}>
            <p className="kpi-lbl">Confirmados</p>
            <p className="kpi-n" style={{color:'#4ADE80'}}>{confirmados}</p>
          </div>
          <div className="kpi-c" style={{borderColor:'rgba(245,158,11,.18)'}}>
            <p className="kpi-lbl">Pendentes</p>
            <p className="kpi-n" style={{color:'#FCD34D'}}>{pendentes}</p>
          </div>
        </div>

        {/* Controles */}
        <div className="ctrl-row">
          <button className={'aba'+(view==='hoje'?' on':'')} onClick={()=>setView('hoje')}>Hoje</button>
          <button className={'aba'+(view==='semana'?' on':'')} onClick={()=>setView('semana')}>Semana</button>
          {view === 'hoje' && (
            <div className="filtros-row">
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

        {/* ABA HOJE */}
        {view === 'hoje' && (
          <div>
            <p className="dia-lbl">Proximos atendimentos de hoje</p>
            {agsFiltrados.length === 0 ? (
              <div className="vazio">
                <div style={{fontSize:'36px',marginBottom:'14px',opacity:.35}}>📅</div>
                <h3 style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum atendimento para hoje</h3>
                <p style={{fontSize:'13px',color:'#64748B',marginBottom:'22px',lineHeight:1.6}}>Quando seus clientes agendarem, os horarios aparecerão aqui.</p>
                <Link href="/painel/agendamentos/novo" className="btn-p" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
              </div>
            ) : (
              agsFiltrados.map(a => <CardAg key={a.id} a={a} />)
            )}
          </div>
        )}

        {/* ABA SEMANA — DESKTOP */}
        {view === 'semana' && (
          <div>
            <div className="sem-nav">
              <p className="sem-periodo">
                {fDataCurta(diasSem[0])} - {fDataCurta(diasSem[6])} {diasSem[6].getFullYear()}
              </p>
              <div className="sem-nav-btns">
                <button className="btn-s" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s-1)}>‹ Anterior</button>
                <button className="btn-s" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(0)}>Hoje</button>
                <button className="btn-s" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s+1)}>Proxima ›</button>
              </div>
            </div>

            {/* GRID SEMANA - desktop */}
            <div className="sem-grid">
              {diasSem.map((d,i) => {
                const dStr = d.toISOString().split('T')[0]
                const ehHoje = dStr === hoje
                const diasAgs = ags.filter(a => {
                  const ad = new Date(a.data_hora).toISOString().split('T')[0]
                  return ad === dStr && (fPr === 'todos' || a.profissional_id === fPr)
                })
                return (
                  <div key={i} className="sem-col">
                    <div className={'sem-hdr'+(ehHoje?' hj':'')}>
                      <div>{['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][d.getDay()]}</div>
                      <div className="sem-data">{d.getDate()}</div>
                    </div>
                    {diasAgs.map(a=>(
                      <div key={a.id} className="sem-item" title={a.cliente_nome+' - '+fH(a.data_hora)+' - '+(a.servicos?.nome||'')}>
                        {fH(a.data_hora)} {(a.cliente_nome||'').split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* LISTA SEMANA - mobile */}
            <div className="sem-mob">
              {diasSem.map((d,i) => {
                const dStr = d.toISOString().split('T')[0]
                const ehHoje = dStr === hoje
                const diasAgs = ags.filter(a => {
                  const ad = new Date(a.data_hora).toISOString().split('T')[0]
                  return ad === dStr && (fPr === 'todos' || a.profissional_id === fPr)
                })
                return (
                  <div key={i} className="sem-mob-dia">
                    <p className="sem-mob-hdr" style={{color:ehHoje?'#60A5FA':'#94A3B8'}}>
                      {d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}
                      {ehHoje ? ' · Hoje' : ''}
                    </p>
                    {diasAgs.length === 0 ? (
                      <p className="sem-mob-vazio">Nenhum atendimento</p>
                    ) : diasAgs.map(a=>(
                      <div key={a.id} className="sem-mob-item">
                        <span className="sem-mob-hora">{fH(a.data_hora)}</span>
                        <div className="sem-mob-info">
                          <p className="sem-mob-nome">{a.cliente_nome||'—'}</p>
                          <p className="sem-mob-sub">{a.servicos?.nome||''}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}</p>
                        </div>
                        <span className="st-badge" style={{fontSize:'9px',padding:'2px 7px',background:(statusCfg[a.status]||statusCfg.pendente).bg,color:(statusCfg[a.status]||statusCfg.pendente).c,border:`1px solid ${(statusCfg[a.status]||statusCfg.pendente).bd}`}}>
                          {(statusCfg[a.status]||statusCfg.pendente).t}
                        </span>
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
