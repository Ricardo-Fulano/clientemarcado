'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_COR: Record<string, {bg:string;color:string;border:string}> = {
  'Aberto':               {bg:'rgba(59,130,246,.15)',  color:'#60A5FA', border:'rgba(59,130,246,.35)'},
  'Aguardando aprovação': {bg:'rgba(245,158,11,.15)',  color:'#FACC15', border:'rgba(245,158,11,.35)'},
  'Em andamento':         {bg:'rgba(124,58,237,.15)',  color:'#A78BFA', border:'rgba(124,58,237,.35)'},
  'Parcialmente pago':    {bg:'rgba(249,115,22,.15)',  color:'#FB923C', border:'rgba(249,115,22,.35)'},
  'Pago':                 {bg:'rgba(34,197,94,.15)',   color:'#22C55E', border:'rgba(34,197,94,.35)'},
  'Finalizado':           {bg:'rgba(34,197,94,.12)',   color:'#22C55E', border:'rgba(34,197,94,.28)'},
  'Cancelado':            {bg:'rgba(239,68,68,.15)',   color:'#F87171', border:'rgba(239,68,68,.35)'},
}
const PROC_STATUS_COR: Record<string,{bg:string;color:string;border:string}> = {
  'Planejado':   {bg:'rgba(59,130,246,.15)',  color:'#60A5FA', border:'rgba(59,130,246,.30)'},
  'Em andamento':{bg:'rgba(245,158,11,.15)',  color:'#FBBF24', border:'rgba(245,158,11,.30)'},
  'Concluído':   {bg:'rgba(34,197,94,.15)',   color:'#4ADE80', border:'rgba(34,197,94,.30)'},
  'Pago':        {bg:'rgba(34,197,94,.12)',   color:'#22C55E', border:'rgba(34,197,94,.25)'},
}
const DENTES_SUP=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const DENTES_INF=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

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

const CSS=`
  html,body{overflow-x:hidden;width:100%;background:#050B16}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  input,select,textarea{color-scheme:dark}
  select option{background:#07111F;color:#F8FAFC}
  .od-footer{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(5,11,22,.97);border-top:1px solid rgba(148,163,184,.12);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));z-index:25;flex-direction:column;gap:6px;backdrop-filter:blur(20px)}
  .od-grid{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}
  .od-right{position:sticky;top:24px}
  @media(min-width:1024px){.od-footer{display:none!important}.od-resumo-mob{display:none!important}}
  @media(max-width:1023px){
    .od-footer{display:flex!important}
    .od-grid{grid-template-columns:1fr!important}
    .od-right{display:none!important}
    .od-resumo-mob{display:block!important}
    .od-2col{grid-template-columns:1fr!important}
    .od-bdy{padding:12px 12px 140px!important}
  }
`

