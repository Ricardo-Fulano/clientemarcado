'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const DIAS_SEMANA = [
  { key: 'domingo',   label: 'Domingo',       num: 0 },
  { key: 'segunda',   label: 'Segunda-feira',  num: 1 },
  { key: 'terca',     label: 'Terça-feira',    num: 2 },
  { key: 'quarta',    label: 'Quarta-feira',   num: 3 },
  { key: 'quinta',    label: 'Quinta-feira',   num: 4 },
  { key: 'sexta',     label: 'Sexta-feira',    num: 5 },
  { key: 'sabado',    label: 'Sábado',         num: 6 },
]

const HORARIOS_PADRAO: Record<string, { ativo: boolean; abertura: string; fechamento: string }> = {
  domingo:  { ativo: false, abertura: '',      fechamento: '' },
  segunda:  { ativo: true,  abertura: '08:00', fechamento: '18:00' },
  terca:    { ativo: true,  abertura: '08:00', fechamento: '18:00' },
  quarta:   { ativo: true,  abertura: '08:00', fechamento: '18:00' },
  quinta:   { ativo: true,  abertura: '08:00', fechamento: '18:00' },
  sexta:    { ativo: true,  abertura: '08:00', fechamento: '18:00' },
  sabado:   { ativo: true,  abertura: '08:00', fechamento: '12:00' },
}

function aplicarMascaraTel(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length > 10) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length > 6)  return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if (n.length > 2)  return `(${n.slice(0,2)}) ${n.slice(2)}`
  if (n.length > 0)  return `(${n}`
  return ''
}

