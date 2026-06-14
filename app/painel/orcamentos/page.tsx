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
  html,body{overflow-x:hidden;width:100%;background:#050B16}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  input,select,textarea{color-scheme:dark}
  select option{background:#07111F;color:#F8FAFC}
  .cm-mobile-footer{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(5,11,22,.97);border-top:1px solid rgba(148,163,184,.12);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));z-index:25;flex-direction:column;gap:6px;backdrop-filter:blur(20px)}
  @media(min-width:1024px){
    .cm-mobile-footer{display:none!important}
    .cm-resumo-mobile{display:none!important}
    .cm-form-right{display:block!important}
    .cm-form-grid{grid-template-columns:1fr 300px!important}
    .cm-tabela-desktop{display:block!important}
    .cm-cards-mobile{display:none!important}
  }
  @media(max-width:1023px){
    .cm-mobile-footer{display:flex!important}
    .cm-form-grid{grid-template-columns:1fr!important}
    .cm-form-right{display:none!important}
    .cm-resumo-mobile{display:block!important}
    .cm-2col{grid-template-columns:1fr!important}
    .cm-metrics{grid-template-columns:1fr 1fr!important}
    .cm-kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
    .cm-tabela-desktop{display:none!important}
    .cm-cards-mobile{display:flex!important;flex-direction:column!important;gap:10px!important}
    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:12px 12px 130px!important}
    .cm-filtros-wrap{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;max-width:100%!important;gap:8px!important}
    .cm-form-inner{padding:12px!important}
  }
  @media(max-width:480px){.cm-metrics{grid-template-columns:1fr!important}}
