'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sun, Clock, Moon, Scissors, Sparkles, ClipboardList, ClipboardCheck, CalendarCheck, FileText, HeartPulse, ShieldPlus, Stethoscope } from 'lucide-react'

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
        setServicoId(servicoParam); setEtapa(2)
      }
    }
    carregar()
  }, [slug])

  useEffect(() => {
    if (dataSelecionada && profissionalId && servicoId) carregarHorarios()
  }, [dataSelecionada, profissionalId, servicoId])

  async function carregarHorarios() {
    setCarregandoHorarios(true); setHorarioSelecionado('')
    const servico = servicos.find(s => s.id === servicoId)
    const duracaoServico = servico?.duracao_minutos || 30
    const intervalo = perfil?.intervalo_agenda || 30
    const horaAbertura = perfil?.hora_abertura || '08:00'
    const horaFechamento = perfil?.hora_fechamento || '18:00'
    const { data: bloqueios } = await supabase.from('bloqueios').select('*').eq('user_id', perfil.user_id).eq('data', dataSelecionada)
    const bloqueiosAtivos = (bloqueios || []).filter((b: any) => !b.profissional_id || b.profissional_id === profissionalId)
    const { data: ags } = await supabase.from('agendamentos').select('data_hora, servico_id').eq('profissional_id', profissionalId).gte('data_hora', dataSelecionada + 'T00:00:00').lte('data_hora', dataSelecionada + 'T23:59:59').neq('status', 'cancelado')
    const [hAb, mAb] = horaAbertura.split(':').map(Number)
    const [hFech, mFech] = horaFechamento.split(':').map(Number)
    const inicioMin = hAb * 60 + mAb; const fimMin = hFech * 60 + mFech
    const ocupados: { inicio: number; fim: number }[] = []
    for (const ag of ags || []) {
      const d = new Date(ag.data_hora); const min = d.getHours() * 60 + d.getMinutes()
      const dur = servicos.find(s => s.id === ag.servico_id)?.duracao_minutos || 30
      ocupados.push({ inicio: min, fim: min + dur })
    }
    const horarios: string[] = []
    for (let min = inicioMin; min + duracaoServico <= fimMin; min += intervalo) {
      const conflito = ocupados.some(oc => min < oc.fim && min + duracaoServico > oc.inicio)
      if (!conflito) { const h = Math.floor(min/60).toString().padStart(2,'0'); const m = (min%60).toString().padStart(2,'0'); horarios.push(h+':'+m) }
    }
    const agora = new Date(); const antecedencia = perfil?.antecedencia_minima || 0
    const finais = horarios.filter(h => {
      const dataHorario = new Date(dataSelecionada + 'T' + h + ':00')
      if ((dataHorario.getTime() - agora.getTime()) / 60000 < antecedencia) return false
      const [hh, mm] = h.split(':').map(Number); const minHorario = hh * 60 + mm
      return !bloqueiosAtivos.some((b: any) => {
        const [bhi, bmi] = b.hora_inicio.split(':').map(Number); const [bhf, bmf] = b.hora_fim.split(':').map(Number)
        return minHorario < bhf * 60 + bmf && minHorario + duracaoServico > bhi * 60 + bmi
      })
    })
    setHorariosDisponiveis(finais); setCarregandoHorarios(false)
  }

  function aplicarMascaraTelefone(valor: string) {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length > 10) return '(' + nums.slice(0,2) + ') ' + nums.slice(2,7) + '-' + nums.slice(7)
    if (nums.length > 6) return '(' + nums.slice(0,2) + ') ' + nums.slice(2,6) + '-' + nums.slice(6)
    if (nums.length > 2) return '(' + nums.slice(0,2) + ') ' + nums.slice(2)
    if (nums.length > 0) return '(' + nums
    return ''
  }

  async function handleAgendar() {
    setErro('')
    if (!clienteNome) { setErro('Informe seu nome.'); return }
    if (!clienteTelefone || clienteTelefone.replace(/\D/g,'').length < 10) { setErro('Informe seu WhatsApp com DDD.'); return }
    setLoading(true)
    const { error } = await supabase.from('agendamentos').insert({
      user_id: perfil.user_id, servico_id: servicoId, profissional_id: profissionalId,
      data_hora: dataSelecionada + 'T' + horarioSelecionado + ':00',
      cliente_nome: clienteNome, cliente_telefone: clienteTelefone,
    })
    setLoading(false)
    if (error) setErro('Erro ao agendar. Tente novamente.')
    else setSucesso(true)
  }

  function baixarAgendaICS() {
    const inicio = new Date(dataSelecionada + 'T' + horarioSelecionado + ':00')
    const fim = new Date(inicio.getTime() + (servicoSelecionado?.duracao_minutos || 30) * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','DTSTART:'+fmt(inicio),'DTEND:'+fmt(fim),
      'SUMMARY:'+(servicoSelecionado?.nome||'')+' - '+(perfil?.nome_negocio||''),
      'DESCRIPTION:Profissional: '+(profissionalSelecionado?.nome||''),
      'END:VEVENT','END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics],{type:'text/calendar'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='agendamento.ics'; a.click()
    URL.revokeObjectURL(url)
  }

// à Gera PDF premium via window.open (mesma estratégia do PDF de orçamento)
  function baixarConfirmacaoPDF() {
    const nomeCliente = clienteNome || 'cliente'
    const dataFormatada = formatarData(dataSelecionada)
    const dataEmissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const agora = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const nomeNegocio = perfil?.nome_negocio || 'Estabelecimento'
    const endereco = perfil?.endereco || ''
    const wppRaw = (perfil?.whatsapp || '').replace(/\D/g, '')
    const whatsapp = wppRaw ? `(${wppRaw.slice(0,2)}) ${wppRaw.slice(2,7)}-${wppRaw.slice(7)}` : ''
    const servNome = servicoSelecionado?.nome || ''
    const profNome = profissionalSelecionado?.nome || ''
    const precoRaw = servicoSelecionado?.preco
    const valor = precoRaw ? 'R$\u00a0' + Number(precoRaw).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
    const nomeArquivo = 'confirmacao-agendamento-' + nomeCliente.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '-' + dataSelecionada

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Comprovante de Agendamento - ${nomeNegocio}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#fff;color:#1E293B;font-size:14px;line-height:1.5}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{max-width:800px;margin:0 auto;padding:0}
  .hdr{background:linear-gradient(135deg,#1E3A5F 0%,#2D1B69 100%);padding:32px 40px;position:relative;overflow:hidden}
  .hdr::after{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.05)}
  .hdr::before{content:'';position:absolute;bottom:-40px;left:40px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04)}
  .hdr-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
  .hdr-left h1{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;margin-bottom:3px}
  .hdr-left .doc-type{font-size:13px;color:rgba(255,255,255,.65);font-weight:500;margin-bottom:12px}
  .hdr-right{text-align:right;flex-shrink:0}
  .hdr-right .doc-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .hdr-right .doc-date{font-size:14px;font-weight:700;color:#fff}
  .hdr-right .doc-time{font-size:11px;color:rgba(255,255,255,.5);margin-top:2px}
  .status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em;margin-top:10px;background:rgba(34,197,94,.18);color:#4ADE80;border:1px solid rgba(34,197,94,.35)}
  .status-dot{width:6px;height:6px;border-radius:50%;background:#4ADE80;flex-shrink:0}
  .body{padding:0 40px 40px}
  .section{margin-top:28px}
  .section-title{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #E2E8F0}
  .highlight-box{background:linear-gradient(135deg,#EFF6FF,#F5F3FF);border:1.5px solid #BFDBFE;border-radius:14px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}
  .hl-label{font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .hl-value{font-size:22px;font-weight:900;color:#1E293B;letter-spacing:-0.02em}
  .hl-sub{font-size:12px;color:#6366F1;margin-top:3px;font-weight:600}
  .valor-label{font-size:10px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;text-align:right}
  .valor-value{font-size:22px;font-weight:900;color:#15803D;text-align:right}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden}
  .info-cell{padding:14px 18px;border-bottom:1px solid #F1F5F9}
  .info-cell:nth-last-child(-n+2){border-bottom:none}
  .info-cell:nth-child(odd){border-right:1px solid #F1F5F9}
  .info-label{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .info-value{font-size:14px;font-weight:700;color:#1E293B}
  .info-value.purple{color:#6366F1}
  .info-value.blue{color:#1D4ED8}
  .info-value.green{color:#15803D}
  .estab-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 20px}
  .estab-nome{font-size:15px;font-weight:800;color:#1E293B;margin-bottom:10px}
  .estab-row{font-size:12px;color:#475569;margin-bottom:5px;display:flex;align-items:flex-start;gap:6px}
  .obs-box{background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px}
  .obs-text{font-size:12px;color:#92400E;line-height:1.6}
  .footer{margin-top:32px;padding:16px 40px;background:#F8FAFC;border-top:1.5px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center}
  .footer-brand{font-size:12px;font-weight:700;color:#6366F1}
  .footer-right{font-size:11px;color:#94A3B8;text-align:right}
  @media print{
    body{margin:0}
    .page{max-width:100%}
    @page{margin:10mm;size:A4}
  }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-inner">
      <div class="hdr-left">
        <h1>${nomeNegocio}</h1>
        <div class="doc-type">Comprovante de agendamento</div>
        <span class="status-badge"><span class="status-dot"></span>Agendamento confirmado</span>
      </div>
      <div class="hdr-right">
        <div class="doc-label">Emitido em</div>
        <div class="doc-date">${dataEmissao}</div>
        <div class="doc-time">${horaEmissao}</div>
      </div>
    </div>
  </div>

  <div class="body">

    <div class="section">
      <div class="section-title">Data e hor\u00e1rio do atendimento</div>
      <div class="highlight-box">
        <div>
          <div class="hl-label">Data e hor\u00e1rio</div>
          <div class="hl-value">${dataFormatada} \u00b7 ${horarioSelecionado}</div>
          <div class="hl-sub">${servNome}</div>
        </div>
        ${valor ? `<div><div class="valor-label">Valor</div><div class="valor-value">${valor}</div></div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informa\u00e7\u00f5es do agendamento</div>
      <div class="info-grid">
        <div class="info-cell">
          <div class="info-label">Cliente</div>
          <div class="info-value">${nomeCliente}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">WhatsApp</div>
          <div class="info-value">${clienteTelefone || '\u2014'}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Servi\u00e7o</div>
          <div class="info-value purple">${servNome}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Profissional</div>
          <div class="info-value">${profNome || '\u2014'}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Data</div>
          <div class="info-value blue">${dataFormatada}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Hor\u00e1rio</div>
          <div class="info-value blue">${horarioSelecionado}</div>
        </div>
        ${valor ? `<div class="info-cell" style="grid-column:1/-1">
          <div class="info-label">Valor do servi\u00e7o</div>
          <div class="info-value green">${valor}</div>
        </div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Estabelecimento</div>
      <div class="estab-box">
        <div class="estab-nome">${nomeNegocio}</div>
        ${endereco ? `<div class="estab-row"><span>\ud83d\udccd</span><span>${endereco}</span></div>` : ''}
        ${whatsapp ? `<div class="estab-row"><span>\ud83d\udcf1</span><span>${whatsapp}</span></div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="obs-box">
        <div class="obs-text">\u2139\ufe0f Em caso de d\u00favidas ou necessidade de remarcar\u00e7\u00e3o, entre em contato com o estabelecimento com anteced\u00eancia.</div>
      </div>
    </div>

    <div class="section" style="margin-top:36px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
        <div>
          <div style="border-top:1.5px solid #CBD5E1;padding-top:8px">
            <div style="font-size:11px;color:#94A3B8">${nomeNegocio}</div>
            <div style="font-size:10px;color:#CBD5E1;margin-top:2px">Assinatura / Carimbo</div>
          </div>
        </div>
        <div>
          <div style="border-top:1.5px solid #CBD5E1;padding-top:8px">
            <div style="font-size:11px;color:#94A3B8">${nomeCliente}</div>
            <div style="font-size:10px;color:#CBD5E1;margin-top:2px">Assinatura do cliente</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="footer-brand">ClienteMarcado \u00b7 Gerado em ${agora}</div>
    <div class="footer-right">Documento n\u00e3o possui validade jur\u00eddica sem assinatura</div>
  </div>
</div>
</body>
</html>`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 2000)
    }, 600)
  }


  const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
  const cor = perfil?.cor_tema || '#3B82F6'
  const servicoSelecionado = servicos.find(s => s.id === servicoId)
  const profissionalSelecionado = profissionais.find(p => p.id === profissionalId)
  const todayStr = new Date().toISOString().split('T')[0]
  const linkWppEstabelecimento = perfil?.whatsapp
    ? 'https://wa.me/55' + perfil.whatsapp.replace(/\D/g,'') + '?text=' + encodeURIComponent('Olá! Acabei de agendar um horário pelo link e gostaria de confirmar.')
    : null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth()+1, 0).getDate()
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay()
  const diasFunc: number[] = perfil?.dias_funcionamento || [1,2,3,4,5,6]

  function isDiaDisponivel(dia: number) {
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia)
    return data >= hoje && diasFunc.includes(data.getDay())
  }
  function formatarData(dataStr: string) { const [ano,mes,dia]=dataStr.split('-'); return dia+'/'+mes+'/'+ano }
  function formatarDataExtenso(dataStr: string) {
    const [ano,mes,dia]=dataStr.split('-')
    return new Date(parseInt(ano),parseInt(mes)-1,parseInt(dia)).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})
  }

  const horariosManha = horariosDisponiveis.filter(h => parseInt(h) < 12)
  const horariosTarde = horariosDisponiveis.filter(h => parseInt(h) >= 12 && parseInt(h) < 18)
  const horariosNoite = horariosDisponiveis.filter(h => parseInt(h) >= 18)
  const nomeEtapas = ['Atendimento','Profissional','Data e hora','Seus dados']

  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{overflow-x:hidden;width:100%;max-width:100%}
    .page{min-height:100vh;background:radial-gradient(ellipse at top,rgba(124,58,237,.10),transparent 50%),linear-gradient(180deg,#060C18 0%,#050B16 100%);color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .header{border-bottom:1px solid rgba(148,163,184,.10);padding:14px 20px;display:flex;align-items:center;background:rgba(5,11,22,.97);backdrop-filter:blur(20px);position:sticky;top:0;z-index:10}
    .header-back{color:#64748B;text-decoration:none;font-size:14px;display:flex;align-items:center;gap:4px;min-width:60px;font-weight:500;transition:color .15s}
    .header-back:hover{color:#94A3B8}
    .header-title{flex:1;text-align:center;font-size:15px;font-weight:800;color:#F8FAFC;letter-spacing:-0.01em}
    .header-spacer{min-width:60px}
    .container{max-width:680px;margin:0 auto;padding:24px 16px 60px}
    .container-wide{max-width:980px;margin:0 auto;padding:24px 16px 60px}
    @media(min-width:768px){.container{padding:40px 32px 100px;max-width:720px}.container-wide{padding:40px 32px 100px;max-width:1040px}}
    .steps-wrap{margin-bottom:28px}
    .steps-track{display:flex;align-items:center;margin-bottom:10px}
    .step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .2s}
    .step-dot.done{background:${G};color:#fff;box-shadow:0 0 16px rgba(124,58,237,.35)}
    .step-dot.active{background:${G};color:#fff;box-shadow:0 0 20px rgba(59,130,246,.40)}
    .step-dot.idle{background:rgba(15,23,42,.88);color:#475569;border:1px solid rgba(148,163,184,.12)}
    .step-line{flex:1;height:2px;margin:0 6px;border-radius:1px;transition:background .2s}
    .step-labels{display:flex;justify-content:space-between}
    .step-label{font-size:10px;letter-spacing:.02em}
    .section-title{font-size:22px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:6px}
    .section-sub{font-size:14px;color:#64748B;margin-bottom:24px;line-height:1.5}
    .servico-list{display:flex;flex-direction:column;gap:10px}
    .servico-card{display:flex;align-items:center;gap:16px;background:radial-gradient(circle at top left,rgba(59,130,246,.05),transparent 55%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.12);border-radius:16px;padding:18px 16px 18px 20px;cursor:pointer;text-align:left;width:100%;position:relative;overflow:hidden;transition:all .18s;-webkit-tap-highlight-color:transparent}
    .servico-card:hover{border-color:rgba(59,130,246,.45);box-shadow:0 8px 32px rgba(0,0,0,.28),0 0 0 1px rgba(59,130,246,.12);transform:translateY(-1px)}
    .servico-card.sel{border-color:rgba(59,130,246,.65);box-shadow:0 0 0 1px rgba(59,130,246,.22),0 10px 36px rgba(59,130,246,.14);background:radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 55%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))}
    .servico-accent{position:absolute;top:0;left:0;bottom:0;width:3px;background:${G};border-radius:0 2px 2px 0}
    .servico-icon{width:46px;height:46px;border-radius:13px;background:rgba(59,130,246,.10);border:1px solid rgba(59,130,246,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .servico-nome{font-weight:700;font-size:15px;color:#F8FAFC;margin-bottom:3px;line-height:1.3}
    .servico-desc{font-size:12px;color:#64748B;margin-bottom:7px;line-height:1.5}
    .servico-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:#64748B}
    .servico-meta-sep{width:3px;height:3px;border-radius:50%;background:#334155;flex-shrink:0}
    .servico-preco{color:#22C55E;font-weight:700;font-size:13px}
    .servico-dur{display:flex;align-items:center;gap:3px;color:#64748B}
    .servico-arrow{width:28px;height:28px;border-radius:8px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#3B82F6;font-size:16px;transition:all .15s}
    .servico-card:hover .servico-arrow{background:rgba(59,130,246,.16);border-color:rgba(59,130,246,.30)}
    .prof-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
    @media(min-width:480px){.prof-grid{grid-template-columns:repeat(3,1fr)}}
    @media(min-width:768px){.prof-grid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}}
    .prof-card{display:flex;flex-direction:column;align-items:center;gap:12px;background:radial-gradient(circle at top,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:24px 16px;cursor:pointer;text-align:center;transition:all .18s;-webkit-tap-highlight-color:transparent}
    .prof-card:hover{border-color:rgba(59,130,246,.40);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.25)}
    .prof-card.sel{border-color:rgba(59,130,246,.70);box-shadow:0 0 0 1px rgba(59,130,246,.25),0 8px 32px rgba(59,130,246,.15);background:radial-gradient(circle at top,rgba(59,130,246,.12),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))}
    .prof-avatar-img{width:72px;height:72px;border-radius:50%;object-fit:cover}
    .prof-avatar-letra{width:72px;height:72px;border-radius:50%;background:rgba(59,130,246,.12);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#3B82F6}
    .prof-nome{font-size:14px;font-weight:700;color:#F8FAFC;margin-bottom:3px}
    .prof-cargo{font-size:12px;color:#64748B}
    .resumo-strip{display:grid;grid-template-columns:repeat(2,1fr);background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:16px 20px;margin-bottom:18px;gap:12px}
    @media(min-width:768px){.resumo-strip{grid-template-columns:repeat(4,1fr)}}
    .resumo-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin-bottom:4px}
    .resumo-valor{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .etapa3-cols{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}
    @media(min-width:768px){.etapa3-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}}
    .cal-wrap{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:20px}
    .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .cal-nav{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:10px;padding:8px 16px;color:#94A3B8;cursor:pointer;font-size:16px;line-height:1;transition:all .15s;-webkit-tap-highlight-color:transparent}
    .cal-nav:hover{border-color:rgba(59,130,246,.35);color:#F8FAFC}
    .cal-mes{font-weight:700;font-size:14px;text-transform:capitalize;color:#F8FAFC}
    .cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:8px}
    .cal-dow-label{text-align:center;font-size:11px;font-weight:700;color:#334155;padding:4px 0}
    .cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
    .dia{padding:10px 2px;border-radius:10px;font-size:13px;font-weight:500;cursor:default;border:1px solid transparent;text-align:center;background:transparent;color:#1E293B;transition:all .15s;-webkit-tap-highlight-color:transparent;font-family:inherit}
    .dia.disp{color:#CBD5E1;background:rgba(255,255,255,.04);cursor:pointer;font-weight:600}
    .dia.disp:hover{background:rgba(59,130,246,.14);color:#F8FAFC;border-color:rgba(59,130,246,.25)}
    .dia.hoje{border-color:rgba(59,130,246,.50);color:#3B82F6;font-weight:700}
    .dia.sel{background:${G}!important;color:#fff!important;border-color:transparent!important;font-weight:700;box-shadow:0 4px 12px rgba(59,130,246,.35)}
    .horarios-wrap{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:20px;min-height:200px}
    .horarios-data-label{font-size:13px;font-weight:600;color:#94A3B8;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(148,163,184,.08);text-transform:capitalize}
    .periodo-label-row{display:flex;align-items:center;gap:5px;margin-bottom:8px}
    .periodo-label{font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.09em}
    .horarios-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
    @media(min-width:400px){.horarios-grid{grid-template-columns:repeat(4,1fr)}}
    .h-btn{padding:12px 4px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.12);text-align:center;background:rgba(15,23,42,.88);color:#CBD5E1;transition:all .15s;width:100%;font-family:inherit;-webkit-tap-highlight-color:transparent}
    .h-btn:hover{border-color:rgba(59,130,246,.45);color:#F8FAFC;background:rgba(59,130,246,.08)}
    .h-btn.sel{background:${G};border-color:transparent;color:#fff;box-shadow:0 0 0 2px rgba(59,130,246,.30)}
    .nav-row{display:flex;gap:10px}
    .btn-voltar{flex:1;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:14px;padding:14px;font-size:14px;font-weight:600;color:#64748B;cursor:pointer;transition:all .15s;font-family:inherit;-webkit-tap-highlight-color:transparent}
    .btn-voltar:hover{border-color:rgba(148,163,184,.25);color:#94A3B8}
    .btn-continuar{flex:2;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;-webkit-tap-highlight-color:transparent}
    .btn-continuar.on{background:${G};color:#fff;box-shadow:0 8px 24px rgba(59,130,246,.30)}
    .btn-continuar.off{background:rgba(59,130,246,.08);color:#334155;cursor:not-allowed}
    .btn-confirmar{flex:2;background:${G};border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(59,130,246,.30);font-family:inherit;transition:opacity .15s;-webkit-tap-highlight-color:transparent}
    .btn-link-voltar{font-size:13px;color:#64748B;background:none;border:none;cursor:pointer;padding:4px 0;font-family:inherit;transition:color .15s}
    .btn-link-voltar:hover{color:#94A3B8}
    .input-field{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:14px;padding:14px 16px;color:#F8FAFC;font-size:16px;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;font-family:inherit}
    .input-field:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
    .input-field::placeholder{color:#334155}
    .input-label{font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:8px}
    .resumo-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:20px 22px;margin-bottom:24px}
    .resumo-card-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:#475569;margin-bottom:16px}
    .resumo-row{display:flex;justify-content:space-between;align-items:center}
    .resumo-row-label{font-size:13px;color:#64748B}
    .resumo-row-valor{font-size:13px;font-weight:700}
    .resumo-divider{border:none;border-top:1px solid rgba(148,163,184,.07);margin:10px 0}
    .sucesso-wrap{min-height:100vh;background:radial-gradient(ellipse at top,rgba(124,58,237,.12),transparent 50%),linear-gradient(180deg,#060C18,#050B16);display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit}
    .sucesso-inner{max-width:460px;width:100%;text-align:center}
    .sucesso-icon{width:72px;height:72px;border-radius:50%;background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px}
    .sucesso-title{font-size:24px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:8px}
    .sucesso-sub{font-size:14px;color:#64748B;margin-bottom:28px;line-height:1.7}
    .sucesso-actions{display:flex;flex-direction:column;gap:10px}
    .btn-wpp{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;font-weight:700;padding:14px 28px;border-radius:14px;text-decoration:none;font-size:14px;transition:opacity .15s}
    .btn-ics{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:rgba(15,23,42,.88);color:#CBD5E1;font-weight:600;padding:14px 28px;border-radius:14px;font-size:14px;border:1px solid rgba(148,163,184,.15);cursor:pointer;font-family:inherit}
    .btn-pdf{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(59,130,246,.12));color:#818CF8;font-weight:700;padding:14px 28px;border-radius:14px;font-size:14px;border:1px solid rgba(99,102,241,.28);cursor:pointer;font-family:inherit;transition:all .18s}
    .btn-pdf:hover{background:linear-gradient(135deg,rgba(99,102,241,.28),rgba(59,130,246,.20));border-color:rgba(99,102,241,.45)}
    .btn-inicio{display:inline-flex;align-items:center;justify-content:center;background:${G};color:#fff;font-weight:700;padding:14px 28px;border-radius:14px;text-decoration:none;font-size:14px;box-shadow:0 8px 24px rgba(59,130,246,.25)}
    .erro-msg{font-size:13px;color:#EF4444;margin-top:10px}
    .horarios-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:140px;gap:8px}
    .horarios-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px;gap:10px}
  `

  const [copiado, setCopiado] = useState(false)

  function copiarConfirmacao() {
    const texto = [
      'Agendamento confirmado!',
      '',
      'Nome: ' + clienteNome,
      'Serviço: ' + (servicoSelecionado?.nome||''),
      'Profissional: ' + (profissionalSelecionado?.nome||''),
      'Data: ' + formatarData(dataSelecionada),
      'Horário: ' + horarioSelecionado,
      servicoSelecionado?.preco ? 'Valor: R$ ' + servicoSelecionado.preco : '',
      '',
      perfil?.nome_negocio || '',
      perfil?.endereco ? perfil.endereco : '',
      '',
      'Agendamento feito pelo ClienteMarcado.',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(texto)
      .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) })
      .catch(() => {
        try {
          const el = document.createElement('textarea')
          el.value = texto; el.style.position = 'fixed'; el.style.opacity = '0'
          document.body.appendChild(el); el.select()
          document.execCommand('copy'); document.body.removeChild(el)
          setCopiado(true); setTimeout(() => setCopiado(false), 2500)
        } catch(e) { console.error('Erro ao copiar:', e) }
      })
  }

  function getServicoIcone(s: {nome:string,categoria?:string,descricao?:string}) {
    const txt = [s.nome, s.categoria||'', s.descricao||''].join(' ').toLowerCase()
    const sz = 20
    if (/corte|barba|cabelo|barbearia|cabeleirei|platina|mecha|progressiva|alisam|relaxam/.test(txt)) return <Scissors size={sz}/>
    if (/colora|escova|hidrataç|hidratac|mechas|luzes|reflexo|tinta/.test(txt)) return <Sparkles size={sz}/>
    if (/retorno|reavalia|acompan|revisão|revisao|follow/.test(txt)) return <CalendarCheck size={sz}/>
    if (/avalia|consul|diagnos|triagem|primeira.*vez|anamese|anamnese/.test(txt)) return <ClipboardCheck size={sz}/>
    if (/orçamento|orcamento|proposta|plano.*trat|plano.*paga/.test(txt)) return <FileText size={sz}/>
    if (/limpeza|clarea|branquea|peeling|esfoliação|esfoliacao|profilax/.test(txt)) return <Sparkles size={sz}/>
    if (/restaur|obtura|canal|endodon|cirur|extração|extracao|implant|enxerto/.test(txt)) return <ShieldPlus size={sz}/>
    if (/prótese|protese|reabilit|coroa|faceta|lente|inlay|onlay/.test(txt)) return <Stethoscope size={sz}/>
    if (/estet|facial|botox|harmoniz|preench|massag|drenag|corporal|sobrancelha|depilaç|depilac/.test(txt)) return <HeartPulse size={sz}/>
    if (/odonto|dent|bucal|oral/.test(txt)) return <ClipboardList size={sz}/>
    return <CalendarCheck size={sz}/>
  }

  if (sucesso) return (
    <div className="sucesso-wrap">
      <style>{css}</style>
      <div className="sucesso-inner">
        <div className="sucesso-icon">à</div>
        <h1 className="sucesso-title">Agendamento confirmado!</h1>
        <p className="sucesso-sub">{clienteNome ? <>Obrigado, <strong style={{color:'#F8FAFC'}}>{clienteNome}</strong>! Seu horário foi registrado com sucesso.</> : <>Seu horário foi registrado com sucesso.</>}</p>
        <div className="resumo-card">
          <p className="resumo-card-title">Resumo do agendamento</p>
          {[
            {label:'Atendimento',valor:servicoSelecionado?.nome,cor:'#F8FAFC'},
            {label:'Profissional',valor:profissionalSelecionado?.nome,cor:'#F8FAFC'},
            {label:'Data',valor:formatarData(dataSelecionada),cor:'#F8FAFC'},
            {label:'Horário',valor:horarioSelecionado,cor:'#60A5FA'},
            {label:'Valor',valor:'R$ '+servicoSelecionado?.preco,cor:'#22C55E'},
          ].map((item,idx,arr)=>(
            <div key={item.label}>
              <div className="resumo-row">
                <span className="resumo-row-label">{item.label}</span>
                <span className="resumo-row-valor" style={{color:item.cor}}>{item.valor}</span>
              </div>
              {idx<arr.length-1&&<hr className="resumo-divider"/>}
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
          <button onClick={copiarConfirmacao} className="btn-ics" style={{background:copiado?'rgba(34,197,94,.12)':undefined,borderColor:copiado?'rgba(34,197,94,.30)':undefined,color:copiado?'#22C55E':undefined}}>
            {copiado ? 'ô Confirmação copiada!' : '­Copiar confirmação'}
          </button>
          <button onClick={baixarConfirmacaoPDF} className="btn-pdf">
            ­ä Baixar comprovante
          </button>
          <Link href={'/'+slug} className="btn-inicio">Voltar ao início</Link>
        </div>
      </div>
    </div>
  )

  const Steps = () => (
    <div className="steps-wrap">
      <div className="steps-track">
        {[1,2,3,4].map(n=>(
          <div key={n} style={{display:'flex',alignItems:'center',flex:n<4?1:'none'}}>
            <div className={`step-dot ${etapa>n?'done':etapa===n?'active':'idle'}`}>{etapa>n?'✓':n}</div>
            {n<4&&<div className="step-line" style={{background:etapa>n?'linear-gradient(90deg,#3B82F6,#7C3AED)':'rgba(148,163,184,.10)'}}/>}
          </div>
        ))}
      </div>
      <div className="step-labels">
        {nomeEtapas.map((nome,i)=>(
          <span key={nome} className="step-label" style={{fontWeight:etapa===i+1?700:500,color:etapa===i+1?'#60A5FA':'#334155',flex:i<3?1:'none',textAlign:i===0?'left':i===3?'right':'center'}}>
            {nome}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <main className="page">
      <style>{css}</style>
      <div className="header">
        <Link href={'/'+slug} className="header-back">Voltar</Link>
        <p className="header-title">{perfil?.nome_negocio}</p>
        <div className="header-spacer"/>
      </div>
      {etapa===1&&(
        <div className="container">
          <Steps/>
          <h2 className="section-title">Selecione o atendimento</h2>
          <p className="section-sub">Escolha um serviço, procedimento ou consulta para continuar.</p>
          <div className="servico-list">
            {servicos.map(s=>(
              <button key={s.id} onClick={()=>{setServicoId(s.id);setEtapa(2)}} className={'servico-card'+(servicoId===s.id?' sel':'')}>
                <div className="servico-accent"/>
                <div className="servico-icon" style={{color:'#60A5FA'}}>{getServicoIcone(s)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p className="servico-nome">{s.nome}</p>
                  <p className="servico-desc">{s.descricao||'Selecione para ver profissionais e horários disponíveis'}</p>
                  <div className="servico-meta">
                    {s.duracao_minutos&&(<span className="servico-dur"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{s.duracao_minutos} min</span>)}
                    {s.duracao_minutos&&s.preco&&<span className="servico-meta-sep"/>}
                    {s.preco&&<span className="servico-preco">R$ {s.preco}</span>}
                  </div>
                </div>
                <div className="servico-arrow">›</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {etapa===2&&(
        <div className="container">
          <Steps/>
          <h2 className="section-title">Escolha o profissional</h2>
          <p className="section-sub">Com quem deseja ser atendido?</p>
          <div className="prof-grid">
            {(servicos.find(s=>s.id===servicoId)?.profissionais_ids?.length>0?profissionais.filter(p=>(servicos.find(s=>s.id===servicoId)?.profissionais_ids||[]).includes(p.id)):profissionais).map(p=>(
              <button key={p.id} onClick={()=>{setProfissionalId(p.id);setEtapa(3)}} className={'prof-card'+(profissionalId===p.id?' sel':'')}>
                {p.foto_url
                  ?<img src={p.foto_url} alt={p.nome} className="prof-avatar-img" style={{border:profissionalId===p.id?'2px solid #3B82F6':'2px solid rgba(148,163,184,.12)'}}/>
                  :<div className="prof-avatar-letra" style={{border:profissionalId===p.id?'2px solid #3B82F6':'2px solid rgba(59,130,246,.15)'}}>{p.nome.charAt(0).toUpperCase()}</div>
                }
                <div><p className="prof-nome">{p.nome}</p><p className="prof-cargo">{p.cargo||'Profissional'}</p></div>
              </button>
            ))}
          </div>
          <button onClick={()=>setEtapa(1)} className="btn-link-voltar">Voltar</button>
        </div>
      )}
      {etapa===3&&(
        <div className="container-wide">
          <Steps/>
          <h2 className="section-title">Data e horário</h2>
          <p className="section-sub">Escolha o melhor horário disponível</p>
          <div className="resumo-strip">
            {[
              {label:'Atendimento',valor:servicoSelecionado?.nome,cor:'#F8FAFC'},
              {label:'Profissional',valor:profissionalSelecionado?.nome,cor:'#F8FAFC'},
              {label:'Duração',valor:(servicoSelecionado?.duracao_minutos||30)+' min',cor:'#F8FAFC'},
              {label:'Valor',valor:'R$ '+servicoSelecionado?.preco,cor:'#22C55E'},
            ].map(item=>(
              <div key={item.label}>
                <p className="resumo-label">{item.label}</p>
                <p className="resumo-valor" style={{color:item.cor}}>{item.valor}</p>
              </div>
            ))}
          </div>
          <div className="etapa3-cols">
            <div className="cal-wrap">
              <div className="cal-header">
                <button className="cal-nav" onClick={()=>setMesAtual(new Date(mesAtual.getFullYear(),mesAtual.getMonth()-1,1))}>‹</button>
                <p className="cal-mes">{mesAtual.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>
                <button className="cal-nav" onClick={()=>setMesAtual(new Date(mesAtual.getFullYear(),mesAtual.getMonth()+1,1))}>›</button>
              </div>
              <div className="cal-dow">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="cal-dow-label">{d}</div>)}</div>
              <div className="cal-days">
                {Array.from({length:primeiroDiaMes}).map((_,i)=><div key={'e'+i}/>)}
                {Array.from({length:diasNoMes}).map((_,i)=>{
                  const dia=i+1
                  const dataStr=mesAtual.getFullYear()+'-'+String(mesAtual.getMonth()+1).padStart(2,'0')+'-'+String(dia).padStart(2,'0')
                  const disponivel=isDiaDisponivel(dia)
                  const selecionado=dataSelecionada===dataStr
                  const ehHoje=dataStr===todayStr
                  let cls='dia'
                  if(selecionado)cls+=' sel'
                  else if(disponivel&&ehHoje)cls+=' disp hoje'
                  else if(disponivel)cls+=' disp'
                  return <button key={dia} disabled={!disponivel} onClick={()=>disponivel&&setDataSelecionada(dataStr)} className={cls}>{dia}</button>
                })}
              </div>
            </div>
            <div className="horarios-wrap">
              {!dataSelecionada&&<div className="horarios-placeholder"><p style={{fontSize:'13px',color:'#334155',textAlign:'center',lineHeight:1.6}}>Selecione uma data<br/>para ver os horários</p></div>}
              {dataSelecionada&&(
                <>
                  <p className="horarios-data-label">{formatarDataExtenso(dataSelecionada)}</p>
                  {carregandoHorarios&&<div className="horarios-empty"><p style={{fontSize:'13px',color:'#64748B'}}>Buscando horários...</p></div>}
                  {!carregandoHorarios&&horariosDisponiveis.length===0&&<div className="horarios-empty"><span style={{fontSize:'28px',opacity:.3}}>­ƒÿö</span><p style={{fontSize:'13px',color:'#64748B',textAlign:'center',lineHeight:1.6}}>Nenhum horário disponível<br/>nesta data.</p></div>}
                  {!carregandoHorarios&&horariosDisponiveis.length>0&&(
                    <div>
                      {[
                        {label:'Manhã',icon:<Sun size={11} color="#475569"/>,lista:horariosManha},
                        {label:'Tarde',icon:<Clock size={11} color="#475569"/>,lista:horariosTarde},
                        {label:'Noite',icon:<Moon size={11} color="#475569"/>,lista:horariosNoite},
                      ].filter(p=>p.lista.length>0).map(periodo=>(
                        <div key={periodo.label} style={{marginBottom:'16px'}}>
                          <div className="periodo-label-row">{periodo.icon}<span className="periodo-label">{periodo.label}</span></div>
                          <div className="horarios-grid">
                            {periodo.lista.map(h=><button key={h} onClick={()=>setHorarioSelecionado(h)} className={'h-btn'+(horarioSelecionado===h?' sel':'')}>{h}</button>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="nav-row">
            <button onClick={()=>setEtapa(2)} className="btn-voltar">Voltar</button>
            <button onClick={()=>{if(!dataSelecionada||!horarioSelecionado){setErro('Selecione data e horário.');return}setErro('');setEtapa(4)}} disabled={!dataSelecionada||!horarioSelecionado} className={'btn-continuar '+(dataSelecionada&&horarioSelecionado?'on':'off')}>Continuar</button>
          </div>
          {erro&&<p className="erro-msg">{erro}</p>}
        </div>
      )}
      {etapa===4&&(
        <div className="container">
          <Steps/>
          <h2 className="section-title">Seus dados</h2>
          <p className="section-sub">Finalize seu agendamento preenchendo seus dados</p>
          <div className="resumo-card">
            <p className="resumo-card-title">Resumo do agendamento</p>
            {[
              {label:'Atendimento',valor:servicoSelecionado?.nome,cor:'#F8FAFC'},
              {label:'Profissional',valor:profissionalSelecionado?.nome,cor:'#F8FAFC'},
              {label:'Data',valor:formatarData(dataSelecionada),cor:'#F8FAFC'},
              {label:'Horário',valor:horarioSelecionado,cor:'#60A5FA'},
              {label:'Valor',valor:'R$ '+servicoSelecionado?.preco,cor:'#22C55E'},
            ].map((item,idx,arr)=>(
              <div key={item.label}>
                <div className="resumo-row"><span className="resumo-row-label">{item.label}</span><span className="resumo-row-valor" style={{color:item.cor}}>{item.valor}</span></div>
                {idx<arr.length-1&&<hr className="resumo-divider"/>}
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'18px',marginBottom:'24px'}}>
            <div>
              <label className="input-label">Seu nome *</label>
              <input type="text" placeholder="Ex: Maria Silva" value={clienteNome} onChange={e=>setClienteNome(e.target.value)} className="input-field"/>
            </div>
            <div>
              <label className="input-label">WhatsApp *</label>
              <input type="tel" placeholder="(11) 99999-9999" value={clienteTelefone} onChange={e=>setClienteTelefone(aplicarMascaraTelefone(e.target.value))} className="input-field"/>
              <p style={{fontSize:'12px',color:'#475569',marginTop:'6px'}}>Usado apenas para contato sobre seu agendamento.</p>
              <p style={{fontSize:'12px',color:'#334155',marginTop:'12px',textAlign:'center',lineHeight:1.6}}>­Seus dados serão usados apenas para confirmar este agendamento.</p>
            </div>
          </div>
          {erro&&<p className="erro-msg" style={{marginBottom:'12px'}}>{erro}</p>}
          <div className="nav-row">
            <button onClick={()=>setEtapa(3)} className="btn-voltar">Voltar</button>
            <button onClick={handleAgendar} disabled={loading} className="btn-confirmar" style={{opacity:loading ? 0.7 : 1}}>{loading?'Confirmando...':'Confirmar agendamento'}</button>
          </div>
        </div>
      )}
    </main>
  )
}
