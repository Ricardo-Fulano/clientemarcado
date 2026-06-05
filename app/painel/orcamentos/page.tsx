'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
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

function fmtBRL(v:number){return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
function fmtData(d:string){if(!d)return '';const[a,m,di]=d.split('-');return di+'/'+m+'/'+a}
function aplicarMascaraTel(v:string){
  const n=v.replace(/\D/g,'').slice(0,11)
  if(n.length>10)return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7)
  if(n.length>6) return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6)
  if(n.length>2) return '('+n.slice(0,2)+') '+n.slice(2)
  if(n.length>0) return '('+n
  return ''
}

const MOBILE_CSS = `
  html, body { overflow-x: hidden; width: 100%; }
  *, *::before, *::after { box-sizing: border-box; }

  .cm-drawer { position:fixed; top:0; left:0; bottom:0; width:300px; max-width:85vw; background:#0B172A; z-index:50; transform:translateX(-100%); transition:transform .3s ease; display:flex; flex-direction:column; }
  .cm-drawer.open { transform:translateX(0); }
  .cm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:49; opacity:0; pointer-events:none; transition:opacity .3s; }
  .cm-overlay.open { opacity:1; pointer-events:auto; }

  .cm-header-mobile { display:none; align-items:center; justify-content:space-between; padding:0 16px; height:56px; background:#0B172A; z-index:10; box-shadow:0 1px 4px rgba(0,0,0,.2); width:100%; max-width:100%; flex-shrink:0; overflow:hidden; }

  .cm-mobile-footer { display:none; position:fixed; bottom:0; left:0; right:0; width:100%; max-width:100%; background:#0B172A; border-top:1px solid rgba(255,255,255,0.08); padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px)); z-index:25; flex-direction:column; gap:6px; box-shadow:0 -2px 12px rgba(0,0,0,.07); box-sizing:border-box; }

  @media(min-width:1024px){
    .cm-header-mobile { display:none !important; }
    .cm-mobile-footer { display:none !important; }
    .cm-sidebar { display:flex !important; }
    .cm-main { margin-left:220px !important; }
    .cm-resumo-mobile { display:none !important; }
    .cm-form-right { display:block !important; }
    .cm-form-grid { grid-template-columns:1fr 300px !important; }
  }

  @media(max-width:1023px){
    body,html{background:#050B16!important;}
    .psb-main,.cm-main{background:#050B16!important;}
    .cm-sidebar { display:none !important; }
    .cm-main,.psb-main { margin-left:0 !important; width:100% !important; max-width:100% !important; overflow-x:hidden !important; box-sizing:border-box !important; }
    .cm-footer-fixed { padding:10px 12px !important; }
    .cm-footer-fixed .cm-footer-btns { flex-direction:column !important; gap:8px !important; }
    .cm-footer-fixed .cm-footer-btns button { width:100% !important; min-width:unset !important; flex:none !important; }
    .cm-footer-fixed .cm-footer-resumo { display:none !important; }
    .cm-obs-resumo-grid { grid-template-columns:1fr !important; }
    .psb-mhdr { width:100% !important; flex-shrink:0 !important; }
    .psb-wrapper { flex-direction:column !important; }
    .cm-header-mobile { display:flex !important; }
    .cm-form-grid { grid-template-columns:1fr !important; }
    .cm-form-right { display:block !important; }
    .cm-mobile-footer { display:none !important; }
    .cm-resumo-mobile { display:block !important; }
    .cm-lista-pad { padding:16px 16px 100px !important; }
    .cm-orc-filters { overflow-x:auto !important; flex-wrap:nowrap !important; padding-bottom:4px; -webkit-overflow-scrolling:touch; }
    .cm-form-pad,.cm-content-pad { padding:0 !important; max-width:100% !important; width:100% !important; box-sizing:border-box !important; }
    .cm-form-inner { padding:12px !important; padding-bottom:80px !important; width:100% !important; box-sizing:border-box !important; overflow-x:hidden !important; }
    .cm-detalhe-pad { padding:16px 16px 80px !important; }
    .cm-metrics { grid-template-columns:1fr 1fr !important; gap:10px !important; }
    .cm-orc-filters { overflow-x:auto !important; flex-wrap:nowrap !important; padding-bottom:4px; -webkit-overflow-scrolling:touch; max-width:100%; }
    .cm-orc-search { width:100% !important; max-width:100% !important; margin-top:8px; }
    .cm-2col { grid-template-columns:1fr !important; }
    .cm-inprow { grid-template-columns:1fr !important; }
    .cm-btn-novo { width:100% !important; margin-top:8px; }
    .cm-title-row { flex-direction:column !important; }
    .cm-card { width:100% !important; max-width:100% !important; box-sizing:border-box !important; padding:16px !important; border-radius:16px !important; margin-bottom:14px !important; }
  }

  @media(max-width:1023px){
    .cm-lista-topo { padding:16px 16px 0 !important; }
    .cm-lista-body { padding:0 16px 80px !important; }
    .cm-novo-btn-lista { width:100% !important; margin-top:12px; height:52px !important; border-radius:14px !important; font-size:16px !important; }
    .cm-atalhos-grid { grid-template-columns:1fr 1fr !important; gap:10px !important; }
    .cm-kpi-grid { grid-template-columns:1fr 1fr !important; gap:10px !important; }
    .cm-busca-filtros { flex-direction:column !important; gap:10px !important; }
    .cm-busca-input { width:100% !important; }
    .cm-filtros-wrap { overflow-x:auto !important; flex-wrap:nowrap !important; -webkit-overflow-scrolling:touch !important; padding-bottom:4px; scrollbar-width:none; }
    .cm-filtros-wrap::-webkit-scrollbar { display:none; }
    .cm-acoes-rapidas-wrap { overflow-x:auto !important; flex-wrap:nowrap !important; -webkit-overflow-scrolling:touch !important; scroll-snap-type:x mandatory; padding-bottom:4px; scrollbar-width:none; }
    .cm-acoes-rapidas-wrap::-webkit-scrollbar { display:none; }
    .cm-acao-card { min-width:150px !important; max-width:160px !important; scroll-snap-align:start !important; flex-shrink:0 !important; }
    .cm-tabela-desktop { display:none !important; }
    .cm-cards-mobile { display:flex !important; }
    .cm-novo-btn { width:100% !important; margin-top:8px; }
  }
  @media(min-width:1024px){
    .cm-tabela-desktop { display:block !important; }
    .cm-cards-mobile { display:none !important; }
    .cm-novo-btn-lista { height:auto !important; width:auto !important; }
  }
  @media(max-width:1023px){
    .cm-acoes-grid { grid-template-columns:1fr 1fr !important; }
  }
  @media(max-width:380px){
    .cm-atalhos-grid { grid-template-columns:1fr !important; }
    .cm-kpi-grid { grid-template-columns:1fr !important; }
    .cm-acoes-grid { grid-template-columns:1fr !important; }
  }
  .cm-acoes-scroll::-webkit-scrollbar { display:none; }
  .cm-acoes-scroll { scrollbar-width:none; -ms-overflow-style:none; }
  .cm-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .cm-table-scroll::-webkit-scrollbar { height:3px; }
  .cm-table-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,.04); }
  .cm-table-scroll::-webkit-scrollbar-thumb { background:rgba(99,102,241,.4); border-radius:999px; }
  @media(max-width:768px){
    .cm-add-grid { grid-template-columns:1fr !important; }
    .cm-add-grid-odonto { grid-template-columns:1fr 1fr !important; }
  }
  .cm-tooth { width:46px; height:52px; border-radius:48% 48% 42% 42% / 55% 55% 38% 38%; display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; cursor:pointer; border:2px solid rgba(200,200,210,.3); transition:all .18s; flex-shrink:0; background:#F0F4F8; color:#0F172A; box-shadow:0 2px 6px rgba(0,0,0,.18); }
  .cm-tooth:hover { transform:scale(1.08); box-shadow:0 4px 12px rgba(0,0,0,.25); }
  .cm-tooth.selected { background:#083344; border-color:#22D3EE; color:#E0F9FF; box-shadow:0 0 0 2px rgba(34,211,238,.35),0 0 16px rgba(34,211,238,.50); transform:scale(1.06); }
  .cm-tooth.realizado { background:rgba(34,197,94,.22); border-color:rgba(34,197,94,.75); color:#86EFAC; box-shadow:0 0 0 2px rgba(34,197,94,.30); }
  .cm-tooth.pendente { background:rgba(239,68,68,.22); border-color:rgba(239,68,68,.75); color:#FCA5A5; box-shadow:0 0 0 2px rgba(239,68,68,.30); }
  @media(max-width:768px){ .cm-tooth { width:38px; height:44px; font-size:11px; } }
  @media(max-width:400px){ .cm-tooth { width:32px; height:38px; font-size:10px; } }
  .cm-tooth-grid { display:flex; gap:5px; justify-content:center; }
  .cm-lista-body { overflow-x:hidden; }
  .cm-lista-topo { overflow-x:hidden; }
  @media(max-width:380px){
    .cm-metrics { grid-template-columns:1fr !important; }
    .cm-serv-qtd-val { grid-template-columns:1fr !important; }
  }
`

