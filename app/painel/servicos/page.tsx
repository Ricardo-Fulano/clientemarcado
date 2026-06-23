'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const DURACOES = [
  { label: '15 minutos', value: '15' },
  { label: '30 minutos', value: '30' },
  { label: '45 minutos', value: '45' },
  { label: '1 hora',     value: '60' },
  { label: '1h30',       value: '90' },
  { label: '2 horas',    value: '120' },
  { label: 'Personalizado', value: 'custom' },
]

interface Servico {
  id: string
  nome: string
  descricao?: string
  preco: number
  duracao_minutos: number
}

export default function Servicos() {
  const [servicos, setServicos]     = useState<Servico[]>([])
  const [userId, setUserId]         = useState('')

  // Form
  const [editandoId, setEditandoId]         = useState<string | null>(null)
  const [nome, setNome]                     = useState('')
  const [descricao, setDescricao]           = useState('')
  const [precoDisplay, setPrecoDisplay]     = useState('')
  const [duracaoSel, setDuracaoSel]         = useState('30')
  const [duracaoCustom, setDuracaoCustom]   = useState('')
  const [loading, setLoading]               = useState(false)
  const [mensagem, setMensagem]             = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data } = await supabase
      .from('servicos').select('*').eq('user_id', user.id).order('nome')
    if (data) setServicos(data)
  }

  // Máscara monetária
  function fmtPrecoDisplay(raw: string) {
    const nums = raw.replace(/\D/g, '')
    if (!nums) return ''
    return (parseInt(nums, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }
  function handlePrecoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPrecoDisplay(fmtPrecoDisplay(e.target.value.replace(/\D/g, '') || '0'))
  }
  function parsePreco() {
    if (!precoDisplay) return 0
    return parseFloat(precoDisplay.replace(/\./g, '').replace(',', '.')) || 0
  }

  function duracaoFinal(): number {
    if (duracaoSel === 'custom') return parseInt(duracaoCustom) || 0
    return parseInt(duracaoSel)
  }

  function fmtDuracao(min: number) {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  }

  function resetForm() {
    setEditandoId(null)
    setNome(''); setDescricao(''); setPrecoDisplay('')
    setDuracaoSel('30'); setDuracaoCustom('')
    setMensagem('')
  }

  function preencherForm(s: Servico) {
    setEditandoId(s.id)
    setNome(s.nome)
    setDescricao(s.descricao || '')
    setPrecoDisplay(fmtPrecoDisplay(String(Math.round(s.preco * 100))))
    const dur = String(s.duracao_minutos)
    const match = DURACOES.find(d => d.value === dur)
    if (match && match.value !== 'custom') { setDuracaoSel(dur); setDuracaoCustom('') }
    else { setDuracaoSel('custom'); setDuracaoCustom(dur) }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSalvar() {
    setMensagem('')
    if (!nome.trim()) { setMensagem('Informe o nome do serviço.'); return }
    if (!parsePreco()) { setMensagem('Informe o preço.'); return }
    if (duracaoSel === 'custom' && !parseInt(duracaoCustom)) {
      setMensagem('Informe a duração personalizada em minutos.'); return
    }
    setLoading(true)
    const payload = {
      user_id: userId,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      preco: parsePreco(),
      duracao_minutos: duracaoFinal(),
    }
    let error
    if (editandoId) {
      ({ error } = await supabase.from('servicos').update(payload).eq('id', editandoId))
    } else {
      ({ error } = await supabase.from('servicos').insert(payload))
    }
    setLoading(false)
    if (error) {
      console.error('Supabase error:', error)
      setMensagem('Erro ao salvar. Tente novamente.')
    } else {
      resetForm()
      setMensagem(editandoId ? 'Serviço atualizado!' : 'Serviço adicionado!')
      carregar()
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  async function handleExcluir(id: string) {
    const ok = window.confirm('Tem certeza que deseja excluir este serviço?')
    if (!ok) return
    await supabase.from('servicos').delete().eq('id', id)
    if (editandoId === id) resetForm()
    carregar()
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

    .body { max-width: 660px; margin: 0 auto; padding: 24px 16px 56px; }
    @media (min-width: 640px) { .body { padding: 32px 24px 64px; } }

    .heading { margin-bottom: 24px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 480px) { .heading h1 { font-size: 23px; } }
    .heading p { font-size: 14px; color: #6B7280; line-height: 1.5; }

    /* CARD FORM */
    .form-card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09); border-radius: 18px;
      padding: 22px 18px; margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @media (min-width: 480px) { .form-card { padding: 26px 24px; } }
    .form-titulo { font-size: 15px; font-weight: 700; color: #F1F5F9; margin-bottom: 18px; }

    .fields { display: flex; flex-direction: column; gap: 14px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 380px) { .row-2 { grid-template-columns: 1fr; } }

    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px;
    }
    .input, .select, .textarea {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 13px 16px; color: #F1F5F9; font-size: 16px; outline: none;
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

    /* Preço prefix */
    .preco-wrap { position: relative; }
    .preco-prefix {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      font-size: 14px; color: #6B7280; font-weight: 600; pointer-events: none;
    }
    .preco-wrap .input { padding-left: 36px; }

    /* Custom duration reveal */
    .custom-reveal {
      margin-top: 10px; padding: 13px 14px;
      background: rgba(59,130,246,0.04);
      border: 1px solid rgba(59,130,246,0.15); border-radius: 10px;
    }
    .custom-reveal .label { color: #6B7280; }
    .field-hint { font-size: 11px; color: #374151; margin-top: 5px; }

    /* Mensagem */
    .msg-ok  { font-size: 13px; color: #22C55E; padding: 10px 14px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; }
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; }

    /* Botões */
    .form-btns { display: flex; gap: 8px; }
    .btn-salvar {
      flex: 1; background: #3B82F6; color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: background 0.15s, opacity 0.15s; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-salvar:hover { background: #2563EB; }
    .btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancelar-edit {
      padding: 14px 18px; border-radius: 12px; font-size: 13px; font-weight: 600;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #6B7280; cursor: pointer; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
      transition: color 0.15s;
    }
    .btn-cancelar-edit:hover { color: #D1D5DB; }

    /* Lista */
    .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .sec-titulo { font-size: 13px; font-weight: 700; color: #9CA3AF; }

    .svc-lista { display: flex; flex-direction: column; gap: 8px; }
    .svc-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
      padding: 16px 18px;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
      transition: border-color 0.15s;
    }
    .svc-card:hover { border-color: rgba(255,255,255,0.12); }
    .svc-card.editando { border-color: rgba(59,130,246,0.4); background: linear-gradient(180deg, rgba(59,130,246,0.05) 0%, rgba(10,12,16,0.97) 100%); }
    .svc-nome { font-size: 14px; font-weight: 700; color: #F1F5F9; margin-bottom: 3px; }
    .svc-desc { font-size: 12px; color: #6B7280; margin-bottom: 5px; line-height: 1.4; }
    .svc-meta { font-size: 12px; color: #4B5563; }
    .svc-preco { color: #22C55E; font-weight: 700; }
    .svc-acoes { display: flex; gap: 6px; flex-shrink: 0; margin-top: 2px; }
    .btn-editar {
      font-size: 11px; font-weight: 600; color: #3B82F6;
      background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
      border-radius: 7px; padding: 5px 10px; cursor: pointer; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-excluir {
      font-size: 11px; font-weight: 600; color: #6B7280;
      background: none; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 7px; padding: 5px 10px; cursor: pointer; font-family: inherit;
      transition: color 0.15s, border-color 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-excluir:hover { color: #EF4444; border-color: rgba(239,68,68,0.3); }

    /* Vazio */
    .vazio {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
      padding: 32px 24px; text-align: center;
    }
    .vazio p:first-child { font-size: 14px; color: #6B7280; margin-bottom: 5px; }
    .vazio p:last-child  { font-size: 12px; color: #374151; }
  `

  return (
    <div className="pg">
      <style>{css}</style>

      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <Link href="/painel" className="nav-back">← Voltar ao painel</Link>
      </nav>

      <div className="body">
        <div className="heading">
          <h1>Meus serviços</h1>
          <p>Cadastre os serviços, consultas ou atendimentos que seu negócio oferece.</p>
        </div>

        {/* FORMULÁRIO */}
        <div className="form-card">
          <p className="form-titulo">{editandoId ? '✏️ Editar serviço' : '+ Adicionar serviço'}</p>
          <div className="fields">

            {/* Nome */}
            <div>
              <label className="label">Nome do serviço *</label>
              <input type="text"
                placeholder="Ex: Corte, Consulta, Limpeza, Avaliação, Sessão"
                value={nome} onChange={e => setNome(e.target.value)}
                className="input" />
            </div>

            {/* Descrição */}
            <div>
              <label className="label">Descrição (opcional)</label>
              <input type="text"
                placeholder="Ex: Atendimento com horário marcado"
                value={descricao} onChange={e => setDescricao(e.target.value)}
                className="input" />
            </div>

            {/* Preço + Duração */}
            <div className="row-2">
              <div>
                <label className="label">Preço *</label>
                <div className="preco-wrap">
                  <span className="preco-prefix">R$</span>
                  <input type="text" inputMode="numeric" placeholder="0,00"
                    value={precoDisplay} onChange={handlePrecoChange}
                    className="input" />
                </div>
              </div>
              <div>
                <label className="label">Duração</label>
                <select value={duracaoSel} onChange={e => setDuracaoSel(e.target.value)} className="select">
                  {DURACOES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duração personalizada */}
            {duracaoSel === 'custom' && (
              <div className="custom-reveal">
                <label className="label">Duração personalizada *</label>
                <input type="number" inputMode="numeric" placeholder="Ex: 75"
                  value={duracaoCustom} onChange={e => setDuracaoCustom(e.target.value)}
                  className="input" />
                <p className="field-hint">Informe a duração em minutos.</p>
              </div>
            )}

            {mensagem && (
              <div className={mensagem.includes('Erro') || mensagem.includes('Informe') ? 'msg-err' : 'msg-ok'}>
                {mensagem}
              </div>
            )}

            <div className="form-btns">
              {editandoId && (
                <button className="btn-cancelar-edit" onClick={resetForm}>Cancelar</button>
              )}
              <button className="btn-salvar" onClick={handleSalvar} disabled={loading}>
                {loading ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar serviço'}
              </button>
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="sec-header">
          <p className="sec-titulo">Serviços cadastrados</p>
          {servicos.length > 0 && (
            <p style={{ fontSize: '12px', color: '#4B5563' }}>{servicos.length} serviço{servicos.length > 1 ? 's' : ''}</p>
          )}
        </div>

        {servicos.length === 0 ? (
          <div className="vazio">
            <p>Nenhum serviço cadastrado ainda.</p>
            <p>Adicione serviços usando o formulário acima.</p>
          </div>
        ) : (
          <div className="svc-lista">
            {servicos.map(s => (
              <div key={s.id} className={`svc-card${editandoId === s.id ? ' editando' : ''}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="svc-nome">{s.nome}</p>
                  <p className="svc-desc">
                    {s.descricao || 'Atendimento com horário marcado'}
                  </p>
                  <p className="svc-meta">
                    {fmtDuracao(s.duracao_minutos || 30)}
                    {' · '}
                    <span className="svc-preco">R$ {Number(s.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
                <div className="svc-acoes">
                  <button className="btn-editar" onClick={() => preencherForm(s)}>Editar</button>
                  <button className="btn-excluir" onClick={() => handleExcluir(s.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
