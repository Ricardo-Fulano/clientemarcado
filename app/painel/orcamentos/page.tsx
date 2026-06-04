'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import PainelSidebar from '@/app/components/PainelSidebar'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

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

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.16),transparent 32%),radial-gradient(circle at top right,rgba(59,130,246,.10),transparent 35%),linear-gradient(180deg,#050B16,#07111F);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;font-family:inherit;text-decoration:none;box-shadow:0 8px 24px rgba(59,130,246,.28)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(59,130,246,.38)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1.5px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .18s}
.btn-s:hover{border-color:rgba(124,58,237,.38);color:#fff}
.orc-card{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.14);border-radius:18px;overflow:hidden;margin-bottom:10px;transition:all .18s}
.orc-card:hover{border-color:rgba(124,58,237,.28);box-shadow:0 0 28px rgba(124,58,237,.10)}
.met-card{background:radial-gradient(circle at top left,var(--mc),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid var(--mb);border-radius:18px;padding:18px 16px;box-shadow:0 20px 48px rgba(0,0,0,.28)}
.pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.80);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}
.pill:hover{border-color:rgba(124,58,237,.28);color:#fff}
.pill.on{background:${G};border-color:transparent;color:#fff;box-shadow:0 0 16px rgba(124,58,237,.28)}
.srch{background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px 0 42px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s}
.srch:focus{border-color:rgba(124,58,237,.55)}
.acc-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;cursor:pointer;user-select:none;border-radius:18px}
.acc-hdr:hover{background:rgba(255,255,255,.02)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.form-grid{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:1023px){
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .form-grid{grid-template-columns:1fr!important}
  .form-right{display:none!important}
  .mob-footer{display:flex!important}
  .grid2{grid-template-columns:1fr!important}
  .resumo-mob{display:block!important}
}
.mob-footer{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(5,11,22,.97);border-top:1px solid rgba(148,163,184,.12);padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));z-index:25;flex-direction:column;gap:8px;backdrop-filter:blur(20px)}
.resumo-mob{display:none}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
`

function fmtBRL(v:number){return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
function fmtData(d:string){if(!d)return '';const[a,m,di]=d.split('-');return `${di}/${m}/${a}`}
function maskTel(v:string){
  const n=v.replace(/\D/g,'').slice(0,11)
  if(n.length>10)return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if(n.length>6) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if(n.length>2) return `(${n.slice(0,2)}) ${n.slice(2)}`
  if(n.length>0) return `(${n}`
  return ''
}

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
  const [msg,setMsg]=useState('')
  const [savingPag,setSavingPag]=useState(false)

  // Form fields
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
    setShowHpForm(false);setShowPagForm(false);setEditandoId(null)
  }

  function abrirEditar(orc:any){
    setEditandoId(orc.id)
    setClienteNome(orc.cliente_nome||'');setClienteWpp(maskTel(orc.cliente_whatsapp||''))
    setClienteEmail(orc.cliente_email||'');setClienteObs(orc.cliente_obs||'')
    const tiposPadrao=['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno']
    const tipoSalvo=orc.tipo||'Orçamento'
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
    setMsg('')
    const erros:string[]=[]
    if(!clienteNome.trim()) erros.push('Informe o nome do cliente.')
    if(!clienteWpp||clienteWpp.replace(/\D/g,'').length<10) erros.push('Informe o WhatsApp com DDD.')
    if(tipo==='__outro__'&&!tipoOutro.trim()) erros.push('Especifique o tipo do documento.')
    if(profId==='__outro__'&&!profNome.trim()) erros.push('Informe o nome do profissional.')
    const itensValidos=itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0&&parseInt(i.qtd||'1')>0)
    if(itensValidos.length===0) erros.push('Adicione pelo menos um serviço com nome e valor.')
    if(erros.length>0){setMsg(erros.join(' | '));window.scrollTo({top:0,behavior:'smooth'});return}
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
      if(error){setMsg('Erro ao salvar.');return}
    } else {
      const {error}=await supabase.from('orcamentos').insert(payload)
      if(error){setMsg('Erro ao criar orçamento.');return}
    }
    if(profId==='__outro__'&&profNome.trim()&&salvarFreelancer){
      await supabase.from('profissionais').insert({user_id:userId,nome:profNome.trim(),especialidade:'Freelancer'})
      const {data:profs}=await supabase.from('profissionais').select('id,nome').eq('user_id',userId)
      setProfissionais(profs||[])
    }
    resetForm();setView('lista');await carregarOrcamentos()
    setMsg(editandoId?'Orçamento atualizado!':'Orçamento criado com sucesso!')
    setTimeout(()=>setMsg(''),4000)
  }

  async function handleExcluir(id:string){
    if(!window.confirm('Excluir este orçamento?')) return
    await supabase.from('orcamentos').delete().eq('id',id)
    await carregarOrcamentos()
  }

  async function handleRegistrarPagamento(orc:any){
    const valor=parseFloat(pagValor||'0')
    if(!valor){setMsg('Informe o valor.');return}
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
    setMsg('Pagamento registrado!');setTimeout(()=>setMsg(''),3000)
  }

  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,''); if(!tel) return
    let m=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}`
    if(orc.link_pagamento) m+=`\n\nLink:\n${orc.link_pagamento}`
    m+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(m),'_blank')
  }

  function gerarPDF(orc:any){
    const win=window.open('','_blank'); if(!win) return
    const linhas=(orc.servicos||[]).map((s:any)=>`<tr><td>${s.nome}</td><td>${s.qtd||1}</td><td>R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td>R$ ${fmtBRL(s.total||0)}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:32px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}</style></head><body><h1>${perfil?.nome_negocio||'Negócio'}</h1><p>${orc.tipo} · ${fmtData(orc.data)}</p><p><strong>${orc.cliente_nome}</strong> · ${orc.cliente_whatsapp||''}</p><table><thead><tr><th>Serviço</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${linhas}<tr><td colspan="3"><strong>Total</strong></td><td><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr><tr><td colspan="3">Pago</td><td>R$ ${fmtBRL(orc.valor_pago)}</td></tr><tr><td colspan="3">Saldo</td><td>R$ ${fmtBRL(orc.saldo_restante)}</td></tr></tbody></table></body></html>`)
    win.document.close();setTimeout(()=>win.print(),500)
  }

  function gerarMsgCobranca(){
    const tipoDoc=tipo==='__outro__'?tipoOutro:tipo
    const neg=perfil?.nome_negocio||'nosso negócio'
    let m=`Olá, ${clienteNome||'cliente'}! Aqui é d${neg.match(/^[aeiouAEIOU]/)?'a ':'o '}${neg}.\n\nSeu ${tipoDoc}: R$ ${fmtBRL(total)}.\nPago: R$ ${fmtBRL(valorPagoLocal)}. Saldo: R$ ${fmtBRL(saldoLocal)}.`
    if(linkPag) m+=`\n\nPagamento:\n${linkPag}`
    m+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    return m
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
    if(!valor||valor<=0){setMsg('Valor inválido.');return}
    if(hpForma==='Outro'&&!hpFormaOutro.trim()){setMsg('Especifique a forma.');return}
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
  const nome=perfil?.nome_negocio||''

  // shared styles
  const inp:React.CSSProperties={width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'14px',padding:'0 14px',height:'48px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',transition:'border-color .2s',display:'block',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer'}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',display:'block',marginBottom:'7px'}
  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:'18px',padding:'20px 22px',marginBottom:'12px',boxShadow:'0 20px 48px rgba(0,0,0,.28)'}
  const badge=(s:string)=>{const c=STATUS_COR[s]||STATUS_COR['Aberto'];return{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:c.bg,color:c.color,border:`1px solid ${c.border}`,whiteSpace:'nowrap' as const}}

  if(loading) return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <PainelSidebar nome={nome} tituloMobile="Orçamentos" />

      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'rgba(15,23,42,.97)',border:'1px solid rgba(124,58,237,.35)',borderRadius:10,padding:'10px 20px',fontSize:12,fontWeight:700,color:'#C4B5FD',zIndex:200,whiteSpace:'nowrap',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>{msg}</div>}

          {/* ══ LISTA ══ */}
          {view==='lista'&&(
            <div style={{animation:'fadeIn .2s ease'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:24}}>
                <div>
                  <h1 style={{fontSize:22,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:5}}>Orçamentos e Cobranças</h1>
                  <p style={{fontSize:13,color:'#64748B'}}>Crie orçamentos, acompanhe pagamentos e envie pelo WhatsApp.</p>
                </div>
                <button onClick={()=>{resetForm();setView('form')}} className="btn-p">+ Novo orçamento</button>
              </div>

              {/* KPIs */}
              <div className="kpi-grid">
                {[
                  {l:'Orçamentos em aberto',v:totalAberto,fmt:'n',c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.22)',ico:'📋'},
                  {l:'Total a receber',v:totalAReceber,fmt:'brl',c:'#FACC15',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.22)',ico:'💰'},
                  {l:'Recebido no mês',v:recebidoMes,fmt:'brl',c:'#22C55E',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.22)',ico:'✅'},
                  {l:'Pagamentos parciais',v:parciais,fmt:'n',c:'#FB923C',bg:'rgba(249,115,22,.10)',bd:'rgba(249,115,22,.22)',ico:'⏳'},
                ].map(k=>(
                  <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:18,padding:'18px 16px',boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
                    <div style={{width:38,height:38,borderRadius:11,background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:10}}>{k.ico}</div>
                    <p style={{fontSize:10,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>{k.l}</p>
                    <p style={{fontSize:26,fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.fmt==='brl'?`R$ ${fmtBRL(k.v as number)}`:k.v}</p>
                  </div>
                ))}
              </div>

              {/* Filtros */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12,alignItems:'center'}}>
                {STATUS_LIST.map(s=>(
                  <button key={s} onClick={()=>setFiltroStatus(s)} className={`pill${filtroStatus===s?' on':''}`}>{s}</button>
                ))}
                <div style={{position:'relative',marginLeft:'auto'}}>
                  <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#64748B',pointerEvents:'none'}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="srch" style={{width:240}} placeholder="Buscar cliente..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}/>
                </div>
              </div>

              {/* Lista */}
              {orcsFiltrados.length===0?(
                <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
                  <div style={{fontSize:44,marginBottom:12,opacity:.3}}>📋</div>
                  <p style={{fontSize:17,fontWeight:700,color:'#F8FAFC',marginBottom:8}}>Nenhum orçamento criado ainda</p>
                  <p style={{fontSize:13,color:'#64748B',marginBottom:24}}>Crie seu primeiro orçamento e acompanhe pagamentos em poucos cliques.</p>
                  <button onClick={()=>{resetForm();setView('form')}} className="btn-p">Criar orçamento</button>
                </div>
              ):(
                orcsFiltrados.map(orc=>{
                  const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                  return(
                    <div key={orc.id} className="orc-card">
                      <div style={{height:3,background:cfg.color,opacity:.7}}/>
                      <div style={{padding:'16px 20px'}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:10}}>
                          <div>
                            <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC',marginBottom:3}}>{orc.cliente_nome}</p>
                            <p style={{fontSize:12,color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}{orc.profissional_nome?' · '+orc.profissional_nome:''}</p>
                          </div>
                          <span style={badge(orc.status)}>{orc.status}</span>
                        </div>
                        <div className="grid3" style={{marginBottom:12}}>
                          {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FACC15':'#22C55E'}].map(f=>(
                            <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:'8px 12px',border:'1px solid rgba(148,163,184,.10)'}}>
                              <p style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{f.l}</p>
                              <p style={{fontSize:14,fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {[
                            {l:'Ver detalhes',fn:()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')},s:{background:G,color:'#fff',border:'none',boxShadow:'0 4px 14px rgba(59,130,246,.28)'}},
                            {l:'Registrar pgto',fn:()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe');setShowPagForm(true)},s:{background:'rgba(34,197,94,.12)',color:'#22C55E',border:'1.5px solid rgba(34,197,94,.28)'}},
                            {l:'PDF',fn:()=>gerarPDF(orc),s:{background:'rgba(255,255,255,.05)',color:'#94A3B8',border:'1px solid rgba(148,163,184,.16)'}},
                            {l:'WhatsApp',fn:()=>enviarWpp(orc),s:{background:'rgba(34,197,94,.10)',color:'#22C55E',border:'1.5px solid rgba(34,197,94,.22)'}},
                            {l:'Editar',fn:()=>abrirEditar(orc),s:{background:'rgba(59,130,246,.10)',color:'#60A5FA',border:'1.5px solid rgba(59,130,246,.22)'}},
                            {l:'Excluir',fn:()=>handleExcluir(orc.id),s:{background:'rgba(239,68,68,.08)',color:'#F87171',border:'1.5px solid rgba(239,68,68,.20)'}},
                          ].map(b=>(
                            <button key={b.l} onClick={b.fn} style={{padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',...b.s}}>{b.l}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ══ FORMULÁRIO ══ */}
          {view==='form'&&(
            <div style={{animation:'fadeIn .2s ease'}}>
              <div style={{marginBottom:20}}>
                <button onClick={()=>{resetForm();setView('lista')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#64748B',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,marginBottom:8}}>← Voltar à lista</button>
                <h1 style={{fontSize:22,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:4}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
                <p style={{fontSize:13,color:'#64748B'}}>Preencha os dados e envie para o cliente.</p>
              </div>

              {msg&&<div style={{fontSize:13,padding:'10px 14px',borderRadius:10,marginBottom:16,color:msg.includes('rro')?'#F87171':'#4ADE80',background:msg.includes('rro')?'rgba(239,68,68,.10)':'rgba(34,197,94,.10)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.25)':'rgba(34,197,94,.25)'}`}}>{msg}</div>}

              <div className="form-grid">
                {/* Coluna esquerda */}
                <div>
                  {/* Card cliente */}
                  <div style={card}>
                    <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:16,display:'flex',alignItems:'center',gap:8}}><span>👤</span> Cliente</p>
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      <div><label style={lbl}>Nome *</label><input style={inp} type="text" placeholder="Nome do cliente" value={clienteNome} onChange={e=>setClienteNome(e.target.value)}/></div>
                      <div className="grid2">
                        <div><label style={lbl}>WhatsApp *</label><input style={inp} type="tel" placeholder="(11) 99999-9999" value={clienteWpp} onChange={e=>setClienteWpp(maskTel(e.target.value))}/></div>
                        <div><label style={lbl}>E-mail</label><input style={inp} type="email" placeholder="email@exemplo.com" value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)}/></div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion detalhes */}
                  <div style={{...card,padding:0,overflow:'hidden'}}>
                    <div className="acc-hdr" onClick={()=>setShowDetalhes(!showDetalhes)}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span>📋</span>
                        <div><p style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Detalhes do documento</p><p style={{fontSize:12,color:'#64748B',marginTop:1}}>Tipo, status, profissional e data.</p></div>
                      </div>
                      <span style={{color:'#64748B',fontSize:18,transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                    </div>
                    {showDetalhes&&(
                      <div style={{padding:'0 22px 20px',borderTop:'1px solid rgba(148,163,184,.08)',display:'flex',flexDirection:'column',gap:12,marginTop:16}}>
                        <div className="grid2">
                          <div>
                            <label style={lbl}>Tipo</label>
                            <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                              {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t=><option key={t} value={t}>{t}</option>)}
                              <option value="__outro__">Outro</option>
                            </select>
                            {tipo==='__outro__'&&<div style={{marginTop:8,display:'flex',flexDirection:'column',gap:6}}><input style={inp} type="text" placeholder="Ex: Avaliação..." value={tipoOutro} onChange={e=>setTipoOutro(e.target.value)}/><input style={inp} type="text" placeholder="Descrição (opcional)" value={tipoDescricao} onChange={e=>setTipoDescricao(e.target.value)}/></div>}
                          </div>
                          <div><label style={lbl}>Status</label><select style={sel} value={status} onChange={e=>setStatus(e.target.value)}>{['Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}</select></div>
                        </div>
                        <div className="grid2">
                          <div>
                            <label style={lbl}>Profissional</label>
                            <select style={sel} value={profId} onChange={e=>{setProfId(e.target.value);if(e.target.value!=='__outro__'){setProfNome('');setSalvarFreelancer(false)}}}>
                              <option value="">Nenhum</option>
                              {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                              <option value="__outro__">✏️ Outro / Não cadastrado</option>
                            </select>
                            {profId==='__outro__'&&(
                              <div style={{marginTop:8,padding:12,background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.20)',borderRadius:12,display:'flex',flexDirection:'column',gap:8}}>
                                <input style={inp} type="text" placeholder="Nome do profissional" value={profNome} onChange={e=>setProfNome(e.target.value)}/>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <button onClick={()=>setSalvarFreelancer(!salvarFreelancer)} style={{width:32,height:18,borderRadius:999,border:'none',cursor:'pointer',position:'relative',background:salvarFreelancer?'#22C55E':'rgba(255,255,255,.15)',flexShrink:0}}>
                                    <span style={{position:'absolute',top:2,left:salvarFreelancer?14:2,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                                  </button>
                                  <span style={{fontSize:12,color:'#94A3B8'}}>Salvar na equipe?</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div><label style={lbl}>Data</label><input style={inp} type="date" value={dataDoc} onChange={e=>setDataDoc(e.target.value)}/></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card serviços */}
                  <div style={card}>
                    <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:4,display:'flex',alignItems:'center',gap:8}}><span>✂️</span> Serviços / Procedimentos</p>
                    <p style={{fontSize:12,color:'#64748B',marginBottom:16}}>Adicione os serviços, procedimentos ou itens deste orçamento.</p>
                    <div style={{display:'grid',gridTemplateColumns:'3fr 70px 110px 100px 32px',gap:8,marginBottom:8}}>
                      {['Serviço','Qtd.','Valor unit.','Total',''].map(h=><p key={h} style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em'}}>{h}</p>)}
                    </div>
                    {itens.map((item,idx)=>(
                      <div key={idx} style={{display:'grid',gridTemplateColumns:'3fr 70px 110px 100px 32px',gap:8,marginBottom:8,alignItems:'start'}}>
                        <input style={inp} type="text" placeholder="Nome do serviço..." value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)}/>
                        <input style={{...inp,textAlign:'center'}} type="number" min="1" value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)}/>
                        <div style={{position:'relative'}}><span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#64748B',fontWeight:600}}>R$</span><input style={{...inp,paddingLeft:32}} type="number" min="0" step="0.01" placeholder="0,00" value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)}/></div>
                        <div style={{background:item.total>0?'rgba(34,197,94,.10)':'rgba(255,255,255,.04)',border:`1.5px solid ${item.total>0?'rgba(34,197,94,.25)':'rgba(148,163,184,.10)'}`,borderRadius:12,padding:'10px 10px',textAlign:'right'}}><span style={{fontSize:13,fontWeight:800,color:item.total>0?'#22C55E':'#475569'}}>R$ {fmtBRL(item.total||0)}</span></div>
                        {itens.length>1?<button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))} style={{background:'none',border:'1.5px solid rgba(239,68,68,.25)',borderRadius:8,color:'#F87171',cursor:'pointer',fontSize:16,width:32,height:48,display:'flex',alignItems:'center',justifyContent:'center'}}>🗑</button>:<div/>}
                        <div style={{gridColumn:'1/-1'}}><input style={{...inp,fontSize:13,color:'#94A3B8'}} type="text" placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)}/></div>
                      </div>
                    ))}
                    <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])} style={{background:'none',border:'none',color:'#7C3AED',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',display:'flex',alignItems:'center',gap:4}}>+ Adicionar serviço</button>
                    <div style={{marginTop:16,background:'rgba(255,255,255,.04)',borderRadius:14,padding:'14px 16px',border:'1px solid rgba(148,163,184,.10)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#94A3B8',marginBottom:8}}><span>Subtotal</span><span style={{fontWeight:600,color:'#CBD5E1'}}>R$ {fmtBRL(subtotal)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,color:'#94A3B8',marginBottom:8,paddingBottom:8,borderBottom:'1px solid rgba(148,163,184,.08)'}}>
                        <span>Desconto</span>
                        <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={e=>setDesconto(e.target.value)} style={{background:'rgba(255,255,255,.05)',border:'1.5px solid rgba(148,163,184,.14)',outline:'none',color:'#F87171',fontSize:13,fontWeight:700,textAlign:'right',width:100,fontFamily:'inherit',borderRadius:8,padding:'4px 8px'}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Total final</span><span style={{fontSize:20,fontWeight:800,color:'#7C3AED'}}>R$ {fmtBRL(total)}</span></div>
                    </div>
                  </div>

                  {/* Resumo mobile */}
                  <div className="resumo-mob" style={{...card,display:'none'}}>
                    <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',marginBottom:12}}>Resumo</p>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748B'}}>Cliente</span><span style={{fontWeight:600,color:clienteNome?'#F8FAFC':'#475569'}}>{clienteNome||'Não informado'}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748B'}}>Total</span><span style={{fontSize:18,fontWeight:800,color:'#7C3AED'}}>R$ {fmtBRL(total)}</span></div>
                    </div>
                  </div>

                  {/* Odontograma */}
                  {isOdonto&&(
                    <div style={card}>
                      <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:12}}>🦷 Odontograma</p>
                      {[DENTES_SUPERIOR,DENTES_INFERIOR].map((arco,ai)=>(
                        <div key={ai} style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                          {arco.slice(0,arco.length/2).map(n=><button key={n} onClick={()=>toggleDente(n)} style={{width:32,height:32,borderRadius:6,border:`1.5px solid ${dentesSelec.includes(n)?'#7C3AED':'rgba(148,163,184,.18)'}`,background:dentesSelec.includes(n)?'rgba(124,58,237,.25)':'rgba(255,255,255,.04)',color:dentesSelec.includes(n)?'#C4B5FD':'#64748B',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{n}</button>)}
                          <div style={{width:1,background:'rgba(148,163,184,.14)',margin:'0 4px'}}/>
                          {arco.slice(arco.length/2).map(n=><button key={n} onClick={()=>toggleDente(n)} style={{width:32,height:32,borderRadius:6,border:`1.5px solid ${dentesSelec.includes(n)?'#7C3AED':'rgba(148,163,184,.18)'}`,background:dentesSelec.includes(n)?'rgba(124,58,237,.25)':'rgba(255,255,255,.04)',color:dentesSelec.includes(n)?'#C4B5FD':'#64748B',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{n}</button>)}
                        </div>
                      ))}
                      {dentesSelec.length>0&&<p style={{fontSize:12,color:'#A78BFA',marginBottom:10}}>Dentes: {dentesSelec.sort((a,b)=>a-b).join(', ')}</p>}
                      <div className="grid2" style={{marginBottom:10}}>
                        <div><label style={lbl}>Procedimento</label><input style={inp} type="text" placeholder="Ex: Restauração" value={procNome} onChange={e=>setProcNome(e.target.value)}/></div>
                        <div><label style={lbl}>Valor</label><input style={inp} type="number" placeholder="0,00" value={procValor} onChange={e=>setProcValor(e.target.value)}/></div>
                      </div>
                      <button onClick={adicionarProcOdonto} disabled={!procNome||dentesSelec.length===0} style={{border:'1.5px dashed rgba(148,163,184,.18)',borderRadius:10,padding:10,background:'transparent',color:'#64748B',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%',marginBottom:10}}>+ Adicionar procedimento</button>
                      {procOdonto.map((p,i)=>(
                        <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(148,163,184,.10)',borderRadius:10,padding:'10px 12px',display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <span style={{fontSize:13,color:'#CBD5E1'}}>{p.dente?`Dente ${p.dente} — `:''}  {p.nome} · {p.status}</span>
                          <div style={{display:'flex',gap:8}}><span style={{fontSize:13,color:'#22C55E',fontWeight:700}}>R$ {fmtBRL(parseFloat(p.valor||'0'))}</span><button onClick={()=>setProcOdonto(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:16}}>×</button></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accordion pagamento */}
                  <div style={{...card,padding:0,overflow:'hidden'}}>
                    <div className="acc-hdr" onClick={()=>setShowPagSection(!showPagSection)}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span>💳</span>
                        <div><p style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Pagamento</p><p style={{fontSize:12,color:'#64748B',marginTop:1}}>{valorPagoLocal>0?`Pago: R$ ${fmtBRL(valorPagoLocal)} · Saldo: R$ ${fmtBRL(saldoLocal)}`:'Entrada, pagamentos parciais e link de cobrança.'}</p></div>
                      </div>
                      <span style={{color:'#64748B',fontSize:18,transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                    </div>
                    {showPagSection&&(
                      <div style={{padding:'0 22px 20px',borderTop:'1px solid rgba(148,163,184,.08)'}}>
                        <div className="grid3" style={{margin:'16px 0'}}>
                          {[{l:'Total',v:total,c:'#F8FAFC'},{l:'Pago',v:valorPagoLocal,c:'#22C55E'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#FACC15':'#22C55E'}].map(f=>(
                            <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:10,border:'1px solid rgba(148,163,184,.10)'}}>
                              <p style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{f.l}</p>
                              <p style={{fontSize:15,fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                            </div>
                          ))}
                        </div>
                        {/* Sinal */}
                        <div style={{marginBottom:14}}>
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:exigirSinal?12:0}}>
                            <button onClick={()=>setExigirSinal(!exigirSinal)} style={{width:36,height:20,borderRadius:999,border:'none',cursor:'pointer',position:'relative',background:exigirSinal?'#22C55E':'rgba(255,255,255,.15)'}}>
                              <span style={{position:'absolute',top:2,left:exigirSinal?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                            </button>
                            <span style={{fontSize:13,color:'#CBD5E1',cursor:'pointer'}} onClick={()=>setExigirSinal(!exigirSinal)}>Exigir entrada/sinal?</span>
                          </div>
                          {exigirSinal&&(
                            <div style={{background:'rgba(255,255,255,.04)',borderRadius:12,padding:14,border:'1px solid rgba(148,163,184,.10)',display:'flex',flexDirection:'column',gap:10}}>
                              <div className="grid2">
                                <div><label style={lbl}>Tipo</label><select style={sel} value={sinalTipo} onChange={e=>setSinalTipo(e.target.value)}><option value="fixo">Valor fixo (R$)</option><option value="percentual">Porcentagem (%)</option></select></div>
                                <div><label style={lbl}>{sinalTipo==='fixo'?'Valor (R$)':'Percentual (%)'}</label><input style={inp} type="number" min="0" placeholder={sinalTipo==='fixo'?'0,00':'50'} value={sinalValor} onChange={e=>setSinalValor(e.target.value)}/></div>
                              </div>
                              {sinalValor&&<div style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.25)',borderRadius:10,padding:'10px 14px'}}><span style={{fontSize:13,color:'#22C55E',fontWeight:700}}>Entrada: R$ {fmtBRL(sinalTipo==='fixo'?parseFloat(sinalValor||'0'):(total*parseFloat(sinalValor||'0'))/100)}</span></div>}
                            </div>
                          )}
                        </div>
                        {/* Link pag */}
                        <div style={{marginBottom:14}}>
                          <label style={lbl}>Link de pagamento</label>
                          <input style={inp} type="url" placeholder="Cole aqui o link do Mercado Pago, Asaas, PagSeguro..." value={linkPag} onChange={e=>setLinkPag(e.target.value)}/>
                          <p style={{fontSize:11,color:'#475569',marginTop:5}}>O ClienteMarcado apenas organiza a cobrança. O pagamento é feito pelo link do seu negócio.</p>
                        </div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                          <button onClick={()=>navigator.clipboard.writeText(gerarMsgCobranca())} style={{background:'rgba(255,255,255,.05)',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>📋 Copiar mensagem</button>
                          <button onClick={enviarCobrancaWpp} disabled={!clienteWpp} style={{background:'rgba(34,197,94,.10)',border:'1.5px solid rgba(34,197,94,.22)',borderRadius:10,padding:'8px 14px',fontSize:12,fontWeight:600,color:'#22C55E',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}>💬 Enviar pelo WhatsApp</button>
                        </div>
                        <div style={{marginBottom:14}}>
                          <label style={lbl}>Observações de pagamento</label>
                          <input style={inp} type="text" placeholder="Ex: cliente pagou R$ 100 de entrada em dinheiro" value={obsPagamento} onChange={e=>setObsPagamento(e.target.value)}/>
                        </div>
                        {/* Histórico de pagamentos */}
                        <div style={{borderTop:'1px solid rgba(148,163,184,.08)',paddingTop:14}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                            <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC'}}>Pagamentos registrados</p>
                            <button onClick={()=>{setShowHpForm(!showHpForm);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')}} style={{background:'rgba(124,58,237,.12)',border:'1.5px solid rgba(124,58,237,.25)',borderRadius:8,padding:'5px 12px',fontSize:12,fontWeight:700,color:'#C4B5FD',cursor:'pointer',fontFamily:'inherit'}}>+ Registrar</button>
                          </div>
                          {showHpForm&&(
                            <div style={{background:'rgba(124,58,237,.08)',border:'1.5px solid rgba(124,58,237,.22)',borderRadius:14,padding:16,marginBottom:12}}>
                              <p style={{fontSize:13,fontWeight:700,color:'#C4B5FD',marginBottom:12}}>{editandoPagIdx!==null?'Editar':'Registrar pagamento'}</p>
                              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                                <div className="grid2">
                                  <div><label style={lbl}>Valor *</label><div style={{position:'relative'}}><span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#64748B',fontWeight:600}}>R$</span><input style={{...inp,paddingLeft:32}} type="text" inputMode="numeric" placeholder="0,00" value={hpValor} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,'');setHpValor(fmtHpValor(v||'0'))}}/></div></div>
                                  <div><label style={lbl}>Data *</label><input style={inp} type="date" value={hpData} onChange={e=>setHpData(e.target.value)}/></div>
                                </div>
                                <div><label style={lbl}>Forma *</label><select style={sel} value={hpForma} onChange={e=>{setHpForma(e.target.value);if(e.target.value!=='Outro')setHpFormaOutro('')}}>{['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}</select>{hpForma==='Outro'&&<input style={{...inp,marginTop:6}} type="text" placeholder="Especifique..." value={hpFormaOutro} onChange={e=>setHpFormaOutro(e.target.value)}/>}</div>
                                <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada, parcela 2..." value={hpObs} onChange={e=>setHpObs(e.target.value)}/></div>
                                <div style={{display:'flex',gap:8}}>
                                  <button onClick={()=>{setShowHpForm(false);setEditandoPagIdx(null)}} className="btn-s" style={{flex:1}}>Cancelar</button>
                                  <button onClick={salvarHpPag} className="btn-p" style={{flex:2,height:44,fontSize:13}}>{editandoPagIdx!==null?'Atualizar':'Salvar'}</button>
                                </div>
                              </div>
                            </div>
                          )}
                          {histPags.length===0&&!showHpForm&&<p style={{fontSize:12,color:'#475569'}}>Nenhum pagamento registrado ainda.</p>}
                          {histPags.map((p,i)=>(
                            <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(148,163,184,.10)',borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}}>
                              <div>
                                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}><span style={{fontSize:14,fontWeight:800,color:'#22C55E'}}>R$ {fmtBRL(p.valor)}</span><span style={{fontSize:11,color:'#64748B'}}>{p.forma}</span><span style={{fontSize:11,color:'#475569'}}>· {fmtData(p.data)}</span></div>
                                {p.obs&&<p style={{fontSize:12,color:'#475569'}}>{p.obs}</p>}
                              </div>
                              <div style={{display:'flex',gap:6}}>
                                <button onClick={()=>editarHpPag(i)} style={{background:'rgba(255,255,255,.05)',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                                <button onClick={()=>excluirHpPag(i)} style={{background:'rgba(239,68,68,.08)',border:'1.5px solid rgba(239,68,68,.20)',borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                              </div>
                            </div>
                          ))}
                          {histPags.length>0&&<div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.20)',borderRadius:10,padding:'8px 14px',display:'flex',justifyContent:'space-between',marginTop:4}}><span style={{fontSize:13,color:'#64748B',fontWeight:600}}>Total pago</span><span style={{fontSize:14,fontWeight:800,color:'#22C55E'}}>R$ {fmtBRL(valorPagoLocal)}</span></div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion observações */}
                  <div style={{...card,padding:0,overflow:'hidden'}}>
                    <div className="acc-hdr" onClick={()=>setShowObs(!showObs)}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span>📝</span>
                        <div><p style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Observações</p><p style={{fontSize:12,color:'#64748B',marginTop:1}}>Informações extras para o cliente ou sua equipe.</p></div>
                      </div>
                      <span style={{color:'#64748B',fontSize:18,transform:showObs?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                    </div>
                    {showObs&&(
                      <div style={{padding:'0 22px 20px',borderTop:'1px solid rgba(148,163,184,.08)',display:'flex',flexDirection:'column',gap:12,marginTop:16}}>
                        <div><label style={lbl}>Observação do cliente</label><textarea style={{...inp,height:'auto',padding:'10px 14px',resize:'none',lineHeight:1.5}} rows={2} placeholder="Alergias, preferências..." value={clienteObs} onChange={e=>setClienteObs(e.target.value)}/></div>
                        <div><label style={lbl}>Observações do orçamento</label><textarea style={{...inp,height:'auto',padding:'10px 14px',resize:'none',lineHeight:1.5}} rows={3} placeholder="Informações adicionais..." value={observacoes} onChange={e=>setObservacoes(e.target.value)}/></div>
                      </div>
                    )}
                  </div>

                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',background:'rgba(124,58,237,.08)',borderRadius:12,border:'1px solid rgba(124,58,237,.18)'}}>
                    <span>💡</span>
                    <p style={{fontSize:12,color:'#A78BFA'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>
                  </div>
                </div>

                {/* Mobile footer */}
                <div className="mob-footer">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                    <span style={{fontSize:12,color:'#64748B',fontWeight:600}}>Total final</span>
                    <span style={{fontSize:18,fontWeight:800,color:'#7C3AED'}}>R$ {fmtBRL(total)}</span>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>{resetForm();setView('lista')}} className="btn-s" style={{flex:1}}>Rascunho</button>
                    <button onClick={handleSalvar} className="btn-p" style={{flex:2,height:48,fontSize:15}}>{editandoId?'Salvar':'Criar orçamento'}</button>
                  </div>
                  <button onClick={enviarCobrancaWpp} disabled={!clienteWpp} style={{width:'100%',background:'rgba(34,197,94,.12)',color:'#22C55E',border:'1.5px solid rgba(34,197,94,.25)',borderRadius:12,padding:11,fontSize:13,fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.6}}>💬 Enviar no WhatsApp</button>
                </div>

                {/* Coluna direita */}
                <div className="form-right" style={{position:'sticky',top:24}}>
                  <div style={card}>
                    <p style={{fontSize:12,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>Resumo</p>
                    <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
                      <div><p style={lbl}>Cliente</p><p style={{fontSize:14,fontWeight:600,color:clienteNome?'#F8FAFC':'#475569'}}>{clienteNome||'Não informado'}</p></div>
                      <div><p style={lbl}>Tipo</p><p style={{fontSize:14,color:'#CBD5E1'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</p></div>
                      <div style={{height:1,background:'rgba(148,163,184,.08)'}}/>
                      <div><p style={lbl}>Total final</p><p style={{fontSize:28,fontWeight:800,color:'#7C3AED',letterSpacing:'-0.02em'}}>R$ {fmtBRL(total)}</p></div>
                      {valorPagoLocal>0&&<div><p style={lbl}>Valor pago</p><p style={{fontSize:18,fontWeight:700,color:'#22C55E'}}>R$ {fmtBRL(valorPagoLocal)}</p></div>}
                      {saldoLocal>0&&<div><p style={lbl}>Saldo restante</p><p style={{fontSize:18,fontWeight:700,color:'#FACC15'}}>R$ {fmtBRL(saldoLocal)}</p></div>}
                      <div><p style={lbl}>Status</p><span style={badge(status)}>{status}</span></div>
                    </div>
                    <button onClick={handleSalvar} className="btn-p" style={{width:'100%',justifyContent:'center',marginBottom:8,height:48,fontSize:14}}>📄 {editandoId?'Salvar alterações':'Criar orçamento'}</button>
                    <button onClick={enviarCobrancaWpp} disabled={!clienteWpp} style={{width:'100%',background:'rgba(34,197,94,.12)',color:'#22C55E',border:'1.5px solid rgba(34,197,94,.25)',borderRadius:12,padding:11,fontSize:13,fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',marginBottom:8,opacity:clienteWpp?1:0.6,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>💬 Enviar no WhatsApp</button>
                    <button onClick={()=>{resetForm();setView('lista')}} className="btn-s" style={{width:'100%',justifyContent:'center'}}>📄 Salvar como rascunho</button>
                    <div style={{marginTop:16,display:'flex',alignItems:'center',gap:8,padding:10,background:'rgba(255,255,255,.03)',borderRadius:10,border:'1px solid rgba(148,163,184,.08)'}}>
                      <span>🔒</span>
                      <div><p style={{fontSize:12,fontWeight:600,color:'#F8FAFC'}}>Seus dados estão seguros</p><p style={{fontSize:11,color:'#475569'}}>e protegidos com criptografia.</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ DETALHE ══ */}
          {view==='detalhe'&&orcDetalhe&&(()=>{
            const orc=orcDetalhe
            return(
              <div style={{animation:'fadeIn .2s ease',maxWidth:900}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
                  <button onClick={()=>{setView('lista');setShowPagForm(false)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#64748B',fontFamily:'inherit'}}>← Voltar</button>
                  <h2 style={{fontSize:20,fontWeight:800,color:'#F8FAFC'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                  <span style={badge(orc.status)}>{orc.status}</span>
                </div>
                {msg&&<div style={{fontSize:13,padding:'10px 14px',borderRadius:10,marginBottom:14,background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.25)',color:'#22C55E'}}>{msg}</div>}

                <div style={card}>
                  <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:14}}>📊 Resumo financeiro</p>
                  <div className="grid3" style={{marginBottom:14}}>
                    {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FACC15':'#22C55E'}].map(f=>(
                      <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:12,padding:14,border:'1px solid rgba(148,163,184,.10)'}}>
                        <p style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{f.l}</p>
                        <p style={{fontSize:20,fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button onClick={()=>setShowPagForm(!showPagForm)} className="btn-p" style={{height:38,padding:'0 16px',fontSize:12}}>+ Registrar pagamento</button>
                    <button onClick={()=>gerarPDF(orc)} className="btn-s" style={{height:38,padding:'0 14px',fontSize:12}}>PDF</button>
                    <button onClick={()=>enviarWpp(orc)} style={{height:38,padding:'0 14px',background:'rgba(34,197,94,.12)',border:'1.5px solid rgba(34,197,94,.25)',borderRadius:10,fontSize:12,fontWeight:600,color:'#22C55E',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                    {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} className="btn-s" style={{height:38,padding:'0 14px',fontSize:12}}>Copiar link</button>}
                    <button onClick={()=>abrirEditar(orc)} className="btn-s" style={{height:38,padding:'0 14px',fontSize:12}}>Editar</button>
                  </div>
                  {showPagForm&&(
                    <div style={{marginTop:14,background:'rgba(124,58,237,.08)',border:'1.5px solid rgba(124,58,237,.22)',borderRadius:14,padding:16}}>
                      <p style={{fontSize:13,fontWeight:700,color:'#C4B5FD',marginBottom:12}}>Registrar pagamento</p>
                      <div className="grid2" style={{marginBottom:10}}>
                        <div><label style={lbl}>Data</label><input type="date" value={pagData} onChange={e=>setPagData(e.target.value)} style={inp}/></div>
                        <div><label style={lbl}>Valor (R$)</label><input type="number" placeholder="0,00" value={pagValor} onChange={e=>setPagValor(e.target.value)} style={inp}/></div>
                      </div>
                      <div style={{marginBottom:10}}><label style={lbl}>Forma</label><select value={pagForma} onChange={e=>setPagForma(e.target.value)} style={sel}>{['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}</select></div>
                      <div style={{marginBottom:12}}><label style={lbl}>Observação</label><input type="text" placeholder="Opcional" value={pagObs} onChange={e=>setPagObs(e.target.value)} style={inp}/></div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>setShowPagForm(false)} className="btn-s" style={{flex:1}}>Cancelar</button>
                        <button disabled={savingPag} onClick={()=>handleRegistrarPagamento(orc)} className="btn-p" style={{flex:2,height:44,fontSize:13}}>{savingPag?'Salvando...':'Confirmar pagamento'}</button>
                      </div>
                    </div>
                  )}
                </div>

                {orc.servicos?.length>0&&(
                  <div style={card}>
                    <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:12}}>🛎 Serviços</p>
                    {(orc.servicos||[]).map((s:any,i:number)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(148,163,184,.08)'}}>
                        <div><p style={{fontSize:13,color:'#F8FAFC',fontWeight:600}}>{s.nome}</p><p style={{fontSize:11,color:'#475569'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                        <span style={{fontSize:14,fontWeight:800,color:'#22C55E'}}>R$ {fmtBRL(s.total||0)}</span>
                      </div>
                    ))}
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:800,paddingTop:10,marginTop:4}}><span style={{color:'#F8FAFC'}}>Total</span><span style={{color:'#7C3AED'}}>R$ {fmtBRL(orc.total)}</span></div>
                  </div>
                )}

                <div style={card}>
                  <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:12}}>📜 Histórico de pagamentos</p>
                  {pagamentos.length===0?<p style={{fontSize:13,color:'#475569'}}>Nenhum pagamento registrado.</p>
                  :pagamentos.map((p,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(148,163,184,.08)'}}>
                      <div><p style={{fontSize:13,color:'#F8FAFC',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.observacao&&<p style={{fontSize:11,color:'#475569'}}>{p.observacao}</p>}</div>
                      <span style={{fontSize:14,fontWeight:800,color:'#22C55E'}}>R$ {fmtBRL(p.valor)}</span>
                    </div>
                  ))}
                </div>

                <div style={card}>
                  <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC',marginBottom:10}}>👤 Cliente</p>
                  <p style={{fontSize:14,fontWeight:600,color:'#F8FAFC',marginBottom:4}}>{orc.cliente_nome}</p>
                  {orc.cliente_whatsapp&&<p style={{fontSize:13,color:'#64748B',marginBottom:2}}>📱 {maskTel(orc.cliente_whatsapp)}</p>}
                  {orc.cliente_email&&<p style={{fontSize:13,color:'#64748B'}}>✉️ {orc.cliente_email}</p>}
                  {orc.observacoes&&<p style={{fontSize:13,color:'#475569',marginTop:8}}>{orc.observacoes}</p>}
                </div>
              </div>
            )
          })()}

        </div></div>
      </div>
    </div>
  )
}
