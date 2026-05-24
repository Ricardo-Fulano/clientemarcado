'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_COR: Record<string, { bg: string; color: string; border: string }> = {
  'Aberto':                { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', border: 'rgba(59,130,246,0.25)' },
  'Aguardando aprovação':  { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  'Em andamento':          { bg: 'rgba(168,85,247,0.12)', color: '#A855F7', border: 'rgba(168,85,247,0.25)' },
  'Parcialmente pago':     { bg: 'rgba(249,115,22,0.12)', color: '#F97316', border: 'rgba(249,115,22,0.25)' },
  'Pago':                  { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)'  },
  'Finalizado':            { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', border: 'rgba(34,197,94,0.2)'   },
  'Cancelado':             { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', border: 'rgba(239,68,68,0.25)'  },
}

function fmtBRL(v: number) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}
function fmtData(d: string) {
  if (!d) return ''
  const [a,m,di] = d.split('-')
  return `${di}/${m}/${a}`
}
function aplicarMascaraTel(v: string) {
  const n = v.replace(/\D/g,'').slice(0,11)
  if (n.length > 10) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length > 6)  return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if (n.length > 2)  return `(${n.slice(0,2)}) ${n.slice(2)}`
  if (n.length > 0)  return `(${n}`
  return ''
}

export default function Orcamentos() {
  const [userId, setUserId] = useState('')
  const [perfil, setPerfil] = useState<any>(null)
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [view, setView] = useState<'lista' | 'form' | 'detalhe'>('lista')
  const [editandoId, setEditandoId] = useState<string|null>(null)
  const [detalheId, setDetalheId] = useState<string|null>(null)
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [mensagem, setMensagem] = useState('')
  const [savingPag, setSavingPag] = useState(false)

  // Form fields
  const [clienteNome, setClienteNome] = useState('')
  const [clienteWpp, setClienteWpp] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteObs, setClienteObs] = useState('')
  const [tipo, setTipo] = useState('Orçamento')
  const [tipoOutro, setTipoOutro] = useState('')
  const [tipoDescricao, setTipoDescricao] = useState('')
  const [profId, setProfId] = useState('')
  const [profNome, setProfNome] = useState('')
  const [salvarFreelancer, setSalvarFreelancer] = useState(false)
  const [dataDoc, setDataDoc] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('Aberto')
  const [itens, setItens] = useState<any[]>([{ nome:'', qtd:1, unitario:'', total:0, obs:'' }])
  const [desconto, setDesconto] = useState('')
  const [exigirSinal, setExigirSinal] = useState(false)
  const [sinalTipo, setSinalTipo] = useState('fixo')
  const [sinalValor, setSinalValor] = useState('')
  const [linkPag, setLinkPag] = useState('')
  const [obsPagamento, setObsPagamento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [dentesSelec, setDentesSelec] = useState<number[]>([])
  const [procOdonto, setProcOdonto] = useState<any[]>([])
  const [procNome, setProcNome] = useState('')
  const [procValor, setProcValor] = useState('')
  const [procStatus, setProcStatus] = useState('A realizar')
  const [procObs, setProcObs] = useState('')

  // Novo pagamento
  const [pagData, setPagData] = useState(new Date().toISOString().split('T')[0])
  const [pagValor, setPagValor] = useState('')
  const [pagForma, setPagForma] = useState('Pix')
  const [pagObs, setPagObs] = useState('')
  const [showPagForm, setShowPagForm] = useState(false)
  const [step, setStep] = useState(1) // 1=Cliente, 2=Serviços, 3=Pagamento
  const [showLinkPag, setShowLinkPag] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [showDesconto, setShowDesconto] = useState(false)
  const [showObs, setShowObs] = useState(false)
  const [showSinal, setShowSinal] = useState(false)

  // Histórico de pagamentos (novo orçamento — salvo no JSON do orçamento)
  const [histPags, setHistPags] = useState<any[]>([])
  const [editandoPagIdx, setEditandoPagIdx] = useState<number|null>(null)
  const [hpValor, setHpValor] = useState('')
  const [hpForma, setHpForma] = useState('Pix')
  const [hpFormaOutro, setHpFormaOutro] = useState('')
  const [hpData, setHpData] = useState(new Date().toISOString().split('T')[0])
  const [hpObs, setHpObs] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)
    const { data: profs } = await supabase.from('profissionais').select('id,nome').eq('user_id', user.id)
    setProfissionais(profs || [])
    await carregarOrcamentos(user.id)
    setLoading(false)
  }

  async function carregarOrcamentos(uid?: string) {
    const id = uid || userId
    const { data } = await supabase.from('orcamentos').select('*').eq('user_id', id).order('created_at', { ascending: false })
    setOrcamentos(data || [])
  }

  async function carregarPagamentos(orcId: string) {
    const { data } = await supabase.from('orcamento_pagamentos').select('*').eq('orcamento_id', orcId).order('data', { ascending: false })
    setPagamentos(data || [])
  }

  // Cálculos
  const subtotal = itens.reduce((a, i) => a + (parseFloat(i.unitario || '0') * (parseInt(i.qtd) || 1)), 0)
    + procOdonto.reduce((a, p) => a + parseFloat(p.valor || '0'), 0)
  const descontoNum = parseFloat(desconto || '0')
  const total = Math.max(0, subtotal - descontoNum)

  function atualizarItem(idx: number, campo: string, val: any) {
    setItens(prev => {
      const n = [...prev]
      n[idx] = { ...n[idx], [campo]: val }
      if (campo === 'unitario' || campo === 'qtd') {
        n[idx].total = parseFloat(n[idx].unitario || '0') * (parseInt(n[idx].qtd) || 1)
      }
      return n
    })
  }

  function resetForm() {
    setClienteNome(''); setClienteWpp(''); setClienteEmail(''); setClienteObs('')
    setTipo('Orçamento'); setTipoOutro(''); setTipoDescricao(''); setProfId(''); setProfNome(''); setSalvarFreelancer(false); setDataDoc(new Date().toISOString().split('T')[0])
    setStatus('Aberto'); setItens([{ nome:'', qtd:1, unitario:'', total:0, obs:'' }])
    setDesconto(''); setExigirSinal(false); setSinalTipo('fixo'); setSinalValor('')
    setLinkPag(''); setObsPagamento(''); setObservacoes(''); setHistPags([]); setEditandoPagIdx(null); setHpValor(''); setHpForma('Pix'); setHpFormaOutro(''); setHpObs(''); setStep(1); setShowLinkPag(false); setShowSinal(false); setShowDetalhes(false); setShowDesconto(false); setShowObs(false); setDentesSelec([]); setProcOdonto([])
    setEditandoId(null)
  }

  function abrirEditar(orc: any) {
    setEditandoId(orc.id)
    setClienteNome(orc.cliente_nome || ''); setClienteWpp(aplicarMascaraTel(orc.cliente_whatsapp || ''))
    setClienteEmail(orc.cliente_email || ''); setClienteObs(orc.cliente_obs || '')
    const tipoSalvo = orc.tipo || 'Orçamento'
    const tiposPadrao = ['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno']
    if (tiposPadrao.includes(tipoSalvo)) { setTipo(tipoSalvo); setTipoOutro(''); setTipoDescricao('') } else { setTipo('__outro__'); setTipoOutro(tipoSalvo); setTipoDescricao(orc.tipo_descricao || '') }
    setProfId(orc.profissional_id || ''); setProfNome(orc.profissional_nome || ''); setSalvarFreelancer(false)
    setDataDoc(orc.data || new Date().toISOString().split('T')[0]); setStatus(orc.status || 'Aberto')
    setItens(orc.servicos?.length ? orc.servicos : [{ nome:'', qtd:1, unitario:'', total:0, obs:'' }])
    setDesconto(orc.desconto ? String(orc.desconto) : ''); setExigirSinal(orc.exigir_sinal || false)
    setSinalTipo(orc.sinal_tipo || 'fixo'); setSinalValor(orc.sinal_valor ? String(orc.sinal_valor) : '')
    setLinkPag(orc.link_pagamento || ''); setObsPagamento(orc.obs_pagamento || ''); setObservacoes(orc.observacoes || ''); setHistPags(orc.hist_pagamentos || [])
    setDentesSelec(orc.dentes_selecionados || []); setProcOdonto(orc.procedimentos_odonto || [])
    setView('form')
  }

  async function handleSalvar() {
    setMensagem('')
    const erros: string[] = []

    if (!clienteNome.trim()) erros.push('Informe o nome do cliente.')
    if (!clienteWpp || clienteWpp.replace(/\D/g,'').length < 10) erros.push('Informe o WhatsApp do cliente com DDD.')
    if (tipo === '__outro__' && !tipoOutro.trim()) erros.push('Especifique o nome do tipo do documento.')
    if (profId === '__outro__' && !profNome.trim()) erros.push('Informe o nome do profissional responsável.')

    const itensValidos = itens.filter(i => i.nome?.trim() && parseFloat(i.unitario||'0') > 0 && parseInt(i.qtd||'1') > 0)
    if (itensValidos.length === 0) erros.push('Adicione pelo menos um serviço com nome, quantidade e valor.')

    if (erros.length > 0) {
      console.log('Erros de validação:', erros)
      setMensagem(erros.join(' | '))
      window.scrollTo({ top: 300, behavior: 'smooth' })
      return
    }

    const payload = {
      user_id: userId,
      cliente_nome: clienteNome.trim(),
      cliente_whatsapp: clienteWpp.replace(/\D/g,''),
      cliente_email: clienteEmail || null,
      cliente_obs: clienteObs || null,
      tipo: tipo === '__outro__' ? (tipoOutro.trim() || 'Outro') : tipo,
      tipo_descricao: tipo === '__outro__' ? (tipoDescricao.trim() || null) : null,
      profissional_id: (profId && profId !== '__outro__') ? profId : null,
      profissional_nome: profId === '__outro__' ? (profNome.trim() || null) : profId ? (profissionais.find(p => p.id === profId)?.nome || null) : null,
      data: dataDoc, status,
      servicos: itensValidos,
      subtotal, desconto: descontoNum, total,
      valor_pago: valorPagoLocal,
      saldo_restante: saldoLocal,
      exigir_sinal: exigirSinal,
      sinal_tipo: exigirSinal ? sinalTipo : null,
      sinal_valor: exigirSinal ? parseFloat(sinalValor || '0') : null,
      link_pagamento: linkPag || null,
      obs_pagamento: obsPagamento.trim() || null,
      hist_pagamentos: histPags,
      dentes_selecionados: dentesSelec,
      procedimentos_odonto: procOdonto,
      observacoes: observacoes || null,
      updated_at: new Date().toISOString(),
    }

    console.log('Tentando criar orçamento', payload)

    if (editandoId) {
      const { error } = await supabase.from('orcamentos').update(payload).eq('id', editandoId)
      if (error) {
        console.error('Erro ao atualizar:', error)
        setMensagem('Erro ao salvar. Tente novamente.')
        return
      }
    } else {
      const { error } = await supabase.from('orcamentos').insert(payload)
      if (error) {
        console.error('Erro ao criar:', error)
        setMensagem('Erro ao criar orçamento. Verifique os dados e tente novamente.')
        return
      }
    }

    if (profId === '__outro__' && profNome.trim() && salvarFreelancer) {
      await supabase.from('profissionais').insert({ user_id: userId, nome: profNome.trim(), especialidade: 'Freelancer' })
      const { data: profs } = await supabase.from('profissionais').select('id,nome').eq('user_id', userId)
      setProfissionais(profs || [])
    }

    console.log('Orçamento criado com sucesso')
    resetForm()
    setView('lista')
    await carregarOrcamentos()
    setMensagem(editandoId ? 'Orçamento atualizado com sucesso.' : 'Orçamento criado com sucesso.')
    setTimeout(() => setMensagem(''), 4000)
  }

  async function handleExcluir(id: string) {
    if (!window.confirm('Excluir este orçamento?')) return
    await supabase.from('orcamentos').delete().eq('id', id)
    await carregarOrcamentos()
  }

  async function handleRegistrarPagamento(orc: any) {
    const valor = parseFloat(pagValor.replace(/\D/g,'') || '0') / 100
    if (!valor) { setMensagem('Informe o valor.'); return }
    setSavingPag(true)
    await supabase.from('orcamento_pagamentos').insert({
      orcamento_id: orc.id, user_id: userId,
      data: pagData, valor, forma: pagForma, observacao: pagObs || null
    })
    const novoValorPago = (orc.valor_pago || 0) + valor
    const novoSaldo = Math.max(0, (orc.total || 0) - novoValorPago)
    let novoStatus = orc.status
    if (novoValorPago >= orc.total) novoStatus = 'Pago'
    else if (novoValorPago > 0) novoStatus = 'Parcialmente pago'
    await supabase.from('orcamentos').update({
      valor_pago: novoValorPago, saldo_restante: novoSaldo, status: novoStatus, updated_at: new Date().toISOString()
    }).eq('id', orc.id)
    setSavingPag(false); setShowPagForm(false)
    setPagValor(''); setPagObs(''); setPagForma('Pix')
    await carregarOrcamentos(); await carregarPagamentos(orc.id)
    // Update local detalhe
    const { data } = await supabase.from('orcamentos').select('*').eq('id', orc.id).single()
    if (data) setOrcamentos(prev => prev.map(o => o.id === orc.id ? data : o))
    setMensagem('Pagamento registrado!')
    setTimeout(() => setMensagem(''), 3000)
  }

  function enviarWpp(orc: any) {
    const tel = (orc.cliente_whatsapp || '').replace(/\D/g,'')
    if (!tel) return
    let msg = `Olá, ${orc.cliente_nome}. Tudo bem?\n\nSegue o resumo do seu ${orc.tipo?.toLowerCase() || 'atendimento'}:\n\nTipo: ${orc.tipo}\nValor total: R$ ${fmtBRL(orc.total)}\nValor pago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo restante: R$ ${fmtBRL(orc.saldo_restante)}`
    if (orc.link_pagamento) msg += `\n\nLink para pagamento:\n${orc.link_pagamento}`
    msg += `\n\nApós realizar o pagamento, envie o comprovante por aqui para confirmação.\n\nObrigado.`
    window.open('https://wa.me/55' + tel + '?text=' + encodeURIComponent(msg), '_blank')
  }

  function gerarPDF(orc: any) {
    const win = window.open('', '_blank')
    if (!win) return
    const linhasServicos = (orc.servicos || []).map((s: any) =>
      `<tr><td>${s.nome}</td><td style="text-align:center">${s.qtd || 1}</td><td style="text-align:right">R$ ${fmtBRL(parseFloat(s.unitario||'0'))}</td><td style="text-align:right">R$ ${fmtBRL(s.total||0)}</td></tr>`
    ).join('')
    const linhasOdonto = (orc.procedimentos_odonto || []).map((p: any) =>
      `<tr><td>${p.dente ? 'Dente '+p.dente+' - ' : ''}${p.nome}</td><td style="text-align:center">1</td><td style="text-align:right">R$ ${fmtBRL(parseFloat(p.valor||'0'))}</td><td style="text-align:right">R$ ${fmtBRL(parseFloat(p.valor||'0'))}</td></tr>`
    ).join('')
    const linhasPag = (pagamentos || []).map((p: any) =>
      `<tr><td>${fmtData(p.data)}</td><td>${p.forma}</td><td style="text-align:right">R$ ${fmtBRL(p.valor)}</td><td>${p.observacao||''}</td></tr>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orc.tipo} - ${orc.cliente_nome}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px;color:#1a1a1a}h1{font-size:22px;margin-bottom:4px}h2{font-size:14px;color:#555;font-weight:normal;margin-bottom:24px}.header{display:flex;justify-content:space-between;border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:24px}.sec{margin-bottom:20px}.sec-title{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:6px 8px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.06em}td{padding:6px 8px;border-bottom:1px solid #f0f0f0}.total-row{font-weight:bold;background:#f9f9f9}.badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;background:#e8f5e9;color:#2e7d32}.footer{margin-top:40px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:16px}</style>
</head><body>
<div class="header">
  <div><h1>${perfil?.nome_negocio || 'Negócio'}</h1><h2>${orc.tipo} · ${fmtData(orc.data)}</h2>${perfil?.whatsapp?`<p style="font-size:13px">WhatsApp: ${perfil.whatsapp}</p>`:''}</div>
  <div style="text-align:right"><span class="badge">${orc.status}</span><p style="font-size:13px;margin-top:8px">${orc.profissional_nome||''}</p></div>
</div>
<div class="sec"><div class="sec-title">Cliente</div>
<p><strong>${orc.cliente_nome}</strong></p>
<p style="font-size:13px">WhatsApp: ${orc.cliente_whatsapp||''}</p>
${orc.cliente_email?`<p style="font-size:13px">E-mail: ${orc.cliente_email}</p>`:''}
</div>
<div class="sec"><div class="sec-title">Serviços / Procedimentos</div>
<table><thead><tr><th>Item</th><th style="text-align:center">Qtd</th><th style="text-align:right">Unitário</th><th style="text-align:right">Total</th></tr></thead><tbody>
${linhasServicos}${linhasOdonto}
<tr class="total-row"><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">R$ ${fmtBRL(orc.subtotal)}</td></tr>
${orc.desconto?`<tr><td colspan="3" style="text-align:right">Desconto</td><td style="text-align:right">- R$ ${fmtBRL(orc.desconto)}</td></tr>`:''}
<tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">R$ ${fmtBRL(orc.total)}</td></tr>
</tbody></table></div>
<div class="sec"><div class="sec-title">Pagamentos</div>
<table><tr><td>Valor total</td><td style="text-align:right"><strong>R$ ${fmtBRL(orc.total)}</strong></td></tr>
<tr><td>Valor pago</td><td style="text-align:right;color:#2e7d32"><strong>R$ ${fmtBRL(orc.valor_pago)}</strong></td></tr>
<tr><td>Saldo restante</td><td style="text-align:right;color:#c62828"><strong>R$ ${fmtBRL(orc.saldo_restante)}</strong></td></tr></table>
${linhasPag ? `<br><table><thead><tr><th>Data</th><th>Forma</th><th style="text-align:right">Valor</th><th>Obs</th></tr></thead><tbody>${linhasPag}</tbody></table>` : ''}
</div>
${orc.observacoes?`<div class="sec"><div class="sec-title">Observações</div><p style="font-size:13px">${orc.observacoes}</p></div>`:''}
<div class="footer">Documento gerado pelo ClienteMarcado</div>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  const isOdonto = perfil?.tipo_negocio?.toLowerCase().includes('odont')
  const DENTES_SUPERIOR = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
  const DENTES_INFERIOR = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

  function toggleDente(n: number) {
    setDentesSelec(prev => prev.includes(n) ? prev.filter(d => d !== n) : [...prev, n])
  }

  function adicionarProcOdonto() {
    if (!procNome || dentesSelec.length === 0) return
    const novos = dentesSelec.map(d => ({ dente: d, nome: procNome, valor: procValor, status: procStatus, obs: procObs }))
    setProcOdonto(prev => [...prev, ...novos])
    setProcNome(''); setProcValor(''); setProcObs(''); setProcStatus('A realizar')
    setDentesSelec([])
  }

  const orcsFiltrados = orcamentos.filter(o => {
    const passaStatus = filtroStatus === 'Todos' || o.status === filtroStatus
    const passaCliente = !filtroCliente || o.cliente_nome?.toLowerCase().includes(filtroCliente.toLowerCase())
    return passaStatus && passaCliente
  })

  const totalAberto    = orcamentos.filter(o => o.status === 'Aberto' || o.status === 'Em andamento' || o.status === 'Parcialmente pago').length
  const totalAReceber  = orcamentos.filter(o => !['Pago','Finalizado','Cancelado'].includes(o.status)).reduce((a,o) => a + (o.saldo_restante||0), 0)
  const mesAtual       = new Date().toISOString().slice(0,7)
  const recebidoMes    = orcamentos.filter(o => o.updated_at?.slice(0,7) === mesAtual && o.valor_pago > 0).reduce((a,o) => a + (o.valor_pago||0), 0)
  const parciais        = orcamentos.filter(o => o.status === 'Parcialmente pago').length

  function gerarMensagemCobranca() {
    const nomeCliente = clienteNome || 'cliente'
    const tipoDoc = tipo === '__outro__' ? tipoOutro : tipo
    const nomeNegocio = perfil?.nome_negocio || 'nosso negócio'
    const entradaValor = exigirSinal
      ? sinalTipo === 'fixo'
        ? parseFloat(sinalValor || '0')
        : (total * parseFloat(sinalValor || '0')) / 100
      : 0
    let msg = `Olá, ${nomeCliente}! Aqui é d${nomeNegocio.match(/^[aeiouAEIOU]/) ? 'a ' : 'o '}${nomeNegocio}.\n\nSeu ${tipoDoc} ficou no valor de R$ ${fmtBRL(total)}.`
    if (entradaValor > 0) msg += `\nEntrada necessária: R$ ${fmtBRL(entradaValor)}.`
    msg += `\nValor pago até agora: R$ 0,00.\nSaldo restante: R$ ${fmtBRL(total)}.`
    if (linkPag) msg += `\n\nVocê pode realizar o pagamento pelo link abaixo:\n${linkPag}`
    msg += `\n\nApós o pagamento, envie o comprovante por aqui. Obrigado!`
    return msg
  }

  function enviarCobrancaWpp() {
    const tel = clienteWpp.replace(/\D/g,'')
    if (!tel) return
    window.open('https://wa.me/55' + tel + '?text=' + encodeURIComponent(gerarMensagemCobranca()), '_blank')
  }

  const valorPagoLocal = histPags.reduce((a, p) => a + parseFloat(p.valor||'0'), 0)
  const saldoLocal = Math.max(0, total - valorPagoLocal)

  function fmtHpValor(raw: string) {
    const nums = raw.replace(/\D/g,'')
    if (!nums) return ''
    return (parseInt(nums,10)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})
  }
  function parseHpValor(v: string) {
    return parseFloat(v.replace(/\./g,'').replace(',','.')) || 0
  }

  function salvarHpPag() {
    const valor = parseHpValor(hpValor)
    if (!valor || valor <= 0) { setMensagem('Informe um valor maior que R$ 0,00.'); return }
    if (hpForma === 'Outro' && !hpFormaOutro.trim()) { setMensagem('Especifique a forma de pagamento.'); return }
    const forma = hpForma === 'Outro' ? hpFormaOutro.trim() : hpForma
    const novoPag = { valor, forma, data: hpData, obs: hpObs.trim() || '' }
    if (editandoPagIdx !== null) {
      setHistPags(prev => prev.map((p,i) => i === editandoPagIdx ? novoPag : p))
      setEditandoPagIdx(null)
    } else {
      setHistPags(prev => [...prev, novoPag])
    }
    setHpValor(''); setHpForma('Pix'); setHpFormaOutro(''); setHpData(new Date().toISOString().split('T')[0]); setHpObs('')
    setShowPagForm(false)
  }

  function editarHpPag(idx: number) {
    const p = histPags[idx]
    const formasPadrao = ['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento']
    setEditandoPagIdx(idx)
    setHpValor(fmtHpValor(String(Math.round(p.valor*100))))
    setHpForma(formasPadrao.includes(p.forma) ? p.forma : 'Outro')
    setHpFormaOutro(formasPadrao.includes(p.forma) ? '' : p.forma)
    setHpData(p.data)
    setHpObs(p.obs || '')
    setShowPagForm(true)
  }

  function excluirHpPag(idx: number) {
    setHistPags(prev => prev.filter((_,i) => i !== idx))
    if (editandoPagIdx === idx) { setEditandoPagIdx(null); setShowPagForm(false) }
  }

  const orcDetalhe = orcamentos.find(o => o.id === detalheId)

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg { min-height:100vh; background:#F5F6FA; color:#F1F5F9; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .nav { display:flex; align-items:center; justify-content:space-between; padding:0 20px; height:54px; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(9,9,11,0.98); backdrop-filter:blur(12px); position:sticky; top:0; z-index:20; }
    .nav-logo { font-size:15px; font-weight:800; color:#F1F5F9; letter-spacing:-0.02em; }
    .nav-back { font-size:13px; color:#6B7280; text-decoration:none; }
    .body { max-width:1040px; margin:0 auto; padding:24px 16px 56px; }
    @media(min-width:720px){ .body{ padding:32px 24px 64px; } }

    /* Cards métricas */
    .metricas { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:28px; }
    @media(min-width:540px){ .metricas{ grid-template-columns:repeat(4,1fr); } }
    .metrica {
      background:linear-gradient(160deg,rgba(22,28,42,1) 0%,rgba(12,15,22,1) 100%);
      border:1px solid rgba(255,255,255,.12);
      border-radius:14px; padding:18px; position:relative; overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);
    }
    .m-accent { position:absolute; top:0; left:0; right:0; height:2px; }
    .m-label { font-size:11px; font-weight:600; color:#9CA3AF; margin-bottom:10px; text-transform:uppercase; letter-spacing:.05em; }
    .m-valor { font-size:22px; font-weight:800; letter-spacing:-0.02em; }

    /* Filtros */
    .filtros { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; align-items:center; }
    .chip {
      padding:7px 15px; border-radius:999px; font-size:12px; font-weight:600; cursor:pointer;
      border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06);
      color:#9CA3AF; font-family:inherit; -webkit-tap-highlight-color:transparent; transition:all .15s;
    }
    .chip:hover { background:rgba(255,255,255,.1); color:#D1D5DB; border-color:rgba(255,255,255,.2); }
    .chip.on { background:#3B82F6; color:#fff; border-color:#3B82F6; box-shadow:0 0 0 2px rgba(59,130,246,.25); }
    .search-input {
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14);
      border-radius:10px; padding:9px 16px; color:#E5E7EB; font-size:14px; outline:none;
      width:100%; font-family:inherit; transition:border-color .15s, box-shadow .15s;
    }
    @media(min-width:540px){ .search-input{ width:320px; } }
    @media(min-width:900px){ .search-input{ width:380px; } }
    .search-input:focus { border-color:rgba(59,130,246,.5); box-shadow:0 0 0 3px rgba(59,130,246,.1); }
    .search-input::placeholder { color:#6B7280; }

    /* Cabeçalho */
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
    .btn-novo {
      background:#3B82F6; color:#fff; border:none; border-radius:10px; padding:11px 20px;
      font-size:14px; font-weight:700; cursor:pointer; font-family:inherit;
      box-shadow:0 4px 20px rgba(59,130,246,.4); transition:background .15s, box-shadow .15s;
      -webkit-tap-highlight-color:transparent; flex-shrink:0;
    }
    .btn-novo:hover { background:#2563EB; box-shadow:0 4px 24px rgba(59,130,246,.55); }

    /* Lista */
    .orc-lista { display:flex; flex-direction:column; gap:12px; }
    .orc-card {
      background:linear-gradient(160deg,rgba(22,28,42,1) 0%,rgba(12,15,22,1) 100%);
      border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:18px 20px;
      transition:border-color .15s, box-shadow .15s;
      box-shadow:0 2px 12px rgba(0,0,0,.4);
    }
    .orc-card:hover { border-color:rgba(59,130,246,.35); box-shadow:0 4px 24px rgba(0,0,0,.5); }
    .orc-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
    .orc-cliente { font-size:16px; font-weight:800; color:#F1F5F9; margin-bottom:3px; letter-spacing:-0.01em; }
    .orc-meta { font-size:12px; color:#6B7280; }
    .status-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:999px; border:1px solid; white-space:nowrap; }
    .orc-financeiro { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
    @media(max-width:400px){ .orc-financeiro{ grid-template-columns:1fr 1fr; } }
    .fin-item {
      background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07);
      border-radius:10px; padding:10px 12px;
    }
    .fin-label { font-size:10px; font-weight:600; color:#6B7280; margin-bottom:4px; text-transform:uppercase; letter-spacing:.05em; }
    .fin-valor { font-size:14px; font-weight:700; }
    .orc-acoes { display:flex; gap:6px; flex-wrap:wrap; }
    .btn-acao {
      padding:7px 13px; border-radius:8px; font-size:11px; font-weight:600; cursor:pointer;
      border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06);
      color:#9CA3AF; font-family:inherit; transition:all .15s; -webkit-tap-highlight-color:transparent;
    }
    .btn-acao:hover { background:rgba(255,255,255,.12); color:#F1F5F9; border-color:rgba(255,255,255,.2); }
    .btn-acao.primary { background:#3B82F6; color:#fff; border-color:#3B82F6; box-shadow:0 2px 8px rgba(59,130,246,.3); }
    .btn-acao.danger { color:#EF4444; border-color:rgba(239,68,68,.25); background:rgba(239,68,68,.06); }
    .btn-acao.green { background:rgba(34,197,94,.1); color:#22C55E; border-color:rgba(34,197,94,.25); }
    .btn-acao.wpp { background:rgba(37,211,102,.1); color:#25D366; border-color:rgba(37,211,102,.25); }

    /* FORM */
    .form-wrap { max-width:760px; margin:0 auto; }
    .form-section { background:linear-gradient(180deg,rgba(16,20,30,.98) 0%,rgba(10,12,18,.98) 100%); border:1px solid rgba(255,255,255,.09); border-radius:18px; padding:22px 18px; margin-bottom:16px; box-shadow:0 8px 32px rgba(0,0,0,.4); }
    @media(min-width:480px){ .form-section{ padding:24px 22px; } }
    .form-sec-title { font-size:14px; font-weight:700; color:#F1F5F9; margin-bottom:4px; }
    .form-sec-sub { font-size:12px; color:#6B7280; margin-bottom:18px; }
    .fields { display:flex; flex-direction:column; gap:14px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media(max-width:400px){ .row-2{ grid-template-columns:1fr; } }
    .label { display:block; font-size:11px; font-weight:600; color:#9CA3AF; text-transform:uppercase; letter-spacing:.07em; margin-bottom:7px; }
    .input,.select,.textarea { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:12px 16px; color:#F1F5F9; font-size:15px; outline:none; transition:border-color .15s,box-shadow .15s; font-family:inherit; -webkit-appearance:none; }
    .input:focus,.select:focus,.textarea:focus { border-color:rgba(59,130,246,.5); box-shadow:0 0 0 3px rgba(59,130,246,.1); }
    .input::placeholder,.textarea::placeholder { color:#374151; }
    .select { cursor:pointer; } .select option { background:#0F1117; color:#F1F5F9; }
    .textarea { resize:none; }
    .field-hint { font-size:11px; color:#374151; margin-top:5px; }

    /* Itens */
    .item-row { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:12px; margin-bottom:8px; }
    .item-grid { display:grid; grid-template-columns:3fr 1fr 1.5fr 1.5fr; gap:8px; align-items:end; }
    @media(max-width:480px){ .item-grid{ grid-template-columns:1fr 1fr; } }
    .item-total { font-size:13px; font-weight:700; color:#22C55E; padding:12px 0 4px; }
    .btn-add-item { background:rgba(59,130,246,.1); border:1px dashed rgba(59,130,246,.3); border-radius:10px; padding:10px; width:100%; color:#3B82F6; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
    .btn-add-item:hover { background:rgba(59,130,246,.15); }
    .btn-rm { background:none; border:none; color:#EF4444; cursor:pointer; font-size:18px; padding:0 4px; flex-shrink:0; }

    /* Subtotal */
    .subtotal-box { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:14px; }
    .subtotal-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; font-size:13px; }
    .subtotal-row.total { font-size:16px; font-weight:800; color:#F1F5F9; border-top:1px solid rgba(255,255,255,.08); margin-top:8px; padding-top:10px; }

    /* Pagamento */
    .pag-saldo { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
    @media(max-width:400px){ .pag-saldo{ grid-template-columns:1fr; } }
    .pag-item { background:rgba(255,255,255,.03); border-radius:10px; padding:12px 14px; }
    .pag-label { font-size:10px; color:#4B5563; margin-bottom:4px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
    .pag-valor { font-size:18px; font-weight:800; }

    /* Odontograma */
    .dentes-row { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px; }
    .dente-btn { width:34px; height:34px; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:#9CA3AF; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; -webkit-tap-highlight-color:transparent; }
    .dente-btn.sel { background:#3B82F6; border-color:#3B82F6; color:#fff; }
    .dente-sep { width:1px; background:rgba(255,255,255,.1); margin:0 4px; }

    /* Proc odonto */
    .proc-item { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; }
    .proc-nome { font-size:13px; color:#D1D5DB; }
    .proc-val { font-size:13px; color:#22C55E; font-weight:700; }

    /* Pag form */
    .pag-form { background:rgba(59,130,246,.05); border:1px solid rgba(59,130,246,.15); border-radius:12px; padding:16px; margin-top:12px; }

    /* Vazio */
    .vazio { background:linear-gradient(160deg,rgba(22,28,42,1) 0%,rgba(12,15,22,1) 100%); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:48px 24px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,.4); }
    .vazio p:first-child { font-size:15px; font-weight:600; color:#D1D5DB; margin-bottom:8px; }
    .vazio p:last-child { font-size:13px; color:#6B7280; line-height:1.6; }

    /* Msg */
    .msg-ok { font-size:13px; color:#22C55E; padding:10px 14px; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); border-radius:8px; margin-bottom:14px; }
    .msg-err { font-size:13px; color:#EF4444; padding:10px 14px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:8px; margin-bottom:14px; }

    /* Toggle */
    .toggle-row { display:flex; align-items:center; gap:10px; }
    .toggle { width:40px; height:22px; border-radius:999px; border:none; cursor:pointer; position:relative; transition:background .2s; }
    .toggle::after { content:''; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; }
    .toggle.on { background:#3B82F6; } .toggle.on::after { transform:translateX(18px); }
    .toggle.off { background:rgba(255,255,255,.15); }

    .btn-salvar { width:100%; background:#3B82F6; color:#fff; border:none; border-radius:12px; padding:14px; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(59,130,246,.3); transition:background .15s; font-family:inherit; -webkit-tap-highlight-color:transparent; }
    .btn-salvar:hover { background:#2563EB; }
    .btn-secundario { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:12px; font-size:14px; font-weight:600; color:#9CA3AF; cursor:pointer; font-family:inherit; width:100%; margin-bottom:10px; transition:all .15s; }
    .btn-secundario:hover { background:rgba(255,255,255,.09); color:#D1D5DB; }
    .form-btns { display:flex; gap:10px; }

    /* Steps */
    .steps { display:flex; align-items:center; gap:0; margin-bottom:28px; }
    .step-item { display:flex; align-items:center; gap:0; flex:1; }
    .step-circle { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex-shrink:0; transition:all .2s; }
    .step-circle.done { background:#22C55E; color:#fff; }
    .step-circle.active { background:#3B82F6; color:#fff; box-shadow:0 0 0 3px rgba(59,130,246,.25); }
    .step-circle.idle { background:rgba(255,255,255,.08); color:#4B5563; }
    .step-label { font-size:11px; font-weight:600; margin-left:8px; white-space:nowrap; }
    .step-label.done { color:#22C55E; }
    .step-label.active { color:#F1F5F9; }
    .step-label.idle { color:#4B5563; }
    .step-line { flex:1; height:1px; background:rgba(255,255,255,.08); margin:0 6px; }
    .step-line.done { background:#22C55E; }

    /* Action buttons */
    .btn-action { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:10px 16px; font-size:13px; font-weight:600; color:#9CA3AF; cursor:pointer; font-family:inherit; transition:all .15s; -webkit-tap-highlight-color:transparent; }
    .btn-action:hover { background:rgba(255,255,255,.09); color:#D1D5DB; border-color:rgba(255,255,255,.16); }
    .btn-action.active { background:rgba(59,130,246,.1); border-color:rgba(59,130,246,.25); color:#3B82F6; }
    .actions-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }

    /* Resumo final */
    .resumo-final { background:linear-gradient(160deg,rgba(22,28,42,1) 0%,rgba(12,15,22,1) 100%); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:18px 20px; margin-bottom:16px; }
    .resumo-row { display:flex; justify-content:space-between; align-items:center; padding:5px 0; font-size:14px; }
    .resumo-row.total { border-top:1px solid rgba(255,255,255,.08); margin-top:8px; padding-top:12px; font-size:17px; font-weight:800; }
  `

  if (loading) return (
    <div className="pg"><style>{css}</style>
      <nav className="nav"><span className="nav-logo">ClienteMarcado</span></nav>
      <div style={{ textAlign:'center', padding:'60px', color:'#4B5563', fontSize:'14px' }}>Carregando...</div>
    </div>
  )

  return (
    <div className="pg">
      <style>{css}</style>
      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <Link href="/painel" className="nav-back">← Voltar ao painel</Link>
      </nav>

      <div className="body">

        {/* ══ LISTA ══ */}
        {view === 'lista' && (
          <>
            <div className="page-header">
              <div>
                <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#F1F5F9', letterSpacing:'-0.02em', marginBottom:'4px' }}>Orçamentos e Cobranças</h1>
                <p style={{ fontSize:'14px', color:'#6B7280' }}>Crie orçamentos, acompanhe pagamentos, gere PDF e envie tudo pelo WhatsApp.</p>
              </div>
              <button className="btn-novo" onClick={() => { resetForm(); setView('form') }}>+ Novo orçamento</button>
            </div>

            {/* Métricas */}
            <div className="metricas">
              {[
                { label:'Orçamentos em aberto', valor: totalAberto, cor:'#3B82F6', fmt:'n' },
                { label:'Total a receber', valor: totalAReceber, cor:'#F59E0B', fmt:'brl' },
                { label:'Recebido no mês', valor: recebidoMes, cor:'#22C55E', fmt:'brl' },
                { label:'Pagamentos parciais', valor: parciais, cor:'#F97316', fmt:'n' },
              ].map(m => (
                <div key={m.label} className="metrica">
                  <div className="m-accent" style={{ background:`linear-gradient(90deg,${m.cor},transparent)` }} />
                  <p className="m-label">{m.label}</p>
                  <p className="m-valor" style={{ color: m.cor }}>{m.fmt === 'brl' ? 'R$ '+fmtBRL(m.valor as number) : m.valor}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="filtros">
              {STATUS_LIST.map(s => (
                <button key={s} className={`chip${filtroStatus===s?' on':''}`} onClick={() => setFiltroStatus(s)}>{s}</button>
              ))}
              <input type="text" placeholder="Buscar cliente, contato ou serviço..." className="search-input"
                value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} />
            </div>

            {mensagem && <div className="msg-ok">{mensagem}</div>}

            {orcsFiltrados.length === 0 ? (
              <div className="vazio">
                <p>Nenhum orçamento ou cobrança criado ainda.</p>
                <p>Crie seu primeiro orçamento, registre pagamentos e envie pelo WhatsApp.</p>
                <button className="btn-novo" style={{ marginTop:'16px' }} onClick={() => { resetForm(); setView('form') }}>Criar primeiro orçamento</button>
              </div>
            ) : (
              <div className="orc-lista">
                {orcsFiltrados.map(orc => {
                  const cfg = STATUS_COR[orc.status] || STATUS_COR['Aberto']
                  return (
                    <div key={orc.id} className="orc-card">
                      <div className="orc-top">
                        <div>
                          <p className="orc-cliente">{orc.cliente_nome}</p>
                          <p className="orc-meta">{orc.tipo} · {fmtData(orc.data)}{orc.profissional_nome ? ' · ' + orc.profissional_nome : ''}{orc.profissional_nome && !orc.profissional_id ? <span style={{fontSize:'10px',background:'rgba(245,158,11,.1)',color:'#F59E0B',border:'1px solid rgba(245,158,11,.2)',borderRadius:'999px',padding:'1px 6px',marginLeft:'4px',fontWeight:700}}>Freelancer</span> : null}</p>
                        </div>
                        <span className="status-badge" style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.border }}>{orc.status}</span>
                      </div>
                      <div className="orc-financeiro">
                        <div className="fin-item">
                          <p className="fin-label">Total</p>
                          <p className="fin-valor" style={{ color:'#F1F5F9' }}>R$ {fmtBRL(orc.total)}</p>
                        </div>
                        <div className="fin-item">
                          <p className="fin-label">Pago</p>
                          <p className="fin-valor" style={{ color:'#22C55E' }}>R$ {fmtBRL(orc.valor_pago)}</p>
                        </div>
                        <div className="fin-item">
                          <p className="fin-label">Saldo</p>
                          <p className="fin-valor" style={{ color: orc.saldo_restante > 0 ? '#F97316' : '#22C55E' }}>R$ {fmtBRL(orc.saldo_restante)}</p>
                        </div>
                      </div>
                      <div className="orc-acoes">
                        <button className="btn-acao primary" onClick={() => { setDetalheId(orc.id); carregarPagamentos(orc.id); setView('detalhe') }}>Ver detalhes</button>
                        <button className="btn-acao green" onClick={() => { setDetalheId(orc.id); carregarPagamentos(orc.id); setView('detalhe'); setShowPagForm(true) }}>Registrar pgto</button>
                        <button className="btn-acao" onClick={() => gerarPDF(orc)}>Gerar PDF</button>
                        <button className="btn-acao wpp" onClick={() => enviarWpp(orc)}>WhatsApp</button>
                        <button className="btn-acao" onClick={() => abrirEditar(orc)}>Editar</button>
                        <button className="btn-acao danger" onClick={() => handleExcluir(orc.id)}>Excluir</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══ FORMULÁRIO ══ */}
        {view === 'form' && (
          <div style={{ maxWidth:'680px', margin:'0 auto', padding:'0 0 60px' }}>
            {/* Header light */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', paddingTop:'4px' }}>
              <button onClick={() => { resetForm(); setView('lista') }}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:'22px', color:'#6B7280', padding:'0 4px', lineHeight:1 }}>←</button>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#111827', letterSpacing:'-0.02em' }}>{editandoId ? 'Editar orçamento' : 'Novo orçamento'}</h2>
                <p style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'2px' }}>Preencha o essencial e crie em segundos</p>
              </div>
            </div>

            {mensagem && (
              <div style={{ fontSize:'13px', color: mensagem.includes('rro') ? '#DC2626' : '#16A34A',
                padding:'10px 14px', background: mensagem.includes('rro') ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${mensagem.includes('rro') ? '#FECACA' : '#BBF7D0'}`,
                borderRadius:'10px', marginBottom:'16px' }}>{mensagem}</div>
            )}

            {/* ── SEÇÃO: Cliente ── */}
            <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #F3F4F6' }}>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#111827', marginBottom:'14px' }}>👤 Cliente</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Nome *</label>
                  <input type="text" placeholder="Nome do cliente" value={clienteNome} onChange={e => setClienteNome(e.target.value)}
                    style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'11px 14px', fontSize:'15px', color:'#111827', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' as const }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>WhatsApp *</label>
                    <input type="tel" placeholder="(11) 99999-9999" value={clienteWpp} onChange={e => setClienteWpp(aplicarMascaraTel(e.target.value))}
                      style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'11px 14px', fontSize:'15px', color:'#111827', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>E-mail</label>
                    <input type="email" placeholder="opcional" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)}
                      style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'11px 14px', fontSize:'15px', color:'#111827', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' as const }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── DETALHES DO DOCUMENTO (recolhível) ── */}
            <button onClick={() => setShowDetalhes(!showDetalhes)}
              style={{ width:'100%', background:'#fff', border:'1.5px dashed #E5E7EB', borderRadius:'12px', padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', fontFamily:'inherit' }}>
              <span>+ Detalhes do documento</span>
              <span style={{ fontSize:'11px', color:'#D1D5DB' }}>tipo, status, profissional, data</span>
            </button>
            {showDetalhes && (
            <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #F3F4F6' }}>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#111827', marginBottom:'14px' }}>📋 Detalhes do documento</p>
              <div className="fields">
                <div className="row-2">
                  <div>
                    <label className="label">Tipo *</label>
                    <select value={tipo} onChange={e => { setTipo(e.target.value); if (e.target.value !== '__outro__') setTipoOutro('') }} className="select">
                      {['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno'].map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="__outro__">Outro</option>
                    </select>
                    {tipo === '__outro__' && (
                      <div style={{ marginTop:'10px', display:'flex', flexDirection:'column', gap:'10px', padding:'14px', background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:'10px' }}>
                        <div>
                          <label className="label">Nome do tipo do documento *</label>
                          <input type="text"
                            placeholder="Ex: Avaliação, Laudo, Revisão"
                            value={tipoOutro}
                            onChange={e => setTipoOutro(e.target.value)}
                            className="input" />
                        </div>
                        <div>
                          <label className="label">Descrição do documento (opcional)</label>
                          <input type="text"
                            placeholder="Ex: Avaliação inicial com análise completa do serviço..."
                            value={tipoDescricao}
                            onChange={e => setTipoDescricao(e.target.value)}
                            className="input" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div><label className="label">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="select">
                      {['Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s => <option key={s}>{s}</option>)}
                    </select></div>
                </div>
                <div className="row-2">
                  <div>
                    <label className="label">Profissional</label>
                    <select value={profId} onChange={e => { setProfId(e.target.value); if (e.target.value !== '__outro__') { setProfNome(''); setSalvarFreelancer(false) } }} className="select">
                      <option value="">Selecione...</option>
                      {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      <option value="__outro__">✏️ Outro / Não cadastrado</option>
                    </select>
                    {profId === '__outro__' && (
                      <div style={{ marginTop:'10px', padding:'14px', background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:'10px' }}>
                        <label className="label">Nome do profissional responsável *</label>
                        <input type="text" placeholder="Ex: Marcos"
                          value={profNome} onChange={e => setProfNome(e.target.value)}
                          className="input" />
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'12px' }}>
                          <button type="button"
                            style={{ width:'36px', height:'20px', borderRadius:'999px', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', background: salvarFreelancer ? '#3B82F6' : 'rgba(255,255,255,.15)', flexShrink:0, fontFamily:'inherit' }}
                            onClick={() => setSalvarFreelancer(!salvarFreelancer)}>
                            <span style={{ position:'absolute', top:'2px', left: salvarFreelancer ? '18px' : '2px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
                          </button>
                          <span style={{ fontSize:'12px', color:'#9CA3AF' }}>Salvar este profissional na equipe?</span>
                          {salvarFreelancer && <span style={{ fontSize:'10px', color:'#3B82F6', fontWeight:'700', padding:'2px 8px', background:'rgba(59,130,246,.1)', borderRadius:'999px', border:'1px solid rgba(59,130,246,.2)' }}>será adicionado</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div><label className="label">Data</label>
                    <input type="date" value={dataDoc} onChange={e => setDataDoc(e.target.value)} className="input" /></div>
                </div>
              </div>
            </div>

            </div>
            </div>
            )}

            {/* ── SEÇÃO: Serviços ── */}
            <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #F3F4F6' }}>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#111827', marginBottom:'14px' }}>🛎 Serviço</p>
              {itens.map((item, idx) => (
                <div key={idx} className="item-row">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em' }}>Item {idx+1}</span>
                    {itens.length > 1 && (
                      <button className="btn-rm" title="Remover item" onClick={() => setItens(prev => prev.filter((_,i) => i !== idx))}>×</button>
                    )}
                  </div>

                  {/* Nome do serviço — linha inteira */}
                  <div style={{ marginBottom:'10px' }}>
                    <label className="label">Serviço / Procedimento *</label>
                    <input type="text"
                      placeholder="Ex: Corte de cabelo, limpeza de pele, troca de óleo, restauração..."
                      value={item.nome}
                      onChange={e => atualizarItem(idx,'nome',e.target.value)}
                      className="input" />
                  </div>

                  {/* Qtd + Unitário + Total */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 1.5fr', gap:'10px', marginBottom:'10px' }}>
                    <div>
                      <label className="label">Qtd</label>
                      <input type="number" min="1"
                        value={item.qtd}
                        onChange={e => atualizarItem(idx,'qtd',e.target.value)}
                        className="input" style={{ textAlign:'center' }} />
                    </div>
                    <div>
                      <label className="label">Valor unitário</label>
                      <div style={{ position:'relative' }}>
                        <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'13px', color:'#6B7280', fontWeight:'600', pointerEvents:'none' }}>R$</span>
                        <input type="number" min="0" step="0.01"
                          placeholder="0,00"
                          value={item.unitario}
                          onChange={e => atualizarItem(idx,'unitario',e.target.value)}
                          className="input" style={{ paddingLeft:'36px' }} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Total</label>
                      <div style={{ background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.2)', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center' }}>
                        <span style={{ fontSize:'15px', fontWeight:'800', color:'#22C55E' }}>
                          R$ {fmtBRL(item.total||0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observação */}
                  <div>
                    <input type="text"
                      placeholder="Observação opcional (Ex: inclui material, sem juros...)"
                      value={item.obs}
                      onChange={e => atualizarItem(idx,'obs',e.target.value)}
                      className="input"
                      style={{ fontSize:'13px', color:'#9CA3AF' }} />
                  </div>
                </div>
              ))}

              <button onClick={() => setItens(prev => [...prev, { nome:'', qtd:1, unitario:'', total:0, obs:'' }])}
                style={{ width:'100%', border:'1.5px dashed #D1D5DB', borderRadius:'10px', padding:'10px', background:'transparent', color:'#6B7280', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
                + Adicionar item
              </button>

              {/* Resumo financeiro */}
              {!showDesconto && (
                <button onClick={() => setShowDesconto(true)}
                  style={{ background:'none', border:'none', color:'#6B7280', fontSize:'12px', fontWeight:'600', cursor:'pointer', padding:'6px 0', fontFamily:'inherit', textDecoration:'underline' }}>
                  + Adicionar desconto
                </button>
              )}
              <div style={{ background:'#F9FAFB', borderRadius:'12px', padding:'14px', marginTop:'10px', border:'1px solid #F3F4F6' }}>
                <div className="subtotal-row">
                  <span style={{ color:'#9CA3AF', fontWeight:'600' }}>Subtotal</span>
                  <span style={{ color:'#F1F5F9', fontWeight:'700' }}>R$ {fmtBRL(subtotal)}</span>
                </div>
                <div className="subtotal-row" style={{ borderTop:'1px solid rgba(255,255,255,.06)', marginTop:'8px', paddingTop:'10px' }}>
                  <span style={{ color:'#9CA3AF', fontWeight:'600' }}>Desconto</span>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'13px', color:'#6B7280' }}>R$</span>
                    <input type="number" min="0" step="0.01" placeholder="0,00"
                      value={desconto}
                      onChange={e => setDesconto(e.target.value)}
                      style={{ background:'transparent', border:'none', outline:'none', color:'#EF4444', fontSize:'14px', fontWeight:'700', textAlign:'right', width:'90px', fontFamily:'inherit' }} />
                  </div>
                </div>
                <div className="subtotal-row total" style={{ marginTop:'8px' }}>
                  <span>Total final</span>
                  <span style={{ color:'#22C55E', fontSize:'20px' }}>R$ {fmtBRL(total)}</span>
                </div>
                {descontoNum > subtotal && subtotal > 0 && (
                  <p style={{ fontSize:'11px', color:'#F59E0B', marginTop:'6px', textAlign:'right' }}>
                    ⚠ Desconto maior que o subtotal. Total ajustado para R$ 0,00.
                  </p>
                )}
              </div>
            </div>

            </div>

            {/* Odontograma */}
            {isOdonto && (
              <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #F3F4F6' }}>
                <p className="form-sec-title">🦷 Odontograma</p>
                <p className="form-sec-sub">Selecione os dentes envolvidos no orçamento ou tratamento.</p>
                {[DENTES_SUPERIOR, DENTES_INFERIOR].map((arco, ai) => (
                  <div key={ai} style={{ marginBottom:'10px' }}>
                    <div className="dentes-row">
                      {arco.slice(0, arco.length/2).map(n => (
                        <button key={n} className={`dente-btn${dentesSelec.includes(n)?' sel':''}`} onClick={() => toggleDente(n)}>{n}</button>
                      ))}
                      <div className="dente-sep" />
                      {arco.slice(arco.length/2).map(n => (
                        <button key={n} className={`dente-btn${dentesSelec.includes(n)?' sel':''}`} onClick={() => toggleDente(n)}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {dentesSelec.length > 0 && <p style={{ fontSize:'12px', color:'#3B82F6', marginBottom:'12px' }}>Dentes selecionados: {dentesSelec.sort((a,b)=>a-b).join(', ')}</p>}
                <div className="fields">
                  <div className="row-2">
                    <div><label className="label">Procedimento</label>
                      <input type="text" placeholder="Ex: Restauração, Canal" value={procNome} onChange={e => setProcNome(e.target.value)} className="input" /></div>
                    <div><label className="label">Valor</label>
                      <input type="number" placeholder="0,00" value={procValor} onChange={e => setProcValor(e.target.value)} className="input" /></div>
                  </div>
                  <div className="row-2">
                    <div><label className="label">Status</label>
                      <select value={procStatus} onChange={e => setProcStatus(e.target.value)} className="select">
                        {['A realizar','Em andamento','Concluído','Cancelado'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                    <div><label className="label">Observação</label>
                      <input type="text" placeholder="Opcional" value={procObs} onChange={e => setProcObs(e.target.value)} className="input" /></div>
                  </div>
                  <button className="btn-add-item" onClick={adicionarProcOdonto} disabled={!procNome || dentesSelec.length===0}>
                    + Adicionar procedimento aos dentes selecionados
                  </button>
                </div>
                {procOdonto.map((p, i) => (
                  <div key={i} className="proc-item">
                    <div>
                      <span className="proc-nome">{p.dente ? `Dente ${p.dente} — ` : ''}{p.nome} · {p.status}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span className="proc-val">R$ {fmtBRL(parseFloat(p.valor||'0'))}</span>
                      <button style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:'16px' }} onClick={() => setProcOdonto(prev => prev.filter((_,j) => j!==i))}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SEÇÃO: Resumo Financeiro ── */}
            <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #F3F4F6' }}>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#111827', marginBottom:'14px' }}>💳 Pagamento</p>

              {/* Cards resumo */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
                <div style={{ background:'#F9FAFB', borderRadius:'10px', padding:'12px', border:'1px solid #F3F4F6' }}>
                  <p style={{ fontSize:'10px', fontWeight:'600', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'4px' }}>Total</p>
                  <p style={{ fontSize:'16px', fontWeight:'800', color:'#111827' }}>R$ {fmtBRL(total)}</p>
                </div>
                <div style={{ background:'#F0FDF4', borderRadius:'10px', padding:'12px', border:'1px solid #DCFCE7' }}>
                  <p style={{ fontSize:'10px', fontWeight:'600', color:'#16A34A', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'4px' }}>Pago</p>
                  <p style={{ fontSize:'16px', fontWeight:'800', color:'#16A34A' }}>R$ {fmtBRL(valorPagoLocal)}</p>
                </div>
                <div style={{ background: saldoLocal > 0 ? '#FFF7ED' : '#F0FDF4', borderRadius:'10px', padding:'12px', border:`1px solid ${saldoLocal > 0 ? '#FED7AA' : '#DCFCE7'}` }}>
                  <p style={{ fontSize:'10px', fontWeight:'600', color: saldoLocal > 0 ? '#EA580C' : '#16A34A', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'4px' }}>Saldo</p>
                  <p style={{ fontSize:'16px', fontWeight:'800', color: saldoLocal > 0 ? '#EA580C' : '#16A34A' }}>R$ {fmtBRL(saldoLocal)}</p>
                </div>
              </div>

              <div className="fields">
                {/* Sinal */}
                {showSinal && (
                <div style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:'12px', padding:'14px', marginBottom:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }} style={{ marginBottom: exigirSinal ? '12px' : '0' }}>
                    <button className={`toggle${exigirSinal?' on':' off'}`} onClick={() => setExigirSinal(!exigirSinal)} />
                    <label className="label" style={{ margin:0, textTransform:'none', fontSize:'13px', color:'#D1D5DB', cursor:'pointer' }}
                      onClick={() => setExigirSinal(!exigirSinal)}>
                      Exigir entrada / sinal?
                    </label>
                  </div>
                  {exigirSinal && (
                    <div style={{ padding:'14px', background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:'10px', display:'flex', flexDirection:'column', gap:'12px' }}>
                      <div className="row-2">
                        <div>
                          <label className="label">Tipo de entrada</label>
                          <select value={sinalTipo} onChange={e => setSinalTipo(e.target.value)} className="select">
                            <option value="fixo">Valor fixo (R$)</option>
                            <option value="percentual">Porcentagem (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">{sinalTipo === 'fixo' ? 'Valor da entrada (R$)' : 'Percentual (%)'}</label>
                          <input type="number" min="0" step={sinalTipo==='fixo'?'0.01':'1'}
                            placeholder={sinalTipo==='fixo'?'0,00':'50'}
                            value={sinalValor}
                            onChange={e => setSinalValor(e.target.value)}
                            className="input" />
                        </div>
                      </div>
                      {sinalValor && (
                        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'8px', padding:'10px 14px' }}>
                          <span style={{ fontSize:'13px', color:'#22C55E', fontWeight:'700' }}>
                            Entrada necessária: R$ {fmtBRL(
                              sinalTipo === 'fixo'
                                ? parseFloat(sinalValor||'0')
                                : (total * parseFloat(sinalValor||'0')) / 100
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Ações */}
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
                  <button type="button" onClick={() => setShowLinkPag(!showLinkPag)} style={{ background: showLinkPag?'#EFF6FF':'#F9FAFB', border:`1.5px solid ${showLinkPag?'#BFDBFE':'#E5E7EB'}`, borderRadius:'8px', padding:'8px 12px', fontSize:'12px', fontWeight:'600', color: showLinkPag?'#2563EB':'#6B7280', cursor:'pointer', fontFamily:'inherit' }}>
                    🔗 {showLinkPag ? 'Ocultar link' : 'Adicionar link de pagamento'}
                  </button>
                  <button type="button" onClick={() => setShowSinal(!showSinal)} style={{ background: showSinal?'#EFF6FF':'#F9FAFB', border:`1.5px solid ${showSinal?'#BFDBFE':'#E5E7EB'}`, borderRadius:'8px', padding:'8px 12px', fontSize:'12px', fontWeight:'600', color: showSinal?'#2563EB':'#6B7280', cursor:'pointer', fontFamily:'inherit' }}>
                    💰 {showSinal ? 'Ocultar sinal' : 'Configurar entrada/sinal'}
                  </button>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(gerarMensagemCobranca()) }} style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', fontWeight:'600', color:'#6B7280', cursor:'pointer', fontFamily:'inherit' }}>
                    📋 Copiar cobrança
                  </button>
                  <button type="button" disabled={!clienteWpp}
                    onClick={enviarCobrancaWpp}
                    style={{ background:'#F0FFF4', border:'1.5px solid #86EFAC', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', fontWeight:'600', color:'#16A34A', cursor: clienteWpp?'pointer':'not-allowed', fontFamily:'inherit', opacity: clienteWpp?1:0.5 }}>
                    💬 WhatsApp
                  </button>
                </div>
                {!clienteWpp && <p style={{ fontSize:'11px', color:'#4B5563', marginTop:'-6px', marginBottom:'8px' }}>Informe o WhatsApp do cliente para enviar.</p>}

                {/* Link de pagamento */}
                {showLinkPag && (
                  <div style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:'12px', padding:'14px', marginBottom:'10px' }}>
                    <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Link de pagamento</label>
                    <input type="url"
                      placeholder="Cole aqui o link do Mercado Pago, Asaas, PagSeguro, InfinitePay ou outro"
                      value={linkPag} onChange={e => setLinkPag(e.target.value)}
                      className="input" />
                    <p className="field-hint">O ClienteMarcado apenas organiza a cobrança. O pagamento será feito pelo link informado.</p>
                  </div>
                )}

                {/* Obs */}
                <button onClick={() => setShowObs(!showObs)}
                  style={{ background:'none', border:'none', color:'#6B7280', fontSize:'12px', fontWeight:'600', cursor:'pointer', padding:'4px 0', fontFamily:'inherit', textDecoration:'underline' }}>
                  {showObs ? '− Ocultar observações' : '+ Observações'}
                </button>
                {showObs && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px', background:'#F9FAFB', borderRadius:'12px', padding:'14px', border:'1.5px solid #E5E7EB' }}>
                    <div>
                      <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Observação do cliente</label>
                      <textarea rows={2} placeholder="Alergias, preferências, histórico..."
                        value={clienteObs} onChange={e => setClienteObs(e.target.value)}
                        style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#111827', outline:'none', fontFamily:'inherit', background:'#fff', resize:'none', boxSizing:'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Obs. de pagamento</label>
                      <input type="text" placeholder="Ex: cliente pagou entrada em dinheiro"
                        value={obsPagamento} onChange={e => setObsPagamento(e.target.value)}
                        style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#111827', outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Observações do orçamento</label>
                      <textarea rows={3} placeholder="Informações adicionais..."
                        value={observacoes} onChange={e => setObservacoes(e.target.value)}
                        style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#111827', outline:'none', fontFamily:'inherit', background:'#fff', resize:'none', boxSizing:'border-box' as const }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Histórico de pagamentos */}
            <div className="form-section">
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#111827', marginBottom:'14px' }}>📜 Pagamentos registrados</p>

              {!showPagForm && (
                <button onClick={() => { setShowPagForm(true); setEditandoPagIdx(null); setHpValor(''); setHpForma('Pix'); setHpFormaOutro(''); setHpData(new Date().toISOString().split('T')[0]); setHpObs('') }}
                  style={{ width:'100%', border:'1.5px dashed #D1D5DB', borderRadius:'10px', padding:'10px', background:'#F9FAFB', color:'#6B7280', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
                  + Registrar pagamento
                </button>
              )}

              {showPagForm && (
                <div style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:'12px', padding:'16px', marginBottom:'12px' }}>
                  <p style={{ fontSize:'13px', fontWeight:'700', color:'#F1F5F9', marginBottom:'14px' }}>
                    {editandoPagIdx !== null ? 'Editar pagamento' : 'Registrar pagamento'}
                  </p>
                  <div className="fields">
                    <div className="row-2">
                      <div>
                        <label className="label">Valor pago *</label>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'13px', color:'#6B7280', fontWeight:'600', pointerEvents:'none' }}>R$</span>
                          <input type="text" inputMode="numeric" placeholder="0,00"
                            value={hpValor}
                            onChange={e => setHpValor(fmtHpValor(e.target.value.replace(/\D/g,'') || '0'))}
                            className="input" style={{ paddingLeft:'36px' }} />
                        </div>
                      </div>
                      <div>
                        <label className="label">Data *</label>
                        <input type="date" value={hpData} onChange={e => setHpData(e.target.value)} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Forma de pagamento *</label>
                      <select value={hpForma} onChange={e => { setHpForma(e.target.value); if (e.target.value !== 'Outro') setHpFormaOutro('') }} className="select">
                        {['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento','Outro'].map(f => <option key={f}>{f}</option>)}
                      </select>
                      {hpForma === 'Outro' && (
                        <div style={{ marginTop:'8px' }}>
                          <input type="text" placeholder="Ex: cheque, boleto, permuta..."
                            value={hpFormaOutro} onChange={e => setHpFormaOutro(e.target.value)}
                            className="input" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="label">Observação (opcional)</label>
                      <input type="text"
                        placeholder="Ex: entrada paga em dinheiro, parcela dois de cinco..."
                        value={hpObs} onChange={e => setHpObs(e.target.value)}
                        className="input" />
                    </div>
                    <div className="form-btns">
                      <button className="btn-secundario" style={{ marginBottom:0 }} onClick={() => { setShowPagForm(false); setEditandoPagIdx(null) }}>Cancelar</button>
                      <button className="btn-salvar" onClick={salvarHpPag}>{editandoPagIdx !== null ? 'Atualizar' : 'Salvar pagamento'}</button>
                    </div>
                  </div>
                </div>
              )}

              {histPags.length === 0 && !showPagForm && (
                <p style={{ fontSize:'12px', color:'#D1D5DB', padding:'8px 0', textAlign:'center' }}>Nenhum pagamento registrado.</p>
              )}

              {histPags.map((p, i) => (
                <div key={i} style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'15px', fontWeight:'800', color:'#16A34A' }}>R$ {fmtBRL(p.valor)}</span>
                      <span style={{ fontSize:'11px', color:'#6B7280' }}>{p.forma}</span>
                      <span style={{ fontSize:'11px', color:'#9CA3AF' }}>• {fmtData(p.data)}</span>
                    </div>
                    {p.obs && <p style={{ fontSize:'12px', color:'#6B7280' }}>{p.obs}</p>}
                  </div>
                  <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                    <button className="btn-acao" onClick={() => editarHpPag(i)} style={{ fontSize:'11px' }}>Editar</button>
                    <button className="btn-acao danger" onClick={() => excluirHpPag(i)} style={{ fontSize:'11px' }}>Excluir</button>
                  </div>
                </div>
              ))}

              {histPags.length > 0 && (
                <div style={{ background:'#F0FDF4', border:'1px solid #DCFCE7', borderRadius:'10px', padding:'12px 16px', marginTop:'4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'13px', color:'#6B7280', fontWeight:'600' }}>Total pago</span>
                  <span style={{ fontSize:'16px', fontWeight:'800', color:'#16A34A' }}>R$ {fmtBRL(valorPagoLocal)}</span>
                </div>
              )}
            </div>

            </div>
            </div>

            {/* ── Botão principal ── */}
            <button onClick={handleSalvar}
              style={{ width:'100%', background:'#2563EB', color:'#fff', border:'none', borderRadius:'14px', padding:'16px', fontSize:'16px', fontWeight:'800', cursor:'pointer', boxShadow:'0 4px 20px rgba(37,99,235,.35)', letterSpacing:'-0.01em', fontFamily:'inherit', marginTop:'8px' }}>
              {editandoId ? 'Salvar alterações' : 'Criar orçamento'}
            </button>
            <button onClick={() => { resetForm(); setView('lista') }}
              style={{ width:'100%', background:'none', border:'none', color:'#9CA3AF', fontSize:'13px', fontWeight:'600', cursor:'pointer', padding:'12px', fontFamily:'inherit', marginTop:'4px' }}>
              Cancelar
            </button>
          </div>
        )}

        {/* ══ DETALHE ══ */}
        {view === 'detalhe' && orcDetalhe && (() => {
          const orc = orcDetalhe
          const cfg = STATUS_COR[orc.status] || STATUS_COR['Aberto']
          return (
            <div style={{ maxWidth:'760px', margin:'0 auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px', flexWrap:'wrap' }}>
                <button className="btn-secundario" style={{ width:'auto', padding:'8px 16px', marginBottom:0 }} onClick={() => { setView('lista'); setShowPagForm(false) }}>← Voltar</button>
                <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#F1F5F9' }}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span className="status-badge" style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.border, fontSize:'12px', padding:'4px 12px' }}>{orc.status}</span>
              </div>

              {mensagem && <div className="msg-ok" style={{ marginBottom:'14px' }}>{mensagem}</div>}

              {/* Resumo */}
              <div className="form-section">
                <p className="form-sec-title">📊 Resumo financeiro</p>
                <div className="pag-saldo">
                  <div className="pag-item"><p className="pag-label">Total</p><p className="pag-valor" style={{ color:'#F1F5F9' }}>R$ {fmtBRL(orc.total)}</p></div>
                  <div className="pag-item"><p className="pag-label">Pago</p><p className="pag-valor" style={{ color:'#22C55E' }}>R$ {fmtBRL(orc.valor_pago)}</p></div>
                  <div className="pag-item"><p className="pag-label">Saldo</p><p className="pag-valor" style={{ color: orc.saldo_restante>0?'#F97316':'#22C55E' }}>R$ {fmtBRL(orc.saldo_restante)}</p></div>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'14px' }}>
                  <button className="btn-acao primary" onClick={() => setShowPagForm(!showPagForm)}>+ Registrar pagamento</button>
                  <button className="btn-acao" onClick={() => gerarPDF(orc)}>Gerar PDF</button>
                  <button className="btn-acao wpp" onClick={() => enviarWpp(orc)}>Enviar WhatsApp</button>
                  {orc.link_pagamento && (
                    <>
                      <button className="btn-acao green" onClick={() => navigator.clipboard.writeText(orc.link_pagamento)}>Copiar link</button>
                      <a href={orc.link_pagamento} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                        <button className="btn-acao">Abrir link</button>
                      </a>
                    </>
                  )}
                  <button className="btn-acao" onClick={() => abrirEditar(orc)}>Editar</button>
                </div>

                {showPagForm && (
                  <div className="pag-form">
                    <p style={{ fontSize:'13px', fontWeight:'700', color:'#F1F5F9', marginBottom:'14px' }}>Registrar pagamento</p>
                    <div className="row-2" style={{ marginBottom:'10px' }}>
                      <div><label className="label">Data</label>
                        <input type="date" value={pagData} onChange={e => setPagData(e.target.value)} className="input" /></div>
                      <div><label className="label">Valor (R$)</label>
                        <input type="number" placeholder="0,00" value={pagValor} onChange={e => setPagValor(e.target.value)} className="input" /></div>
                    </div>
                    <div style={{ marginBottom:'10px' }}>
                      <label className="label">Forma de pagamento</label>
                      <select value={pagForma} onChange={e => setPagForma(e.target.value)} className="select">
                        {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Link de pagamento','Outro'].map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:'12px' }}>
                      <label className="label">Observação</label>
                      <input type="text" placeholder="Opcional" value={pagObs} onChange={e => setPagObs(e.target.value)} className="input" />
                    </div>
                    <div className="form-btns">
                      <button className="btn-secundario" style={{ marginBottom:0 }} onClick={() => setShowPagForm(false)}>Cancelar</button>
                      <button className="btn-salvar" disabled={savingPag} onClick={() => handleRegistrarPagamento(orc)}>{savingPag?'Salvando...':'Confirmar pagamento'}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Serviços */}
              {(orc.servicos?.length > 0 || orc.procedimentos_odonto?.length > 0) && (
                <div className="form-section">
                  <p className="form-sec-title">🛎 Serviços / Procedimentos</p>
                  {(orc.servicos || []).map((s: any, i: number) => (
                    <div key={i} className="proc-item">
                      <div>
                        <span className="proc-nome">{s.nome}</span>
                        <span style={{ fontSize:'11px', color:'#4B5563', marginLeft:'8px' }}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}/un</span>
                        {s.obs && <p style={{ fontSize:'11px', color:'#4B5563', marginTop:'2px' }}>{s.obs}</p>}
                      </div>
                      <span className="proc-val">R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  {(orc.procedimentos_odonto || []).map((p: any, i: number) => (
                    <div key={i} className="proc-item">
                      <span className="proc-nome">{p.dente?`Dente ${p.dente} — `:''}  {p.nome} · {p.status}</span>
                      <span className="proc-val">R$ {fmtBRL(parseFloat(p.valor||'0'))}</span>
                    </div>
                  ))}
                  <div className="subtotal-box" style={{ marginTop:'10px' }}>
                    {orc.desconto > 0 && <div className="subtotal-row"><span style={{ color:'#9CA3AF' }}>Desconto</span><span style={{ color:'#EF4444' }}>- R$ {fmtBRL(orc.desconto)}</span></div>}
                    <div className="subtotal-row total"><span>Total</span><span style={{ color:'#22C55E' }}>R$ {fmtBRL(orc.total)}</span></div>
                  </div>
                </div>
              )}

              {/* Histórico */}
              <div className="form-section">
                <p className="form-sec-title">📜 Histórico de pagamentos</p>
                {pagamentos.length === 0
                  ? <p style={{ fontSize:'13px', color:'#374151', padding:'8px 0' }}>Nenhum pagamento registrado.</p>
                  : pagamentos.map((p, i) => (
                    <div key={i} className="proc-item">
                      <div>
                        <span className="proc-nome">{p.forma} · {fmtData(p.data)}</span>
                        {p.observacao && <p style={{ fontSize:'11px', color:'#4B5563', marginTop:'2px' }}>{p.observacao}</p>}
                      </div>
                      <span className="proc-val">R$ {fmtBRL(p.valor)}</span>
                    </div>
                  ))
                }
              </div>

              {/* Dados do cliente */}
              <div className="form-section">
                <p className="form-sec-title">👤 Dados do cliente</p>
                <p style={{ fontSize:'14px', color:'#F1F5F9', marginBottom:'4px' }}><strong>{orc.cliente_nome}</strong></p>
                {orc.cliente_whatsapp && <p style={{ fontSize:'13px', color:'#6B7280', marginBottom:'2px' }}>📱 {aplicarMascaraTel(orc.cliente_whatsapp)}</p>}
                {orc.cliente_email && <p style={{ fontSize:'13px', color:'#6B7280', marginBottom:'2px' }}>✉️ {orc.cliente_email}</p>}
                {orc.cliente_obs && <p style={{ fontSize:'13px', color:'#6B7280' }}>📝 {orc.cliente_obs}</p>}
              </div>

              {orc.tipo_descricao && (
                <div className="form-section">
                  <p className="form-sec-title">📄 Descrição do documento</p>
                  <p style={{ fontSize:'13px', color:'#9CA3AF', lineHeight:'1.6' }}>{orc.tipo_descricao}</p>
                </div>
              )}
              {orc.observacoes && (
                <div className="form-section">
                  <p className="form-sec-title">📝 Observações</p>
                  <p style={{ fontSize:'13px', color:'#9CA3AF', lineHeight:'1.6' }}>{orc.observacoes}</p>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
