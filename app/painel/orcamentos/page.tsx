'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_COR: Record<string, {bg:string;color:string;border:string}> = {
  'Aberto':               {bg:'rgba(37,99,235,.18)',  color:'#93C5FD', border:'rgba(37,99,235,.4)'},
  'Aguardando aprovação': {bg:'rgba(217,119,6,.18)',  color:'#FCD34D', border:'rgba(217,119,6,.4)'},
  'Em andamento':         {bg:'rgba(124,58,237,.18)', color:'#C4B5FD', border:'rgba(124,58,237,.4)'},
  'Parcialmente pago':    {bg:'rgba(234,88,12,.18)',  color:'#FDBA74', border:'rgba(234,88,12,.4)'},
  'Pago':                 {bg:'rgba(22,163,74,.18)',  color:'#4ADE80', border:'rgba(22,163,74,.4)'},
  'Finalizado':           {bg:'rgba(21,128,61,.18)',  color:'#86EFAC', border:'rgba(21,128,61,.4)'},
  'Cancelado':            {bg:'rgba(220,38,38,.18)',  color:'#FCA5A5', border:'rgba(220,38,38,.4)'},
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

const SIDEBAR_ITEMS = [
  {icon:'▦',label:'Início',href:'/painel'},
  {icon:'▣',label:'Agenda',href:'/painel/agendamentos'},
  {icon:'👥',label:'Clientes',href:'/painel/clientes'},
  {icon:'📋',label:'Orçamentos',href:'/painel/orcamentos',active:true},
  {icon:'💰',label:'Cobranças',href:'/painel/financeiro'},
  {icon:'💳',label:'Pagamentos',href:'/painel/financeiro'},
  {icon:'✂️',label:'Serviços',href:'/painel/servicos'},
  {icon:'👤',label:'Profissionais',href:'/painel/profissionais'},
  {icon:'📊',label:'Relatórios',href:'/painel/relatorio'},
  {icon:'⚙️',label:'Configurações',href:'/painel/perfil'},
]

// Dark Design System tokens
const BG        = '#061220'
const CARD      = 'rgba(15,30,53,.72)'
const CARD_B    = 'rgba(255,255,255,.10)'
const SIDEBAR_C = '#07111F'

const MOBILE_CSS = `
  html,body{overflow-x:hidden;width:100%}
  *,*::before,*::after{box-sizing:border-box}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(.4)}
  select option{background:#0F1E35;color:#fff}

  .cm-drawer{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;background:#0B172A;z-index:50;transform:translateX(-100%);transition:transform .3s ease;display:flex;flex-direction:column}
  .cm-drawer.open{transform:translateX(0)}
  .cm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
  .cm-overlay.open{opacity:1;pointer-events:auto}
  .cm-header-mobile{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:#0B172A;z-index:10;box-shadow:0 1px 0 rgba(255,255,255,.06);width:100%;flex-shrink:0}
  .cm-mobile-footer{display:none;position:fixed;bottom:0;left:0;right:0;background:#07111F;border-top:1px solid rgba(255,255,255,.08);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));z-index:25;flex-direction:column;gap:6px;box-shadow:0 -4px 20px rgba(0,0,0,.4)}

  @media(min-width:1024px){
    .cm-header-mobile{display:none !important}
    .cm-mobile-footer{display:none !important}
    .cm-sidebar{display:flex !important}
    .cm-main{margin-left:220px !important}
    .cm-resumo-mobile{display:none !important}
    .cm-form-right{display:block !important}
    .cm-form-grid{grid-template-columns:1fr 300px !important}
  }
  @media(max-width:1023px){
    .cm-sidebar{display:none !important}
    .cm-main{margin-left:0 !important;width:100% !important;max-width:100% !important;overflow-x:hidden}
    .cm-header-mobile{display:flex !important}
    .cm-form-grid{grid-template-columns:1fr !important}
    .cm-form-right{display:none !important}
    .cm-mobile-footer{display:flex !important}
    .cm-resumo-mobile{display:block !important}
    .cm-form-pad{padding:0 !important}
    .cm-form-inner{padding:16px !important;padding-bottom:150px !important}
    .cm-detalhe-pad{padding:16px 16px 80px !important}
    .cm-lista-topo{padding:16px 16px 0 !important}
    .cm-lista-body{padding:0 16px 80px !important}
    .cm-novo-btn-lista{width:100% !important;margin-top:12px;height:52px !important;border-radius:14px !important;font-size:16px !important}
    .cm-atalhos-grid{grid-template-columns:1fr 1fr !important;gap:10px !important}
    .cm-kpi-grid{grid-template-columns:1fr 1fr !important;gap:10px !important}
    .cm-busca-filtros{flex-direction:column !important;gap:10px !important}
    .cm-busca-input{width:100% !important}
    .cm-filtros-wrap{overflow-x:auto !important;flex-wrap:nowrap !important;-webkit-overflow-scrolling:touch !important;padding-bottom:4px;scrollbar-width:none}
    .cm-filtros-wrap::-webkit-scrollbar{display:none}
    .cm-tabela-desktop{display:none !important}
    .cm-cards-mobile{display:flex !important}
    .cm-2col{grid-template-columns:1fr !important}
    .cm-inprow{grid-template-columns:1fr !important}
    .cm-acoes-grid{display:flex !important;overflow-x:auto !important;overflow-y:hidden !important;gap:12px !important;scroll-snap-type:x mandatory !important;-webkit-overflow-scrolling:touch !important;padding:0 2px 10px 2px !important;scrollbar-width:none !important;width:100% !important;max-width:100% !important}
    .cm-acoes-grid::-webkit-scrollbar{display:none !important}
    .cm-acoes-grid > button{min-width:158px !important;max-width:168px !important;flex:0 0 158px !important;scroll-snap-align:start !important}
    .cm-serv-qtd-val{grid-template-columns:1fr !important}
  }
  @media(min-width:1024px){
    .cm-tabela-desktop{display:block !important}
    .cm-cards-mobile{display:none !important}
    .cm-novo-btn-lista{height:auto !important;width:auto !important}
  }
  @media(max-width:380px){
    .cm-atalhos-grid{grid-template-columns:1fr !important}
    .cm-kpi-grid{grid-template-columns:1fr !important}
    .cm-acoes-grid > button{min-width:150px !important;flex-basis:150px !important}
  }
  .cm-lista-body{overflow-x:hidden}
  .cm-lista-topo{overflow-x:hidden}

  .cm-premium-card{transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
  .cm-premium-card:hover{transform:translateY(-2px);box-shadow:0 18px 45px rgba(0,0,0,.28)}
`

