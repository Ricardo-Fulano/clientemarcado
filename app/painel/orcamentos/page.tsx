'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_COR: Record<string, {bg:string;color:string;border:string}> = {
  'Aberto':               {bg:'#EFF6FF',color:'#2563EB',border:'#BFDBFE'},
  'Aguardando aprovação': {bg:'#FFFBEB',color:'#D97706',border:'#FDE68A'},
  'Em andamento':         {bg:'#F5F3FF',color:'#7C3AED',border:'#DDD6FE'},
  'Parcialmente pago':    {bg:'#FFF7ED',color:'#EA580C',border:'#FED7AA'},
  'Pago':                 {bg:'#F0FDF4',color:'#16A34A',border:'#BBF7D0'},
  'Finalizado':           {bg:'#F0FDF4',color:'#15803D',border:'#86EFAC'},
  'Cancelado':            {bg:'#FEF2F2',color:'#DC2626',border:'#FECACA'},
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
  {icon:'⊞',label:'Início',href:'/painel'},
  {icon:'👥',label:'Clientes',href:'/painel'},
  {icon:'📋',label:'Orçamentos',href:'/painel/orcamentos',active:true},
  {icon:'💰',label:'Cobranças',href:'/painel/financeiro'},
  {icon:'💳',label:'Pagamentos',href:'/painel/financeiro'},
  {icon:'✂️',label:'Serviços',href:'/painel/servicos'},
  {icon:'📅',label:'Agenda',href:'/painel/agendamentos'},
  {icon:'📊',label:'Relatórios',href:'/painel/relatorio'},
  {icon:'⚙️',label:'Configurações',href:'/painel/perfil'},
]

