'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_COR: Record<string,{bg:string;color:string;border:string}> = {
  'Aberto':               {bg:'rgba(59,130,246,.15)',  color:'#60A5FA', border:'rgba(59,130,246,.35)'},
  'Aguardando aprovação': {bg:'rgba(245,158,11,.15)',  color:'#FACC15', border:'rgba(245,158,11,.35)'},
  'Em andamento':         {bg:'rgba(124,58,237,.15)',  color:'#A78BFA', border:'rgba(124,58,237,.35)'},
  'Parcialmente pago':    {bg:'rgba(249,115,22,.15)',  color:'#FB923C', border:'rgba(249,115,22,.35)'},
  'Pago':                 {bg:'rgba(34,197,94,.15)',   color:'#22C55E', border:'rgba(34,197,94,.35)'},
  'Finalizado':           {bg:'rgba(34,197,94,.12)',   color:'#22C55E', border:'rgba(34,197,94,.28)'},
  'Cancelado':            {bg:'rgba(239,68,68,.15)',   color:'#F87171', border:'rgba(239,68,68,.35)'},
}
const PROC_STATUS_COR: Record<string,{bg:string;color:string;border:string}> = {
  'Planejado':    {bg:'rgba(99,102,241,.15)',  color:'#818cf8', border:'rgba(99,102,241,.35)'},
  'Em andamento': {bg:'rgba(245,158,11,.15)',  color:'#FBBF24', border:'rgba(245,158,11,.35)'},
  'Concluído':    {bg:'rgba(34,197,94,.15)',   color:'#4ADE80', border:'rgba(34,197,94,.35)'},
  'Pago':         {bg:'rgba(34,197,94,.12)',   color:'#22C55E', border:'rgba(34,197,94,.28)'},
}
const DENTES_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const DENTES_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
const PAGE_SIZE = 20

function getMesesDisponiveis(){
  const meses=[]
  const agora=new Date()
  for(let i=0;i<24;i++){
    const d=new Date(agora.getFullYear(),agora.getMonth()-i,1)
    const fim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate()
    meses.push({
      label:d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}),
      key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      ini:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01T00:00:00`,
      fim:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(fim).padStart(2,'0')}T23:59:59`,
    })
  }
  return meses
}

function getPeriodo(tipo:string, mesKey:string){
  const agora=new Date()
  if(tipo==='mes'){
    const [ano,mes]=mesKey.split('-').map(Number)
    const fim=new Date(ano,mes,0).getDate()
    return{ini:`${mesKey}-01T00:00:00`,fim:`${mesKey}-${String(fim).padStart(2,'0')}T23:59:59`}
  }
  if(tipo==='7d'){const d=new Date(agora);d.setDate(d.getDate()-7);return{ini:d.toISOString(),fim:agora.toISOString()}}
  if(tipo==='30d'){const d=new Date(agora);d.setDate(d.getDate()-30);return{ini:d.toISOString(),fim:agora.toISOString()}}
  if(tipo==='ano'){return{ini:`${agora.getFullYear()}-01-01T00:00:00`,fim:`${agora.getFullYear()}-12-31T23:59:59`}}
  return null
}


