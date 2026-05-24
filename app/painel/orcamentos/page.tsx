'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_COR: Record<string, { bg: string; color: string; border: string }> = {
  'Aberto':               { bg:'#EFF6FF', color:'#2563EB', border:'#BFDBFE' },
  'Aguardando aprovação': { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
  'Em andamento':         { bg:'#F5F3FF', color:'#7C3AED', border:'#DDD6FE' },
  'Parcialmente pago':    { bg:'#FFF7ED', color:'#EA580C', border:'#FED7AA' },
  'Pago':                 { bg:'#F0FDF4', color:'#16A34A', border:'#BBF7D0' },
  'Finalizado':           { bg:'#F0FDF4', color:'#15803D', border:'#86EFAC' },
  'Cancelado':            { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
}
const STATUS_ACCENT: Record<string, string> = {
  'Aberto':'#2563EB','Aguardando aprovação':'#D97706','Em andamento':'#7C3AED',
  'Parcialmente pago':'#EA580C','Pago':'#16A34A','Finalizado':'#15803D','Cancelado':'#DC2626',
}

function fmtBRL(v: number) { return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2}) }
function fmtData(d: string) { if(!d) return ''; const [a,m,di]=d.split('-'); return `${di}/${m}/${a}` }
function aplicarMascaraTel(v: string) {
  const n=v.replace(/\D/g,'').slice(0,11)
  if(n.length>10) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if(n.length>6)  return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if(n.length>2)  return `(${n.slice(0,2)}) ${n.slice(2)}`
  if(n.length>0)  return `(${n}`
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

  // Pagamento form (detalhe)
  const [pagData,setPagData]=useState(new Date().toISOString().split('T')[0])
  const [pagValor,setPagValor]=useState('')
  const [pagForma,setPagForma]=useState('Pix')
  const [pagObs,setPagObs]=useState('')
  const [showPagForm,setShowPagForm]=useState(false)

  // UI toggles
  const [showDetalhes,setShowDetalhes]=useState(false)
  const [showDesconto,setShowDesconto]=useState(false)
  const [showPagSection,setShowPagSection]=useState(false)
  const [showObs,setShowObs]=useState(false)
  const [showLinkPag,setShowLinkPag]=useState(false)
  const [showSinal,setShowSinal]=useState(false)

  // Hist pagamentos (form)
  const [histPags,setHistPags]=useState<any[]>([])
  const [editandoPagIdx,setEditandoPagIdx]=useState<number|null>(null)
  const [hpValor,setHpValor]=useState('')
  const [hpForma,setHpForma]=useState('Pix')
  const [hpFormaOutro,setHpFormaOutro]=useState('')
  const [hpData,setHpData]=useState(new Date().toISOString().split('T')[0])
  const [hpObs,setHpObs]=useState('')
  const [showHpForm,setShowHpForm]=useState(false)

  useEffect(()=>{init()},[])

  async function init() {
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

  async function carregarOrcamentos(uid?:string) {
    const id=uid||userId
    const {data}=await supabase.from('orcamentos').select('*').eq('user_id',id).order('created_at',{ascending:false})
    setOrcamentos(data||[])
  }

  async function carregarPagamentos(orcId:string) {
    const {data}=await supabase.from('orcamento_pagamentos').select('*').eq('orcamento_id',orcId).order('data',{ascending:false})
    setPagamentos(data||[])
  }

  const subtotal=itens.reduce((a,i)=>a+(parseFloat(i.unitario||'0')*(parseInt(i.qtd)||1)),0)+procOdonto.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const descontoNum=parseFloat(desconto||'0')
  const total=Math.max(0,subtotal-descontoNum)
  const valorPagoLocal=histPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const saldoLocal=Math.max(0,total-valorPagoLocal)

  function atualizarItem(idx:number,campo:string,val:any) {
    setItens(prev=>{
      const n=[...prev]; n[idx]={...n[idx],[campo]:val}
      if(campo==='unitario'||campo==='qtd') n[idx].total=parseFloat(n[idx].unitario||'0')*(parseInt(n[idx].qtd)||1)
      return n
    })
  }

  function resetForm() {
    setClienteNome('');setClienteWpp('');setClienteEmail('');setClienteObs('')
    setTipo('Orçamento');setTipoOutro('');setTipoDescricao('')
    setProfId('');setProfNome('');setSalvarFreelancer(false)
    setDataDoc(new Date().toISOString().split('T')[0]);setStatus('Aberto')
    setItens([{nome:'',qtd:1,unitario:'',total:0,obs:''}])
    setDesconto('');setExigirSinal(false);setSinalTipo('fixo');setSinalValor('')
    setLinkPag('');setObsPagamento('');setObservacoes('')
    setHistPags([]);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpObs('')
    setDentesSelec([]);setProcOdonto([])
    setShowDetalhes(false);setShowDesconto(false);setShowPagSection(false);setShowObs(false)
    setShowLinkPag(false);setShowSinal(false);setShowHpForm(false);setShowPagForm(false)
    setEditandoId(null)
  }

  function abrirEditar(orc:any) {
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

  async function handleSalvar() {
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
      const{error}=await supabase.from('orcamentos').update(payload).eq('id',editandoId)
      if(error){setMensagem('Erro ao salvar. Tente novamente.');return}
    } else {
      const{error}=await supabase.from('orcamentos').insert(payload)
      if(error){setMensagem('Erro ao criar orçamento. Tente novamente.');return}
    }
    if(profId==='__outro__'&&profNome.trim()&&salvarFreelancer) {
      await supabase.from('profissionais').insert({user_id:userId,nome:profNome.trim(),especialidade:'Freelancer'})
      const{data:profs}=await supabase.from('profissionais').select('id,nome').eq('user_id',userId)
      setProfissionais(profs||[])
    }
    resetForm();setView('lista');await carregarOrcamentos()
    setMensagem(editandoId?'Orçamento atualizado!':'Orçamento criado com sucesso!')
    setTimeout(()=>setMensagem(''),4000)
  }

  async function handleExcluir(id:string) {
    if(!window.confirm('Excluir este orçamento?')) return
    await supabase.from('orcamentos').delete().eq('id',id)
    await carregarOrcamentos()
  }

  async function handleRegistrarPagamento(orc:any) {
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
    const{data}=await supabase.from('orcamentos').select('*').eq('id',orc.id).single()
    if(data) setOrcamentos(prev=>prev.map(o=>o.id===orc.id?data:o))
    setMensagem('Pagamento registrado!');setTimeout(()=>setMensagem(''),3000)
  }

  function enviarWpp(orc:any) {
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'')
    if(!tel) return
    let msg=`Olá, ${orc.cliente_nome}. Tudo bem?\n\nSegue o resumo:\n\nTipo: ${orc.tipo}\nTotal: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}`
    if(orc.link_pagamento) msg+=`\n\nLink de pagamento:\n${orc.link_pagamento}`
    msg+=`\n\nApós pagar, envie o comprovante por aqui. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }

  function gerarPDF(orc:any) {
    const win=window.open('','_blank'); if(!win) return
    const linhasServicos=(orc.servicos||[]).map((s:any)=>`<tr><td>${s.nome}</td><td style="text-align:center">${s.qtd||1}</td><td style="text-align:right">R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td style="text-align:right">R$ ${fmtBRL(s.total||0)}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo} - ${orc.cliente_nome}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px;color:#1a1a1a}h1{font-size:22px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:6px 8px;background:#f5f5f5}td{padding:6px 8px;border-bottom:1px solid #f0f0f0}.footer{margin-top:40px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:16px}</style>
</head><body><h1>${perfil?.nome_negocio||'Negócio'}</h1><p>${orc.tipo} · ${fmtData(orc.data)}</p><hr/>
<p><strong>${orc.cliente_nome}</strong> · ${orc.cliente_whatsapp||''}</p>
<table><thead><tr><th>Item</th><th>Qtd</th><th style="text-align:right">Unitário</th><th style="text-align:right">Total</th></tr></thead><tbody>${linhasServicos}
<tr><td colspan="3" style="text-align:right"><strong>Total</strong></td><td style="text-align:right"><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr>
<tr><td colspan="3" style="text-align:right">Pago</td><td style="text-align:right;color:green">R$ ${fmtBRL(orc.valor_pago)}</td></tr>
<tr><td colspan="3" style="text-align:right">Saldo</td><td style="text-align:right;color:red">R$ ${fmtBRL(orc.saldo_restante)}</td></tr>
</tbody></table>
<div class="footer">Documento gerado pelo ClienteMarcado</div></body></html>`)
    win.document.close();setTimeout(()=>win.print(),500)
  }

  function gerarMensagemCobranca() {
    const tipoDoc=tipo==='__outro__'?tipoOutro:tipo
    const neg=perfil?.nome_negocio||'nosso negócio'
    let msg=`Olá, ${clienteNome||'cliente'}! Aqui é d${neg.match(/^[aeiouAEIOU]/)?'a ':'o '}${neg}.\n\nSeu ${tipoDoc} ficou no valor de R$ ${fmtBRL(total)}.\nValor pago: R$ ${fmtBRL(valorPagoLocal)}.\nSaldo restante: R$ ${fmtBRL(saldoLocal)}.`
    if(linkPag) msg+=`\n\nLink para pagamento:\n${linkPag}`
    msg+=`\n\nApós pagar, envie o comprovante por aqui. Obrigado!`
    return msg
  }

  function enviarCobrancaWpp() {
    const tel=clienteWpp.replace(/\D/g,''); if(!tel) return
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(gerarMensagemCobranca()),'_blank')
  }

  function fmtHpValor(raw:string) {
    const nums=raw.replace(/\D/g,''); if(!nums) return ''
    return (parseInt(nums,10)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})
  }
  function parseHpValor(v:string){return parseFloat(v.replace(/\./g,'').replace(',','.'))||0}

  function salvarHpPag() {
    const valor=parseHpValor(hpValor)
    if(!valor||valor<=0){setMensagem('Informe um valor maior que R$ 0,00.');return}
    if(hpForma==='Outro'&&!hpFormaOutro.trim()){setMensagem('Especifique a forma de pagamento.');return}
    const forma=hpForma==='Outro'?hpFormaOutro.trim():hpForma
    const novoPag={valor,forma,data:hpData,obs:hpObs.trim()||''}
    if(editandoPagIdx!==null){setHistPags(prev=>prev.map((p,i)=>i===editandoPagIdx?novoPag:p));setEditandoPagIdx(null)}
    else setHistPags(prev=>[...prev,novoPag])
    setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')
    setShowHpForm(false)
  }

  function editarHpPag(idx:number) {
    const p=histPags[idx]
    const formasPadrao=['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento']
    setEditandoPagIdx(idx);setHpValor(fmtHpValor(String(Math.round(p.valor*100))))
    setHpForma(formasPadrao.includes(p.forma)?p.forma:'Outro')
    setHpFormaOutro(formasPadrao.includes(p.forma)?'':p.forma)
    setHpData(p.data);setHpObs(p.obs||'');setShowHpForm(true)
  }

  function excluirHpPag(idx:number) {
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

  // Styles
  const G='#F5F7FB'
  const inp:React.CSSProperties={width:'100%',border:'1.5px solid #E5E7EB',borderRadius:'10px',padding:'11px 14px',fontSize:'15px',color:'#111827',outline:'none',fontFamily:'inherit',background:'#fff',boxSizing:'border-box'}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:600,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:'6px'}
  const card:React.CSSProperties={background:'#fff',borderRadius:'16px',padding:'20px 22px',marginBottom:'14px',boxShadow:'0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)',border:'1px solid #F3F4F6'}
  const cardTitle:React.CSSProperties={fontSize:'14px',fontWeight:800,color:'#111827',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}
  const accordion=(open:boolean):React.CSSProperties=>({background:'#fff',borderRadius:'14px',marginBottom:'10px',boxShadow:'0 1px 3px rgba(0,0,0,.05)',border:'1px solid #F3F4F6',overflow:'hidden'})
  const accHeader:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',cursor:'pointer',userSelect:'none'}
  const pillBtn=(active:boolean):React.CSSProperties=>({background:active?'#EFF6FF':'#F9FAFB',border:`1.5px solid ${active?'#BFDBFE':'#E5E7EB'}`,borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:active?'#2563EB':'#6B7280',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'})

  if(loading) return <div style={{minHeight:'100vh',background:G,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#9CA3AF'}}>Carregando...</p></div>

  return (
    <div style={{minHeight:'100vh',background:G,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      {/* Nav */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',height:'56px',background:'#fff',borderBottom:'1px solid #F3F4F6',position:'sticky',top:0,zIndex:20,boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
        <span style={{fontSize:'15px',fontWeight:800,color:'#111827',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
        <Link href="/painel" style={{fontSize:'13px',color:'#6B7280',textDecoration:'none',fontWeight:500}}>← Voltar ao painel</Link>
      </nav>

      <div style={{maxWidth:'1180px',margin:'0 auto',padding:'24px 16px 60px'}}>

        {/* ══ LISTA ══ */}
        {view==='lista' && (<>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',gap:'12px',flexWrap:'wrap'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#111827',letterSpacing:'-0.02em',marginBottom:'4px'}}>Orçamentos e Cobranças</h1>
              <p style={{fontSize:'14px',color:'#6B7280'}}>Crie orçamentos, acompanhe pagamentos e envie pelo WhatsApp.</p>
            </div>
            <button onClick={()=>{resetForm();setView('form')}}
              style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'11px 20px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 14px rgba(37,99,235,.3)'}}>
              + Novo orçamento
            </button>
          </div>

          {/* Métricas */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px',marginBottom:'24px'}}>
            {[
              {label:'Orçamentos em aberto',valor:totalAberto,cor:'#2563EB',fmt:'n'},
              {label:'Total a receber',valor:totalAReceber,cor:'#D97706',fmt:'brl'},
              {label:'Recebido no mês',valor:recebidoMes,cor:'#16A34A',fmt:'brl'},
              {label:'Pagamentos parciais',valor:parciais,cor:'#EA580C',fmt:'n'},
            ].map(m=>(
              <div key={m.label} style={{background:'#fff',borderRadius:'14px',padding:'18px',border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,.05)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:m.cor,borderRadius:'14px 14px 0 0'}} />
                <p style={{fontSize:'11px',fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>{m.label}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em'}}>{m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px',alignItems:'center'}}>
            {STATUS_LIST.map(s=>(
              <button key={s} onClick={()=>setFiltroStatus(s)}
                style={{padding:'6px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1.5px solid',fontFamily:'inherit',background:filtroStatus===s?'#2563EB':'#fff',color:filtroStatus===s?'#fff':'#6B7280',borderColor:filtroStatus===s?'#2563EB':'#E5E7EB'}}>
                {s}
              </button>
            ))}
            <input type="text" placeholder="Buscar cliente, contato ou serviço..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
              style={{border:'1.5px solid #E5E7EB',borderRadius:'10px',padding:'7px 14px',fontSize:'13px',color:'#111827',outline:'none',fontFamily:'inherit',background:'#fff',width:'280px'}} />
          </div>

          {mensagem&&<div style={{padding:'10px 14px',borderRadius:'10px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A',fontSize:'13px'}}>{mensagem}</div>}

          {/* Lista vazia */}
          {orcsFiltrados.length===0?(
            <div style={{background:'#fff',borderRadius:'16px',padding:'48px 24px',textAlign:'center',border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>📋</div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#111827',marginBottom:'6px'}}>Nenhum orçamento criado ainda</p>
              <p style={{fontSize:'14px',color:'#9CA3AF',marginBottom:'20px'}}>Crie seu primeiro orçamento e acompanhe pagamentos em poucos cliques.</p>
              <button onClick={()=>{resetForm();setView('form')}}
                style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',padding:'11px 24px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Criar orçamento
              </button>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {orcsFiltrados.map(orc=>{
                const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                const acc=STATUS_ACCENT[orc.status]||'#2563EB'
                return (
                  <div key={orc.id} style={{background:'#fff',borderRadius:'14px',border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,.05)',overflow:'hidden'}}>
                    <div style={{height:'3px',background:acc}} />
                    <div style={{padding:'16px 18px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'10px'}}>
                        <div>
                          <p style={{fontSize:'15px',fontWeight:800,color:'#111827',marginBottom:'3px'}}>{orc.cliente_nome}</p>
                          <p style={{fontSize:'12px',color:'#9CA3AF'}}>{orc.tipo} · {fmtData(orc.data)}{orc.profissional_nome?' · '+orc.profissional_nome:''}</p>
                        </div>
                        <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap'}}>
                          {orc.status}
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                        {[{l:'Total',v:orc.total,c:'#111827'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(
                          <div key={f.l} style={{background:G,borderRadius:'8px',padding:'8px 10px'}}>
                            <p style={{fontSize:'10px',color:'#9CA3AF',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
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
                            style={{padding:'6px 12px',borderRadius:'8px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:'1.5px solid',
                              background:b.primary?'#2563EB':b.green?'#F0FDF4':b.wpp?'#F0FFF4':b.danger?'#FEF2F2':'#F9FAFB',
                              color:b.primary?'#fff':b.green?'#16A34A':b.wpp?'#16A34A':b.danger?'#DC2626':'#6B7280',
                              borderColor:b.primary?'#2563EB':b.green?'#BBF7D0':b.wpp?'#86EFAC':b.danger?'#FECACA':'#E5E7EB'}}>
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
        </>)}

        {/* ══ FORMULÁRIO ══ */}
        {view==='form' && (
          <div style={{maxWidth:'1140px',margin:'0 auto'}}>
            {/* Header */}
            <div style={{marginBottom:'20px'}}>
              <button onClick={()=>{resetForm();setView('lista')}}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#9CA3AF',fontFamily:'inherit',padding:'0',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
                ← Voltar à lista
              </button>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#111827',letterSpacing:'-0.02em'}}>
                {editandoId?'Editar orçamento':'Novo orçamento'}
              </h1>
              <p style={{fontSize:'13px',color:'#9CA3AF',marginTop:'4px'}}>Preencha o essencial e envie para o cliente em poucos segundos.</p>
            </div>

            {mensagem&&(
              <div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'10px',marginBottom:'16px',
                color:mensagem.includes('rro')?'#DC2626':'#16A34A',
                background:mensagem.includes('rro')?'#FEF2F2':'#F0FDF4',
                border:`1px solid ${mensagem.includes('rro')?'#FECACA':'#BBF7D0'}`}}>
                {mensagem}
              </div>
            )}

            {/* Layout 2 colunas */}
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'16px'}}>
              <style>{`@media(min-width:900px){.orc-grid{grid-template-columns:1fr 320px !important}}`}</style>
              <div className="orc-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:'16px'}}>

                {/* Coluna esquerda */}
                <div>
                  {/* CARD: Cliente */}
                  <div style={card}>
                    <p style={cardTitle}>👤 Cliente</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div>
                        <label style={lbl}>Nome *</label>
                        <input style={inp} type="text" placeholder="Nome do cliente"
                          value={clienteNome} onChange={e=>setClienteNome(e.target.value)} />
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        <div>
                          <label style={lbl}>WhatsApp *</label>
                          <input style={inp} type="tel" placeholder="(11) 99999-9999"
                            value={clienteWpp} onChange={e=>setClienteWpp(aplicarMascaraTel(e.target.value))} />
                        </div>
                        <div>
                          <label style={lbl}>E-mail</label>
                          <input style={inp} type="email" placeholder="opcional"
                            value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION: Detalhes do documento */}
                  <div style={accordion(showDetalhes)}>
                    <div style={accHeader} onClick={()=>setShowDetalhes(!showDetalhes)}>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#111827'}}>📋 Detalhes do documento</p>
                        <p style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>Tipo, status, profissional e data</p>
                      </div>
                      <span style={{fontSize:'18px',color:'#9CA3AF',transform:showDetalhes?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                    </div>
                    {showDetalhes&&(
                      <div style={{padding:'0 18px 18px',display:'flex',flexDirection:'column',gap:'12px'}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                          <div>
                            <label style={lbl}>Tipo</label>
                            <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                              {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t=><option key={t} value={t}>{t}</option>)}
                              <option value="__outro__">Outro</option>
                            </select>
                            {tipo==='__outro__'&&(
                              <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'8px'}}>
                                <input style={inp} type="text" placeholder="Nome do tipo (ex: Avaliação)"
                                  value={tipoOutro} onChange={e=>setTipoOutro(e.target.value)} />
                                <input style={inp} type="text" placeholder="Descrição opcional"
                                  value={tipoDescricao} onChange={e=>setTipoDescricao(e.target.value)} />
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
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                          <div>
                            <label style={lbl}>Profissional</label>
                            <select style={sel} value={profId} onChange={e=>{setProfId(e.target.value);if(e.target.value!=='__outro__'){setProfNome('');setSalvarFreelancer(false)}}}>
                              <option value="">Nenhum</option>
                              {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                              <option value="__outro__">✏️ Outro / Não cadastrado</option>
                            </select>
                            {profId==='__outro__'&&(
                              <div style={{marginTop:'8px',padding:'12px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'10px',display:'flex',flexDirection:'column',gap:'8px'}}>
                                <input style={inp} type="text" placeholder="Nome do profissional"
                                  value={profNome} onChange={e=>setProfNome(e.target.value)} />
                                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                  <button onClick={()=>setSalvarFreelancer(!salvarFreelancer)}
                                    style={{width:'32px',height:'18px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:salvarFreelancer?'#2563EB':'#D1D5DB',flexShrink:0}}>
                                    <span style={{position:'absolute',top:'2px',left:salvarFreelancer?'14px':'2px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'left .2s'}} />
                                  </button>
                                  <span style={{fontSize:'12px',color:'#4B5563'}}>Salvar na equipe?</span>
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
                    <p style={cardTitle}>🛎 Serviço</p>
                    {itens.map((item,idx)=>(
                      <div key={idx} style={{background:G,borderRadius:'12px',padding:'14px',marginBottom:'10px',border:'1px solid #F3F4F6'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                          <span style={{fontSize:'11px',fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.06em'}}>Item {idx+1}</span>
                          {itens.length>1&&<button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))} style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer',fontSize:'18px',padding:'0 2px'}}>×</button>}
                        </div>
                        <div style={{marginBottom:'10px'}}>
                          <label style={lbl}>Nome do serviço *</label>
                          <input style={inp} type="text" placeholder="Ex: corte de cabelo, limpeza de pele, troca de óleo"
                            value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)} />
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1.5fr',gap:'8px'}}>
                          <div>
                            <label style={lbl}>Qtd.</label>
                            <input style={{...inp,textAlign:'center'}} type="number" min="1"
                              value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)} />
                          </div>
                          <div>
                            <label style={lbl}>Valor</label>
                            <div style={{position:'relative'}}>
                              <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#9CA3AF',fontWeight:600}}>R$</span>
                              <input style={{...inp,paddingLeft:'36px'}} type="number" min="0" step="0.01" placeholder="0,00"
                                value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <label style={lbl}>Total</label>
                            <div style={{background:'#ECFDF5',border:'1.5px solid #A7F3D0',borderRadius:'10px',padding:'11px 14px'}}>
                              <span style={{fontSize:'15px',fontWeight:800,color:'#059669'}}>R$ {fmtBRL(item.total||0)}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{marginTop:'8px'}}>
                          <input style={{...inp,fontSize:'13px',color:'#6B7280',background:'#fff'}} type="text"
                            placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)} />
                        </div>
                      </div>
                    ))}
                    <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                      style={{width:'100%',border:'1.5px dashed #D1D5DB',borderRadius:'10px',padding:'10px',background:'transparent',color:'#6B7280',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginBottom:'12px'}}>
                      + Adicionar outro serviço
                    </button>
                    {!showDesconto&&(
                      <button onClick={()=>setShowDesconto(true)}
                        style={{background:'none',border:'none',color:'#9CA3AF',fontSize:'12px',cursor:'pointer',fontFamily:'inherit',textDecoration:'underline',padding:'0'}}>
                        + Adicionar desconto
                      </button>
                    )}
                    <div style={{background:G,borderRadius:'12px',padding:'14px',marginTop:'10px',border:'1px solid #F3F4F6'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',padding:'3px 0',color:'#6B7280'}}>
                        <span>Subtotal</span><span style={{fontWeight:700,color:'#111827'}}>R$ {fmtBRL(subtotal)}</span>
                      </div>
                      {showDesconto&&(
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',padding:'6px 0',borderTop:'1px solid #E5E7EB',marginTop:'4px'}}>
                          <span style={{color:'#6B7280'}}>Desconto (R$)</span>
                          <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto}
                            onChange={e=>setDesconto(e.target.value)}
                            style={{background:'transparent',border:'none',outline:'none',color:'#EF4444',fontSize:'13px',fontWeight:700,textAlign:'right',width:'90px',fontFamily:'inherit'}} />
                        </div>
                      )}
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'17px',fontWeight:800,padding:'8px 0 0',borderTop:'1px solid #E5E7EB',marginTop:'4px'}}>
                        <span style={{color:'#111827'}}>Total</span>
                        <span style={{color:'#059669'}}>R$ {fmtBRL(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Odontograma */}
                  {isOdonto&&(
                    <div style={card}>
                      <p style={cardTitle}>🦷 Odontograma</p>
                      {[DENTES_SUPERIOR,DENTES_INFERIOR].map((arco,ai)=>(
                        <div key={ai} style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
                          {arco.slice(0,arco.length/2).map(n=>(
                            <button key={n} onClick={()=>toggleDente(n)}
                              style={{width:'34px',height:'34px',borderRadius:'8px',border:`1.5px solid ${dentesSelec.includes(n)?'#2563EB':'#E5E7EB'}`,background:dentesSelec.includes(n)?'#2563EB':'#F9FAFB',color:dentesSelec.includes(n)?'#fff':'#6B7280',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                              {n}
                            </button>
                          ))}
                          <div style={{width:'1px',background:'#E5E7EB',margin:'0 4px'}} />
                          {arco.slice(arco.length/2).map(n=>(
                            <button key={n} onClick={()=>toggleDente(n)}
                              style={{width:'34px',height:'34px',borderRadius:'8px',border:`1.5px solid ${dentesSelec.includes(n)?'#2563EB':'#E5E7EB'}`,background:dentesSelec.includes(n)?'#2563EB':'#F9FAFB',color:dentesSelec.includes(n)?'#fff':'#6B7280',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                              {n}
                            </button>
                          ))}
                        </div>
                      ))}
                      {dentesSelec.length>0&&<p style={{fontSize:'12px',color:'#2563EB',marginBottom:'12px'}}>Dentes: {dentesSelec.sort((a,b)=>a-b).join(', ')}</p>}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                        <div><label style={lbl}>Procedimento</label><input style={inp} type="text" placeholder="Ex: Restauração" value={procNome} onChange={e=>setProcNome(e.target.value)} /></div>
                        <div><label style={lbl}>Valor</label><input style={inp} type="number" placeholder="0,00" value={procValor} onChange={e=>setProcValor(e.target.value)} /></div>
                      </div>
                      <button onClick={adicionarProcOdonto} disabled={!procNome||dentesSelec.length===0}
                        style={{border:'1.5px dashed #D1D5DB',borderRadius:'10px',padding:'10px',background:'transparent',color:'#6B7280',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%',marginBottom:'10px'}}>
                        + Adicionar procedimento
                      </button>
                      {procOdonto.map((p,i)=>(
                        <div key={i} style={{background:G,border:'1px solid #F3F4F6',borderRadius:'10px',padding:'10px 12px',display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
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
                  <div style={accordion(showPagSection)}>
                    <div style={accHeader} onClick={()=>setShowPagSection(!showPagSection)}>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#111827'}}>💳 Pagamento</p>
                        <p style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>
                          {valorPagoLocal>0?`Pago: R$ ${fmtBRL(valorPagoLocal)} · Saldo: R$ ${fmtBRL(saldoLocal)}`:'Entrada, pagamentos parciais e link de cobrança'}
                        </p>
                      </div>
                      <span style={{fontSize:'18px',color:'#9CA3AF',transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                    </div>
                    {showPagSection&&(
                      <div style={{padding:'0 18px 18px',display:'flex',flexDirection:'column',gap:'14px'}}>
                        {/* Resumo */}
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                          {[{l:'Total',v:total,c:'#111827'},{l:'Pago',v:valorPagoLocal,c:'#16A34A'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#EA580C':'#16A34A'}].map(f=>(
                            <div key={f.l} style={{background:G,borderRadius:'10px',padding:'10px',border:'1px solid #F3F4F6'}}>
                              <p style={{fontSize:'10px',fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                              <p style={{fontSize:'15px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Botões ação */}
                        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                          <button onClick={()=>setShowHpForm(!showHpForm)} style={pillBtn(showHpForm)}>+ Adicionar pagamento</button>
                          <button onClick={()=>setShowLinkPag(!showLinkPag)} style={pillBtn(showLinkPag)}>🔗 Link de pagamento</button>
                          <button onClick={()=>setShowSinal(!showSinal)} style={pillBtn(showSinal)}>💰 Entrada/sinal</button>
                          <button onClick={()=>navigator.clipboard.writeText(gerarMensagemCobranca())} style={pillBtn(false)}>📋 Copiar cobrança</button>
                          <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                            style={{...pillBtn(false),color:'#16A34A',borderColor:'#86EFAC',background:'#F0FFF4',opacity:clienteWpp?1:0.5,cursor:clienteWpp?'pointer':'not-allowed'}}>
                            💬 WhatsApp
                          </button>
                        </div>
                        {!clienteWpp&&<p style={{fontSize:'11px',color:'#D1D5DB',marginTop:'-6px'}}>Informe o WhatsApp do cliente para enviar.</p>}

                        {/* Formulário hp */}
                        {showHpForm&&(
                          <div style={{background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'12px',padding:'16px'}}>
                            <p style={{fontSize:'13px',fontWeight:700,color:'#0369A1',marginBottom:'12px'}}>{editandoPagIdx!==null?'Editar pagamento':'Registrar pagamento'}</p>
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                <div>
                                  <label style={lbl}>Valor *</label>
                                  <div style={{position:'relative'}}>
                                    <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#9CA3AF',fontWeight:600}}>R$</span>
                                    <input style={{...inp,paddingLeft:'36px'}} type="text" inputMode="numeric" placeholder="0,00"
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
                                {hpForma==='Outro'&&<input style={{...inp,marginTop:'8px'}} type="text" placeholder="Ex: cheque, boleto..." value={hpFormaOutro} onChange={e=>setHpFormaOutro(e.target.value)} />}
                              </div>
                              <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada, parcela 2..." value={hpObs} onChange={e=>setHpObs(e.target.value)} /></div>
                              <div style={{display:'flex',gap:'8px'}}>
                                <button onClick={()=>{setShowHpForm(false);setEditandoPagIdx(null)}}
                                  style={{flex:1,background:'#F3F4F6',border:'1.5px solid #E5E7EB',borderRadius:'10px',padding:'11px',fontSize:'13px',fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                                <button onClick={salvarHpPag}
                                  style={{flex:2,background:'#2563EB',border:'none',borderRadius:'10px',padding:'11px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
                                  {editandoPagIdx!==null?'Atualizar':'Salvar pagamento'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Lista hist */}
                        {histPags.length===0&&!showHpForm&&<p style={{fontSize:'12px',color:'#D1D5DB'}}>Nenhum pagamento registrado.</p>}
                        {histPags.map((p,i)=>(
                          <div key={i} style={{background:G,border:'1px solid #F3F4F6',borderRadius:'10px',padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                                <span style={{fontSize:'15px',fontWeight:800,color:'#16A34A'}}>R$ {fmtBRL(p.valor)}</span>
                                <span style={{fontSize:'11px',color:'#6B7280'}}>{p.forma}</span>
                                <span style={{fontSize:'11px',color:'#9CA3AF'}}>· {fmtData(p.data)}</span>
                              </div>
                              {p.obs&&<p style={{fontSize:'12px',color:'#9CA3AF'}}>{p.obs}</p>}
                            </div>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button onClick={()=>editarHpPag(i)} style={{background:'#F3F4F6',border:'1.5px solid #E5E7EB',borderRadius:'6px',padding:'4px 10px',fontSize:'11px',fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                              <button onClick={()=>excluirHpPag(i)} style={{background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:'6px',padding:'4px 10px',fontSize:'11px',fontWeight:600,color:'#DC2626',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                            </div>
                          </div>
                        ))}
                        {histPags.length>0&&(
                          <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'10px',padding:'10px 14px',display:'flex',justifyContent:'space-between'}}>
                            <span style={{fontSize:'13px',color:'#6B7280',fontWeight:600}}>Total pago</span>
                            <span style={{fontSize:'15px',fontWeight:800,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                          </div>
                        )}

                        {/* Link pag */}
                        {showLinkPag&&(
                          <div style={{padding:'14px',background:G,border:'1.5px solid #E5E7EB',borderRadius:'12px'}}>
                            <label style={lbl}>Link de pagamento</label>
                            <input style={inp} type="url" placeholder="Mercado Pago, Asaas, PagSeguro, InfinitePay..."
                              value={linkPag} onChange={e=>setLinkPag(e.target.value)} />
                            <p style={{fontSize:'11px',color:'#9CA3AF',marginTop:'6px'}}>O ClienteMarcado apenas organiza a cobrança.</p>
                          </div>
                        )}

                        {/* Sinal */}
                        {showSinal&&(
                          <div style={{padding:'14px',background:G,border:'1.5px solid #E5E7EB',borderRadius:'12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                              <button onClick={()=>setExigirSinal(!exigirSinal)}
                                style={{width:'36px',height:'20px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:exigirSinal?'#2563EB':'#D1D5DB'}}>
                                <span style={{position:'absolute',top:'2px',left:exigirSinal?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}} />
                              </button>
                              <span style={{fontSize:'13px',color:'#374151',fontWeight:600}}>Exigir entrada/sinal?</span>
                            </div>
                            {exigirSinal&&(
                              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                  <div><label style={lbl}>Tipo</label>
                                    <select style={sel} value={sinalTipo} onChange={e=>setSinalTipo(e.target.value)}>
                                      <option value="fixo">Valor fixo (R$)</option>
                                      <option value="percentual">Porcentagem (%)</option>
                                    </select>
                                  </div>
                                  <div><label style={lbl}>{sinalTipo==='fixo'?'Valor (R$)':'Percentual (%)'}</label>
                                    <input style={inp} type="number" min="0" placeholder={sinalTipo==='fixo'?'0,00':'50'} value={sinalValor} onChange={e=>setSinalValor(e.target.value)} />
                                  </div>
                                </div>
                                {sinalValor&&(
                                  <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:'8px',padding:'10px 14px'}}>
                                    <span style={{fontSize:'13px',color:'#059669',fontWeight:700}}>
                                      Entrada: R$ {fmtBRL(sinalTipo==='fixo'?parseFloat(sinalValor||'0'):(total*parseFloat(sinalValor||'0'))/100)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACCORDION: Observações */}
                  <div style={accordion(showObs)}>
                    <div style={accHeader} onClick={()=>setShowObs(!showObs)}>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#111827'}}>📝 Observações</p>
                        <p style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>Informações extras para o cliente ou sua equipe</p>
                      </div>
                      <span style={{fontSize:'18px',color:'#9CA3AF',transform:showObs?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                    </div>
                    {showObs&&(
                      <div style={{padding:'0 18px 18px',display:'flex',flexDirection:'column',gap:'10px'}}>
                        <div><label style={lbl}>Observação do cliente</label>
                          <textarea rows={2} style={{...inp,resize:'none'}} placeholder="Alergias, preferências, histórico..."
                            value={clienteObs} onChange={e=>setClienteObs(e.target.value)} /></div>
                        <div><label style={lbl}>Obs. de pagamento</label>
                          <input style={inp} type="text" placeholder="Ex: cliente pagou entrada em dinheiro"
                            value={obsPagamento} onChange={e=>setObsPagamento(e.target.value)} /></div>
                        <div><label style={lbl}>Observações do orçamento</label>
                          <textarea rows={3} style={{...inp,resize:'none'}} placeholder="Informações adicionais..."
                            value={observacoes} onChange={e=>setObservacoes(e.target.value)} /></div>
                      </div>
                    )}
                  </div>

                  {/* Botão mobile */}
                  <div style={{display:'block'}}>
                    <style>{`@media(min-width:900px){.orc-btn-mobile{display:none!important}}`}</style>
                    <div className="orc-btn-mobile">
                      <button onClick={handleSalvar}
                        style={{width:'100%',background:'#2563EB',color:'#fff',border:'none',borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(37,99,235,.3)',marginBottom:'8px'}}>
                        {editandoId?'Salvar alterações':'Criar orçamento'}
                      </button>
                      <button onClick={()=>{resetForm();setView('lista')}}
                        style={{width:'100%',background:'none',border:'none',color:'#9CA3AF',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'8px'}}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Coluna direita — Resumo sticky */}
                <div style={{display:'none'}}>
                  <style>{`@media(min-width:900px){.orc-sidebar{display:block!important}}`}</style>
                  <div className="orc-sidebar" style={{display:'none'}}>
                    <div style={{...card,position:'sticky',top:'76px'}}>
                      <p style={{fontSize:'13px',fontWeight:800,color:'#111827',marginBottom:'16px',textTransform:'uppercase',letterSpacing:'.06em'}}>Resumo</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                          <span style={{color:'#9CA3AF'}}>Cliente</span>
                          <span style={{fontWeight:600,color:'#111827'}}>{clienteNome||'Não informado'}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                          <span style={{color:'#9CA3AF'}}>Tipo</span>
                          <span style={{fontWeight:600,color:'#111827'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                          <span style={{color:'#9CA3AF'}}>Status</span>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:STATUS_COR[status]?.bg||'#EFF6FF',color:STATUS_COR[status]?.color||'#2563EB',border:`1px solid ${STATUS_COR[status]?.border||'#BFDBFE'}`}}>{status}</span>
                        </div>
                        <div style={{height:'1px',background:'#F3F4F6',margin:'4px 0'}} />
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                          <span style={{color:'#9CA3AF'}}>Subtotal</span>
                          <span style={{fontWeight:600,color:'#111827'}}>R$ {fmtBRL(subtotal)}</span>
                        </div>
                        {descontoNum>0&&(
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                            <span style={{color:'#9CA3AF'}}>Desconto</span>
                            <span style={{fontWeight:600,color:'#EF4444'}}>- R$ {fmtBRL(descontoNum)}</span>
                          </div>
                        )}
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,borderTop:'1px solid #F3F4F6',paddingTop:'8px',marginTop:'4px'}}>
                          <span style={{color:'#111827'}}>Total</span>
                          <span style={{color:'#059669'}}>R$ {fmtBRL(total)}</span>
                        </div>
                        {valorPagoLocal>0&&(<>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                            <span style={{color:'#9CA3AF'}}>Pago</span>
                            <span style={{fontWeight:600,color:'#16A34A'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                            <span style={{color:'#9CA3AF'}}>Saldo</span>
                            <span style={{fontWeight:700,color:saldoLocal>0?'#EA580C':'#16A34A'}}>R$ {fmtBRL(saldoLocal)}</span>
                          </div>
                        </>)}
                      </div>
                      <button onClick={handleSalvar}
                        style={{width:'100%',background:'#2563EB',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 14px rgba(37,99,235,.3)',marginBottom:'8px'}}>
                        {editandoId?'Salvar alterações':'Criar orçamento'}
                      </button>
                      <button onClick={()=>{resetForm();setView('lista')}}
                        style={{width:'100%',background:'none',border:'none',color:'#9CA3AF',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'8px'}}>
                        Cancelar
                      </button>
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
            <div style={{maxWidth:'760px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
                <button style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#9CA3AF',fontFamily:'inherit'}} onClick={()=>{setView('lista');setShowPagForm(false)}}>← Voltar</button>
                <h2 style={{fontSize:'20px',fontWeight:800,color:'#111827'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'10px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A'}}>{mensagem}</div>}

              <div style={card}>
                <p style={cardTitle}>📊 Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                  {[{l:'Total',v:orc.total,c:'#111827'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(
                    <div key={f.l} style={{background:G,borderRadius:'10px',padding:'12px',border:'1px solid #F3F4F6'}}>
                      <p style={{fontSize:'10px',fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>{f.l}</p>
                      <p style={{fontSize:'18px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)}
                    style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    + Registrar pagamento
                  </button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:G,border:'1.5px solid #E5E7EB',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'#F0FFF4',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#16A34A',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} style={{background:G,border:'1.5px solid #E5E7EB',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'inherit'}}>Copiar link</button>}
                  <button onClick={()=>abrirEditar(orc)} style={{background:G,border:'1.5px solid #E5E7EB',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'14px',background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'12px',padding:'16px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#0369A1',marginBottom:'12px'}}>Registrar pagamento</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                      <div><label style={lbl}>Data</label><input type="date" value={pagData} onChange={e=>setPagData(e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>Valor (R$)</label><input type="number" placeholder="0,00" value={pagValor} onChange={e=>setPagValor(e.target.value)} style={inp} /></div>
                    </div>
                    <div style={{marginBottom:'10px'}}>
                      <label style={lbl}>Forma</label>
                      <select value={pagForma} onChange={e=>setPagForma(e.target.value)} style={sel}>
                        {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{marginBottom:'12px'}}><label style={lbl}>Observação</label><input type="text" placeholder="Opcional" value={pagObs} onChange={e=>setPagObs(e.target.value)} style={inp} /></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>setShowPagForm(false)} style={{flex:1,background:'#F3F4F6',border:'1.5px solid #E5E7EB',borderRadius:'10px',padding:'11px',fontSize:'13px',fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                      <button disabled={savingPag} onClick={()=>handleRegistrarPagamento(orc)} style={{flex:2,background:'#2563EB',border:'none',borderRadius:'10px',padding:'11px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{savingPag?'Salvando...':'Confirmar pagamento'}</button>
                    </div>
                  </div>
                )}
              </div>

              {(orc.servicos?.length>0||orc.procedimentos_odonto?.length>0)&&(
                <div style={card}>
                  <p style={cardTitle}>🛎 Serviços</p>
                  {(orc.servicos||[]).map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F3F4F6'}}>
                      <div><p style={{fontSize:'13px',color:'#111827',fontWeight:600}}>{s.nome}</p><p style={{fontSize:'11px',color:'#9CA3AF'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#059669'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,paddingTop:'10px',marginTop:'4px'}}>
                    <span style={{color:'#111827'}}>Total</span>
                    <span style={{color:'#059669'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}

              <div style={card}>
                <p style={cardTitle}>📜 Histórico de pagamentos</p>
                {pagamentos.length===0?<p style={{fontSize:'13px',color:'#D1D5DB'}}>Nenhum pagamento registrado.</p>
                :pagamentos.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F3F4F6'}}>
                    <div><p style={{fontSize:'13px',color:'#111827',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.observacao&&<p style={{fontSize:'11px',color:'#9CA3AF'}}>{p.observacao}</p>}</div>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#16A34A'}}>R$ {fmtBRL(p.valor)}</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <p style={cardTitle}>👤 Cliente</p>
                <p style={{fontSize:'14px',fontWeight:700,color:'#111827',marginBottom:'4px'}}>{orc.cliente_nome}</p>
                {orc.cliente_whatsapp&&<p style={{fontSize:'13px',color:'#6B7280',marginBottom:'2px'}}>📱 {aplicarMascaraTel(orc.cliente_whatsapp)}</p>}
                {orc.cliente_email&&<p style={{fontSize:'13px',color:'#6B7280',marginBottom:'2px'}}>✉️ {orc.cliente_email}</p>}
                {orc.observacoes&&<p style={{fontSize:'13px',color:'#9CA3AF',marginTop:'8px'}}>{orc.observacoes}</p>}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
