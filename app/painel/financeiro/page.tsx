'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const CATEGORIAS = [
  'Aluguel','Luz','Água','Internet','Produtos',
  'Salários','Equipamentos','Marketing','Outros',
]

export default function Financeiro() {
  const [userId, setUserId] = useState('')
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))

  // Dados
  const [despesas, setDespesas] = useState<any[]>([])
  const [receita, setReceita] = useState(0)
  const [loadingDados, setLoadingDados] = useState(true)

  // Form
  const [descricao, setDescricao] = useState('')
  const [valorDisplay, setValorDisplay] = useState('')
  const [categoria, setCategoria] = useState('')
  const [outroDesc, setOutroDesc] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
    }
    init()
  }, [])

  useEffect(() => {
    if (userId) carregarDados()
  }, [userId, mes])

  async function carregarDados() {
    setLoadingDados(true)
    const inicio = mes + '-01'
    const fim    = mes + '-31'

    // Despesas
    const { data: desp } = await supabase
      .from('despesas').select('*').eq('user_id', userId)
      .gte('data', inicio).lte('data', fim)
      .order('data', { ascending: false })
    setDespesas(desp || [])

    // Receita: agendamentos + atendimentos
    const { data: ags } = await supabase
      .from('agendamentos').select('servicos(preco)')
      .eq('user_id', userId)
      .gte('data_hora', inicio + 'T00:00:00')
      .lte('data_hora', fim + 'T23:59:59')
      .neq('status', 'cancelado')
    const { data: ats } = await supabase
      .from('atendimentos').select('valor')
      .eq('user_id', userId)
      .gte('created_at', inicio).lte('created_at', fim)
    const recAgs = (ags || []).reduce((a: number, ag: any) => a + parseFloat(ag.servicos?.preco || 0), 0)
    const recAts = (ats || []).reduce((a: number, at: any) => a + parseFloat(at.valor || 0), 0)
    setReceita(recAgs + recAts)

    setLoadingDados(false)
  }

  // Valor mask
  function fmtValorDisplay(raw: string) {
    const nums = raw.replace(/\D/g, '')
    if (!nums) return ''
    return (parseInt(nums, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }
  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValorDisplay(fmtValorDisplay(e.target.value.replace(/\D/g, '') || '0'))
  }
  function parseValor() {
    if (!valorDisplay) return 0
    return parseFloat(valorDisplay.replace(/\./g, '').replace(',', '.')) || 0
  }

  function fmtBRL(v: number) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }
  function fmtData(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
  }
  function labelMes(m: string) {
    const [ano, mm] = m.split('-')
    const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    return `${nomes[parseInt(mm)-1]} de ${ano}`
  }

  function preencherForm(d: any) {
    setEditandoId(d.id)
    setDescricao(d.descricao)
    setValorDisplay(fmtValorDisplay(String(Math.round(d.valor * 100))))
    setCategoria(d.categoria || '')
    setOutroDesc(d.other_description || '')
    setData(d.data)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditandoId(null)
    setDescricao('')
    setValorDisplay('')
    setCategoria('')
    setOutroDesc('')
    setData(new Date().toISOString().split('T')[0])
  }

  async function handleSalvar() {
    setMensagem('')
    if (!descricao.trim()) { setMensagem('Informe a descrição.'); return }
    if (!parseValor()) { setMensagem('Informe o valor.'); return }
    if (!categoria) { setMensagem('Selecione a categoria.'); return }
    if (categoria === 'Outros' && !outroDesc.trim()) {
      setMensagem('Especifique a despesa.'); return
    }
    setLoading(true)
    const payload = {
      user_id: userId,
      descricao: descricao.trim(),
      valor: parseValor(),
      categoria,
      other_description: categoria === 'Outros' ? outroDesc.trim() : null,
      data,
    }
    let error
    if (editandoId) {
      ({ error } = await supabase.from('despesas').update(payload).eq('id', editandoId))
    } else {
      ({ error } = await supabase.from('despesas').insert(payload))
    }
    setLoading(false)
    if (error) {
      console.error('Supabase error:', error)
      setMensagem('Erro ao salvar: ' + error.message)
    } else {
      resetForm()
      setMensagem(editandoId ? 'Despesa atualizada!' : 'Despesa registrada!')
      carregarDados()
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  async function handleExcluir(id: string) {
    await supabase.from('despesas').delete().eq('id', id)
    if (editandoId === id) resetForm()
    carregarDados()
  }

  // Métricas
  const totalDespesas = despesas.reduce((a, d) => a + Number(d.valor), 0)
  const lucro = receita - totalDespesas
  const maiorDespesa = despesas.length
    ? despesas.reduce((max, d) => Number(d.valor) > Number(max.valor) ? d : max, despesas[0])
    : null

  // Resumo por categoria
  const porCategoria: Record<string, number> = {}
  despesas.forEach(d => {
    const cat = d.categoria === 'Outros' && d.categoria_outro ? d.categoria_outro : (d.categoria || 'Sem categoria')
    porCategoria[cat] = (porCategoria[cat] || 0) + Number(d.valor)
  })
  const catOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])

  const nomeDespesa = (d: any) =>
    d.categoria === 'Outros' && d.other_description ? `Outros — ${d.other_description}` : (d.categoria || '—')

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg {
      min-height: 100vh; background: #08080A; color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* NAV */
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

    /* BODY */
    .body { max-width: 780px; margin: 0 auto; padding: 24px 16px 56px; }
    @media (min-width: 720px) { .body { padding: 32px 24px 64px; } }

    /* HEADER */
    .page-header {
      display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;
    }
    @media (min-width: 560px) {
      .page-header { flex-direction: row; align-items: flex-start; justify-content: space-between; }
    }
    .page-title { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 560px) { .page-title { font-size: 24px; } }
    .page-sub { font-size: 14px; color: #6B7280; }

    /* Filtro mês */
    .mes-wrap { display: flex; flex-direction: column; gap: 4px; }
    .mes-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; }
    .mes-input {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 9px 14px; color: #F1F5F9;
      font-size: 13px; font-weight: 600; outline: none; cursor: pointer;
      font-family: inherit; -webkit-appearance: none;
      transition: border-color 0.15s;
    }
    .mes-input:focus { border-color: rgba(59,130,246,0.5); }

    /* CARDS MÉTRICAS */
    .metricas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
    @media (min-width: 560px) { .metricas { grid-template-columns: repeat(4, 1fr); gap: 12px; } }

    .metrica {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
      padding: 16px; position: relative; overflow: hidden;
    }
    .metrica-accent { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
    .metrica-label { font-size: 11px; color: #6B7280; font-weight: 500; margin-bottom: 8px; }
    .metrica-valor { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
    @media (min-width: 560px) { .metrica-valor { font-size: 22px; } }
    .metrica-sub { font-size: 11px; color: #4B5563; margin-top: 5px; line-height: 1.4; }

    /* FORMULÁRIO */
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
    @media (max-width: 400px) { .row-2 { grid-template-columns: 1fr; } }

    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px;
    }
    .input, .select {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 13px 16px; color: #F1F5F9; font-size: 16px; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit; -webkit-appearance: none;
    }
    .input:focus, .select:focus {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder { color: #374151; }
    .select { cursor: pointer; }
    .select option { background: #0F1117; color: #F1F5F9; }

    /* Valor prefix */
    .valor-wrap { position: relative; }
    .valor-prefix {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      font-size: 14px; color: #6B7280; font-weight: 600; pointer-events: none;
    }
    .valor-wrap .input { padding-left: 36px; }

    /* Outro reveal */
    .outro-reveal {
      margin-top: 10px; padding: 14px;
      background: rgba(59,130,246,0.04);
      border: 1px solid rgba(59,130,246,0.15); border-radius: 10px;
    }
    .outro-reveal .label { color: #6B7280; }

    /* Mensagens */
    .msg-ok  { font-size: 13px; color: #22C55E; padding: 10px 14px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; }
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; }

    /* Botões form */
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
    }
    .btn-cancelar-edit:hover { color: #D1D5DB; }

    /* SEÇÃO */
    .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .sec-titulo { font-size: 13px; font-weight: 700; color: #9CA3AF; }

    /* Despesas lista */
    .desp-lista { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
    .desp-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
      padding: 14px 16px; display: flex; align-items: center;
      gap: 12px; justify-content: space-between;
      transition: border-color 0.15s;
    }
    .desp-card:hover { border-color: rgba(255,255,255,0.12); }
    .desp-desc { font-size: 14px; font-weight: 600; color: #F1F5F9; margin-bottom: 3px; }
    .desp-meta { font-size: 12px; color: #4B5563; }
    .desp-valor { font-size: 14px; font-weight: 700; color: #EF4444; flex-shrink: 0; }
    .desp-acoes { display: flex; gap: 6px; flex-shrink: 0; }
    .btn-editar {
      font-size: 11px; font-weight: 600; color: #3B82F6;
      background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
      border-radius: 7px; padding: 5px 10px; cursor: pointer; font-family: inherit;
    }
    .btn-excluir {
      font-size: 11px; font-weight: 600; color: #6B7280;
      background: none; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 7px; padding: 5px 10px; cursor: pointer; font-family: inherit;
      transition: color 0.15s, border-color 0.15s;
    }
    .btn-excluir:hover { color: #EF4444; border-color: rgba(239,68,68,0.3); }

    /* Vazio */
    .vazio {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
      padding: 32px 24px; text-align: center; margin-bottom: 28px;
    }
    .vazio p:first-child { font-size: 14px; color: #6B7280; margin-bottom: 5px; }
    .vazio p:last-child  { font-size: 12px; color: #374151; }

    /* Por categoria */
    .cat-lista { display: flex; flex-direction: column; gap: 8px; }
    .cat-item {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
      padding: 12px 16px;
    }
    .cat-nome { font-size: 13px; font-weight: 600; color: #D1D5DB; }
    .cat-valor { font-size: 13px; font-weight: 700; color: #EF4444; }
    .cat-bar-wrap { height: 3px; background: rgba(255,255,255,0.05); border-radius: 999px; margin-top: 8px; overflow: hidden; }
    .cat-bar-fill { height: 100%; background: #EF4444; border-radius: 999px; opacity: 0.6; }
  `

  return (
    <div className="pg">
      <style>{css}</style>

      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <Link href="/painel" className="nav-back">← Voltar ao painel</Link>
      </nav>

      <div className="body">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Financeiro</h1>
            <p className="page-sub">Controle entradas, despesas e lucro do seu negócio.</p>
          </div>
          <div className="mes-wrap">
            <span className="mes-label">Mês</span>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="mes-input" />
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="metricas">
          <div className="metrica">
            <div className="metrica-accent" style={{ background: 'linear-gradient(90deg, #22C55E, transparent)' }} />
            <p className="metrica-label">Receita</p>
            <p className="metrica-valor" style={{ color: '#22C55E' }}>R$ {fmtBRL(receita)}</p>
            <p className="metrica-sub">Agendamentos + presenciais</p>
          </div>
          <div className="metrica">
            <div className="metrica-accent" style={{ background: 'linear-gradient(90deg, #EF4444, transparent)' }} />
            <p className="metrica-label">Despesas</p>
            <p className="metrica-valor" style={{ color: '#EF4444' }}>R$ {fmtBRL(totalDespesas)}</p>
            <p className="metrica-sub">Custos no período</p>
          </div>
          <div className="metrica">
            <div className="metrica-accent" style={{ background: `linear-gradient(90deg, ${lucro >= 0 ? '#22C55E' : '#EF4444'}, transparent)` }} />
            <p className="metrica-label">Lucro estimado</p>
            <p className="metrica-valor" style={{ color: lucro >= 0 ? '#22C55E' : '#EF4444' }}>R$ {fmtBRL(lucro)}</p>
            <p className="metrica-sub">Receita menos despesas</p>
          </div>
          <div className="metrica">
            <div className="metrica-accent" style={{ background: 'linear-gradient(90deg, #F59E0B, transparent)' }} />
            <p className="metrica-label">Maior despesa</p>
            {maiorDespesa
              ? <>
                  <p className="metrica-valor" style={{ color: '#F59E0B', fontSize: '16px' }}>{nomeDespesa(maiorDespesa)}</p>
                  <p className="metrica-sub">R$ {fmtBRL(Number(maiorDespesa.valor))}</p>
                </>
              : <p className="metrica-sub" style={{ marginTop: 0 }}>Nenhuma despesa</p>
            }
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="form-card">
          <p className="form-titulo">{editandoId ? '✏️ Editar despesa' : '+ Adicionar despesa'}</p>
          <div className="fields">

            <div>
              <label className="label">Descrição *</label>
              <input type="text" placeholder="Ex: aluguel do salão"
                value={descricao} onChange={e => setDescricao(e.target.value)} className="input" />
            </div>

            <div className="row-2">
              <div>
                <label className="label">Valor *</label>
                <div className="valor-wrap">
                  <span className="valor-prefix">R$</span>
                  <input type="text" inputMode="numeric" placeholder="0,00"
                    value={valorDisplay} onChange={handleValorChange} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Data *</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Categoria *</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="select">
                <option value="">Selecione...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {categoria === 'Outros' && (
                <div className="outro-reveal">
                  <label className="label">Especifique a despesa *</label>
                  <input type="text" placeholder="Ex: manutenção da cadeira"
                    value={outroDesc} onChange={e => setOutroDesc(e.target.value)}
                    className="input" />
                </div>
              )}
            </div>

            {mensagem && (
              <div className={mensagem.includes('Erro') || mensagem.includes('Informe') || mensagem.includes('Selecione') || mensagem.includes('Especifique') ? 'msg-err' : 'msg-ok'}>
                {mensagem}
              </div>
            )}

            <div className="form-btns">
              {editandoId && (
                <button className="btn-cancelar-edit" onClick={resetForm}>Cancelar</button>
              )}
              <button className="btn-salvar" onClick={handleSalvar} disabled={loading}>
                {loading ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Registrar despesa'}
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DESPESAS */}
        <div className="sec-header">
          <p className="sec-titulo">Despesas registradas</p>
          {despesas.length > 0 && (
            <p style={{ fontSize: '12px', color: '#4B5563' }}>{despesas.length} despesa{despesas.length > 1 ? 's' : ''}</p>
          )}
        </div>

        {loadingDados
          ? <div className="vazio"><p>Carregando...</p><p> </p></div>
          : despesas.length === 0
            ? <div className="vazio">
                <p>Nenhuma despesa registrada neste mês.</p>
                <p>Adicione despesas usando o formulário acima.</p>
              </div>
            : <div className="desp-lista">
                {despesas.map(d => (
                  <div key={d.id} className="desp-card">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="desp-desc">{d.descricao}</p>
                      <p className="desp-meta">{nomeDespesa(d)} · {fmtData(d.data)}</p>
                    </div>
                    <p className="desp-valor">R$ {fmtBRL(Number(d.valor))}</p>
                    <div className="desp-acoes">
                      <button className="btn-editar" onClick={() => preencherForm(d)}>Editar</button>
                      <button className="btn-excluir" onClick={() => handleExcluir(d.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
        }

        {/* RESUMO POR CATEGORIA */}
        {catOrdenadas.length > 0 && (
          <>
            <div className="sec-header" style={{ marginTop: '4px' }}>
              <p className="sec-titulo">Despesas por categoria</p>
            </div>
            <div className="cat-lista">
              {catOrdenadas.map(([cat, total]) => (
                <div key={cat} className="cat-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className="cat-nome">{cat}</span>
                      <span className="cat-valor">R$ {fmtBRL(total)}</span>
                    </div>
                    <div className="cat-bar-wrap">
                      <div className="cat-bar-fill"
                        style={{ width: `${Math.round((total / totalDespesas) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
