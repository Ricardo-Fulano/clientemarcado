'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Sun, Clock, Moon } from 'lucide-react'

export default function Agendar() {
  const params = useParams()
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

    const { data: ags } = await supabase
      .from('agendamentos')
      .select('data_hora, servico_id')
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
      return diffMinutos >= antecedencia
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
      setErro('Informe seu WhatsApp com DDD.')
      return
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
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'BEGIN:VEVENT',
      'DTSTART:' + fmt(inicio),
      'DTEND:' + fmt(fim),
      'SUMMARY:' + (servicoSelecionado?.nome || '') + ' - ' + (perfil?.nome_negocio || ''),
      'DESCRIPTION:Profissional: ' + (profissionalSelecionado?.nome || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agendamento.ics'
    a.click()
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

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '13px 16px', color: 'var(--text-primary)',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    display: 'block', marginBottom: '8px',
  }

  if (sucesso) return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-soft)', border: '2px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✅</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Agendamento confirmado!</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          Obrigado, <strong>{clienteNome}</strong>! Seu agendamento foi recebido com sucesso.
        </p>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '14px' }}>Resumo do agendamento</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Serviço', valor: servicoSelecionado?.nome, cor: 'var(--text-primary)' },
              { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: 'var(--text-primary)' },
              { label: 'Data', valor: formatarData(dataSelecionada), cor: 'var(--text-primary)' },
              { label: 'Horário', valor: horarioSelecionado, cor: 'var(--accent)' },
              { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: 'var(--success)' },
            ].map((item, idx, arr) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: idx < arr.length - 1 ? '8px' : '0', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: item.cor }}>{item.valor}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {linkWppEstabelecimento && (
            <a href={linkWppEstabelecimento} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: '#fff', fontWeight: '700', padding: '13px 28px', borderRadius: '999px', textDecoration: 'none', fontSize: '14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar com o estabelecimento
            </a>
          )}
          <button onClick={baixarAgendaICS}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--card)', color: 'var(--text-primary)', fontWeight: '700', padding: '13px 28px', borderRadius: '999px', fontSize: '14px', border: '1px solid var(--border)', cursor: 'pointer' }}>
            📅 Adicionar à agenda do celular
          </button>
          <Link href={'/' + slug} style={{ display: 'inline-block', textAlign: 'center', background: 'var(--accent)', color: '#fff', fontWeight: '700', padding: '13px 28px', borderRadius: '999px', textDecoration: 'none', fontSize: '14px' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      <div style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', background: 'var(--surface)' }}>
        <Link href={'/' + slug} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>← Voltar</Link>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: '700' }}>{perfil?.nome_negocio}</p>
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{ padding: '18px 20px 0', maxWidth: '520px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '22px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0, background: etapa >= n ? 'var(--accent)' : 'var(--surface)', color: etapa >= n ? '#fff' : 'var(--text-muted)', border: etapa >= n ? 'none' : '1px solid var(--border)' }}>
                {etapa > n ? '✓' : n}
              </div>
              {n < 4 && <div style={{ flex: 1, height: '2px', background: etapa > n ? 'var(--accent)' : 'var(--border)', marginLeft: '6px' }} />}
            </div>
          ))}
        </div>

        {etapa === 1 && (
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Escolha o serviço</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Selecione o serviço desejado</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {servicos.map((s) => (
                <button key={s.id} onClick={() => { setServicoId(s.id); setEtapa(2) }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: servicoId === s.id ? 'var(--accent-soft)' : 'var(--card)', border: '1px solid ' + (servicoId === s.id ? 'var(--accent)' : 'var(--border)'), borderRadius: '12px', padding: '14px 18px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{s.nome}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.duracao_minutos || 30} min</p>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--success)', whiteSpace: 'nowrap' }}>R$ {s.preco}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Escolha o profissional</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Com quem deseja ser atendido?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              {profissionais.map((p) => (
                <button key={p.id} onClick={() => { setProfissionalId(p.id); setEtapa(3) }}
                  style={{ background: profissionalId === p.id ? 'var(--accent-soft)' : 'var(--card)', border: '1px solid ' + (profissionalId === p.id ? 'var(--accent)' : 'var(--border)'), borderRadius: '12px', padding: '16px 10px', cursor: 'pointer', textAlign: 'center' }}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-border)', margin: '0 auto 8px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent-soft)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.nome}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setEtapa(1)} style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Voltar</button>
          </div>
        )}

        {etapa === 3 && (
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Data e horário</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Escolha quando quer ser atendido</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Serviço</p><p style={{ fontSize: '13px', fontWeight: '600' }}>{servicoSelecionado?.nome}</p></div>
              <div><p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profissional</p><p style={{ fontSize: '13px', fontWeight: '600' }}>{profissionalSelecionado?.nome}</p></div>
              <div><p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Duração</p><p style={{ fontSize: '13px', fontWeight: '600' }}>{servicoSelecionado?.duracao_minutos || 30} min</p></div>
              <div><p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor</p><p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>R$ {servicoSelecionado?.preco}</p></div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', padding: '5px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>‹</button>
                <p style={{ fontWeight: '700', fontSize: '13px', textTransform: 'capitalize' }}>{mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', padding: '5px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', padding: '3px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {Array.from({ length: primeiroDiaMes }).map((_, i) => <div key={'e' + i} />)}
                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1
                  const dataStr = mesAtual.getFullYear() + '-' + String(mesAtual.getMonth() + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
                  const disponivel = isDiaDisponivel(dia)
                  const selecionado = dataSelecionada === dataStr
                  const ehHoje = dataStr === todayStr
                  return (
                    <button key={dia} onClick={() => disponivel && setDataSelecionada(dataStr)} disabled={!disponivel}
                      style={{ padding: '7px 2px', borderRadius: '7px', fontSize: '12px', fontWeight: selecionado ? '700' : '400', cursor: disponivel ? 'pointer' : 'default', border: ehHoje && !selecionado ? '1px solid var(--accent-border)' : '1px solid transparent', textAlign: 'center', background: selecionado ? 'var(--accent)' : disponivel ? 'var(--surface)' : 'transparent', color: selecionado ? '#fff' : disponivel ? 'var(--text-primary)' : '#2a2a2a' }}>
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>

            {dataSelecionada && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'capitalize' }}>{formatarDataExtenso(dataSelecionada)}</p>
                {carregandoHorarios && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Buscando horários...</p>}
                {!carregandoHorarios && horariosDisponiveis.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Não há horários disponíveis nesta data.</p>}
                {!carregandoHorarios && horariosDisponiveis.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { label: 'Manhã', icon: <Sun size={12} color="var(--accent)" />, horarios: horariosManha },
                      { label: 'Tarde', icon: <Clock size={12} color="var(--accent)" />, horarios: horariosTarde },
                      { label: 'Noite', icon: <Moon size={12} color="var(--accent)" />, horarios: horariosNoite },
                    ].filter(p => p.horarios.length > 0).map((periodo) => (
                      <div key={periodo.label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                          {periodo.icon}
                          <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{periodo.label}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '6px' }}>
                          {periodo.horarios.map(h => (
                            <button key={h} onClick={() => setHorarioSelecionado(h)}
                              style={{ padding: '9px 6px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid', textAlign: 'center', background: horarioSelecionado === h ? 'var(--accent)' : 'var(--surface)', color: horarioSelecionado === h ? '#fff' : 'var(--text-primary)', borderColor: horarioSelecionado === h ? 'var(--accent)' : 'var(--border)' }}>
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEtapa(2)} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>← Voltar</button>
              <button onClick={() => { if (!dataSelecionada || !horarioSelecionado) { setErro('Selecione data e horário.'); return }; setErro(''); setEtapa(4) }}
                disabled={!dataSelecionada || !horarioSelecionado}
                style={{ flex: 2, background: 'var(--accent)', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: dataSelecionada && horarioSelecionado ? 'pointer' : 'not-allowed', opacity: dataSelecionada && horarioSelecionado ? 1 : 0.5 }}>
                Continuar →
              </button>
            </div>
            {erro && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '8px' }}>{erro}</p>}
          </div>
        )}

        {etapa === 4 && (
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Seus dados</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Para finalizar o agendamento</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>Resumo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {[
                  { label: 'Serviço', valor: servicoSelecionado?.nome, cor: 'var(--text-primary)' },
                  { label: 'Profissional', valor: profissionalSelecionado?.nome, cor: 'var(--text-primary)' },
                  { label: 'Data', valor: formatarData(dataSelecionada), cor: 'var(--text-primary)' },
                  { label: 'Horário', valor: horarioSelecionado, cor: 'var(--accent)' },
                  { label: 'Valor', valor: 'R$ ' + servicoSelecionado?.preco, cor: 'var(--success)' },
                ].map((item, idx, arr) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: idx < arr.length - 1 ? '9px' : '0', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: item.cor }}>{item.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Seu nome *</label>
                <input type="text" placeholder="Ex: Maria Silva" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp *</label>
                <input type="text" placeholder="(11) 99999-9999" value={clienteTelefone} onChange={(e) => setClienteTelefone(aplicarMascaraTelefone(e.target.value))} style={inputStyle} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Usado apenas para contato sobre seu agendamento.</p>
              </div>
            </div>

            {erro && <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '10px' }}>{erro}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEtapa(3)} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>← Voltar</button>
              <button onClick={handleAgendar} disabled={loading}
                style={{ flex: 2, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
                {loading ? 'Confirmando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}

        <div style={{ height: '40px' }} />
      </div>
    </main>
  )
}