export default function Perfil() {
  // Campos existentes
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [intervaloAgenda, setIntervaloAgenda] = useState(30)
  const [horaAbertura, setHoraAbertura] = useState('08:00')
  const [horaFechamento, setHoraFechamento] = useState('18:00')
  const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>([1,2,3,4,5,6])
  const [antecedenciaMinima, setAntecedenciaMinima] = useState(0)

  // Novos campos
  const [instagram, setInstagram] = useState('')
  const [cidadeEstado, setCidadeEstado] = useState('')
  const [descricaoCurta, setDescricaoCurta] = useState('')
  const [horariosFuncionamento, setHorariosFuncionamento] = useState(HORARIOS_PADRAO)

  // UI
  const [loading, setLoading] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroUpload, setErroUpload] = useState('')
  const [perfilExiste, setPerfilExiste] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [userId, setUserId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { carregarPerfil() }, [])

  async function carregarPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    if (data) {
      setNomeNegocio(data.nome_negocio || '')
      setSlug(data.slug || '')
      setWhatsapp(aplicarMascaraTel(data.whatsapp || ''))
      setEndereco(data.endereco || '')
      setBannerUrl(data.banner_url || '')
      setIntervaloAgenda(data.intervalo_agenda || 30)
      setHoraAbertura(data.hora_abertura || '08:00')
      setHoraFechamento(data.hora_fechamento || '18:00')
      setDiasFuncionamento(data.dias_funcionamento || [1,2,3,4,5,6])
      setAntecedenciaMinima(data.antecedencia_minima || 0)
      setInstagram(data.instagram || '')
      setCidadeEstado(data.cidade_estado || '')
      setDescricaoCurta(data.descricao_curta || data.descricao || '')
      setHorariosFuncionamento(sanitizarHorarios(data.horarios_funcionamento || HORARIOS_PADRAO))
      setPerfilExiste(true)
    }
  }

  function gerarSlug(nome: string) {
    return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
  }

  async function handleUpload(file: File) {
    setErroUpload('')
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setErroUpload('JPG, PNG ou WEBP, máx. 5 MB.'); return }
    if (file.size > 5*1024*1024) { setErroUpload('Imagem muito grande. Máx. 5 MB.'); return }
    setUploadando(true)
    const ext = file.name.split('.').pop()
    const path = userId + '/banner-' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('business-banners').upload(path, file, { upsert: true })
    if (error) { setErroUpload('Erro ao enviar imagem.'); setUploadando(false); return }
    const { data: urlData } = supabase.storage.from('business-banners').getPublicUrl(path)
    setBannerUrl(urlData.publicUrl)
    setUploadando(false)
  }

  function toggleDia(num: number) {
    setDiasFuncionamento(prev =>
      prev.includes(num) ? prev.filter(d => d !== num) : [...prev, num].sort()
    )
  }

  function atualizarHorario(key: string, campo: 'ativo' | 'abertura' | 'fechamento', valor: any) {
    setHorariosFuncionamento(prev => {
      const atual = prev[key] || { ativo: false, abertura: '', fechamento: '' }
      // When activating a day, ensure default times are set
      if (campo === 'ativo' && valor === true) {
        return {
          ...prev,
          [key]: {
            ativo: true,
            abertura: atual.abertura || '08:00',
            fechamento: atual.fechamento || '18:00',
          }
        }
      }
      return { ...prev, [key]: { ...atual, [campo]: valor } }
    })
  }

  // Fix any active day with empty times on load
  function sanitizarHorarios(h: Record<string, any>) {
    const result: Record<string, any> = {}
    for (const key of Object.keys(h)) {
      const d = h[key]
      if (d.ativo && (!d.abertura || !d.fechamento)) {
        result[key] = { ...d, abertura: d.abertura || '08:00', fechamento: d.fechamento || '18:00' }
      } else {
        result[key] = d
      }
    }
    return result
  }

  async function handleSalvar() {
    if (!nomeNegocio || !slug) { setMensagem('Nome e link são obrigatórios.'); return }
    // Validar horários
    for (const d of DIAS_SEMANA) {
      const h = horariosFuncionamento[d.key]
      if (h.ativo) {
        if (!h.abertura || !h.fechamento) {
          setMensagem(`Preencha os horários de ${d.label}.`)
          return
        }
        if (h.abertura >= h.fechamento) {
          setMensagem(`Horário inválido em ${d.label}: fechamento deve ser após abertura.`)
          return
        }
      }
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      nome_negocio: nomeNegocio, slug, whatsapp: whatsapp.replace(/\D/g, ''), endereco,
      banner_url: bannerUrl, intervalo_agenda: intervaloAgenda,
      hora_abertura: horaAbertura, hora_fechamento: horaFechamento,
      dias_funcionamento: diasFuncionamento,
      antecedencia_minima: antecedenciaMinima,
      instagram: instagram.replace('@','').trim() || null,
      cidade_estado: cidadeEstado.trim() || null,
      descricao_curta: descricaoCurta.trim() || null,
      descricao: descricaoCurta.trim() || null,
      horarios_funcionamento: horariosFuncionamento,
    }
    if (perfilExiste) {
      const { error } = await supabase.from('perfis').update(payload).eq('user_id', user?.id)
      setMensagem(error ? 'Erro ao salvar.' : 'Perfil atualizado!')
    } else {
      const { error } = await supabase.from('perfis').insert({ user_id: user?.id, ...payload })
      if (error) setMensagem(error.message.includes('slug') ? 'Esse link já está em uso.' : 'Erro ao salvar.')
      else { setMensagem('Perfil criado!'); setPerfilExiste(true) }
    }
    setLoading(false)
    setTimeout(() => setMensagem(''), 4000)
  }

  function copiarLink() {
    navigator.clipboard.writeText('https://clientemarcado.vercel.app/' + slug)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  function compartilharWhatsapp() {
    const link = 'https://clientemarcado.vercel.app/' + slug
    window.open('https://wa.me/?text=' + encodeURIComponent('Agende seu horário pelo link: ' + link), '_blank')
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg {
      min-height: 100vh; background: #08080A; color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96); backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 20;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    .body { max-width: 680px; margin: 0 auto; padding: 24px 16px 56px; }
    @media (min-width: 640px) { .body { padding: 32px 24px 64px; } }

    .heading { margin-bottom: 24px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 480px) { .heading h1 { font-size: 23px; } }
    .heading p { font-size: 14px; color: #6B7280; }

    /* Link card */
    .link-card {
      background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
      border-radius: 16px; padding: 18px 20px; margin-bottom: 20px;
    }
    .link-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #3B82F6; margin-bottom: 6px; }
    .link-url { font-size: 13px; color: #9CA3AF; margin-bottom: 14px; word-break: break-all; }
    .link-btns { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-link { flex: 1; min-width: 80px; border: none; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; -webkit-tap-highlight-color: transparent; }
    .btn-link:hover { opacity: 0.85; }

    /* Card seções */
    .section-card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09); border-radius: 18px;
      padding: 22px 18px; margin-bottom: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @media (min-width: 480px) { .section-card { padding: 26px 24px; } }
    .section-titulo {
      font-size: 14px; font-weight: 700; color: #F1F5F9;
      margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
    }
    .section-sub { font-size: 12px; color: #6B7280; margin-bottom: 20px; line-height: 1.5; }
    .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0 20px; }

    /* Fields */
    .fields { display: flex; flex-direction: column; gap: 16px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 380px) { .row-2 { grid-template-columns: 1fr; } }

    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px;
    }
    .input, .select, .textarea {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 12px 16px; color: #F1F5F9; font-size: 15px; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit; -webkit-appearance: none;
    }
    .input:focus, .select:focus, .textarea:focus {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder, .textarea::placeholder { color: #374151; }
    .select { cursor: pointer; }
    .select option { background: #0F1117; color: #F1F5F9; }
    .textarea { resize: none; }
    .field-hint { font-size: 11px; color: #374151; margin-top: 5px; }
    .char-count { font-size: 11px; color: #374151; text-align: right; margin-top: 4px; }

    /* Slug wrapper */
    .slug-wrap {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 12px 16px;
      transition: border-color 0.15s;
    }
    .slug-wrap:focus-within {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .slug-prefix { font-size: 11px; color: #4B5563; white-space: nowrap; margin-right: 4px; }
    .slug-input {
      background: transparent; border: none; outline: none;
      color: #F1F5F9; font-size: 13px; flex: 1; font-family: inherit;
    }

    /* Dias semana chips */
    .dias-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .dia-chip {
      padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid; transition: all 0.15s;
      font-family: inherit; -webkit-tap-highlight-color: transparent;
    }
    .dia-chip.on  { background: #3B82F6; color: #fff; border-color: #3B82F6; }
    .dia-chip.off { background: rgba(255,255,255,0.04); color: #6B7280; border-color: rgba(255,255,255,0.08); }

    /* Horários por dia */
    .dia-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .dia-row:last-child { border-bottom: none; }
    .dia-toggle {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-width: 140px;
    }
    .toggle-btn {
      width: 36px; height: 20px; border-radius: 999px; border: none; cursor: pointer;
      position: relative; transition: background 0.2s; flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .toggle-btn::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%; background: #fff;
      transition: transform 0.2s;
    }
    .toggle-btn.on  { background: #3B82F6; }
    .toggle-btn.on::after { transform: translateX(16px); }
    .toggle-btn.off { background: rgba(255,255,255,0.15); }
    .dia-nome { font-size: 13px; font-weight: 600; color: #D1D5DB; min-width: 90px; }
    .dia-fechado { font-size: 12px; color: #374151; }
    .dia-horarios { display: flex; align-items: center; gap: 8px; flex: 1; }
    .dia-horario-input {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 7px 10px; color: #F1F5F9;
      font-size: 13px; outline: none; width: 90px;
      transition: border-color 0.15s; font-family: inherit;
    }
    .dia-horario-input:focus { border-color: rgba(59,130,246,0.5); }
    .dia-horario-input:disabled { opacity: 0.3; cursor: not-allowed; }
    .dia-sep { font-size: 12px; color: #374151; }

    /* Banner */
    .banner-drop {
      border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px;
      padding: 32px 24px; text-align: center; cursor: pointer;
      background: rgba(255,255,255,0.02); transition: border-color 0.15s;
    }
    .banner-drop:hover { border-color: rgba(59,130,246,0.3); }

    /* Mensagem */
    .msg-ok  { font-size: 13px; color: #22C55E; padding: 10px 14px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; text-align: center; }
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; text-align: center; }

    /* Botão salvar */
    .btn-salvar {
      width: 100%; background: #3B82F6; color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: background 0.15s, opacity 0.15s; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-salvar:hover { background: #2563EB; }
    .btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }
  `

  const diasSemanaChips = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  return (
    <div className="pg">
      <style>{css}</style>

      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <Link href="/painel" className="nav-back">← Voltar ao painel</Link>
      </nav>

      <div className="body">
        <div className="heading">
          <h1>Perfil do negócio</h1>
          <p>Configure como seu negócio aparece para os clientes.</p>
        </div>

        {/* Link de agendamento */}
        {perfilExiste && (
          <div className="link-card">
            <p className="link-label">Seu link de agendamento</p>
            <p className="link-url">https://clientemarcado.vercel.app/{slug}</p>
            <div className="link-btns">
              <button className="btn-link" onClick={copiarLink} style={{ background: '#3B82F6', color: '#fff' }}>
                {copiado ? '✓ Copiado!' : 'Copiar link'}
              </button>
              <button className="btn-link" onClick={compartilharWhatsapp} style={{ background: '#16A34A', color: '#fff' }}>
                WhatsApp
              </button>
              <a href={'/' + slug} target="_blank"
                style={{ flex: 1, minWidth: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontWeight: '600', color: '#9CA3AF', textDecoration: 'none', display: 'inline-block' }}>
                Ver página
              </a>
            </div>
          </div>
        )}

        {/* ── SEÇÃO 1: Informações básicas ── */}
        <div className="section-card">
          <p className="section-titulo">🏢 Informações do negócio</p>
          <p className="section-sub">Dados principais que identificam seu negócio.</p>
          <div className="fields">
            <div>
              <label className="label">Nome do negócio *</label>
              <input type="text" placeholder="Ex: Barbearia do João, Clínica Saúde & Bem-Estar"
                value={nomeNegocio}
                onChange={e => { setNomeNegocio(e.target.value); if (!perfilExiste) setSlug(gerarSlug(e.target.value)) }}
                className="input" />
            </div>
            <div>
              <label className="label">Link personalizado *</label>
              <div className="slug-wrap">
                <span className="slug-prefix">clientemarcado.vercel.app/</span>
                <input type="text" placeholder="meu-negocio" value={slug}
                  onChange={e => setSlug(gerarSlug(e.target.value))}
                  className="slug-input" />
              </div>
            </div>
            <div>
              <label className="label">Endereço (opcional)</label>
              <input type="text" placeholder="Ex: Rua das Flores, 123 - São Paulo"
                value={endereco} onChange={e => setEndereco(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 2: Dados públicos ── */}
        <div className="section-card">
          <p className="section-titulo">🌐 Dados públicos do negócio</p>
          <p className="section-sub">Informações que aparecem na sua página de agendamento.</p>
          <div className="fields">
            <div>
              <label className="label">WhatsApp do negócio</label>
              <input type="tel" placeholder="Ex: (11) 99999-9999"
                value={whatsapp}
                onChange={e => setWhatsapp(aplicarMascaraTel(e.target.value))}
                className="input" />
              <p className="field-hint">Esse número será usado no botão de WhatsApp da sua página pública.</p>
            </div>
            <div>
              <label className="label">Instagram</label>
              <input type="text" placeholder="Ex: @seunegocio"
                value={instagram} onChange={e => setInstagram(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Cidade / Estado</label>
              <input type="text" placeholder="Ex: São Paulo - SP"
                value={cidadeEstado} onChange={e => setCidadeEstado(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Descrição curta do negócio</label>
              <textarea rows={3}
                placeholder="Ex: Atendimento com horário marcado, ambiente confortável e profissionais especializados."
                value={descricaoCurta}
                onChange={e => { if (e.target.value.length <= 180) setDescricaoCurta(e.target.value) }}
                className="textarea" />
              <p className="char-count">{descricaoCurta.length}/180</p>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 3: Funcionamento ── */}
        <div className="section-card">
          <p className="section-titulo">🕐 Funcionamento do negócio</p>
          <p className="section-sub">Defina os dias e horários em que seus clientes podem agendar.</p>

          {/* Dias chips (legado) */}
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Dias ativos (seleção rápida)</label>
            <div className="dias-chips">
              {diasSemanaChips.map((d, i) => (
                <button key={i}
                  className={`dia-chip ${diasFuncionamento.includes(i) ? 'on' : 'off'}`}
                  onClick={() => toggleDia(i)}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Horários detalhados por dia */}
          <label className="label" style={{ marginBottom: '12px', display: 'block' }}>Horários por dia</label>
          {DIAS_SEMANA.map(dia => {
            const h = horariosFuncionamento[dia.key] || { ativo: false, abertura: '', fechamento: '' }
            return (
              <div key={dia.key} className="dia-row">
                <div className="dia-toggle">
                  <button
                    className={`toggle-btn ${h.ativo ? 'on' : 'off'}`}
                    onClick={() => atualizarHorario(dia.key, 'ativo', !h.ativo)}
                  />
                  <span className="dia-nome">{dia.label}</span>
                </div>
                {h.ativo ? (
                  <div className="dia-horarios">
                    <input type="time" value={h.abertura}
                      onChange={e => atualizarHorario(dia.key, 'abertura', e.target.value)}
                      className="dia-horario-input" />
                    <span className="dia-sep">até</span>
                    <input type="time" value={h.fechamento}
                      onChange={e => atualizarHorario(dia.key, 'fechamento', e.target.value)}
                      className="dia-horario-input" />
                  </div>
                ) : (
                  <span className="dia-fechado">Fechado</span>
                )}
              </div>
            )
          })}
        </div>

        {/* ── SEÇÃO 4: Configurações da agenda ── */}
        <div className="section-card">
          <p className="section-titulo">⚙️ Configurações da agenda</p>
          <p className="section-sub">Controle como o agendamento público funciona.</p>
          <div className="fields">
            <div>
              <label className="label">Intervalo entre horários</label>
              <select value={intervaloAgenda}
                onChange={e => setIntervaloAgenda(Number(e.target.value))} className="select">
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
            <div className="row-2">
              <div>
                <label className="label">Abertura geral</label>
                <input type="time" value={horaAbertura}
                  onChange={e => setHoraAbertura(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Fechamento geral</label>
                <input type="time" value={horaFechamento}
                  onChange={e => setHoraFechamento(e.target.value)} className="input" />
              </div>
            </div>
            <p className="field-hint">Esses horários são usados como padrão quando um dia não tiver horário específico configurado acima.</p>
            <div>
              <label className="label">Antecedência mínima para agendamento</label>
              <select value={antecedenciaMinima}
                onChange={e => setAntecedenciaMinima(Number(e.target.value))} className="select">
                <option value={0}>Sem restrição</option>
                <option value={30}>30 minutos antes</option>
                <option value={60}>1 hora antes</option>
                <option value={120}>2 horas antes</option>
                <option value={240}>4 horas antes</option>
                <option value={720}>12 horas antes</option>
                <option value={1440}>24 horas antes</option>
              </select>
              <p className="field-hint">Clientes não poderão agendar dentro desse prazo.</p>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 5: Banner ── */}
        <div className="section-card">
          <p className="section-titulo">🖼️ Imagem de capa</p>
          <p className="section-sub">Aparece no topo da sua página de agendamento. Use uma imagem horizontal (16:9).</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
          {!bannerUrl ? (
            <div className="banner-drop" onClick={() => inputRef.current?.click()}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🖼️</div>
              <p style={{ fontWeight: '600', fontSize: '13px', color: '#D1D5DB', marginBottom: '4px' }}>
                {uploadando ? 'Enviando...' : 'Clique para enviar uma imagem'}
              </p>
              <p style={{ fontSize: '11px', color: '#4B5563' }}>16:9 · JPG, PNG ou WEBP · Máx. 5 MB</p>
            </div>
          ) : (
            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              <img src={bannerUrl} alt="Banner" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                <button onClick={() => inputRef.current?.click()} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Trocar</button>
                <button onClick={() => setBannerUrl('')} style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Remover</button>
              </div>
            </div>
          )}
          {erroUpload && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>{erroUpload}</p>}
        </div>

        {/* Mensagem + Botão salvar */}
        {mensagem && (
          <div className={mensagem.includes('Erro') || mensagem.includes('obrigatório') || mensagem.includes('inválido') || mensagem.includes('uso') ? 'msg-err' : 'msg-ok'} style={{ marginBottom: '14px' }}>
            {mensagem}
          </div>
        )}
        <button className="btn-salvar" onClick={handleSalvar} disabled={loading || uploadando}>
          {loading ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </div>
    </div>
  )
}
