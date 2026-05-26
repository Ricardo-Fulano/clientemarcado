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

    const bloqueiosAtivos = (bloqueios || []).filter(b =>
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

    const ocupados: { inicio: number, fim: number }[] = []
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
      const conflitoBloqueio = bloqueiosAtivos.some(b => {
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
    if (nums.length > 10) return '(' + nums.slice(0,2) + ') ' + nums.slice(2,7) + '-' + nums.slice(7)
    if (nums.length > 6) return '(' + nums.slice(0,2) + ') ' + nums.slice(2,6) + '-' + nums.slice(6)
    if (nums.length > 2) return '(' + nums.slice(0,2) + ') ' + nums.slice(2)
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

  const nomeEtapas = ['Serviço', 'Profissional', 'Data e horário', 'Seus dados']

  if (sucesso) return (
    <main style={{ minHeight: '100vh', background: '#08080A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>✅</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#F1F5F9', letterSpacing: '-0.02em' }}>Agendamento confirmado!</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px', lineHeight: 1.6 }}>
          Obrigado, <strong style={{ color: '#F1F5F9' }}>{clienteNome}</strong>! Seu agendamento foi recebido.
        </p>

        <div style={{ background: 'linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'left' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4B5563', marginBottom: '16px' }}>Resumo</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Serviço', valor: servicoSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Data', valor: formatarData(dataSelecionada), cor: '#F1F5F9' },
              { label: 'Horário', valor: horarioSelecionado, cor: '#3B82F6' },
              { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: '#22C55E' },
            ].map((item, idx, arr) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: idx < arr.length - 1 ? '12px' : '0', borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: item.cor }}>{item.valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {linkWppEstabelecimento && (
            <a href={linkWppEstabelecimento} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: '#fff', fontWeight: '700', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar com o estabelecimento
            </a>
          )}
          <button onClick={baixarAgendaICS} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: '#F1F5F9', fontWeight: '600', padding: '14px 28px', borderRadius: '10px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            📅 Adicionar à agenda do celular
          </button>
          <Link href={'/' + slug} style={{ display: 'inline-block', textAlign: 'center', background: '#3B82F6', color: '#fff', fontWeight: '700', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#08080A', color: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      <style>{`
        /* ── Horário buttons ── */
        .horario-btn {
          padding: 10px 6px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          background: linear-gradient(180deg, rgba(22,28,40,0.98) 0%, rgba(12,15,22,0.98) 100%);
          color: #D1D5DB;
          transition: all 0.15s ease;
          width: 100%;
        }
        .horario-btn:hover {
          border-color: rgba(59,130,246,0.5);
          color: #F1F5F9;
          background: rgba(59,130,246,0.06);
        }
        .horario-btn.selecionado {
          background: #3B82F6;
          border-color: #3B82F6;
          color: #fff;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.25);
        }

        /* ── Serviço cards ── */
        .servico-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 18px 20px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .servico-card:hover {
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        }
        .servico-card.selecionado {
          border-color: #3B82F6;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 6px 24px rgba(59,130,246,0.15);
          background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(10,12,16,0.95) 100%);
        }

        /* ── Profissional cards ── */
        .prof-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px 16px;
          cursor: pointer;
          text-align: center;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .prof-card:hover {
          border-color: rgba(59,130,246,0.45);
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
        }
        .prof-card.selecionado {
          border-color: #3B82F6;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 6px 24px rgba(59,130,246,0.15);
          background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(10,12,16,0.95) 100%);
        }

        /* ── Inputs ── */
        .input-field {
          width: 100%;
          background: rgba(18,22,30,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 16px;
          color: #F1F5F9;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .input-field:focus {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .input-field::placeholder { color: #4B5563; }

        /* ── Dias do calendário ── */
        .dia-btn {
          padding: 8px 2px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: default;
          border: 1px solid transparent;
          text-align: center;
          background: transparent;
          color: #2D3748;
          transition: all 0.15s ease;
        }
        .dia-btn.disponivel {
          color: #CBD5E0;
          background: rgba(255,255,255,0.04);
          cursor: pointer;
          font-weight: 600;
        }
        .dia-btn.disponivel:hover {
          background: rgba(59,130,246,0.14);
          color: #F1F5F9;
          border-color: rgba(59,130,246,0.25);
        }
        .dia-btn.hoje {
          border-color: rgba(59,130,246,0.5);
          color: #3B82F6;
          font-weight: 700;
        }
        .dia-btn.selecionado {
          background: #3B82F6 !important;
          color: #fff !important;
          border-color: #3B82F6 !important;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(59,130,246,0.35);
        }

        /* ── Layout duas colunas etapa 3 ── */
        .etapa3-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .etapa3-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            align-items: start;
          }
        }

        /* ── Container largura ── */
        .container-etapa {
          max-width: 800px;
          margin: 0 auto;
          padding: 28px 24px 56px;
        }
        .container-etapa3 {
          max-width: 960px;
          margin: 0 auto;
          padding: 28px 24px 56px;
        }

        /* ── Botões nav ── */
        .btn-voltar {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          color: #9CA3AF;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .btn-voltar:hover { background: rgba(255,255,255,0.08); color: #D1D5DB; }

        .btn-continuar {
          flex: 2;
          border: none;
          border-radius: 10px;
          padding: 13px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .btn-continuar.ativo {
          background: #3B82F6;
          color: #fff;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
        }
        .btn-continuar.inativo {
          background: rgba(59,130,246,0.15);
          color: #374151;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', background: 'rgba(9,9,11,0.96)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href={'/' + slug} style={{ color: '#6B7280', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}>← Voltar</Link>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#F1F5F9', margin: 0 }}>{perfil?.nome_negocio}</p>
        </div>
        <div style={{ width: '48px' }} />
      </div>

      {/* ── ETAPAS 1, 2, 4 ── */}
      {etapa !== 3 && (
        <div className="container-etapa">

          {/* STEPS */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0, background: etapa > n ? '#3B82F6' : etapa === n ? '#3B82F6' : 'rgba(255,255,255,0.05)', color: etapa >= n ? '#fff' : '#4B5563', border: etapa >= n ? 'none' : '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
                    {etapa > n ? '✓' : n}
                  </div>
                  {n < 4 && <div style={{ flex: 1, height: '1px', background: etapa > n ? '#3B82F6' : 'rgba(255,255,255,0.07)', margin: '0 6px', transition: 'background 0.2s ease' }} />}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {nomeEtapas.map((nome, i) => (
                <span key={nome} style={{ fontSize: '10px', fontWeight: etapa === i + 1 ? '700' : '500', color: etapa === i + 1 ? '#3B82F6' : '#4B5563', letterSpacing: '0.02em', flex: i < 3 ? 1 : 'none', textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center' }}>
                  {nome}
                </span>
              ))}
            </div>
          </div>

          {/* ETAPA 1 — SERVIÇO */}
          {etapa === 1 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: '#F1F5F9', letterSpacing: '-0.02em' }}>Escolha o serviço</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '22px' }}>Selecione o serviço desejado</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {servicos.map((s) => (
                  <button key={s.id} onClick={() => { setServicoId(s.id); setEtapa(2) }}
                    className={'servico-card' + (servicoId === s.id ? ' selecionado' : '')}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, rgba(59,130,246,0.8), transparent)' }} />
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                      ✂️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: '#F1F5F9', marginBottom: '4px' }}>{s.nome}</p>
                      {s.descricao
                        ? <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '5px', lineHeight: 1.45 }}>{s.descricao}</p>
                        : <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '5px' }}>Atendimento com horário marcado</p>
                      }
                      <p style={{ fontSize: '13px', color: '#6B7280' }}>
                        {s.duracao_minutos ? s.duracao_minutos + ' min' : ''}
                        {s.duracao_minutos && s.preco ? ' · ' : ''}
                        {s.preco ? <span style={{ color: '#22C55E', fontWeight: '700' }}>R$ {s.preco}</span> : null}
                      </p>
                    </div>
                    <span style={{ fontSize: '20px', color: '#3B82F6', flexShrink: 0 }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ETAPA 2 — PROFISSIONAL */}
          {etapa === 2 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: '#F1F5F9', letterSpacing: '-0.02em' }}>Escolha o profissional</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '22px' }}>Com quem deseja ser atendido?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {profissionais.map((p) => (
                  <button key={p.id} onClick={() => { setProfissionalId(p.id); setEtapa(3) }}
                    className={'prof-card' + (profissionalId === p.id ? ' selecionado' : '')}>
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} style={{ width: '68px', height: '68px', borderRadius: '999px', objectFit: 'cover', border: profissionalId === p.id ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                      <div style={{ width: '68px', height: '68px', borderRadius: '999px', background: 'rgba(59,130,246,0.1)', border: profissionalId === p.id ? '2px solid #3B82F6' : '2px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: '#3B82F6' }}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9', marginBottom: '3px' }}>{p.nome}</p>
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>{p.cargo || 'Profissional'}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setEtapa(1)} style={{ fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Voltar</button>
            </div>
          )}

          {/* ETAPA 4 — DADOS */}
          {etapa === 4 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: '#F1F5F9', letterSpacing: '-0.02em' }}>Seus dados</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Para finalizar o agendamento</p>

              {/* Resumo */}
              <div style={{ background: 'linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px 22px', marginBottom: '24px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4B5563', marginBottom: '16px' }}>Resumo</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Serviço', valor: servicoSelecionado?.nome, cor: '#F1F5F9' },
                    { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: '#F1F5F9' },
                    { label: 'Data', valor: formatarData(dataSelecionada), cor: '#F1F5F9' },
                    { label: 'Horário', valor: horarioSelecionado, cor: '#3B82F6' },
                    { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: '#22C55E' },
                  ].map((item, idx, arr) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: idx < arr.length - 1 ? '12px' : '0', borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{item.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: item.cor }}>{item.valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Seu nome *</label>
                  <input type="text" placeholder="Ex: Maria Silva" value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>WhatsApp *</label>
                  <input type="text" placeholder="(11) 99999-9999" value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(aplicarMascaraTelefone(e.target.value))} className="input-field" />
                  <p style={{ fontSize: '12px', color: '#374151', marginTop: '6px' }}>Usado apenas para contato sobre seu agendamento.</p>
                </div>
              </div>

              {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{erro}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEtapa(3)} className="btn-voltar">← Voltar</button>
                <button onClick={handleAgendar} disabled={loading}
                  style={{ flex: 2, background: '#3B82F6', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(59,130,246,0.3)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'opacity 0.15s' }}>
                  {loading ? 'Confirmando...' : 'Confirmar agendamento'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ETAPA 3 — container mais largo ── */}
      {etapa === 3 && (
        <div className="container-etapa3">

          {/* STEPS */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0, background: etapa > n ? '#3B82F6' : etapa === n ? '#3B82F6' : 'rgba(255,255,255,0.05)', color: etapa >= n ? '#fff' : '#4B5563', border: etapa >= n ? 'none' : '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
                    {etapa > n ? '✓' : n}
                  </div>
                  {n < 4 && <div style={{ flex: 1, height: '1px', background: etapa > n ? '#3B82F6' : 'rgba(255,255,255,0.07)', margin: '0 6px', transition: 'background 0.2s ease' }} />}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {nomeEtapas.map((nome, i) => (
                <span key={nome} style={{ fontSize: '10px', fontWeight: etapa === i + 1 ? '700' : '500', color: etapa === i + 1 ? '#3B82F6' : '#4B5563', letterSpacing: '0.02em', flex: i < 3 ? 1 : 'none', textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center' }}>
                  {nome}
                </span>
              ))}
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: '#F1F5F9', letterSpacing: '-0.02em' }}>Data e horário</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '18px' }}>Escolha quando quer ser atendido</p>

          {/* Resumo — largura total */}
          <div style={{ background: 'linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px', marginBottom: '18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Serviço', valor: servicoSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: '#F1F5F9' },
              { label: 'Duração', valor: (servicoSelecionado?.duracao_minutos || 30) + ' min', cor: '#F1F5F9' },
              { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: '#22C55E' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingRight: i < arr.length - 1 ? '12px' : 0 }}>
                <p style={{ fontSize: '9px', color: '#4B5563', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '600' }}>{item.label}</p>
                <p style={{ fontSize: '13px', fontWeight: '700', color: item.cor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.valor}</p>
              </div>
            ))}
          </div>

          {/* Duas colunas: calendário | horários */}
          <div className="etapa3-grid" style={{ marginBottom: '16px' }}>

            {/* Calendário */}
            <div style={{ background: 'linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px', color: '#9CA3AF', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>‹</button>
                <p style={{ fontWeight: '700', fontSize: '13px', textTransform: 'capitalize', color: '#F1F5F9', margin: 0 }}>{mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px', color: '#9CA3AF', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '8px' }}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#374151', padding: '4px 0', letterSpacing: '0.05em' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                {Array.from({ length: primeiroDiaMes }).map((_, i) => <div key={'e' + i} />)}
                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1
                  const dataStr = mesAtual.getFullYear() + '-' + String(mesAtual.getMonth() + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
                  const disponivel = isDiaDisponivel(dia)
                  const selecionado = dataSelecionada === dataStr
                  const ehHoje = dataStr === todayStr
                  let className = 'dia-btn'
                  if (selecionado) className += ' selecionado'
                  else if (disponivel && ehHoje) className += ' disponivel hoje'
                  else if (disponivel) className += ' disponivel'
                  return (
                    <button key={dia} onClick={() => disponivel && setDataSelecionada(dataStr)}
                      disabled={!disponivel} className={className}>
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Horários */}
            <div style={{ background: 'linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', minHeight: '260px' }}>
              {!dataSelecionada && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', gap: '10px' }}>
                  <div style={{ fontSize: '32px', opacity: 0.3 }}>📅</div>
                  <p style={{ fontSize: '13px', color: '#4B5563', textAlign: 'center', lineHeight: 1.5 }}>Selecione uma data<br />para ver os horários disponíveis</p>
                </div>
              )}
              {dataSelecionada && (
                <>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', marginBottom: '14px', textTransform: 'capitalize', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>{formatarDataExtenso(dataSelecionada)}</p>
                  {carregandoHorarios && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
                      <p style={{ fontSize: '13px', color: '#6B7280' }}>Buscando horários...</p>
                    </div>
                  )}
                  {!carregandoHorarios && horariosDisponiveis.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', gap: '8px' }}>
                      <div style={{ fontSize: '28px', opacity: 0.3 }}>😔</div>
                      <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>Nenhum horário disponível<br />nesta data.</p>
                    </div>
                  )}
                  {!carregandoHorarios && horariosDisponiveis.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { label: 'Manhã', icon: <Sun size={11} color="#9CA3AF" />, horarios: horariosManha },
                        { label: 'Tarde', icon: <Clock size={11} color="#9CA3AF" />, horarios: horariosTarde },
                        { label: 'Noite', icon: <Moon size={11} color="#9CA3AF" />, horarios: horariosNoite },
                      ].filter(p => p.horarios.length > 0).map((periodo) => (
                        <div key={periodo.label}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '9px' }}>
                            {periodo.icon}
                            <p style={{ fontSize: '10px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0 }}>{periodo.label}</p>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '7px' }}>
                            {periodo.horarios.map(h => (
                              <button key={h} onClick={() => setHorarioSelecionado(h)}
                                className={'horario-btn' + (horarioSelecionado === h ? ' selecionado' : '')}>
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setEtapa(2)} className="btn-voltar">← Voltar</button>
            <button
              onClick={() => { if (!dataSelecionada || !horarioSelecionado) { setErro('Selecione data e horário.'); return }; setErro(''); setEtapa(4) }}
              disabled={!dataSelecionada || !horarioSelecionado}
              className={'btn-continuar ' + (dataSelecionada && horarioSelecionado ? 'ativo' : 'inativo')}>
              Continuar →
            </button>
          </div>
          {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginTop: '10px' }}>{erro}</p>}
        </div>
      )}

      <div style={{ height: '32px' }} />
    </main>
  )
}
