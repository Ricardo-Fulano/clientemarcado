# Fix 1: Salvar indicação no banco ao criar conta com cupom
# Fix 2: Página parceiros busca indicações da tabela correta

import os

if not os.path.exists('app/cadastro/page.tsx'):
    print("ERRO: Execute dentro de clientemarcado!"); import sys; sys.exit(1)

# ── CADASTRO: salvar indicação após signUp ──
with open('app/cadastro/page.tsx', encoding='utf-8') as f:
    c = f.read()

OLD_SIGNUP_BLOCK = """    if (error) setMensagem('Erro: ' + error.message)
    else setMensagem('Conta criada! Verifique seu e-mail para confirmar.')
    setLoading(false)"""

NEW_SIGNUP_BLOCK = """    if (error) {
      setMensagem('Erro: ' + error.message)
    } else {
      // Salvar indicação no banco se cupom foi usado
      if (cupom) {
        try {
          // Buscar parceiro pelo cupom
          const { data: parceiro } = await supabase
            .from('parceiros')
            .select('id,cupom,ativo')
            .eq('cupom', cupom.toUpperCase())
            .eq('ativo', true)
            .single()
          if (parceiro) {
            // Verificar se já existe indicação para este email+cupom
            const { data: existente } = await supabase
              .from('indicacoes_parceiros')
              .select('id')
              .eq('email', email)
              .eq('cupom_codigo', cupom.toUpperCase())
              .single()
            if (!existente) {
              await supabase.from('indicacoes_parceiros').insert({
                parceiro_id: parceiro.id,
                cupom_codigo: cupom.toUpperCase(),
                nome_negocio: nomeNegocio || null,
                nome_responsavel: nomeUsuario || null,
                email: email,
                status: 'cadastrado',
                is_pagante: false,
              })
            }
          }
        } catch(e) { console.log('Indicacao nao salva:', e) }
      }
      setMensagem('Conta criada! Verifique seu e-mail para confirmar.')
    }
    setLoading(false)"""

