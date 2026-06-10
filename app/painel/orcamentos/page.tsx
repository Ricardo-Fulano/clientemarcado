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
function fmtData(d:string){if(!d)return '';const[a,m,di]=d.split('-');return `${di}/${m}/${a}`}
function aplicarMascaraTel(v:string){
  const n=v.replace(/\D/g,'').slice(0,11)
  if(n.length>10)return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if(n.length>6) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if(n.length>2) return `(${n.slice(0,2)}) ${n.slice(2)}`
  if(n.length>0) return `(${n}`
  return ''
}

const MOBILE_CSS = `
  html, body { overflow-x: hidden !important; width: 100%; max-width: 100%; }
  *, *::before, *::after { box-sizing: border-box; }

  /* ══ DESKTOP ≥1024px ══ */
  @media(min-width:1024px){
    .psb-main { margin-left:220px !important; }
    .cm-resumo-mobile { display:none !important; }
    .cm-form-right { display:block !important; }
    .cm-form-grid { grid-template-columns:1fr 300px !important; }
    .cm-tabela-desktop { display:block !important; }
    .cm-cards-mobile { display:none !important; }
    .cm-novo-btn-lista { height:auto !important; width:auto !important; }
  }

  /* ══ MOBILE ≤1023px ══ */
  @media(max-width:1023px){
    .psb-wrapper {
      overflow-x:hidden !important;
      width:100% !important;
      max-width:100% !important;
      flex-direction:column !important;
    }
    .psb-main {
      margin-left:0 !important;
      width:100% !important;
      max-width:100% !important;
      min-width:0 !important;
      overflow-x:hidden !important;
      box-sizing:border-box !important;
      display:block !important;
      visibility:visible !important;
      opacity:1 !important;
    }

    /* Formulário */
    .cm-form-grid { grid-template-columns:1fr !important; }
    .cm-form-right { display:none !important; }
    .cm-resumo-mobile { display:block !important; }
    .cm-form-pad { padding:0 !important; }
    .cm-form-inner { padding:14px !important; padding-bottom:140px !important; }
    .cm-detalhe-pad { padding:14px 14px 80px !important; }
    .cm-2col { grid-template-columns:1fr !important; }
    .cm-inprow { grid-template-columns:1fr !important; }
    .cm-title-row { flex-direction:column !important; align-items:flex-start !important; }

    /* Lista */
    .cm-lista-topo {
      padding:14px 14px 0 !important;
      overflow-x:hidden !important;
      max-width:100% !important;
      width:100% !important;
      display:block !important;
      visibility:visible !important;
      opacity:1 !important;
    }
    .cm-lista-body {
      padding:0 14px 80px !important;
      overflow-x:hidden !important;
      max-width:100% !important;
      width:100% !important;
      display:block !important;
      visibility:visible !important;
      opacity:1 !important;
    }

    /* Botão novo orçamento */
    .cm-novo-btn-lista {
      width:100% !important;
      margin-top:12px !important;
      height:48px !important;
      border-radius:12px !important;
      font-size:15px !important;
      display:flex !important;
      justify-content:center !important;
      visibility:visible !important;
      opacity:1 !important;
    }

    /* KPI cards */
    .cm-kpi-grid {
      display:grid !important;
      grid-template-columns:1fr 1fr !important;
      gap:10px !important;
      width:100% !important;
      max-width:100% !important;
    }

    /* Busca */
    .cm-busca-filtros { flex-direction:column !important; gap:10px !important; }
    .cm-busca-input { width:100% !important; max-width:100% !important; }
    .cm-orc-search { width:100% !important; max-width:100% !important; }

    /* Filtros — QUEBRAM LINHA */
    .cm-filtros-wrap {
      display:flex !important;
      flex-wrap:wrap !important;
      gap:8px !important;
      width:100% !important;
      max-width:100% !important;
      overflow:visible !important;
      padding-bottom:4px !important;
    }
    .cm-filtros-wrap button {
      flex:0 0 auto !important;
      white-space:nowrap !important;
      font-size:13px !important;
    }

    /* Tabela → Cards */
    .cm-tabela-desktop { display:none !important; }
    .cm-cards-mobile {
      display:flex !important;
      flex-direction:column !important;
      gap:12px !important;
      width:100% !important;
      max-width:100% !important;
      visibility:visible !important;
      opacity:1 !important;
    }

    /* Botões card mobile — grid 2 colunas */
    .cm-card-acoes {
      display:grid !important;
      grid-template-columns:1fr 1fr !important;
      gap:8px !important;
      width:100% !important;
    }
    .cm-card-acoes button {
      width:100% !important;
      min-width:0 !important;
      box-sizing:border-box !important;
      white-space:nowrap !important;
    }

    .cm-metrics { grid-template-columns:1fr 1fr !important; gap:10px !important; }
    .cm-card { width:100% !important; max-width:100% !important; box-sizing:border-box !important; }
  }

  /* ══ TELAS ≤360px ══ */
  @media(max-width:360px){
    .cm-kpi-grid { grid-template-columns:1fr !important; }
    .cm-metrics { grid-template-columns:1fr !important; }
    .cm-filtros-wrap button { font-size:12px !important; padding:6px 10px !important; }
  }

  /* ══ TELAS ≤300px ══ */
  @media(max-width:300px){
    .cm-card-acoes { grid-template-columns:1fr !important; }
    .cm-lista-topo { padding:10px 10px 0 !important; }
    .cm-lista-body { padding:0 10px 80px !important; }
  }

  .cm-lista-body { overflow-x:hidden; }
  .cm-lista-topo { overflow-x:hidden; }
`

