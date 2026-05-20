'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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
    if (dataSelecionada && profissionalId && servicoId) {
      carregarHorarios()
    }
  }, [dataSelecionada, profissionalId, servicoId])

  async function carregarHorarios() {
    setCarregandoHorarios(true)
    setHorarioSelecionado('')

    const servico = servicos.find(s => s.id === servicoId)
    const duracaoServico = servico?.duracao_minutos || 30
    const intervalo = perfil?.intervalo_agenda || 30
    const horaAbertura = perfil?.hora_abertura || '08:00'
    const horaFechamento = perfil?.hora_fechamento || '18:00'

    const dataInicio = dataSelecionada + 'T00:00:00'
    const dataFim = dataSelecionada + 'T23:59:59'
    const { data: agendamentosExistentes } = await supabase
      .from('agendamentos')
      .select('data_hora, servico_id')
      .eq('profissional_id', profissionalId)
      .gte('data_hora', dataInicio)
      .lte('data_hora', dataFim)
      .neq('status', 'cancelado')

    const [hAb, mAb] = horaAbertura.split(':').map(Number)
    const [hFech, mFech] = horaFechamento.split(':').map(Number)
    const inicioMinutos = hAb * 60 + mAb
    const fimMinutos = hFech * 60 + mFech

    const horariosOcupados: { inicio: number, fim: number }[] = []
    for (const ag of agendamentosExistentes || []) {
      const dataAg = new Date(ag.data_hora)
      const minutos = dataAg.getHours() * 60 + dataAg.getMinutes()
      const duracaoAg = servicos.find(s => s.id === ag.servico_id)?.duracao_minutos || 30
      horariosOcupados.push({ inicio: minutos, fim: minutos + duracaoAg })
    }

    const horarios: string[] = []
    for (let min = inicioMinutos; min + duracaoServico <= fimMinutos; min += intervalo) {
      const conflito = horariosOcupados.some(oc => min < oc.fim && min + duracaoServico > oc.inicio)
      if (!conflito) {
        const h = Math.floor(min / 60).toString().padStart(2, '0')
        const m = (min % 60).toString().padStart(2, '0')
        horarios.push(`${h}:${m}`)
      }
    }

    const hoje = new Date().toISOString().split('T')[0]
    const agora = new Date()
    const horariosFinais = dataSelecionada === hoje
      ? horarios.filter(h => {
          const [hh, mm] = h.split(':').map(Number)
          return hh * 60 + mm > agora.getHours() * 60 + agora.getMinutes()
        })
      : horarios

    setHorariosDisponiveis(horariosFinais)
    setCarregandoHorarios(false)
  }

  async function handleAgendar() {
    setErro('')
    if (!clienteNome) { setErro('Informe seu nome.'); return }
    setLoading(true)
    const dataHora = `${dataSelecionada}T${horarioSelecionado}:00`
    const { error } = await supabase.from('agendamentos').insert({
      user_id: perfil.user_id,
      servico_id: servicoId,
      profissional_id: profissionalId,
      data_hora: dataHora,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
    })
    setLoading(false)
    if (error) { setErro('Erro ao agendar. Tente novamente.') }
    else { setSucesso(true) }
  }

  const servicoSelecionado = servicos.find(s => s.id === servicoId)
  const profissionalSelecionado = profissionais.find(p => p.id === profissionalId)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate()
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay()
  const diasFuncionamento: number[] = perfil?.dias_funcionamento || [1, 2, 3, 4, 5, 6]

  function isDiaDisponivel(dia: number) {
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia)
    const diaSemana = data.getDay()
    return data >= hoje && diasFuncionamento.includes(diaSemana)
  }

  function formatarDataExibicao(dataStr: string) {
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function periodoHorario(horario: string) {
    const h = parseInt(horario.split(':')[0])
    if (h < 12) return 'manha'
    if (h < 18) return 'tarde'
    return 'noite'
  }

  const horariosManha = horariosDisponiveis.filter(h => periodoHorario(h) === 'manha')
  const horariosTarde = horariosDisponiveis.filter(h => periodoHorario(h) === 'tarde')
  const horariosNoite = horariosDisponiveis.filter(h => periodoHorario(h) === 'noite')

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '13px 16px', color: 'var(--text-primary)',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    display: 'block', marginBottom: '10px',
  }

  if (sucesso) return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>✅</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px' }}>Agendamento confirmado!</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
          Obrigado, <strong>{clienteNome}</strong>! Seu agendamento foi recebido. Em breve entraremos em contato.
        </p>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '28px', textAlign: 'left' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '14px' }}>Resumo</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Serviço', valor: servicoSelecionado?.nome },
              { label: 'Profissional', valor: profissionalSelecionado?.nome },
              { label: 'Data', valor: formatarDataExibicao(dataSelecionada) },
              { label: 'Horário', valor: horarioSelecionado },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.valor}</span>
              </div>
            ))}
          </div>
        </div>
        <Link href={`/${slug}`} style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', fontWeight: '700', padding: '14px 32px', borderRadius: '999px', textDecoration: 'none', fontSize: '15px' }}>
          Voltar ao início
        </Link>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)' }}>
        <Link href={`/${slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>← Voltar</Link>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{perfil?.nome_negocio}</p>
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{ padding: '20px 24px 0', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0, background: etapa >= n ? 'var(--accent)' : 'var(--surface)', color: etapa >= n ? '#fff' : 'var(--text-muted)', border: etapa >= n ? 'none' : '1px solid var(--border)' }}>
                {etapa > n ? '✓' : n}
              </div>
              {n < 4 && <div style={{ flex: 1, height: '2px', background: etapa > n ? 'var(--accent)' : 'var(--border)', marginLeft: '8px' }} />}
            </div>
          ))}
        </div>

        {/* ETAPA 1 */}
        {etapa === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Escolha o serviço</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Selecione o serviço que deseja agendar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {servicos.map((s) => (
                <button key={s.id} onClick={() => { setServicoId(s.id); setEtapa(2) }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: servicoId === s.id ? 'var(--accent-soft)' : 'var(--card)', border: `1px solid ${servicoId === s.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '14px', padding: '16px 20px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>{s.nome}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.duracao_minutos || 30} min</p>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--accent)' }}>R$ {s.preco}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Escolha o profissional</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Com quem deseja ser atendido?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {profissionais.map((p) => (
                <button key={p.id} onClick={() => { setProfissionalId(p.id); setEtapa(3) }}
                  style={{ background: profissionalId === p.id ? 'var(--accent-soft)' : 'var(--card)', border: `1px solid ${profissionalId === p.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '14px', padding: '20px 12px', cursor: 'pointer', textAlign: 'center' }}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-border)', margin: '0 auto 10px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-soft)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>
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

        {/* ETAPA 3 */}
        {etapa === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Data e horário</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Escolha quando quer ser atendido</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Serviço</p><p style={{ fontSize: '13px', fontWeight: '600' }}>{servicoSelecionado?.nome}</p></div>
              <div><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profissional</p><p style={{ fontSize: '13px', fontWeight: '600' }}>{profissionalSelecionado?.nome}</p></div>
              <div><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Duração</p><p style={{ fontSize: '13px', fontWeight: '600' }}>{servicoSelecionado?.duracao_minutos || 30} min</p></div>
              <div><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Valor</p><p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>R$ {servicoSelecionado?.preco}</p></div>
            </div>

            {/* Calendário */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>‹</button>
                <p style={{ fontWeight: '700', fontSize: '14px' }}>
                  {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {Array.from({ length: primeiroDiaMes }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1
                  const dataStr = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                  const disponivel = isDiaDisponivel(dia)
                  const selecionado = dataSelecionada === dataStr
                  const ehHoje = dataStr === new Date().toISOString().split('T')[0]
                  return (
                    <button key={dia} onClick={() => disponivel && setDataSelecionada(dataStr)} disabled={!disponivel}
                      style={{ padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: selecionado || ehHoje ? '700' : '400', cursor: disponivel ? 'pointer' : 'default', border: 'none', textAlign: 'center', background: selecionado ? 'var(--accent)' : 'transparent', color: selecionado ? '#fff' : disponivel ? 'var(--text-primary)' : 'var(--text-muted)', opacity: disponivel ? 1 : 0.35, outline: ehHoje && !selecionado ? '1px solid var(--accent-border)' : 'none' }}>
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Horários */}
            {dataSelecionada && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px' }}>
                  Horários — {formatarDataExibicao(dataSelecionada)}
                </p>

                {carregandoHorarios && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Buscando horários disponíveis...</p>
                )}

                {!carregandoHorarios && horariosDisponiveis.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Não há horários disponíveis nesta data.</p>
                )}

                {!carregandoHorarios && horariosDisponiveis.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: '🌅 Manhã', horarios: horariosManha },
                      { label: '☀️ Tarde', horarios: horariosTarde },
                      { label: '🌙 Noite', horarios: horariosNoite },
                    ].filter(p => p.horarios.length > 0).map((periodo) => (
                      <div key={periodo.label}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{periodo.label}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {periodo.horarios.map(h => (
                            <button key={h} onClick={() => setHorarioSelecionado(h)}
                              style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid', background: horarioSelecionado === h ? 'var(--accent)' : 'var(--surface)', color: horarioSelecionado === h ? '#fff' : 'var(--text-primary)', borderColor: horarioSelecionado === h ? 'var(--accent)' : 'var(--border)' }}>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapa(2)} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Voltar
              </button>
              <button onClick={() => { if (!dataSelecionada || !horarioSelecionado) { setErro('Selecione data e horário.'); return }; setErro(''); setEtapa(4) }}
                disabled={!dataSelecionada || !horarioSelecionado}
                style={{ flex: 2, background: 'var(--accent)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: dataSelecionada && horarioSelecionado ? 'pointer' : 'not-allowed', opacity: dataSelecionada && horarioSelecionado ? 1 : 0.5 }}>
                Continuar →
              </button>
            </div>
            {erro && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '10px' }}>{erro}</p>}
          </div>
        )}

        {/* ETAPA 4 */}
        {etapa === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Seus dados</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Para finalizar o agendamento</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>Resumo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Serviço', valor: `${servicoSelecionado?.nome} · R$ ${servicoSelecionado?.preco}` },
                  { label: 'Profissional', valor: profissionalSelecionado?.nome },
                  { label: 'Data', valor: formatarDataExibicao(dataSelecionada) },
                  { label: 'Horário', valor: horarioSelecionado },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Seu nome *</label>
                <input type="text" placeholder="Ex: Maria Silva" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefone (opcional)</label>
                <input type="text" placeholder="Ex: (11) 99999-9999" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {erro && <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '12px' }}>{erro}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapa(3)} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Voltar
              </button>
              <button onClick={handleAgendar} disabled={loading}
                style={{ flex: 2, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
                {loading ? 'Confirmando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}

        <div style={{ height: '48px' }} />
      </div>
    </main>
  )
}