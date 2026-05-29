'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function RegistrarAtendimento() {
  const [userId, setUserId] = useState('')
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [servicos, setServicos] = useState<any[]>([])

  const [profissionalId, setProfissionalId] = useState('')
  const [profissionalNomeManual, setProfissionalNomeManual] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [servicoOutro, setServicoOutro] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [valorDisplay, setValorDisplay] = useState('')
  const [observacao, setObservacao] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const semProfissionais = profissionais.length === 0
  const isOutroServico = servicoId === '__outro__'

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const { data: profs } = await supabase.from('profissionais').select('id, nome').eq('user_id', user.id).order('nome')
      setProfissionais(profs || [])
      const { data: svcs } = await supabase.from('servicos').select('id, nome, preco').eq('user_id', user.id).order('nome')
      setServicos(svcs || [])
    }
    carregar()
  }, [])

  // Preenche valor ao selecionar serviÃ§o cadastrado
  useEffect(() => {
    if (!isOutroServico && servicoId) {
      const svc = servicos.find(s => s.id === servicoId)
      if (svc?.preco) setValorDisplay(formatarValorDisplay(String(svc.preco)))
      else setValorDisplay('')
    }
    if (isOutroServico) setValorDisplay('')
  }, [servicoId])

  function formatarValorDisplay(raw: string): string {
    const nums = raw.replace(/\D/g, '')
    if (!nums) return ''
    const cents = parseInt(nums, 10)
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nums = e.target.value.replace(/\D/g, '')
    setValorDisplay(formatarValorDisplay(nums || '0'))
  }

  function parseValor(): number | null {
    if (!valorDisplay) return null
    const v = parseFloat(valorDisplay.replace(/\./g, '').replace(',', '.'))
    return isNaN(v) ? null : v
  }

  function aplicarMascaraTel(valor: string) {
    const n = valor.replace(/\D/g, '').slice(0, 11)
    if (n.length > 10) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
    if (n.length > 6)  return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
    if (n.length > 2)  return `(${n.slice(0,2)}) ${n.slice(2)}`
    if (n.length > 0)  return `(${n}`
    return ''
  }

  function nomeProfissional(): string {
    if (semProfissionais) return profissionalNomeManual.trim()
    const p = profissionais.find(p => p.id === profissionalId)
    return p ? p.nome : ''
  }

  function nomeServico(): string {
    if (isOutroServico) return servicoOutro.trim()
    const s = servicos.find(s => s.id === servicoId)
    return s ? s.nome : ''
  }

  async function handleRegistrar() {
    setErro('')
    const profNome = nomeProfissional()
    if (!profNome) {
      setErro(semProfissionais ? 'Informe o nome do profissional.' : 'Selecione um profissional.')
      return
    }
    if (isOutroServico && !servicoOutro.trim()) {
      setErro('Descreva o serviÃ§o realizado.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('atendimentos').insert({
      user_id: userId,
      profissional_nome_livre: profNome,
      cliente_nome: clienteNome.trim() || null,
      cliente_telefone: clienteTelefone || null,
      servico_livre: nomeServico() || null,
      valor: parseValor(),
      observacao: observacao.trim() || null,
    })
    setLoading(false)
    if (error) {
      setErro('Erro ao registrar. Tente novamente.')
    } else {
      setSucesso(true)
      setProfissionalId(''); setProfissionalNomeManual('')
      setServicoId(''); setServicoOutro('')
      setClienteNome(''); setClienteTelefone('')
      setValorDisplay(''); setObservacao('')
      setTimeout(() => setSucesso(false), 4000)
    }
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .pg {
      min-height: 100vh;
      background: #08080A;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* NAV */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96);
      backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 10;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; text-decoration: none; letter-spacing: -0.02em; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    /* BODY */
    .body { max-width: 560px; margin: 0 auto; padding: 28px 16px 56px; }
    @media (min-width: 640px) { .body { padding: 36px 24px 64px; } }

    /* HEADING */
    .heading { margin-bottom: 24px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 480px) { .heading h1 { font-size: 22px; } }
    .heading p { font-size: 14px; color: #6B7280; }

    /* SUCESSO */
    .msg-ok {
      background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
      border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;
      text-align: center; font-size: 14px; font-weight: 600; color: #22C55E;
    }

    /* CARD */
    .card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 18px;
      padding: 22px 18px;
      display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @media (min-width: 480px) { .card { padding: 28px 24px; } }

    /* SECTION DIVIDER */
    .section-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: #374151; margin-bottom: 12px;
      padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .section-group { display: flex; flex-direction: column; gap: 14px; }

    /* FIELD */
    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 7px;
    }
    .input, .select, .textarea {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 14px 16px;
      color: #F1F5F9;
      font-size: 16px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-appearance: none;
    }
    .input:focus, .select:focus, .textarea:focus {
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder, .textarea::placeholder { color: #374151; }
    .select { cursor: pointer; }
    .select option { background: #0F1117; color: #F1F5F9; }
    .textarea { resize: none; }

    /* Valor field â€” prefix */
    .valor-wrap { position: relative; }
    .valor-prefix {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      font-size: 14px; color: #6B7280; font-weight: 600; pointer-events: none;
    }
    .valor-wrap .input { padding-left: 36px; }

    /* Outro serviÃ§o reveal */
    .outro-reveal {
      margin-top: 10px;
      padding: 14px;
      background: rgba(59,130,246,0.04);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 10px;
    }
    .outro-reveal .label { color: #6B7280; }

    /* Erro */
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; }

    /* BotÃ£o */
    .btn-registrar {
      width: 100%;
      background: #3B82F6; color: #fff;
      border: none; border-radius: 12px;
      padding: 15px;
      font-size: 15px; font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: background 0.15s, opacity 0.15s;
      font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-registrar:hover { background: #2563EB; }
    .btn-registrar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Divider */
    .divider { height: 1px; background: rgba(255,255,255,0.05); }
  `

  return (
    <div className="pg">
      <style>{css}</style>

      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <Link href="/painel" className="nav-back">â† Voltar ao painel</Link>
      </nav>

      <div className="body">
        <div className="heading">
          <h1>Registrar atendimento</h1>
          <p>Registre atendimentos presenciais feitos na hora.</p>
        </div>

        {sucesso && (
          <div className="msg-ok">âœ… Atendimento registrado com sucesso!</div>
        )}

        <div className="card">

          {/* â”€â”€ PROFISSIONAL â”€â”€ */}
          <div>
            <p className="section-label">Profissional</p>
            <div className="section-group">
              {semProfissionais ? (
                <div>
                  <label className="label">Nome do profissional *</label>
                  <input type="text" placeholder="Ex: Antonio, JoÃ£o..."
                    value={profissionalNomeManual}
                    onChange={e => setProfissionalNomeManual(e.target.value)}
                    className="input" />
                </div>
              ) : (
                <div>
                  <label className="label">Profissional *</label>
                  <select value={profissionalId}
                    onChange={e => setProfissionalId(e.target.value)}
                    className="select">
                    <option value="">Selecione o profissional...</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="divider" />

          {/* â”€â”€ SERVIÃ‡O â”€â”€ */}
          <div>
            <p className="section-label">ServiÃ§o</p>
            <div className="section-group">
              <div>
                <label className="label">ServiÃ§o realizado (opcional)</label>
                <select value={servicoId}
                  onChange={e => setServicoId(e.target.value)}
                  className="select">
                  <option value="">Selecione o serviÃ§o...</option>
                  {servicos.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome}{s.preco ? ` â€” R$ ${parseFloat(s.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                    </option>
                  ))}
                  <option value="__outro__">âœï¸ Outro serviÃ§o</option>
                </select>

                {isOutroServico && (
                  <div className="outro-reveal">
                    <label className="label">Descreva o serviÃ§o realizado *</label>
                    <input type="text"
                      placeholder="Ex: ajuste rÃ¡pido, retoque, venda de produto..."
                      value={servicoOutro}
                      onChange={e => setServicoOutro(e.target.value)}
                      className="input" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* â”€â”€ CLIENTE â”€â”€ */}
          <div>
            <p className="section-label">Cliente</p>
            <div className="section-group">
              <div>
                <label className="label">Nome do cliente (opcional)</label>
                <input type="text" placeholder="Ex: Carlos Silva"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  className="input" />
              </div>
              <div>
                <label className="label">Telefone (opcional)</label>
                <input type="tel" placeholder="(11) 99999-9999"
                  value={clienteTelefone}
                  onChange={e => setClienteTelefone(aplicarMascaraTel(e.target.value))}
                  className="input" />
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* â”€â”€ PAGAMENTO â”€â”€ */}
          <div>
            <p className="section-label">Pagamento</p>
            <div className="section-group">
              <div>
                <label className="label">Valor cobrado</label>
                <div className="valor-wrap">
                  <span className="valor-prefix">R$</span>
                  <input type="text" inputMode="numeric"
                    placeholder="0,00"
                    value={valorDisplay}
                    onChange={handleValorChange}
                    className="input" />
                </div>
                {servicoId && !isOutroServico && servicos.find(s => s.id === servicoId)?.preco && (
                  <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '6px' }}>
                    Valor do serviÃ§o preenchido automaticamente. Edite se necessÃ¡rio.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* â”€â”€ OBSERVAÃ‡ÃƒO â”€â”€ */}
          <div>
            <label className="label">ObservaÃ§Ã£o (opcional)</label>
            <textarea rows={3}
              placeholder="Ex: cliente pediu acabamento na navalha, pagou em dinheiro ou quer retorno em 15 dias"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="textarea" />
          </div>

          {erro && <p className="msg-err">{erro}</p>}

          <button onClick={handleRegistrar} disabled={loading} className="btn-registrar">
            {loading ? 'Registrando...' : 'Registrar atendimento'}
          </button>

        </div>
      </div>
    </div>
  )
}