export default function Orcamentos() {
  const [userId,setUserId]=useState('')
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [filtroStatus,setFiltroStatus]=useState('Todos')
  const [filtroCliente,setFiltroCliente]=useState('')
  const [view,setView]=useState<'lista'|'form'|'detalhe'|'escolha'>('lista')
  const [editandoId,setEditandoId]=useState<string|null>(null)
  const [detalheId,setDetalheId]=useState<string|null>(null)
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [mensagem,setMensagem]=useState('')
  const [savingPag,setSavingPag]=useState(false)

  // Form
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
  const [exigirSinal,setExigirSinal]=useState(false)
  const [sinalTipo,setSinalTipo]=useState('fixo')
  const [sinalValor,setSinalValor]=useState('')
  const [linkPag,setLinkPag]=useState('')
  const [obsPagamento,setObsPagamento]=useState('')
  const [observacoes,setObservacoes]=useState('')
  const [dentesSelec,setDentesSelec]=useState<number[]>([])
  const [dentesStatus,setDentesStatus]=useState<Record<number,string>>({})
  const [procOdonto,setProcOdonto]=useState<any[]>([])
  const [procNome,setProcNome]=useState('')
  const [procValor,setProcValor]=useState('')
  const [procStatus,setProcStatus]=useState('A realizar')
  const [procObs,setProcObs]=useState('')
  const [procDentes,setProcDentes]=useState<number[]>([])
  const [procQtd,setProcQtd]=useState(1)

  // Detalhe pagamento
  const [pagData,setPagData]=useState(new Date().toISOString().split('T')[0])
  const [pagValor,setPagValor]=useState('')
  const [pagForma,setPagForma]=useState('Pix')
  const [pagObs,setPagObs]=useState('')
  const [showPagForm,setShowPagForm]=useState(false)

  // Accordions
  const [showDetalhes,setShowDetalhes]=useState(false)
  const [showPagSection,setShowPagSection]=useState(false)
  const [showObs,setShowObs]=useState(false)

  // Hist pags
  const [histPags,setHistPags]=useState<any[]>([])
  const [editandoPagIdx,setEditandoPagIdx]=useState<number|null>(null)
  const [hpValor,setHpValor]=useState('')
  const [hpForma,setHpForma]=useState('Pix')
  const [hpFormaOutro,setHpFormaOutro]=useState('')
  const [hpData,setHpData]=useState(new Date().toISOString().split('T')[0])
  const [hpObs,setHpObs]=useState('')
  const [showHpForm,setShowHpForm]=useState(false)
  const [showSinal,setShowSinal]=useState(false)
  const [showLinkPag,setShowLinkPag]=useState(false)
  const [usarOdontograma,setUsarOdontograma]=useState(false)
  const [tipoOrcamento,setTipoOrcamento]=useState<'simples'|'odontologico'|null>(null)

  useEffect(()=>{init()},[])

  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data:p}=await supabase.from('perfis').select('*').eq('user_id',user.id).single()
    setPerfil(p)
    const {data:profs}=await supabase.from('profissionais').select('id,nome').eq('user_id',user.id)
    setProfissionais(profs||[])
    await carregarOrcamentos(user.id)
    setLoading(false)
  }

  async function carregarOrcamentos(uid?:string){
    const id=uid||userId
    const {data}=await supabase.from('orcamentos').select('*').eq('user_id',id).order('created_at',{ascending:false})
    setOrcamentos(data||[])
  }

  async function carregarPagamentos(orcId:string){
    const {data}=await supabase.from('orcamento_pagamentos').select('*').eq('orcamento_id',orcId).order('data',{ascending:false})
    setPagamentos(data||[])
  }

  const subtotal=itens.reduce((a,i)=>a+(parseFloat(i.unitario||'0')*(parseInt(i.qtd||'1')||1)),0)+procOdonto.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const descontoNum=parseFloat(desconto||'0')
  const total=Math.max(0,subtotal-descontoNum)
  const valorPagoLocal=histPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const saldoLocal=Math.max(0,total-valorPagoLocal)

  function atualizarItem(idx:number,campo:string,val:any){
    setItens(prev=>{
      const n=[...prev];n[idx]={...n[idx],[campo]:val}
      if(campo==='unitario'||campo==='qtd') n[idx].total=parseFloat(n[idx].unitario||'0')*(parseInt(n[idx].qtd)||1)
      return n
    })
  }

  function resetForm(){
    setClienteNome('');setClienteWpp('');setClienteEmail('');setClienteObs('')
    setTipo('Orçamento');setTipoOutro('');setTipoDescricao('')
    setProfId('');setProfNome('');setSalvarFreelancer(false)
    setDataDoc(new Date().toISOString().split('T')[0]);setStatus('Aberto')
    setItens([{nome:'',qtd:1,unitario:'',total:0,obs:'',showSug:false}])
    setDesconto('');setExigirSinal(false);setSinalTipo('fixo');setSinalValor('')
    setLinkPag('');setObsPagamento('');setObservacoes('')
    setHistPags([]);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpObs('')
    setDentesSelec([]);setProcOdonto([])
    setShowDetalhes(false);setShowPagSection(false);setShowObs(false)
    setShowHpForm(false);setShowSinal(false);setShowLinkPag(false);setShowPagForm(false)
    setEditandoId(null)
  }

  function abrirEditar(orc:any){
    setEditandoId(orc.id)
    setClienteNome(orc.cliente_nome||'');setClienteWpp(aplicarMascaraTel(orc.cliente_whatsapp||''))
    setClienteEmail(orc.cliente_email||'');setClienteObs(orc.cliente_obs||'')
    const tipoSalvo=orc.tipo||'Orçamento'
    const tiposPadrao=['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno']
    if(tiposPadrao.includes(tipoSalvo)){setTipo(tipoSalvo);setTipoOutro('');setTipoDescricao('')}
    else{setTipo('__outro__');setTipoOutro(tipoSalvo);setTipoDescricao(orc.tipo_descricao||'')}
    setProfId(orc.profissional_id||'');setProfNome(orc.profissional_nome||'');setSalvarFreelancer(false)
    setDataDoc(orc.data||new Date().toISOString().split('T')[0]);setStatus(orc.status||'Aberto')
    setItens(orc.servicos?.length?orc.servicos.map((s:any)=>({...s,showSug:false})):[{nome:'',qtd:1,unitario:'',total:0,obs:'',showSug:false}])
    setDesconto(orc.desconto?String(orc.desconto):'');setExigirSinal(orc.exigir_sinal||false)
    setSinalTipo(orc.sinal_tipo||'fixo');setSinalValor(orc.sinal_valor?String(orc.sinal_valor):'')
    setLinkPag(orc.link_pagamento||'');setObsPagamento(orc.obs_pagamento||'');setObservacoes(orc.observacoes||'')
    setHistPags(orc.hist_pagamentos||[]);setDentesSelec(orc.dentes_selecionados||[]);setProcOdonto(orc.procedimentos_odonto||[])
    setShowDetalhes(true)
    setView('form')
  }

  async function handleSalvar(){
    setMensagem('')
    const erros:string[]=[]
    if(!clienteNome.trim()) erros.push('Informe o nome do cliente.')
    if(!clienteWpp||clienteWpp.replace(/\D/g,'').length<10) erros.push('Informe o WhatsApp com DDD.')
    if(tipo==='__outro__'&&!tipoOutro.trim()) erros.push('Especifique o tipo do documento.')
    if(profId==='__outro__'&&!profNome.trim()) erros.push('Informe o nome do profissional.')
    const itensValidos=itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0&&parseInt(i.qtd||'1')>0)
    if(itensValidos.length===0) erros.push('Adicione pelo menos um serviço com nome e valor.')
    if(erros.length>0){setMensagem(erros.join(' | '));window.scrollTo({top:0,behavior:'smooth'});return}
    const payload={
      user_id:userId,cliente_nome:clienteNome.trim(),cliente_whatsapp:clienteWpp.replace(/\D/g,''),
      cliente_email:clienteEmail||null,cliente_obs:clienteObs||null,
      tipo:tipo==='__outro__'?(tipoOutro.trim()||'Outro'):tipo,
      tipo_descricao:tipo==='__outro__'?(tipoDescricao.trim()||null):null,
      profissional_id:(profId&&profId!=='__outro__')?profId:null,
      profissional_nome:profId==='__outro__'?(profNome.trim()||null):profId?(profissionais.find(p=>p.id===profId)?.nome||null):null,
      data:dataDoc,status,servicos:itensValidos,subtotal,desconto:descontoNum,total,
      valor_pago:valorPagoLocal,saldo_restante:saldoLocal,
      exigir_sinal:exigirSinal,sinal_tipo:exigirSinal?sinalTipo:null,sinal_valor:exigirSinal?parseFloat(sinalValor||'0'):null,
      link_pagamento:linkPag||null,obs_pagamento:obsPagamento.trim()||null,
      hist_pagamentos:histPags,dentes_selecionados:dentesSelec,procedimentos_odonto:procOdonto,
      observacoes:observacoes||null,updated_at:new Date().toISOString(),
    }
    if(editandoId){
      const {error}=await supabase.from('orcamentos').update(payload).eq('id',editandoId)
      if(error){setMensagem('Erro ao salvar.');return}
    } else {
      const {error}=await supabase.from('orcamentos').insert(payload)
      if(error){setMensagem('Erro ao criar orçamento.');return}
    }
    if(profId==='__outro__'&&profNome.trim()&&salvarFreelancer){
      await supabase.from('profissionais').insert({user_id:userId,nome:profNome.trim(),especialidade:'Freelancer'})
      const {data:profs}=await supabase.from('profissionais').select('id,nome').eq('user_id',userId)
      setProfissionais(profs||[])
    }
    resetForm();setView('lista');await carregarOrcamentos()
    setMensagem(editandoId?'Orçamento atualizado!':'Orçamento criado com sucesso!')
    setTimeout(()=>setMensagem(''),4000)
  }

  async function handleExcluir(id:string){
    if(!window.confirm('Excluir este orçamento?')) return
    await supabase.from('orcamentos').delete().eq('id',id)
    await carregarOrcamentos()
  }

  async function handleRegistrarPagamento(orc:any){
    const valor=parseFloat(pagValor||'0')
    if(!valor){setMensagem('Informe o valor.');return}
    setSavingPag(true)
    await supabase.from('orcamento_pagamentos').insert({orcamento_id:orc.id,user_id:userId,data:pagData,valor,forma:pagForma,observacao:pagObs||null})
    const novoValorPago=(orc.valor_pago||0)+valor
    const novoSaldo=Math.max(0,(orc.total||0)-novoValorPago)
    let novoStatus=orc.status
    if(novoValorPago>=orc.total) novoStatus='Pago'
    else if(novoValorPago>0) novoStatus='Parcialmente pago'
    await supabase.from('orcamentos').update({valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus,updated_at:new Date().toISOString()}).eq('id',orc.id)
    setSavingPag(false);setShowPagForm(false);setPagValor('');setPagObs('');setPagForma('Pix')
    await carregarOrcamentos();await carregarPagamentos(orc.id)
    const {data}=await supabase.from('orcamentos').select('*').eq('id',orc.id).single()
    if(data) setOrcamentos(prev=>prev.map(o=>o.id===orc.id?data:o))
    setMensagem('Pagamento registrado!');setTimeout(()=>setMensagem(''),3000)
  }

  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,''); if(!tel) return
    let msg='Olá, '+orc.cliente_nome+'!\n\nSeu '+orc.tipo+' — Total: R$ '+fmtBRL(orc.total)+'\nPago: R$ '+fmtBRL(orc.valor_pago)+'\nSaldo: R$ '+fmtBRL(orc.saldo_restante)
    if(orc.link_pagamento) msg+='\n\nLink:\n'+orc.link_pagamento
    msg+='\n\nApós pagar, envie o comprovante. Obrigado!'
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }

  function gerarPDF(orc:any){
    // PDF profissional via HTML em nova janela
    const win=window.open('','_blank'); if(!win) return
    const neg=perfil?.nome_negocio||'Negócio'
    const isOdonto=(orc.procedimentos_odonto?.length>0)
    const itensLinhas=(orc.servicos||[]).map((s:any)=>
      '<tr><td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A">'+s.nome+'</td>'
      +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:center;color:#475569">'+(s.qtd||1)+'</td>'
      +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:right;color:#475569">R$ '+fmtBRL(parseFloat(s.unitario||'0'))+'</td>'
      +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:right;font-weight:700;color:#0F172A">R$ '+fmtBRL(parseFloat(s.unitario||'0')*(s.qtd||1))+'</td></tr>'
    ).join('')
    const procLinhas=(orc.procedimentos_odonto||[]).map((p:any)=>{
      const dentes=Array.isArray(p.dentes)?p.dentes.join(', '):(p.dente?String(p.dente):'—')
      const qtd=Array.isArray(p.dentes)?p.dentes.length:(p.qtd||1)
      const vUnit=parseFloat(p.valorUnit||p.valor||'0')
      const vTotal=vUnit*qtd
      return '<tr>'
        +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A">'+p.nome+'</td>'
        +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:12px;color:#06B6D4">'+dentes+'</td>'
        +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:center;color:#475569">'+qtd+'</td>'
        +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:right;color:#475569">R$ '+fmtBRL(vUnit)+'</td>'
        +'<td style="padding:10px 8px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:right;font-weight:700;color:#0F172A">R$ '+fmtBRL(vTotal)+'</td>'
      +'</tr>'
    }).join('')
    const tabela=isOdonto
      ?('<table style="width:100%;border-collapse:collapse">'
        +'<thead><tr style="background:#F1F5F9">'
        +'<th style="padding:10px 8px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Procedimento</th>'
        +'<th style="padding:10px 8px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Dentes</th>'
        +'<th style="padding:10px 8px;text-align:center;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Qtd</th>'
        +'<th style="padding:10px 8px;text-align:right;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Unit.</th>'
        +'<th style="padding:10px 8px;text-align:right;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Total</th>'
        +'</tr></thead><tbody>'+procLinhas+'</tbody></table>')
      :('<table style="width:100%;border-collapse:collapse">'
        +'<thead><tr style="background:#F1F5F9">'
        +'<th style="padding:10px 8px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Serviço / Procedimento</th>'
        +'<th style="padding:10px 8px;text-align:center;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Qtd</th>'
        +'<th style="padding:10px 8px;text-align:right;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Valor unit.</th>'
        +'<th style="padding:10px 8px;text-align:right;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Total</th>'
        +'</tr></thead><tbody>'+itensLinhas+'</tbody></table>')
    const statusCor:any={'Aberto':'#2563EB','Pago':'#16A34A','Cancelado':'#DC2626','Finalizado':'#15803D'}
    const sCor=statusCor[orc.status]||'#7C3AED'
    const nomeArq='orcamento-'+orc.cliente_nome.toLowerCase().replace(/[^a-z0-9]/g,'-')+'-'+fmtData(orc.data).replace(/\//g,'-')+'.pdf'
    const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+orc.tipo+'</title>'
      +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#F8FAFC;color:#0F172A;font-size:14px}'
      +'@media print{body{background:white}.no-print{display:none}@page{margin:20mm}}'
      +'</style></head><body>'
      +'<div style="max-width:800px;margin:0 auto;padding:32px">'
      // Cabeçalho
      +'<div style="background:linear-gradient(135deg,#07111F,#0B1628);color:white;padding:28px 32px;border-radius:14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start">'
      +'<div><div style="font-size:22px;font-weight:800;letter-spacing:-.02em">'+neg+'</div>'
      +'<div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:4px">ClienteMarcado</div></div>'
      +'<div style="text-align:right"><div style="font-size:26px;font-weight:900;letter-spacing:.08em;color:#60A5FA">ORÇAMENTO</div>'
      +'<div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:4px">'+fmtData(orc.data)+'</div>'
      +'<span style="display:inline-block;margin-top:8px;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;background:'+sCor+'22;color:'+sCor+';border:1px solid '+sCor+'44">'+orc.status+'</span>'
      +'</div></div>'
      // Cliente + Negócio
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">'
      +'<div style="background:white;border:1px solid #E2E8F0;border-radius:12px;padding:18px">'
      +'<div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Cliente</div>'
      +'<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px">'+orc.cliente_nome+'</div>'
      +(orc.cliente_whatsapp?'<div style="font-size:13px;color:#475569">📱 '+aplicarMascaraTel(orc.cliente_whatsapp)+'</div>':'')
      +(orc.cliente_email?'<div style="font-size:13px;color:#475569">✉️ '+orc.cliente_email+'</div>':'')
      +'<div style="font-size:12px;color:#7C3AED;margin-top:8px;font-weight:600">'+orc.tipo+'</div>'
      +'</div>'
      +'<div style="background:white;border:1px solid #E2E8F0;border-radius:12px;padding:18px">'
      +'<div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Emitido por</div>'
      +'<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px">'+neg+'</div>'
      +(perfil?.whatsapp?'<div style="font-size:13px;color:#475569">📱 '+aplicarMascaraTel(perfil.whatsapp)+'</div>':'')
      +'</div></div>'
      // Tabela
      +'<div style="background:white;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:24px">'
      +'<div style="padding:14px 18px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em">'+(isOdonto?'Procedimentos odontológicos':'Itens do orçamento')+'</div>'
      +tabela+'</div>'
      // Resumo financeiro
      +'<div style="display:grid;grid-template-columns:1fr 280px;gap:16px;margin-bottom:24px">'
      +(orc.observacoes?'<div style="background:white;border:1px solid #E2E8F0;border-radius:12px;padding:18px"><div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Observações</div><div style="font-size:13px;color:#475569;line-height:1.6">'+orc.observacoes+'</div></div>':'<div></div>')
      +'<div style="background:white;border:1px solid #E2E8F0;border-radius:12px;padding:18px">'
      +'<div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px"><span>Subtotal</span><span style="font-weight:600;color:#0F172A">R$ '+fmtBRL(orc.subtotal||orc.total)+'</span></div>'
      +(orc.desconto>0?'<div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px"><span>Desconto</span><span style="font-weight:600;color:#EF4444">- R$ '+fmtBRL(orc.desconto)+'</span></div>':'')
      +'<div style="border-top:1px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:700;color:#0F172A">Total final</span><span style="font-size:20px;font-weight:900;color:#2563EB">R$ '+fmtBRL(orc.total)+'</span></div>'
      +(orc.valor_pago>0?'<div style="margin-top:8px;display:flex;justify-content:space-between;font-size:13px"><span style="color:#475569">Pago</span><span style="color:#16A34A;font-weight:700">R$ '+fmtBRL(orc.valor_pago)+'</span></div>':'')
      +(orc.saldo_restante>0?'<div style="margin-top:4px;display:flex;justify-content:space-between;font-size:13px"><span style="color:#475569">Saldo</span><span style="color:#F59E0B;font-weight:700">R$ '+fmtBRL(orc.saldo_restante)+'</span></div>':'')
      +'</div></div>'
      // Rodapé
      +'<div style="text-align:center;padding:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8">'
      +'Orçamento gerado pelo ClienteMarcado. Este documento não substitui nota fiscal.</div>'
      +'</div>'
      +'<script>window.onload=function(){window.print()}<\/script>'
      +'</body></html>'
    win.document.write(html)
    win.document.close()
  }

  function gerarMsgCobranca(){
    const tipoDoc=tipo==='__outro__'?tipoOutro:tipo
    const neg=perfil?.nome_negocio||'nosso negócio'
    const artigo=(neg[0]&&'aeiouAEIOU'.includes(neg[0]))?'a ':'o '
    let msg='Olá, '+(clienteNome||'cliente')+'! Aqui é d'+artigo+neg+'.\n\nSeu '+tipoDoc+': R$ '+fmtBRL(total)+'.\nPago: R$ '+fmtBRL(valorPagoLocal)+'. Saldo: R$ '+fmtBRL(saldoLocal)+'.'
    if(linkPag) msg+='\n\nPagamento:\n'+linkPag
    msg+='\n\nApós pagar, envie o comprovante. Obrigado!'
    return msg
  }

  function enviarCobrancaWpp(){
    const tel=clienteWpp.replace(/\D/g,''); if(!tel) return
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(gerarMsgCobranca()),'_blank')
  }

  function fmtHpValor(raw:string){
    const nums=raw.replace(/\D/g,''); if(!nums) return ''
    return (parseInt(nums,10)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})
  }
  function parseHpValor(v:string){return parseFloat(v.replace(/\./g,'').replace(',','.'))||0}

  function salvarHpPag(){
    const valor=parseHpValor(hpValor)
    if(!valor||valor<=0){setMensagem('Valor inválido.');return}
    if(hpForma==='Outro'&&!hpFormaOutro.trim()){setMensagem('Especifique a forma.');return}
    const forma=hpForma==='Outro'?hpFormaOutro.trim():hpForma
    const novo={valor,forma,data:hpData,obs:hpObs.trim()||''}
    if(editandoPagIdx!==null){setHistPags(prev=>prev.map((p,i)=>i===editandoPagIdx?novo:p));setEditandoPagIdx(null)}
    else setHistPags(prev=>[...prev,novo])
    setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')
    setShowHpForm(false)
  }

  function editarHpPag(idx:number){
    const p=histPags[idx]
    const formasPadrao=['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento']
    setEditandoPagIdx(idx);setHpValor(fmtHpValor(String(Math.round(p.valor*100))))
    setHpForma(formasPadrao.includes(p.forma)?p.forma:'Outro')
    setHpFormaOutro(formasPadrao.includes(p.forma)?'':p.forma)
    setHpData(p.data);setHpObs(p.obs||'');setShowHpForm(true)
  }

  function excluirHpPag(idx:number){
    setHistPags(prev=>prev.filter((_,i)=>i!==idx))
    if(editandoPagIdx===idx){setEditandoPagIdx(null);setShowHpForm(false)}
  }

  const DENTES_SUPERIOR=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
  const DENTES_INFERIOR=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
  function toggleDente(n:number){setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}
  function setStatusDentes(status:string){
    setDentesStatus(prev=>{
      const next={...prev}
      dentesSelec.forEach(d=>{next[d]=status})
      return next
    })
  }
  function limparTudoDentes(){setDentesSelec([]);setDentesStatus({})}
  function limparStatusDentes(){
    setDentesStatus(prev=>{
      const next={...prev}
      dentesSelec.forEach(d=>{delete next[d]})
      return next
    })
  }
  function corDente(n:number):React.CSSProperties{
    const sel=dentesSelec.includes(n)
    const st=dentesStatus[n]
    if(st==='realizado') return {background:'rgba(34,197,94,.22)',border:'2px solid rgba(34,197,94,.75)',color:'#86EFAC',boxShadow:'0 0 0 2px rgba(34,197,94,.30),0 0 14px rgba(34,197,94,.35)'}
    if(st==='pendente') return {background:'rgba(239,68,68,.22)',border:'2px solid rgba(239,68,68,.75)',color:'#FCA5A5',boxShadow:'0 0 0 2px rgba(239,68,68,.30),0 0 14px rgba(239,68,68,.35)'}
    if(sel) return {background:'#083344',border:'2px solid #22D3EE',color:'#E0F9FF',boxShadow:'0 0 0 2px rgba(34,211,238,.35),0 0 16px rgba(34,211,238,.45)'}
    return {background:'#E5E7EB',border:'1px solid rgba(200,200,200,.25)',color:'#020617'}
  }
  function adicionarProcOdonto(){
    if(!procNome) return
    const dentesUsados=dentesSelec.length>0?[...dentesSelec]:[]
    const valorUnit=parseFloat(procValor||'0')
    const qtdDentes=dentesUsados.length||1
    const valorTotal=valorUnit*qtdDentes
    setProcOdonto(prev=>[...prev,{dentes:dentesUsados,nome:procNome,valorUnit,qtd:qtdDentes,valor:String(valorTotal),status:procStatus,obs:procObs}])
    setProcNome('');setProcValor('');setProcObs('');setProcStatus('A realizar');setDentesSelec([]);setProcQtd(1)
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

  const isOdonto=perfil?.tipo_negocio?.toLowerCase().includes('odont')
  const mostrarOdontograma=usarOdontograma||tipo==='Tratamento'||isOdonto

  // Style constants
  const BG='#050B16'
  const SIDEBAR='#0B172A'
  const inp:React.CSSProperties={width:'100%',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px 14px',fontSize:'15px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any,color:'#fff'}
  const lbl:React.CSSProperties={fontSize:'12px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:'6px'}
  const card:React.CSSProperties={background:'rgba(255,255,255,.06)',borderRadius:'16px',padding:'20px 24px',marginBottom:'12px',border:'1px solid rgba(255,255,255,.1)',boxShadow:'0 4px 20px rgba(0,0,0,.2)'}


  if(loading) return (<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return (
    <div className="psb-wrapper" style={{display:'flex',minHeight:'100vh',background:BG,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',maxWidth:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:MOBILE_CSS}} />

      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile='Orçamentos' />

      {/* Mobile Overlay */}

      {/* Mobile Drawer */}
      <div className="psb-main" style={{flex:1,minWidth:0,minHeight:'100vh',display:'flex',flexDirection:'column'}}>


        {/* ══ LISTA ══ */}
        {view==='lista'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>

            {/* TOPO */}
            <div className="cm-lista-topo" style={{padding:'28px 32px 0',maxWidth:'1280px',margin:'0 auto'}}>

              {/* Título + botão */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'20px'}}>
                <div>
                  <h1 style={{fontSize:'24px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'4px'}}>Orçamentos</h1>
                  <p style={{fontSize:'14px',color:'#94A3B8'}}>Crie, acompanhe e envie orçamentos em poucos segundos.</p>
                </div>
                <button
                  onClick={()=>{ resetForm(); setTipoOrcamento(null); setView('escolha') }}
                  className="cm-novo-btn-lista"
                  style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'11px 22px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(37,99,235,.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',whiteSpace:'nowrap'}}>
                  <span style={{fontSize:'18px',lineHeight:1}}>+</span> Novo orçamento
                </button>
              </div>

              {mensagem&&<div style={{padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',background:'rgba(22,163,74,.15)',border:'1px solid rgba(22,163,74,.3)',color:'#4ADE80',fontSize:'13px'}}>{mensagem}</div>}

              {/* CARDS ATALHOS — grid 2x2 mobile, 4 colunas desktop */}
                            {/* KPIs — grid 2x2 mobile, 4 colunas desktop */}
              <div className="cm-kpi-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
                {[
                  {icon:'📂',label:'Em aberto',valor:totalAberto,fmt:'n',cor:'#3B82F6',bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.25)'},
                  {icon:'⏳',label:'A receber',valor:totalAReceber,fmt:'brl',cor:'#F59E0B',bg:'rgba(245,158,11,.12)',border:'rgba(245,158,11,.25)'},
                  {icon:'✅',label:'Recebido no mês',valor:recebidoMes,fmt:'brl',cor:'#22C55E',bg:'rgba(34,197,94,.12)',border:'rgba(34,197,94,.25)'},
                  {icon:'🔄',label:'Parciais',valor:parciais,fmt:'n',cor:'#A78BFA',bg:'rgba(167,139,250,.12)',border:'rgba(167,139,250,.25)'},
                ].map(m=>(
                  <div key={m.label} style={{background:m.bg,border:'1px solid '+m.border,borderRadius:'14px',padding:'16px',boxSizing:'border-box' as const}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:m.bg,border:'1px solid '+m.border,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>
                      {m.icon}
                    </div>
                    <p style={{fontSize:'11px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'4px'}}>{m.label}</p>
                    <p style={{fontSize:'22px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em',lineHeight:'1.2'}}>
                      {m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}
                    </p>
                  </div>
                ))}
              </div>

              {/* BUSCA + FILTROS */}
              <div className="cm-busca-filtros" style={{display:'flex',gap:'10px',marginBottom:'16px',alignItems:'center'}}>
                <div className="cm-busca-input" style={{position:'relative',flex:1}}>
                  <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#64748B',fontSize:'14px'}}>🔍</span>
                  <input type="text" placeholder="Buscar cliente, contato ou serviço..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
                    style={{width:'100%',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'11px 14px 11px 36px',fontSize:'13px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}} />
                </div>
              </div>
              <div className="cm-filtros-wrap" style={{display:'flex',gap:'6px',marginBottom:'16px'}}>
                {STATUS_LIST.map(s=>(
                  <button key={s} onClick={()=>setFiltroStatus(s)}
                    style={{padding:'7px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',whiteSpace:'nowrap' as const,flexShrink:0,
                      background:filtroStatus===s?'#2563EB':'rgba(255,255,255,.06)',
                      color:filtroStatus===s?'#fff':'#94A3B8',
                      borderColor:filtroStatus===s?'#2563EB':'rgba(255,255,255,.12)'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* BODY */}
            <div className="cm-lista-body" style={{padding:'0 32px 60px',maxWidth:'1280px',margin:'0 auto'}}>

              {orcsFiltrados.length===0?(
                <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'20px',padding:'48px 24px',textAlign:'center'}}>
                  <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>
                    📋
                  </div>
                  <p style={{fontSize:'18px',fontWeight:700,color:'#fff',marginBottom:'8px'}}>Nenhum orçamento criado ainda</p>
                  <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'24px',lineHeight:'1.5'}}>Crie seu primeiro orçamento, registre pagamentos e envie pelo WhatsApp.</p>
                  <button onClick={()=>{resetForm();setTipoOrcamento(null);setView('escolha')}}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'13px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(37,99,235,.4)',width:'100%',maxWidth:'320px'}}>
                    Criar primeiro orçamento
                  </button>
                </div>
              ):(
                <>
                  {/* TABELA DESKTOP */}
                  <div className="cm-tabela-desktop" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'20px',overflow:'hidden',overflowX:'auto'}}>
                    <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Orçamentos recentes</p>
                      <span style={{fontSize:'12px',color:'#64748B'}}>{orcsFiltrados.length} registro{orcsFiltrados.length!==1?'s':''}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'minmax(140px,2fr) minmax(100px,1fr) 90px 90px 90px 100px 110px',padding:'10px 24px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      {['Cliente','Tipo / Data','Total','Pago','Saldo','Status','Ações'].map(h=>(
                        <p key={h} style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{h}</p>
                      ))}
                    </div>
                    {orcsFiltrados.map((orc,i)=>{
                      const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                      return (
                        <div key={orc.id}
                          style={{display:'grid',gridTemplateColumns:'minmax(140px,2fr) minmax(100px,1fr) 90px 90px 90px 100px 110px',padding:'14px 24px',borderBottom:i<orcsFiltrados.length-1?'1px solid rgba(255,255,255,.05)':'none',alignItems:'center',transition:'background .15s',cursor:'default'}}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.04)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <div>
                            <p style={{fontSize:'14px',fontWeight:600,color:'#fff',marginBottom:'2px'}}>{orc.cliente_nome}</p>
                            <p style={{fontSize:'11px',color:'#64748B'}}>{orc.cliente_whatsapp?aplicarMascaraTel(orc.cliente_whatsapp):''}</p>
                          </div>
                          <div>
                            <p style={{fontSize:'13px',color:'#CBD5E1'}}>{orc.tipo}</p>
                            <p style={{fontSize:'11px',color:'#64748B'}}>{fmtData(orc.data)}</p>
                          </div>
                          <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>R$ {fmtBRL(orc.total)}</p>
                          <p style={{fontSize:'14px',fontWeight:600,color:'#22C55E'}}>R$ {fmtBRL(orc.valor_pago)}</p>
                          <p style={{fontSize:'14px',fontWeight:600,color:orc.saldo_restante>0?'#F59E0B':'#22C55E'}}>R$ {fmtBRL(orc.saldo_restante)}</p>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:'1px solid '+cfg.border,display:'inline-block'}}>
                            {orc.status}
                          </span>
                          <div style={{display:'flex',gap:'4px',flexWrap:'nowrap' as const,overflow:'hidden'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>Ver</button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{background:'rgba(22,163,74,.2)',border:'1px solid rgba(22,163,74,.3)',borderRadius:'6px',padding:'5px 8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>💬</button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',padding:'5px 8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
                            <button onClick={()=>handleExcluir(orc.id)}
                              style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.25)',borderRadius:'6px',padding:'5px 8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* CARDS MOBILE */}
                  <div className="cm-cards-mobile" style={{display:'none',flexDirection:'column',gap:'10px'}}>
                    {orcsFiltrados.map(orc=>{
                      const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                      return (
                        <div key={orc.id} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'16px',boxSizing:'border-box' as const}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                            <div>
                              <p style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>{orc.cliente_nome}</p>
                              <p style={{fontSize:'12px',color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}</p>
                            </div>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:'1px solid '+cfg.border,whiteSpace:'nowrap' as const}}>
                              {orc.status}
                            </span>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                            {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#F59E0B':'#22C55E'}].map(f=>(
                              <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'8px 10px'}}>
                                <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'.04em',marginBottom:'2px'}}>{f.l}</p>
                                <p style={{fontSize:'13px',fontWeight:700,color:(f.c==='#0F172A'?'#F8FAFC':f.c)}}>R$ {fmtBRL(f.v)}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{flex:2,background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit'}}>
                              Ver detalhes
                            </button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{flex:1,background:'rgba(22,163,74,.2)',border:'1px solid rgba(22,163,74,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>
                              💬 WApp
                            </button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{flex:1,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#CBD5E1',cursor:'pointer',fontFamily:'inherit'}}>
                              Editar
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        
        {/* ══ ESCOLHA ══ */}
        {view==='escolha'&&(
          <div style={{minHeight:'100vh',background:'#07111F',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 16px'}}>
            <button onClick={()=>setView('lista')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',marginBottom:'32px',alignSelf:'flex-start',paddingLeft:32}}>← Voltar à lista</button>
            <div style={{maxWidth:640,width:'100%'}}>
              <h2 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',marginBottom:8,textAlign:'center'}}>Que tipo de orçamento deseja criar?</h2>
              <p style={{fontSize:'14px',color:'#64748B',marginBottom:32,textAlign:'center'}}>Escolha o modelo ideal para este atendimento.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {/* Simples */}
                <button onClick={()=>{setTipoOrcamento('simples');setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.12),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.30)',borderRadius:20,padding:'28px 22px',cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all .18s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(59,130,246,.55)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(59,130,246,.30)';e.currentTarget.style.transform='translateY(0)'}}>
                  <div style={{width:48,height:48,borderRadius:14,background:'rgba(59,130,246,.18)',border:'1px solid rgba(59,130,246,.30)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14}}>📋</div>
                  <p style={{fontSize:16,fontWeight:800,color:'#F8FAFC',marginBottom:8}}>Orçamento simples</p>
                  <p style={{fontSize:13,color:'#64748B',lineHeight:1.6,marginBottom:20}}>Para barbearia, salão, estética, consultoria, clínicas simples e serviços gerais.</p>
                  <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:700,boxShadow:'0 6px 20px rgba(59,130,246,.30)'}}>
                    Criar orçamento simples →
                  </div>
                </button>
                {/* Odontológico */}
                <button onClick={()=>{setTipoOrcamento('odontologico');setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(34,211,238,.10),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(34,211,238,.28)',borderRadius:20,padding:'28px 22px',cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all .18s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(34,211,238,.55)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(34,211,238,.28)';e.currentTarget.style.transform='translateY(0)'}}>
                  <div style={{width:48,height:48,borderRadius:14,background:'rgba(34,211,238,.14)',border:'1px solid rgba(34,211,238,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14}}>🦷</div>
                  <p style={{fontSize:16,fontWeight:800,color:'#F8FAFC',marginBottom:8}}>Orçamento odontológico</p>
                  <p style={{fontSize:13,color:'#64748B',lineHeight:1.6,marginBottom:20}}>Para tratamentos com odontograma, dentes selecionados e procedimentos odontológicos.</p>
                  <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(34,211,238,.14)',border:'1px solid rgba(34,211,238,.28)',color:'#22D3EE',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:700}}>
                    Criar orçamento odontológico →
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ FORMULÁRIO ══ */}
        {view==='form'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
          <div className="cm-form-pad cm-content-pad" style={{padding:'24px 32px 140px',maxWidth:'1080px',margin:'0 auto'}}>
            <div className="cm-form-inner" style={{padding:'24px',width:'100%',maxWidth:'100%',boxSizing:'border-box' as const,overflowX:'hidden'}}>
            {/* Topo */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <button onClick={()=>{editandoId?setView('lista'):(setView('escolha'))}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>
                  ← {editandoId?'Voltar à lista':'Voltar à escolha'}
                </button>
                <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'2px'}}>{editandoId?'Editar orçamento':tipoOrcamento==='odontologico'?'Novo orçamento odontológico':'Novo orçamento'}</h1>
                <p style={{fontSize:'13px',color:'#94A3B8'}}>Preencha os dados e envie para o cliente.</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'6px 12px'}}>
                <span style={{fontSize:'13px',color:'#16A34A'}}>✓</span>
                <span style={{fontSize:'12px',fontWeight:600,color:'#16A34A'}}>Salvo automaticamente</span>
              </div>
            </div>

            {mensagem&&(
              <div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',
                color:mensagem.includes('rro')?'#F87171':'#4ADE80',
                background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',
                border:(mensagem.includes('rro')?'1px solid rgba(220,38,38,.3)':'1px solid rgba(34,197,94,.3)')}}>
                {mensagem}
              </div>
            )}

            {/* Layout 2 colunas */}
            <div className="cm-form-grid" style={{display:'flex',flexDirection:'column',gap:'0px'}}>

              {/* Coluna esquerda */}
              <div style={{minWidth:0}}>

                {/* CARD: Cliente */}
                <div className="cm-card" style={card}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                    <span style={{fontSize:'16px'}}>👤</span>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Cliente</p>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div>
                      <label style={lbl}>Nome *</label>
                      <input style={inp} type="text" placeholder="Nome do cliente"
                        value={clienteNome} onChange={e=>setClienteNome(e.target.value)} />
                    </div>
                    <div className="cm-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                      <div>
                        <label style={lbl}>WhatsApp *</label>
                        <input style={inp} type="tel" placeholder="(11) 99999-9999"
                          value={clienteWpp} onChange={e=>setClienteWpp(aplicarMascaraTel(e.target.value))} />
                      </div>
                      <div>
                        <label style={lbl}>E-mail (opcional)</label>
                        <input style={inp} type="email" placeholder="email@exemplo.com"
                          value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCORDION: Detalhes */}
                <div style={{...card,padding:0,overflow:'hidden'}}>
                  <div onClick={()=>setShowDetalhes(!showDetalhes)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'16px'}}>📋</span>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Detalhes do documento</p>
                        <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>Tipo, status, profissional e data.</p>
                      </div>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                  </div>
                  {showDetalhes&&(
                    <div style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'16px'}}>
                        <div>
                          <label style={lbl}>Tipo</label>
                          <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                            {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t=><option key={t} value={t}>{t}</option>)}
                            <option value="__outro__">Outro</option>
                          </select>
                          {tipo==='__outro__'&&(
                            <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px'}}>
                              <input style={inp} type="text" placeholder="Ex: Avaliação, Laudo..." value={tipoOutro} onChange={e=>setTipoOutro(e.target.value)} />
                              <input style={inp} type="text" placeholder="Descrição (opcional)" value={tipoDescricao} onChange={e=>setTipoDescricao(e.target.value)} />
                            </div>
                          )}
                        </div>
                        <div>
                          <label style={lbl}>Status</label>
                          <select style={sel} value={status} onChange={e=>setStatus(e.target.value)}>
                            {['Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="cm-inprow" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={lbl}>Profissional</label>
                          <select style={sel} value={profId} onChange={e=>{setProfId(e.target.value);if(e.target.value!=='__outro__'){setProfNome('');setSalvarFreelancer(false)}}}>
                            <option value="">Nenhum</option>
                            {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                            <option value="__outro__">✏️ Outro / Não cadastrado</option>
                          </select>
                          {profId==='__outro__'&&(
                            <div style={{marginTop:'8px',padding:'12px',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'8px',display:'flex',flexDirection:'column',gap:'8px'}}>
                              <input style={inp} type="text" placeholder="Nome do profissional" value={profNome} onChange={e=>setProfNome(e.target.value)} />
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <button onClick={()=>setSalvarFreelancer(!salvarFreelancer)}
                                  style={{width:'32px',height:'18px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:salvarFreelancer?'#2563EB':'#D1D5DB',flexShrink:0}}>
                                  <span style={{position:'absolute',top:'2px',left:salvarFreelancer?'14px':'2px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'left .2s'}} />
                                </button>
                                <span style={{fontSize:'12px',color:'#94A3B8'}}>Salvar na equipe?</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label style={lbl}>Data</label>
                          <input style={inp} type="date" value={dataDoc} onChange={e=>setDataDoc(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD: Itens — design mockup */}
                <div className="cm-card" style={card}>
                  {/* Área de adição de item */}
                  <div style={{marginBottom:16,padding:'16px',background:'rgba(11,18,32,.7)',borderRadius:12,border:'1px solid rgba(148,163,184,.12)'}}>
                    <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:12}}>Adicionar item ao orçamento</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 120px 180px auto',gap:8,alignItems:'end'}}>
                      {/* Serviço com autocomplete */}
                      <div style={{position:'relative'}}>
                        <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Serviço / Procedimento</label>
                        <input
                          type="text"
                          placeholder="Selecione ou digite o serviço..."
                          value={itens[itens.length-1]?.nome||''}
                          onChange={e=>{
                            const idx2=itens.length-1
                            atualizarItem(idx2,'nome',e.target.value)
                            atualizarItem(idx2,'showSug',true)
                          }}
                          onBlur={()=>setTimeout(()=>{const idx2=itens.length-1;atualizarItem(idx2,'showSug',false)},150)}
                          style={inp}
                        />
                        {itens[itens.length-1]?.showSug&&itens[itens.length-1]?.nome&&(
                          <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#0B1220',border:'1px solid rgba(59,130,246,.25)',borderRadius:10,zIndex:50,maxHeight:180,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
                            {(SUGESTOES_ARR as string[]).filter((s:string)=>s.toLowerCase().includes((itens[itens.length-1]?.nome||'').toLowerCase())).map((s:string)=>(
                              <button key={s} onMouseDown={()=>{const idx2=itens.length-1;atualizarItem(idx2,'nome',s);atualizarItem(idx2,'showSug',false)}}
                                style={{display:'block',width:'100%',textAlign:'left',padding:'9px 14px',background:'none',border:'none',color:'#CBD5E1',fontSize:13,cursor:'pointer',fontFamily:'inherit',borderBottom:'1px solid rgba(255,255,255,.05)'}}
                                onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,.12)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Quantidade */}
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Quantidade</label>
                        <input type="number" min="1" style={{...inp,textAlign:'center'}}
                          value={itens[itens.length-1]?.qtd||1}
                          onChange={e=>atualizarItem(itens.length-1,'qtd',e.target.value)} />
                      </div>
                      {/* Valor unitário */}
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Valor unitário (R$)</label>
                        <div style={{position:'relative'}}>
                          <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#64748B',fontWeight:600}}>R$</span>
                          <input type="number" min="0" step="0.01" placeholder="0,00" style={{...inp,paddingLeft:28}}
                            value={itens[itens.length-1]?.unitario||''}
                            onChange={e=>atualizarItem(itens.length-1,'unitario',e.target.value)} />
                        </div>
                      </div>
                      {/* Botão adicionar */}
                      <button
                        onClick={()=>{
                          const last=itens[itens.length-1]
                          if(!last?.nome?.trim()||!parseFloat(last?.unitario||'0')) return
                          setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:'',showSug:false}])
                        }}
                        style={{background:'linear-gradient(135deg,#2563EB,#7C3AED)',color:'#fff',border:'none',borderRadius:10,padding:'10px 18px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',height:42,display:'flex',alignItems:'center',gap:6}}>
                        + Adicionar item
                      </button>
                    </div>
                  </div>

                  {/* Tabela de itens */}
                  {itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0).length>0&&(
                    <div style={{background:'rgba(11,18,32,.7)',borderRadius:12,border:'1px solid rgba(148,163,184,.12)',overflow:'hidden',marginBottom:16}}>
                      {/* Header tabela */}
                      <div style={{display:'grid',gridTemplateColumns:'2fr 100px 130px 130px 80px',padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.06)',background:'rgba(255,255,255,.03)'}}>
                        {['Serviço / Procedimento','Quantidade','Valor unitário','Valor total','Ações'].map(h=>(
                          <p key={h} style={{fontSize:11,fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em',textAlign:h==='Ações'?'center':'left'}}>{h}</p>
                        ))}
                      </div>
                      {/* Linhas */}
                      {itens.map((item,idx)=>{
                        if(!item.nome?.trim()&&!parseFloat(item.unitario||'0')) return null
                        const total2=parseFloat(item.unitario||'0')*(parseInt(item.qtd||'1')||1)
                        return (
                          <div key={idx} style={{display:'grid',gridTemplateColumns:'2fr 100px 130px 130px 80px',padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,.04)',alignItems:'center',transition:'background .15s'}}
                            onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')}
                            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#2563EB,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>✂</div>
                              <div>
                                <p style={{fontSize:13,fontWeight:600,color:'#F8FAFC'}}>{item.nome}</p>
                                {item.obs&&<p style={{fontSize:11,color:'#64748B',marginTop:1}}>{item.obs}</p>}
                              </div>
                            </div>
                            <p style={{fontSize:13,color:'#94A3B8',textAlign:'center'}}>{item.qtd||1}</p>
                            <p style={{fontSize:13,color:'#94A3B8',textAlign:'right'}}>R$ {fmtBRL(parseFloat(item.unitario||'0'))}</p>
                            <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',textAlign:'right'}}>R$ {fmtBRL(total2)}</p>
                            <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                              <button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                                style={{width:28,height:28,borderRadius:6,background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.30)',color:'#F87171',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                🗑
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Subtotal */}
                  <div style={{background:'rgba(5,11,22,.8)',borderRadius:12,padding:'14px 16px',width:'100%',boxSizing:'border-box',border:'1px solid rgba(255,255,255,.06)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,color:'#94A3B8',marginBottom:8}}>
                      <span>Subtotal</span>
                      <span style={{fontWeight:600,color:'#fff'}}>R$ {fmtBRL(subtotal)}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,color:'#64748B',marginBottom:8,paddingBottom:8,borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                      <span>Desconto (R$)</span>
                      <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto}
                        onChange={e=>setDesconto(e.target.value)}
                        style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:13,fontWeight:600,textAlign:'right',width:100,fontFamily:'inherit',borderRadius:6,padding:'4px 8px'}} />
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:descontoNum>0?8:0}}>
                      <span style={{fontSize:14,fontWeight:700,color:'#fff'}}>Total final</span>
                      <span style={{fontSize:20,fontWeight:900,color:'#22C55E'}}>R$ {fmtBRL(total)}</span>
                    </div>
                    {descontoNum>0&&<p style={{fontSize:11,color:'#F59E0B',textAlign:'right'}}>Desconto: R$ {fmtBRL(descontoNum)} aplicado</p>}
                  </div>
                </div>

                {/* Resumo mobile — só aparece no mobile */}
                <div className="cm-resumo-mobile" style={{display:'none',background:'rgba(11,18,32,.97)',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid rgba(255,255,255,.08)'}}>
                  <p style={{fontSize:'12px',fontWeight:700,color:'#667085',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'10px'}}>Resumo</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#94A3B8'}}>Cliente</span>
                      <span style={{fontWeight:600,color:clienteNome?'#fff':'#475569',maxWidth:'60%',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clienteNome||'Não informado'}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#94A3B8'}}>Tipo</span>
                      <span style={{color:'#F8FAFC'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#94A3B8'}}>Status</span>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:STATUS_COR[status]?.bg||'#EFF6FF',color:STATUS_COR[status]?.color||'#2563EB',border:'1px solid '+(STATUS_COR[status]?.border||'#BFDBFE')}}>{status}</span>
                    </div>
                    <div style={{height:'1px',background:'rgba(255,255,255,.08)',margin:'2px 0'}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'13px',color:'#94A3B8'}}>Total</span>
                      <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                    </div>
                    {valorPagoLocal>0&&(<>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#94A3B8'}}>Pago</span>
                        <span style={{fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#94A3B8'}}>Saldo</span>
                        <span style={{fontWeight:700,color:'#EA580C'}}>R$ {fmtBRL(saldoLocal)}</span>
                      </div>
                    </>)}
                  </div>
                </div>

                {/* Odontograma */}
                {tipoOrcamento==='odontologico'&&(
                  <div style={{background:'rgba(7,28,46,.9)',border:'1px solid rgba(6,182,212,.35)',borderRadius:18,padding:'20px',marginBottom:12}}>
                    {/* Título do odontograma */}
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#06B6D4,#0891B2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🦷</div>
                      <div>
                        <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC',marginBottom:2}}>Odontograma / Seleção de dentes</p>
                        <p style={{fontSize:12,color:'#64748B'}}>Clique nos dentes para selecionar. Use os botões para marcar procedimentos.</p>
                      </div>
                    </div>
                    {([{label:'ARCADA SUPERIOR',dentes:DENTES_SUPERIOR},{label:'ARCADA INFERIOR',dentes:DENTES_INFERIOR}] as {label:string,dentes:number[]}[]).map((arco,ai)=>(
                      <div key={ai} style={{background:'rgba(5,11,22,.6)',border:'1px solid rgba(6,182,212,.18)',borderRadius:12,padding:'12px 10px',marginBottom:8,overflow:'hidden'}}>
                        <p style={{fontSize:10,fontWeight:700,color:'#22D3EE',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8,textAlign:'center'}}>{arco.label}</p>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center',width:'100%'}}>
                          {arco.dentes.map((n:number)=>(
                            <button key={n} onClick={()=>toggleDente(n)}
                              className={'cm-tooth'+(dentesSelec.includes(n)?' selected':'')+(dentesStatus[n]==='realizado'?' realizado':'')+(dentesStatus[n]==='pendente'?' pendente':'')}
                              style={{fontFamily:'inherit'}}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Chips + botões — sempre visível */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginTop:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',flex:1}}>
                        <span style={{fontSize:12,fontWeight:600,color:'#94A3B8',flexShrink:0}}>
                          {dentesSelec.length>0?'Dentes selecionados:':'Nenhum dente selecionado'}
                        </span>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                          {dentesSelec.sort((a:number,b:number)=>a-b).map((n:number)=>(
                            <span key={n} onClick={()=>toggleDente(n)}
                              style={{background:'rgba(6,182,212,.18)',border:'1px solid rgba(34,211,238,.50)',color:'#22D3EE',borderRadius:8,padding:'4px 10px',fontSize:12,fontWeight:800,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4,letterSpacing:'.02em'}}>
                              {n}
                              <span style={{fontSize:10,opacity:.6}}>×</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:8,flexShrink:0}}>
                        <button onClick={()=>setDentesSelec([])}
                          style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'1px solid rgba(148,163,184,.25)',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>
                          🗑 Limpar seleção
                        </button>
                        <button onClick={limparTudoDentes}
                          style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'1px solid rgba(239,68,68,.35)',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>
                          🔄 Limpar tudo
                        </button>
                      </div>
                    </div>
                    <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                      <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:12}}>Adicionar procedimento ao orçamento</p>
                      {/* Formulário de adição */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 100px 140px auto',gap:8,alignItems:'end',marginBottom:16}}>
                        {/* Procedimento */}
                        <div style={{position:'relative'}}>
                          <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Procedimento odontológico</label>
                          <input type="text"
                            placeholder="Digite para buscar um procedimento..."
                            value={procNome}
                            onChange={e=>setProcNome(e.target.value)}
                            style={inp}
                          />
                          {procNome&&(
                            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#0B1220',border:'1px solid rgba(34,211,238,.25)',borderRadius:10,zIndex:50,maxHeight:160,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
                              {(['Avaliacao odontologica','Limpeza','Restauracao','Extracao','Canal','Clareamento','Aparelho','Manutencao de aparelho','Protese','Implante','Tratamento gengival','Radiografia','Retorno','Procedimento personalizado'] as string[]).filter((s:string)=>s.toLowerCase().includes(procNome.toLowerCase())).map((s:string)=>(
                                <button key={s} onMouseDown={()=>setProcNome(s)}
                                  style={{display:'block',width:'100%',textAlign:'left',padding:'9px 14px',background:'none',border:'none',color:'#CBD5E1',fontSize:13,cursor:'pointer',fontFamily:'inherit',borderBottom:'1px solid rgba(255,255,255,.05)'}}
                                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(34,211,238,.10)')}
                                  onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Dentes selecionados — display only */}
                        <div>
                          <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Dentes selecionados</label>
                          <div style={{...inp,display:'flex',gap:4,flexWrap:'wrap',minHeight:42,alignItems:'center'}}>
                            {dentesSelec.length>0
                              ?dentesSelec.sort((a,b)=>a-b).map(n=>(
                                <span key={n} style={{background:'rgba(6,182,212,.18)',border:'1px solid rgba(34,211,238,.45)',color:'#67E8F9',borderRadius:6,padding:'2px 7px',fontSize:11,fontWeight:700}}>{n}</span>
                              ))
                              :<span style={{fontSize:12,color:'#475569'}}>Selecione os dentes...</span>
                            }
                          </div>
                        </div>
                        {/* Qtd dentes */}
                        <div>
                          <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Qtd. de dentes</label>
                          <input type="number" min="0" readOnly style={{...inp,textAlign:'center',color:'#94A3B8'}} value={dentesSelec.length||0} />
                        </div>
                        {/* Valor unitário */}
                        <div>
                          <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>Valor unitário (R$)</label>
                          <div style={{position:'relative'}}>
                            <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#64748B',fontWeight:600}}>R$</span>
                            <input type="number" min="0" step="0.01" placeholder="0,00" style={{...inp,paddingLeft:28}} value={procValor} onChange={e=>setProcValor(e.target.value)} />
                          </div>
                        </div>
                        {/* Botão */}
                        <button onClick={adicionarProcOdonto} disabled={!procNome}
                          style={{background:'linear-gradient(135deg,#06B6D4,#0891B2)',color:'#fff',border:'none',borderRadius:10,padding:'10px 16px',fontSize:13,fontWeight:700,cursor:!procNome?'not-allowed':'pointer',fontFamily:'inherit',whiteSpace:'nowrap',height:42,display:'flex',alignItems:'center',gap:6,opacity:!procNome?0.5:1}}>
                          + Adicionar procedimento
                        </button>
                      </div>

                      {/* Tabela de procedimentos */}
                      {procOdonto.length>0&&(
                        <div style={{background:'rgba(11,18,32,.7)',borderRadius:12,border:'1px solid rgba(148,163,184,.12)',overflow:'hidden'}}>
                          {/* Header */}
                          <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 80px 120px 120px 80px',padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.06)',background:'rgba(255,255,255,.03)'}}>
                            {['Serviço / Procedimento','Dentes selecionados','Qtd. de dentes','Valor unitário','Valor total','Ações'].map(h=>(
                              <p key={h} style={{fontSize:11,fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em',textAlign:h==='Ações'?'center':'left'}}>{h}</p>
                            ))}
                          </div>
                          {/* Linhas */}
                          {procOdonto.map((p:any,i:number)=>{
                            const dentes=Array.isArray(p.dentes)?p.dentes:(p.dente?[p.dente]:[])
                            const qtd=dentes.length||p.qtd||1
                            const vUnit=parseFloat(p.valorUnit||p.valor||'0')
                            const vTotal=vUnit*qtd
                            return (
                              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 80px 120px 120px 80px',padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,.04)',alignItems:'center'}}
                                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                  <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#06B6D4,#0891B2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🦷</div>
                                  <p style={{fontSize:13,fontWeight:600,color:'#F8FAFC'}}>{p.nome}</p>
                                </div>
                                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                  {dentes.map((n:number)=>(
                                    <span key={n} style={{background:'rgba(6,182,212,.18)',border:'1px solid rgba(34,211,238,.35)',color:'#67E8F9',borderRadius:6,padding:'2px 6px',fontSize:11,fontWeight:700}}>{n}</span>
                                  ))}
                                </div>
                                <p style={{fontSize:13,color:'#94A3B8',textAlign:'center'}}>{qtd}</p>
                                <p style={{fontSize:13,color:'#94A3B8',textAlign:'right'}}>R$ {fmtBRL(vUnit)}</p>
                                <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',textAlign:'right'}}>R$ {fmtBRL(vTotal)}</p>
                                <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                                  <button onClick={()=>setProcOdonto((prev:any[])=>prev.filter((_:any,j:number)=>j!==i))}
                                    style={{width:28,height:28,borderRadius:6,background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.30)',color:'#F87171',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    🗑
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                          {/* Subtotal odonto */}
                          <div style={{padding:'12px 16px',background:'rgba(255,255,255,.03)',borderTop:'1px solid rgba(255,255,255,.06)',display:'grid',gridTemplateColumns:'2fr 1.5fr 80px 120px 120px 80px'}}>
                            <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',gridColumn:'1/5',textAlign:'right',paddingRight:8}}>Subtotal</p>
                            <p style={{fontSize:14,fontWeight:800,color:'#22C55E',textAlign:'right'}}>R$ {fmtBRL(subtotal)}</p>
                            <div/>
                          </div>
                          {/* Desconto e Total */}
                          <div style={{padding:'12px 16px 16px',background:'rgba(255,255,255,.03)'}}>
                            <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:12,marginBottom:8}}>
                              <span style={{fontSize:13,color:'#64748B'}}>Desconto (R$)</span>
                              <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto}
                                onChange={e=>setDesconto(e.target.value)}
                                style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:13,fontWeight:600,textAlign:'right',width:100,fontFamily:'inherit',borderRadius:6,padding:'4px 8px'}} />
                            </div>
                            <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:16}}>
                              <span style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Total final</span>
                              <span style={{fontSize:20,fontWeight:900,color:'#22C55E'}}>R$ {fmtBRL(total)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ACCORDION: Pagamento */}
                <div style={{...card,padding:0,overflow:'hidden'}}>
                  <div onClick={()=>setShowPagSection(!showPagSection)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'16px'}}>💳</span>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Pagamento</p>
                        <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>
                          {valorPagoLocal>0?'Pago: R$ '+fmtBRL(valorPagoLocal)+' · Saldo: R$ '+fmtBRL(saldoLocal):'Entrada, pagamentos parciais e link de cobrança.'}
                        </p>
                      </div>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                  </div>
                  {showPagSection&&(
                    <div style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                      {/* Cards resumo */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'16px 0'}}>
                        {[{l:'Total',v:total,c:'#0F172A'},{l:'Pago',v:valorPagoLocal,c:'#16A34A'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#EA580C':'#16A34A'}].map(f=>(
                          <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'10px',border:'1px solid rgba(255,255,255,.08)'}}>
                            <p style={{fontSize:'10px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                            <p style={{fontSize:'15px',fontWeight:800,color:(f.c==='#0F172A'?'#F8FAFC':f.c)}}>R$ {fmtBRL(f.v)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Entrada/sinal */}
                      <div style={{marginBottom:'14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:exigirSinal?'12px':'0'}}>
                          <button onClick={()=>setExigirSinal(!exigirSinal)}
                            style={{width:'36px',height:'20px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:exigirSinal?'#2563EB':'#D1D5DB'}}>
                            <span style={{position:'absolute',top:'2px',left:exigirSinal?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}} />
                          </button>
                          <span style={{fontSize:'13px',color:'#F8FAFC',fontWeight:500,cursor:'pointer'}} onClick={()=>setExigirSinal(!exigirSinal)}>Exigir entrada/sinal?</span>
                        </div>
                        {exigirSinal&&(
                          <div style={{background:BG,borderRadius:'10px',padding:'14px',border:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px'}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                              <div><label style={lbl}>Tipo</label>
                                <select style={sel} value={sinalTipo} onChange={e=>setSinalTipo(e.target.value)}>
                                  <option value="fixo">Valor fixo (R$)</option>
                                  <option value="percentual">Porcentagem (%)</option>
                                </select></div>
                              <div><label style={lbl}>{sinalTipo==='fixo'?'Valor (R$)':'Percentual (%)'}</label>
                                <input style={inp} type="number" min="0" placeholder={sinalTipo==='fixo'?'0,00':'50'} value={sinalValor} onChange={e=>setSinalValor(e.target.value)} /></div>
                            </div>
                            {sinalValor&&(
                              <div style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'10px 14px'}}>
                                <span style={{fontSize:'13px',color:'#059669',fontWeight:700}}>Entrada: R$ {fmtBRL(sinalTipo==='fixo'?parseFloat(sinalValor||'0'):(total*parseFloat(sinalValor||'0'))/100)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Link pag */}
                      <div style={{marginBottom:'14px'}}>
                        <label style={lbl}>Link de pagamento</label>
                        <input style={inp} type="url" placeholder="Cole aqui o link do Mercado Pago, Asaas, PagSeguro, InfinitePay ou outro"
                          value={linkPag} onChange={e=>setLinkPag(e.target.value)} />
                        <p style={{fontSize:'11px',color:'#9CA3AF',marginTop:'5px'}}>O ClienteMarcado apenas organiza a cobrança. O pagamento será feito pelo link informado pelo seu negócio.</p>
                      </div>

                      {/* Botões */}
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
                        <button onClick={()=>navigator.clipboard.writeText(gerarMsgCobranca())}
                          style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>
                          📋 Copiar mensagem de cobrança
                        </button>
                        <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                          style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.35)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}>
                          💬 Enviar pelo WhatsApp
                        </button>
                      </div>
                      {!clienteWpp&&<p style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'12px'}}>Informe o WhatsApp do cliente para enviar a cobrança.</p>}

                      {/* Obs pagamento */}
                      <div style={{marginBottom:'16px'}}>
                        <label style={lbl}>Observações de pagamento</label>
                        <input style={inp} type="text" placeholder="Ex: cliente pagou R$ 100,00 de entrada em dinheiro"
                          value={obsPagamento} onChange={e=>setObsPagamento(e.target.value)} />
                      </div>

                      {/* Pagamentos registrados */}
                      <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:'14px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>Pagamentos registrados</p>
                          <button onClick={()=>{setShowHpForm(!showHpForm);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')}}
                            style={{background:'#EFF6FF',border:'1.5px solid #BFDBFE',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#2563EB',cursor:'pointer',fontFamily:'inherit'}}>
                            + Registrar pagamento
                          </button>
                        </div>

                        {showHpForm&&(
                          <div style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
                            <p style={{fontSize:'13px',fontWeight:700,color:'#93C5FD',marginBottom:'12px'}}>{editandoPagIdx!==null?'Editar':'Registrar pagamento'}</p>
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                <div>
                                  <label style={lbl}>Valor *</label>
                                  <div style={{position:'relative'}}>
                                    <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#475569',fontWeight:600}}>R$</span>
                                    <input style={{...inp,paddingLeft:'32px'}} type="text" inputMode="numeric" placeholder="0,00"
                                      value={hpValor} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,'');setHpValor(fmtHpValor(v||'0'))}} />
                                  </div>
                                </div>
                                <div><label style={lbl}>Data *</label><input style={inp} type="date" value={hpData} onChange={e=>setHpData(e.target.value)} /></div>
                              </div>
                              <div>
                                <label style={lbl}>Forma *</label>
                                <select style={sel} value={hpForma} onChange={e=>{setHpForma(e.target.value);if(e.target.value!=='Outro')setHpFormaOutro('')}}>
                                  {['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}
                                </select>
                                {hpForma==='Outro'&&<input style={{...inp,marginTop:'6px'}} type="text" placeholder="Especifique..." value={hpFormaOutro} onChange={e=>setHpFormaOutro(e.target.value)} />}
                              </div>
                              <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada, parcela 2..." value={hpObs} onChange={e=>setHpObs(e.target.value)} /></div>
                              <div style={{display:'flex',gap:'8px'}}>
                                <button onClick={()=>{setShowHpForm(false);setEditandoPagIdx(null)}}
                                  style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                                <button onClick={salvarHpPag}
                                  style={{flex:2,background:'#2563EB',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
                                  {editandoPagIdx!==null?'Atualizar':'Salvar pagamento'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {histPags.length===0&&!showHpForm&&<p style={{fontSize:'12px',color:'#475569'}}>Nenhum pagamento registrado ainda.</p>}
                        {histPags.map((p,i)=>(
                          <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                                <span style={{fontSize:'14px',fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(p.valor)}</span>
                                <span style={{fontSize:'11px',color:'#667085'}}>{p.forma}</span>
                                <span style={{fontSize:'11px',color:'#9CA3AF'}}>· {fmtData(p.data)}</span>
                              </div>
                              {p.obs&&<p style={{fontSize:'12px',color:'#475569'}}>{p.obs}</p>}
                            </div>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button onClick={()=>editarHpPag(i)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                              <button onClick={()=>excluirHpPag(i)} style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                            </div>
                          </div>
                        ))}
                        {histPags.length>0&&(
                          <div style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'8px 14px',display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                            <span style={{fontSize:'13px',color:'#94A3B8',fontWeight:600}}>Total pago</span>
                            <span style={{fontSize:'14px',fontWeight:800,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION: Observações */}
                <div style={{...card,padding:0,overflow:'hidden'}}>
                  <div onClick={()=>setShowObs(!showObs)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'16px'}}>📝</span>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Observações</p>
                        <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>Informações extras para o cliente ou para sua equipe.</p>
                      </div>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showObs?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                  </div>
                  {showObs&&(
                    <div style={{padding:'0 18px 18px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'16px',width:'100%',boxSizing:'border-box'}}>
                      <div><label style={lbl}>Observação do cliente</label>
                        <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Alergias, preferências, histórico..."
                          value={clienteObs} onChange={e=>setClienteObs(e.target.value)} /></div>
                      <div><label style={lbl}>Observações do orçamento</label>
                        <textarea rows={3} style={{...inp,resize:'none' as const}} placeholder="Informações adicionais..."
                          value={observacoes} onChange={e=>setObservacoes(e.target.value)} /></div>
                    </div>
                  )}
                </div>

                {/* Observações + Resumo inline */}
                <div className="cm-obs-resumo-grid" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:16,marginBottom:8,alignItems:'start'}}>
                  {/* Observações */}
                  <div style={{...card,padding:'16px 20px'}}>
                    <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',marginBottom:4}}>Observações <span style={{fontWeight:400,color:'#64748B',fontSize:12}}>(opcional)</span></p>
                    <textarea rows={2} placeholder="Digite observações sobre este orçamento..."
                      value={observacoes} onChange={e=>{setObservacoes(e.target.value);e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'}}
                      style={{...inp,resize:'none',overflow:'hidden',fontSize:13,width:'100%',minHeight:52}} />
                  </div>
                  {/* Mini resumo */}
                  <div style={{background:'rgba(11,18,32,.95)',borderRadius:16,padding:'16px 20px',border:'1px solid rgba(148,163,184,.12)',minWidth:320}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0,textAlign:'center'}}>
                      <div style={{borderRight:'1px solid rgba(255,255,255,.07)',padding:'4px 16px'}}>
                        <p style={{fontSize:11,color:'#94A3B8',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>Subtotal</p>
                        <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC'}}>R$ {fmtBRL(subtotal)}</p>
                      </div>
                      <div style={{borderRight:'1px solid rgba(255,255,255,.07)',padding:'4px 16px'}}>
                        <p style={{fontSize:11,color:'#94A3B8',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>Desconto</p>
                        <p style={{fontSize:15,fontWeight:700,color:descontoNum>0?'#F87171':'#475569'}}>
                          {descontoNum>0?'R$ '+fmtBRL(descontoNum):'—'}
                        </p>
                      </div>
                      <div style={{padding:'4px 16px'}}>
                        <p style={{fontSize:11,color:'#94A3B8',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>Total final</p>
                        <p style={{fontSize:17,fontWeight:900,color:'#22C55E'}}>R$ {fmtBRL(total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>{/* end cm-form-inner */}
              {/* Mobile Footer fixo */}
              <div className="cm-mobile-footer">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total final</span>
                  <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px',width:'100%',maxWidth:'100%'}}>
                  <button onClick={()=>{resetForm();setView('lista')}}
                    style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%'}}>
                    Rascunho
                  </button>
                  <button onClick={handleSalvar}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',width:'100%',boxShadow:'0 4px 12px rgba(37,99,235,.3)'}}>
                    {editandoId?'Salvar':'Criar orçamento'}
                  </button>
                </div>
              </div>

              {/* Coluna direita — Resumo sticky */}
              {/* ══ FOOTER FIXO — 4 BOTÕES ══ */}
              <div className="cm-footer-fixed" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:40,background:'rgba(7,17,31,.97)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(148,163,184,.12)',padding:'14px 24px',boxSizing:'border-box'}}>
                {/* Resumo inline */}
                <div style={{maxWidth:1080,margin:'0 auto'}}>
                  {/* Linha de resumo */}
                  {(subtotal>0||procOdonto.length>0)&&(
                    <div className="cm-footer-resumo" style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:24,marginBottom:12,flexWrap:'wrap'}}>
                      <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:13,color:'#94A3B8'}}>Subtotal: <strong style={{color:'#F8FAFC'}}>R$ {fmtBRL(subtotal)}</strong></span>
                        {descontoNum>0&&<span style={{fontSize:13,color:'#F87171'}}>Desconto: - R$ {fmtBRL(descontoNum)}</span>}
                        <span style={{fontSize:16,fontWeight:800,color:'#22C55E'}}>Total final: R$ {fmtBRL(total)}</span>
                      </div>
                    </div>
                  )}
                  {/* Botões */}
                  <div className="cm-footer-btns" style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <button onClick={handleSalvar}
                      style={{flex:2,minWidth:160,background:'linear-gradient(135deg,#2563EB,#7C3AED)',color:'#fff',border:'none',borderRadius:12,padding:'13px 20px',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(37,99,235,.35)'}}>
                      📄 {editandoId?'Salvar alterações':'Criar orçamento'}
                    </button>
                    <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                      style={{flex:2,minWidth:160,background:'linear-gradient(135deg,#16A34A,#15803D)',color:'#fff',border:'none',borderRadius:12,padding:'13px 20px',fontSize:14,fontWeight:700,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:clienteWpp?1:0.6}}>
                      💬 Enviar no WhatsApp
                    </button>
                    <button onClick={()=>{
                      const itensValidos=itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0)
                      const temItens=itensValidos.length>0||procOdonto.length>0
                      if(!clienteNome.trim()||!temItens){setMensagem('Preencha os dados principais antes de gerar o PDF.');return}
                      const orcTemp={id:'preview',cliente_nome:clienteNome,cliente_whatsapp:clienteWpp,
                        cliente_email:clienteEmail,tipo,status,data:dataDoc,
                        servicos:itensValidos,procedimentos_odonto:procOdonto,
                        subtotal,desconto:descontoNum,total,
                        valor_pago:valorPagoLocal,saldo_restante:saldoLocal,
                        observacoes,obs_pagamento:obsPagamento}
                      gerarPDF(orcTemp)
                    }}
                      style={{flex:1,minWidth:120,background:'rgba(255,255,255,.08)',color:'#CBD5E1',border:'1px solid rgba(255,255,255,.15)',borderRadius:12,padding:'13px 16px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      📥 Baixar PDF
                    </button>
                    <button onClick={()=>{resetForm();setView('lista')}}
                      style={{flex:1,minWidth:140,background:'rgba(255,255,255,.06)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.10)',borderRadius:12,padding:'13px 16px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      📄 Salvar como rascunho
                    </button>
                  </div>
                </div>
              </div>

              </div>

            </div>
          </div>
          </div>
        )}

        {/* ══ DETALHE ══ */}
        {view==='detalhe'&&orcDetalhe&&(()=>{
          const orc=orcDetalhe
          const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
          return (
            <div className="cm-detalhe-pad" style={{padding:'28px 32px 60px',maxWidth:'900px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
                <button onClick={()=>{setView('lista');setShowPagForm(false)}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#667085',fontFamily:'inherit'}}>← Voltar</button>
                <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:'1px solid '+cfg.border}}>{orc.status}</span>
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A'}}>{mensagem}</div>}

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'14px'}}>📊 Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                  {[{l:'Total',v:orc.total,c:'#0F172A'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(
                    <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'12px',border:'1px solid rgba(255,255,255,.08)'}}>
                      <p style={{fontSize:'10px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>{f.l}</p>
                      <p style={{fontSize:'18px',fontWeight:800,color:(f.c==='#0F172A'?'#F8FAFC':f.c)}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    + Registrar pagamento
                  </button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.35)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Copiar link</button>}
                  <button onClick={()=>abrirEditar(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'14px',background:'rgba(7,28,46,.9)',border:'1.5px solid rgba(6,182,212,.30)',borderRadius:'10px',padding:'16px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#67E8F9',marginBottom:'12px'}}>Registrar pagamento</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                      <div><label style={lbl}>Data</label><input type="date" value={pagData} onChange={e=>setPagData(e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>Valor (R$)</label><input type="number" placeholder="0,00" value={pagValor} onChange={e=>setPagValor(e.target.value)} style={inp} /></div>
                    </div>
                    <div style={{marginBottom:'10px'}}><label style={lbl}>Forma</label>
                      <select value={pagForma} onChange={e=>setPagForma(e.target.value)} style={sel}>
                        {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}
                      </select></div>
                    <div style={{marginBottom:'12px'}}><label style={lbl}>Observação</label><input type="text" placeholder="Opcional" value={pagObs} onChange={e=>setPagObs(e.target.value)} style={inp} /></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>setShowPagForm(false)} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                      <button disabled={savingPag} onClick={()=>handleRegistrarPagamento(orc)} style={{flex:2,background:'#2563EB',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{savingPag?'Salvando...':'Confirmar pagamento'}</button>
                    </div>
                  </div>
                )}
              </div>

              {(orc.servicos?.length>0)&&(
                <div className="cm-card" style={card}>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>🛎 Serviços</p>
                  {(orc.servicos||[]).map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                      <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{s.nome}</p><p style={{fontSize:'11px',color:'#9CA3AF'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#059669'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,paddingTop:'10px',marginTop:'4px'}}>
                    <span style={{color:'#F8FAFC'}}>Total</span><span style={{color:'#2563EB'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>📜 Histórico de pagamentos</p>
                {pagamentos.length===0?<p style={{fontSize:'13px',color:'#9CA3AF'}}>Nenhum pagamento registrado.</p>
                :pagamentos.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                    <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.observacao&&<p style={{fontSize:'11px',color:'#9CA3AF'}}>{p.observacao}</p>}</div>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(p.valor)}</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>👤 Cliente</p>
                <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'4px'}}>{orc.cliente_nome}</p>
                {orc.cliente_whatsapp&&<p style={{fontSize:'13px',color:'#667085',marginBottom:'2px'}}>📱 {aplicarMascaraTel(orc.cliente_whatsapp)}</p>}
                {orc.cliente_email&&<p style={{fontSize:'13px',color:'#667085'}}>✉️ {orc.cliente_email}</p>}
                {orc.observacoes&&<p style={{fontSize:'13px',color:'#9CA3AF',marginTop:'8px'}}>{orc.observacoes}</p>}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