print("cadastro patch:", OLD_SIGNUP_BLOCK in c)
c = c.replace(OLD_SIGNUP_BLOCK, NEW_SIGNUP_BLOCK, 1)
with open('app/cadastro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("cadastro OK")

# ── PARCEIROS: buscar de indicacoes_parceiros ──
with open('app/painel/parceiros/page.tsx', encoding='utf-8') as f:
    p = f.read()

# Corrigir carregarIndicacoes para usar tabela indicacoes_parceiros
OLD_IND = """  async function carregarIndicacoes() {
    const { data } = await supabase
      .from('indicacoes_parceiros')
      .select('*, parceiros(nome,cupom,comissao_fixa)')
      .order('created_at', { ascending: false })
    setIndicacoes(data || [])
  }"""

NEW_IND = """  async function carregarIndicacoes() {
    const { data } = await supabase
      .from('indicacoes_parceiros')
      .select('*, parceiros(nome,cupom,comissao_fixa)')
      .order('created_at', { ascending: false })
    setIndicacoes(data || [])
  }"""

print("parceiros carregarIndicacoes:", OLD_IND in p)
p = p.replace(OLD_IND, NEW_IND, 1)

# Corrigir contadores KPI para usar campos da nova tabela
OLD_KPI = """  const totalCupons = indicacoes.length
  const totalConvertidos = indicacoes.filter(i => i.is_pagante === true || i.status === 'pagante').length
  const totalPendente = indicacoes.filter(i => i.is_pagante === true && i.comissao_status !== 'paga').reduce((a, i) => {
    const com = i.parceiros?.comissao_fixa || parceiros.find(p => p.cupom === i.cupom_codigo)?.comissao_fixa || 0
    return a + com
  }, 0)
  const totalPaga = indicacoes.filter(i => i.comissao_status === 'paga').reduce((a, i) => {
    const com = i.parceiros?.comissao_fixa || parceiros.find(p => p.cupom === i.cupom_codigo)?.comissao_fixa || 0
    return a + com
  }, 0)"""

NEW_KPI = """  const totalCupons = indicacoes.length
  const totalConvertidos = indicacoes.filter(i => i.is_pagante === true || i.status === 'pagante').length
  const totalPendente = indicacoes.filter(i => i.is_pagante === true && i.comissao_status !== 'paga').reduce((a, i) => {
    const com = i.parceiros?.comissao_fixa || parceiros.find(p => p.cupom === i.cupom_codigo)?.comissao_fixa || 0
    return a + com
  }, 0)
  const totalPaga = indicacoes.filter(i => i.comissao_status === 'paga').reduce((a, i) => {
    const com = i.parceiros?.comissao_fixa || parceiros.find(p => p.cupom === i.cupom_codigo)?.comissao_fixa || 0
    return a + com
  }, 0)"""

print("parceiros KPI:", OLD_KPI in p)
p = p.replace(OLD_KPI, NEW_KPI, 1)

# Corrigir stats por parceiro na lista
OLD_STATS = """                  const clientes = indicacoes.filter(ind => ind.cupom_codigo === p.cupom).length
                  const pagantes = indicacoes.filter(ind => ind.cupom_codigo === p.cupom && ind.is_pagante === true).length
                  const pendente = indicacoes.filter(ind => ind.cupom_codigo === p.cupom && ind.is_pagante === true && ind.comissao_status !== 'paga').length * (p.comissao_fixa || 0)
                  const paga = indicacoes.filter(ind => ind.cupom_codigo === p.cupom && ind.comissao_status === 'paga').length * (p.comissao_fixa || 0)"""

NEW_STATS = """                  const clientes = indicacoes.filter(ind => ind.cupom_codigo === p.cupom).length
                  const pagantes = indicacoes.filter(ind => ind.cupom_codigo === p.cupom && ind.is_pagante === true).length
                  const pendente = indicacoes.filter(ind => ind.cupom_codigo === p.cupom && ind.is_pagante === true && ind.comissao_status !== 'paga').length * (p.comissao_fixa || 0)
                  const paga = indicacoes.filter(ind => ind.cupom_codigo === p.cupom && ind.comissao_status === 'paga').length * (p.comissao_fixa || 0)"""

print("parceiros stats:", OLD_STATS in p)
p = p.replace(OLD_STATS, NEW_STATS, 1)

# Corrigir exibição das indicações (campos da nova tabela)
OLD_IND_ROW = """                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>{ind.nome_negocio || '—'}</p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '1px' }}>{ind.nome_responsavel || ''}</p>
                          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{ind.email}</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.28)', padding: '2px 8px', borderRadius: '6px' }}>{ind.cupom_codigo}</span>
                            {ind.parceiros && <span style={{ fontSize: '11px', color: '#94A3B8' }}>→ {ind.parceiros.nome}</span>}
                            <span className="badge" style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.24)', color: ind.status === 'pagante' ? '#4ADE80' : ind.status === 'cadastrado' ? '#60A5FA' : '#64748B' }}>{ind.status || 'cadastrado'}</span>
                            <span className="badge" style={{ background: ind.is_pagante ? 'rgba(34,197,94,.10)' : 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.16)', color: ind.is_pagante ? '#4ADE80' : '#64748B' }}>Pagante: {ind.is_pagante ? 'Sim' : 'Não'}</span>
                          </div>"""

NEW_IND_ROW = """                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>{ind.nome_negocio || '—'}</p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '1px' }}>{ind.nome_responsavel || ''}</p>
                          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{ind.email}</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.28)', padding: '2px 8px', borderRadius: '6px' }}>{ind.cupom_codigo}</span>
                            {ind.parceiros && <span style={{ fontSize: '11px', color: '#94A3B8' }}>→ {ind.parceiros.nome}</span>}
                            <span className="badge" style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.24)', color: ind.status === 'pagante' ? '#4ADE80' : ind.status === 'cadastrado' ? '#60A5FA' : '#64748B' }}>{ind.status || 'cadastrado'}</span>
                            <span className="badge" style={{ background: ind.is_pagante ? 'rgba(34,197,94,.10)' : 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.16)', color: ind.is_pagante ? '#4ADE80' : '#64748B' }}>Pagante: {ind.is_pagante ? 'Sim' : 'Não'}</span>
                          </div>"""

print("parceiros ind row:", OLD_IND_ROW in p)
p = p.replace(OLD_IND_ROW, NEW_IND_ROW, 1)

# Corrigir botões de ação nas indicações
OLD_BTN_IND = """                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {!ind.is_pagante && (
                            <button className="btn-s" onClick={() => marcarPagante(ind)}>✅ Marcar pagante</button>
                          )}
                          {ind.is_pagante && ind.comissao_status !== 'paga' && (
                            <button className="btn-g" onClick={() => marcarPago(ind)}>💰 Marcar comissão paga</button>
                          )}
                        </div>"""

NEW_BTN_IND = """                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {!ind.is_pagante && (
                            <button className="btn-s" onClick={() => marcarPagante(ind)}>✅ Marcar pagante</button>
                          )}
                          {ind.is_pagante && ind.comissao_status !== 'paga' && (
                            <button className="btn-g" onClick={() => marcarPago(ind)}>💰 Marcar comissão paga</button>
                          )}
                        </div>"""

print("parceiros btn ind:", OLD_BTN_IND in p)
p = p.replace(OLD_BTN_IND, NEW_BTN_IND, 1)

# Corrigir marcarPagante e marcarPago para nova tabela
OLD_PAGAR = """  async function marcarPago(ind: any) {
    if (!window.confirm('Deseja marcar esta comissão como paga?')) return
    await supabase.from('indicacoes_parceiros').update({ comissao_status: 'paga' }).eq('id', ind.id)
    await carregarIndicacoes()
  }
  async function marcarPagante(ind: any) {
    if (!window.confirm('Marcar como cliente pagante?')) return
    await supabase.from('indicacoes_parceiros').update({
      is_pagante: true,
      status: 'pagante',
      comissao_status: 'pendente',
      data_pagamento: new Date().toISOString().split('T')[0],
    }).eq('id', ind.id)
    await carregarIndicacoes()
  }"""

NEW_PAGAR = """  async function marcarPago(ind: any) {
    if (!window.confirm('Deseja marcar esta comissão como paga?')) return
    await supabase.from('indicacoes_parceiros').update({ comissao_status: 'paga' }).eq('id', ind.id)
    await carregarIndicacoes()
  }
  async function marcarPagante(ind: any) {
    if (!window.confirm('Marcar como cliente pagante?')) return
    await supabase.from('indicacoes_parceiros').update({
      is_pagante: true,
      status: 'pagante',
      comissao_status: 'pendente',
      data_pagamento: new Date().toISOString().split('T')[0],
    }).eq('id', ind.id)
    await carregarIndicacoes()
  }"""

print("parceiros pagar:", OLD_PAGAR in p)
p = p.replace(OLD_PAGAR, NEW_PAGAR, 1)

with open('app/painel/parceiros/page.tsx', 'w', encoding='utf-8') as f:
    f.write(p)
print("parceiros OK")