export default function Orcamentos(){
  const [userId,setUserId]=useState('')
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [filtroStatus,setFiltroStatus]=useState('Todos')
  const [filtroCliente,setFiltroCliente]=useState('')
  const [view,setView]=useState<'lista'|'escolha'|'form'|'odonto'|'detalhe'>('lista')
  const [tipoOrc,setTipoOrc]=useState<'comum'|'odonto'>('comum')
  const [editandoId,setEditandoId]=useState<string|null>(null)
  const [detalheId,setDetalheId]=useState<string|null>(null)
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [mensagem,setMensagem]=useState('')
  const [savingPag,setSavingPag]=useState(false)
  // Form comum
  const [clienteNome,setClienteNome]=useState('')
  const [clienteWpp,setClienteWpp]=useState('')
  const [clienteEmail,setClienteEmail]=useState('')
  const [clienteObs,setClienteObs]=useState('')
  const [tipo,setTipo]=useState('Orçamento')
  const [tipoOutro,setTipoOutro]=useState('')
  const [tipoDescricao,setTipoDescricao]=useState('')
  const [profId,setProfId]=useState('')
  const [profNome,setProfNome]=useState('')
  const [salvarFreelancer,setSalvarFreelancer]=useState(false)
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
  // Detalhe pagamento
  const [showPagForm,setShowPagForm]=useState(false)
  const [pagData,setPagData]=useState(new Date().toISOString().split('T')[0])
  const [pagValor,setPagValor]=useState('')
  const [pagForma,setPagForma]=useState('Pix')
  const [pagObs,setPagObs]=useState('')
  // Odonto form
  const [odNome,setOdNome]=useState('')
  const [odWpp,setOdWpp]=useState('')
  const [odEmail,setOdEmail]=useState('')
  const [odProfId,setOdProfId]=useState('')
  const [odData,setOdData]=useState(new Date().toISOString().split('T')[0])
  const [odStatus,setOdStatus]=useState('Em andamento')
  const [odObs,setOdObs]=useState('')
  const [odDetOpen,setOdDetOpen]=useState(false)
  const [odPagOpen,setOdPagOpen]=useState(false)
  // Odontograma
  const [denteSel,setDenteSel]=useState<number|null>(null)
  const [procs,setProcs]=useState<any[]>([])
  const [pNome,setPNome]=useState('')
  const [pValor,setPValor]=useState('')
  const [pStatus,setPStatus]=useState('Planejado')
  const [pObs,setPObs]=useState('')
  const [editProcIdx,setEditProcIdx]=useState<number|null>(null)
  // Odonto pagamentos
  const [odHistPags,setOdHistPags]=useState<any[]>([])
  const [odPagValor,setOdPagValor]=useState('')
  const [odPagForma,setOdPagForma]=useState('Pix')
  const [odPagObs,setOdPagObs]=useState('')

  const searchParams=useSearchParams()
  useEffect(()=>{init()},[])
  useEffect(()=>{if(searchParams.get('novo')==='1'){resetAll();setView('escolha')}},[searchParams])

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
  async function carregarOrcamentos(uid?:string){
    const id=uid||userId
    const{data}=await supabase.from('orcamentos').select('*').eq('user_id',id).order('created_at',{ascending:false})
    setOrcamentos(data||[])
  }
  async function carregarPagamentos(orcId:string){
    const{data}=await supabase.from('orcamento_pagamentos').select('*').eq('orcamento_id',orcId).order('data',{ascending:false})
    setPagamentos(data||[])
  }
  function resetAll(){
    setClienteNome('');setClienteWpp('');setClienteEmail('');setClienteObs('')
    setTipo('Orçamento');setTipoOutro('');setTipoDescricao('')
    setProfId('');setProfNome('');setSalvarFreelancer(false)
    setDataDoc(new Date().toISOString().split('T')[0]);setStatus('Aberto')
    setItens([{nome:'',qtd:1,unitario:'',total:0,obs:''}]);setDesconto('');setObservacoes('')
    setShowDetalhes(false);setEditandoId(null)
    setOdNome('');setOdWpp('');setOdEmail('');setOdProfId('');setOdObs('')
    setOdData(new Date().toISOString().split('T')[0]);setOdStatus('Em andamento')
    setDenteSel(null);setProcs([]);setPNome('');setPValor('');setPStatus('Planejado');setPObs('')
    setEditProcIdx(null);setOdHistPags([]);setOdPagValor('');setOdPagForma('Pix');setOdPagObs('')
    setOdDetOpen(false);setOdPagOpen(false);setShowPagForm(false)
  }
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
  const odTotal=procs.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const odPago=odHistPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const odSaldo=Math.max(0,odTotal-odPago)

  function adicionarProc(){
    if(!pNome.trim()||!pValor||parseFloat(pValor)<=0)return
    if(denteSel===null)return
    const novo={dente:denteSel,nome:pNome.trim(),valor:parseFloat(pValor)||0,status:pStatus,obs:pObs.trim()}
    if(editProcIdx!==null){setProcs(prev=>prev.map((p,i)=>i===editProcIdx?novo:p));setEditProcIdx(null)}
    else setProcs(prev=>[...prev,novo])
    setPNome('');setPValor('');setPStatus('Planejado');setPObs('')
  }
  function editarProc(idx:number){
    const p=procs[idx]
    setDenteSel(p.dente);setPNome(p.nome);setPValor(String(p.valor));setPStatus(p.status);setPObs(p.obs||'')
    setEditProcIdx(idx)
  }
  function removerProc(idx:number){
    setProcs(prev=>prev.filter((_,i)=>i!==idx))
    if(editProcIdx===idx){setEditProcIdx(null);setPNome('');setPValor('');setPStatus('Planejado');setPObs('')}
  }
  function adicionarPagOdonto(){
    const v=parseFloat(odPagValor.replace(',','.'))||0
    if(v<=0)return
    setOdHistPags(prev=>[...prev,{valor:v,forma:odPagForma,obs:odPagObs.trim(),data:new Date().toISOString().split('T')[0]}])
    setOdPagValor('');setOdPagObs('')
  }
  function denteCor(n:number){
    const procsDente=procs.filter(p=>p.dente===n)
    if(procsDente.length===0)return{bg:'rgba(255,255,255,.04)',border:'rgba(148,163,184,.2)',color:'#94A3B8'}
    const st=procsDente[procsDente.length-1].status
    if(st==='Pago'||st==='Concluído')return{bg:'rgba(34,197,94,.15)',border:'rgba(34,197,94,.4)',color:'#4ADE80'}
    if(st==='Em andamento')return{bg:'rgba(245,158,11,.15)',border:'rgba(245,158,11,.4)',color:'#FBBF24'}
    return{bg:'rgba(124,58,237,.15)',border:'rgba(124,58,237,.4)',color:'#C4B5FD'}
  }

  async function handleSalvarComum(){
    setMensagem('')
    const erros:string[]=[]
    if(!clienteNome.trim())erros.push('Informe o nome do cliente.')
    if(!clienteWpp||clienteWpp.replace(/\D/g,'').length<10)erros.push('Informe o WhatsApp com DDD.')
    const itensValidos=itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0)
    if(itensValidos.length===0)erros.push('Adicione pelo menos um serviço com nome e valor.')
    if(erros.length>0){setMensagem(erros.join(' | '));window.scrollTo({top:0,behavior:'smooth'});return}
    const payload={
      user_id:userId,cliente_nome:clienteNome.trim(),cliente_whatsapp:clienteWpp.replace(/\D/g,''),
      cliente_email:clienteEmail||null,cliente_obs:clienteObs||null,
      tipo:tipo==='__outro__'?(tipoOutro.trim()||'Outro'):tipo,
      profissional_id:(profId&&profId!=='__outro__')?profId:null,
      profissional_nome:profId==='__outro__'?(profNome.trim()||null):profId?(profissionais.find(p=>p.id===profId)?.nome||null):null,
      data:dataDoc,status,servicos:itensValidos,subtotal,desconto:descontoNum,total,
      valor_pago:0,saldo_restante:total,
      observacoes:observacoes||null,updated_at:new Date().toISOString(),
    }
    if(editandoId){
      const{error}=await supabase.from('orcamentos').update(payload).eq('id',editandoId)
      if(error){setMensagem('Erro ao salvar.');return}
    }else{
      const{error}=await supabase.from('orcamentos').insert(payload)
      if(error){setMensagem('Erro ao criar orçamento.');return}
    }
    resetAll();setView('lista');await carregarOrcamentos()
    setMensagem(editandoId?'Orçamento atualizado!':'Orçamento criado com sucesso!')
    setTimeout(()=>setMensagem(''),4000)
  }

  async function handleSalvarOdonto(){
    setMensagem('')
    if(!odNome.trim()){setMensagem('Informe o nome do paciente.');window.scrollTo({top:0,behavior:'smooth'});return}
    if(!odWpp||odWpp.replace(/\D/g,'').length<10){setMensagem('Informe o WhatsApp com DDD.');window.scrollTo({top:0,behavior:'smooth'});return}
    if(procs.length===0){setMensagem('Adicione pelo menos um procedimento.');window.scrollTo({top:0,behavior:'smooth'});return}
    const payload={
      user_id:userId,cliente_nome:odNome.trim(),cliente_whatsapp:odWpp.replace(/\D/g,''),
      cliente_email:odEmail||null,tipo:'Orçamento Odontológico',
      profissional_id:odProfId||null,
      profissional_nome:odProfId?(profissionais.find(p=>p.id===odProfId)?.nome||null):null,
      data:odData,status:odStatus,servicos:[],subtotal:odTotal,desconto:0,total:odTotal,
      valor_pago:odPago,saldo_restante:odSaldo,
      procedimentos_odonto:procs,hist_pagamentos:odHistPags,
      observacoes:odObs||null,updated_at:new Date().toISOString(),
    }
    if(editandoId){
      const{error}=await supabase.from('orcamentos').update(payload).eq('id',editandoId)
      if(error){setMensagem('Erro ao salvar.');return}
    }else{
      const{error}=await supabase.from('orcamentos').insert(payload)
      if(error){setMensagem('Erro ao criar orçamento.');return}
    }
    resetAll();setView('lista');await carregarOrcamentos()
    setMensagem(editandoId?'Orçamento atualizado!':'Orçamento odontológico criado!')
    setTimeout(()=>setMensagem(''),4000)
  }

  function abrirEditar(orc:any){
    setEditandoId(orc.id)
    const isOdonto=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
    if(isOdonto){
      setTipoOrc('odonto')
      setOdNome(orc.cliente_nome||'');setOdWpp(aplicarMascaraTel(orc.cliente_whatsapp||''))
      setOdEmail(orc.cliente_email||'');setOdProfId(orc.profissional_id||'')
      setOdData(orc.data||new Date().toISOString().split('T')[0]);setOdStatus(orc.status||'Em andamento')
      setProcs(orc.procedimentos_odonto||[]);setOdHistPags(orc.hist_pagamentos||[])
      setOdObs(orc.observacoes||'');setView('odonto')
    }else{
      setTipoOrc('comum')
      setClienteNome(orc.cliente_nome||'');setClienteWpp(aplicarMascaraTel(orc.cliente_whatsapp||''))
      setClienteEmail(orc.cliente_email||'');setClienteObs(orc.cliente_obs||'')
      const tipoSalvo=orc.tipo||'Orçamento'
      const tiposPadrao=['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno']
      if(tiposPadrao.includes(tipoSalvo)){setTipo(tipoSalvo);setTipoOutro('')}
      else{setTipo('__outro__');setTipoOutro(tipoSalvo)}
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
    await carregarOrcamentos()
  }
  function abrirModalPag(orc:any){
    setModalPagOrc(orc)
    const saldo=orc.saldo_restante||0
    setModalValor(saldo.toFixed(2).replace('.',','))
    setModalForma('Pix');setModalObs('');setModalErro('')
  }
  async function confirmarPagamentoModal(){
    if(!modalPagOrc)return
    const valor=parseFloat((modalValor||'0').replace(/\./g,'').replace(',','.'))||0
    if(valor<=0){setModalErro('Informe um valor maior que zero.');return}
    const saldo=modalPagOrc.saldo_restante||0
    if(valor>saldo+0.01){setModalErro('Valor maior que o saldo restante.');return}
    setModalSaving(true);setModalErro('')
    const novoValorPago=(modalPagOrc.valor_pago||0)+valor
    const novoSaldo=Math.max(0,(modalPagOrc.total||0)-novoValorPago)
    const novoStatus=novoSaldo<0.01?'Pago':'Parcialmente pago'
    try{await supabase.from('orcamento_pagamentos').insert({orcamento_id:modalPagOrc.id,user_id:userId,data:new Date().toISOString().split('T')[0],valor,forma:modalForma,observacao:modalObs||null})}catch(e){}
    try{await supabase.from('pagamentos').insert({user_id:userId,valor,data:new Date().toISOString().split('T')[0],status:'confirmado'})}catch(e){}
    await supabase.from('orcamentos').update({valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus,updated_at:new Date().toISOString()}).eq('id',modalPagOrc.id)
    setOrcamentos(prev=>prev.map(o=>o.id===modalPagOrc.id?{...o,valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus}:o))
    setModalSaving(false);setModalPagOrc(null)
    setMensagem(novoStatus==='Pago'?'Pagamento confirmado!':'Pagamento parcial registrado!')
    setTimeout(()=>setMensagem(''),4000)
  }
  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'');if(!tel)return
    let msg=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }
  function gerarPDF(orc:any){
    const win=window.open('','_blank');if(!win)return
    const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
    const linhas=isOd?(orc.procedimentos_odonto||[]).map((p:any)=>`<tr><td>Dente ${p.dente}</td><td>${p.nome}</td><td>${p.status}</td><td>R$ ${fmtBRL(p.valor||0)}</td></tr>`).join('')
      :(orc.servicos||[]).map((s:any)=>`<tr><td>${s.nome}</td><td>${s.qtd||1}</td><td>R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td>R$ ${fmtBRL(s.total||0)}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:32px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}.footer{margin-top:40px;text-align:center;color:#aaa;font-size:11px}</style></head><body><h1>${perfil?.nome_negocio||'Negócio'}</h1><p>${orc.tipo} · ${fmtData(orc.data)}</p><p><strong>${orc.cliente_nome}</strong></p><table><thead><tr>${isOd?'<th>Dente</th><th>Procedimento</th><th>Status</th><th>Valor</th>':'<th>Serviço</th><th>Qtd</th><th>Unitário</th><th>Total</th>'}</tr></thead><tbody>${linhas}<tr><td colspan="3"><strong>Total</strong></td><td><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr></tbody></table><div class="footer">Gerado pelo ClienteMarcado</div></body></html>`)
    win.document.close();setTimeout(()=>win.print(),500)
  }

  const orcsFiltrados=orcamentos.filter(o=>{
    const passaStatus=filtroStatus==='Todos'||o.status===filtroStatus
    const passaCliente=!filtroCliente||o.cliente_nome?.toLowerCase().includes(filtroCliente.toLowerCase())
    return passaStatus&&passaCliente
  })
  const totalAberto=orcamentos.filter(o=>['Aberto','Em andamento','Parcialmente pago'].includes(o.status)).length
  const totalAReceber=orcamentos.filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status)).reduce((a,o)=>a+(o.saldo_restante||0),0)
  const mesAtual=new Date().toISOString().slice(0,7)
  const recebidoMes=orcamentos.filter(o=>o.updated_at?.slice(0,7)===mesAtual&&o.valor_pago>0).reduce((a,o)=>a+(o.valor_pago||0),0)
  const parciais=orcamentos.filter(o=>o.status==='Parcialmente pago').length
  const orcDetalhe=orcamentos.find(o=>o.id===detalheId)

  const inp:React.CSSProperties={width:'100%',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px 14px',fontSize:'14px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:'5px'}
  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'14px',padding:'16px',marginBottom:'10px',border:'1px solid rgba(148,163,184,.14)',boxShadow:'0 4px 16px rgba(0,0,0,.25)'}

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile="Orçamentos"/>
      <div className="psb-main" style={{flex:1,minWidth:0,minHeight:'100vh',display:'flex',flexDirection:'column'}}>

        {/* ── LISTA ── */}
        {view==='lista'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'24px 24px 0',maxWidth:'1280px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'16px'}}>
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
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'16px'}}>
                {[
                  {label:'Em aberto',valor:totalAberto,fmt:'n',cor:'#3B82F6',bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.25)'},
                  {label:'A receber',valor:totalAReceber,fmt:'brl',cor:'#F59E0B',bg:'rgba(245,158,11,.12)',border:'rgba(245,158,11,.25)'},
                  {label:'Recebido no mês',valor:recebidoMes,fmt:'brl',cor:'#22C55E',bg:'rgba(34,197,94,.12)',border:'rgba(34,197,94,.25)'},
                  {label:'Parciais',valor:parciais,fmt:'n',cor:'#A78BFA',bg:'rgba(167,139,250,.12)',border:'rgba(167,139,250,.25)'},
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
                {['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=>(
                  <button key={s} onClick={()=>setFiltroStatus(s)}
                    style={{padding:'6px 12px',borderRadius:'999px',fontSize:'11px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',minHeight:'32px',
                      background:filtroStatus===s?'linear-gradient(135deg,#3B82F6,#7C3AED)':'rgba(255,255,255,.06)',
                      color:filtroStatus===s?'#fff':'#94A3B8',borderColor:filtroStatus===s?'transparent':'rgba(255,255,255,.12)'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:'0 24px 60px',maxWidth:'1280px',margin:'0 auto'}}>
              {orcsFiltrados.length===0?(
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
                  {orcsFiltrados.map(orc=>{
                    const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                    const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
                    return(
                      <div key={orc.id} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px',gap:'8px'}}>
                          <div style={{minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px',flexWrap:'wrap'}}>
                              <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>{orc.cliente_nome}</p>
                              {isOd&&<span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:'rgba(124,58,237,.18)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.3)',whiteSpace:'nowrap' as const}}>Odontológico</span>}
                            </div>
                            <p style={{fontSize:'11px',color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}</p>
                          </div>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const,flexShrink:0}}>{orc.status}</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'10px'}}>
                          {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#F59E0B':'#22C55E'}].map(f=>(
                            <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'8px'}}>
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
                            style={{gridColumn:'1/-1',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'8px',padding:'6px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ESCOLHA ── */}
        {view==='escolha'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'24px 20px 60px',maxWidth:'700px',margin:'0 auto'}}>
              <button onClick={()=>setView('lista')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'20px'}}>
                ← Voltar à lista
              </button>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'6px'}}>Novo orçamento</h1>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'28px'}}>Escolha o tipo de orçamento que deseja criar.</p>
              <style dangerouslySetInnerHTML={{__html:'@media(max-width:560px){.orc-escolha{grid-template-columns:1fr!important}}'}}/>
              <div className="orc-escolha" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <button onClick={()=>{resetAll();setTipoOrc('comum');setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'18px',padding:'24px 20px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'12px',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.55)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.22)'}}>
                  <div style={{width:'48px',height:'48px',borderRadius:'12px',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
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
                <button onClick={()=>{resetAll();setTipoOrc('odonto');setView('odonto')}}
                  style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(124,58,237,.28)',borderRadius:'18px',padding:'24px 20px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'12px',position:'relative',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.60)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.28)'}}>
                  <div style={{position:'absolute',top:'14px',right:'14px',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'2px 8px',fontSize:'10px',fontWeight:700,color:'#C4B5FD',letterSpacing:'.06em'}}>ODONTOLÓGICO</div>
                  <div style={{width:'48px',height:'48px',borderRadius:'12px',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
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

        {/* ── FORM COMUM ── */}
        {view==='form'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div className="od-bdy" style={{padding:'12px 12px 60px',maxWidth:'900px',margin:'0 auto'}}>
              <button onClick={()=>{resetAll();setView(editandoId?'lista':'escolha')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'12px'}}>
                ← {editandoId?'Voltar à lista':'Voltar'}
              </button>
              <h1 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'3px'}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'16px'}}>Preencha os dados e envie para o cliente.</p>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>{mensagem}</div>}
              {/* Cliente */}
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
              {/* Detalhes recolhível */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setShowDetalhes(!showDetalhes)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Detalhes do documento</p>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {showDetalhes&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'14px'}}>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div>
                        <label style={lbl}>Tipo</label>
                        <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                          {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t=><option key={t} value={t}>{t}</option>)}
                          <option value="__outro__">Outro</option>
                        </select>
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
              {/* Servicos */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>
                </div>
                <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'12px'}}>Adicione serviços ou itens deste orçamento.</p>
                {itens.map((item,idx)=>(
                  <div key={idx} style={{marginBottom:'8px',padding:'12px 10px',background:'rgba(255,255,255,.04)',borderRadius:'10px',border:'1px solid rgba(148,163,184,.12)',width:'100%',boxSizing:'border-box'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em'}}>Item {idx+1}</span>
                      {itens.length>1&&<button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                        style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',color:'#F87171',cursor:'pointer',fontSize:'12px',padding:'2px 8px'}}>Remover</button>}
                    </div>
                    <div style={{marginBottom:'8px'}}>
                      <label style={lbl}>Nome do serviço *</label>
                      <input style={inp} type="text" placeholder="Ex: Corte, limpeza de pele..." value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                      <div><label style={lbl}>Qtd.</label><input style={{...inp,textAlign:'center'}} type="number" min="1" value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)}/></div>
                      <div><label style={lbl}>Valor (R$)</label><input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)}/></div>
                    </div>
                    <div style={{background:item.total>0?'rgba(34,197,94,.08)':'rgba(255,255,255,.03)',border:`1px solid ${item.total>0?'rgba(34,197,94,.22)':'rgba(255,255,255,.06)'}`,borderRadius:'8px',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>Total</span>
                      <span style={{fontSize:'15px',fontWeight:800,color:item.total>0?'#4ADE80':'#475569'}}>R$ {fmtBRL(item.total||0)}</span>
                    </div>
                    <input style={{...inp,fontSize:'13px'}} type="text" placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)}/>
                  </div>
                ))}
                <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                  style={{background:'none',border:'none',color:'#60A5FA',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0'}}>
                  + Adicionar outro serviço
                </button>
                <div style={{marginTop:'12px',background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'12px',border:'1px solid rgba(148,163,184,.08)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'8px'}}>
                    <span style={{color:'#94A3B8'}}>Subtotal</span><span style={{fontWeight:600,color:'#F8FAFC'}}>R$ {fmtBRL(subtotal)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
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
              {/* Observacoes */}
              <div style={{marginBottom:'10px'}}>
                <label style={lbl}>Observações (opcional)</label>
                <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Ex: cliente preferiu parcelar, combinado via Pix..." value={observacoes} onChange={e=>setObservacoes(e.target.value)}/>
              </div>
            </div>
            {/* Footer mobile */}
            <div className="od-footer">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total final</span>
                <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(total)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                <button onClick={()=>{resetAll();setView('lista')}} style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
                <button onClick={handleSalvarComum} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar':'Criar orçamento'}</button>
              </div>
            </div>
            {/* Botoes desktop */}
            <div style={{display:'none',padding:'0 12px 40px',maxWidth:'900px',margin:'0 auto'}} className="od-desk-btns">
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={handleSalvarComum} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'13px 24px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar alterações':'Criar orçamento'}</button>
                <button onClick={()=>{resetAll();setView('lista')}} style={{background:'rgba(255,255,255,.06)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'13px 20px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
              </div>
            </div>
          </div>
        )}

        {/* ── FORM ODONTO ── */}
        {view==='odonto'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div className="od-bdy" style={{padding:'12px 12px 140px',maxWidth:'900px',margin:'0 auto'}}>
              <button onClick={()=>{resetAll();setView(editandoId?'lista':'escolha')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'12px'}}>
                ← {editandoId?'Voltar à lista':'Voltar'}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'3px'}}>
                <h1 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Orçamento odontológico</h1>
                <span style={{fontSize:'10px',fontWeight:700,background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'3px 10px',color:'#C4B5FD'}}>Odontológico</span>
              </div>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'16px'}}>Selecione os dentes, adicione procedimentos e acompanhe o tratamento.</p>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>{mensagem}</div>}

              {/* Paciente */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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

              {/* Detalhes recolhivel */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdDetOpen(!odDetOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Detalhes do tratamento</p>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:odDetOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {odDetOpen&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'14px'}}>
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
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Odontograma</p>
                </div>
                <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'16px'}}>Toque em um dente para adicionar procedimentos.</p>
                {[{label:'Arcada superior',dentes:DENTES_SUP},{label:'Arcada inferior',dentes:DENTES_INF}].map(({label,dentes})=>(
                  <div key={label} style={{marginBottom:'16px'}}>
                    <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'8px',textAlign:'center'}}>{label}</p>
                    <div style={{display:'flex',justifyContent:'center',gap:'3px',flexWrap:'wrap'}}>
                      {dentes.slice(0,dentes.length/2).map(n=>{
                        const{bg,border,color}=denteCor(n)
                        const isSel=denteSel===n
                        return(
                          <button key={n} onClick={()=>setDenteSel(isSel?null:n)}
                            style={{width:'30px',height:'30px',borderRadius:'6px',border:`1.5px solid ${isSel?'#7C3AED':border}`,background:isSel?'linear-gradient(135deg,#3B82F6,#7C3AED)':bg,color:isSel?'#fff':color,fontSize:'9px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .15s',boxShadow:isSel?'0 0 8px rgba(124,58,237,.5)':'none'}}>
                            {n}
                          </button>
                        )
                      })}
                      <div style={{width:'1px',background:'rgba(148,163,184,.2)',margin:'0 4px'}}/>
                      {dentes.slice(dentes.length/2).map(n=>{
                        const{bg,border,color}=denteCor(n)
                        const isSel=denteSel===n
                        return(
                          <button key={n} onClick={()=>setDenteSel(isSel?null:n)}
                            style={{width:'30px',height:'30px',borderRadius:'6px',border:`1.5px solid ${isSel?'#7C3AED':border}`,background:isSel?'linear-gradient(135deg,#3B82F6,#7C3AED)':bg,color:isSel?'#fff':color,fontSize:'9px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .15s',boxShadow:isSel?'0 0 8px rgba(124,58,237,.5)':'none'}}>
                            {n}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {/* Legenda */}
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'8px',justifyContent:'center'}}>
                  {[{c:'rgba(148,163,184,.2)',t:'Sem procedimento'},{c:'rgba(124,58,237,.4)',t:'Planejado'},{c:'rgba(245,158,11,.4)',t:'Em andamento'},{c:'rgba(34,197,94,.4)',t:'Concluído/Pago'}].map(({c,t})=>(
                    <div key={t} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'3px',border:`1.5px solid ${c}`,flexShrink:0}}/>
                      <span style={{fontSize:'10px',color:'#64748B'}}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adicionar procedimento */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Adicionar procedimento</p>
                </div>
                {denteSel===null?(
                  <div style={{background:'rgba(255,255,255,.03)',border:'1px dashed rgba(148,163,184,.18)',borderRadius:'10px',padding:'16px',textAlign:'center'}}>
                    <p style={{fontSize:'13px',color:'#64748B'}}>Selecione um dente no odontograma para adicionar um procedimento.</p>
                  </div>
                ):(
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.2)',borderRadius:'8px',padding:'8px 12px',display:'flex',alignItems:'center',gap:'8px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#60A5FA'}}>Dente selecionado: {denteSel}</p>
                      <button onClick={()=>setDenteSel(null)} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:'14px',marginLeft:'auto',lineHeight:1}}>×</button>
                    </div>
                    <div><label style={lbl}>Procedimento *</label><input style={inp} type="text" placeholder="Ex: restauração, canal, limpeza..." value={pNome} onChange={e=>setPNome(e.target.value)}/></div>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div><label style={lbl}>Valor (R$) *</label><input style={inp} type="number" placeholder="0,00" value={pValor} onChange={e=>setPValor(e.target.value)}/></div>
                      <div><label style={lbl}>Status</label>
                        <select style={sel} value={pStatus} onChange={e=>setPStatus(e.target.value)}>
                          {['Planejado','Em andamento','Concluído','Pago'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label style={lbl}>Observação opcional</label><input style={inp} type="text" placeholder="Ex: realizar em duas sessões..." value={pObs} onChange={e=>setPObs(e.target.value)}/></div>
                    <button onClick={adicionarProc} disabled={!pNome.trim()||!pValor||parseFloat(pValor)<=0}
                      style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:(!pNome.trim()||!pValor||parseFloat(pValor)<=0)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      {editProcIdx!==null?'Atualizar procedimento':'Adicionar procedimento'}
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de procedimentos */}
              {procs.length>0&&(
                <div style={card}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Procedimentos adicionados</p>
                    </div>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#60A5FA'}}>{procs.length} item{procs.length!==1?'s':''}</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {procs.map((p,i)=>{
                      const stCor=PROC_STATUS_COR[p.status]||PROC_STATUS_COR['Planejado']
                      return(
                        <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(148,163,184,.10)',borderRadius:'10px',padding:'12px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px',flexWrap:'wrap'}}>
                                <span style={{fontSize:'11px',fontWeight:700,color:'#60A5FA',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'999px',padding:'1px 7px'}}>Dente {p.dente}</span>
                                <span style={{fontSize:'11px',fontWeight:700,padding:'1px 7px',borderRadius:'999px',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{p.status}</span>
                              </div>
                              <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{p.nome}</p>
                              {p.obs&&<p style={{fontSize:'11px',color:'#64748B'}}>{p.obs}</p>}
                            </div>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px',flexShrink:0}}>
                              <p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</p>
                              <div style={{display:'flex',gap:'4px'}}>
                                <button onClick={()=>editarProc(i)} style={{background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                                <button onClick={()=>removerProc(i)} style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.20)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{marginTop:'12px',background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:'8px',padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'13px',color:'#94A3B8',fontWeight:600}}>Total do tratamento</span>
                    <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(odTotal)}</span>
                  </div>
                </div>
              )}

              {/* Pagamentos */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdPagOpen(!odPagOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Pagamentos</p>
                      <p style={{fontSize:'11px',color:'#64748B'}}>Pago: R$ {fmtBRL(odPago)} · Saldo: R$ {fmtBRL(odSaldo)}</p>
                    </div>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:odPagOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {odPagOpen&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'14px 0'}}>
                      {[{l:'Total',v:odTotal,c:'#F8FAFC'},{l:'Pago',v:odPago,c:'#4ADE80'},{l:'Saldo',v:odSaldo,c:odSaldo>0?'#FBBF24':'#4ADE80'}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.05)',borderRadius:'8px',padding:'8px',border:'1px solid rgba(148,163,184,.10)'}}>
                          <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                          <p style={{fontSize:'14px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'10px'}}>
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
                        style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',opacity:(!odPagValor||parseFloat(odPagValor)<=0)?0.5:1}}>
                        Registrar pagamento
                      </button>
                    </div>
                    {odHistPags.length>0&&(
                      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                        {odHistPags.map((p,i)=>(
                          <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div>
                              <span style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                              <span style={{fontSize:'11px',color:'#64748B',marginLeft:'8px'}}>{p.forma} · {fmtData(p.data)}</span>
                              {p.obs&&<p style={{fontSize:'11px',color:'#64748B'}}>{p.obs}</p>}
                            </div>
                            <button onClick={()=>setOdHistPags(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:'16px'}}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Observacoes */}
              <div style={{marginBottom:'10px'}}>
                <label style={lbl}>Observações gerais do tratamento</label>
                <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Ex: tratamento dividido em etapas, retorno em 15 dias..." value={odObs} onChange={e=>setOdObs(e.target.value)}/>
              </div>
            </div>
            {/* Footer mobile */}
            <div className="od-footer">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total do tratamento</span>
                <span style={{fontSize:'18px',fontWeight:800,color:'#C4B5FD'}}>R$ {fmtBRL(odTotal)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                <button onClick={()=>{resetAll();setView('lista')}} style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
                <button onClick={handleSalvarOdonto} style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar':'Criar orçamento'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── DETALHE ── */}
        {view==='detalhe'&&orcDetalhe&&(()=>{
          const orc=orcDetalhe
          const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
          const isOd=orc.tipo==='Orçamento Odontológico'||(orc.procedimentos_odonto?.length>0)
          return(
            <div style={{padding:'20px 16px 60px',maxWidth:'900px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
                <button onClick={()=>{setView('lista');setShowPagForm(false)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit'}}>← Voltar</button>
                <h2 style={{fontSize:'18px',fontWeight:800,color:'#F8FAFC'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
                {isOd&&<span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:'rgba(124,58,237,.18)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.3)'}}>Odontológico</span>}
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',color:'#4ADE80'}}>{mensagem}</div>}
              <div style={card}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                  {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(
                    <div key={f.l} style={{background:'rgba(255,255,255,.05)',borderRadius:'8px',padding:'10px',border:'1px solid rgba(148,163,184,.10)'}}>
                      <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                      <p style={{fontSize:'16px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Registrar pagamento</button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
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
                        await carregarOrcamentos();await carregarPagamentos(orc.id)
                        setMensagem('Pagamento registrado!');setTimeout(()=>setMensagem(''),3000)
                      }} style={{flex:2,background:'linear-gradient(135deg,#3B82F6,#7C3AED)',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{savingPag?'Salvando...':'Confirmar'}</button>
                    </div>
                  </div>
                )}
              </div>
              {isOd&&orc.procedimentos_odonto?.length>0&&(
                <div style={card}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>Procedimentos odontológicos</p>
                  {orc.procedimentos_odonto.map((p:any,i:number)=>{
                    const stCor=PROC_STATUS_COR[p.status]||PROC_STATUS_COR['Planejado']
                    return(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                        <div>
                          <div style={{display:'flex',gap:'6px',marginBottom:'2px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#60A5FA'}}>Dente {p.dente}</span>
                            <span style={{fontSize:'11px',padding:'0 6px',borderRadius:'999px',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{p.status}</span>
                          </div>
                          <p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{p.nome}</p>
                        </div>
                        <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor||0)}</span>
                      </div>
                    )
                  })}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'15px',fontWeight:800,paddingTop:'10px',marginTop:'4px'}}>
                    <span style={{color:'#F8FAFC'}}>Total</span><span style={{color:'#60A5FA'}}>R$ {fmtBRL(orc.total)}</span>
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
                <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Paciente</p>
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
          <div style={{position:'fixed',zIndex:90,background:'linear-gradient(145deg,#0B1628,#101B2D)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'22px',padding:'24px',boxShadow:'0 24px 80px rgba(0,0,0,.6)',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(92vw,440px)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'18px'}}>
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#4ADE80',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>Orçamento</p>
                <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC'}}>Confirmar pagamento</p>
              </div>
              <button onClick={()=>setModalPagOrc(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'20px',lineHeight:1}}>×</button>
            </div>
            <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'12px',padding:'14px',marginBottom:'16px'}}>
              {[{l:'Cliente',v:modalPagOrc.cliente_nome,c:'#F8FAFC'},{l:'Total',v:'R$ '+fmtBRL(modalPagOrc.total),c:'#F8FAFC'},{l:'Já pago',v:'R$ '+fmtBRL(modalPagOrc.valor_pago||0),c:'#4ADE80'},{l:'Saldo',v:'R$ '+fmtBRL(modalPagOrc.saldo_restante||0),c:'#FBBF24'}].map(({l,v,c:cor})=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px'}}>
                  <span style={{color:'#64748B'}}>{l}</span><span style={{fontWeight:700,color:cor}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'16px'}}>
              <div>
                <label style={lbl}>Valor recebido *</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span>
                  <input type="text" inputMode="decimal" value={modalValor} onChange={e=>setModalValor(e.target.value.replace(/[^0-9,]/g,''))}
                    style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'10px',padding:'12px 14px 12px 36px',fontSize:'16px',fontWeight:700,color:'#4ADE80',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}}/>
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
            {modalErro&&<div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#F87171',marginBottom:'12px'}}>{modalErro}</div>}
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setModalPagOrc(null)} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',padding:'13px',color:'#94A3B8',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              <button onClick={confirmarPagamentoModal} disabled={modalSaving} style={{flex:2,background:'linear-gradient(135deg,#22C55E,#16A34A)',border:'none',borderRadius:'12px',padding:'13px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:modalSaving?0.7:1}}>
                {modalSaving?'Registrando...':'Confirmar recebimento'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
