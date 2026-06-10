'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, CalendarDays, CircleDollarSign, TrendingUp, Search } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}
.pill:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.28);color:#fff}
.pill.on{background:${G};border-color:transparent;color:#fff;box-shadow:0 0 16px rgba(124,58,237,.28)}
@media(max-width:1023px){
  .psb-main .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`
const FILTROS=['Todos','Hoje','Este mes','Pix','Cartao','Dinheiro','Parcial','Completo']
export default function Pagamentos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('Todos')
  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:pags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('pagamentos').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    ])
    setPerfil(p);setPagamentos(pags||[]);setLoading(false)
  }
  const nome=perfil?.nome_negocio||''
  const hoje=new Date().toISOString().split('T')[0]
  const mes=new Date().toISOString().slice(0,7)
  const fBRL=(v:number)=>`R$ ${(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const fData=(d:string)=>{if(!d)return'';const[a,m,di]=d.split('-');return`${di}/${m}/${a}`}
  const recMes=pagamentos.filter(p=>p.data?.startsWith(mes)).reduce((a,p)=>a+(p.valor||0),0)
  const recHoje=pagamentos.filter(p=>p.data===hoje).reduce((a,p)=>a+(p.valor||0),0)
  const parciais=pagamentos.filter(p=>p.tipo==='parcial').length
  const ticket=pagamentos.length>0?pagamentos.reduce((a,p)=>a+(p.valor||0),0)/pagamentos.length:0
  const filtrados=pagamentos.filter(p=>{
    const passaF=
      filtro==='Todos'||
      (filtro==='Hoje'&&p.data===hoje)||
      (filtro==='Este mes'&&p.data?.startsWith(mes))||
      (filtro==='Pix'&&p.forma==='Pix')||
      (filtro==='Cartao'&&p.forma?.toLowerCase().includes('cart'))||
      (filtro==='Dinheiro'&&p.forma==='Dinheiro')||
      (filtro==='Parcial'&&p.tipo==='parcial')||
      (filtro==='Completo'&&p.tipo==='completo')
    const passaB=!busca||[p.cliente_nome,p.forma,p.referencia].some((v:string)=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })
  // Agrupar por mes
  const grupos:Record<string,any[]>={}
  filtrados.forEach(p=>{
    const k=p.data?.slice(0,7)||'sem-data'
    if(!grupos[k])grupos[k]=[]
    grupos[k].push(p)
  })
  const mesesOrdenados=Object.keys(grupos).sort((a,b)=>b.localeCompare(a))
  function nomeMes(ym:string){
    if(ym==='sem-data')return'Sem data'
    const [a,m]=ym.split('-')
    const nomes=['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    return `${nomes[parseInt(m)-1]} de ${a}`
  }
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={nome} tituloMobile="Pagamentos"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">
          <div style={{marginBottom:'24px'}}>
            <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Pagamentos</h1>
            <p style={{fontSize:'13px',color:'#64748B'}}>Historico de valores recebidos e pagamentos confirmados.</p>
          </div>
          <div className="kpi-grid">
            {[
              {l:'RECEBIDO NO MES',sub:'Total confirmado',v:fBRL(recMes),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.28)',I:CheckCircle2},
              {l:'RECEBIDO HOJE',sub:'Entradas do dia',v:fBRL(recHoje),c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.28)',I:CalendarDays},
              {l:'PARCIAIS',sub:'Recebimentos incompletos',v:parciais,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.28)',I:CircleDollarSign},
              {l:'TICKET MEDIO',sub:'Media por pagamento',v:fBRL(ticket),c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.28)',I:TrendingUp},
            ].map(k=>(
              <div key={k.l} className="crd" style={{padding:'18px 16px',background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px'}}><k.I size={18} color={k.c}/></div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'6px'}}>{k.sub}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
              </div>
            ))}
          </div>
          <div style={{position:'relative',marginBottom:'12px'}}>
            <Search size={15} color="#64748B" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input type="text" placeholder="Buscar pagamento, cliente, forma ou referencia..." value={busca} onChange={e=>setBusca(e.target.value)}
              style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'11px 16px 11px 42px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as any}}/>
          </div>
          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none' as any,paddingBottom:'4px',marginBottom:'20px'}}>
            {FILTROS.map(f=>(<button key={f} onClick={()=>setFiltro(f)} className={`pill${filtro===f?' on':''}`}>{f}</button>))}
          </div>
          {filtrados.length===0?(
            <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'60px',height:'60px',borderRadius:'18px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}><CircleDollarSign size={26} color="#4ADE80"/></div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum pagamento registrado</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,maxWidth:'380px',margin:'0 auto'}}>Quando um pagamento for confirmado em uma cobranca ou orcamento, ele aparecera aqui no historico.</p>
            </div>
          ):(
            <div>
              {filtrados.length>0&&(
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.18)',borderRadius:'12px',marginBottom:'20px',flexWrap:'wrap',gap:'8px'}}>
                  <p style={{fontSize:'12px',color:'#64748B'}}>{filtrados.length} pagamento{filtrados.length!==1?'s':''}</p>
                  <p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>Total: {fBRL(filtrados.reduce((a,p)=>a+(p.valor||0),0))}</p>
                </div>
              )}
              {mesesOrdenados.map(ym=>(
                <div key={ym} style={{marginBottom:'28px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{nomeMes(ym)}</p>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>{fBRL(grupos[ym].reduce((a,p)=>a+(p.valor||0),0))}</p>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {grupos[ym].map(p=>{
                      const isParcial=p.tipo==='parcial'
                      return(
                        <div key={p.id} className="crd" style={{padding:'16px 20px'}}>
                          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>{p.cliente_nome}</p>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                                <span style={{fontSize:'12px',color:'#64748B'}}>{p.forma}</span>
                                {p.data&&<><span style={{fontSize:'10px',color:'#374151'}}>·</span><span style={{fontSize:'12px',color:'#64748B'}}>{fData(p.data)}</span></>}
                                {p.referencia&&<><span style={{fontSize:'10px',color:'#374151'}}>·</span><span style={{fontSize:'12px',color:'#94A3B8',fontStyle:'italic'}}>{p.referencia}</span></>}
                              </div>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px',flexShrink:0}}>
                              <p style={{fontSize:'20px',fontWeight:800,color:'#4ADE80',lineHeight:1}}>{fBRL(p.valor)}</p>
                              <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:isParcial?'rgba(124,58,237,.14)':'rgba(34,197,94,.14)',color:isParcial?'#C4B5FD':'#4ADE80',border:`1px solid ${isParcial?'rgba(124,58,237,.28)':'rgba(34,197,94,.28)'}`}}>
                                {isParcial?'Parcial':'Recebido'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div></div>
      </div>
    </div>
  )
}
