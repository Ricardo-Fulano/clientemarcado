'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'
import { normalizarPlano, obterNomePlano, obterPrecoPlano, type PlanoTipo } from '../../lib/planos'

// Mesma lista ja usada em PainelSidebar.tsx - canal19horas@gmail.com (original) +
// misteriosoviaje@gmail.com (adicionada). Continua hardcoded (sem campo de banco).
const ADMIN_IDS = [
  '618aedd1-f174-4419-b4b2-b81b8dd1c47e', // canal19horas@gmail.com
  'f2203e3c-9d23-4635-9d14-b990b5198b8a', // misteriosoviaje@gmail.com
]

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;background:#08060A}
.pg{min-height:100vh;width:100%;max-width:100%;box-sizing:border-box;overflow-x:hidden;background:radial-gradient(circle at top left,rgba(139,92,246,.12),transparent 32%),#120A14}
.bdy{max-width:1200px;margin:0 auto;padding:28px 28px 80px;width:100%}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.card{background:linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:20px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:12px;padding:11px 14px;color:#F8F4F7;font-size:14px;outline:none;font-family:inherit;transition:border-color .2s}
.inp:focus{border-color:#EC4899;box-shadow:0 0 0 3px rgba(236,72,153,.14)}
.inp::placeholder{color:#B8AAB8}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
.btn-p{background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:none;border-radius:12px;padding:11px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn-s{background:rgba(24,16,27,.88);color:#B8AAB8;border:1px solid #2A1A2F;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s}
.btn-s:hover{border-color:rgba(236,72,153,.32);color:#F8F4F7}
.btn-desativar:hover{border-color:rgba(239,68,68,.35)!important;background:rgba(239,68,68,.08)!important;color:#EF4444!important}
.btn-g{background:rgba(34,197,94,.15);color:#22C55E;border:1px solid rgba(34,197,94,.28);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.tbl-row{padding:20px;margin-bottom:14px;border:2px solid rgba(236,72,153,.22);border-radius:16px;box-shadow:0 0 0 1px rgba(236,72,153,.08),0 16px 38px rgba(0,0,0,.20);background:rgba(24,16,27,.5)}
.tbl-row:last-child{margin-bottom:0}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#18101B;border:1.5px solid #2A1A2F;border-radius:22px;padding:32px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
@media(max-width:1023px){
  .psb-main{overflow-x:hidden!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
  .pg{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
  .bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}
  .kpi{grid-template-columns:1fr 1fr!important}
  .btn-p,.btn-s,.btn-g{white-space:normal!important;font-size:11px!important;padding:6px 8px!important}
  .resumo-plano-grid{grid-template-columns:1fr!important}
  .modal{padding:20px!important}
}
@media(max-width:480px){.kpi{grid-template-columns:1fr}}
@media(min-width:1024px) and (max-width:1280px){.resumo-plano-grid{grid-template-columns:repeat(2,1fr)!important}}
`

const TIPOS = ['Influencer', 'Página local', 'Cliente indicador', 'Parceiro comercial', 'Outro']

// Regra comercial atual: 20% recorrente sobre cada mensalidade paga pelo cliente indicado,
// por ate 12 meses (nao mais 50% unico da 1a mensalidade).
// 'essencial' e o nome interno no banco pro plano comercialmente chamado de "Profissional"
// (nao mexemos no banco, so tratamos a exibicao/calculo). Fallback: plano_tipo nulo/vazio/
// invalido sempre vira 'essencial' (Profissional), igual ao comportamento anterior.
// IMPORTANTE: a comissao aqui e calculada sobre o PRECO TABELADO ATUAL do plano (app/lib/
// planos.ts), nao sobre o valor que foi de fato pago na transacao - o sistema hoje nao
// persiste o valor real de cada pagamento (nem em indicacoes_parceiros, nem em perfis; o
// webhook do Asaas recebe esse valor mas nunca o grava). Se um cliente pagou com desconto/
// promocao, a comissao exibida aqui pode nao refletir o valor exato pago. Ajustar isso com
// precisao exigiria salvar o valor real do pagamento (mudanca de webhook/schema, fora do
// escopo desta correcao).
function infoDoPlano(chave: PlanoTipo) {
  const mensalidade = obterPrecoPlano(chave)
  return { mensalidade, comissao: mensalidade * 0.2, nomeComercial: obterNomePlano(chave) }
}
function comissaoDoIndicado(ind: any) {
  return infoDoPlano(normalizarPlano(ind?.plano_tipo)).comissao
}
// Traduz o status_acesso ja existente em perfis (ativo/em_atraso/cancelado/
// aguardando_pagamento) pra um rotulo amigavel com cor propria - nao inventa nenhum status
// novo, so melhora a comunicacao do que ja existe.
function labelStatusAcesso(s: string | null | undefined) {
  if (s === 'ativo') return { texto: 'Ativo', cor: '#22C55E', bg: 'rgba(34,197,94,.12)', borda: 'rgba(34,197,94,.26)' }
  if (s === 'em_atraso') return { texto: 'Em atraso', cor: '#FACC15', bg: 'rgba(250,204,21,.12)', borda: 'rgba(250,204,21,.26)' }
  if (s === 'cancelado') return { texto: 'Cancelado', cor: '#F87171', bg: 'rgba(248,113,113,.12)', borda: 'rgba(248,113,113,.26)' }
  if (s === 'aguardando_pagamento') return { texto: 'Aguardando pagamento', cor: '#94A3B8', bg: 'rgba(148,163,184,.12)', borda: 'rgba(148,163,184,.24)' }
  return null
}

export default function Parceiros() {
  const [perfil, setPerfil] = useState<any>(null)
  const [parceiros, setParceiros] = useState<any[]>([])
  const [indicacoes, setIndicacoes] = useState<any[]>([])
  const [comissoes, setComissoes] = useState<any[]>([])
  const [repasses, setRepasses] = useState<any[]>([])
  // Fase 3D: confirmandoRepasse guarda { parceiroId, competencia, comissoesDoGrupo } enquanto
  // o modal de confirmacao esta aberto. processandoRepasse evita double-click (desabilita o
  // botao ate a resposta do servidor chegar). resultadoRepasse guarda a resposta AUTORITATIVA
  // da RPC (nunca o total calculado no client) pra mostrar o feedback de sucesso.
  const [confirmandoRepasse, setConfirmandoRepasse] = useState<any>(null)
  const [processandoRepasse, setProcessandoRepasse] = useState(false)
  const [resultadoRepasse, setResultadoRepasse] = useState<any>(null)
  const [erroRepasse, setErroRepasse] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [aba, setAba] = useState<'parceiros' | 'indicacoes' | 'fechamentos'>('parceiros')
  const [competenciaFechamento, setCompetenciaFechamento] = useState('')
  const [filtroFechamento, setFiltroFechamento] = useState<'todos' | 'pendentes' | 'pagos'>('todos')
  const [buscaFechamento, setBuscaFechamento] = useState('')
  const [verDetalhes, setVerDetalhes] = useState<any>(null)
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje'|'semana'|'mes'|'mes_passado'|'tudo'|'personalizado'>('tudo')
  const [dataIni, setDataIni] = useState('')
  const [dataFim, setDataFim] = useState('')
  // Filtros da aba geral "Indicações" (separados dos filtros do modal de detalhes por parceiro)
  const [filtroParceiroId, setFiltroParceiroId] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('')
  const [filtroPeriodoGeral, setFiltroPeriodoGeral] = useState<'hoje'|'semana'|'mes'|'mes_passado'|'tudo'|'personalizado'>('tudo')
  const [dataIniGeral, setDataIniGeral] = useState('')
  const [dataFimGeral, setDataFimGeral] = useState('')

  // Form
  const [nome, setNome] = useState('')
  const [cupom, setCupom] = useState('')
  const [wpp, setWpp] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState('Influencer')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (!ADMIN_IDS.includes(user.id)) { window.location.href = '/painel'; return }
    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)
    await carregarDadosAdmin()
    setLoading(false)
  }

  async function carregarDadosAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    try {
      const res = await fetch('/api/admin/parceiros', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { console.error('[Parceiros] Erro ao carregar dados admin:', res.status); return }
      const dados = await res.json()
      setParceiros(dados.parceiros || [])
      setIndicacoes(dados.indicacoes || [])
      setComissoes(dados.comissoes || [])
      setRepasses(dados.repasses || [])
    } catch (e: any) {
      console.error('[Parceiros] Erro ao carregar dados admin:', e?.message)
    }
  }

  // Fase 3D: agrupa comissoes pendentes de um parceiro por competencia - so competencias com
  // pelo menos 1 comissao pendente/sem repasse aparecem (nunca mostra competencia vazia).
  function competenciasPendentesDoParceiro(parceiroId: string) {
    const doParceiro = comissoes.filter(c => c.parceiro_id === parceiroId && c.status === 'pendente' && !c.repasse_id)
    const porCompetencia = new Map<string, any[]>()
    for (const c of doParceiro) {
      const lista = porCompetencia.get(c.competencia) || []
      lista.push(c)
      porCompetencia.set(c.competencia, lista)
    }
    return [...porCompetencia.entries()]
      .map(([competencia, lista]) => ({ competencia, qtd: lista.length, total: lista.reduce((a, c) => a + Number(c.valor_comissao || 0), 0), comissoes: lista }))
      .sort((a, b) => b.competencia.localeCompare(a.competencia))
  }

  function labelCompetencia(competencia: string) {
    const [ano, mes] = competencia.split('-')
    const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${nomes[parseInt(mes, 10) - 1]}/${ano}`
  }

  function repassesDoParceiro(parceiroId: string) {
    return repasses.filter(r => r.parceiro_id === parceiroId).sort((a, b) => new Date(b.data_repasse).getTime() - new Date(a.data_repasse).getTime())
  }

  // ===== Fase 3D.1: aba Fechamentos - agregacao em memoria, sem chamadas de rede novas =====

  // Ajuste 1: competencia continua disponivel pra consulta mesmo depois de toda comissao
  // ja ter sido paga - por isso a uniao inclui competencias de REPASSES tambem, nao so de
  // comissoes pendentes/atuais.
  const competenciasDisponiveis = useMemo(() => {
    const set = new Set<string>()
    comissoes.forEach(c => { if (c.competencia) set.add(c.competencia) })
    repasses.forEach(r => { if (r.competencia) set.add(r.competencia) })
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [comissoes, repasses])

  // Define a competencia mais recente automaticamente na primeira carga - nunca sobrescreve
  // se o admin ja tiver escolhido (ou trocado) manualmente.
  useEffect(() => {
    if (!competenciaFechamento && competenciasDisponiveis.length > 0) {
      setCompetenciaFechamento(competenciasDisponiveis[0])
    }
  }, [competenciasDisponiveis, competenciaFechamento])

  // Ajuste 2: campos separados por natureza - nunca uma variavel generica "comissoes" que
  // misture pendente com pago/total.
  type ResumoParceiroFechamento = {
    parceiroId: string
    qtdComissoesPendentes: number
    valorPendente: number
    qtdComissoesPagas: number
    valorPago: number
    qtdComissoesTotal: number
    repassesDaCompetencia: any[]
  }

  const fechamentoDaCompetencia = useMemo<ResumoParceiroFechamento[]>(() => {
    if (!competenciaFechamento) return []
    const porParceiro = new Map<string, ResumoParceiroFechamento>()
    function getOuCria(parceiroId: string): ResumoParceiroFechamento {
      if (!porParceiro.has(parceiroId)) {
        porParceiro.set(parceiroId, { parceiroId, qtdComissoesPendentes: 0, valorPendente: 0, qtdComissoesPagas: 0, valorPago: 0, qtdComissoesTotal: 0, repassesDaCompetencia: [] })
      }
      return porParceiro.get(parceiroId)!
    }
    comissoes.filter(c => c.competencia === competenciaFechamento).forEach(c => {
      const entry = getOuCria(c.parceiro_id)
      entry.qtdComissoesTotal += 1
      if (c.status === 'pendente') { entry.qtdComissoesPendentes += 1; entry.valorPendente += Number(c.valor_comissao || 0) }
      else if (c.status === 'paga') { entry.qtdComissoesPagas += 1; entry.valorPago += Number(c.valor_comissao || 0) }
      // 'estornada' conta no total (transparencia) mas nunca em pendente/pago.
    })
    // Parceiro pode ter repasse na competencia sem nenhuma comissao "ativa" sobrando na
    // lista (ex: tudo ja foi pago) - ainda assim precisa aparecer no fechamento.
    repasses.filter(r => r.competencia === competenciaFechamento).forEach(r => {
      getOuCria(r.parceiro_id).repassesDaCompetencia.push(r)
    })
    return [...porParceiro.values()].sort((a, b) => b.valorPendente - a.valorPendente || b.valorPago - a.valorPago)
  }, [comissoes, repasses, competenciaFechamento])

  // Ajuste 3: filtros nao sao mutuamente exclusivos - um parceiro pago com pendencia
  // complementar aparece tanto em Pendentes quanto em Pagos.
  const fechamentoFiltrado = useMemo(() => {
    return fechamentoDaCompetencia.filter(f => {
      if (filtroFechamento === 'pendentes' && f.valorPendente <= 0) return false
      if (filtroFechamento === 'pagos' && f.valorPago <= 0) return false
      if (buscaFechamento.trim()) {
        const par = parceiros.find(p => p.id === f.parceiroId)
        const termo = buscaFechamento.toLowerCase().trim()
        const nomeMatch = par?.nome?.toLowerCase().includes(termo)
        const cupomMatch = par?.cupom?.toLowerCase().includes(termo)
        if (!nomeMatch && !cupomMatch) return false
      }
      return true
    })
  }, [fechamentoDaCompetencia, filtroFechamento, buscaFechamento, parceiros])

  const resumoGlobalFechamento = useMemo(() => ({
    parceirosComPendencia: fechamentoDaCompetencia.filter(f => f.valorPendente > 0).length,
    comissoesPendentes: fechamentoDaCompetencia.reduce((a, f) => a + f.qtdComissoesPendentes, 0),
    totalAPagar: fechamentoDaCompetencia.reduce((a, f) => a + f.valorPendente, 0),
    totalPago: fechamentoDaCompetencia.reduce((a, f) => a + f.valorPago, 0),
  }), [fechamentoDaCompetencia])

  // So chama o endpoint quando o admin CONFIRMA no modal - o preview antes disso e so
  // visual, calculado localmente a partir de "comissoes" ja carregado.
  async function confirmarRepasse() {
    if (!confirmandoRepasse || processandoRepasse) return
    setProcessandoRepasse(true)
    setErroRepasse('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setErroRepasse('Sessão expirada.'); setProcessandoRepasse(false); return }
      const res = await fetch('/api/admin/parceiros/repasse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ parceiroId: confirmandoRepasse.parceiroId, competencia: confirmandoRepasse.competencia }),
      })
      const dados = await res.json()
      if (!res.ok) {
        setErroRepasse(dados.error || 'Não foi possível confirmar o repasse.')
        setProcessandoRepasse(false)
        return
      }
      // dados.repasse e a resposta AUTORITATIVA da RPC - usada no feedback, nunca o total
      // calculado no preview local.
      setResultadoRepasse(dados.repasse)
      setConfirmandoRepasse(null)
      setProcessandoRepasse(false)
      await carregarDadosAdmin()
    } catch (e: any) {
      setErroRepasse('Erro de conexão ao confirmar o repasse.')
      setProcessandoRepasse(false)
    }
  }

  function indicacoesDoParceiro(parceiroId: string) {
    return indicacoes.filter(ind => ind.parceiro_id === parceiroId)
  }

  // Calcula o intervalo [inicio, fim] de datas pro filtro escolhido. 'tudo' devolve null
  // (sem filtro nenhum, todas as indicacoes entram). Parametrizada pra servir tanto o modal
  // de detalhes do parceiro quanto os filtros da aba geral "Indicações", sem duplicar logica.
  function calcularIntervalo(periodo: string, ini: string, fim: string): { inicio: Date; fim: Date } | null {
    const agora = new Date()
    const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0)
    const hojeFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59)
    if (periodo === 'hoje') return { inicio: hojeInicio, fim: hojeFim }
    if (periodo === 'semana') {
      const diaSemana = agora.getDay()
      const inicioSemana = new Date(hojeInicio)
      inicioSemana.setDate(hojeInicio.getDate() - diaSemana)
      return { inicio: inicioSemana, fim: hojeFim }
    }
    if (periodo === 'mes') {
      return { inicio: new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0), fim: hojeFim }
    }
    if (periodo === 'mes_passado') {
      return {
        inicio: new Date(agora.getFullYear(), agora.getMonth() - 1, 1, 0, 0, 0),
        fim: new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59),
      }
    }
    if (periodo === 'personalizado' && ini && fim) {
      const [ai, am, ad] = ini.split('-').map(Number)
      const [bi, bm, bd] = fim.split('-').map(Number)
      return { inicio: new Date(ai, am - 1, ad, 0, 0, 0), fim: new Date(bi, bm - 1, bd, 23, 59, 59) }
    }
    return null // 'tudo' ou personalizado incompleto
  }
  function intervaloDoFiltro(): { inicio: Date; fim: Date } | null {
    return calcularIntervalo(filtroPeriodo, dataIni, dataFim)
  }

  function indicacoesNoPeriodo(lista: any[]) {
    const intervalo = intervaloDoFiltro()
    if (!intervalo) return lista
    return lista.filter(ind => {
      if (!ind.created_at) return false
      const d = new Date(ind.created_at)
      return d >= intervalo.inicio && d <= intervalo.fim
    })
  }

  // Comissoes pendentes/geradas no periodo: usa data_pagamento_cliente (quando o cliente
  // de fato pagou), nunca created_at da comissao nem data de processamento do webhook.
  function comissoesGeradasNoPeriodo(lista: any[]) {
    const intervalo = intervaloDoFiltro()
    if (!intervalo) return lista
    return lista.filter(c => {
      if (!c.data_pagamento_cliente) return false
      const d = new Date(c.data_pagamento_cliente)
      return d >= intervalo.inicio && d <= intervalo.fim
    })
  }

  // Comissao PAGA no periodo: usa a data REAL do repasse ao parceiro (repasses_parceiros.
  // data_repasse), nao a data que o cliente pagou. Ex: cliente pagou em agosto, repasse
  // aconteceu em setembro -> essa comissao entra em "Setembro", nao em "Agosto".
  function comissoesPagasNoPeriodo(lista: any[]) {
    const pagas = lista.filter(c => c.status === 'paga')
    const intervalo = intervaloDoFiltro()
    if (!intervalo) return pagas
    return pagas.filter(c => {
      const repasse = repasses.find(r => r.id === c.repasse_id)
      if (!repasse?.data_repasse) return false
      const d = new Date(repasse.data_repasse)
      return d >= intervalo.inicio && d <= intervalo.fim
    })
  }

  // Resumo por plano (cadastros/pagantes/comissao), usado dentro do modal de detalhes.
  // Indicacoes SEM plano_tipo definido ficam de fora dos 3 grupos comerciais (senao o
  // fallback de planoValido as contaria erradamente como "Profissional").
  function resumoPorPlano(inds: any[], comissoesRelevantes: any[]) {
    const comPlanoDefinido = inds.filter(i => i.plano_tipo !== null && i.plano_tipo !== undefined && i.plano_tipo !== '')
    const comissoesValidasRelevantes = comissoesRelevantes.filter(c => c.status === 'pendente' || c.status === 'paga')
    const chaves = ['minipage', 'loja', 'essencial', 'equipe'] as const
    return chaves.map(chave => {
      const doPlano = comPlanoDefinido.filter(i => normalizarPlano(i.plano_tipo) === chave)
      const comissoesDoPlano = comissoesValidasRelevantes.filter(c => normalizarPlano(c.plano_tipo) === chave)
      const pagantesDoPlano = new Set(comissoesDoPlano.map(c => c.indicacao_id)).size
      const comissao = comissoesDoPlano.reduce((a, c) => a + Number(c.valor_comissao || 0), 0)
      return { chave, nome: infoDoPlano(chave).nomeComercial, cadastros: doPlano.length, pagantes: pagantesDoPlano, comissao }
    })
  }

  function resetForm() {
    setNome(''); setCupom(''); setWpp(''); setEmail('')
    setTipo('Influencer'); setAtivo(true); setEditando(null)
  }

  function abrirEditar(p: any) {
    setEditando(p); setNome(p.nome); setCupom(p.cupom); setWpp(p.whatsapp || '')
    setEmail(p.email || ''); setTipo(p.tipo || 'Influencer'); setAtivo(p.ativo)
    setShowModal(true)
  }

  async function salvar() {
    const cupomFmt = cupom.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!nome.trim() || !cupomFmt) { setMsg('Preencha nome e cupom.'); return }
    const payload = { nome: nome.trim(), cupom: cupomFmt, whatsapp: wpp || null, email: email || null, tipo, ativo }
    if (editando) {
      const { error } = await supabase.from('parceiros').update(payload).eq('id', editando.id)
      if (error) { setMsg('Erro: ' + error.message); return }
    } else {
      const { error } = await supabase.from('parceiros').insert(payload)
      if (error) { setMsg('Erro: ' + error.message); return }
    }
    setMsg(''); resetForm(); setShowModal(false); await carregarDadosAdmin()
  }

  async function toggleAtivo(p: any) {
    await supabase.from('parceiros').update({ ativo: !p.ativo }).eq('id', p.id)
    await carregarDadosAdmin()
  }

  // Exclusao segura: so permite apagar de verdade se o parceiro nao tiver NENHUMA indicacao
  // vinculada (o que automaticamente cobre comissoes/pagamentos, ja que essas informacoes
  // ficam dentro do registro de indicacao). Se tiver historico, nunca apaga fisicamente -
  // so oferece desativar, preservando os dados.
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<any>(null)
  const [excluindo, setExcluindo] = useState(false)

  function temHistorico(parceiroId: string) {
    return indicacoes.some(i => i.parceiro_id === parceiroId)
  }

  function abrirConfirmacaoExclusao(p: any) {
    setConfirmandoExclusao(p)
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return
    // Checagem final no momento da exclusao (nao so ao abrir o modal) - garante que nao
    // apaga fisicamente um parceiro que tenha ganho uma indicacao entre abrir o modal e
    // confirmar.
    if (temHistorico(confirmandoExclusao.id)) {
      setConfirmandoExclusao(null)
      return
    }
    setExcluindo(true)
    const { error } = await supabase.from('parceiros').delete().eq('id', confirmandoExclusao.id)
    setExcluindo(false)
    setConfirmandoExclusao(null)
    if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    setMsg('Parceiro excluído.')
    await carregarDadosAdmin()
  }

  async function desativarEFecharModal() {
    if (!confirmandoExclusao) return
    await supabase.from('parceiros').update({ ativo: false }).eq('id', confirmandoExclusao.id)
    await carregarDadosAdmin()
    setConfirmandoExclusao(null)
  }

  async function marcarPago(ind: any) {
    if (!window.confirm('Deseja marcar esta comissão como paga?')) return
    await supabase.from('indicacoes_parceiros').update({ comissao_status: 'paga' }).eq('id', ind.id)
    await carregarDadosAdmin()
  }

  async function marcarPagante(ind: any) {
    if (!window.confirm('Marcar como cliente pagante?')) return
    const valor = comissaoDoIndicado(ind)
    await supabase.from('indicacoes_parceiros').update({
      is_pagante: true,
      status: 'pagante',
      comissao_status: 'pendente',
      comissao_valor: valor,
      data_pagamento: new Date().toISOString().split('T')[0],
    }).eq('id', ind.id)
    await carregarDadosAdmin()
  }

  function copiarLink(c: string) {
    const url = `${window.location.origin}/cadastro?cupom=${c}`
    navigator.clipboard.writeText(url)
    setMsg('Link copiado!')
    setTimeout(() => setMsg(''), 3000)
  }

  function copiarPainelParceiro(c: string) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const url = `${base}/parceiro/${c}`
    navigator.clipboard.writeText(url)
    setMsg('Link do painel do parceiro copiado!')
    setTimeout(() => setMsg(''), 3000)
  }

  const fBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  // ===== FASE 3C: comissoes_parceiros passa a ser a fonte financeira de verdade =====
  // is_pagante/comissao_status (legado em indicacoes_parceiros) NAO sao mais usados aqui
  // pra decidir pagante/pendente/pago - continuam existindo no banco, intocados, so
  // deixam de alimentar esta tela.
  const comissoesValidas = comissoes.filter(c => c.status === 'pendente' || c.status === 'paga')
  const indicacoesComComissaoValida = new Set(comissoesValidas.map(c => c.indicacao_id))
  const ehPagante = (ind: any) => indicacoesComComissaoValida.has(ind.id)

  // Comissao mais recente de uma indicacao (por data_pagamento_cliente) - usada na linha
  // principal quando o cliente ja pagou varias mensalidades, sem precisar listar todas ali.
  function ultimaComissao(indicacaoId: string) {
    const doCliente = comissoes.filter(c => c.indicacao_id === indicacaoId)
    if (doCliente.length === 0) return null
    return [...doCliente].sort((a, b) => new Date(b.data_pagamento_cliente).getTime() - new Date(a.data_pagamento_cliente).getTime())[0]
  }

  // Todas as comissoes de uma indicacao, mais recente primeiro - usada na secao
  // "Comissoes" (historico) dentro do modal do parceiro.
  function historicoComissoes(indicacaoId: string) {
    return comissoes
      .filter(c => c.indicacao_id === indicacaoId)
      .sort((a, b) => new Date(b.data_pagamento_cliente).getTime() - new Date(a.data_pagamento_cliente).getTime())
  }

  const labelStatusComissao = (s: string) => s === 'paga' ? 'Paga' : s === 'estornada' ? 'Estornada' : 'Pendente'

  // KPIs (todo o periodo)
  const totalAtivos = parceiros.filter(p => p.ativo).length
  const totalCadastros = indicacoes.length
  const totalPagantes = indicacoes.filter(ehPagante).length
  const totalPendente = comissoes.filter(c => c.status === 'pendente').reduce((a, c) => a + Number(c.valor_comissao || 0), 0)
  const totalPago = comissoes.filter(c => c.status === 'paga').reduce((a, c) => a + Number(c.valor_comissao || 0), 0)

  if (loading) return <div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#B8AAB8' }}>Carregando...</p></div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={perfil?.nome_negocio || ''} tituloMobile="Parceiros" />

      <div className="psb-main">
        <div className="pg">
          <div className="bdy">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.03em', marginBottom: '4px' }}>Parceiros e indicações</h1>
                <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Acompanhe cadastros, pagantes e comissões dos seus parceiros.</p>
              </div>
              <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Novo parceiro</button>
            </div>

            <p style={{ fontSize: '12px', color: '#C4B5FD', marginBottom: '20px' }}>Comissão: 20% recorrente sobre cada mensalidade paga pelos clientes indicados, por até 12 meses.</p>

            {msg && <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.28)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#22C55E', marginBottom: '16px' }}>{msg}</div>}

            {/* KPIs */}
            <div className="kpi">
              {[
                { l: 'Parceiros ativos', v: String(totalAtivos), c: '#EC4899', bd: 'rgba(236,72,153,.25)' },
                { l: 'Indicações pagantes', v: `${totalPagantes} de ${totalCadastros}`, c: '#22C55E', bd: 'rgba(34,197,94,.25)' },
                { l: 'Comissão pendente', v: fBRL(totalPendente), c: '#FACC15', bd: 'rgba(250,204,21,.25)' },
                { l: 'Comissão paga', v: fBRL(totalPago), c: '#22C55E', bd: 'rgba(34,197,94,.22)' },
              ].map(k => (
                <div key={k.l} style={{ background: '#18101B', border: `1.5px solid ${k.bd}`, borderRadius: '18px', padding: '18px 16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>{k.l}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: k.c }}>{k.v}</p>
                </div>
              ))}
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['parceiros', 'indicacoes', 'fechamentos'] as const).map(a => (
                <button key={a} onClick={() => setAba(a)}
                  className={aba === a ? '' : 'btn-s'}
                  style={{ padding: '8px 18px', borderRadius: '10px', border: aba === a ? 'none' : undefined, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, background: aba === a ? 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)' : undefined, color: aba === a ? '#fff' : undefined }}>
                  {a === 'parceiros' ? 'Parceiros' : a === 'indicacoes' ? 'Indicações' : 'Fechamentos'}
                </button>
              ))}
            </div>

            {/* ABA PARCEIROS */}
            {aba === 'parceiros' && (
              <div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7' }}>Lista de parceiros</p>
                  <span style={{ fontSize: '12px', color: '#B8AAB8' }}>{parceiros.length} parceiro{parceiros.length !== 1 ? 's' : ''}</span>
                </div>
                {parceiros.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#B8AAB8', marginBottom: '16px' }}>Nenhum parceiro cadastrado ainda.</p>
                    <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Cadastrar primeiro parceiro</button>
                  </div>
                ) : parceiros.map(p => {
                  const inds = indicacoesDoParceiro(p.id)
                  const comissoesDoParceiro = comissoes.filter(c => c.parceiro_id === p.id)
                  const pags = inds.filter(ehPagante)
                  const pendente = comissoesDoParceiro.filter(c => c.status === 'pendente').reduce((a, c) => a + Number(c.valor_comissao || 0), 0)
                  const pago = comissoesDoParceiro.filter(c => c.status === 'paga').reduce((a, c) => a + Number(c.valor_comissao || 0), 0)

                  return (
                    <div key={p.id} className="tbl-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(236,72,153,.2),rgba(139,92,246,.2))', border: '1px solid rgba(236,72,153,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#EC4899', flexShrink: 0 }}>
                            {p.nome.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '3px' }}>{p.nome}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{p.cupom}</span>
                              <span style={{ fontSize: '11px', color: '#B8AAB8' }}>{p.tipo}</span>
                              <span className="badge" style={{ background: p.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${p.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: p.ativo ? '#22C55E' : '#EF4444' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {[
                            { l: 'Cadastros', v: String(inds.length), c: '#B8AAB8' },
                            { l: 'Pagantes', v: String(pags.length), c: '#22C55E' },
                            { l: 'Pendente', v: fBRL(pendente), c: '#FACC15' },
                            { l: 'Pago', v: fBRL(pago), c: '#22C55E' },
                          ].map(s => (
                            <div key={s.l} style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>{s.l}</p>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: s.c }}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="btn-s" onClick={() => { setVerDetalhes(p); setFiltroPeriodo('tudo') }}>Ver detalhes</button>
                        <button className="btn-s" onClick={() => copiarLink(p.cupom)}>Copiar link</button>
                        <button className="btn-s" onClick={() => copiarPainelParceiro(p.cupom)}>Copiar painel do parceiro</button>
                        <button className="btn-s" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className={p.ativo ? 'btn-s btn-desativar' : 'btn-s'} onClick={() => toggleAtivo(p)}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
                        <button className="btn-s" style={{ color: '#F87171', borderColor: 'rgba(248,113,113,.35)' }} onClick={() => abrirConfirmacaoExclusao(p)}>Excluir</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ABA INDICAÇÕES */}
            {aba === 'indicacoes' && (() => {
              const intervaloGeral = calcularIntervalo(filtroPeriodoGeral, dataIniGeral, dataFimGeral)
              const indicacoesFiltradas = indicacoes.filter(ind => {
                if (filtroParceiroId && ind.parceiro_id !== filtroParceiroId) return false
                if (filtroPlano && normalizarPlano(ind.plano_tipo) !== filtroPlano) return false
                if (intervaloGeral) {
                  if (!ind.created_at) return false
                  const d = new Date(ind.created_at)
                  if (d < intervaloGeral.inicio || d > intervaloGeral.fim) return false
                }
                return true
              })
              return (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '12px' }}>Clientes indicados</p>

                {/* Filtros da aba geral */}
                <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                  <div className="fg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label className="lbl">Parceiro</label>
                      <select className="inp" style={{ cursor: 'pointer' }} value={filtroParceiroId} onChange={e => setFiltroParceiroId(e.target.value)}>
                        <option value="">Todos os parceiros</option>
                        {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.cupom})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Plano</label>
                      <select className="inp" style={{ cursor: 'pointer' }} value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)}>
                        <option value="">Todos os planos</option>
                        <option value="minipage">MiniPage</option>
                        <option value="essencial">Profissional</option>
                        <option value="equipe">Equipe</option>
                      </select>
                    </div>
                  </div>
                  <label className="lbl">Período</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: filtroPeriodoGeral === 'personalizado' ? '10px' : 0 }}>
                    {([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['mes_passado', 'Mês passado'], ['tudo', 'Todo período'], ['personalizado', 'Personalizado']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setFiltroPeriodoGeral(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: filtroPeriodoGeral === v ? 'none' : '1px solid #2A1A2F', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: filtroPeriodoGeral === v ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(24,16,27,.88)', color: filtroPeriodoGeral === v ? '#fff' : '#B8AAB8' }}>{l}</button>
                    ))}
                  </div>
                  {filtroPeriodoGeral === 'personalizado' && (
                    <div className="fg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label className="lbl">De</label><input type="date" className="inp" value={dataIniGeral} onChange={e => setDataIniGeral(e.target.value)} /></div>
                      <div><label className="lbl">Até</label><input type="date" className="inp" value={dataFimGeral} onChange={e => setDataFimGeral(e.target.value)} /></div>
                    </div>
                  )}
                </div>

                {indicacoesFiltradas.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#B8AAB8' }}>{indicacoes.length === 0 ? 'Nenhuma indicação registrada ainda.' : 'Nenhuma indicação encontrada com esses filtros.'}</p>
                  </div>
                ) : indicacoesFiltradas.map(ind => {
                  const planoTipo = normalizarPlano(ind.plano_tipo)
                  const infoPlano = infoDoPlano(planoTipo)
                  const ultima = ultimaComissao(ind.id)
                  const par = parceiros.find((pc: any) => pc.id === ind.parceiro_id)
                  return (
                    <div key={ind.id} className="tbl-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8F4F7', marginBottom: '2px' }}>{ind.nome_negocio || '—'}</p>
                          {ind.nome_responsavel && <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '1px' }}>{ind.nome_responsavel}</p>}
                          <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '6px' }}>{ind.email}</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{ind.cupom_codigo}</span>
                            {par && <span style={{ fontSize: '11px', color: '#B8AAB8' }}>→ {par.nome}</span>}
                            <span className="badge" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.26)', color: '#C4B5FD' }}>Plano {infoPlano.nomeComercial}</span>
                            <span className="badge" style={{ background: ehPagante(ind) ? 'rgba(34,197,94,.12)' : 'rgba(236,72,153,.12)', border: `1px solid ${ehPagante(ind) ? 'rgba(34,197,94,.24)' : 'rgba(236,72,153,.24)'}`, color: ehPagante(ind) ? '#22C55E' : '#EC4899' }}>{ehPagante(ind) ? 'Pagante' : 'Cadastro'}</span>
                            {ultima && (
                              <span className="badge" style={{ background: ultima.status === 'paga' ? 'rgba(34,197,94,.10)' : ultima.status === 'estornada' ? 'rgba(248,113,113,.12)' : 'rgba(250,204,21,.12)', border: `1px solid ${ultima.status === 'paga' ? 'rgba(34,197,94,.22)' : ultima.status === 'estornada' ? 'rgba(248,113,113,.28)' : 'rgba(250,204,21,.28)'}`, color: ultima.status === 'paga' ? '#22C55E' : ultima.status === 'estornada' ? '#F87171' : '#FACC15' }}>Comissão {labelStatusComissao(ultima.status).toLowerCase()}</span>
                            )}
                            {labelStatusAcesso(ind.status_acesso) && (() => { const st = labelStatusAcesso(ind.status_acesso)!; return <span className="badge" style={{ background: st.bg, border: `1px solid ${st.borda}`, color: st.cor }}>{st.texto}</span> })()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <div style={{ textAlign: 'right' as const }}>
                            {ultima ? (
                              <>
                                <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Valor pago: <span style={{ color: '#F8F4F7', fontWeight: 600 }}>{fBRL(Number(ultima.valor_pago))}</span></p>
                                <p style={{ fontSize: '13px', color: '#EC4899', fontWeight: 800 }}>Comissão: {fBRL(Number(ultima.valor_comissao))}</p>
                              </>
                            ) : (
                              <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Plano: <span style={{ color: '#F8F4F7', fontWeight: 600 }}>{fBRL(infoPlano.mensalidade)}/mês</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              )
            })()}

            {aba === 'fechamentos' && (
              <div>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '4px' }}>Fechamento mensal</p>
                <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '18px' }}>Acompanhe e confirme os repasses de comissão por parceiro e competência.</p>

                <div style={{ marginBottom: '18px' }}>
                  <label className="lbl" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>Competência</label>
                  <select value={competenciaFechamento} onChange={e => setCompetenciaFechamento(e.target.value)}
                    style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '10px 14px', color: '#F8F4F7', fontSize: '14px', fontFamily: 'inherit', minWidth: '200px' }}>
                    {competenciasDisponiveis.length === 0 && <option value="">Nenhuma competência</option>}
                    {competenciasDisponiveis.map(c => <option key={c} value={c}>{labelCompetencia(c)}</option>)}
                  </select>
                </div>

                {competenciaFechamento && (
                  <>
                    {/* Cards de resumo global - so o essencial, sem poluir */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginBottom: '20px' }}>
                      {[
                        { l: 'Parceiros com pendência', v: String(resumoGlobalFechamento.parceirosComPendencia), c: '#FACC15' },
                        { l: 'Comissões pendentes', v: String(resumoGlobalFechamento.comissoesPendentes), c: '#B8AAB8' },
                        { l: 'Total a pagar', v: fBRL(resumoGlobalFechamento.totalAPagar), c: '#EC4899' },
                        { l: 'Total pago', v: fBRL(resumoGlobalFechamento.totalPago), c: '#22C55E' },
                      ].map(k => (
                        <div key={k.l} style={{ background: '#18101B', border: '1.5px solid #2A1A2F', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>{k.l}</p>
                          <p style={{ fontSize: '18px', fontWeight: 800, color: k.c }}>{k.v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Filtros + busca */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                      {(['todos', 'pendentes', 'pagos'] as const).map(f => (
                        <button key={f} onClick={() => setFiltroFechamento(f)}
                          className={filtroFechamento === f ? '' : 'btn-s'}
                          style={{ padding: '6px 14px', borderRadius: '8px', border: filtroFechamento === f ? 'none' : undefined, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: filtroFechamento === f ? 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)' : undefined, color: filtroFechamento === f ? '#fff' : undefined }}>
                          {f === 'todos' ? 'Todos' : f === 'pendentes' ? 'Pendentes' : 'Pagos'}
                        </button>
                      ))}
                      <input value={buscaFechamento} onChange={e => setBuscaFechamento(e.target.value)} placeholder="Buscar por nome ou cupom..."
                        style={{ flex: 1, minWidth: '180px', background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 12px', color: '#F8F4F7', fontSize: '13px', fontFamily: 'inherit' }} />
                    </div>

                    {/* Lista de parceiros na competencia */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {fechamentoFiltrado.length === 0 && (
                        <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '20px 0', textAlign: 'center' as const }}>Nenhum parceiro com movimento nesta competência.</p>
                      )}
                      {fechamentoFiltrado.map(f => {
                        const par = parceiros.find(p => p.id === f.parceiroId)
                        if (!par) return null
                        const misto = f.valorPendente > 0 && f.valorPago > 0
                        const badge = misto
                          ? { texto: 'Pago + pendência complementar', bg: 'rgba(250,204,21,.12)', borda: 'rgba(250,204,21,.28)', cor: '#FACC15' }
                          : f.valorPendente > 0
                            ? { texto: 'Pendente', bg: 'rgba(250,204,21,.12)', borda: 'rgba(250,204,21,.28)', cor: '#FACC15' }
                            : { texto: 'Pago', bg: 'rgba(34,197,94,.12)', borda: 'rgba(34,197,94,.24)', cor: '#22C55E' }
                        const ultimoRepasse = [...f.repassesDaCompetencia].sort((a, b) => new Date(b.data_repasse).getTime() - new Date(a.data_repasse).getTime())[0]
                        return (
                          <div key={f.parceiroId} style={{ border: '1px solid #2A1A2F', borderRadius: '14px', padding: '16px', background: 'rgba(24,16,27,.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7' }}>{par.nome}</p>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{par.cupom}</span>
                                  <span className="badge" style={{ background: badge.bg, border: `1px solid ${badge.borda}`, color: badge.cor }}>{badge.texto}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '8px' }}>
                                  <div>
                                    <p style={{ fontSize: '10px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em' }}>Pendentes</p>
                                    <p style={{ fontSize: '13px', color: '#FACC15', fontWeight: 700 }}>{f.qtdComissoesPendentes} comissõe{f.qtdComissoesPendentes !== 1 ? 's' : ''} · {fBRL(f.valorPendente)}</p>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: '10px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em' }}>Pagas</p>
                                    <p style={{ fontSize: '13px', color: '#22C55E', fontWeight: 700 }}>{f.qtdComissoesPagas} comissõe{f.qtdComissoesPagas !== 1 ? 's' : ''} · {fBRL(f.valorPago)}</p>
                                  </div>
                                  {ultimoRepasse && (
                                    <div>
                                      <p style={{ fontSize: '10px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em' }}>Último repasse</p>
                                      <p style={{ fontSize: '13px', color: '#F8F4F7', fontWeight: 600 }}>{new Date(ultimoRepasse.data_repasse).toLocaleDateString('pt-BR')} · {fBRL(Number(ultimoRepasse.valor_total))}</p>
                                    </div>
                                  )}
                                </div>
                                {f.repassesDaCompetencia.length > 1 && (
                                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {[...f.repassesDaCompetencia].sort((a, b) => new Date(b.data_repasse).getTime() - new Date(a.data_repasse).getTime()).map(r => (
                                      <p key={r.id} style={{ fontSize: '11px', color: '#B8AAB8' }}>{new Date(r.data_repasse).toLocaleDateString('pt-BR')} · {fBRL(Number(r.valor_total))} · {r.qtd_comissoes} comissõe{r.qtd_comissoes !== 1 ? 's' : ''}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0 }}>
                                <button className="btn-s" onClick={() => { setVerDetalhes(par); setFiltroPeriodo('tudo') }}>Ver detalhes</button>
                                {f.valorPendente > 0 && (
                                  <button className="btn-p" onClick={() => setConfirmandoRepasse({ parceiroId: f.parceiroId, competencia: competenciaFechamento, qtd: f.qtdComissoesPendentes, total: f.valorPendente })}>
                                    Confirmar repasse
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO PARCEIRO */}
      {verDetalhes && (() => {
        const todasDoParceiro = indicacoesDoParceiro(verDetalhes.id)
        const indsFiltradas = indicacoesNoPeriodo(todasDoParceiro)
        const comissoesDoParceiro = comissoes.filter(c => c.parceiro_id === verDetalhes.id)
        const pagsFiltradas = indsFiltradas.filter(ehPagante)
        const pendenteFiltrado = comissoesGeradasNoPeriodo(comissoesDoParceiro).filter(c => c.status === 'pendente').reduce((a, c) => a + Number(c.valor_comissao || 0), 0)
        const pagoFiltrado = comissoesPagasNoPeriodo(comissoesDoParceiro).reduce((a, c) => a + Number(c.valor_comissao || 0), 0)
        const resumo = resumoPorPlano(indsFiltradas, comissoesGeradasNoPeriodo(comissoesDoParceiro))

        return (
          <div className="modal-bg" onClick={() => setVerDetalhes(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '760px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
                <div>
                  <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '4px' }}>{verDetalhes.nome}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{verDetalhes.cupom}</span>
                    <span style={{ fontSize: '11px', color: '#B8AAB8' }}>{verDetalhes.tipo}</span>
                    <span className="badge" style={{ background: verDetalhes.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${verDetalhes.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: verDetalhes.ativo ? '#22C55E' : '#EF4444' }}>{verDetalhes.ativo ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <button className="btn-s" onClick={() => setVerDetalhes(null)} style={{ flexShrink: 0 }}>Fechar</button>
              </div>

              {/* Filtro de periodo */}
              <div style={{ marginTop: '18px', marginBottom: '16px' }}>
                <label className="lbl">Período</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: dataIni || filtroPeriodo === 'personalizado' ? '10px' : 0 }}>
                  {([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['mes_passado', 'Mês passado'], ['tudo', 'Todo período'], ['personalizado', 'Personalizado']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setFiltroPeriodo(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: filtroPeriodo === v ? 'none' : '1px solid #2A1A2F', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: filtroPeriodo === v ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(24,16,27,.88)', color: filtroPeriodo === v ? '#fff' : '#B8AAB8' }}>{l}</button>
                  ))}
                </div>
                {filtroPeriodo === 'personalizado' && (
                  <div className="fg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><label className="lbl">De</label><input type="date" className="inp" value={dataIni} onChange={e => setDataIni(e.target.value)} /></div>
                    <div><label className="lbl">Até</label><input type="date" className="inp" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
                  </div>
                )}
              </div>

              {/* KPIs filtrados */}
              <div className="kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '18px' }}>
                {[
                  { l: 'Cadastros', v: String(indsFiltradas.length), c: '#B8AAB8' },
                  { l: 'Pagantes', v: String(pagsFiltradas.length), c: '#22C55E' },
                  { l: 'Comissão pendente', v: fBRL(pendenteFiltrado), c: '#FACC15' },
                  { l: 'Comissão paga', v: fBRL(pagoFiltrado), c: '#22C55E' },
                ].map(k => (
                  <div key={k.l} style={{ background: '#18101B', border: '1.5px solid #2A1A2F', borderRadius: '14px', padding: '12px 10px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{k.l}</p>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: k.c }}>{k.v}</p>
                  </div>
                ))}
              </div>

              {/* Resumo por plano */}
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Resumo por plano</p>
              <div className="resumo-plano-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '22px' }}>
                {resumo.map(r => (
                  <div key={r.chave} style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.20)', borderRadius: '12px', padding: '12px 10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#C4B5FD', marginBottom: '8px' }}>{r.nome}</p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>Cadastros: <span style={{ color: '#F8F4F7', fontWeight: 700 }}>{r.cadastros}</span></p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>Pagantes: <span style={{ color: '#22C55E', fontWeight: 700 }}>{r.pagantes}</span></p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Comissão: <span style={{ color: '#EC4899', fontWeight: 700 }}>{fBRL(r.comissao)}</span></p>
                  </div>
                ))}
              </div>

              {/* A pagar (Fase 3D) - competencias com comissao pendente, agrupadas */}
              {competenciasPendentesDoParceiro(verDetalhes.id).length > 0 && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>A pagar</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
                    {competenciasPendentesDoParceiro(verDetalhes.id).map(grupo => (
                      <div key={grupo.competencia} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 14px', border: '1px solid rgba(250,204,21,.28)', borderRadius: '10px', background: 'rgba(250,204,21,.06)', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7' }}>{labelCompetencia(grupo.competencia)}</p>
                          <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{grupo.qtd} comissõe{grupo.qtd > 1 ? 's' : ''} · {fBRL(grupo.total)}</p>
                        </div>
                        <button className="btn-p" onClick={() => setConfirmandoRepasse({ parceiroId: verDetalhes.id, competencia: grupo.competencia, qtd: grupo.qtd, total: grupo.total, comissoesDoGrupo: grupo.comissoes })}>
                          Ver / Confirmar repasse
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Repasses (historico - Fase 3D) */}
              {repassesDoParceiro(verDetalhes.id).length > 0 && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Repasses</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
                    {repassesDoParceiro(verDetalhes.id).map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid #2A1A2F', borderRadius: '10px', background: 'rgba(24,16,27,.4)', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: '#F8F4F7', fontWeight: 600 }}>{labelCompetencia(r.competencia)}</p>
                          <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{r.qtd_comissoes} comissõe{r.qtd_comissoes > 1 ? 's' : ''} · Pago em {new Date(r.data_repasse).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <p style={{ fontSize: '13px', color: '#22C55E', fontWeight: 800 }}>{fBRL(Number(r.valor_total))}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Lista de indicacoes (mesmo padrao visual de card empilhado da aba Indicacoes - ja responsivo por natureza) */}
              {/* Comissoes (historico financeiro real - Fase 3C) */}
              {comissoesDoParceiro.length > 0 && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Comissões ({comissoesDoParceiro.length})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
                    {[...comissoesDoParceiro].sort((a, b) => new Date(b.data_pagamento_cliente).getTime() - new Date(a.data_pagamento_cliente).getTime()).map(c => {
                      const ind = indicacoes.find(i => i.id === c.indicacao_id)
                      return (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid #2A1A2F', borderRadius: '10px', background: 'rgba(24,16,27,.4)', flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontSize: '12px', color: '#F8F4F7', fontWeight: 600 }}>{ind?.nome_negocio || ind?.email || '—'}</p>
                            <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{new Date(c.data_pagamento_cliente).toLocaleDateString('pt-BR')} · {infoDoPlano(normalizarPlano(c.plano_tipo)).nomeComercial}</p>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Pago: {fBRL(Number(c.valor_pago))}</p>
                            <p style={{ fontSize: '12px', color: '#EC4899', fontWeight: 700 }}>Comissão: {fBRL(Number(c.valor_comissao))}</p>
                            <p style={{ fontSize: '10px', color: c.status === 'paga' ? '#22C55E' : c.status === 'estornada' ? '#F87171' : '#FACC15' }}>{labelStatusComissao(c.status)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Indicações no período ({indsFiltradas.length})</p>
              {indsFiltradas.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '16px 0', textAlign: 'center' }}>Nenhuma indicação neste período.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {indsFiltradas.map(ind => {
                    const infoPlano = infoDoPlano(normalizarPlano(ind.plano_tipo))
                    const temPlanoDefinido = ind.plano_tipo !== null && ind.plano_tipo !== undefined && ind.plano_tipo !== ''
                    const ultima = ultimaComissao(ind.id)
                    return (
                      <div key={ind.id} style={{ padding: '14px', border: '1px solid #2A1A2F', borderRadius: '12px', background: 'rgba(24,16,27,.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '2px' }}>{ind.nome_negocio || ind.nome_responsavel || '—'}</p>
                            {ind.slug && <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '1px' }}>minipage.pro/{ind.slug}</p>}
                            {ind.email && <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '6px' }}>{ind.email}</p>}
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              <span className="badge" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.26)', color: '#C4B5FD' }}>{temPlanoDefinido ? infoPlano.nomeComercial : 'Não definido'}</span>
                              <span className="badge" style={{ background: ehPagante(ind) ? 'rgba(34,197,94,.12)' : 'rgba(236,72,153,.12)', border: `1px solid ${ehPagante(ind) ? 'rgba(34,197,94,.24)' : 'rgba(236,72,153,.24)'}`, color: ehPagante(ind) ? '#22C55E' : '#EC4899' }}>{ehPagante(ind) ? 'Pagante' : 'Cadastro'}</span>
                              {labelStatusAcesso(ind.status_acesso) && (() => { const st = labelStatusAcesso(ind.status_acesso)!; return <span className="badge" style={{ background: st.bg, border: `1px solid ${st.borda}`, color: st.cor }}>{st.texto}</span> })()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                            <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '2px' }}>{ind.created_at ? new Date(ind.created_at).toLocaleDateString('pt-BR') : '—'}</p>
                            {ultima ? (
                              <>
                                <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '2px' }}>Valor pago: {fBRL(Number(ultima.valor_pago))}</p>
                                <p style={{ fontSize: '13px', color: '#EC4899', fontWeight: 800 }}>Comissão: {fBRL(Number(ultima.valor_comissao))}</p>
                                <p style={{ fontSize: '10px', color: ultima.status === 'paga' ? '#22C55E' : ultima.status === 'estornada' ? '#F87171' : '#FACC15' }}>{labelStatusComissao(ultima.status)}</p>
                              </>
                            ) : (
                              temPlanoDefinido && <p style={{ fontSize: '10px', color: '#B8AAB8' }}>Plano: {fBRL(infoPlano.mensalidade)}/mês</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* MODAL */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '20px' }}>{editando ? 'Editar parceiro' : 'Novo parceiro'}</p>
            {msg && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{msg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label className="lbl">Nome do parceiro *</label><input className="inp" type="text" placeholder="Ex: João Barbearia" value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div>
                <label className="lbl">Cupom *</label>
                <input className="inp" type="text" placeholder="Ex: JOAO" value={cupom} onChange={e => setCupom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
                <p style={{ fontSize: '11px', color: '#B8AAB8', marginTop: '4px' }}>Letras e números, sem espaços.</p>
              </div>
              <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e => setWpp(e.target.value)} /></div>
              <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="parceiro@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div>
                <label className="lbl">Tipo</label>
                <select className="inp" value={tipo} onChange={e => setTipo(e.target.value)} style={{ cursor: 'pointer' }}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#B8AAB8', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.20)', borderRadius: '10px', padding: '10px 12px' }}>Comissão: 20% recorrente sobre cada mensalidade paga pelos clientes indicados, por até 12 meses. Regra aplicada a todos os parceiros.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setAtivo(!ativo)} style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', background: ativo ? '#EC4899' : '#2A1A2F' }}>
                  <span style={{ position: 'absolute', top: '2px', left: ativo ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </button>
                <span style={{ fontSize: '13px', color: '#B8AAB8' }}>Parceiro ativo</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-s" onClick={() => { setShowModal(false); resetForm() }} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-p" onClick={salvar} style={{ flex: 2 }}>Salvar parceiro</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmandoExclusao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setConfirmandoExclusao(null)}>
          <div style={{ background: 'linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))', border: '1.5px solid #2A1A2F', borderRadius: '18px', padding: '28px', maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {temHistorico(confirmandoExclusao.id) ? (
              <>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Este parceiro não pode ser excluído</p>
                <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '22px' }}>Este parceiro possui indicações ou comissões vinculadas e não pode ser excluído permanentemente. Você pode desativá-lo para preservar o histórico.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-s" onClick={() => setConfirmandoExclusao(null)} style={{ flex: 1 }}>Cancelar</button>
                  <button className="btn-p" onClick={desativarEFecharModal} style={{ flex: 1 }}>Desativar parceiro</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Excluir parceiro?</p>
                <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '22px' }}>Esta ação pode afetar vínculos e histórico de indicações. Confirme somente se tiver certeza.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-s" onClick={() => setConfirmandoExclusao(null)} style={{ flex: 1 }} disabled={excluindo}>Cancelar</button>
                  <button onClick={confirmarExclusao} disabled={excluindo} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '12px', height: '42px', fontSize: '13px', fontWeight: 700, cursor: excluindo ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{excluindo ? 'Excluindo...' : 'Excluir parceiro'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {confirmandoRepasse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => { if (!processandoRepasse) { setConfirmandoRepasse(null); setErroRepasse('') } }}>
          <div style={{ background: 'linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))', border: '1.5px solid #2A1A2F', borderRadius: '18px', padding: '28px', maxWidth: '440px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Confirmar repasse?</p>
            <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '18px' }}>Confirme somente após realizar o pagamento ao parceiro. Esta ação marcará as comissões desta competência como pagas.</p>
            <div style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.22)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '4px' }}>{labelCompetencia(confirmandoRepasse.competencia)}</p>
              <p style={{ fontSize: '12px', color: '#B8AAB8' }}>{confirmandoRepasse.qtd} comissõe{confirmandoRepasse.qtd > 1 ? 's' : ''} · Total: {fBRL(confirmandoRepasse.total)}</p>
            </div>
            {erroRepasse && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{erroRepasse}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-s" onClick={() => { setConfirmandoRepasse(null); setErroRepasse('') }} style={{ flex: 1 }} disabled={processandoRepasse}>Cancelar</button>
              <button onClick={confirmarRepasse} disabled={processandoRepasse} style={{ flex: 1, background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '12px', height: '42px', fontSize: '13px', fontWeight: 700, cursor: processandoRepasse ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {processandoRepasse ? 'Confirmando...' : 'Confirmar repasse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultadoRepasse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setResultadoRepasse(null)}>
          <div style={{ background: 'linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))', border: '1.5px solid rgba(34,197,94,.35)', borderRadius: '18px', padding: '28px', maxWidth: '420px', width: '100%', textAlign: 'center' as const }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#22C55E', marginBottom: '10px' }}>Repasse confirmado com sucesso</p>
            <p style={{ fontSize: '15px', color: '#F8F4F7', fontWeight: 700, marginBottom: '18px' }}>{fBRL(Number(resultadoRepasse.valor_total))}</p>
            <button className="btn-p" onClick={() => setResultadoRepasse(null)} style={{ width: '100%' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