export default function Orcamentos() {
  const [userId,setUserId]=useState('')
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false)
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
  const [pagData,setPagData]=useState(new Date().toISOString().split('T')[0])
  const [pagValor,setPagValor]=useState('')
  const [pagForma,setPagForma]=useState('Pix')
  const [pagObs,setPagObs]=useState('')
  const [showPagForm,setShowPagForm]=useState(false)
  const [showDetalhes,setShowDetalhes]=useState(false)
  const [showPagSection,setShowPagSection]=useState(false)
  const [showObs,setShowObs]=useState(false)
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
    setShowDetalhes(true);setView('form')
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
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'');if(!tel) return
    let msg=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}`
    if(orc.link_pagamento) msg+=`\n\nLink:\n${orc.link_pagamento}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }
  function gerarPDF(orc:any){
    const win=window.open('','_blank');if(!win) return
    const linhas=(orc.servicos||[]).map((s:any)=>`<tr><td>${s.nome}</td><td>${s.qtd||1}</td><td>R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td>R$ ${fmtBRL(s.total||0)}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:32px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}.footer{margin-top:40px;text-align:center;color:#aaa;font-size:11px}</style></head><body><h1>${perfil?.nome_negocio||'Negócio'}</h1><p>${orc.tipo} · ${fmtData(orc.data)}</p><p><strong>${orc.cliente_nome}</strong> · ${orc.cliente_whatsapp||''}</p><table><thead><tr><th>Serviço</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${linhas}<tr><td colspan="3"><strong>Total</strong></td><td><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr><tr><td colspan="3">Pago</td><td style="color:green">R$ ${fmtBRL(orc.valor_pago)}</td></tr><tr><td colspan="3">Saldo</td><td style="color:red">R$ ${fmtBRL(orc.saldo_restante)}</td></tr></tbody></table><div class="footer">Gerado pelo ClienteMarcado</div></body></html>`)
    win.document.close();setTimeout(()=>win.print(),500)
  }
  function gerarMsgCobranca(){
    const tipoDoc=tipo==='__outro__'?tipoOutro:tipo
    const neg=perfil?.nome_negocio||'nosso negócio'
    let msg=`Olá, ${clienteNome||'cliente'}! Aqui é d${neg.match(/^[aeiouAEIOU]/)?'a ':'o '}${neg}.\n\nSeu ${tipoDoc}: R$ ${fmtBRL(total)}.\nPago: R$ ${fmtBRL(valorPagoLocal)}. Saldo: R$ ${fmtBRL(saldoLocal)}.`
    if(linkPag) msg+=`\n\nPagamento:\n${linkPag}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    return msg
  }
  function enviarCobrancaWpp(){
    const tel=clienteWpp.replace(/\D/g,'');if(!tel) return
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(gerarMsgCobranca()),'_blank')
  }
  function fmtHpValor(raw:string){
    const nums=raw.replace(/\D/g,'');if(!nums) return ''
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
    const fp=['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento']
    setEditandoPagIdx(idx);setHpValor(fmtHpValor(String(Math.round(p.valor*100))))
    setHpForma(fp.includes(p.forma)?p.forma:'Outro')
    setHpFormaOutro(fp.includes(p.forma)?'':p.forma)
    setHpData(p.data);setHpObs(p.obs||'');setShowHpForm(true)
  }
  function excluirHpPag(idx:number){
    setHistPags(prev=>prev.filter((_,i)=>i!==idx))
    if(editandoPagIdx===idx){setEditandoPagIdx(null);setShowHpForm(false)}
  }

  const isOdonto=perfil?.tipo_negocio?.toLowerCase().includes('odont')
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

  // Style shortcuts
  const inp:React.CSSProperties={width:'100%',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const,transition:'border-color .15s'}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.07em',display:'block',marginBottom:'7px'}
  const card:React.CSSProperties={background:CARD,borderRadius:'16px',padding:'20px 24px',marginBottom:'14px',border:`1px solid ${CARD_B}`,boxShadow:'0 2px 16px rgba(0,0,0,.25)'}

  // ── Avatar color by initial
  const AVATAR_COLORS=['#2563EB','#7C3AED','#0891B2','#16A34A','#DC2626','#D97706','#DB2777']
  function avatarColor(name:string){return AVATAR_COLORS[(name||'A').charCodeAt(0)%AVATAR_COLORS.length]}

  const Sidebar = () => (
    <div className="cm-sidebar" style={{width:'220px',minHeight:'100vh',background:SIDEBAR_C,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,zIndex:30,flexShrink:0,borderRight:'1px solid rgba(255,255,255,.06)'}}>
      <div style={{padding:'20px 16px 16px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>📋</div>
          <span style={{fontSize:'14px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
        </div>
      </div>
      <nav style={{flex:1,padding:'10px 8px'}}>
        {SIDEBAR_ITEMS.map(item=>(
          <Link key={item.label} href={item.href}
            style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'8px',marginBottom:'2px',textDecoration:'none',background:item.active?'linear-gradient(135deg,#2563EB,#7C3AED)':'transparent',color:item.active?'#FFFFFF':'rgba(203,213,225,.68)',fontSize:'13px',fontWeight:item.active?600:400,transition:'all .15s',borderLeft:item.active?'2px solid rgba(255,255,255,.35)':'2px solid transparent'}}>
            <span style={{fontSize:'15px'}}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:avatarColor(perfil?.nome_negocio||'N'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>
          {(perfil?.nome_negocio||'N').charAt(0).toUpperCase()}
        </div>
        <div style={{minWidth:0}}>
          <p style={{fontSize:'12px',fontWeight:600,color:'#fff',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{perfil?.nome_negocio||'Meu negócio'}</p>
          <p style={{fontSize:'10px',color:'rgba(255,255,255,.4)',marginTop:'2px'}}>Administrador</p>
        </div>
      </div>
    </div>
  )

  if(loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:BG}}>
      <Sidebar />
      <div style={{marginLeft:'220px',flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:BG,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:MOBILE_CSS}} />

      <div className={`cm-overlay${mobileMenuOpen?' open':''}`} onClick={()=>setMobileMenuOpen(false)} />
      <div className={`cm-drawer${mobileMenuOpen?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>ClienteMarcado</span>
          <button onClick={()=>setMobileMenuOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.6)',cursor:'pointer',fontSize:'24px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {SIDEBAR_ITEMS.map(item=>(
            <Link key={item.label} href={item.href} onClick={()=>setMobileMenuOpen(false)}
              style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',borderRadius:'8px',marginBottom:'2px',textDecoration:'none',background:item.active?'linear-gradient(135deg,#2563EB,#7C3AED)':'transparent',color:item.active?'#FFFFFF':'rgba(203,213,225,.72)',fontSize:'14px',fontWeight:item.active?600:400}}>
              <span style={{fontSize:'18px'}}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:avatarColor(perfil?.nome_negocio||'N'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',flexShrink:0}}>
            {(perfil?.nome_negocio||'N').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{fontSize:'13px',fontWeight:600,color:'#fff'}}>{perfil?.nome_negocio||'Meu negócio'}</p>
            <p style={{fontSize:'11px',color:'rgba(255,255,255,.4)'}}>Administrador</p>
          </div>
        </div>
      </div>

      <Sidebar />
      <div className="cm-main" style={{flex:1,minWidth:0,minHeight:'100vh',display:'flex',flexDirection:'column'}}>

        {/* Mobile Header */}
        <div className="cm-header-mobile">
          <button onClick={()=>setMobileMenuOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}} />
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}} />
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}} />
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>ClienteMarcado</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:avatarColor(perfil?.nome_negocio||'N'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>
            {(perfil?.nome_negocio||'N').charAt(0).toUpperCase()}
          </div>
        </div>

        {/* ══ LISTA ══ */}
        {view==='lista'&&(
          <div style={{minHeight:'100vh',background:BG}}>
            <div className="cm-lista-topo" style={{padding:'28px 32px 0',maxWidth:'1280px',margin:'0 auto'}}>

              {/* Título + botão */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'24px'}}>
                <div>
                  <h1 style={{fontSize:'26px',fontWeight:800,color:'#fff',letterSpacing:'-0.03em',marginBottom:'4px'}}>Orçamentos e Cobranças</h1>
                  <p style={{fontSize:'14px',color:'#64748B'}}>Gerencie orçamentos, cobranças e pagamentos com praticidade.</p>
                </div>
                <button onClick={()=>{resetForm();setView('form')}} className="cm-novo-btn-lista"
                  style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'11px 20px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(37,99,235,.4)',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}}>
                  <span style={{fontSize:'16px',lineHeight:1}}>+</span> Novo orçamento
                </button>
              </div>

              {mensagem&&<div style={{padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',background:'rgba(22,163,74,.15)',border:'1px solid rgba(22,163,74,.3)',color:'#4ADE80',fontSize:'13px'}}>{mensagem}</div>}

              {/* CARDS ATALHOS 2x2 mobile / 4 desktop — igual referência */}
              <div className="cm-atalhos-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'20px'}}>
                {[
                  {icon:'📋',label:'Novo orçamento',sub:'Crie um orçamento personalizado em segundos.',cor:'#3B82F6',bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.22)',fn:()=>{resetForm();setView('form')}},
                  {icon:'💰',label:'Cobranças',sub:'Acompanhe e gerencie todas as cobranças emitidas.',cor:'#7C3AED',bg:'rgba(124,58,237,.12)',border:'rgba(124,58,237,.22)',fn:()=>{}},
                  {icon:'💳',label:'Pagamentos',sub:'Visualize pagamentos confirmados e pendentes.',cor:'#0891B2',bg:'rgba(8,145,178,.12)',border:'rgba(8,145,178,.22)',fn:()=>{}},
                  {icon:'👥',label:'Clientes',sub:'Gerencie seus clientes e informações de contato.',cor:'#16A34A',bg:'rgba(22,163,74,.12)',border:'rgba(22,163,74,.22)',fn:()=>{}},
                ].map(a=>(
                  <button key={a.label} onClick={a.fn} className="cm-premium-card"
                    style={{background:a.bg,border:`1px solid ${a.border}`,borderRadius:'16px',padding:'20px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',width:'100%',boxSizing:'border-box' as const,position:'relative',transition:'border-color .2s'}}>
                    <div style={{width:'48px',height:'48px',borderRadius:'50%',background:`${a.cor}22`,border:`1px solid ${a.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',marginBottom:'14px'}}>
                      {a.icon}
                    </div>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'6px'}}>{a.label}</p>
                    <p style={{fontSize:'12px',color:'#64748B',lineHeight:'1.45'}}>{a.sub}</p>
                    <span style={{position:'absolute',top:'18px',right:'18px',color:a.cor,fontSize:'18px',opacity:.7}}>→</span>
                  </button>
                ))}
              </div>

              {/* KPIs 2x2 mobile / 4 desktop */}
              <div className="cm-kpi-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'20px'}}>
                {[
                  {icon:'📂',label:'Em aberto',valor:totalAberto,fmt:'n',cor:'#3B82F6',bg:'rgba(59,130,246,.1)',border:'rgba(59,130,246,.2)'},
                  {icon:'⏳',label:'A receber',valor:totalAReceber,fmt:'brl',cor:'#F59E0B',bg:'rgba(245,158,11,.1)',border:'rgba(245,158,11,.2)'},
                  {icon:'✅',label:'Recebido no mês',valor:recebidoMes,fmt:'brl',cor:'#22C55E',bg:'rgba(34,197,94,.1)',border:'rgba(34,197,94,.2)'},
                  {icon:'🔄',label:'Parciais',valor:parciais,fmt:'n',cor:'#A78BFA',bg:'rgba(167,139,250,.1)',border:'rgba(167,139,250,.2)'},
                ].map(m=>(
                  <div key={m.label} className="cm-premium-card" style={{background:m.bg,border:`1px solid ${m.border}`,borderRadius:'16px',padding:'18px',boxSizing:'border-box' as const}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'50%',background:`${m.bg}`,border:`1px solid ${m.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'12px'}}>
                      {m.icon}
                    </div>
                    <p style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'4px'}}>{m.label}</p>
                    <p style={{fontSize:'22px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em',lineHeight:'1.2'}}>
                      {m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}
                    </p>
                  </div>
                ))}
              </div>

              {/* BUSCA + FILTROS */}
              <div className="cm-busca-filtros" style={{display:'flex',gap:'10px',marginBottom:'12px',alignItems:'center'}}>
                <div className="cm-busca-input" style={{position:'relative',flex:1}}>
                  <span style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',color:'#4B5563',fontSize:'14px'}}>🔍</span>
                  <input type="text" placeholder="Buscar cliente ou serviço..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
                    style={{...inp,paddingLeft:'38px'}} />
                </div>
              </div>
              <div className="cm-filtros-wrap" style={{display:'flex',gap:'6px',marginBottom:'16px'}}>
                {STATUS_LIST.map(s=>(
                  <button key={s} onClick={()=>setFiltroStatus(s)}
                    style={{padding:'6px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',whiteSpace:'nowrap' as const,flexShrink:0,transition:'all .15s',
                      background:filtroStatus===s?'#2563EB':'rgba(255,255,255,.05)',
                      color:filtroStatus===s?'#fff':'#64748B',
                      borderColor:filtroStatus===s?'#2563EB':'rgba(255,255,255,.1)'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* BODY */}
            <div className="cm-lista-body" style={{padding:'0 32px 60px',maxWidth:'1280px',margin:'0 auto'}}>
              {orcsFiltrados.length===0?(
                <div style={{background:CARD,border:`1px solid ${CARD_B}`,borderRadius:'20px',padding:'56px 24px',textAlign:'center'}}>
                  <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'rgba(37,99,235,.15)',border:'1px solid rgba(37,99,235,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>📋</div>
                  <p style={{fontSize:'18px',fontWeight:700,color:'#fff',marginBottom:'8px'}}>Nenhum orçamento ainda</p>
                  <p style={{fontSize:'13px',color:'#64748B',marginBottom:'24px',lineHeight:'1.6'}}>Crie seu primeiro orçamento, registre pagamentos e envie pelo WhatsApp.</p>
                  <button onClick={()=>{resetForm();setView('form')}}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'13px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(37,99,235,.4)'}}>
                    Criar primeiro orçamento
                  </button>
                </div>
              ):(
                <>
                  {/* TABELA DESKTOP */}
                  <div className="cm-tabela-desktop" style={{background:CARD,border:`1px solid ${CARD_B}`,borderRadius:'16px',overflow:'hidden'}}>
                    <div style={{padding:'16px 24px',borderBottom:`1px solid ${CARD_B}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Orçamentos recentes</p>
                      <span style={{fontSize:'12px',color:'#4B5563'}}>{orcsFiltrados.length} registro{orcsFiltrados.length!==1?'s':''}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 130px 110px',padding:'10px 24px',borderBottom:`1px solid rgba(255,255,255,.05)`}}>
                      {['Cliente','Tipo / Data','Total','Pago','Saldo','Status','Ações'].map(h=>(
                        <p key={h} style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.08em'}}>{h}</p>
                      ))}
                    </div>
                    {orcsFiltrados.map((orc,i)=>{
                      const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                      const ac=avatarColor(orc.cliente_nome)
                      return (
                        <div key={orc.id}
                          style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 130px 110px',padding:'13px 24px',borderBottom:i<orcsFiltrados.length-1?`1px solid rgba(255,255,255,.04)`:'none',alignItems:'center',transition:'background .15s'}}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.03)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <div style={{width:'34px',height:'34px',borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>
                              {(orc.cliente_nome||'?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{fontSize:'13px',fontWeight:600,color:'#fff',marginBottom:'1px'}}>{orc.cliente_nome}</p>
                              <p style={{fontSize:'11px',color:'#4B5563'}}>{orc.cliente_whatsapp?aplicarMascaraTel(orc.cliente_whatsapp):''}</p>
                            </div>
                          </div>
                          <div>
                            <p style={{fontSize:'12px',color:'#CBD5E1'}}>{orc.tipo}</p>
                            <p style={{fontSize:'11px',color:'#4B5563'}}>{fmtData(orc.data)}</p>
                          </div>
                          <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>R$ {fmtBRL(orc.total)}</p>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#22C55E'}}>R$ {fmtBRL(orc.valor_pago)}</p>
                          <p style={{fontSize:'13px',fontWeight:600,color:orc.saldo_restante>0?'#F59E0B':'#22C55E'}}>R$ {fmtBRL(orc.saldo_restante)}</p>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,display:'inline-block',whiteSpace:'nowrap' as const}}>
                            {orc.status}
                          </span>
                          <div style={{display:'flex',gap:'4px'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'6px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit'}}>Ver</button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{background:'rgba(22,163,74,.2)',border:'1px solid rgba(22,163,74,.3)',borderRadius:'6px',padding:'5px 8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>💬</button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'5px 8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
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
                      const ac=avatarColor(orc.cliente_nome)
                      return (
                        <div key={orc.id} style={{background:CARD,border:`1px solid ${CARD_B}`,borderRadius:'14px',padding:'16px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                              <div style={{width:'36px',height:'36px',borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',flexShrink:0}}>
                                {(orc.cliente_nome||'?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'1px'}}>{orc.cliente_nome}</p>
                                <p style={{fontSize:'11px',color:'#4B5563'}}>{orc.tipo} · {fmtData(orc.data)}</p>
                              </div>
                            </div>
                            <span style={{fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const,flexShrink:0}}>
                              {orc.status}
                            </span>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                            {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#F59E0B':'#22C55E'}].map(f=>(
                              <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'8px 10px'}}>
                                <p style={{fontSize:'9px',color:'#4B5563',fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'2px'}}>{f.l}</p>
                                <p style={{fontSize:'12px',fontWeight:700,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{flex:2,background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit'}}>
                              Ver detalhes
                            </button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{flex:1,background:'rgba(22,163,74,.15)',border:'1px solid rgba(22,163,74,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>
                              💬
                            </button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{flex:1,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>
                              ✏️
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* AÇÕES RÁPIDAS */}
              <div style={{marginTop:'24px',marginBottom:'40px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
                  <span style={{fontSize:'14px'}}>⚡</span>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Ações rápidas</p>
                </div>
                <div className="cm-acoes-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
                  {[
                    {icon:'📋',label:'Criar orçamento',sub:'Novo personalizado',bg:'rgba(59,130,246,.1)',border:'rgba(59,130,246,.2)',fn:()=>{resetForm();setView('form')}},
                    {icon:'💳',label:'Registrar pgto.',sub:'Marcar recebido',bg:'rgba(34,197,94,.1)',border:'rgba(34,197,94,.2)',fn:()=>{}},
                    {icon:'🔗',label:'Enviar link',sub:'Compartilhar cobrança',bg:'rgba(124,58,237,.1)',border:'rgba(124,58,237,.2)',fn:()=>{}},
                    {icon:'📊',label:'Relatórios',sub:'Ver indicadores',bg:'rgba(8,145,178,.1)',border:'rgba(8,145,178,.2)',fn:()=>{}},
                  ].map(a=>(
                    <button key={a.label} onClick={a.fn}
                      style={{background:a.bg,border:`1px solid ${a.border}`,borderRadius:'14px',padding:'16px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',width:'100%',boxSizing:'border-box' as const,transition:'border-color .2s'}}>
                      <span style={{fontSize:'20px',display:'block',marginBottom:'10px'}}>{a.icon}</span>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#fff',marginBottom:'3px'}}>{a.label}</p>
                      <p style={{fontSize:'11px',color:'#64748B',lineHeight:'1.3'}}>{a.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ FORMULÁRIO ══ */}
        {view==='form'&&(
          <div style={{minHeight:'100vh',background:BG}}>
          <div className="cm-form-pad" style={{padding:'24px 32px 60px',maxWidth:'1100px',margin:'0 auto'}}>
          <div className="cm-form-inner" style={{padding:'24px',width:'100%',boxSizing:'border-box' as const}}>

          {/* Topo form */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px',flexWrap:'wrap',gap:'12px'}}>
            <div>
              <button onClick={()=>{resetForm();setView('lista')}}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#4B5563',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>
                ← Voltar à lista
              </button>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'2px'}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
              <p style={{fontSize:'13px',color:'#64748B'}}>Preencha os dados e envie para o cliente.</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'6px 12px'}}>
              <span style={{fontSize:'12px',color:'#4ADE80'}}>✓</span>
              <span style={{fontSize:'12px',fontWeight:600,color:'#4ADE80'}}>Salvo automaticamente</span>
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

          {/* Grid 2 cols */}
          <div className="cm-form-grid" style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'20px',alignItems:'start'}}>

            {/* Coluna esquerda */}
            <div style={{minWidth:0}}>

              {/* CARD: Cliente */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                  <span style={{fontSize:'16px'}}>👤</span>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#fff'}}>Cliente</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div>
                    <label style={lbl}>Nome *</label>
                    <input style={inp} type="text" placeholder="Nome do cliente" value={clienteNome} onChange={e=>setClienteNome(e.target.value)} />
                  </div>
                  <div className="cm-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div>
                      <label style={lbl}>WhatsApp *</label>
                      <input style={inp} type="tel" placeholder="(11) 99999-9999" value={clienteWpp} onChange={e=>setClienteWpp(aplicarMascaraTel(e.target.value))} />
                    </div>
                    <div>
                      <label style={lbl}>E-mail (opcional)</label>
                      <input style={inp} type="email" placeholder="email@exemplo.com" value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCORDION: Detalhes do documento */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setShowDetalhes(!showDetalhes)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'16px'}}>📋</span>
                    <div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Detalhes do documento</p>
                      <p style={{fontSize:'12px',color:'#4B5563',marginTop:'1px'}}>Tipo, status, profissional e data.</p>
                    </div>
                  </div>
                  <span style={{color:'#4B5563',fontSize:'18px',transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {showDetalhes&&(
                  <div style={{padding:'0 20px 18px',borderTop:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'16px'}}>
                      <div>
                        <label style={lbl}>Tipo</label>
                        <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                          {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t=><option key={t}>{t}</option>)}
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
                          <div style={{marginTop:'8px',padding:'12px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'10px',display:'flex',flexDirection:'column',gap:'8px'}}>
                            <input style={inp} type="text" placeholder="Nome do profissional" value={profNome} onChange={e=>setProfNome(e.target.value)} />
                            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                              <button onClick={()=>setSalvarFreelancer(!salvarFreelancer)}
                                style={{width:'32px',height:'18px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:salvarFreelancer?'#2563EB':'rgba(255,255,255,.15)',flexShrink:0}}>
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
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{fontSize:'16px'}}>✂️</span>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#fff'}}>Serviços / Procedimentos</p>
                </div>
                <p style={{fontSize:'12px',color:'#4B5563',marginBottom:'16px'}}>Adicione os serviços ou itens deste orçamento.</p>

                {itens.map((item,idx)=>(
                  <div key={idx} style={{marginBottom:'12px',padding:'14px',background:'rgba(255,255,255,.04)',borderRadius:'12px',border:'1px solid rgba(255,255,255,.08)',width:'100%',boxSizing:'border-box' as const}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Item {idx+1}</span>
                      {itens.length>1&&(
                        <button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                          style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',borderRadius:'6px',color:'#F87171',cursor:'pointer',fontSize:'12px',padding:'3px 8px',fontFamily:'inherit'}}>
                          Remover
                        </button>
                      )}
                    </div>
                    <div style={{marginBottom:'8px'}}>
                      <label style={lbl}>Nome do serviço *</label>
                      <input style={inp} type="text" placeholder="Ex: Corte de cabelo, limpeza de pele..." value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)} />
                    </div>
                    <div className="cm-serv-qtd-val" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                      <div>
                        <label style={lbl}>Qtd.</label>
                        <input style={{...inp,textAlign:'center'}} type="number" min="1" value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>Valor unitário</label>
                        <div style={{position:'relative'}}>
                          <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#4B5563',fontWeight:600}}>R$</span>
                          <input style={{...inp,paddingLeft:'30px'}} type="number" min="0" step="0.01" placeholder="0,00" value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div style={{background:item.total>0?'rgba(34,197,94,.1)':'rgba(255,255,255,.03)',border:`1px solid ${item.total>0?'rgba(34,197,94,.25)':'rgba(255,255,255,.07)'}`,borderRadius:'8px',padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'12px',color:'#64748B',fontWeight:600}}>Total</span>
                      <span style={{fontSize:'15px',fontWeight:800,color:item.total>0?'#4ADE80':'#374151'}}>R$ {fmtBRL(item.total||0)}</span>
                    </div>
                    <input style={{...inp,fontSize:'13px'}} type="text" placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)} />
                  </div>
                ))}

                <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                  style={{background:'none',border:'none',color:'#3B82F6',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',display:'flex',alignItems:'center',gap:'4px'}}>
                  + Adicionar outro serviço
                </button>

                {/* Subtotal / Desconto / Total */}
                <div style={{marginTop:'16px',background:'rgba(255,255,255,.03)',borderRadius:'12px',padding:'14px 16px',border:'1px solid rgba(255,255,255,.07)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#94A3B8',marginBottom:'8px'}}>
                    <span>Subtotal</span>
                    <span style={{fontWeight:600,color:'#fff'}}>R$ {fmtBRL(subtotal)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',marginBottom:'10px',paddingBottom:'10px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                    <span style={{color:'#94A3B8'}}>Desconto</span>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={e=>setDesconto(e.target.value)}
                      style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:600,textAlign:'right' as const,width:'90px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Total final</span>
                    <span style={{fontSize:'20px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                  </div>
                  {descontoNum>subtotal&&subtotal>0&&<p style={{fontSize:'11px',color:'#F59E0B',marginTop:'4px',textAlign:'right'}}>⚠ Desconto maior que o subtotal.</p>}
                </div>
              </div>

              {/* Resumo mobile */}
              <div className="cm-resumo-mobile" style={{display:'none',background:CARD,borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:`1px solid ${CARD_B}`}}>
                <p style={{fontSize:'11px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'10px'}}>Resumo</p>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                    <span style={{color:'#4B5563'}}>Cliente</span>
                    <span style={{fontWeight:600,color:clienteNome?'#fff':'#374151',maxWidth:'60%',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clienteNome||'Não informado'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                    <span style={{color:'#4B5563'}}>Status</span>
                    <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:STATUS_COR[status]?.bg,color:STATUS_COR[status]?.color,border:`1px solid ${STATUS_COR[status]?.border}`}}>{status}</span>
                  </div>
                  <div style={{height:'1px',background:'rgba(255,255,255,.07)',margin:'2px 0'}} />
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'13px',color:'#4B5563'}}>Total</span>
                    <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                  </div>
                </div>
              </div>

              {/* Odontograma */}
              {isOdonto&&(
                <div style={card}>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'12px'}}>🦷 Odontograma</p>
                  {[DENTES_SUPERIOR,DENTES_INFERIOR].map((arco,ai)=>(
                    <div key={ai} style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {arco.slice(0,arco.length/2).map(n=>(
                        <button key={n} onClick={()=>toggleDente(n)}
                          style={{width:'30px',height:'30px',borderRadius:'6px',border:`1.5px solid ${dentesSelec.includes(n)?'#2563EB':'rgba(255,255,255,.12)'}`,background:dentesSelec.includes(n)?'#2563EB':'rgba(255,255,255,.05)',color:dentesSelec.includes(n)?'#fff':'#64748B',fontSize:'10px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                          {n}
                        </button>
                      ))}
                      <div style={{width:'1px',background:'rgba(255,255,255,.1)',margin:'0 4px'}} />
                      {arco.slice(arco.length/2).map(n=>(
                        <button key={n} onClick={()=>toggleDente(n)}
                          style={{width:'30px',height:'30px',borderRadius:'6px',border:`1.5px solid ${dentesSelec.includes(n)?'#2563EB':'rgba(255,255,255,.12)'}`,background:dentesSelec.includes(n)?'#2563EB':'rgba(255,255,255,.05)',color:dentesSelec.includes(n)?'#fff':'#64748B',fontSize:'10px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                          {n}
                        </button>
                      ))}
                    </div>
                  ))}
                  {dentesSelec.length>0&&<p style={{fontSize:'12px',color:'#3B82F6',marginBottom:'10px'}}>Dentes: {dentesSelec.sort((a,b)=>a-b).join(', ')}</p>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                    <div><label style={lbl}>Procedimento</label><input style={inp} type="text" placeholder="Ex: Restauração" value={procNome} onChange={e=>setProcNome(e.target.value)} /></div>
                    <div><label style={lbl}>Valor</label><input style={inp} type="number" placeholder="0,00" value={procValor} onChange={e=>setProcValor(e.target.value)} /></div>
                  </div>
                  <button onClick={adicionarProcOdonto} disabled={!procNome||dentesSelec.length===0}
                    style={{border:'1.5px dashed rgba(255,255,255,.15)',borderRadius:'8px',padding:'10px',background:'transparent',color:'#64748B',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%',marginBottom:'10px'}}>
                    + Adicionar procedimento
                  </button>
                  {procOdonto.map((p,i)=>(
                    <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'8px',padding:'10px 12px',display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'13px',color:'#CBD5E1'}}>{p.dente?`Dente ${p.dente} — ${p.nome}`:p.nome} · {p.status}</span>
                      <div style={{display:'flex',gap:'8px'}}>
                        <span style={{fontSize:'13px',color:'#4ADE80',fontWeight:700}}>R$ {fmtBRL(parseFloat(p.valor||'0'))}</span>
                        <button onClick={()=>setProcOdonto(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:'16px'}}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACCORDION: Pagamento */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setShowPagSection(!showPagSection)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'16px'}}>💳</span>
                    <div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Pagamento</p>
                      <p style={{fontSize:'12px',color:'#4B5563',marginTop:'1px'}}>
                        {valorPagoLocal>0?`Pago: R$ ${fmtBRL(valorPagoLocal)} · Saldo: R$ ${fmtBRL(saldoLocal)}`:'Entrada, pagamentos parciais e link de cobrança.'}
                      </p>
                    </div>
                  </div>
                  <span style={{color:'#4B5563',fontSize:'18px',transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {showPagSection&&(
                  <div style={{padding:'0 20px 18px',borderTop:'1px solid rgba(255,255,255,.07)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'16px 0'}}>
                      {[{l:'Total',v:total,c:'#fff'},{l:'Pago',v:valorPagoLocal,c:'#4ADE80'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#FDBA74':'#4ADE80'}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'10px 12px',border:'1px solid rgba(255,255,255,.07)'}}>
                          <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'3px'}}>{f.l}</p>
                          <p style={{fontSize:'15px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Toggle sinal */}
                    <div style={{marginBottom:'14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:exigirSinal?'12px':'0'}}>
                        <button onClick={()=>setExigirSinal(!exigirSinal)}
                          style={{width:'36px',height:'20px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:exigirSinal?'#2563EB':'rgba(255,255,255,.15)'}}>
                          <span style={{position:'absolute',top:'2px',left:exigirSinal?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}} />
                        </button>
                        <span style={{fontSize:'13px',color:'#CBD5E1',fontWeight:500,cursor:'pointer'}} onClick={()=>setExigirSinal(!exigirSinal)}>Exigir entrada / sinal?</span>
                      </div>
                      {exigirSinal&&(
                        <div style={{background:'rgba(255,255,255,.03)',borderRadius:'10px',padding:'14px',border:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'10px'}}>
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
                            <div style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',borderRadius:'8px',padding:'10px 14px'}}>
                              <span style={{fontSize:'13px',color:'#4ADE80',fontWeight:700}}>Entrada: R$ {fmtBRL(sinalTipo==='fixo'?parseFloat(sinalValor||'0'):(total*parseFloat(sinalValor||'0'))/100)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Link de pag */}
                    <div style={{marginBottom:'14px'}}>
                      <label style={lbl}>Link de pagamento</label>
                      <input style={inp} type="url" placeholder="Cole aqui o link do Mercado Pago, Asaas, PagSeguro..." value={linkPag} onChange={e=>setLinkPag(e.target.value)} />
                      <p style={{fontSize:'11px',color:'#4B5563',marginTop:'5px'}}>O ClienteMarcado apenas organiza a cobrança. O pagamento é feito pelo link do seu negócio.</p>
                    </div>

                    {/* Botões cobrança */}
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}>
                      <button onClick={()=>navigator.clipboard.writeText(gerarMsgCobranca())}
                        style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>
                        📋 Copiar mensagem
                      </button>
                      <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                        style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}>
                        💬 Enviar pelo WhatsApp
                      </button>
                    </div>

                    <div style={{marginBottom:'14px'}}>
                      <label style={lbl}>Observações de pagamento</label>
                      <input style={inp} type="text" placeholder="Ex: cliente pagou R$ 100 de entrada em dinheiro" value={obsPagamento} onChange={e=>setObsPagamento(e.target.value)} />
                    </div>

                    {/* Hist pagamentos */}
                    <div style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:'14px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                        <p style={{fontSize:'13px',fontWeight:600,color:'#fff'}}>Pagamentos registrados</p>
                        <button onClick={()=>{setShowHpForm(!showHpForm);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')}}
                          style={{background:'rgba(37,99,235,.2)',border:'1px solid rgba(37,99,235,.3)',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit'}}>
                          + Registrar
                        </button>
                      </div>

                      {showHpForm&&(
                        <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.2)',borderRadius:'12px',padding:'16px',marginBottom:'12px'}}>
                          <p style={{fontSize:'13px',fontWeight:700,color:'#93C5FD',marginBottom:'12px'}}>{editandoPagIdx!==null?'Editar':'Registrar pagamento'}</p>
                          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                              <div>
                                <label style={lbl}>Valor *</label>
                                <div style={{position:'relative'}}>
                                  <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#4B5563',fontWeight:600}}>R$</span>
                                  <input style={{...inp,paddingLeft:'30px'}} type="text" inputMode="numeric" placeholder="0,00"
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
                                style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#64748B',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                              <button onClick={salvarHpPag}
                                style={{flex:2,background:'#2563EB',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
                                {editandoPagIdx!==null?'Atualizar':'Salvar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {histPags.length===0&&!showHpForm&&<p style={{fontSize:'12px',color:'#4B5563'}}>Nenhum pagamento registrado ainda.</p>}
                      {histPags.map((p,i)=>(
                        <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                              <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                              <span style={{fontSize:'11px',color:'#4B5563'}}>{p.forma}</span>
                              <span style={{fontSize:'11px',color:'#4B5563'}}>· {fmtData(p.data)}</span>
                            </div>
                            {p.obs&&<p style={{fontSize:'12px',color:'#4B5563'}}>{p.obs}</p>}
                          </div>
                          <div style={{display:'flex',gap:'5px'}}>
                            <button onClick={()=>editarHpPag(i)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
                            <button onClick={()=>excluirHpPag(i)} style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
                          </div>
                        </div>
                      ))}
                      {histPags.length>0&&(
                        <div style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',borderRadius:'8px',padding:'8px 14px',display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                          <span style={{fontSize:'13px',color:'#64748B',fontWeight:600}}>Total pago</span>
                          <span style={{fontSize:'14px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION: Observações */}
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setShowObs(!showObs)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'16px'}}>📝</span>
                    <div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Observações</p>
                      <p style={{fontSize:'12px',color:'#4B5563',marginTop:'1px'}}>Informações extras para o cliente ou equipe.</p>
                    </div>
                  </div>
                  <span style={{color:'#4B5563',fontSize:'18px',transform:showObs?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                </div>
                {showObs&&(
                  <div style={{padding:'0 20px 18px',borderTop:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'12px',marginTop:'16px'}}>
                    <div><label style={lbl}>Observação do cliente</label>
                      <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Alergias, preferências, histórico..." value={clienteObs} onChange={e=>setClienteObs(e.target.value)} /></div>
                    <div><label style={lbl}>Observações do orçamento</label>
                      <textarea rows={3} style={{...inp,resize:'none' as const}} placeholder="Informações adicionais..." value={observacoes} onChange={e=>setObservacoes(e.target.value)} /></div>
                  </div>
                )}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',background:'rgba(59,130,246,.08)',borderRadius:'10px',border:'1px solid rgba(59,130,246,.18)'}}>
                <span style={{fontSize:'15px'}}>💡</span>
                <p style={{fontSize:'12px',color:'#93C5FD'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>
              </div>
            </div>{/* end col esquerda */}

          </div>{/* end cm-form-grid — coluna direita entra aqui fora do cm-form-inner */}
          </div>{/* end cm-form-inner */}

          {/* Mobile Footer */}
          <div className="cm-mobile-footer">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <span style={{fontSize:'12px',color:'#64748B',fontWeight:600}}>Total final</span>
              <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
              <button onClick={()=>{resetForm();setView('lista')}}
                style={{background:'rgba(255,255,255,.07)',color:'#64748B',border:'1px solid rgba(255,255,255,.1)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                Rascunho
              </button>
              <button onClick={handleSalvar}
                style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(37,99,235,.35)'}}>
                {editandoId?'Salvar':'Criar orçamento'}
              </button>
            </div>
          </div>

          {/* Coluna direita — Resumo sticky */}
          <div className="cm-form-right" style={{position:'sticky',top:'24px'}}>
            <div style={{background:CARD,borderRadius:'16px',padding:'20px',border:`1px solid ${CARD_B}`,boxShadow:'0 4px 24px rgba(0,0,0,.3)'}}>
              <p style={{fontSize:'12px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'16px'}}>Resumo</p>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
                <div>
                  <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Cliente</p>
                  <p style={{fontSize:'14px',fontWeight:600,color:clienteNome?'#fff':'#374151'}}>{clienteNome||'Não informado'}</p>
                </div>
                <div>
                  <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Tipo</p>
                  <p style={{fontSize:'13px',color:'#94A3B8'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</p>
                </div>
                <div style={{height:'1px',background:'rgba(255,255,255,.07)'}} />
                <div>
                  <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'4px'}}>Total final</p>
                  <p style={{fontSize:'26px',fontWeight:800,color:'#2563EB',letterSpacing:'-0.03em'}}>R$ {fmtBRL(total)}</p>
                </div>
                {valorPagoLocal>0&&(
                  <div>
                    <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Valor pago</p>
                    <p style={{fontSize:'16px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(valorPagoLocal)}</p>
                  </div>
                )}
                {saldoLocal>0&&(
                  <div>
                    <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Saldo restante</p>
                    <p style={{fontSize:'16px',fontWeight:700,color:'#FDBA74'}}>R$ {fmtBRL(saldoLocal)}</p>
                  </div>
                )}
                <div>
                  <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'4px'}}>Status</p>
                  <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:STATUS_COR[status]?.bg,color:STATUS_COR[status]?.color,border:`1px solid ${STATUS_COR[status]?.border}`}}>{status}</span>
                </div>
              </div>

              <button onClick={handleSalvar}
                style={{width:'100%',background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(37,99,235,.35)',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                📄 {editandoId?'Salvar alterações':'Criar orçamento'}
              </button>
              <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                style={{width:'100%',background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'11px',fontSize:'13px',fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',marginBottom:'8px',opacity:clienteWpp?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                💬 Enviar no WhatsApp
              </button>
              <button onClick={()=>{resetForm();setView('lista')}}
                style={{width:'100%',background:'rgba(255,255,255,.05)',color:'#64748B',border:'1px solid rgba(255,255,255,.08)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                Salvar como rascunho
              </button>

              <div style={{marginTop:'14px',display:'flex',alignItems:'center',gap:'8px',padding:'10px',background:'rgba(255,255,255,.03)',borderRadius:'8px',border:'1px solid rgba(255,255,255,.07)'}}>
                <span style={{fontSize:'16px'}}>🔒</span>
                <div>
                  <p style={{fontSize:'11px',fontWeight:600,color:'#fff'}}>Dados protegidos</p>
                  <p style={{fontSize:'10px',color:'#4B5563'}}>Criptografia de ponta a ponta.</p>
                </div>
              </div>
            </div>
          </div>

          </div>{/* end padding wrapper */}
          </div>
        )}

        {/* ══ DETALHE ══ */}
        {view==='detalhe'&&orcDetalhe&&(()=>{
          const orc=orcDetalhe
          const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
          return (
            <div style={{minHeight:'100vh',background:BG}}>
            <div className="cm-detalhe-pad" style={{padding:'28px 32px 60px',maxWidth:'900px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
                <button onClick={()=>{setView('lista');setShowPagForm(false)}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#4B5563',fontFamily:'inherit'}}>← Voltar</button>
                <h2 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',color:'#4ADE80'}}>{mensagem}</div>}

              {/* Resumo financeiro */}
              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'14px'}}>📊 Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                  {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FDBA74':'#4ADE80'}].map(f=>(
                    <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'12px',border:'1px solid rgba(255,255,255,.07)'}}>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'4px'}}>{f.l}</p>
                      <p style={{fontSize:'20px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    + Registrar pagamento
                  </button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>💬 WhatsApp</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>🔗 Copiar link</button>}
                  <button onClick={()=>abrirEditar(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>✏️ Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'14px',background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'12px',padding:'16px'}}>
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
                      <button onClick={()=>setShowPagForm(false)} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#64748B',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                      <button disabled={savingPag} onClick={()=>handleRegistrarPagamento(orc)} style={{flex:2,background:'#2563EB',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{savingPag?'Salvando...':'Confirmar pagamento'}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Serviços */}
              {(orc.servicos?.length>0)&&(
                <div style={card}>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'12px'}}>🛎 Serviços</p>
                  {(orc.servicos||[]).map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      <div>
                        <p style={{fontSize:'13px',color:'#fff',fontWeight:600}}>{s.nome}</p>
                        <p style={{fontSize:'11px',color:'#4B5563'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p>
                      </div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,paddingTop:'12px',marginTop:'4px'}}>
                    <span style={{color:'#fff'}}>Total</span>
                    <span style={{color:'#2563EB'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}

              {/* Histórico */}
              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'12px'}}>📜 Histórico de pagamentos</p>
                {pagamentos.length===0
                  ?<p style={{fontSize:'13px',color:'#4B5563'}}>Nenhum pagamento registrado.</p>
                  :pagamentos.map((p,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      <div>
                        <p style={{fontSize:'13px',color:'#fff',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>
                        {p.observacao&&<p style={{fontSize:'11px',color:'#4B5563'}}>{p.observacao}</p>}
                      </div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                    </div>
                  ))
                }
              </div>

              {/* Cliente */}
              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'10px'}}>👤 Cliente</p>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'50%',background:avatarColor(orc.cliente_nome),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:700,color:'#fff',flexShrink:0}}>
                    {(orc.cliente_nome||'?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>{orc.cliente_nome}</p>
                    {orc.cliente_whatsapp&&<p style={{fontSize:'13px',color:'#64748B'}}>📱 {aplicarMascaraTel(orc.cliente_whatsapp)}</p>}
                  </div>
                </div>
                {orc.cliente_email&&<p style={{fontSize:'13px',color:'#64748B',marginBottom:'2px'}}>✉️ {orc.cliente_email}</p>}
                {orc.observacoes&&<p style={{fontSize:'13px',color:'#4B5563',marginTop:'8px',lineHeight:'1.5'}}>{orc.observacoes}</p>}
              </div>
            </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