export default function Orcamentos() {
  const [userId,setUserId]=useState('')
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [filtroStatus,setFiltroStatus]=useState('Todos')
  const [filtroCliente,setFiltroCliente]=useState('')
  const [view,setView]=useState<'lista'|'form'|'detalhe'>('lista')
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
  const [procOdonto,setProcOdonto]=useState<any[]>([])
  const [procNome,setProcNome]=useState('')
  const [procValor,setProcValor]=useState('')
  const [procStatus,setProcStatus]=useState('A realizar')
  const [procObs,setProcObs]=useState('')

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
    setOrcamentos((data||[]).filter((o:any)=>o.origem!=='cobranca_manual'))
  }

  async function carregarPagamentos(orcId:string){
    const {data}=await supabase.from('orcamento_pagamentos').select('*').eq('orcamento_id',orcId).order('data',{ascending:false})
    setPagamentos(data||[])
  }

  const subtotal=itens.reduce((a,i)=>a+(parseFloat(i.unitario||'0')*(parseInt(i.qtd)||1)),0)+procOdonto.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
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
    setItens([{nome:'',qtd:1,unitario:'',total:0,obs:''}])
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
    setItens(orc.servicos?.length?orc.servicos:[{nome:'',qtd:1,unitario:'',total:0,obs:''}])
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
      origem:'orcamento',
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
    let msg=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}`
    if(orc.link_pagamento) msg+=`\n\nLink:\n${orc.link_pagamento}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }

  function gerarPDF(orc:any){
    const win=window.open('','_blank'); if(!win) return
    const linhas=(orc.servicos||[]).map((s:any)=>`<tr><td>${s.nome}</td><td>${s.qtd||1}</td><td>R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td>R$ ${fmtBRL(s.total||0)}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:32px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}.footer{margin-top:40px;text-align:center;color:#aaa;font-size:11px}</style></head><body>
    <h1>${perfil?.nome_negocio||'Negócio'}</h1><p>${orc.tipo} · ${fmtData(orc.data)}</p>
    <p><strong>${orc.cliente_nome}</strong> · ${orc.cliente_whatsapp||''}</p>
    <table><thead><tr><th>Serviço</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${linhas}
    <tr><td colspan="3"><strong>Total</strong></td><td><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr>
    <tr><td colspan="3">Pago</td><td style="color:green">R$ ${fmtBRL(orc.valor_pago)}</td></tr>
    <tr><td colspan="3">Saldo</td><td style="color:red">R$ ${fmtBRL(orc.saldo_restante)}</td></tr>
    </tbody></table><div class="footer">Gerado pelo ClienteMarcado</div></body></html>`)
    win.document.close();setTimeout(()=>win.print(),500)
  }

  function gerarMsgCobranca(){
    const tipoDoc=tipo==='__outro__'?tipoOutro:tipo
    const neg=perfil?.nome_negocio||'nosso negócio'
    let msg=`Olá, ${clienteNome||'cliente'}! Aqui é d${(neg[0]&&'aeiouAEIOUáéíóúÁÉÍÓÚ'.includes(neg[0])?'a ':'o ')}${neg}.\n\nSeu ${tipoDoc}: R$ ${fmtBRL(total)}.\nPago: R$ ${fmtBRL(valorPagoLocal)}. Saldo: R$ ${fmtBRL(saldoLocal)}.`
    if(linkPag) msg+=`\n\nPagamento:\n${linkPag}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
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
  function adicionarProcOdonto(){
    if(!procNome||dentesSelec.length===0) return
    setProcOdonto(prev=>[...prev,...dentesSelec.map(d=>({dente:d,nome:procNome,valor:procValor,status:procStatus,obs:procObs}))])
    setProcNome('');setProcValor('');setProcObs('');setProcStatus('A realizar');setDentesSelec([])
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
  const BG='#F1F4F8'
  const SIDEBAR='#0B172A'
  const inp:React.CSSProperties={width:'100%',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px 14px',fontSize:'15px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any,color:'#fff'}
  const lbl:React.CSSProperties={fontSize:'12px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:'6px'}
  const card:React.CSSProperties={background:'rgba(255,255,255,.06)',borderRadius:'16px',padding:'20px 24px',marginBottom:'12px',border:'1px solid rgba(255,255,255,.1)',boxShadow:'0 4px 20px rgba(0,0,0,.2)'}

  // Sidebar component
    if(loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:BG}}>
      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile='Orçamentos' />
      <div style={{marginLeft:'220px',flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#07111F'}}>
        <p style={{color:'#94A3B8',fontSize:'14px'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div className="psb-wrapper" style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',maxWidth:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:MOBILE_CSS}} />

      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile='Orçamentos' />
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
                  onClick={()=>{ resetForm(); setView('form') }}
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
                  <div key={m.label} style={{background:m.bg,border:`1px solid ${m.border}`,borderRadius:'14px',padding:'16px',boxSizing:'border-box' as const}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:m.bg,border:`1px solid ${m.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>
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
                  <button onClick={()=>{resetForm();setView('form')}}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'13px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(37,99,235,.4)',width:'100%',maxWidth:'320px'}}>
                    Criar primeiro orçamento
                  </button>
                </div>
              ):(
                <>
                  {/* TABELA DESKTOP */}
                  <div className="cm-tabela-desktop" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'20px',overflow:'hidden'}}>
                    <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Orçamentos recentes</p>
                      <span style={{fontSize:'12px',color:'#64748B'}}>{orcsFiltrados.length} registro{orcsFiltrados.length!==1?'s':''}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 120px 200px',padding:'10px 24px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      {['Cliente','Tipo / Data','Total','Pago','Saldo','Status','Ações'].map(h=>(
                        <p key={h} style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{h}</p>
                      ))}
                    </div>
                    {orcsFiltrados.map((orc,i)=>{
                      const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                      return (
                        <div key={orc.id}
                          style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 120px 200px',padding:'14px 24px',borderBottom:i<orcsFiltrados.length-1?'1px solid rgba(255,255,255,.05)':'none',alignItems:'center',transition:'background .15s',cursor:'default'}}
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
                          <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,display:'inline-block'}}>
                            {orc.status}
                          </span>
                          <div style={{display:'flex',gap:'4px',flexWrap:'nowrap',alignItems:'center'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>Ver</button>
                            <button onClick={()=>gerarPDF(orc)}
                              style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.30)',borderRadius:'6px',padding:'4px 6px',fontSize:'11px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>PDF</button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{background:'rgba(22,163,74,.2)',border:'1px solid rgba(22,163,74,.3)',borderRadius:'6px',padding:'4px 6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>💬</button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',padding:'4px 6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
                            <button onClick={()=>handleExcluir(orc.id)}
                              style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.25)',borderRadius:'6px',padding:'4px 6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
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
                        <div key={orc.id} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'14px',boxSizing:'border-box' as const,width:'100%',minWidth:0,overflow:'hidden'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                            <div>
                              <p style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>{orc.cliente_nome}</p>
                              <p style={{fontSize:'12px',color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}</p>
                            </div>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const}}>
                              {orc.status}
                            </span>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                            {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#F59E0B':'#22C55E'}].map(f=>(
                              <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'8px 10px'}}>
                                <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'.04em',marginBottom:'2px'}}>{f.l}</p>
                                <p style={{fontSize:'13px',fontWeight:700,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="cm-card-acoes" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',width:'100%'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit',boxSizing:'border-box' as const}}>
                              Ver detalhes
                            </button>
                            <button onClick={()=>gerarPDF(orc)}
                              style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.30)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit',boxSizing:'border-box' as const}}>
                              📥 PDF
                            </button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{background:'rgba(22,163,74,.2)',border:'1px solid rgba(22,163,74,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',boxSizing:'border-box' as const}}>
                              💬 WhatsApp
                            </button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#CBD5E1',cursor:'pointer',fontFamily:'inherit',boxSizing:'border-box' as const}}>
                              ✏️ Editar
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

        {/* ══ FORMULÁRIO ══ */}
        {view==='form'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
          <div className="cm-form-pad cm-content-pad" style={{padding:'24px 32px 60px',maxWidth:'1100px',margin:'0 auto'}}>
            <div className="cm-form-inner" style={{padding:'24px',width:'100%',maxWidth:'100%',boxSizing:'border-box' as const,overflowX:'hidden'}}>
            {/* Topo */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <button onClick={()=>{resetForm();setView('lista')}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>
                  ← Voltar à lista
                </button>
                <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'2px'}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
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
                border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>
                {mensagem}
              </div>
            )}

            {/* Layout 2 colunas */}
            <div className="cm-form-grid" style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'20px',alignItems:'start'}}>

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

                {/* CARD: Serviços */}
                <div className="cm-card" style={card}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                    <span style={{fontSize:'16px'}}>✂️</span>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>
                  </div>
                  <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'16px'}}>Adicione os serviços, procedimentos, produtos ou itens deste orçamento.</p>

                  {/* Header tabela — oculto no mobile */}
                  <div style={{display:'grid',gridTemplateColumns:'3fr 80px 120px 110px 32px',gap:'8px',marginBottom:'8px'}} className="cm-hide-mobile">
                    {['Nome do serviço','Qtd.','Valor unitário','Total',''].map(h=>(
                      <p key={h} style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</p>
                    ))}
                  </div>

                  {itens.map((item,idx)=>(
                    <div key={idx} style={{marginBottom:'12px',padding:'14px',background:'#F8FAFC',borderRadius:'12px',border:'1px solid #DCE3EA',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <span style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em'}}>Item {idx+1}</span>
                        {itens.length>1&&(
                          <button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                            style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'6px',color:'#EF4444',cursor:'pointer',fontSize:'13px',padding:'3px 8px'}}>
                            Remover
                          </button>
                        )}
                      </div>
                      {/* Nome */}
                      <div style={{marginBottom:'8px'}}>
                        <label style={{fontSize:'12px',fontWeight:600,color:'#667085',display:'block',marginBottom:'6px',whiteSpace:'normal',lineHeight:'1.3'}}>Nome do serviço *</label>
                        <input style={{...inp,width:'100%'}} type="text" placeholder="Ex: Corte de cabelo, limpeza de pele..."
                          value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)} />
                      </div>
                      {/* Qtd + Valor */}
                      <div className="cm-serv-qtd-val" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px',width:'100%',maxWidth:'100%'}}>
                        <div>
                          <label style={{fontSize:'12px',fontWeight:600,color:'#667085',display:'block',marginBottom:'6px'}}>Qtd.</label>
                          <input style={{...inp,textAlign:'center',width:'100%'}} type="number" min="1"
                            value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)} />
                        </div>
                        <div>
                          <label style={{fontSize:'12px',fontWeight:600,color:'#667085',display:'block',marginBottom:'6px'}}>Valor</label>
                          <div style={{position:'relative'}}>
                            <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#475569',fontWeight:600}}>R$</span>
                            <input style={{...inp,paddingLeft:'32px',width:'100%',maxWidth:'100%',boxSizing:'border-box'}} type="number" min="0" step="0.01" placeholder="0,00"
                              value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)} />
                          </div>
                        </div>
                      </div>
                      {/* Total */}
                      <div style={{background:item.total>0?'rgba(34,197,94,.12)':'rgba(255,255,255,.04)',border:`1.5px solid ${item.total>0?'rgba(34,197,94,.3)':'rgba(255,255,255,.08)'}`,borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total</span>
                        <span style={{fontSize:'16px',fontWeight:800,color:item.total>0?'#4ADE80':'#475569'}}>R$ {fmtBRL(item.total||0)}</span>
                      </div>
                      {/* Obs */}
                      <input style={{...inp,fontSize:'13px',color:'#94A3B8',width:'100%'}} type="text"
                        placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)} />
                    </div>
                  ))}

                  <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                    style={{background:'none',border:'none',color:'#2563EB',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',display:'flex',alignItems:'center',gap:'4px'}}>
                    + Adicionar outro serviço
                  </button>

                  {/* Subtotal */}
                  <div style={{marginTop:'16px',background:BG,borderRadius:'10px',padding:'14px 16px',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#94A3B8',marginBottom:'8px'}}>
                      <span>Subtotal</span>
                      <span style={{fontWeight:600,color:'#fff'}}>R$ {fmtBRL(subtotal)}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#667085',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid #DCE3EA'}}>
                      <span>Desconto</span>
                      <input type="number" min="0" step="0.01" placeholder="R$ 0,00" value={desconto}
                        onChange={e=>setDesconto(e.target.value)}
                        style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:600,textAlign:'right' as const,width:'100px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}} />
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Total final</span>
                      <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                    </div>
                    {descontoNum>subtotal&&subtotal>0&&<p style={{fontSize:'11px',color:'#F59E0B',marginTop:'4px',textAlign:'right'}}>⚠ Desconto maior que o subtotal.</p>}
                  </div>
                </div>

                {/* Resumo mobile — só aparece no mobile */}
                <div className="cm-resumo-mobile" style={{display:'none',background:'#fff',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
                  <p style={{fontSize:'12px',fontWeight:700,color:'#667085',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'10px'}}>Resumo</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#667085'}}>Cliente</span>
                      <span style={{fontWeight:600,color:clienteNome?'#fff':'#475569',maxWidth:'60%',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clienteNome||'Não informado'}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#667085'}}>Tipo</span>
                      <span style={{color:'#F8FAFC'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#667085'}}>Status</span>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:STATUS_COR[status]?.bg||'#EFF6FF',color:STATUS_COR[status]?.color||'#2563EB',border:`1px solid ${STATUS_COR[status]?.border||'#BFDBFE'}`}}>{status}</span>
                    </div>
                    <div style={{height:'1px',background:'rgba(255,255,255,.08)',margin:'2px 0'}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'13px',color:'#667085'}}>Total</span>
                      <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                    </div>
                    {valorPagoLocal>0&&(<>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#667085'}}>Pago</span>
                        <span style={{fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#667085'}}>Saldo</span>
                        <span style={{fontWeight:700,color:'#EA580C'}}>R$ {fmtBRL(saldoLocal)}</span>
                      </div>
                    </>)}
                  </div>
                </div>

                {/* Odontograma */}
                {isOdonto&&(
                  <div className="cm-card" style={card}>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>🦷 Odontograma</p>
                    {[DENTES_SUPERIOR,DENTES_INFERIOR].map((arco,ai)=>(
                      <div key={ai} style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
                        {arco.slice(0,arco.length/2).map(n=>(
                          <button key={n} onClick={()=>toggleDente(n)}
                            style={{width:'32px',height:'32px',borderRadius:'6px',border:`1.5px solid ${dentesSelec.includes(n)?'#2563EB':'#DCE3EA'}`,background:dentesSelec.includes(n)?'#2563EB':'#F8FAFC',color:dentesSelec.includes(n)?'#fff':'#667085',fontSize:'10px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                            {n}
                          </button>
                        ))}
                        <div style={{width:'1px',background:'#DCE3EA',margin:'0 4px'}} />
                        {arco.slice(arco.length/2).map(n=>(
                          <button key={n} onClick={()=>toggleDente(n)}
                            style={{width:'32px',height:'32px',borderRadius:'6px',border:`1.5px solid ${dentesSelec.includes(n)?'#2563EB':'#DCE3EA'}`,background:dentesSelec.includes(n)?'#2563EB':'#F8FAFC',color:dentesSelec.includes(n)?'#fff':'#667085',fontSize:'10px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                            {n}
                          </button>
                        ))}
                      </div>
                    ))}
                    {dentesSelec.length>0&&<p style={{fontSize:'12px',color:'#2563EB',marginBottom:'10px'}}>Dentes: {dentesSelec.sort((a,b)=>a-b).join(', ')}</p>}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                      <div><label style={lbl}>Procedimento</label><input style={inp} type="text" placeholder="Ex: Restauração" value={procNome} onChange={e=>setProcNome(e.target.value)} /></div>
                      <div><label style={lbl}>Valor</label><input style={inp} type="number" placeholder="0,00" value={procValor} onChange={e=>setProcValor(e.target.value)} /></div>
                    </div>
                    <button onClick={adicionarProcOdonto} disabled={!procNome||dentesSelec.length===0}
                      style={{border:'1.5px dashed #DCE3EA',borderRadius:'8px',padding:'10px',background:'transparent',color:'#667085',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%',marginBottom:'10px'}}>
                      + Adicionar procedimento
                    </button>
                    {procOdonto.map((p,i)=>(
                      <div key={i} style={{background:BG,border:'1px solid #DCE3EA',borderRadius:'8px',padding:'10px 12px',display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                        <span style={{fontSize:'13px',color:'#374151'}}>{p.dente?`Dente ${p.dente} — `:''}  {p.nome} · {p.status}</span>
                        <div style={{display:'flex',gap:'8px'}}>
                          <span style={{fontSize:'13px',color:'#059669',fontWeight:700}}>R$ {fmtBRL(parseFloat(p.valor||'0'))}</span>
                          <button onClick={()=>setProcOdonto(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer',fontSize:'16px'}}>×</button>
                        </div>
                      </div>
                    ))}
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
                          {valorPagoLocal>0?`Pago: R$ ${fmtBRL(valorPagoLocal)} · Saldo: R$ ${fmtBRL(saldoLocal)}`:'Entrada, pagamentos parciais e link de cobrança.'}
                        </p>
                      </div>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                  </div>
                  {showPagSection&&(
                    <div style={{padding:'0 24px 20px',borderTop:'1px solid #F1F4F8'}}>
                      {/* Cards resumo */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'16px 0'}}>
                        {[{l:'Total',v:total,c:'#0F172A'},{l:'Pago',v:valorPagoLocal,c:'#16A34A'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#EA580C':'#16A34A'}].map(f=>(
                          <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'10px',border:'1px solid #DCE3EA'}}>
                            <p style={{fontSize:'10px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                            <p style={{fontSize:'15px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
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
                          <div style={{background:BG,borderRadius:'10px',padding:'14px',border:'1px solid #DCE3EA',display:'flex',flexDirection:'column',gap:'10px'}}>
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
                          style={{background:'#F0FFF4',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#16A34A',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}>
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
                      <div style={{borderTop:'1px solid #F1F4F8',paddingTop:'14px'}}>
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
                                      value={hpValor} onChange={e=>{const v=e.target.value.split('').filter((c:string)=>'0123456789'.includes(c)).join('');setHpValor(fmtHpValor(v||'0'))}} />
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
                                  style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
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
                              <button onClick={()=>editarHpPag(i)} style={{background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                              <button onClick={()=>excluirHpPag(i)} style={{background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#DC2626',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
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

                {/* Dica */}
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',background:'rgba(59,130,246,.1)',borderRadius:'10px',border:'1px solid rgba(59,130,246,.2)'}}>
                  <span style={{fontSize:'16px'}}>💡</span>
                  <p style={{fontSize:'12px',color:'#93C5FD'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>
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
              <div className="cm-form-right" style={{position:'sticky',top:'24px'}}>
                <div style={{background:'rgba(255,255,255,.06)',borderRadius:'16px',padding:'20px',border:'1px solid rgba(255,255,255,.1)',boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'16px'}}>Resumo</p>

                  <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
                    <div>
                      <p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Cliente</p>
                      <p style={{fontSize:'14px',fontWeight:600,color:clienteNome?'#fff':'#475569'}}>{clienteNome||'Não informado'}</p>
                    </div>
                    <div>
                      <p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Tipo</p>
                      <p style={{fontSize:'14px',color:'#CBD5E1'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</p>
                    </div>
                    <div style={{height:'1px',background:'rgba(255,255,255,.08)'}} />
                    <div>
                      <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>Total final</p>
                      <p style={{fontSize:'24px',fontWeight:800,color:'#2563EB',letterSpacing:'-0.02em'}}>R$ {fmtBRL(total)}</p>
                    </div>
                    {valorPagoLocal>0&&(
                      <div>
                        <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Valor pago</p>
                        <p style={{fontSize:'16px',fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</p>
                      </div>
                    )}
                    {saldoLocal>0&&(
                      <div>
                        <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Saldo restante</p>
                        <p style={{fontSize:'16px',fontWeight:700,color:'#EA580C'}}>R$ {fmtBRL(saldoLocal)}</p>
                      </div>
                    )}
                    <div>
                      <p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>Status</p>
                      <span style={{fontSize:'12px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:STATUS_COR[status]?.bg||'#EFF6FF',color:STATUS_COR[status]?.color||'#2563EB',border:`1px solid ${STATUS_COR[status]?.border||'#BFDBFE'}`}}>{status}</span>
                    </div>
                  </div>

                  <button onClick={handleSalvar}
                    style={{width:'100%',background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'13px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(37,99,235,.3)',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    📄 {editandoId?'Salvar alterações':'Criar orçamento'}
                  </button>
                  <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                    style={{width:'100%',background:'rgba(34,197,94,.15)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'11px',fontSize:'14px',fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',marginBottom:'8px',opacity:clienteWpp?1:0.6,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    💬 Enviar no WhatsApp
                  </button>
                  <button onClick={()=>{resetForm();setView('lista')}}
                    style={{width:'100%',background:'rgba(255,255,255,.06)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    📄 Salvar como rascunho
                  </button>

                  <div style={{marginTop:'16px',display:'flex',alignItems:'center',gap:'8px',padding:'10px',background:'rgba(255,255,255,.04)',borderRadius:'8px',border:'1px solid rgba(255,255,255,.08)'}}>
                    <span style={{fontSize:'18px'}}>🔒</span>
                    <div>
                      <p style={{fontSize:'12px',fontWeight:600,color:'#fff'}}>Seus dados estão seguros</p>
                      <p style={{fontSize:'11px',color:'#64748B'}}>e protegidos com criptografia.</p>
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
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A'}}>{mensagem}</div>}

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'14px'}}>📊 Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                  {[{l:'Total',v:orc.total,c:'#0F172A'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(
                    <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'12px',border:'1px solid #DCE3EA'}}>
                      <p style={{fontSize:'10px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>{f.l}</p>
                      <p style={{fontSize:'18px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    + Registrar pagamento
                  </button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'#F0FFF4',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#16A34A',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Copiar link</button>}
                  <button onClick={()=>abrirEditar(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'14px',background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'10px',padding:'16px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#93C5FD',marginBottom:'12px'}}>Registrar pagamento</p>
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
                      <button onClick={()=>setShowPagForm(false)} style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
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
// deploy 06/08/2026 19:38:07