function fmtBRL(v:number){return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
function fmtData(d:string){if(!d)return '';const[a,m,di]=d.split('-');return `${di}/${m}/${a}`}
function aplicarMascaraTel(v:string){
  const n=v.replace(/\D/g,'').slice(0,11)
  if(n.length>10)return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if(n.length>6) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if(n.length>2) return `(${n.slice(0,2)}) ${n.slice(2)}`
  if(n.length>0) return `(${n}`
  return ''
}

const CSS = `
  html,body{overflow-x:hidden;width:100%;background:#050B16}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  input,select,textarea{color-scheme:dark}
  select option{background:#07111F;color:#F8FAFC}
  .od-footer{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(5,11,22,.97);border-top:1px solid rgba(148,163,184,.12);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));z-index:25;flex-direction:column;gap:6px;backdrop-filter:blur(20px)}
  @media(min-width:1024px){.od-footer{display:none!important}.od-resumo-mob{display:none!important}.od-tbl-mob{display:none!important}}
  @media(max-width:1023px){
    .od-footer{display:flex!important}
    .od-2col{grid-template-columns:1fr!important}
    .od-bdy{padding:12px 12px 140px!important}
    .od-tbl-desk{display:none!important}
    .od-tbl-mob{display:flex!important;flex-direction:column!important;gap:6px!important}
  .od-scroll-wrap{position:relative}
  .od-scroll-wrap::before,.od-scroll-wrap::after{content:'';position:absolute;top:0;bottom:8px;width:24px;z-index:3;pointer-events:none}
  .od-scroll-wrap::before{left:0;background:linear-gradient(to right,rgba(8,20,33,.9),transparent)}
  .od-scroll-wrap::after{right:0;background:linear-gradient(to left,rgba(8,20,33,.9),transparent)}
  .od-scroll{-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .od-scroll::-webkit-scrollbar{display:none}
  @media(min-width:1024px){.od-hint{display:none!important}.od-scroll-wrap::before,.od-scroll-wrap::after{display:none!important}}
    .od-kpi{grid-template-columns:1fr 1fr!important}
    .od-add-grid{grid-template-columns:1fr 1fr!important}
  }
  .dt{position:relative;width:32px;height:44px;cursor:pointer;flex-shrink:0;font-family:inherit;padding:0;background:none;border:none;transition:transform .13s;display:flex;align-items:center;justify-content:center;outline:none}
  .dt:hover{transform:translateY(-3px) scale(1.1)}
  .dt.s{transform:translateY(-4px) scale(1.14)}
  .pchip{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;transition:all .15s}
`

export default function Orcamentos(){
  const [userId,setUserId]=useState('')
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [orcTotal,setOrcTotal]=useState(0)
  const [loadingMore,setLoadingMore]=useState(false)
  const [page,setPage]=useState(0)
  const [hasMore,setHasMore]=useState(false)
  const [kpis,setKpis]=useState({aberto:0,aReceber:0,recebido:0,parciais:0})
  const mesesOpcoes=getMesesDisponiveis()
  const [periodoTipo,setPeriodoTipo]=useState<'mes'|'7d'|'30d'|'ano'|'todo'>('mes')
  const [mesKey,setMesKey]=useState(mesesOpcoes[0].key)
  const [filtroStatus,setFiltroStatus]=useState('Todos')
  const [filtroCliente,setFiltroCliente]=useState('')
  const [view,setView]=useState<'lista'|'escolha'|'form'|'odonto'|'detalhe'>('lista')
  const [editandoId,setEditandoId]=useState<string|null>(null)
  const [detalheId,setDetalheId]=useState<string|null>(null)
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [mensagem,setMensagem]=useState('')
  // Form comum
  const [clienteNome,setClienteNome]=useState('')
  const [clienteWpp,setClienteWpp]=useState('')
  const [clienteEmail,setClienteEmail]=useState('')
  const [tipo,setTipo]=useState('Orçamento')
  const [tipoOutro,setTipoOutro]=useState('')
  const [profId,setProfId]=useState('')
  const [dataDoc,setDataDoc]=useState(new Date().toISOString().split('T')[0])
  const [status,setStatus]=useState('Aberto')
  const [itens,setItens]=useState<any[]>([{nome:'',qtd:1,unitario:'',total:0,obs:''}])
  const [desconto,setDesconto]=useState('')
  const [observacoes,setObservacoes]=useState('')
  const [showDetalhes,setShowDetalhes]=useState(false)
  // Modal pagamento
  const [modalPagOrc,setModalPagOrc]=useState<any>(null)
  const [modalValor,setModalValor]=useState('')
  const [modalForma,setModalForma]=useState('Pix')
  const [modalObs,setModalObs]=useState('')
  const [modalErro,setModalErro]=useState('')
  const [modalSaving,setModalSaving]=useState(false)
  // Detalhe
  const [showPagForm,setShowPagForm]=useState(false)
  const [pagData,setPagData]=useState(new Date().toISOString().split('T')[0])
  const [pagValor,setPagValor]=useState('')
  const [pagForma,setPagForma]=useState('Pix')
  const [pagObs,setPagObs]=useState('')
  const [savingPag,setSavingPag]=useState(false)
  // Odonto
  const [odNome,setOdNome]=useState('')
  const [odWpp,setOdWpp]=useState('')
  const [odEmail,setOdEmail]=useState('')
  const [odProfId,setOdProfId]=useState('')
  const [odData,setOdData]=useState(new Date().toISOString().split('T')[0])
  const [odStatus,setOdStatus]=useState('Aberto')
  const [odObs,setOdObs]=useState('')
  const [odDetOpen,setOdDetOpen]=useState(false)
  const [odPagOpen,setOdPagOpen]=useState(false)
  // Odontograma
  const [dentesSelec,setDentesSelec]=useState<number[]>([])
  // Linha de adicao rapida
  const [addProc,setAddProc]=useState('')
  const [addValor,setAddValor]=useState('')
  const [addQtdManual,setAddQtdManual]=useState(1)
  // Linhas de procedimentos
  const [linhas,setLinhas]=useState<any[]>([])
  // Desconto odonto
  const [odDesconto,setOdDesconto]=useState('')
  // Pagamentos odonto
  const [odHistPags,setOdHistPags]=useState<any[]>([])
  const [odPagValor,setOdPagValor]=useState('')
  const [odPagForma,setOdPagForma]=useState('Pix')
  const [odPagObs,setOdPagObs]=useState('')

  const searchParams=useSearchParams()
  useEffect(()=>{init()},[])
  useEffect(()=>{if(searchParams.get('novo')==='1'){resetAll();setView('escolha')}},[searchParams])
  useEffect(()=>{if(userId&&view==='lista'){setPage(0);carregarOrcamentos(userId,0,true)}},[periodoTipo,mesKey,filtroStatus,filtroCliente,userId])

  async function init(){
    const{data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const{data:p}=await supabase.from('perfis').select('*').eq('user_id',user.id).single()
    setPerfil(p)
    const{data:pr}=await supabase.from('profissionais').select('id,nome').eq('user_id',user.id)
    setProfissionais(pr||[])
    await carregarOrcamentos(user.id)
    setLoading(false)
  }
  const buildQuery=useCallback((uid:string)=>{
    let q=supabase.from('orcamentos').select('*',{count:'exact'}).eq('user_id',uid)
    const periodo=getPeriodo(periodoTipo,mesKey)
    if(periodo){q=q.gte('created_at',periodo.ini).lte('created_at',periodo.fim)}
    if(filtroStatus!=='Todos')q=q.eq('status',filtroStatus)
    if(filtroCliente.trim())q=q.ilike('cliente_nome',`%${filtroCliente.trim()}%`)
    return q.order('created_at',{ascending:false})
  },[periodoTipo,mesKey,filtroStatus,filtroCliente])

  async function carregarOrcamentos(uid?:string,pg=0,reset=false){
    const id=uid||userId;if(!id)return
    if(pg===0)setLoading(true);else setLoadingMore(true)
    const from=pg*PAGE_SIZE,to=from+PAGE_SIZE-1
    const{data,count}=await buildQuery(id).range(from,to)
    const lista=data||[]
    if(reset||pg===0){setOrcamentos(lista)}else{setOrcamentos(prev=>[...prev,...lista])}
    setHasMore((count||0)>from+lista.length);setPage(pg)
    const{data:ap}=await buildQuery(id).select('status,saldo_restante,valor_pago')
    const apd=ap||[]
    setKpis({
      aberto:apd.filter((o:any)=>['Aberto','Em andamento','Parcialmente pago'].includes(o.status)).length,
      aReceber:apd.filter((o:any)=>!['Pago','Finalizado','Cancelado'].includes(o.status)).reduce((a:number,o:any)=>a+(o.saldo_restante||0),0),
      recebido:apd.filter((o:any)=>(o.valor_pago||0)>0).reduce((a:number,o:any)=>a+(o.valor_pago||0),0),
      parciais:apd.filter((o:any)=>o.status==='Parcialmente pago').length,
    })
    if(pg===0)setLoading(false);else setLoadingMore(false)
  }
  async function carregarPagamentos(orcId:string){
    const{data}=await supabase.from('orcamento_pagamentos').select('*').eq('orcamento_id',orcId).order('data',{ascending:false})
    setPagamentos(data||[])
  }
  function resetAll(){
    setClienteNome('');setClienteWpp('');setClienteEmail('')
    setTipo('Orçamento');setTipoOutro('');setProfId('')
    setDataDoc(new Date().toISOString().split('T')[0]);setStatus('Aberto')
    setItens([{nome:'',qtd:1,unitario:'',total:0,obs:''}]);setDesconto('');setObservacoes('')
    setShowDetalhes(false);setEditandoId(null)
    setOdNome('');setOdWpp('');setOdEmail('');setOdProfId('');setOdObs('')
    setOdData(new Date().toISOString().split('T')[0]);setOdStatus('Aberto')
    setDentesSelec([]);setLinhas([]);setAddProc('');setAddValor('');setAddQtdManual(1)
    setOdDesconto('');setOdHistPags([]);setOdPagValor('');setOdPagForma('Pix');setOdPagObs('')
    setOdDetOpen(false);setOdPagOpen(false);setShowPagForm(false)
  }

  // Calculos comum
  function atualizarItem(idx:number,campo:string,val:any){
    setItens(prev=>{
      const n=[...prev];n[idx]={...n[idx],[campo]:val}
      if(campo==='unitario'||campo==='qtd')n[idx].total=parseFloat(n[idx].unitario||'0')*(parseInt(n[idx].qtd)||1)
      return n
    })
  }
  const subtotal=itens.reduce((a,i)=>a+(parseFloat(i.unitario||'0')*(parseInt(i.qtd)||1)),0)
  const descontoNum=parseFloat(desconto||'0')
  const total=Math.max(0,subtotal-descontoNum)

  // Calculos odonto
  const odSubtotal=linhas.reduce((a,l)=>a+(l.total||0),0)
  const odDescontoNum=parseFloat(odDesconto||'0')
  const odTotal=Math.max(0,odSubtotal-odDescontoNum)
  const odPago=odHistPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const odSaldo=Math.max(0,odTotal-odPago)

  // Qtd automatica
  const addQtd=dentesSelec.length>0?dentesSelec.length:addQtdManual

  function adicionarLinha(){
    if(!addProc.trim()||!addValor||parseFloat(addValor)<=0)return
    const qtd=addQtd
    const vu=parseFloat(addValor)||0
    setLinhas(prev=>[...prev,{
      proc:addProc.trim(),
      dentes:[...dentesSelec],
      qtd,
      valorUnit:vu,
      total:qtd*vu,
      status:'Planejado',
    }])
    setAddProc('');setAddValor('');setAddQtdManual(1);setDentesSelec([])
  }

  function removerLinha(idx:number){setLinhas(prev=>prev.filter((_,i)=>i!==idx))}
  function editarLinha(idx:number){
    const l=linhas[idx]
    setAddProc(l.proc);setAddValor(String(l.valorUnit));setAddQtdManual(l.qtd)
    setDentesSelec(l.dentes||[]);removerLinha(idx)
  }

  function adicionarPagOdonto(){
    const v=parseFloat(odPagValor)||0
    if(v<=0)return
    setOdHistPags(prev=>[...prev,{valor:v,forma:odPagForma,obs:odPagObs.trim(),data:new Date().toISOString().split('T')[0]}])
    setOdPagValor('');setOdPagObs('')
  }

  // Classe do dente
  function denteCls(n:number):string{
    if(dentesSelec.includes(n))return 'dt s'
    const usados=linhas.some(l=>l.dentes?.includes(n))
    if(usados)return 'dt usado'
    return 'dt'
  }

  async function handleSalvarComum(){
    setMensagem('')
    const erros:string[]=[]
    if(!clienteNome.trim())erros.push('Informe o nome do cliente.')
    if(!clienteWpp||clienteWpp.replace(/\D/g,'').length<10)erros.push('Informe o WhatsApp com DDD.')
    const itensValidos=itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0)
    if(itensValidos.length===0)erros.push('Adicione pelo menos um serviço.')
    if(erros.length>0){setMensagem(erros.join(' | '));window.scrollTo({top:0,behavior:'smooth'});return}
    const payload={
      user_id:userId,cliente_nome:clienteNome.trim(),cliente_whatsapp:clienteWpp.replace(/\D/g,''),
      cliente_email:clienteEmail||null,
      tipo:tipo==='__outro__'?(tipoOutro.trim()||'Outro'):tipo,
      profissional_id:profId||null,
      profissional_nome:profId?(profissionais.find(p=>p.id===profId)?.nome||null):null,
      data:dataDoc,status,servicos:itensValidos,subtotal,desconto:descontoNum,total,
      valor_pago:0,saldo_restante:total,observacoes:observacoes||null,
      updated_at:new Date().toISOString(),
    }
    if(editandoId){await supabase.from('orcamentos').update(payload).eq('id',editandoId)}
    else{await supabase.from('orcamentos').insert(payload)}
    resetAll();setView('lista');await carregarOrcamentos(userId,0,true)
    setMensagem(editandoId?'Orçamento atualizado com sucesso!':'Orçamento salvo com sucesso!');setTimeout(()=>setMensagem(''),4000)
  }

  async function handleSalvarOdonto(){
    setMensagem('')
    if(!odNome.trim()){setMensagem('Informe o nome do paciente.');window.scrollTo({top:0,behavior:'smooth'});return}
    if(!odWpp||odWpp.replace(/\D/g,'').length<10){setMensagem('Informe o WhatsApp.');window.scrollTo({top:0,behavior:'smooth'});return}
    if(linhas.length===0){setMensagem('Adicione pelo menos um procedimento.');window.scrollTo({top:0,behavior:'smooth'});return}
    if(odTotal<=0){setMensagem('O total do orçamento precisa ser maior que zero.');window.scrollTo({top:0,behavior:'smooth'});return}
    const payload={
      user_id:userId,cliente_nome:odNome.trim(),cliente_whatsapp:odWpp.replace(/\D/g,''),
      cliente_email:odEmail||null,tipo:'Orçamento Odontológico',
      profissional_id:odProfId||null,
      profissional_nome:odProfId?(profissionais.find(p=>p.id===odProfId)?.nome||null):null,
      data:odData,status:odPago>=odTotal&&odTotal>0?'Pago':odPago>0?'Parcialmente pago':odStatus,servicos:[],subtotal:odSubtotal,desconto:odDescontoNum,total:odTotal,
      valor_pago:odPago,saldo_restante:odSaldo,
      procedimentos_odonto:linhas,hist_pagamentos:odHistPags,
      observacoes:odObs||null,updated_at:new Date().toISOString(),
    }
    if(editandoId){await supabase.from('orcamentos').update(payload).eq('id',editandoId)}
    else{await supabase.from('orcamentos').insert(payload)}
    resetAll();setView('lista');await carregarOrcamentos(userId,0,true)
    setMensagem(editandoId?'Orçamento atualizado com sucesso!':'Orçamento odontológico salvo com sucesso!');setTimeout(()=>setMensagem(''),5000)
  }

  function abrirEditar(orc:any){
    setEditandoId(orc.id)
    const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
    if(isOd){
      setOdNome(orc.cliente_nome||'');setOdWpp(aplicarMascaraTel(orc.cliente_whatsapp||''))
      setOdEmail(orc.cliente_email||'');setOdProfId(orc.profissional_id||'')
      setOdData(orc.data||new Date().toISOString().split('T')[0]);setOdStatus(orc.status||'Em andamento')
      setLinhas(orc.procedimentos_odonto||[]);setOdHistPags(orc.hist_pagamentos||[])
      setOdObs(orc.observacoes||'');setView('odonto')
    }else{
      setClienteNome(orc.cliente_nome||'');setClienteWpp(aplicarMascaraTel(orc.cliente_whatsapp||''))
      setClienteEmail(orc.cliente_email||'')
      const tp=orc.tipo||'Orçamento'
      const tps=['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno']
      if(tps.includes(tp)){setTipo(tp);setTipoOutro('')}else{setTipo('__outro__');setTipoOutro(tp)}
      setProfId(orc.profissional_id||'');setDataDoc(orc.data||new Date().toISOString().split('T')[0])
      setStatus(orc.status||'Aberto')
      setItens(orc.servicos?.length?orc.servicos:[{nome:'',qtd:1,unitario:'',total:0,obs:''}])
      setDesconto(orc.desconto?String(orc.desconto):'');setObservacoes(orc.observacoes||'')
      setShowDetalhes(true);setView('form')
    }
  }

  async function handleExcluir(id:string){
    if(!window.confirm('Excluir este orçamento?'))return
    await supabase.from('orcamentos').delete().eq('id',id)
    await carregarOrcamentos(userId,0,true)
  }
  function abrirModalPag(orc:any){
    setModalPagOrc(orc);setModalValor((orc.saldo_restante||0).toFixed(2).replace('.',','))
    setModalForma('Pix');setModalObs('');setModalErro('')
  }
  async function confirmarPagamentoModal(){
    if(!modalPagOrc)return
    const valor=parseFloat((modalValor||'0').replace(/\./g,'').replace(',','.'))||0
    if(valor<=0){setModalErro('Informe um valor maior que zero.');return}
    const saldo=modalPagOrc.saldo_restante||0
    if(valor>saldo+0.01){setModalErro('Valor maior que o saldo restante.');return}
    setModalSaving(true);setModalErro('')
    const nv=(modalPagOrc.valor_pago||0)+valor
    const ns=Math.max(0,(modalPagOrc.total||0)-nv)
    const nst=ns<0.01?'Pago':'Parcialmente pago'
    try{await supabase.from('orcamento_pagamentos').insert({orcamento_id:modalPagOrc.id,user_id:userId,data:new Date().toISOString().split('T')[0],valor,forma:modalForma,observacao:modalObs||null})}catch(e){}
    // Não inserir em 'pagamentos' - orcamento_pagamentos é a fonte única para o relatório
    await supabase.from('orcamentos').update({valor_pago:nv,saldo_restante:ns,status:nst,updated_at:new Date().toISOString()}).eq('id',modalPagOrc.id)
    setOrcamentos(prev=>prev.map(o=>o.id===modalPagOrc.id?{...o,valor_pago:nv,saldo_restante:ns,status:nst}:o))
    setModalSaving(false);setModalPagOrc(null)
    setMensagem(nst==='Pago'?'Pagamento confirmado!':'Pagamento parcial registrado!')
    setTimeout(()=>setMensagem(''),4000)
  }
  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'');if(!tel)return
    const msg=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }
  function gerarPDF(orc:any){
    const win=window.open('','_blank');if(!win)return
    const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
    const neg=perfil?.nome_negocio||'Negócio'
    const fmtMoeda=(v:number)=>`R$\u00a0${fmtBRL(v)}`
    // Status badge
    const statusCores:Record<string,{bg:string,color:string}>={
      'Aberto':           {bg:'#EFF6FF',color:'#1D4ED8'},
      'Aguardando aprovação':{bg:'#FFFBEB',color:'#B45309'},
      'Em andamento':     {bg:'#F5F3FF',color:'#6D28D9'},
      'Parcialmente pago':{bg:'#FFF7ED',color:'#C2410C'},
      'Pago':             {bg:'#F0FDF4',color:'#15803D'},
      'Finalizado':       {bg:'#F0FDF4',color:'#15803D'},
      'Cancelado':        {bg:'#FEF2F2',color:'#B91C1C'},
      'Rascunho':         {bg:'#F8FAFC',color:'#64748B'},
    }
    const stCor=statusCores[orc.status]||{bg:'#F8FAFC',color:'#475569'}
    // Linhas da tabela
    const linhasComum=(orc.servicos||[]).filter((s:any)=>s.nome).map((s:any,i:number)=>`
      <tr style="background:${i%2===0?'#fff':'#F8FAFC'}">
        <td style="padding:10px 14px;font-size:13px;color:#1E293B;font-weight:500">${s.nome}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center">${s.qtd||1}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:right">${fmtMoeda(parseFloat(s.unitario||'0'))}</td>
        <td style="padding:10px 14px;font-size:13px;color:#1E293B;font-weight:700;text-align:right">${fmtMoeda(s.total||0)}</td>
      </tr>
      ${s.obs?`<tr style="background:${i%2===0?'#fff':'#F8FAFC'}"><td colspan="4" style="padding:2px 14px 8px;font-size:11px;color:#94A3B8;font-style:italic">${s.obs}</td></tr>`:''}
    `).join('')
    const linhasOdonto=(orc.procedimentos_odonto||[]).map((l:any,i:number)=>`
      <tr style="background:${i%2===0?'#fff':'#F8FAFC'}">
        <td style="padding:10px 14px;font-size:13px;color:#1E293B;font-weight:500">${l.proc||l.nome||''}</td>
        <td style="padding:10px 14px;font-size:12px;color:#6D28D9">${(l.dentes||[]).length>0?(l.dentes||[]).sort((a:number,b:number)=>a-b).join(', '):'Geral'}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center">${l.qtd||1}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:right">${fmtMoeda(l.valorUnit||0)}</td>
        <td style="padding:10px 14px;font-size:13px;color:#1E293B;font-weight:700;text-align:right">${fmtMoeda(l.total||0)}</td>
      </tr>
    `).join('')
    const agora=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
    const html=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${isOd?'Orçamento Odontológico':'Orçamento'} - ${neg}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#fff;color:#1E293B;font-size:14px;line-height:1.5}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{max-width:800px;margin:0 auto;padding:0}
  /* Cabeçalho */
  .hdr{background:linear-gradient(135deg,#1E3A5F 0%,#2D1B69 100%);padding:32px 40px;position:relative;overflow:hidden}
  .hdr::after{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.05)}
  .hdr::before{content:'';position:absolute;bottom:-40px;left:40px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04)}
  .hdr-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
  .hdr-left h1{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;margin-bottom:3px}
  .hdr-left .doc-type{font-size:13px;color:rgba(255,255,255,.65);font-weight:500;margin-bottom:12px}
  .hdr-left .contact-row{font-size:11px;color:rgba(255,255,255,.55);margin-top:3px}
  .hdr-right{text-align:right;flex-shrink:0}
  .hdr-right .doc-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .hdr-right .doc-date{font-size:14px;font-weight:700;color:#fff}
  .status-badge{display:inline-block;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em;margin-top:10px;background:${stCor.bg};color:${stCor.color}}
  /* Seções */
  .body{padding:0 40px 40px}
  .section{margin-top:28px}
  .section-title{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #E2E8F0}
  /* Cards de info */
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .info-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px}
  .info-box h3{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
  .info-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
  .info-row .label{color:#64748B}
  .info-row .value{color:#1E293B;font-weight:600;text-align:right;max-width:65%}
  /* Tabela */
  .tbl-wrap{border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-top:4px}
  .tbl-hdr{display:grid;padding:10px 14px;background:linear-gradient(135deg,#1E3A5F,#2D1B69)}
  .tbl-hdr span{font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em}
  table{width:100%;border-collapse:collapse}
  /* Financeiro */
  .fin-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;margin-top:4px}
  .fin-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9}
  .fin-row:last-child{border-bottom:none}
  .fin-row .fl{color:#64748B}
  .fin-row .fv{color:#1E293B;font-weight:600}
  .fin-total{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:14px 18px;background:linear-gradient(135deg,#1E3A5F,#2D1B69);border-radius:10px}
  .fin-total .ft-label{font-size:13px;font-weight:700;color:rgba(255,255,255,.8)}
  .fin-total .ft-value{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em}
  .fin-pago{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:12px 16px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px}
  .fin-saldo{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:12px 16px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px}
  /* Obs */
  .obs-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;margin-top:4px;font-size:12px;color:#475569;line-height:1.7}
  /* Footer */
  .footer{margin-top:32px;padding:16px 40px;background:#F8FAFC;border-top:1.5px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center}
  .footer .fl{font-size:11px;color:#94A3B8}
  .footer .fr{font-size:11px;color:#94A3B8;text-align:right}
  .footer strong{color:#475569}
</style>
</head>
<body>
<div class="page">

  <!-- CABEÇALHO -->
  <div class="hdr">
    <div class="hdr-inner">
      <div class="hdr-left">
        <h1>${neg}</h1>
        <div class="doc-type">${isOd?'Orçamento Odontológico':'Orçamento comercial'}</div>
        ${perfil?.telefone?`<div class="contact-row">📞 ${perfil.telefone}</div>`:''}
        ${perfil?.email?`<div class="contact-row">✉ ${perfil.email}</div>`:''}
        <span class="status-badge">${orc.status||'Aberto'}</span>
      </div>
      <div class="hdr-right">
        <div class="doc-label">Data do orçamento</div>
        <div class="doc-date">${fmtData(orc.data)}</div>
        ${orc.id?`<div class="contact-row" style="color:rgba(255,255,255,.45);font-size:10px;margin-top:6px">#${orc.id.substring(0,8).toUpperCase()}</div>`:''}
      </div>
    </div>
  </div>

  <div class="body">

    <!-- DADOS -->
    <div class="section">
      <div class="section-title">${isOd?'Dados do paciente e tratamento':'Dados do cliente e orçamento'}</div>
      <div class="info-grid">
        <div class="info-box">
          <h3>${isOd?'Paciente':'Cliente'}</h3>
          <div class="info-row"><span class="label">Nome</span><span class="value">${orc.cliente_nome}</span></div>
          ${orc.cliente_whatsapp?`<div class="info-row"><span class="label">WhatsApp</span><span class="value">${aplicarMascaraTel(orc.cliente_whatsapp)}</span></div>`:''}
          ${orc.cliente_email?`<div class="info-row"><span class="label">E-mail</span><span class="value">${orc.cliente_email}</span></div>`:''}
        </div>
        <div class="info-box">
          <h3>${isOd?'Tratamento':'Orçamento'}</h3>
          <div class="info-row"><span class="label">Tipo</span><span class="value">${orc.tipo}</span></div>
          <div class="info-row"><span class="label">Data</span><span class="value">${fmtData(orc.data)}</span></div>
          ${orc.profissional_nome?`<div class="info-row"><span class="label">Profissional</span><span class="value">${orc.profissional_nome}</span></div>`:''}
          <div class="info-row"><span class="label">Status</span><span class="value" style="color:${stCor.color};font-weight:700">${orc.status||'Aberto'}</span></div>
        </div>
      </div>
    </div>

    <!-- TABELA -->
    <div class="section">
      <div class="section-title">${isOd?'Procedimentos do tratamento':'Serviços e itens'}</div>
      <div class="tbl-wrap">
        ${isOd?`
        <table>
          <thead>
            <tr style="background:linear-gradient(135deg,#1E3A5F,#2D1B69)">
              <th style="padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Procedimento</th>
              <th style="padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Dentes</th>
              <th style="padding:11px 14px;text-align:center;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Qtd.</th>
              <th style="padding:11px 14px;text-align:right;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Unit.</th>
              <th style="padding:11px 14px;text-align:right;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Total</th>
            </tr>
          </thead>
          <tbody>${linhasOdonto}</tbody>
        </table>`:`
        <table>
          <thead>
            <tr style="background:linear-gradient(135deg,#1E3A5F,#2D1B69)">
              <th style="padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Serviço / Item</th>
              <th style="padding:11px 14px;text-align:center;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Qtd.</th>
              <th style="padding:11px 14px;text-align:right;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Unit.</th>
              <th style="padding:11px 14px;text-align:right;font-size:10px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.07em">Total</th>
            </tr>
          </thead>
          <tbody>${linhasComum}</tbody>
        </table>`}
      </div>
    </div>

    <!-- FINANCEIRO -->
    <div class="section">
      <div class="section-title">Resumo financeiro</div>
      <div class="fin-box">
        ${orc.subtotal&&orc.desconto>0?`<div class="fin-row"><span class="fl">Subtotal</span><span class="fv">${fmtMoeda(orc.subtotal)}</span></div>`:''}
        ${orc.desconto>0?`<div class="fin-row"><span class="fl">Desconto</span><span class="fv" style="color:#EF4444">− ${fmtMoeda(orc.desconto)}</span></div>`:''}
      </div>
      <div class="fin-total">
        <span class="ft-label">Total do ${isOd?'tratamento':'orçamento'}</span>
        <span class="ft-value">${fmtMoeda(orc.total)}</span>
      </div>
      ${(orc.valor_pago||0)>0?`
      <div class="fin-pago">
        <span style="font-size:13px;font-weight:600;color:#15803D">✓ Valor pago</span>
        <span style="font-size:15px;font-weight:800;color:#15803D">${fmtMoeda(orc.valor_pago)}</span>
      </div>
      <div class="fin-saldo">
        <span style="font-size:13px;font-weight:600;color:#C2410C">Saldo restante</span>
        <span style="font-size:15px;font-weight:800;color:#C2410C">${fmtMoeda(orc.saldo_restante||0)}</span>
      </div>`:''}
    </div>

    ${orc.observacoes?`
    <div class="section">
      <div class="section-title">Observações</div>
      <div class="obs-box">${orc.observacoes}</div>
    </div>`:''}

    <!-- Espaço para assinatura -->
    <div class="section" style="margin-top:40px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
        <div>
          <div style="border-top:1.5px solid #CBD5E1;padding-top:8px">
            <div style="font-size:11px;color:#94A3B8">${neg}</div>
            <div style="font-size:10px;color:#CBD5E1;margin-top:2px">Assinatura / Carimbo</div>
          </div>
        </div>
        <div>
          <div style="border-top:1.5px solid #CBD5E1;padding-top:8px">
            <div style="font-size:11px;color:#94A3B8">${orc.cliente_nome}</div>
            <div style="font-size:10px;color:#CBD5E1;margin-top:2px">${isOd?'Assinatura do paciente':'Assinatura do cliente'}</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- RODAPÉ -->
  <div class="footer">
    <div class="fl"><strong>ClienteMarcado</strong> · Gerado em ${agora}</div>
    <div class="fr">Documento não possui validade jurídica sem assinatura</div>
  </div>

</div>
</body>
</html>`
    win.document.write(html)
    win.document.close()
    setTimeout(()=>win.print(),600)
  }

  const orcsFiltrados=orcamentos.filter(o=>{
    const ps=filtroStatus==='Todos'||o.status===filtroStatus
    const pc=!filtroCliente||o.cliente_nome?.toLowerCase().includes(filtroCliente.toLowerCase())
    return ps&&pc
  })
  const totalAberto=orcamentos.filter(o=>['Aberto','Em andamento','Parcialmente pago'].includes(o.status)).length
  const totalAReceber=orcamentos.filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status)).reduce((a,o)=>a+(o.saldo_restante||0),0)
  const mes=new Date().toISOString().slice(0,7)
  const recebidoMes=orcamentos.filter(o=>o.updated_at?.slice(0,7)===mes&&o.valor_pago>0).reduce((a,o)=>a+(o.valor_pago||0),0)
  const parciais=orcamentos.filter(o=>o.status==='Parcialmente pago').length
  const orcDetalhe=orcamentos.find(o=>o.id===detalheId)

  const inp:React.CSSProperties={width:'100%',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:'5px'}
  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'14px',padding:'16px',marginBottom:'10px',border:'1px solid rgba(148,163,184,.14)',boxShadow:'0 4px 16px rgba(0,0,0,.25)'}

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile="Orçamentos"/>
      <div className="psb-main" style={{flex:1,minWidth:0,minHeight:'100vh',display:'flex',flexDirection:'column'}}>

        {/* LISTA */}
        {view==='lista'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'20px 20px 0',maxWidth:'1280px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'14px'}}>
                <div>
                  <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'4px'}}>Orçamentos</h1>
                  <p style={{fontSize:'13px',color:'#94A3B8'}}>Crie, acompanhe e envie orçamentos em poucos segundos.</p>
                </div>
                <button onClick={()=>{resetAll();setView('escolha')}}
                  style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'10px 20px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(59,130,246,.3)',whiteSpace:'nowrap'}}>
                  + Novo orçamento
                </button>
              </div>
              {mensagem&&<div style={{padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',background:'rgba(22,163,74,.15)',border:'1px solid rgba(22,163,74,.3)',color:'#4ADE80',fontSize:'13px'}}>{mensagem}</div>}
              {/* Filtro período */}
              <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(99,102,241,.22)',borderRadius:'14px',padding:'14px 16px',marginBottom:'14px'}}>
                <p style={{fontSize:'10px',fontWeight:700,color:'#818CF8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'10px'}}>Período</p>
                <div style={{display:'flex',gap:'6px',marginBottom:'10px',flexWrap:'wrap'}}>
                  {([['mes','Mês'],['7d','7 dias'],['30d','30 dias'],['ano','Este ano'],['todo','Todo período']] as const).map(([val,label])=>(
                    <button key={val} className="pchip"
                      style={{background:periodoTipo===val?'linear-gradient(135deg,#3B82F6,#7C3AED)':'rgba(255,255,255,.06)',color:periodoTipo===val?'#fff':'#94A3B8',borderColor:periodoTipo===val?'transparent':'rgba(255,255,255,.12)'}}
                      onClick={()=>setPeriodoTipo(val as any)}>
                      {label}
                    </button>
                  ))}
                </div>
                {periodoTipo==='mes'&&(
                  <select value={mesKey} onChange={e=>setMesKey(e.target.value)}
                    style={{background:'rgba(15,23,42,.92)',border:'1.5px solid rgba(99,102,241,.35)',borderRadius:'10px',padding:'8px 14px',color:'#F8FAFC',fontSize:'13px',fontWeight:600,outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
                    {mesesOpcoes.map(m=><option key={m.key} value={m.key}>{m.label.charAt(0).toUpperCase()+m.label.slice(1)}</option>)}
                  </select>
                )}
                {periodoTipo!=='mes'&&<p style={{fontSize:'12px',color:'#64748B'}}>Período: <span style={{color:'#A5B4FC',fontWeight:600}}>{periodoTipo==='7d'?'Últimos 7 dias':periodoTipo==='30d'?'Últimos 30 dias':periodoTipo==='ano'?'Este ano':'Todo o período'}</span></p>}
              </div>
              <div className="od-kpi" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'14px'}}>
                {[
                  {label:'Em aberto',valor:kpis.aberto,fmt:'n',cor:'#3B82F6',bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.25)'},
                  {label:'A receber',valor:kpis.aReceber,fmt:'brl',cor:'#F59E0B',bg:'rgba(245,158,11,.12)',border:'rgba(245,158,11,.25)'},
                  {label:periodoTipo==='mes'?'Recebido no mês':'Recebido no período',valor:kpis.recebido,fmt:'brl',cor:'#22C55E',bg:'rgba(34,197,94,.12)',border:'rgba(34,197,94,.25)'},
                  {label:'Parciais',valor:kpis.parciais,fmt:'n',cor:'#A78BFA',bg:'rgba(167,139,250,.12)',border:'rgba(167,139,250,.25)'},
                ].map(m=>(
                  <div key={m.label} style={{background:m.bg,border:`1px solid ${m.border}`,borderRadius:'12px',padding:'12px',boxSizing:'border-box' as const}}>
                    <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'4px'}}>{m.label}</p>
                    <p style={{fontSize:'20px',fontWeight:800,color:m.cor}}>{m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}</p>
                  </div>
                ))}
              </div>
              <input type="text" placeholder="Buscar cliente..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
                style={{width:'100%',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const,marginBottom:'10px'}}/>
              <div style={{display:'flex',gap:'6px',marginBottom:'14px',flexWrap:'wrap'}}>
                {STATUS_LIST.map(s=>(
                  <button key={s} onClick={()=>setFiltroStatus(s)}
                    style={{padding:'6px 12px',borderRadius:'999px',fontSize:'11px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',
                      background:filtroStatus===s?'linear-gradient(135deg,#3B82F6,#7C3AED)':'rgba(255,255,255,.06)',
                      color:filtroStatus===s?'#fff':'#94A3B8',borderColor:filtroStatus===s?'transparent':'rgba(255,255,255,.12)'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:'0 20px 60px',maxWidth:'1280px',margin:'0 auto'}}>
              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'10px',fontWeight:500}}>
                {orcTotal===0?'Nenhum orçamento encontrado':`${orcTotal} orçamento${orcTotal!==1?'s':''} encontrado${orcTotal!==1?'s':''} ${periodoTipo==='mes'?`em ${mesesOpcoes.find(m=>m.key===mesKey)?.label||''}`:periodoTipo==='7d'?'nos últimos 7 dias':periodoTipo==='30d'?'nos últimos 30 dias':periodoTipo==='ano'?'neste ano':'em todo o período'}`}
              </p>              {orcamentos.length===0?(
                <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'16px',padding:'40px 20px',textAlign:'center'}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#fff',marginBottom:'8px'}}>Nenhum orçamento criado ainda</p>
                  <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'20px'}}>Crie seu primeiro orçamento e envie pelo WhatsApp.</p>
                  <button onClick={()=>{resetAll();setView('escolha')}}
                    style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 24px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    Criar primeiro orçamento
                  </button>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {orcamentos.map(orc=>{
                    const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                    const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
                    return(
                      <div key={orc.id} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px',gap:'8px'}}>
                          <div style={{minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px',flexWrap:'wrap'}}>
                              <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>{orc.cliente_nome}</p>
                              {isOd&&<span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:'rgba(124,58,237,.2)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.35)',whiteSpace:'nowrap' as const}}>Odontológico</span>}
                            </div>
                            <p style={{fontSize:'11px',color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}</p>
                          </div>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const,flexShrink:0}}>{orc.status}</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'10px'}}>
                          {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#F59E0B':'#22C55E'}].map(f=>(
                            <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'7px 10px'}}>
                              <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'.04em',marginBottom:'2px'}}>{f.l}</p>
                              <p style={{fontSize:'13px',fontWeight:700,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                          <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                            style={{background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'8px',padding:'8px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Ver detalhes</button>
                          <button onClick={()=>enviarWpp(orc)}
                            style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'8px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                          <button onClick={()=>gerarPDF(orc)}
                            style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.3)',borderRadius:'8px',padding:'8px',fontSize:'12px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                          <button onClick={()=>abrirEditar(orc)}
                            style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px',fontSize:'12px',fontWeight:600,color:'#CBD5E1',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                          {(orc.saldo_restante||0)>0.01&&!['Pago','Finalizado','Cancelado'].includes(orc.status)&&(
                            <button onClick={()=>abrirModalPag(orc)}
                              style={{gridColumn:'1/-1',background:'rgba(34,197,94,.12)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                              Confirmar pagamento · R$ {fmtBRL(orc.saldo_restante||0)}
                            </button>
                          )}
                          <button onClick={()=>handleExcluir(orc.id)}
                            style={{gridColumn:'1/-1',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.18)',borderRadius:'8px',padding:'6px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ESCOLHA */}
        {view==='escolha'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'20px 16px 60px',maxWidth:'680px',margin:'0 auto'}}>
              <button onClick={()=>setView('lista')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'20px'}}>
                ← Voltar à lista
              </button>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'6px'}}>Novo orçamento</h1>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'24px'}}>Escolha o tipo de orçamento que deseja criar.</p>
              <style dangerouslySetInnerHTML={{__html:'@media(max-width:540px){.orc-grid{grid-template-columns:1fr!important}}'}}/>
              <div className="orc-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <button onClick={()=>{resetAll();setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'18px',padding:'22px 18px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'12px',transition:'border-color .15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.55)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.22)'}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'15px',fontWeight:800,color:'#F8FAFC',marginBottom:'4px'}}>Orçamento comum</p>
                    <p style={{fontSize:'12px',color:'#94A3B8',lineHeight:'1.5'}}>Serviços, procedimentos e atendimentos em geral.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#60A5FA'}}>Criar</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
                <button onClick={()=>{resetAll();setView('odonto')}}
                  style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(124,58,237,.28)',borderRadius:'18px',padding:'22px 18px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'12px',position:'relative',transition:'border-color .15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.6)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.28)'}}>
                  <div style={{position:'absolute',top:'12px',right:'12px',background:'rgba(124,58,237,.2)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'2px 8px',fontSize:'10px',fontWeight:700,color:'#C4B5FD'}}>ODONTO</div>
                  <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'15px',fontWeight:800,color:'#F8FAFC',marginBottom:'4px'}}>Orçamento odontológico</p>
                    <p style={{fontSize:'12px',color:'#94A3B8',lineHeight:'1.5'}}>Odontograma interativo com procedimentos por dente.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#C4B5FD'}}>Criar</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM COMUM */}
        {view==='form'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div className="od-bdy" style={{padding:'12px 12px 140px',maxWidth:'900px',margin:'0 auto'}}>
              <button onClick={()=>{resetAll();setView(editandoId?'lista':'escolha')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'12px'}}>
                ← {editandoId?'Voltar à lista':'Voltar'}
              </button>
              <h1 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'3px'}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'14px'}}>Preencha os dados e envie para o cliente.</p>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>{mensagem}</div>}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Cliente</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div><label style={lbl}>Nome *</label><input style={inp} type="text" placeholder="Nome do cliente" value={clienteNome} onChange={e=>setClienteNome(e.target.value)}/></div>
                  <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={lbl}>WhatsApp *</label><input style={inp} type="tel" placeholder="(11) 99999-9999" value={clienteWpp} onChange={e=>setClienteWpp(aplicarMascaraTel(e.target.value))}/></div>
                    <div><label style={lbl}>E-mail (opcional)</label><input style={inp} type="email" placeholder="email@exemplo.com" value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)}/></div>
                  </div>
                </div>
              </div>
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setShowDetalhes(!showDetalhes)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',cursor:'pointer',userSelect:'none' as const}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Detalhes do documento</p>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {showDetalhes&&(
                  <div style={{padding:'0 16px 14px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'12px'}}>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div><label style={lbl}>Tipo</label>
                        <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                          {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t=><option key={t} value={t}>{t}</option>)}
                          <option value="__outro__">Outro</option>
                        </select>
                        {tipo==='__outro__'&&<input style={{...inp,marginTop:'6px'}} type="text" placeholder="Especifique..." value={tipoOutro} onChange={e=>setTipoOutro(e.target.value)}/>}
                      </div>
                      <div><label style={lbl}>Status</label>
                        <select style={sel} value={status} onChange={e=>setStatus(e.target.value)}>
                          {['Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div><label style={lbl}>Profissional</label>
                        <select style={sel} value={profId} onChange={e=>setProfId(e.target.value)}>
                          <option value="">Nenhum</option>
                          {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Data</label><input style={inp} type="date" value={dataDoc} onChange={e=>setDataDoc(e.target.value)}/></div>
                    </div>
                  </div>
                )}
              </div>
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>
                </div>
                <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'12px'}}>Adicione serviços ou itens deste orçamento.</p>
                {itens.map((item,idx)=>(
                  <div key={idx} style={{marginBottom:'8px',padding:'12px 10px',background:'rgba(255,255,255,.04)',borderRadius:'10px',border:'1px solid rgba(148,163,184,.12)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.05em'}}>Item {idx+1}</span>
                      {itens.length>1&&<button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                        style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',color:'#F87171',cursor:'pointer',fontSize:'12px',padding:'2px 8px'}}>Remover</button>}
                    </div>
                    <div style={{marginBottom:'8px'}}><label style={lbl}>Nome do serviço *</label><input style={inp} type="text" placeholder="Ex: Corte, limpeza..." value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)}/></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                      <div><label style={lbl}>Qtd.</label><input style={{...inp,textAlign:'center'}} type="number" min="1" value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)}/></div>
                      <div><label style={lbl}>Valor (R$)</label><input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)}/></div>
                    </div>
                    <div style={{background:item.total>0?'rgba(34,197,94,.08)':'rgba(255,255,255,.03)',border:`1px solid ${item.total>0?'rgba(34,197,94,.22)':'rgba(255,255,255,.06)'}`,borderRadius:'8px',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>Total</span>
                      <span style={{fontSize:'15px',fontWeight:800,color:item.total>0?'#4ADE80':'#475569'}}>R$ {fmtBRL(item.total||0)}</span>
                    </div>
                    <input style={{...inp,fontSize:'12px'}} type="text" placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)}/>
                  </div>
                ))}
                <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                  style={{background:'none',border:'none',color:'#60A5FA',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0'}}>
                  + Adicionar outro serviço
                </button>
                <div style={{marginTop:'12px',background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'12px',border:'1px solid rgba(148,163,184,.08)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'7px'}}>
                    <span style={{color:'#94A3B8'}}>Subtotal</span><span style={{fontWeight:600,color:'#F8FAFC'}}>R$ {fmtBRL(subtotal)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',marginBottom:'10px',paddingBottom:'10px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                    <span style={{color:'#64748B'}}>Desconto</span>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={e=>setDesconto(e.target.value)}
                      style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:600,textAlign:'right' as const,width:'90px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Total final</span>
                    <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(total)}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleSalvarComum}
                style={{width:'100%',background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:'14px',boxShadow:'0 8px 24px rgba(59,130,246,.3)'}}>
                Salvar orçamento
              </button>              <button onClick={handleSalvarComum}
                style={{width:'100%',background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:'14px',boxShadow:'0 8px 24px rgba(59,130,246,.3)'}}>
                Salvar orçamento
              </button>
              <button onClick={handleSalvarComum}
                style={{width:'100%',background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:'14px',boxShadow:'0 8px 24px rgba(59,130,246,.3)'}}>
                Salvar orçamento
              </button>
              <div style={{marginBottom:'10px'}}>
                <label style={lbl}>Observações (opcional)</label>
                <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Ex: cliente preferiu parcelar, combinado via Pix..." value={observacoes} onChange={e=>setObservacoes(e.target.value)}/>
              </div>
            </div>
            <div className="od-footer">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total final</span>
                <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(total)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                <button onClick={()=>{resetAll();setView('lista')}} style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
                <button onClick={handleSalvarComum} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>Salvar orçamento</button>
              </div>
            </div>
          </div>
        )}

        {/* FORM ODONTO */}
        {view==='odonto'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div className="od-bdy" style={{padding:'12px 12px 140px',maxWidth:'960px',margin:'0 auto'}}>
              <button onClick={()=>{resetAll();setView(editandoId?'lista':'escolha')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'12px'}}>
                ← {editandoId?'Voltar à lista':'Voltar'}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'3px'}}>
                <h1 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Orçamento odontológico</h1>
                <span style={{fontSize:'10px',fontWeight:700,background:'rgba(124,58,237,.25)',border:'1px solid rgba(124,58,237,.45)',borderRadius:'999px',padding:'3px 10px',color:'#C4B5FD'}}>Odontológico</span>
              </div>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'14px'}}>Selecione os dentes, adicione procedimentos e acompanhe o tratamento.</p>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>{mensagem}</div>}

              {/* Paciente */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Paciente</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div><label style={lbl}>Nome *</label><input style={inp} type="text" placeholder="Nome do paciente" value={odNome} onChange={e=>setOdNome(e.target.value)}/></div>
                  <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={lbl}>WhatsApp *</label><input style={inp} type="tel" placeholder="(11) 99999-9999" value={odWpp} onChange={e=>setOdWpp(aplicarMascaraTel(e.target.value))}/></div>
                    <div><label style={lbl}>E-mail (opcional)</label><input style={inp} type="email" placeholder="email@exemplo.com" value={odEmail} onChange={e=>setOdEmail(e.target.value)}/></div>
                  </div>
                </div>
              </div>

              {/* Detalhes */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdDetOpen(!odDetOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',cursor:'pointer',userSelect:'none' as const}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Detalhes do tratamento</p>
                  </div>
                  <span style={{color:'#64748B',fontSize:'15px',transform:odDetOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {odDetOpen&&(
                  <div style={{padding:'0 16px 14px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'12px'}}>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div><label style={lbl}>Status</label>
                        <select style={sel} value={odStatus} onChange={e=>setOdStatus(e.target.value)}>
                          {['Rascunho','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Data</label><input style={inp} type="date" value={odData} onChange={e=>setOdData(e.target.value)}/></div>
                    </div>
                    <div><label style={lbl}>Profissional responsável</label>
                      <select style={sel} value={odProfId} onChange={e=>setOdProfId(e.target.value)}>
                        <option value="">Nenhum</option>
                        {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Odontograma */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Odontograma</p>
                  </div>
                  {dentesSelec.length>0&&(
                    <button onClick={()=>setDentesSelec([])} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:600}}>Limpar seleção</button>
                  )}
                </div>
                <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'6px'}}>Toque nos dentes para selecionar. Os dentes selecionados irão automaticamente para o campo de procedimento.</p>
                <div className="od-hint" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',marginBottom:'12px',background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.3)',borderRadius:'999px',padding:'5px 14px',width:'fit-content',boxShadow:'0 0 8px rgba(99,102,241,.2)'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#a5b4fc',letterSpacing:'.02em'}}>Deslize para ver todos os dentes</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <svg width="0" height="0" style={{position:'absolute',overflow:'visible'}}>
                  <defs>
                    <linearGradient id="gFree" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5f9fd"/><stop offset="50%" stopColor="#e2eef8"/><stop offset="100%" stopColor="#ccdff0"/></linearGradient>
                    <linearGradient id="gSel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a5b4fc"/><stop offset="55%" stopColor="#6366f1"/><stop offset="100%" stopColor="#4338ca"/></linearGradient>
                    <linearGradient id="gUsado" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e9d5ff"/><stop offset="55%" stopColor="#a855f7"/><stop offset="100%" stopColor="#7e22ce"/></linearGradient>
                    <linearGradient id="gAnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fed7aa"/><stop offset="55%" stopColor="#f97316"/><stop offset="100%" stopColor="#c2410c"/></linearGradient>
                    <linearGradient id="gConc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bbf7d0"/><stop offset="55%" stopColor="#22c55e"/><stop offset="100%" stopColor="#15803d"/></linearGradient>
                  </defs>
                </svg>
                {[{label:'Arcada superior',arr:DENTES_SUP},{label:'Arcada inferior',arr:DENTES_INF}].map(({label,arr},ai)=>(
                  <div key={label} style={{marginBottom:ai===0?'6px':'0'}}>
                    <p style={{fontSize:'10px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:'7px',textAlign:'center'}}>{label}</p>
                    <div className="od-scroll-wrap"><div className="od-scroll" style={{display:'flex',justifyContent:'center',gap:'3px',overflowX:'auto',paddingBottom:'6px',paddingLeft:'10px',paddingRight:'10px'}}>
                      {arr.slice(0,arr.length/2).map(n=>{
                        const isSel=dentesSelec.includes(n)
                        const hasPd=linhas.some(l=>l.dentes?.includes(n))
                        const cls=denteCls(n)
                        const fill=isSel?'url(#gSel)':hasPd?'url(#gUsado)':'url(#gFree)'
                        const numFill=isSel||hasPd?'#fff':'#1e3a5f'
                        return(
                          <button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])} style={{touchAction:'manipulation'}}>
                            <svg viewBox="0 0 32 44" width="30" height="42" xmlns="http://www.w3.org/2000/svg" style={{display:'block',filter:isSel?'drop-shadow(0 0 5px rgba(99,102,241,.8))':hasPd?'drop-shadow(0 0 4px rgba(168,85,247,.55))':'none'}}>
                              <path fill={fill} stroke="rgba(150,185,215,.5)" strokeWidth="1.2"
                                d="M16,3 C11.5,3 6,7 6,13.5 C6,18.5 7,22.5 8,27 C9,31.5 9,36.5 11,40.5 C11.8,42.2 12.8,43 14.5,43 C15.3,43 15.8,42.3 16,41.5 C16.2,42.3 16.7,43 17.5,43 C19.2,43 20.2,42.2 21,40.5 C23,36.5 23,31.5 24,27 C25,22.5 26,18.5 26,13.5 C26,7 20.5,3 16,3 Z"/>
                              <path fill="rgba(255,255,255,.2)" strokeWidth="0"
                                d="M9.5,5.5 C8,8.5 7.5,11 7.5,13.5 C7.5,15.5 8,17 9,17 C10.2,17 11,15 11,12.5 C11,9.5 10.5,7 9.5,5.5 Z"/>
                              <text x="16" y="20" textAnchor="middle" dominantBaseline="middle"
                                fill={numFill} style={{fontSize:'8.5px',fontWeight:'800',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',userSelect:'none'}}>{n}</text>
                              {hasPd&&!isSel&&<circle cx="25.5" cy="6" r="3" fill="rgba(255,255,255,.92)" stroke="rgba(180,200,220,.5)" strokeWidth="0.8"/>}
                            </svg>
                          </button>
                        )
                      })}
                      <div style={{width:'2px',background:'rgba(148,163,184,.28)',margin:'0 6px',alignSelf:'stretch',flexShrink:0,borderRadius:'1px'}}/>
                      {arr.slice(arr.length/2).map(n=>{
                        const isSel=dentesSelec.includes(n)
                        const hasPd=linhas.some(l=>l.dentes?.includes(n))
                        const cls=denteCls(n)
                        const fill=isSel?'url(#gSel)':hasPd?'url(#gUsado)':'url(#gFree)'
                        const numFill=isSel||hasPd?'#fff':'#1e3a5f'
                        return(
                          <button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])} style={{touchAction:'manipulation'}}>
                            <svg viewBox="0 0 32 44" width="30" height="42" xmlns="http://www.w3.org/2000/svg" style={{display:'block',filter:isSel?'drop-shadow(0 0 5px rgba(99,102,241,.8))':hasPd?'drop-shadow(0 0 4px rgba(168,85,247,.55))':'none'}}>
                              <path fill={fill} stroke="rgba(150,185,215,.5)" strokeWidth="1.2"
                                d="M16,3 C11.5,3 6,7 6,13.5 C6,18.5 7,22.5 8,27 C9,31.5 9,36.5 11,40.5 C11.8,42.2 12.8,43 14.5,43 C15.3,43 15.8,42.3 16,41.5 C16.2,42.3 16.7,43 17.5,43 C19.2,43 20.2,42.2 21,40.5 C23,36.5 23,31.5 24,27 C25,22.5 26,18.5 26,13.5 C26,7 20.5,3 16,3 Z"/>
                              <path fill="rgba(255,255,255,.2)" strokeWidth="0"
                                d="M9.5,5.5 C8,8.5 7.5,11 7.5,13.5 C7.5,15.5 8,17 9,17 C10.2,17 11,15 11,12.5 C11,9.5 10.5,7 9.5,5.5 Z"/>
                              <text x="16" y="20" textAnchor="middle" dominantBaseline="middle"
                                fill={numFill} style={{fontSize:'8.5px',fontWeight:'800',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',userSelect:'none'}}>{n}</text>
                              {hasPd&&!isSel&&<circle cx="25.5" cy="6" r="3" fill="rgba(255,255,255,.92)" stroke="rgba(180,200,220,.5)" strokeWidth="0.8"/>}
                            </svg>
                          </button>
                        )
                      })}
                    </div></div>
                    {ai===0&&<div style={{height:'6px'}}/>}
                  </div>
                ))}
                {/* Selecionados */}
                <div style={{marginTop:'10px',minHeight:'28px',display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                  {dentesSelec.length===0?(
                    <span style={{fontSize:'12px',color:'#475569'}}>Nenhum dente selecionado</span>
                  ):(
                    <>
                      <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Selecionados:</span>
                      {[...dentesSelec].sort((a,b)=>a-b).map(d=>(
                        <button key={d} onClick={()=>setDentesSelec(prev=>prev.filter(x=>x!==d))}
                          style={{fontSize:'11px',fontWeight:700,background:'rgba(99,102,241,.2)',border:'1px solid rgba(99,102,241,.45)',borderRadius:'999px',padding:'2px 8px',color:'#a5b4fc',cursor:'pointer',fontFamily:'inherit'}}>
                          {d} ×
                        </button>
                      ))}
                    </>
                  )}
                </div>
                {/* Legenda */}
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'10px'}}>
                  {[{cls:'dt',l:'Livre'},{cls:'dt s',l:'Selecionado'},{cls:'dt usado',l:'Com procedimento'}].map(({cls,l})=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <div className={cls} style={{width:'14px',height:'18px',pointerEvents:'none' as const,flexShrink:0}}/>
                      <span style={{fontSize:'10px',color:'#64748B'}}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adicionar procedimento — linha rápida */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Adicionar procedimento ao orçamento</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {/* Campo procedimento full width */}
                  <div>
                    <label style={lbl}>Procedimento odontológico *</label>
                    <input style={inp} type="text" placeholder="Ex: restauração, canal, extração..." value={addProc} onChange={e=>setAddProc(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter')adicionarLinha()}}/>
                  </div>
                  {/* Linha: dentes + qtd + valor */}
                  <div className="od-add-grid" style={{display:'grid',gridTemplateColumns:'1fr 70px 1fr',gap:'8px'}}>
                    <div>
                      <label style={lbl}>Dentes selecionados</label>
                      <div style={{...inp,padding:'8px 10px',display:'flex',alignItems:'center',gap:'3px',flexWrap:'wrap',minHeight:'42px',cursor:'default',background:'rgba(255,255,255,.04)'}}>
                        {dentesSelec.length===0
                          ?<span style={{fontSize:'12px',color:'#475569'}}>Sem dente específico</span>
                          :[...dentesSelec].sort((a,b)=>a-b).map(d=>(
                            <span key={d} style={{fontSize:'11px',fontWeight:700,background:'rgba(99,102,241,.2)',border:'1px solid rgba(99,102,241,.4)',borderRadius:'999px',padding:'1px 6px',color:'#a5b4fc'}}>{d}</span>
                          ))
                        }
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Qtd.</label>
                      {dentesSelec.length>0
                        ?<div style={{...inp,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.3)',color:'#a5b4fc',fontWeight:700,fontSize:'16px'}}>{dentesSelec.length}</div>
                        :<input style={{...inp,textAlign:'center'}} type="number" min="1" value={addQtdManual} onChange={e=>setAddQtdManual(parseInt(e.target.value)||1)}/>
                      }
                    </div>
                    <div>
                      <label style={lbl}>Valor unitário (R$) *</label>
                      <input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={addValor} onChange={e=>setAddValor(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter')adicionarLinha()}}/>
                    </div>
                  </div>
                  {/* Preview do total */}
                  {addProc&&addValor&&parseFloat(addValor)>0&&(
                    <div style={{background:'rgba(34,197,94,.07)',border:'1px solid rgba(34,197,94,.18)',borderRadius:'8px',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>{addQtd} × R$ {fmtBRL(parseFloat(addValor)||0)}</span>
                      <span style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>= R$ {fmtBRL(addQtd*(parseFloat(addValor)||0))}</span>
                    </div>
                  )}
                  <button onClick={adicionarLinha} disabled={!addProc.trim()||!addValor||parseFloat(addValor)<=0}
                    style={{background:(!addProc.trim()||!addValor||parseFloat(addValor)<=0)?'rgba(124,58,237,.25)':'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 16px',fontSize:'13px',fontWeight:700,cursor:(!addProc.trim()||!addValor||parseFloat(addValor)<=0)?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    + Adicionar procedimento
                  </button>
                  {(!addProc.trim()||!addValor||parseFloat(addValor)<=0)&&(
                    <p style={{fontSize:'11px',color:'#475569',textAlign:'center' as const,marginTop:'4px'}}>Preencha o procedimento e o valor para adicionar</p>
                  )}
                </div>
              </div>

              {/* Tabela de linhas */}
              {linhas.length>0&&(
                <div style={card}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Procedimentos adicionados</p>
                    </div>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#60A5FA'}}>{linhas.length} item{linhas.length!==1?'s':''}</span>
                  </div>
                  {/* Desktop: tabela */}
                  <div className="od-tbl-desk">
                    <div style={{display:'grid',gridTemplateColumns:'2fr 1.4fr 55px 90px 90px 80px',gap:'6px',padding:'5px 8px',marginBottom:'3px'}}>
                      {['Procedimento','Dentes','Qtd.','Unit. (R$)','Total','Ações'].map(h=>(
                        <p key={h} style={{fontSize:'10px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{h}</p>
                      ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                      {linhas.map((l,idx)=>(
                        <div key={idx} style={{display:'grid',gridTemplateColumns:'2fr 1.4fr 55px 90px 90px 80px',gap:'6px',padding:'10px 8px',background:'rgba(255,255,255,.04)',borderRadius:'8px',border:'1px solid rgba(148,163,184,.09)',alignItems:'center'}}>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>{l.proc}</p>
                          <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
                            {l.dentes?.length>0?[...l.dentes].sort((a:number,b:number)=>a-b).map((d:number)=>(
                              <span key={d} style={{fontSize:'10px',fontWeight:700,background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.3)',borderRadius:'999px',padding:'1px 5px',color:'#a5b4fc'}}>{d}</span>
                            )):<span style={{fontSize:'11px',color:'#475569'}}>Geral</span>}
                          </div>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1',textAlign:'center' as const}}>{l.qtd}</p>
                          <p style={{fontSize:'12px',fontWeight:600,color:'#CBD5E1'}}>R$ {fmtBRL(l.valorUnit||0)}</p>
                          <p style={{fontSize:'14px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(l.total||0)}</p>
                          <div style={{display:'flex',gap:'3px'}}>
                            <button onClick={()=>editarLinha(idx)} style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'5px',padding:'3px 7px',fontSize:'11px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Ed</button>
                            <button onClick={()=>removerLinha(idx)} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.22)',borderRadius:'5px',padding:'3px 7px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Rm</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Mobile: cards */}
                  <div className="od-tbl-mob" style={{display:'none'}}>
                    {linhas.map((l,idx)=>(
                      <div key={idx} style={{padding:'12px',background:'rgba(255,255,255,.04)',borderRadius:'10px',border:'1px solid rgba(148,163,184,.1)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                          <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>{l.proc}</p>
                          <p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(l.total||0)}</p>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px',marginBottom:'8px'}}>
                          <div style={{background:'rgba(255,255,255,.04)',borderRadius:'6px',padding:'5px 8px'}}>
                            <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,marginBottom:'1px'}}>Qtd. × Unit.</p>
                            <p style={{fontSize:'12px',fontWeight:600,color:'#CBD5E1'}}>{l.qtd} × R$ {fmtBRL(l.valorUnit||0)}</p>
                          </div>
                          <div style={{background:'rgba(255,255,255,.04)',borderRadius:'6px',padding:'5px 8px'}}>
                            <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,marginBottom:'1px'}}>Dentes</p>
                            <p style={{fontSize:'12px',fontWeight:600,color:'#a5b4fc'}}>{l.dentes?.length>0?[...l.dentes].sort((a:number,b:number)=>a-b).join(', '):'Geral'}</p>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>editarLinha(idx)} style={{flex:1,background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'7px',padding:'7px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                          <button onClick={()=>removerLinha(idx)} style={{flex:1,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'7px',padding:'7px',fontSize:'12px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo financeiro */}
              <div style={{...card,background:'radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Resumo financeiro</p>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px'}}>
                  <span style={{color:'#94A3B8'}}>Subtotal{linhas.length>0?` (${linhas.length} proc.)`:''}</span>
                  <span style={{fontWeight:700,color:'#F8FAFC'}}>R$ {fmtBRL(odSubtotal)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',marginBottom:'10px',paddingBottom:'10px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  <span style={{color:'#64748B'}}>Desconto (R$)</span>
                  <input type="number" min="0" step="0.01" placeholder="0,00" value={odDesconto} onChange={e=>setOdDesconto(e.target.value)}
                    style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:700,textAlign:'right' as const,width:'100px',fontFamily:'inherit',borderRadius:'7px',padding:'5px 10px'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Total do tratamento</span>
                  <span style={{fontSize:'20px',fontWeight:800,color:'#C4B5FD'}}>R$ {fmtBRL(odTotal)}</span>
                </div>
              </div>

              {/* Pagamentos */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdPagOpen(!odPagOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',cursor:'pointer',userSelect:'none' as const}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Pagamentos</p>
                      <p style={{fontSize:'11px',color:'#64748B'}}>Pago: R$ {fmtBRL(odPago)} · Saldo: R$ {fmtBRL(odSaldo)}</p>
                    </div>
                  </div>
                  <span style={{color:'#64748B',fontSize:'15px',transform:odPagOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {odPagOpen&&(
                  <div style={{padding:'0 16px 14px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'12px 0'}}>
                      {[{l:'Total',v:odTotal,c:'#F8FAFC'},{l:'Pago',v:odPago,c:'#4ADE80'},{l:'Saldo',v:odSaldo,c:odSaldo>0?'#FBBF24':'#4ADE80'}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.05)',borderRadius:'8px',padding:'8px',border:'1px solid rgba(148,163,184,.1)'}}>
                          <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'2px'}}>{f.l}</p>
                          <p style={{fontSize:'14px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'8px'}}>
                      <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        <div><label style={lbl}>Valor (R$)</label><input style={inp} type="number" placeholder="0,00" value={odPagValor} onChange={e=>setOdPagValor(e.target.value)}/></div>
                        <div><label style={lbl}>Forma</label>
                          <select style={sel} value={odPagForma} onChange={e=>setOdPagForma(e.target.value)}>
                            {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Outro'].map(f=><option key={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                      <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada..." value={odPagObs} onChange={e=>setOdPagObs(e.target.value)}/></div>
                      <button onClick={adicionarPagOdonto} disabled={!odPagValor||parseFloat(odPagValor)<=0}
                        style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',opacity:(!odPagValor||parseFloat(odPagValor)<=0)?0.45:1}}>
                        Registrar pagamento
                      </button>
                    </div>
                    {odHistPags.length>0&&(
                      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                        {odHistPags.map((p,i)=>(
                          <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div><span style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span><span style={{fontSize:'11px',color:'#64748B',marginLeft:'8px'}}>{p.forma} · {fmtData(p.data)}</span>{p.obs&&<p style={{fontSize:'11px',color:'#64748B'}}>{p.obs}</p>}</div>
                            <button onClick={()=>setOdHistPags(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:'16px'}}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Observacoes */}              <button onClick={handleSalvarOdonto}
                style={{width:'100%',background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:'14px',boxShadow:'0 8px 24px rgba(124,58,237,.3)'}}>
                Salvar orçamento
              </button>
              <button onClick={handleSalvarOdonto}
                style={{width:'100%',background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:'14px',boxShadow:'0 8px 24px rgba(124,58,237,.3)'}}>
                Salvar orçamento
              </button>
              <div style={{marginBottom:'10px'}}>
                <label style={lbl}>Observações gerais do tratamento</label>
                <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Ex: tratamento dividido em etapas, retorno em 15 dias..." value={odObs} onChange={e=>setOdObs(e.target.value)}/>
              </div>
            </div>

            <div className="od-footer">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total do tratamento</span>
                <span style={{fontSize:'18px',fontWeight:800,color:'#C4B5FD'}}>R$ {fmtBRL(odTotal)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                <button onClick={async()=>{if(!odNome.trim())return setMensagem('Informe o nome do paciente para salvar rascunho.');const p={user_id:userId,cliente_nome:odNome.trim()||'Rascunho',cliente_whatsapp:odWpp.replace(/\D/g,'')||'00000000000',cliente_email:odEmail||null,tipo:'Orçamento Odontológico',profissional_id:odProfId||null,data:odData,status:'Rascunho',servicos:[],subtotal:odSubtotal,desconto:odDescontoNum,total:odTotal,valor_pago:odPago,saldo_restante:odSaldo,procedimentos_odonto:linhas,hist_pagamentos:odHistPags,observacoes:odObs||null,updated_at:new Date().toISOString()};if(editandoId){await supabase.from('orcamentos').update(p).eq('id',editandoId)}else{await supabase.from('orcamentos').insert(p)};resetAll();setView('lista');await carregarOrcamentos(userId,0,true);setMensagem('Rascunho salvo!');setTimeout(()=>setMensagem(''),3000)}} style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
                <button onClick={handleSalvarOdonto} style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar alterações':'Salvar orçamento'}</button>
              </div>
            </div>
          </div>
        )}

        {/* DETALHE */}
        {view==='detalhe'&&orcDetalhe&&(()=>{
          const orc=orcDetalhe
          const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
          const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
          return(
            <div style={{padding:'16px 16px 60px',maxWidth:'900px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',flexWrap:'wrap'}}>
                <button onClick={()=>{setView('lista');setShowPagForm(false)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit'}}>← Voltar</button>
                <h2 style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
                {isOd&&<span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:'rgba(124,58,237,.2)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.3)'}}>Odontológico</span>}
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',color:'#4ADE80'}}>{mensagem}</div>}
              <div style={card}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                  {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(
                    <div key={f.l} style={{background:'rgba(255,255,255,.05)',borderRadius:'8px',padding:'8px',border:'1px solid rgba(148,163,184,.1)'}}>
                      <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'2px'}}>{f.l}</p>
                      <p style={{fontSize:'15px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Registrar pagamento</button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                  <button onClick={()=>abrirEditar(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'12px',background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'10px',padding:'14px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#93C5FD',marginBottom:'10px'}}>Registrar pagamento</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                      <div><label style={lbl}>Data</label><input type="date" value={pagData} onChange={e=>setPagData(e.target.value)} style={inp}/></div>
                      <div><label style={lbl}>Valor (R$)</label><input type="number" placeholder="0,00" value={pagValor} onChange={e=>setPagValor(e.target.value)} style={inp}/></div>
                    </div>
                    <div style={{marginBottom:'8px'}}><label style={lbl}>Forma</label>
                      <select value={pagForma} onChange={e=>setPagForma(e.target.value)} style={sel}>
                        {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Outro'].map(f=><option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{marginBottom:'10px'}}><label style={lbl}>Observação</label><input type="text" placeholder="Opcional" value={pagObs} onChange={e=>setPagObs(e.target.value)} style={inp}/></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>setShowPagForm(false)} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                      <button disabled={savingPag} onClick={async()=>{
                        const v=parseFloat(pagValor||'0');if(!v)return
                        setSavingPag(true)
                        await supabase.from('orcamento_pagamentos').insert({orcamento_id:orc.id,user_id:userId,data:pagData,valor:v,forma:pagForma,observacao:pagObs||null})
                        const nv=(orc.valor_pago||0)+v,ns=Math.max(0,(orc.total||0)-nv)
                        const nst=nv>=(orc.total||0)?'Pago':nv>0?'Parcialmente pago':orc.status
                        await supabase.from('orcamentos').update({valor_pago:nv,saldo_restante:ns,status:nst,updated_at:new Date().toISOString()}).eq('id',orc.id)
                        setSavingPag(false);setShowPagForm(false);setPagValor('');setPagObs('')
                        await carregarOrcamentos(userId,0,true);await carregarPagamentos(orc.id)
                        setMensagem('Pagamento registrado!');setTimeout(()=>setMensagem(''),3000)
                      }} style={{flex:2,background:'linear-gradient(135deg,#3B82F6,#7C3AED)',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{savingPag?'Salvando...':'Confirmar'}</button>
                    </div>
                  </div>
                )}
              </div>
              {isOd&&orc.procedimentos_odonto?.length>0&&(
                <div style={card}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>Procedimentos odontológicos</p>
                  {orc.procedimentos_odonto.map((p:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      <div>
                        <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{p.proc||p.nome}</p>
                        <p style={{fontSize:'11px',color:'#a5b4fc'}}>{p.dentes?.length>0?`Dentes: ${[...p.dentes].sort((a:number,b:number)=>a-b).join(', ')}`:'Procedimento geral'} · Qtd: {p.qtd||1}</p>
                      </div>
                      <span style={{fontSize:'14px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(p.total||p.valor||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',paddingTop:'10px',marginTop:'2px'}}>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Total</span>
                    <span style={{fontSize:'16px',fontWeight:800,color:'#C4B5FD'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}
              {!isOd&&orc.servicos?.length>0&&(
                <div style={card}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>Serviços</p>
                  {orc.servicos.map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{s.nome}</p><p style={{fontSize:'11px',color:'#9CA3AF'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={card}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>Histórico de pagamentos</p>
                {pagamentos.length===0?<p style={{fontSize:'13px',color:'#9CA3AF'}}>Nenhum pagamento registrado.</p>
                :pagamentos.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                    <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.observacao&&<p style={{fontSize:'11px',color:'#9CA3AF'}}>{p.observacao}</p>}</div>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>{isOd?'Paciente':'Cliente'}</p>
                <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'3px'}}>{orc.cliente_nome}</p>
                {orc.cliente_whatsapp&&<p style={{fontSize:'12px',color:'#64748B',marginBottom:'2px'}}>{aplicarMascaraTel(orc.cliente_whatsapp)}</p>}
                {orc.cliente_email&&<p style={{fontSize:'12px',color:'#64748B'}}>{orc.cliente_email}</p>}
                {orc.observacoes&&<p style={{fontSize:'12px',color:'#9CA3AF',marginTop:'6px'}}>{orc.observacoes}</p>}
              </div>
            </div>
          )
        })()}

      </div>

      {/* Modal confirmar pagamento */}
      {modalPagOrc&&(
        <>
          <div onClick={()=>setModalPagOrc(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(6px)',zIndex:80}}/>
          <div style={{position:'fixed',zIndex:90,background:'linear-gradient(145deg,#0B1628,#101B2D)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'20px',padding:'22px',boxShadow:'0 24px 80px rgba(0,0,0,.6)',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(92vw,420px)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#4ADE80',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>Orçamento</p>
                <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC'}}>Confirmar pagamento</p>
              </div>
              <button onClick={()=>setModalPagOrc(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'20px',lineHeight:1}}>×</button>
            </div>
            <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'12px',padding:'12px',marginBottom:'14px'}}>
              {[{l:'Cliente',v:modalPagOrc.cliente_nome,c:'#F8FAFC'},{l:'Total',v:'R$ '+fmtBRL(modalPagOrc.total),c:'#F8FAFC'},{l:'Já pago',v:'R$ '+fmtBRL(modalPagOrc.valor_pago||0),c:'#4ADE80'},{l:'Saldo',v:'R$ '+fmtBRL(modalPagOrc.saldo_restante||0),c:'#FBBF24'}].map(({l,v,c:cor})=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px'}}>
                  <span style={{color:'#64748B'}}>{l}</span><span style={{fontWeight:700,color:cor}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'14px'}}>
              <div>
                <label style={lbl}>Valor recebido *</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span>
                  <input type="text" inputMode="decimal" value={modalValor} onChange={e=>setModalValor(e.target.value.replace(/[^0-9,]/g,''))}
                    style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'10px',padding:'11px 12px 11px 34px',fontSize:'16px',fontWeight:700,color:'#4ADE80',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}}/>
                </div>
              </div>
              <div><label style={lbl}>Forma de pagamento</label>
                <select value={modalForma} onChange={e=>setModalForma(e.target.value)} style={{...sel,border:'1.5px solid rgba(148,163,184,.18)'}}>
                  {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Outro'].map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Observação (opcional)</label>
                <input type="text" value={modalObs} onChange={e=>setModalObs(e.target.value)} placeholder="Ex: entrada, parcela final..." style={{...inp,border:'1.5px solid rgba(148,163,184,.18)'}}/>
              </div>
            </div>
            {modalErro&&<div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'8px',padding:'10px 12px',fontSize:'13px',color:'#F87171',marginBottom:'12px'}}>{modalErro}</div>}
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setModalPagOrc(null)} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',padding:'12px',color:'#94A3B8',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              <button onClick={confirmarPagamentoModal} disabled={modalSaving} style={{flex:2,background:'linear-gradient(135deg,#22C55E,#16A34A)',border:'none',borderRadius:'12px',padding:'12px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:modalSaving?0.7:1}}>
                {modalSaving?'Registrando...':'Confirmar recebimento'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}