`
export default function Orcamentos() {
  const [userId,setUserId]=useState('')
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [filtroStatus,setFiltroStatus]=useState('Todos')
  const [filtroCliente,setFiltroCliente]=useState('')
  const [view,setView]=useState<'lista'|'escolha'|'form'|'detalhe'>('lista')
  const [tipoOrc,setTipoOrc]=useState<'comum'|'odonto'>('comum')
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
  const [modalPagOrc,setModalPagOrc]=useState<any>(null)
  const [modalValor,setModalValor]=useState('')
  const [modalForma,setModalForma]=useState('Pix')
  const [modalObs,setModalObs]=useState('')
  const [modalErro,setModalErro]=useState('')
  const [modalSaving,setModalSaving]=useState(false)
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
  const searchParams = useSearchParams()
  useEffect(()=>{init()},[])
  useEffect(()=>{
    if(searchParams.get('novo')==='1'){resetForm();setView('escolha')}
  },[searchParams])
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
    if(!window.confirm('Excluir este orçamento?'))return
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
    if(novoValorPago>=orc.total)novoStatus='Pago'
    else if(novoValorPago>0)novoStatus='Parcialmente pago'
    await supabase.from('orcamentos').update({valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus,updated_at:new Date().toISOString()}).eq('id',orc.id)
    setSavingPag(false);setShowPagForm(false);setPagValor('');setPagObs('');setPagForma('Pix')
    await carregarOrcamentos();await carregarPagamentos(orc.id)
    const {data}=await supabase.from('orcamentos').select('*').eq('id',orc.id).single()
    if(data)setOrcamentos(prev=>prev.map(o=>o.id===orc.id?data:o))
    setMensagem('Pagamento registrado!');setTimeout(()=>setMensagem(''),3000)
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
    try{
      await supabase.from('orcamento_pagamentos').insert({
        orcamento_id:modalPagOrc.id,user_id:userId,
        data:new Date().toISOString().split('T')[0],
        valor,forma:modalForma,observacao:modalObs||null
      })
    }catch(e){console.log('orcamento_pagamentos:',e)}
    {
      const pagPayload:any={
        user_id:userId,
        valor,
        data:new Date().toISOString().split('T')[0],
        status:'confirmado',
      }
      const {error:epag}=await supabase.from('pagamentos').insert(pagPayload)
      if(epag){
        console.error('Erro pagamentos insert:',epag)
        // Tentar com menos campos
        const {error:epag2}=await supabase.from('pagamentos').insert({user_id:userId,valor,data:new Date().toISOString().split('T')[0]})
        if(epag2)console.error('Erro pagamentos insert minimo:',epag2)
      }
    }
    const{error}=await supabase.from('orcamentos').update({
      valor_pago:novoValorPago,saldo_restante:novoSaldo,
      status:novoStatus,updated_at:new Date().toISOString()
    }).eq('id',modalPagOrc.id)
    if(error){setModalErro('Erro ao registrar. Tente novamente.');setModalSaving(false);return}
    setOrcamentos(prev=>prev.map(o=>o.id===modalPagOrc.id?{...o,valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus}:o))
    setModalSaving(false);setModalPagOrc(null)
    setMensagem(novoStatus==='Pago'?'Pagamento confirmado! Orçamento pago.':'Pagamento parcial registrado!')
    setTimeout(()=>setMensagem(''),4000)
  }
  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'');if(!tel)return
    let msg=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}`
    if(orc.link_pagamento)msg+=`\n\nLink:\n${orc.link_pagamento}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }
  function gerarPDF(orc:any){
    const win=window.open('','_blank');if(!win)return
    const linhas=(orc.servicos||[]).map((s:any)=>`<tr><td>${s.nome}</td><td>${s.qtd||1}</td><td>R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td>R$ ${fmtBRL(s.total||0)}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:32px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}.footer{margin-top:40px;text-align:center;color:#aaa;font-size:11px}</style></head><body><h1>${perfil?.nome_negocio||'Negócio'}</h1><p>${orc.tipo} · ${fmtData(orc.data)}</p><p><strong>${orc.cliente_nome}</strong> · ${orc.cliente_whatsapp||''}</p><table><thead><tr><th>Serviço</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${linhas}<tr><td colspan="3"><strong>Total</strong></td><td><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr><tr><td colspan="3">Pago</td><td style="color:green">R$ ${fmtBRL(orc.valor_pago)}</td></tr><tr><td colspan="3">Saldo</td><td style="color:red">R$ ${fmtBRL(orc.saldo_restante)}</td></tr></tbody></table><div class="footer">Gerado pelo ClienteMarcado</div></body></html>`)
    win.document.close();setTimeout(()=>win.print(),500)
  }
  function gerarMsgCobranca(){
    const tipoDoc=tipo==='__outro__'?tipoOutro:tipo
    const neg=perfil?.nome_negocio||'nosso negócio'
    let msg=`Olá, ${clienteNome||'cliente'}! Aqui é d${neg.match(/^[aeiouAEIOU]/)?'a ':'o '}${neg}.\n\nSeu ${tipoDoc}: R$ ${fmtBRL(total)}.\nPago: R$ ${fmtBRL(valorPagoLocal)}. Saldo: R$ ${fmtBRL(saldoLocal)}.`
    if(linkPag)msg+=`\n\nPagamento:\n${linkPag}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    return msg
  }
  function enviarCobrancaWpp(){
    const tel=clienteWpp.replace(/\D/g,'');if(!tel)return
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(gerarMsgCobranca()),'_blank')
  }
  function fmtHpValor(raw:string){
    const nums=raw.replace(/\D/g,'');if(!nums)return ''
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
  const [usarOdontograma,setUsarOdontograma]=useState(false)
  const isOdonto=usarOdontograma
  const DENTES_SUPERIOR=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
  const DENTES_INFERIOR=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
  function toggleDente(n:number){setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}
  function adicionarProcOdonto(){
    if(!procNome||dentesSelec.length===0)return
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
  const BG='rgba(255,255,255,.06)'
  const inp:React.CSSProperties={width:'100%',border:'1.5px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px 14px',fontSize:'15px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any,color:'#fff'}
  const lbl:React.CSSProperties={fontSize:'12px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:'6px'}
  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'16px',padding:'20px 24px',marginBottom:'12px',border:'1px solid rgba(148,163,184,.14)',boxShadow:'0 4px 20px rgba(0,0,0,.3)'}
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:MOBILE_CSS}}/>
      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile="Orçamentos"/>
      <div className="psb-main" style={{flex:1,minWidth:0,minHeight:'100vh',display:'flex',flexDirection:'column'}}>
        {view==='lista'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'28px 32px 0',maxWidth:'1280px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'20px'}}>
                <div>
                  <h1 style={{fontSize:'24px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'4px'}}>Orçamentos</h1>
                  <p style={{fontSize:'14px',color:'#94A3B8'}}>Crie, acompanhe e envie orçamentos em poucos segundos.</p>
                </div>
                <button onClick={()=>{resetForm();setView('escolha')}}
                  style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'11px 22px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(59,130,246,.3)',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}}>
                  + Novo orçamento
                </button>
              </div>
              {mensagem&&<div style={{padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',background:'rgba(22,163,74,.15)',border:'1px solid rgba(22,163,74,.3)',color:'#4ADE80',fontSize:'13px'}}>{mensagem}</div>}
              <div className="cm-kpi-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
                {[
                  {label:'Em aberto',valor:totalAberto,fmt:'n',cor:'#3B82F6',bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.25)'},
                  {label:'A receber',valor:totalAReceber,fmt:'brl',cor:'#F59E0B',bg:'rgba(245,158,11,.12)',border:'rgba(245,158,11,.25)'},
                  {label:'Recebido no mês',valor:recebidoMes,fmt:'brl',cor:'#22C55E',bg:'rgba(34,197,94,.12)',border:'rgba(34,197,94,.25)'},
                  {label:'Parciais',valor:parciais,fmt:'n',cor:'#A78BFA',bg:'rgba(167,139,250,.12)',border:'rgba(167,139,250,.25)'},
                ].map(m=>(
                  <div key={m.label} style={{background:m.bg,border:`1px solid ${m.border}`,borderRadius:'14px',padding:'16px',boxSizing:'border-box' as const}}>
                    <p style={{fontSize:'11px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'6px'}}>{m.label}</p>
                    <p style={{fontSize:'22px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em'}}>{m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}</p>
                  </div>
                ))}
              </div>
              <div style={{position:'relative',marginBottom:'12px'}}>
                <input type="text" placeholder="Buscar cliente..." value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
                  style={{width:'100%',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'11px 16px',fontSize:'13px',color:'#fff',outline:'none',fontFamily:'inherit',background:'rgba(255,255,255,.06)',boxSizing:'border-box' as const}}/>
              </div>
              <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap',width:'100%',maxWidth:'100%',overflow:'visible'}}>
                {STATUS_LIST.map(s=>(
                  <button key={s} onClick={()=>setFiltroStatus(s)}
                    style={{padding:'8px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',minHeight:'36px',
                      background:filtroStatus===s?'linear-gradient(135deg,#3B82F6,#7C3AED)':'rgba(255,255,255,.06)',
                      color:filtroStatus===s?'#fff':'#94A3B8',
                      borderColor:filtroStatus===s?'transparent':'rgba(255,255,255,.12)'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:'0 32px 60px',maxWidth:'1280px',margin:'0 auto'}}>
              {orcsFiltrados.length===0?(
                <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'20px',padding:'48px 24px',textAlign:'center'}}>
                  <p style={{fontSize:'18px',fontWeight:700,color:'#fff',marginBottom:'8px'}}>Nenhum orçamento criado ainda</p>
                  <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'24px'}}>Crie seu primeiro orçamento e envie pelo WhatsApp.</p>
                  <button onClick={()=>{resetForm();setView('form')}}
                    style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'13px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    Criar primeiro orçamento
                  </button>
                </div>
              ):(
                <>
                  <div className="cm-tabela-desktop" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'20px',overflow:'hidden'}}>
                    <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,.08)',display:'flex',justifyContent:'space-between'}}>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Orçamentos recentes</p>
                      <span style={{fontSize:'12px',color:'#64748B'}}>{orcsFiltrados.length} registro{orcsFiltrados.length!==1?'s':''}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 120px 180px',padding:'10px 24px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      {['Cliente','Tipo / Data','Total','Pago','Saldo','Status','Ações'].map(h=>(
                        <p key={h} style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{h}</p>
                      ))}
                    </div>
                    {orcsFiltrados.map((orc,i)=>{
                      const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                      return(
                        <div key={orc.id} style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 120px 180px',padding:'14px 24px',borderBottom:i<orcsFiltrados.length-1?'1px solid rgba(255,255,255,.05)':'none',alignItems:'center',transition:'background .15s'}}
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
                          <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,display:'inline-block'}}>{orc.status}</span>
                          <div style={{display:'flex',gap:'4px'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Ver</button>
                            <button onClick={()=>gerarPDF(orc)}
                              style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.3)',borderRadius:'6px',padding:'4px 6px',fontSize:'11px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                            {(orc.saldo_restante||0)>0.01&&!['Pago','Finalizado','Cancelado'].includes(orc.status)&&(
                              <button onClick={()=>abrirModalPag(orc)}
                                style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
                                Pgto
                              </button>
                            )}
                            <button onClick={()=>enviarWpp(orc)}
                              style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'6px',padding:'4px 6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>💬</button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',padding:'4px 6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
                            <button onClick={()=>handleExcluir(orc.id)}
                              style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',padding:'4px 6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="cm-cards-mobile" style={{display:'none',flexDirection:'column',gap:'10px'}}>
                    {orcsFiltrados.map(orc=>{
                      const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
                      return(
                        <div key={orc.id} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'14px',boxSizing:'border-box' as const}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                            <div>
                              <p style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>{orc.cliente_nome}</p>
                              <p style={{fontSize:'12px',color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}</p>
                            </div>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:'nowrap' as const}}>{orc.status}</span>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                            {[{l:'Total',v:orc.total,c:'#fff'},{l:'Pago',v:orc.valor_pago,c:'#22C55E'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#F59E0B':'#22C55E'}].map(f=>(
                              <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'8px',padding:'8px 10px'}}>
                                <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'.04em',marginBottom:'2px'}}>{f.l}</p>
                                <p style={{fontSize:'13px',fontWeight:700,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                            <button onClick={()=>{setDetalheId(orc.id);carregarPagamentos(orc.id);setView('detalhe')}}
                              style={{background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Ver detalhes</button>
                            <button onClick={()=>enviarWpp(orc)}
                              style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>💬 WhatsApp</button>
                            {(orc.saldo_restante||0)>0.01&&!['Pago','Finalizado','Cancelado'].includes(orc.status)&&(
                              <button onClick={()=>abrirModalPag(orc)}
                                style={{gridColumn:'1/-1',background:'rgba(34,197,94,.12)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'8px',padding:'11px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                                Confirmar pagamento  R$ {fmtBRL(orc.saldo_restante||0)}
                              </button>
                            )}
                            <button onClick={()=>gerarPDF(orc)}
                              style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit'}}>📥 PDF</button>
                            <button onClick={()=>abrirEditar(orc)}
                              style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#CBD5E1',cursor:'pointer',fontFamily:'inherit'}}>✏️ Editar</button>
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
        {view==='escolha'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'28px 32px 60px',maxWidth:'760px',margin:'0 auto'}}>
              <button onClick={()=>setView('lista')}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'24px'}}>
                ← Voltar à lista
              </button>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'6px'}}>Novo orçamento</h1>
              <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'32px'}}>Escolha o tipo de orçamento que deseja criar.</p>
              <style dangerouslySetInnerHTML={{__html:'@media(max-width:600px){.orc-grid{grid-template-columns:1fr!important}}'}}/>
              <div className="orc-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <button onClick={()=>{resetForm();setTipoOrc('comum');setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'20px',padding:'28px 24px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'14px',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.55)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 32px rgba(59,130,246,.15)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.22)';(e.currentTarget as HTMLButtonElement).style.boxShadow='none'}}>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'6px'}}>Orçamento comum</p>
                    <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:'1.5'}}>Crie orçamentos simples para serviços, procedimentos e atendimentos em geral.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#60A5FA'}}>Criar orçamento comum</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
                <button onClick={()=>{resetForm();setTipoOrc('odonto');setUsarOdontograma(true);setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(124,58,237,.28)',borderRadius:'20px',padding:'28px 24px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'14px',position:'relative',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.60)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 32px rgba(124,58,237,.18)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.28)';(e.currentTarget as HTMLButtonElement).style.boxShadow='none'}}>
                  <div style={{position:'absolute',top:'16px',right:'16px',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'3px 10px',fontSize:'10px',fontWeight:700,color:'#C4B5FD',letterSpacing:'.06em'}}>ODONTOLÓGICO</div>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'6px'}}>Orçamento odontológico</p>
                    <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:'1.5'}}>Monte tratamentos por dente com odontograma interativo, acompanhe pagamentos e gere PDF para o paciente.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD'}}>Criar orçamento odontológico</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        {view==='form'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'24px 32px 60px',maxWidth:'1100px',margin:'0 auto'}}>
              <div style={{padding:'24px',width:'100%',boxSizing:'border-box' as const}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
                  <div>
                    <button onClick={()=>{resetForm();setView(editandoId?'lista':'escolha')}}
                      style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>
                      ← {editandoId?'Voltar à lista':'Voltar'}
                    </button>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'2px'}}>
                      <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>{editandoId?'Editar orçamento':tipoOrc==='odonto'?'Orçamento odontológico':'Novo orçamento'}</h1>
                      {tipoOrc==='odonto'&&!editandoId&&<span style={{fontSize:'11px',fontWeight:700,background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'3px 10px',color:'#C4B5FD'}}>Odontológico</span>}
                    </div>
                    <p style={{fontSize:'13px',color:'#94A3B8'}}>{tipoOrc==='odonto'?'Odontograma interativo com procedimentos por dente.':'Preencha os dados e envie para o cliente.'}</p>
                  </div>
                </div>
                {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>{mensagem}</div>}
                <div className="cm-form-grid" style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'20px',alignItems:'start'}}>
                  <div style={{minWidth:0}}>
                    <div style={card}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                        <div style={{width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Cliente</p>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        <div><label style={lbl}>Nome *</label><input style={inp} type="text" placeholder="Nome do cliente" value={clienteNome} onChange={e=>setClienteNome(e.target.value)}/></div>
                        <div className="cm-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                          <div><label style={lbl}>WhatsApp *</label><input style={inp} type="tel" placeholder="(11) 99999-9999" value={clienteWpp} onChange={e=>setClienteWpp(aplicarMascaraTel(e.target.value))}/></div>
                          <div><label style={lbl}>E-mail (opcional)</label><input style={inp} type="email" placeholder="email@exemplo.com" value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)}/></div>
                        </div>
                      </div>
                    </div>
                    <div style={{...card,padding:0,overflow:'hidden'}}>
                      <div onClick={()=>setShowDetalhes(!showDetalhes)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <div style={{width:'26px',height:'26px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
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
                              {tipo==='__outro__'&&<div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px'}}>
                                <input style={inp} type="text" placeholder="Ex: Avaliação, Laudo..." value={tipoOutro} onChange={e=>setTipoOutro(e.target.value)}/>
                                <input style={inp} type="text" placeholder="Descrição (opcional)" value={tipoDescricao} onChange={e=>setTipoDescricao(e.target.value)}/>
                              </div>}
                            </div>
                            <div><label style={lbl}>Status</label>
                              <select style={sel} value={status} onChange={e=>setStatus(e.target.value)}>
                                {['Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="cm-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                            <div>
                              <label style={lbl}>Profissional</label>
                              <select style={sel} value={profId} onChange={e=>{setProfId(e.target.value);if(e.target.value!=='__outro__'){setProfNome('');setSalvarFreelancer(false)}}}>
                                <option value="">Nenhum</option>
                                {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                                <option value="__outro__">✏️ Outro / Não cadastrado</option>
                              </select>
                              {profId==='__outro__'&&<div style={{marginTop:'8px',padding:'12px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'8px',display:'flex',flexDirection:'column',gap:'8px'}}>
                                <input style={inp} type="text" placeholder="Nome do profissional" value={profNome} onChange={e=>setProfNome(e.target.value)}/>
                                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                  <button onClick={()=>setSalvarFreelancer(!salvarFreelancer)} style={{width:'32px',height:'18px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:salvarFreelancer?'#3B82F6':'rgba(148,163,184,.3)',flexShrink:0}}>
                                    <span style={{position:'absolute',top:'2px',left:salvarFreelancer?'14px':'2px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                                  </button>
                                  <span style={{fontSize:'12px',color:'#94A3B8'}}>Salvar na equipe?</span>
                                </div>
                              </div>}
                            </div>
                            <div><label style={lbl}>Data</label><input style={inp} type="date" value={dataDoc} onChange={e=>setDataDoc(e.target.value)}/></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={card}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                        <div style={{width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>
                      </div>
                      <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'16px'}}>Adicione serviços, procedimentos ou itens deste orçamento.</p>
                      {itens.map((item,idx)=>(
                        <div key={idx} style={{marginBottom:'12px',padding:'14px',background:'rgba(255,255,255,.04)',borderRadius:'12px',border:'1px solid rgba(148,163,184,.12)',width:'100%',boxSizing:'border-box'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                            <span style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em'}}>Item {idx+1}</span>
                            {itens.length>1&&<button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                              style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',color:'#F87171',cursor:'pointer',fontSize:'13px',padding:'3px 8px'}}>Remover</button>}
                          </div>
                          <div style={{marginBottom:'8px'}}>
                            <label style={{...lbl,textTransform:'none',letterSpacing:0}}>Nome do serviço *</label>
                            <input style={{...inp,width:'100%'}} type="text" placeholder="Ex: Corte, limpeza de pele..." value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)}/>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                            <div>
                              <label style={{...lbl,textTransform:'none',letterSpacing:0}}>Qtd.</label>
                              <input style={{...inp,textAlign:'center'}} type="number" min="1" value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)}/>
                            </div>
                            <div>
                              <label style={{...lbl,textTransform:'none',letterSpacing:0}}>Valor (R$)</label>
                              <input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)}/>
                            </div>
                          </div>
                          <div style={{background:item.total>0?'rgba(34,197,94,.10)':'rgba(255,255,255,.03)',border:`1px solid ${item.total>0?'rgba(34,197,94,.25)':'rgba(255,255,255,.07)'}`,borderRadius:'8px',padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                            <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total</span>
                            <span style={{fontSize:'16px',fontWeight:800,color:item.total>0?'#4ADE80':'#475569'}}>R$ {fmtBRL(item.total||0)}</span>
                          </div>
                          <input style={{...inp,fontSize:'13px',color:'#94A3B8'}} type="text" placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)}/>
                        </div>
                      ))}
                      <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                        style={{background:'none',border:'none',color:'#60A5FA',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0'}}>
                        + Adicionar outro serviço
                      </button>
                      <div style={{marginTop:'16px',background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'14px 16px',border:'1px solid rgba(148,163,184,.10)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#94A3B8',marginBottom:'8px'}}>
                          <span>Subtotal</span><span style={{fontWeight:600,color:'#F8FAFC'}}>R$ {fmtBRL(subtotal)}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#64748B',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                          <span>Desconto</span>
                          <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={e=>setDesconto(e.target.value)}
                            style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:600,textAlign:'right' as const,width:'100px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}}/>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Total final</span>
                          <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(total)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="cm-resumo-mobile" style={{display:'none',background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid rgba(148,163,184,.14)'}}>
                      <p style={{fontSize:'12px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'10px'}}>Resumo</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                          <span style={{color:'#64748B'}}>Cliente</span>
                          <span style={{fontWeight:600,color:clienteNome?'#F8FAFC':'#475569'}}>{clienteNome||'Não informado'}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                          <span style={{color:'#64748B'}}>Status</span>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:STATUS_COR[status]?.bg,color:STATUS_COR[status]?.color,border:`1px solid ${STATUS_COR[status]?.border}`}}>{status}</span>
                        </div>
                        <div style={{height:'1px',background:'rgba(255,255,255,.08)',margin:'2px 0'}}/>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:'13px',color:'#64748B'}}>Total</span>
                          <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(total)}</span>
                        </div>
                      </div>
                    </div>
                    {tipoOrc!=='comum'&&<div style={{...card,padding:0,overflow:'hidden'}}>
                      <div onClick={()=>setShowPagSection(!showPagSection)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <span style={{fontSize:'16px'}}>💳</span>
                          <div>
                            <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Pagamento</p>
                            <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>{valorPagoLocal>0?`Pago: R$ ${fmtBRL(valorPagoLocal)} · Saldo: R$ ${fmtBRL(saldoLocal)}`:'Entrada, parciais e link de cobrança.'}</p>
                          </div>
                        </div>
                        <span style={{color:'#64748B',fontSize:'18px',transform:showPagSection?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                      </div>
                      {showPagSection&&(
                        <div style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'16px 0'}}>
                            {[{l:'Total',v:total,c:'#F8FAFC'},{l:'Pago',v:valorPagoLocal,c:'#4ADE80'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#FBBF24':'#4ADE80'}].map(f=>(
                              <div key={f.l} style={{background:'rgba(255,255,255,.06)',borderRadius:'8px',padding:'10px',border:'1px solid rgba(148,163,184,.12)'}}>
                                <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                                <p style={{fontSize:'15px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{marginBottom:'14px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:exigirSinal?'12px':'0'}}>
                              <button onClick={()=>setExigirSinal(!exigirSinal)} style={{width:'36px',height:'20px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:exigirSinal?'#3B82F6':'rgba(148,163,184,.25)'}}>
                                <span style={{position:'absolute',top:'2px',left:exigirSinal?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                              </button>
                              <span style={{fontSize:'13px',color:'#F8FAFC',cursor:'pointer'}} onClick={()=>setExigirSinal(!exigirSinal)}>Exigir entrada/sinal?</span>
                            </div>
                            {exigirSinal&&(
                              <div style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'14px',border:'1px solid rgba(148,163,184,.12)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'10px'}}>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                  <div><label style={lbl}>Tipo</label>
                                    <select style={sel} value={sinalTipo} onChange={e=>setSinalTipo(e.target.value)}>
                                      <option value="fixo">Valor fixo (R$)</option>
                                      <option value="percentual">Porcentagem (%)</option>
                                    </select>
                                  </div>
                                  <div><label style={lbl}>{sinalTipo==='fixo'?'Valor (R$)':'%'}</label>
                                    <input style={inp} type="number" min="0" value={sinalValor} onChange={e=>setSinalValor(e.target.value)}/>
                                  </div>
                                </div>
                                {sinalValor&&<div style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'8px',padding:'10px 14px'}}>
                                  <span style={{fontSize:'13px',color:'#4ADE80',fontWeight:700}}>Entrada: R$ {fmtBRL(sinalTipo==='fixo'?parseFloat(sinalValor||'0'):(total*parseFloat(sinalValor||'0'))/100)}</span>
                                </div>}
                              </div>
                            )}
                          </div>
                          <div style={{marginBottom:'14px'}}>
                            <label style={lbl}>Link de pagamento</label>
                            <input style={inp} type="url" placeholder="Cole aqui o link do Mercado Pago, Asaas, InfinitePay..." value={linkPag} onChange={e=>setLinkPag(e.target.value)}/>
                          </div>
                          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
                            <button onClick={()=>navigator.clipboard.writeText(gerarMsgCobranca())}
                              style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>
                              📋 Copiar mensagem
                            </button>
                            <button onClick={enviarCobrancaWpp} disabled={!clienteWpp}
                              style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}>
                              💬 Enviar WhatsApp
                            </button>
                          </div>
                          <div style={{marginBottom:'14px'}}><label style={lbl}>Observações de pagamento</label><input style={inp} type="text" placeholder="Ex: entrada de R$ 100 em dinheiro..." value={obsPagamento} onChange={e=>setObsPagamento(e.target.value)}/></div>
                          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:'14px'}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                              <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>Pagamentos registrados</p>
                              <button onClick={()=>{setShowHpForm(!showHpForm);setEditandoPagIdx(null);setHpValor('');setHpForma('Pix');setHpFormaOutro('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')}}
                                style={{background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>
                                + Registrar
                              </button>
                            </div>
                            {showHpForm&&(
                              <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
                                <p style={{fontSize:'13px',fontWeight:700,color:'#93C5FD',marginBottom:'12px'}}>{editandoPagIdx!==null?'Editar':'Registrar pagamento'}</p>
                                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                    <div><label style={lbl}>Valor *</label><input style={inp} type="text" inputMode="numeric" placeholder="0,00" value={hpValor} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,'');setHpValor(fmtHpValor(v||'0'))}}/></div>
                                    <div><label style={lbl}>Data *</label><input style={inp} type="date" value={hpData} onChange={e=>setHpData(e.target.value)}/></div>
                                  </div>
                                  <div><label style={lbl}>Forma *</label>
                                    <select style={sel} value={hpForma} onChange={e=>{setHpForma(e.target.value);if(e.target.value!=='Outro')setHpFormaOutro('')}}>
                                      {['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}
                                    </select>
                                    {hpForma==='Outro'&&<input style={{...inp,marginTop:'6px'}} type="text" placeholder="Especifique..." value={hpFormaOutro} onChange={e=>setHpFormaOutro(e.target.value)}/>}
                                  </div>
                                  <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada, parcela 2..." value={hpObs} onChange={e=>setHpObs(e.target.value)}/></div>
                                  <div style={{display:'flex',gap:'8px'}}>
                                    <button onClick={()=>{setShowHpForm(false);setEditandoPagIdx(null)}} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                                    <button onClick={salvarHpPag} style={{flex:2,background:'linear-gradient(135deg,#3B82F6,#7C3AED)',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{editandoPagIdx!==null?'Atualizar':'Salvar pagamento'}</button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {histPags.length===0&&!showHpForm&&<p style={{fontSize:'12px',color:'#475569'}}>Nenhum pagamento registrado ainda.</p>}
                            {histPags.map((p,i)=>(
                              <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                                <div>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                                    <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                                    <span style={{fontSize:'11px',color:'#64748B'}}>{p.forma}</span>
                                    <span style={{fontSize:'11px',color:'#64748B'}}>· {fmtData(p.data)}</span>
                                  </div>
                                  {p.obs&&<p style={{fontSize:'12px',color:'#475569'}}>{p.obs}</p>}
                                </div>
                                <div style={{display:'flex',gap:'6px'}}>
                                  <button onClick={()=>editarHpPag(i)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.10)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                                  <button onClick={()=>excluirHpPag(i)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.22)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                                </div>
                              </div>
                            ))}
                            {histPags.length>0&&<div style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'8px',padding:'8px 14px',display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                              <span style={{fontSize:'13px',color:'#94A3B8',fontWeight:600}}>Total pago</span>
                              <span style={{fontSize:'14px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(valorPagoLocal)}</span>
                            </div>}
                          </div>
                        </div>
                      )}
                    </div>}
                    {tipoOrc!=='comum'&&<div style={{...card,padding:0,overflow:'hidden'}}>
                      <div onClick={()=>setShowObs(!showObs)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <span style={{fontSize:'16px'}}>📝</span>
                          <div>
                            <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Observações</p>
                            <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>Informações extras para o cliente ou equipe.</p>
                          </div>
                        </div>
                        <span style={{color:'#64748B',fontSize:'18px',transform:showObs?'rotate(180deg)':'none',transition:'transform .2s'}}>⌄</span>
                      </div>
                      {showObs&&<div style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'16px'}}>
                        <div><label style={lbl}>Observação do cliente</label><textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Alergias, preferências..." value={clienteObs} onChange={e=>setClienteObs(e.target.value)}/></div>
                        <div><label style={lbl}>Observações do orçamento</label><textarea rows={3} style={{...inp,resize:'none' as const}} placeholder="Informações adicionais..." value={observacoes} onChange={e=>setObservacoes(e.target.value)}/></div>
                      </div>}
                    </div>}
                    {tipoOrc==='comum'&&(
                      <div style={{marginTop:'4px',marginBottom:'12px'}}>
                        <label style={lbl}>Observações (opcional)</label>
                        <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Ex: cliente preferiu parcelar, combinado via Pix..." value={observacoes} onChange={e=>setObservacoes(e.target.value)}/>
                      </div>
                    )}
                    <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',background:'rgba(59,130,246,.08)',borderRadius:'10px',border:'1px solid rgba(59,130,246,.18)'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <p style={{fontSize:'12px',color:'#93C5FD'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>
                    </div>
                  </div>
                  <div className="cm-form-right" style={{position:'sticky',top:'24px'}}>
                    <div style={{background:'rgba(255,255,255,.06)',borderRadius:'16px',padding:'20px',border:'1px solid rgba(255,255,255,.1)',boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'16px'}}>Resumo</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
                        <div><p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Cliente</p><p style={{fontSize:'14px',fontWeight:600,color:clienteNome?'#fff':'#475569'}}>{clienteNome||'Não informado'}</p></div>
                        <div><p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Tipo</p><p style={{fontSize:'14px',color:'#CBD5E1'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</p></div>
                        <div style={{height:'1px',background:'rgba(255,255,255,.08)'}}/>
                        <div><p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>Total final</p><p style={{fontSize:'24px',fontWeight:800,color:'#60A5FA',letterSpacing:'-0.02em'}}>R$ {fmtBRL(total)}</p></div>
                        {valorPagoLocal>0&&<div><p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Pago</p><p style={{fontSize:'16px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(valorPagoLocal)}</p></div>}
                        {saldoLocal>0&&<div><p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'2px'}}>Saldo</p><p style={{fontSize:'16px',fontWeight:700,color:'#FBBF24'}}>R$ {fmtBRL(saldoLocal)}</p></div>}
                        <div><p style={{fontSize:'11px',fontWeight:600,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>Status</p><span style={{fontSize:'12px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:STATUS_COR[status]?.bg,color:STATUS_COR[status]?.color,border:`1px solid ${STATUS_COR[status]?.border}`}}>{status}</span></div>
                      </div>
                      <button onClick={handleSalvar} style={{width:'100%',background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'8px',padding:'13px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:'8px'}}>
                        {editandoId?'Salvar alterações':'Criar orçamento'}
                      </button>
                      <button onClick={enviarCobrancaWpp} disabled={!clienteWpp} style={{width:'100%',background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'11px',fontSize:'14px',fontWeight:600,cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',marginBottom:'8px',opacity:clienteWpp?1:0.6}}>
                        💬 Enviar no WhatsApp
                      </button>
                      <button onClick={()=>{resetForm();setView('lista')}} style={{width:'100%',background:'rgba(255,255,255,.06)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                        Salvar como rascunho
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cm-mobile-footer">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total final</span>
                  <span style={{fontSize:'18px',fontWeight:800,color:'#60A5FA'}}>R$ {fmtBRL(total)}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                  <button onClick={()=>{resetForm();setView('lista')}} style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
                  <button onClick={handleSalvar} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar':'Criar orçamento'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {view==='detalhe'&&orcDetalhe&&(()=>{
          const orc=orcDetalhe
          const cfg=STATUS_COR[orc.status]||STATUS_COR['Aberto']
          return(
            <div style={{padding:'28px 32px 60px',maxWidth:'900px',margin:'0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
                <button onClick={()=>{setView('lista');setShowPagForm(false)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit'}}>← Voltar</button>
                <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC'}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{orc.status}</span>
              </div>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',color:'#4ADE80'}}>{mensagem}</div>}
              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'14px'}}>📊 Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                  {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(
                    <div key={f.l} style={{background:'rgba(255,255,255,.06)',borderRadius:'8px',padding:'12px',border:'1px solid rgba(148,163,184,.12)'}}>
                      <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'4px'}}>{f.l}</p>
                      <p style={{fontSize:'18px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>setShowPagForm(!showPagForm)} style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Registrar pagamento</button>
                  <button onClick={()=>gerarPDF(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>enviarWpp(orc)} style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Copiar link</button>}
                  <button onClick={()=>abrirEditar(orc)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                </div>
                {showPagForm&&(
                  <div style={{marginTop:'14px',background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'10px',padding:'16px'}}>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#93C5FD',marginBottom:'12px'}}>Registrar pagamento</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                      <div><label style={lbl}>Data</label><input type="date" value={pagData} onChange={e=>setPagData(e.target.value)} style={inp}/></div>
                      <div><label style={lbl}>Valor (R$)</label><input type="number" placeholder="0,00" value={pagValor} onChange={e=>setPagValor(e.target.value)} style={inp}/></div>
                    </div>
                    <div style={{marginBottom:'10px'}}><label style={lbl}>Forma</label>
                      <select value={pagForma} onChange={e=>setPagForma(e.target.value)} style={sel}>
                        {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Link de pagamento','Outro'].map(f=><option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{marginBottom:'12px'}}><label style={lbl}>Observação</label><input type="text" placeholder="Opcional" value={pagObs} onChange={e=>setPagObs(e.target.value)} style={inp}/></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>setShowPagForm(false)} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                      <button disabled={savingPag} onClick={()=>handleRegistrarPagamento(orc)} style={{flex:2,background:'linear-gradient(135deg,#3B82F6,#7C3AED)',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>{savingPag?'Salvando...':'Confirmar pagamento'}</button>
                    </div>
                  </div>
                )}
              </div>
              {orc.servicos?.length>0&&(
                <div style={card}>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>🛎 Serviços</p>
                  {(orc.servicos||[]).map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                      <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{s.nome}</p><p style={{fontSize:'11px',color:'#9CA3AF'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,paddingTop:'10px',marginTop:'4px'}}>
                    <span style={{color:'#F8FAFC'}}>Total</span><span style={{color:'#60A5FA'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}
              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>📜 Histórico de pagamentos</p>
                {pagamentos.length===0?<p style={{fontSize:'13px',color:'#9CA3AF'}}>Nenhum pagamento registrado.</p>
                :pagamentos.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                    <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.observacao&&<p style={{fontSize:'11px',color:'#9CA3AF'}}>{p.observacao}</p>}</div>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'10px'}}>👤 Cliente</p>
                <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'4px'}}>{orc.cliente_nome}</p>
                {orc.cliente_whatsapp&&<p style={{fontSize:'13px',color:'#64748B',marginBottom:'2px'}}>📱 {aplicarMascaraTel(orc.cliente_whatsapp)}</p>}
                {orc.cliente_email&&<p style={{fontSize:'13px',color:'#64748B'}}>✉️ {orc.cliente_email}</p>}
                {orc.observacoes&&<p style={{fontSize:'13px',color:'#9CA3AF',marginTop:'8px'}}>{orc.observacoes}</p>}
              </div>
            </div>
          )
        })()}
      </div>
    {modalPagOrc&&(
      <>
        <div onClick={()=>setModalPagOrc(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(6px)',zIndex:80}}/>
        <div style={{position:'fixed',zIndex:90,background:'linear-gradient(145deg,#0B1628,#101B2D)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'24px',padding:'28px',boxShadow:'0 24px 80px rgba(0,0,0,.6)',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(92vw,480px)',maxHeight:'90vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
            <div>
              <p style={{fontSize:'11px',fontWeight:700,color:'#4ADE80',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Orçamento</p>
              <p style={{fontSize:'18px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>Confirmar pagamento</p>
            </div>
            <button onClick={()=>setModalPagOrc(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'22px',lineHeight:1}}>x</button>
          </div>
          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'16px',marginBottom:'20px'}}>
            {[{l:'Cliente',v:modalPagOrc.cliente_nome,c:'#F8FAFC'},{l:'Total do orçamento',v:'R$ '+fmtBRL(modalPagOrc.total),c:'#F8FAFC'},{l:'Já pago',v:'R$ '+fmtBRL(modalPagOrc.valor_pago||0),c:'#4ADE80'},{l:'Saldo restante',v:'R$ '+fmtBRL(modalPagOrc.saldo_restante||0),c:'#FBBF24'}].map(({l,v,c:cor})=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'8px'}}>
                <span style={{color:'#64748B'}}>{l}</span>
                <span style={{fontWeight:700,color:cor}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'14px',marginBottom:'20px'}}>
            <div>
              <label style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Valor recebido *</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span>
                <input type='text' inputMode='decimal' value={modalValor}
                  onChange={e=>setModalValor(e.target.value.replace(/[^0-9,]/g,''))}
                  style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'10px',padding:'12px 14px 12px 36px',fontSize:'16px',fontWeight:700,color:'#4ADE80',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Forma de pagamento</label>
              <select value={modalForma} onChange={e=>setModalForma(e.target.value)}
                style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'10px',padding:'12px 14px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const,cursor:'pointer'}}>
                {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Outro'].map(f=><option key={f} style={{background:'#0B1628'}}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Observação (opcional)</label>
              <input type='text' value={modalObs} onChange={e=>setModalObs(e.target.value)}
                placeholder='Ex: entrada, parcela final...'
                style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'10px',padding:'12px 14px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}}/>
            </div>
          </div>
          {modalErro&&<div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#F87171',marginBottom:'14px'}}>{modalErro}</div>}
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={()=>setModalPagOrc(null)}
              style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',padding:'14px',color:'#94A3B8',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Cancelar
            </button>
            <button onClick={confirmarPagamentoModal} disabled={modalSaving}
              style={{flex:2,background:'linear-gradient(135deg,#22C55E,#16A34A)',border:'none',borderRadius:'14px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:modalSaving?0.7:1}}>
              {modalSaving?'Registrando...':'Confirmar recebimento'}
            </button>
          </div>
        </div>
      </>
    )}
    </div>
  )
}