const MOBILE_CSS = `
  html, body { overflow-x: hidden; width: 100%; }
  *, *::before, *::after { box-sizing: border-box; }

  .cm-drawer { position:fixed; top:0; left:0; bottom:0; width:300px; max-width:85vw; background:#0B172A; z-index:50; transform:translateX(-100%); transition:transform .3s ease; display:flex; flex-direction:column; }
  .cm-drawer.open { transform:translateX(0); }
  .cm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:49; opacity:0; pointer-events:none; transition:opacity .3s; }
  .cm-overlay.open { opacity:1; pointer-events:auto; }

  .cm-header-mobile { display:none; align-items:center; justify-content:space-between; padding:0 16px; height:60px; background:#0B172A; z-index:10; box-shadow:0 2px 8px rgba(0,0,0,.3); width:100%; max-width:100%; flex-shrink:0; overflow:hidden; }

  .cm-mobile-footer { display:none; position:fixed; bottom:0; left:0; right:0; width:100%; max-width:100%; background:#fff; border-top:1px solid #DCE3EA; padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px)); z-index:25; flex-direction:column; gap:8px; box-shadow:0 -4px 16px rgba(0,0,0,.08); box-sizing:border-box; }

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
    .cm-sidebar { display:none !important; }
    .cm-main { margin-left:0 !important; width:100% !important; max-width:100% !important; overflow-x:hidden; }
    .cm-header-mobile { display:flex !important; }
    .cm-form-grid { grid-template-columns:1fr !important; }
    .cm-form-right { display:none !important; }
    .cm-mobile-footer { display:flex !important; }
    .cm-resumo-mobile { display:block !important; }
    .cm-lista-pad { padding:16px 16px 80px !important; }
    .cm-form-pad { padding:0 !important; }
    .cm-form-inner { padding:16px !important; padding-bottom:180px !important; }
    .cm-detalhe-pad { padding:16px 16px 80px !important; }
    .cm-metrics { grid-template-columns:1fr 1fr !important; gap:10px !important; }
    .cm-orc-filters { overflow-x:auto !important; flex-wrap:nowrap !important; padding-bottom:4px; -webkit-overflow-scrolling:touch; max-width:100%; }
    .cm-orc-search { width:100% !important; max-width:100% !important; margin-top:8px; }
    .cm-2col { grid-template-columns:1fr !important; }
    .cm-inprow { grid-template-columns:1fr !important; }
    .cm-card { width:100% !important; max-width:100% !important; box-sizing:border-box !important; padding:18px !important; border-radius:16px !important; margin-bottom:16px !important; }
  }

  @media(max-width:380px){
    .cm-metrics { grid-template-columns:1fr !important; }
    .cm-serv-qtd-val { grid-template-columns:1fr !important; }
  }
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
    let msg=`Olá, ${clienteNome||'cliente'}! Aqui é d${neg.match(/^[aeiouAEIOU]/)?'a ':'o '}${neg}.\n\nSeu ${tipoDoc}: R$ ${fmtBRL(total)}.\nPago: R$ ${fmtBRL(valorPagoLocal)}. Saldo: R$ ${fmtBRL(saldoLocal)}.`
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

  // Style constants
  const BG='#F1F4F8'
  const SIDEBAR='#0B172A'
  const inp:React.CSSProperties={width:'100%',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px 14px',fontSize:'15px',color:'#0F172A',outline:'none',fontFamily:'inherit',background:'#F8FAFC',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any}
  const lbl:React.CSSProperties={fontSize:'12px',fontWeight:600,color:'#667085',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:'6px'}
  const card:React.CSSProperties={background:'#fff',borderRadius:'12px',padding:'20px 24px',marginBottom:'12px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}

  // Sidebar component
  const Sidebar = () => (
    <div className="cm-sidebar" style={{width:'220px',minHeight:'100vh',background:SIDEBAR,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,zIndex:30,flexShrink:0}}>
      <div style={{padding:'20px 16px 16px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <span style={{fontSize:'15px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav style={{flex:1,padding:'12px 8px'}}>
        {SIDEBAR_ITEMS.map(item=>(
          <Link key={item.label} href={item.href}
            style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'8px',marginBottom:'2px',textDecoration:'none',background:item.active?'#2563EB':'transparent',color:item.active?'#fff':'rgba(255,255,255,.65)',fontSize:'13px',fontWeight:item.active?600:400,transition:'all .15s'}}>
            <span style={{fontSize:'16px'}}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',flexShrink:0}}>
          {(perfil?.nome_negocio||'N').charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{fontSize:'12px',fontWeight:600,color:'#fff',lineHeight:1.2}}>{perfil?.nome_negocio||'Meu negócio'}</p>
          <p style={{fontSize:'11px',color:'rgba(255,255,255,.5)',marginTop:'2px'}}>Ver perfil</p>
        </div>
      </div>
    </div>
  )

  if(loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:BG}}>
      <Sidebar />
      <div style={{marginLeft:'220px',flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#667085',fontSize:'14px'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:BG,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',maxWidth:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:MOBILE_CSS}} />

      {/* Mobile Overlay */}
      <div className={`cm-overlay${mobileMenuOpen?' open':''}`} onClick={()=>setMobileMenuOpen(false)} />

      {/* Mobile Drawer */}
      <div className={`cm-drawer${mobileMenuOpen?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <span style={{fontSize:'15px',fontWeight:800,color:'#fff'}}>ClienteMarcado</span>
          <button onClick={()=>setMobileMenuOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.6)',cursor:'pointer',fontSize:'24px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
          {SIDEBAR_ITEMS.map(item=>(
            <Link key={item.label} href={item.href} onClick={()=>setMobileMenuOpen(false)}
              style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',borderRadius:'8px',marginBottom:'2px',textDecoration:'none',background:item.active?'#2563EB':'transparent',color:item.active?'#fff':'rgba(255,255,255,.7)',fontSize:'14px',fontWeight:item.active?600:400}}>
              <span style={{fontSize:'18px'}}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',flexShrink:0}}>
            {(perfil?.nome_negocio||'N').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{fontSize:'13px',fontWeight:600,color:'#fff'}}>{perfil?.nome_negocio||'Meu negócio'}</p>
            <p style={{fontSize:'11px',color:'rgba(255,255,255,.5)'}}>Ver perfil</p>
          </div>
        </div>
      </div>

      <Sidebar />
      <div className="cm-main" style={{flex:1,minWidth:0,minHeight:'100vh',display:'flex',flexDirection:'column'}}>

        {/* Mobile Header — inside cm-main so it pushes content down */}
        <div className="cm-header-mobile">
          <button onClick={()=>setMobileMenuOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'#fff',borderRadius:'2px'}} />
            <span style={{display:'block',width:'22px',height:'2px',background:'#fff',borderRadius:'2px'}} />
            <span style={{display:'block',width:'22px',height:'2px',background:'#fff',borderRadius:'2px'}} />
          </button>
          <span style={{fontSize:'15px',fontWeight:800,color:'#fff',letterSpacing:'-0.01em'}}>ClienteMarcado</span>
          <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff'}}>
            {(perfil?.nome_negocio||'N').charAt(0).toUpperCase()}
          </div>
        </div>

        {/* ══ LISTA ══ */}
        {view==='lista'&&(
          <div className="cm-lista-pad cm-content-pad" style={{padding:'28px 32px 60px',maxWidth:'1140px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',gap:'12px',flexWrap:'wrap'}}>
              <div>
                <h1 style={{fontSize:'22px',fontWeight:800,color:'#0F172A',letterSpacing:'-0.02em',marginBottom:'4px'}}>Orçamentos e Cobranças</h1>
                <p style={{fontSize:'14px',color:'#667085'}}>Crie orçamentos, acompanhe pagamentos e envie pelo WhatsApp.</p>
              </div>
              <button onClick={()=>{resetForm();setView('form')}}
                style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'10px 20px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(37,99,235,.3)'}}>
                + Novo orçamento
              </button>
            </div>

            {/* Métricas */}
            <div className="cm-metrics" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px',width:'100%'}}>
              {[
                {label:'Orçamentos em aberto',valor:totalAberto,cor:'#2563EB',fmt:'n'},
                {label:'Total a receber',valor:totalAReceber,cor:'#D97706',fmt:'brl'},
                {label:'Recebido no mês',valor:recebidoMes,cor:'#16A34A',fmt:'brl'},
                {label:'Pagamentos parciais',valor:parciais,cor:'#EA580C',fmt:'n'},
              ].map(m=>(
                <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'16px 18px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.05)',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:m.cor}} />
                  <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>{m.label}</p>
                  <p style={{fontSize:'22px',fontWeight:800,color:m.cor}}>{m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}</p>
                </div>
              ))}
            </div>

            {/* Filtros + busca */}
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px',alignItems:'center'}}>
              {STATUS_LIST.map(s=>(
                <button key={s} onClick={()=>setFiltroStatus(s)}
                  style={{padding:'6px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1.5px solid',fontFamily:'inherit',transition:'all .15s',
                    background:filtroStatus===s?'#2563EB':'#fff',color:filtroStatus===s?'#fff':'#667085',borderColor:filtroStatus===s?'#2563EB':'#DCE3EA'}}>
                  {s}
                </button>
              ))}
              <input type="text" placeholder="Buscar cliente, contato ou serviço..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
                style={{border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'7px 14px',fontSize:'13px',color:'#0F172A',outline:'none',fontFamily:'inherit',background:'#fff',width:'280px'}} />
            </div>

            {mensagem&&<div style={{padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A',fontSize:'13px'}}>{mensagem}</div>}

            {/* Estado vazio */}
            {orcsFiltrados.length===0?(
              <div style={{background:'#fff',borderRadius:'16px',padding:'56px 24px',textAlign:'center',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
                <div style={{fontSize:'44px',marginBottom:'12px'}}>📋</div>
                <p style={{fontSize:'17px',fontWeight:700,color:'#0F172A',marginBottom:'8px'}}>Nenhum orçamento criado ainda</p>
                <p style={{fontSize:'14px',color:'#667085',marginBottom:'24px'}}>Crie seu primeiro orçamento e acompanhe pagamentos em poucos cliques.</p>
                <button onClick={()=>{resetForm();setView('form')}}
                  style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'11px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  Criar orçamento
                </button>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {orcsFiltrados.map(orc=>{
                  const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                  return (
                    <div key={orc.id} style={{background:'#fff',borderRadius:'12px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.05)',overflow:'hidden',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}>
                      <div style={{height:'3px',background:cfg.color}} />
                      <div style={{padding:'16px 20px'}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'10px'}}>
                          <div>
                            <p style={{fontSize:'15px',fontWeight:700,color:'#0F172A',marginBottom:'3px'}}>{orc.cliente_nome}</p>
                            <p style={{fontSize:'12px',color:'#667085'}}>{orc.tipo} · {fmtData(orc.data)}{orc.profissional_nome?' · '+orc.profissional_nome:''}</p>
                          </div>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap'}}>{orc.status}</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                          {[{l:'Total',v:orc.total,c:'#0F172A'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(
                            <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'8px 10px'}}>
                              <p style={{fontSize:'10px',color:'#667085',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                              <p style={{fontSize:'13px',fontWeight:700,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          {[
                            {l:'Ver detalhes',fn:()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')},primary:true},
                            {l:'Registrar pgto',fn:()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe');setShowPagForm(true)},green:true},
                            {l:'PDF',fn:()=>gerarPDF(orc)},
                            {l:'WhatsApp',fn:()=>enviarWpp(orc),wpp:true},
                            {l:'Editar',fn:()=>abrirEditar(orc)},
                            {l:'Excluir',fn:()=>handleExcluir(orc.id),danger:true},
                          ].map(b=>(
                            <button key={b.l} onClick={b.fn}
                              style={{padding:'6px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:'1.5px solid',
                                background:b.primary?'#2563EB':b.green?'#F0FDF4':b.wpp?'#F0FFF4':b.danger?'#FEF2F2':'#F8FAFC',
                                color:b.primary?'#fff':b.green?'#16A34A':b.wpp?'#16A34A':b.danger?'#DC2626':'#667085',
                                borderColor:b.primary?'#2563EB':b.green?'#BBF7D0':b.wpp?'#86EFAC':b.danger?'#FECACA':'#DCE3EA'}}>
                              {b.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ FORMULÁRIO ══ */}
        {view==='form'&&(
          <div className="cm-form-pad cm-content-pad" style={{padding:'24px 32px 60px'}}>
            <div className="cm-form-inner" style={{padding:'24px',width:'100%',maxWidth:'100%',boxSizing:'border-box' as const,overflowX:'hidden'}}>
            {/* Topo */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <button onClick={()=>{resetForm();setView('lista')}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#667085',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>
                  ← Voltar à lista
                </button>
                <h1 style={{fontSize:'22px',fontWeight:800,color:'#0F172A',letterSpacing:'-0.02em',marginBottom:'2px'}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
                <p style={{fontSize:'13px',color:'#667085'}}>Preencha os dados e envie para o cliente.</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px',background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'8px',padding:'6px 12px'}}>
                <span style={{fontSize:'13px',color:'#16A34A'}}>✓</span>
                <span style={{fontSize:'12px',fontWeight:600,color:'#16A34A'}}>Salvo automaticamente</span>
              </div>
            </div>

            {mensagem&&(
              <div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',
                color:mensagem.includes('rro')?'#DC2626':'#16A34A',
                background:mensagem.includes('rro')?'#FEF2F2':'#F0FDF4',
                border:`1px solid ${mensagem.includes('rro')?'#FECACA':'#BBF7D0'}`}}>
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
                    <p style={{fontSize:'15px',fontWeight:700,color:'#0F172A'}}>Cliente</p>
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
                        <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A'}}>Detalhes do documento</p>
                        <p style={{fontSize:'12px',color:'#667085',marginTop:'1px'}}>Tipo, status, profissional e data.</p>
                      </div>
                    </div>
                    <span style={{color:'#667085',fontSize:'18px',transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                  </div>
                  {showDetalhes&&(
                    <div style={{padding:'0 24px 20px',borderTop:'1px solid #F1F4F8',display:'flex',flexDirection:'column',gap:'12px'}}>
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
                            <div style={{marginTop:'8px',padding:'12px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'8px',display:'flex',flexDirection:'column',gap:'8px'}}>
                              <input style={inp} type="text" placeholder="Nome do profissional" value={profNome} onChange={e=>setProfNome(e.target.value)} />
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <button onClick={()=>setSalvarFreelancer(!salvarFreelancer)}
                                  style={{width:'32px',height:'18px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:salvarFreelancer?'#2563EB':'#D1D5DB',flexShrink:0}}>
                                  <span style={{position:'absolute',top:'2px',left:salvarFreelancer?'14px':'2px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'left .2s'}} />
                                </button>
                                <span style={{fontSize:'12px',color:'#667085'}}>Salvar na equipe?</span>
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
                    <p style={{fontSize:'15px',fontWeight:700,color:'#0F172A'}}>Serviços / Procedimentos</p>
                  </div>
                  <p style={{fontSize:'12px',color:'#667085',marginBottom:'16px'}}>Adicione os serviços, procedimentos, produtos ou itens deste orçamento.</p>

                  {/* Header tabela — oculto no mobile */}
                  <div style={{display:'grid',gridTemplateColumns:'3fr 80px 120px 110px 32px',gap:'8px',marginBottom:'8px'}} className="cm-hide-mobile">
                    {['Nome do serviço','Qtd.','Valor unitário','Total',''].map(h=>(
                      <p key={h} style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</p>
                    ))}
                  </div>

                  {itens.map((item,idx)=>(
                    <div key={idx} style={{marginBottom:'12px',padding:'14px',background:'#F8FAFC',borderRadius:'12px',border:'1px solid #DCE3EA',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <span style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em'}}>Item {idx+1}</span>
                        {itens.length>1&&(
                          <button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                            style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'6px',color:'#EF4444',cursor:'pointer',fontSize:'13px',padding:'3px 8px'}}>
                            Remover
                          </button>
                        )}
                      </div>
                      {/* Nome */}
                      <div style={{marginBottom:'8px'}}>
                        <label style={{...lbl,textTransform:'none',fontSize:'12px',marginBottom:'4px'}}>Nome do serviço *</label>
                        <input style={{...inp,width:'100%'}} type="text" placeholder="Ex: Corte de cabelo, limpeza de pele..."
                          value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)} />
                      </div>
                      {/* Qtd + Valor */}
                      <div className="cm-serv-qtd-val" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px',width:'100%',maxWidth:'100%'}}>
                        <div>
                          <label style={{...lbl,textTransform:'none',fontSize:'12px',marginBottom:'4px'}}>Qtd.</label>
                          <input style={{...inp,textAlign:'center',width:'100%'}} type="number" min="1"
                            value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)} />
                        </div>
                        <div>
                          <label style={{...lbl,textTransform:'none',fontSize:'12px',marginBottom:'4px'}}>Valor unitário</label>
                          <div style={{position:'relative'}}>
                            <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#9CA3AF',fontWeight:600}}>R$</span>
                            <input style={{...inp,paddingLeft:'32px',width:'100%',maxWidth:'100%',boxSizing:'border-box'}} type="number" min="0" step="0.01" placeholder="0,00"
                              value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)} />
                          </div>
                        </div>
                      </div>
                      {/* Total */}
                      <div style={{background:item.total>0?'#ECFDF5':'#F8FAFC',border:`1.5px solid ${item.total>0?'#A7F3D0':'#DCE3EA'}`,borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <span style={{fontSize:'12px',color:'#667085',fontWeight:600}}>Total</span>
                        <span style={{fontSize:'16px',fontWeight:800,color:item.total>0?'#059669':'#9CA3AF'}}>R$ {fmtBRL(item.total||0)}</span>
                      </div>
                      {/* Obs */}
                      <input style={{...inp,fontSize:'13px',color:'#667085',background:'#fff',width:'100%'}} type="text"
                        placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)} />
                    </div>
                  ))}

                  <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                    style={{background:'none',border:'none',color:'#2563EB',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',display:'flex',alignItems:'center',gap:'4px'}}>
                    + Adicionar outro serviço
                  </button>

                  {/* Subtotal */}
                  <div style={{marginTop:'16px',background:BG,borderRadius:'10px',padding:'14px 16px',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#667085',marginBottom:'8px'}}>
                      <span>Subtotal</span>
                      <span style={{fontWeight:600,color:'#0F172A'}}>R$ {fmtBRL(subtotal)}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#667085',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid #DCE3EA'}}>
                      <span>Desconto</span>
                      <input type="number" min="0" step="0.01" placeholder="R$ 0,00" value={desconto}
                        onChange={e=>setDesconto(e.target.value)}
                        style={{background:'#fff',border:'1.5px solid #DCE3EA',outline:'none',color:'#EF4444',fontSize:'13px',fontWeight:600,textAlign:'right',width:'100px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}} />
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#0F172A'}}>Total final</span>
                      <span style={{fontSize:'18px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                    </div>
                    {descontoNum>subtotal&&subtotal>0&&<p style={{fontSize:'11px',color:'#F59E0B',marginTop:'4px',textAlign:'right'}}>⚠ Desconto maior que o subtotal.</p>}
                  </div>
                </div>

                {/* Resumo mobile — só aparece no mobile */}
                <div className="cm-resumo-mobile" style={{display:'none',background:'#fff',borderRadius:'16px',padding:'16px 18px',marginBottom:'12px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#0F172A',marginBottom:'12px'}}>Resumo</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#667085'}}>Cliente</span>
                      <span style={{fontWeight:600,color:clienteNome?'#0F172A':'#94A3B8'}}>{clienteNome||'Não informado'}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#667085'}}>Tipo</span>
                      <span style={{color:'#0F172A'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:'#667085'}}>Status</span>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:STATUS_COR[status]?.bg||'#EFF6FF',color:STATUS_COR[status]?.color||'#2563EB',border:`1px solid ${STATUS_COR[status]?.border||'#BFDBFE'}`}}>{status}</span>
                    </div>
                    <div style={{height:'1px',background:'#F1F4F8',margin:'4px 0'}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'13px',color:'#667085'}}>Total final</span>
                      <span style={{fontSize:'20px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                    </div>
                    {valorPagoLocal>0&&(
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#667085'}}>Pago</span>
                        <span style={{fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                      </div>
                    )}
                    {saldoLocal>0&&(
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#667085'}}>Saldo</span>
                        <span style={{fontWeight:700,color:'#EA580C'}}>R$ {fmtBRL(saldoLocal)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Odontograma */}
                {isOdonto&&(
                  <div className="cm-card" style={card}>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#0F172A',marginBottom:'12px'}}>🦷 Odontograma</p>
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
                        <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A'}}>Pagamento</p>
                        <p style={{fontSize:'12px',color:'#667085',marginTop:'1px'}}>
                          {valorPagoLocal>0?`Pago: R$ ${fmtBRL(valorPagoLocal)} · Saldo: R$ ${fmtBRL(saldoLocal)}`:'Entrada, pagamentos parciais e link de cobrança.'}
                        </p>
                      </div>
                    </div>
                    <span style={{color:'#667085',fontSize:'18px',transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
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
                          <span style={{fontSize:'13px',color:'#0F172A',fontWeight:500,cursor:'pointer'}} onClick={()=>setExigirSinal(!exigirSinal)}>Exigir entrada/sinal?</span>
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
                              <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:'8px',padding:'10px 14px'}}>
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
                          style={{background:BG,border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>
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
                          <p style={{fontSize:'13px',fontWeight:600,color:'#0F172A'}}>Pagamentos registrados</p>
                          <button onClick={()=>{setShowHpForm(!showHpForm);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')}}
                            style={{background:'#EFF6FF',border:'1.5px solid #BFDBFE',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#2563EB',cursor:'pointer',fontFamily:'inherit'}}>
                            + Registrar pagamento
                          </button>
                        </div>

                        {showHpForm&&(
                          <div style={{background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
                            <p style={{fontSize:'13px',fontWeight:700,color:'#0369A1',marginBottom:'12px'}}>{editandoPagIdx!==null?'Editar':'Registrar pagamento'}</p>
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                <div>
                                  <label style={lbl}>Valor *</label>
                                  <div style={{position:'relative'}}>
                                    <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#9CA3AF',fontWeight:600}}>R$</span>
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
                                  style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                                <button onClick={salvarHpPag}
                                  style={{flex:2,background:'#2563EB',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
                                  {editandoPagIdx!==null?'Atualizar':'Salvar pagamento'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {histPags.length===0&&!showHpForm&&<p style={{fontSize:'12px',color:'#9CA3AF'}}>Nenhum pagamento registrado ainda.</p>}
                        {histPags.map((p,i)=>(
                          <div key={i} style={{background:BG,border:'1px solid #DCE3EA',borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                                <span style={{fontSize:'14px',fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(p.valor)}</span>
                                <span style={{fontSize:'11px',color:'#667085'}}>{p.forma}</span>
                                <span style={{fontSize:'11px',color:'#9CA3AF'}}>· {fmtData(p.data)}</span>
                              </div>
                              {p.obs&&<p style={{fontSize:'12px',color:'#9CA3AF'}}>{p.obs}</p>}
                            </div>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button onClick={()=>editarHpPag(i)} style={{background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                              <button onClick={()=>excluirHpPag(i)} style={{background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#DC2626',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                            </div>
                          </div>
                        ))}
                        {histPags.length>0&&(
                          <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'8px',padding:'8px 14px',display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                            <span style={{fontSize:'13px',color:'#667085',fontWeight:600}}>Total pago</span>
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
                        <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A'}}>Observações</p>
                        <p style={{fontSize:'12px',color:'#667085',marginTop:'1px'}}>Informações extras para o cliente ou para sua equipe.</p>
                      </div>
                    </div>
                    <span style={{color:'#667085',fontSize:'18px',transform:showObs?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                  </div>
                  {showObs&&(
                    <div style={{padding:'0 18px 18px',borderTop:'1px solid #F1F4F8',display:'flex',flexDirection:'column',gap:'12px',marginTop:'16px',width:'100%',boxSizing:'border-box'}}>
                      <div><label style={lbl}>Observação do cliente</label>
                        <textarea rows={2} style={{...inp,resize:'none'}} placeholder="Alergias, preferências, histórico..."
                          value={clienteObs} onChange={e=>setClienteObs(e.target.value)} /></div>
                      <div><label style={lbl}>Observações do orçamento</label>
                        <textarea rows={3} style={{...inp,resize:'none'}} placeholder="Informações adicionais..."
                          value={observacoes} onChange={e=>setObservacoes(e.target.value)} /></div>
                    </div>
                  )}
                </div>

                {/* Dica */}
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',background:'#EFF6FF',borderRadius:'10px',border:'1px solid #BFDBFE'}}>
                  <span style={{fontSize:'16px'}}>💡</span>
                  <p style={{fontSize:'12px',color:'#2563EB'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>
                </div>
              </div>

            </div>{/* end cm-form-inner */}
              {/* Mobile Footer fixo */}
              <div className="cm-mobile-footer">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:'8px',borderBottom:'1px solid #F1F4F8',width:'100%'}}>
                  <span style={{fontSize:'13px',color:'#667085',fontWeight:600}}>Total final</span>
                  <span style={{fontSize:'20px',fontWeight:800,color:'#2563EB'}}>R$ {fmtBRL(total)}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px',width:'100%',maxWidth:'100%'}}>
                  <button onClick={()=>{resetForm();setView('lista')}}
                    style={{background:'#F8FAFC',color:'#667085',border:'1.5px solid #DCE3EA',borderRadius:'10px',padding:'13px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%',maxWidth:'100%',overflow:'hidden'}}>
                    Rascunho
                  </button>
                  <button onClick={handleSalvar}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'13px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',width:'100%',maxWidth:'100%',overflow:'hidden',boxShadow:'0 4px 12px rgba(37,99,235,.3)'}}>
                    {editandoId?'Salvar':'Criar orçamento'}
                  </button>
                </div>
                <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                  style={{width:'100%',maxWidth:'100%',background:'#F0FFF4',color:'#16A34A',border:'1.5px solid #86EFAC',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.6,boxSizing:'border-box'}}>
                  💬 Enviar no WhatsApp
                </button>
              </div>

              {/* Coluna direita — Resumo sticky */}
              <div className="cm-form-right" style={{position:'sticky',top:'24px'}}>
                <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#0F172A',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'16px'}}>Resumo</p>

                  <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
                    <div>
                      <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Cliente</p>
                      <p style={{fontSize:'14px',fontWeight:600,color:clienteNome?'#0F172A':'#9CA3AF'}}>{clienteNome||'Não informado'}</p>
                    </div>
                    <div>
                      <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Tipo</p>
                      <p style={{fontSize:'14px',color:'#0F172A'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</p>
                    </div>
                    <div style={{height:'1px',background:'#F1F4F8'}} />
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
                      <p style={{fontSize:'11px',fontWeight:600,color:'#667085',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>Status</p>
                      <span style={{fontSize:'12px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:STATUS_COR[status]?.bg||'#EFF6FF',color:STATUS_COR[status]?.color||'#2563EB',border:`1px solid ${STATUS_COR[status]?.border||'#BFDBFE'}`}}>{status}</span>
                    </div>
                  </div>

                  <button onClick={handleSalvar}
                    style={{width:'100%',background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'13px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(37,99,235,.3)',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    📄 {editandoId?'Salvar alterações':'Criar orçamento'}
                  </button>
                  <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                    style={{width:'100%',background:'#F0FFF4',color:'#16A34A',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'11px',fontSize:'14px',fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',marginBottom:'8px',opacity:clienteWpp?1:0.6,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    💬 Enviar no WhatsApp
                  </button>
                  <button onClick={()=>{resetForm();setView('lista')}}
                    style={{width:'100%',background:'#F8FAFC',color:'#667085',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    📄 Salvar como rascunho
                  </button>

                  <div style={{marginTop:'16px',display:'flex',alignItems:'center',gap:'8px',padding:'10px',background:'#F8FAFC',borderRadius:'8px',border:'1px solid #DCE3EA'}}>
                    <span style={{fontSize:'18px'}}>🔒</span>
                    <div>
                      <p style={{fontSize:'12px',fontWeight:600,color:'#0F172A'}}>Seus dados estão seguros</p>
                      <p style={{fontSize:'11px',color:'#9CA3AF'}}>e protegidos com criptografia.</p>
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
                <h2 style={{fontSize:'20px',fontWeight:800,color:'#0F172A'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A'}}>{mensagem}</div>}

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A',marginBottom:'14px'}}>📊 Resumo financeiro</p>
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
                  <button onClick={()=>gerarPDF(orc)} style={{background:BG,border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'#F0FFF4',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#16A34A',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} style={{background:BG,border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Copiar link</button>}
                  <button onClick={()=>abrirEditar(orc)} style={{background:BG,border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'14px',background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'10px',padding:'16px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#0369A1',marginBottom:'12px'}}>Registrar pagamento</p>
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
                  <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A',marginBottom:'12px'}}>🛎 Serviços</p>
                  {(orc.servicos||[]).map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F1F4F8'}}>
                      <div><p style={{fontSize:'13px',color:'#0F172A',fontWeight:600}}>{s.nome}</p><p style={{fontSize:'11px',color:'#9CA3AF'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#059669'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,paddingTop:'10px',marginTop:'4px'}}>
                    <span style={{color:'#0F172A'}}>Total</span><span style={{color:'#2563EB'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A',marginBottom:'12px'}}>📜 Histórico de pagamentos</p>
                {pagamentos.length===0?<p style={{fontSize:'13px',color:'#9CA3AF'}}>Nenhum pagamento registrado.</p>
                :pagamentos.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F1F4F8'}}>
                    <div><p style={{fontSize:'13px',color:'#0F172A',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.observacao&&<p style={{fontSize:'11px',color:'#9CA3AF'}}>{p.observacao}</p>}</div>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(p.valor)}</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#0F172A',marginBottom:'10px'}}>👤 Cliente</p>
                <p style={{fontSize:'14px',fontWeight:600,color:'#0F172A',marginBottom:'4px'}}>{orc.cliente_nome}</p>
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
