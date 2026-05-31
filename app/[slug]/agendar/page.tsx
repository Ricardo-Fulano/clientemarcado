'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sun, Clock, Moon } from 'lucide-react'

export default function Agendar() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const [perfil, setPerfil] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])

  const [etapa, setEtapa] = useState(1)
  const [servicoId, setServicoId] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const [mesAtual, setMesAtual] = useState(new Date())
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data: p } = await supabase.from('perfis').select('*').eq('slug', slug).single()
      setPerfil(p)
      const { data: s } = await supabase.from('servicos').select('*').eq('user_id', p.user_id)
      setServicos(s || [])
      const { data: pr } = await supabase.from('profissionais').select('*').eq('user_id', p.user_id)
      setProfissionais(pr || [])

      const servicoParam = searchParams.get('servico')
      if (servicoParam && s && s.find((sv: any) => sv.id === servicoParam)) {
        setServicoId(servicoParam)
        setEtapa(2)
      }
    }
    carregar()
  }, [slug])

  useEffect(() => {
    if (dataSelecionada && profissionalId && servicoId) carregarHorarios()
  }, [dataSelecionada, profissionalId, servicoId])

  async function carregarHorarios() {
    setCarregandoHorarios(true)
    setHorarioSelecionado('')
    const servico = servicos.find(s => s.id === servicoId)
    const duracaoServico = servico?.duracao_minutos || 30
    const intervalo = perfil?.intervalo_agenda || 30
    const horaAbertura = perfil?.hora_abertura || '08:00'
    const horaFechamento = perfil?.hora_fechamento || '18:00'

    const { data: bloqueios } = await supabase
      .from('bloqueios').select('*')
      .eq('user_id', perfil.user_id)
      .eq('data', dataSelecionada)

    const bloqueiosAtivos = (bloqueios || []).filter((b: any) =>
      !b.profissional_id || b.profissional_id === profissionalId
    )

    const { data: ags } = await supabase
      .from('agendamentos').select('data_hora, servico_id')
      .eq('profissional_id', profissionalId)
      .gte('data_hora', dataSelecionada + 'T00:00:00')
      .lte('data_hora', dataSelecionada + 'T23:59:59')
      .neq('status', 'cancelado')

    const [hAb, mAb] = horaAbertura.split(':').map(Number)
    const [hFech, mFech] = horaFechamento.split(':').map(Number)
    const inicioMin = hAb * 60 + mAb
    const fimMin = hFech * 60 + mFech

    const ocupados: { inicio: number; fim: number }[] = []
    for (const ag of ags || []) {
      const d = new Date(ag.data_hora)
      const min = d.getHours() * 60 + d.getMinutes()
      const dur = servicos.find(s => s.id === ag.servico_id)?.duracao_minutos || 30
      ocupados.push({ inicio: min, fim: min + dur })
    }

    const horarios: string[] = []
    for (let min = inicioMin; min + duracaoServico <= fimMin; min += intervalo) {
      const conflito = ocupados.some(oc => min < oc.fim && min + duracaoServico > oc.inicio)
      if (!conflito) {
        const h = Math.floor(min / 60).toString().padStart(2, '0')
        const m = (min % 60).toString().padStart(2, '0')
        horarios.push(h + ':' + m)
      }
    }

    const agora = new Date()
    const antecedencia = perfil?.antecedencia_minima || 0

    const finais = horarios.filter(h => {
      const dataHorario = new Date(dataSelecionada + 'T' + h + ':00')
      const diffMinutos = (dataHorario.getTime() - agora.getTime()) / 60000
      if (diffMinutos < antecedencia) return false
      const [hh, mm] = h.split(':').map(Number)
      const minHorario = hh * 60 + mm
      const conflitoBloqueio = bloqueiosAtivos.some((b: any) => {
        const [bhi, bmi] = b.hora_inicio.split(':').map(Number)
        const [bhf, bmf] = b.hora_fim.split(':').map(Number)
        return minHorario < bhf * 60 + bmf && minHorario + duracaoServico > bhi * 60 + bmi
      })
      return !conflitoBloqueio
    })

    setHorariosDisponiveis(finais)
    setCarregandoHorarios(false)
  }

  function aplicarMascaraTelefone(valor: string) {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length > 10) return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7)
    if (nums.length > 6) return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 6) + '-' + nums.slice(6)
    if (nums.length > 2) return '(' + nums.slice(0, 2) + ') ' + nums.slice(2)
    if (nums.length > 0) return '(' + nums
    return ''
  }

  async function handleAgendar() {
    setErro('')
    if (!clienteNome) { setErro('Informe seu nome.'); return }
    if (!clienteTelefone || clienteTelefone.replace(/\D/g, '').length < 10) {
      setErro('Informe seu WhatsApp com DDD.'); return
    }
    setLoading(true)
    const { error } = await supabase.from('agendamentos').insert({
      user_id: perfil.user_id,
      servico_id: servicoId,
      profissional_id: profissionalId,
      data_hora: dataSelecionada + 'T' + horarioSelecionado + ':00',
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
    })
    setLoading(false)
    if (error) setErro('Erro ao agendar. Tente novamente.')
    else setSucesso(true)
  }

  function baixarAgendaICS() {
    const inicio = new Date(dataSelecionada + 'T' + horarioSelecionado + ':00')
    const fim = new Date(inicio.getTime() + (servicoSelecionado?.duracao_minutos || 30) * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      'DTSTART:' + fmt(inicio), 'DTEND:' + fmt(fim),
      'SUMMARY:' + (servicoSelecionado?.nome || '') + ' - ' + (perfil?.nome_negocio || ''),
      'DESCRIPTION:Profissional: ' + (profissionalSelecionado?.nome || ''),
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'agendamento.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  const servicoSelecionado = servicos.find(s => s.id === servicoId)
  const profissionalSelecionado = profissionais.find(p => p.id === profissionalId)
  const todayStr = new Date().toISOString().split('T')[0]
  const linkWppEstabelecimento = perfil?.whatsapp
    ? 'https://wa.me/55' + perfil.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Olá! Acabei de agendar um horário pelo link e gostaria de confirmar.')
    : null

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate()
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay()
  const diasFunc: number[] = perfil?.dias_funcionamento || [1, 2, 3, 4, 5, 6]

  function isDiaDisponivel(dia: number) {
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia)
    return data >= hoje && diasFunc.includes(data.getDay())
  }

  function formatarData(dataStr: string) {
    const [ano, mes, dia] = dataStr.split('-')
    return dia + '/' + mes + '/' + ano
  }

  function formatarDataExtenso(dataStr: string) {
    const [ano, mes, dia] = dataStr.split('-')
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      .toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  const horariosManha = horariosDisponiveis.filter(h => parseInt(h) < 12)
  const horariosTarde = horariosDisponiveis.filter(h => parseInt(h) >= 12 && parseInt(h) < 18)
  const horariosNoite = horariosDisponiveis.filter(h => parseInt(h) >= 18)

  const nomeEtapas = ['Serviço', 'Profissional', 'Data e hora', 'Seus dados']

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .page {
      min-height: 100vh;
      background: #08080A;
      color: #F5F5F7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* ââ Header ââ */
    .header {
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 13px 16px;
      display: flex;
      align-items: center;
      background: rgba(9,9,11,0.96);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-back {
      color: #6B7280;
      text-decoration: none;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 48px;
    }
    .header-title {
      flex: 1;
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      color: #F1F5F9;
    }
    .header-spacer { min-width: 48px; }

    /* ââ Container ââ */
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px 16px 48px;
    }
    @media (min-width: 720px) {
      .container { max-width: 820px; padding: 28px 24px 64px; }
    }
    .container-wide {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px 16px 48px;
    }
    @media (min-width: 720px) {
      .container-wide { max-width: 1000px; padding: 28px 24px 64px; }
    }

    /* ââ Steps ââ */
    .steps-wrap { margin-bottom: 24px; }
    @media (min-width: 720px) { .steps-wrap { margin-bottom: 32px; } }
    .steps-track {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .step-dot.done   { background: #3B82F6; color: #fff; border: none; }
    .step-dot.active { background: #3B82F6; color: #fff; border: none; }
    .step-dot.idle   { background: rgba(255,255,255,0.05); color: #4B5563; border: 1px solid rgba(255,255,255,0.08); }
    .step-line {
      flex: 1;
      height: 1px;
      margin: 0 5px;
      transition: background 0.2s ease;
    }
    .step-labels {
      display: flex;
      justify-content: space-between;
    }
    .step-label {
      font-size: 9px;
      letter-spacing: 0.02em;
    }
    @media (min-width: 720px) {
      .step-dot { width: 30px; height: 30px; font-size: 12px; }
      .step-label { font-size: 10px; }
    }

    /* ââ Section heading ââ */
    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #F1F5F9;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .section-sub {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 20px;
    }
    @media (min-width: 720px) {
      .section-title { font-size: 22px; }
      .section-sub { margin-bottom: 24px; }
    }

    /* ââ Card base ââ */
    .card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
    }

    /* ââ Serviço cards ââ */
    .servico-list { display: flex; flex-direction: column; gap: 10px; }
    .servico-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      position: relative;
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .servico-card:hover, .servico-card:active {
      border-color: rgba(59,130,246,0.45);
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    }
    .servico-card.sel {
      border-color: #3B82F6;
      box-shadow: 0 0 0 1px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.12);
      background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(10,12,16,0.97) 100%);
    }
    .servico-accent {
      position: absolute; top: 0; left: 0; bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, rgba(59,130,246,0.8), transparent);
    }
    .servico-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 18px;
    }
    .servico-nome { font-weight: 700; font-size: 15px; color: #F1F5F9; margin-bottom: 3px; }
    .servico-desc { font-size: 12px; color: #9CA3AF; margin-bottom: 4px; line-height: 1.4; }
    .servico-meta { font-size: 13px; color: #6B7280; }
    .servico-preco { color: #22C55E; font-weight: 700; }
    .servico-arrow { font-size: 20px; color: #3B82F6; flex-shrink: 0; }

    /* ââ Profissional cards ââ */
    .prof-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    @media (min-width: 480px) {
      .prof-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 720px) {
      .prof-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    }
    .prof-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 20px 12px;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .prof-card:hover, .prof-card:active {
      border-color: rgba(59,130,246,0.45);
    }
    .prof-card.sel {
      border-color: #3B82F6;
      box-shadow: 0 0 0 1px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.12);
      background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(10,12,16,0.97) 100%);
    }
    .prof-avatar-img {
      width: 64px; height: 64px; border-radius: 999px; object-fit: cover;
    }
    .prof-avatar-letra {
      width: 64px; height: 64px; border-radius: 999px;
      background: rgba(59,130,246,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #3B82F6;
    }
    .prof-nome { font-size: 13px; font-weight: 700; color: #F1F5F9; margin-bottom: 2px; }
    .prof-cargo { font-size: 12px; color: #6B7280; }

    /* ââ Resumo strip (etapa 3) ââ */
    .resumo-strip {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    @media (min-width: 720px) {
      .resumo-strip {
        grid-template-columns: repeat(4, 1fr);
        padding: 16px 20px;
        margin-bottom: 18px;
      }
    }
    .resumo-item {
      padding: 6px 0;
    }
    .resumo-item:not(:last-child) {
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    @media (min-width: 720px) {
      .resumo-item { padding: 0; }
      .resumo-item:not(:last-child) {
        border-bottom: none;
        border-right: 1px solid rgba(255,255,255,0.06);
        padding-right: 16px;
        margin-right: 0;
      }
      .resumo-item:not(:first-child) { padding-left: 16px; }
    }
    .resumo-label {
      font-size: 9px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.07em;
      color: #4B5563; margin-bottom: 3px;
    }
    .resumo-valor {
      font-size: 13px; font-weight: 700;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ââ Etapa3 grid ââ */
    .etapa3-cols {
      display: flex; flex-direction: column; gap: 12px;
      margin-bottom: 14px;
    }
    @media (min-width: 720px) {
      .etapa3-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: start;
      }
    }

    /* ââ Calendário ââ */
    .cal-wrap {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 16px;
    }
    .cal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .cal-nav {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 7px 14px;
      color: #9CA3AF;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-mes {
      font-weight: 700; font-size: 13px;
      text-transform: capitalize; color: #F1F5F9;
    }
    .cal-dow {
      display: grid; grid-template-columns: repeat(7, 1fr);
      gap: 2px; margin-bottom: 6px;
    }
    .cal-dow-label {
      text-align: center; font-size: 10px;
      font-weight: 700; color: #374151; padding: 3px 0;
    }
    .cal-days {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
    }
    .dia {
      padding: 9px 2px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: default;
      border: 1px solid transparent;
      text-align: center;
      background: transparent;
      color: #2D3748;
      transition: all 0.15s ease;
      -webkit-tap-highlight-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .dia.disp {
      color: #CBD5E0; background: rgba(255,255,255,0.04);
      cursor: pointer; font-weight: 600;
    }
    .dia.disp:hover, .dia.disp:active {
      background: rgba(59,130,246,0.14);
      color: #F1F5F9;
      border-color: rgba(59,130,246,0.2);
    }
    .dia.hoje { border-color: rgba(59,130,246,0.5); color: #3B82F6; font-weight: 700; }
    .dia.sel  {
      background: #3B82F6 !important; color: #fff !important;
      border-color: #3B82F6 !important; font-weight: 700;
      box-shadow: 0 2px 8px rgba(59,130,246,0.35);
    }

    /* ââ Horários ââ */
    .horarios-wrap {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 16px;
      min-height: 180px;
    }
    .horarios-data-label {
      font-size: 12px; font-weight: 600; color: #9CA3AF;
      margin-bottom: 12px;
      text-transform: capitalize;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .periodo-label-row {
      display: flex; align-items: center; gap: 5px; margin-bottom: 8px;
    }
    .periodo-label {
      font-size: 10px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.09em;
    }
    .horarios-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
      margin-bottom: 14px;
    }
    @media (min-width: 400px) {
      .horarios-grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (min-width: 720px) {
      .horarios-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); }
    }
    .h-btn {
      padding: 11px 4px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.08);
      text-align: center;
      background: linear-gradient(180deg, rgba(22,28,40,0.98) 0%, rgba(12,15,22,0.98) 100%);
      color: #D1D5DB;
      transition: all 0.15s ease;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    .h-btn:hover, .h-btn:active {
      border-color: rgba(59,130,246,0.5);
      color: #F1F5F9;
      background: rgba(59,130,246,0.07);
    }
    .h-btn.sel {
      background: #3B82F6; border-color: #3B82F6;
      color: #fff; box-shadow: 0 0 0 2px rgba(59,130,246,0.25);
    }
    .horarios-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 140px; gap: 8px;
    }
    .horarios-placeholder {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 160px; gap: 10px;
    }

    /* ââ Nav buttons ââ */
    .nav-row { display: flex; gap: 10px; }
    .btn-voltar {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 14px;
      font-size: 14px; font-weight: 600;
      color: #6B7280; cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-voltar:hover { background: rgba(255,255,255,0.07); color: #9CA3AF; }
    .btn-continuar {
      flex: 2;
      border: none; border-radius: 12px;
      padding: 14px;
      font-size: 15px; font-weight: 700;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-continuar.on  { background: #3B82F6; color: #fff; box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
    .btn-continuar.off { background: rgba(59,130,246,0.12); color: #374151; cursor: not-allowed; }
    .btn-confirmar {
      flex: 2; background: #3B82F6; border: none;
      border-radius: 12px; padding: 14px;
      font-size: 15px; font-weight: 700; color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-link-voltar {
      font-size: 13px; color: #6B7280; background: none; border: none;
      cursor: pointer; padding: 4px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* ââ Inputs ââ */
    .input-field {
      width: 100%;
      background: rgba(18,22,30,0.97);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 14px 16px;
      color: #F1F5F9;
      font-size: 16px; /* 16px prevents iOS zoom */
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .input-field:focus {
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input-field::placeholder { color: #4B5563; }
    .input-label {
      font-size: 11px; font-weight: 600; color: #9CA3AF;
      text-transform: uppercase; letter-spacing: 0.08em;
      display: block; margin-bottom: 8px;
    }

    /* ââ Resumo card (etapa 4) ââ */
    .resumo-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; padding: 18px 20px; margin-bottom: 22px;
    }
    .resumo-card-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #4B5563; margin-bottom: 14px;
    }
    .resumo-row {
      display: flex; justify-content: space-between; align-items: center;
    }
    .resumo-row-label { font-size: 13px; color: #6B7280; }
    .resumo-row-valor { font-size: 13px; font-weight: 700; }
    .resumo-divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 10px 0; }

    /* ââ Sucesso ââ */
    .sucesso-wrap {
      min-height: 100vh; background: #08080A;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .sucesso-inner { max-width: 440px; width: 100%; text-align: center; }
    .sucesso-icon {
      width: 68px; height: 68px; border-radius: 50%;
      background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 22px; font-size: 30px;
    }
    .sucesso-title { font-size: 22px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 8px; }
    .sucesso-sub { font-size: 14px; color: #6B7280; margin-bottom: 26px; line-height: 1.6; }
    .sucesso-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-wpp {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: #25D366; color: #fff; font-weight: 700;
      padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px;
    }
    .btn-ics {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: rgba(255,255,255,0.05); color: #F1F5F9; font-weight: 600;
      padding: 14px 28px; border-radius: 12px; font-size: 14px;
      border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .btn-inicio {
      display: inline-block; text-align: center;
      background: #3B82F6; color: #fff; font-weight: 700;
      padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px;
    }

    .erro-msg { font-size: 13px; color: #EF4444; margin-top: 10px; }
  `

  // ââ SUCESSO ââ
  if (sucesso) return (
    <div className="sucesso-wrap">
      <style>{css}</style>
      <div className="sucesso-inner">
        <div className="sucesso-icon">â</div>
        <h1 className="sucesso-title">Agendamento confirmado!</h1>
        <p className="sucesso-sub">
          Obrigado, <strong style={{ color: '#F1F5F9' }}>{clienteNome}</strong>! Seu agendamento foi recebido.
        </p>

        <div className="resumo-card">
          <p className="resumo-card-title">Resumo</p>
          {[
            { label: 'Serviço', valor: servicoSelecionado?.nome, cor: '#F1F5F9' },
            { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: '#F1F5F9' },
            { label: 'Data', valor: formatarData(dataSelecionada), cor: '#F1F5F9' },
            { label: 'Horário', valor: horarioSelecionado, cor: '#3B82F6' },
            { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: '#22C55E' },
          ].map((item, idx, arr) => (
            <div key={item.label}>
              <div className="resumo-row">
                <span className="resumo-row-label">{item.label}</span>
                <span className="resumo-row-valor" style={{ color: item.cor }}>{item.valor}</span>
              </div>
              {idx < arr.length - 1 && <hr className="resumo-divider" />}
            </div>
          ))}
        </div>

        <div className="sucesso-actions">
          {linkWppEstabelecimento && (
            <a href={linkWppEstabelecimento} target="_blank" rel="noopener noreferrer" className="btn-wpp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar com o estabelecimento
            </a>
          )}
          <button onClick={baixarAgendaICS} className="btn-ics">ð Adicionar Ã  agenda do celular</button>
          <Link href={'/' + slug} className="btn-inicio">Voltar ao início</Link>
        </div>
      </div>
    </div>
  )

  // ââ Steps helper ââ
  const Steps = () => (
    <div className="steps-wrap">
      <div className="steps-track">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
            <div className={`step-dot ${etapa > n ? 'done' : etapa === n ? 'active' : 'idle'}`}>
              {etapa > n ? 'â' : n}
            </div>
            {n < 4 && (
              <div className="step-line" style={{ background: etapa > n ? '#3B82F6' : 'rgba(255,255,255,0.07)' }} />
            )}
          </div>
        ))}
      </div>
      <div className="step-labels">
        {nomeEtapas.map((nome, i) => (
          <span key={nome} className="step-label"
            style={{
              fontWeight: etapa === i + 1 ? 700 : 500,
              color: etapa === i + 1 ? '#3B82F6' : '#4B5563',
              flex: i < 3 ? 1 : 'none',
              textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center'
            }}>
            {nome}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <main className="page">
      <style>{css}</style>

      {/* HEADER */}
      <div className="header">
        <Link href={'/' + slug} className="header-back">â Voltar</Link>
        <p className="header-title">{perfil?.nome_negocio}</p>
        <div className="header-spacer" />
      </div>

      {/* ââ ETAPA 1 â SERVIÃO ââ */}
      {etapa === 1 && (
        <div className="container">
          <Steps />
          <h2 className="section-title">Escolha o serviço</h2>
          <p className="section-sub">Selecione o serviço desejado</p>
          <div className="servico-list">
            {servicos.map((s) => (
              <button key={s.id}
                onClick={() => { setServicoId(s.id); setEtapa(2) }}
                className={'servico-card' + (servicoId === s.id ? ' sel' : '')}>
                <div className="servico-accent" />
                <div className="servico-icon">âï¸</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="servico-nome">{s.nome}</p>
                  {s.descricao
                    ? <p className="servico-desc">{s.descricao}</p>
                    : <p className="servico-desc" style={{ color: '#4B5563' }}>Atendimento com horário marcado</p>
                  }
                  <p className="servico-meta">
                    {s.duracao_minutos ? s.duracao_minutos + ' min' : ''}
                    {s.duracao_minutos && s.preco ? ' Â· ' : ''}
                    {s.preco ? <span className="servico-preco">R$ {s.preco}</span> : null}
                  </p>
                </div>
                <span className="servico-arrow">âº</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ââ ETAPA 2 â PROFISSIONAL ââ */}
      {etapa === 2 && (
        <div className="container">
          <Steps />
          <h2 className="section-title">Escolha o profissional</h2>
          <p className="section-sub">Com quem deseja ser atendido?</p>
          <div className="prof-grid">
            {profissionais.map((p) => (
              <button key={p.id}
                onClick={() => { setProfissionalId(p.id); setEtapa(3) }}
                className={'prof-card' + (profissionalId === p.id ? ' sel' : '')}>
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nome} className="prof-avatar-img"
                      style={{ border: profissionalId === p.id ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.1)' }} />
                  : <div className="prof-avatar-letra"
                      style={{ border: profissionalId === p.id ? '2px solid #3B82F6' : '2px solid rgba(59,130,246,0.2)' }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                }
                <div>
                  <p className="prof-nome">{p.nome}</p>
                  <p className="prof-cargo">{p.cargo || 'Profissional'}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setEtapa(1)} className="btn-link-voltar">â Voltar</button>
        </div>
      )}

      {/* ââ ETAPA 3 â DATA E HORÃRIO ââ */}
      {etapa === 3 && (
        <div className="container-wide">
          <Steps />
          <h2 className="section-title">Data e horário</h2>
          <p className="section-sub">Escolha quando quer ser atendido</p>

          {/* Resumo strip */}
          <div className="resumo-strip">
            {[
              { label: 'Serviço', valor: servicoSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Duração', valor: (servicoSelecionado?.duracao_minutos || 30) + ' min', cor: '#F1F5F9' },
              { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: '#22C55E' },
            ].map(item => (
              <div key={item.label} className="resumo-item">
                <p className="resumo-label">{item.label}</p>
                <p className="resumo-valor" style={{ color: item.cor }}>{item.valor}</p>
              </div>
            ))}
          </div>

          {/* Duas colunas no desktop */}
          <div className="etapa3-cols">

            {/* Calendário */}
            <div className="cal-wrap">
              <div className="cal-header">
                <button className="cal-nav"
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}>â¹</button>
                <p className="cal-mes">{mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <button className="cal-nav"
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}>âº</button>
              </div>
              <div className="cal-dow">
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} className="cal-dow-label">{d}</div>
                ))}
              </div>
              <div className="cal-days">
                {Array.from({ length: primeiroDiaMes }).map((_, i) => <div key={'e'+i} />)}
                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1
                  const dataStr = mesAtual.getFullYear() + '-'
                    + String(mesAtual.getMonth() + 1).padStart(2, '0') + '-'
                    + String(dia).padStart(2, '0')
                  const disponivel = isDiaDisponivel(dia)
                  const selecionado = dataSelecionada === dataStr
                  const ehHoje = dataStr === todayStr
                  let cls = 'dia'
                  if (selecionado) cls += ' sel'
                  else if (disponivel && ehHoje) cls += ' disp hoje'
                  else if (disponivel) cls += ' disp'
                  return (
                    <button key={dia} disabled={!disponivel}
                      onClick={() => disponivel && setDataSelecionada(dataStr)}
                      className={cls}>
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Horários */}
            <div className="horarios-wrap">
              {!dataSelecionada && (
                <div className="horarios-placeholder">
                  <span style={{ fontSize: '30px', opacity: 0.25 }}>ð</span>
                  <p style={{ fontSize: '13px', color: '#4B5563', textAlign: 'center', lineHeight: 1.5 }}>
                    Selecione uma data<br />para ver os horários
                  </p>
                </div>
              )}
              {dataSelecionada && (
                <>
                  <p className="horarios-data-label">{formatarDataExtenso(dataSelecionada)}</p>
                  {carregandoHorarios && (
                    <div className="horarios-empty">
                      <p style={{ fontSize: '13px', color: '#6B7280' }}>Buscando horários...</p>
                    </div>
                  )}
                  {!carregandoHorarios && horariosDisponiveis.length === 0 && (
                    <div className="horarios-empty">
                      <span style={{ fontSize: '26px', opacity: 0.3 }}>ð</span>
                      <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>
                        Nenhum horário disponível<br />nesta data.
                      </p>
                    </div>
                  )}
                  {!carregandoHorarios && horariosDisponiveis.length > 0 && (
                    <div>
                      {[
                        { label: 'Manhã', icon: <Sun size={11} color="#9CA3AF" />, lista: horariosManha },
                        { label: 'Tarde', icon: <Clock size={11} color="#9CA3AF" />, lista: horariosTarde },
                        { label: 'Noite', icon: <Moon size={11} color="#9CA3AF" />, lista: horariosNoite },
                      ].filter(p => p.lista.length > 0).map((periodo) => (
                        <div key={periodo.label} style={{ marginBottom: '14px' }}>
                          <div className="periodo-label-row">
                            {periodo.icon}
                            <span className="periodo-label">{periodo.label}</span>
                          </div>
                          <div className="horarios-grid">
                            {periodo.lista.map(h => (
                              <button key={h}
                                onClick={() => setHorarioSelecionado(h)}
                                className={'h-btn' + (horarioSelecionado === h ? ' sel' : '')}>
                                {h}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rodapé */}
          <div className="nav-row">
            <button onClick={() => setEtapa(2)} className="btn-voltar">â Voltar</button>
            <button
              onClick={() => {
                if (!dataSelecionada || !horarioSelecionado) { setErro('Selecione data e horário.'); return }
                setErro(''); setEtapa(4)
              }}
              disabled={!dataSelecionada || !horarioSelecionado}
              className={'btn-continuar ' + (dataSelecionada && horarioSelecionado ? 'on' : 'off')}>
              Continuar â
            </button>
          </div>
          {erro && <p className="erro-msg">{erro}</p>}
        </div>
      )}

      {/* ââ ETAPA 4 â DADOS ââ */}
      {etapa === 4 && (
        <div className="container">
          <Steps />
          <h2 className="section-title">Seus dados</h2>
          <p className="section-sub">Para finalizar o agendamento</p>

          {/* Resumo */}
          <div className="resumo-card">
            <p className="resumo-card-title">Resumo</p>
            {[
              { label: 'Serviço', valor: servicoSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Data', valor: formatarData(dataSelecionada), cor: '#F1F5F9' },
              { label: 'Horário', valor: horarioSelecionado, cor: '#3B82F6' },
              { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: '#22C55E' },
            ].map((item, idx, arr) => (
              <div key={item.label}>
                <div className="resumo-row">
                  <span className="resumo-row-label">{item.label}</span>
                  <span className="resumo-row-valor" style={{ color: item.cor }}>{item.valor}</span>
                </div>
                {idx < arr.length - 1 && <hr className="resumo-divider" />}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
            <div>
              <label className="input-label">Seu nome *</label>
              <input type="text" placeholder="Ex: Maria Silva"
                value={clienteNome} onChange={e => setClienteNome(e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">WhatsApp *</label>
              <input type="tel" placeholder="(11) 99999-9999"
                value={clienteTelefone}
                onChange={e => setClienteTelefone(aplicarMascaraTelefone(e.target.value))}
                className="input-field" />
              <p style={{ fontSize: '12px', color: '#374151', marginTop: '6px' }}>
                Usado apenas para contato sobre seu agendamento.
              </p>
            </div>
          </div>

          {erro && <p className="erro-msg" style={{ marginBottom: '12px' }}>{erro}</p>}

          <div className="nav-row">
            <button onClick={() => setEtapa(3)} className="btn-voltar">â Voltar</button>
            <button onClick={handleAgendar} disabled={loading} className="btn-confirmar"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
