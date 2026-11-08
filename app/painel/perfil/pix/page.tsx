'use client'
// Painel > Receber por Pix. Disponivel em TODOS os planos (nenhuma checagem de plano de proposito). Grava SOMENTE na tabela pagina_pix do proprio usuario (RLS no banco).
// Nao pede credenciais bancarias, nao acessa conta nenhuma: o usuario cola um Pix Copia e Cola ou informa a chave para gerar o BR Code estatico. Validacao e so de FORMATO.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import IconeMarca from '../../../components/IconeMarca'
import { supabase } from '../../../lib/supabase'
import { caminhoQr } from '../../../lib/qr'
import { TIPOS_CHAVE, mascararChave, montarPixEstatico, validarPayloadPix } from '../../../lib/pix'
import type { TipoChave } from '../../../lib/pix'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;width:100%;background:#08060A}input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:760px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}`

const ROTULO_CHAVE: Record<TipoChave, string> = { aleatoria: 'Chave aleatória (recomendada)', cpf: 'CPF', cnpj: 'CNPJ', telefone: 'Telefone', email: 'E-mail' }
const POSICOES = { topo: -1, fim: 100000 }

type Existente = { titulo: string; descricao: string | null; ativo: boolean; ordem: number; modo: string; payload: string }

export default function ReceberPixPage() {
  const [carregando, setCarregando] = useState(true)
  const [userId, setUserId] = useState('')
  const [tabelaOk, setTabelaOk] = useState(true)
  const [existente, setExistente] = useState<Existente | null>(null)
  const [modo, setModo] = useState<'copia_cola' | 'estatico'>('copia_cola')
  const [colar, setColar] = useState('')
  const [tipoChave, setTipoChave] = useState<TipoChave>('aleatoria')
  const [chave, setChave] = useState('')
  const [nome, setNome] = useState('')
  const [cidade, setCidade] = useState('')
  const [titulo, setTitulo] = useState('Receber por Pix')
  const [descricao, setDescricao] = useState('Escaneie o QR Code ou copie meu Pix.')
  const [ativo, setAtivo] = useState(true)
  const [posicao, setPosicao] = useState<'topo' | 'fim'>('fim')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let vivo = true
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!vivo) return
      if (error || !data.user) { window.location.assign('/login'); return }
      setUserId(data.user.id)
      const [{ data: perfil }, { data: row, error: erroPix }] = await Promise.all([
        supabase.from('perfis').select('nome_negocio, cidade').eq('user_id', data.user.id).maybeSingle(),
        supabase.from('pagina_pix').select('titulo, descricao, ativo, ordem, modo, payload').eq('user_id', data.user.id).maybeSingle(),
      ])
      if (!vivo) return
      if (perfil?.nome_negocio) setNome(perfil.nome_negocio)
      if (perfil?.cidade) setCidade(perfil.cidade)
      if (erroPix) { setTabelaOk(false); setCarregando(false); return }
      if (row) {
        setExistente(row as Existente)
        setTitulo(row.titulo || 'Receber por Pix'); setDescricao(row.descricao || ''); setAtivo(!!row.ativo)
        setPosicao((row.ordem ?? 100000) <= 0 ? 'topo' : 'fim')
        const v = validarPayloadPix(row.payload)
        setModo(row.modo === 'estatico' ? 'estatico' : 'copia_cola')
        setColar(row.payload)
        if (v.ok) { setNome(v.nome); setCidade(v.cidade); if (v.tipoChave !== 'desconhecida') { setTipoChave(v.tipoChave); setChave(v.chave) } }
      }
      setCarregando(false)
    })
    return () => { vivo = false }
  }, [])

  // validacao/geracao ao vivo: SOMENTE de formato
  const r = useMemo(() => {
    if (modo === 'copia_cola') {
      if (!colar.trim()) return null
      const v = validarPayloadPix(colar)
      return v.ok ? { ok: true as const, payload: v.payload, nome: v.nome, cidade: v.cidade, chave: v.chave, tipo: v.tipoChave, avisos: v.avisos } : { ok: false as const, erro: v.erro }
    }
    if (!chave.trim() && !nome.trim() && !cidade.trim()) return null
    const g = montarPixEstatico({ tipoChave, chave, nome, cidade })
    return g.ok ? { ok: true as const, payload: g.payload, nome: g.nome, cidade: g.cidade, chave: g.chave, tipo: g.tipoChave, avisos: [] as string[] } : { ok: false as const, erro: g.erro }
  }, [modo, colar, tipoChave, chave, nome, cidade])
  const qr = useMemo(() => (r && r.ok ? caminhoQr(r.payload) : null), [r])

  async function salvar() {
    if (!r || !r.ok) { setMsg('Corrija os dados do Pix antes de salvar.'); return }
    if (!titulo.trim()) { setMsg('Informe um título.'); return }
    setSalvando(true)
    const { error } = await supabase.from('pagina_pix').upsert(
      { user_id: userId, ativo, titulo: titulo.trim().slice(0, 60), descricao: descricao.trim().slice(0, 140) || null, ordem: POSICOES[posicao], modo, payload: r.payload, nome_recebedor: r.nome, cidade: r.cidade, tipo_chave: r.tipo },
      { onConflict: 'user_id' },
    )
    setSalvando(false)
    setMsg(error ? 'Erro ao salvar: ' + error.message : ativo ? 'Pix salvo e visível na sua MiniPage!' : 'Pix salvo (oculto na MiniPage).')
    if (!error) setExistente({ titulo, descricao, ativo, ordem: POSICOES[posicao], modo, payload: r.payload })
    setTimeout(() => setMsg(''), 4000)
  }
  async function excluir() {
    if (!window.confirm('Excluir seus dados de Pix? O card sai da MiniPage.')) return
    const { error } = await supabase.from('pagina_pix').delete().eq('user_id', userId)
    if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    setExistente(null); setColar(''); setChave(''); setMsg('Dados de Pix excluídos.'); setTimeout(() => setMsg(''), 4000)
  }

  const btn: React.CSSProperties = { minHeight: '46px', borderRadius: '12px', padding: '0 18px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(24,16,27,.9)', color: '#F8F4F7', border: '1px solid #2A1A2F' }
  const abaStyle = (a: boolean): React.CSSProperties => ({ ...btn, flex: 1, minHeight: '42px', ...(a ? { background: G, border: 'none', color: '#fff' } : {}) })
  const privacidade = r && r.ok && r.tipo !== 'aleatoria'

  return (
    <div className="pg" style={{ display: 'flex', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Receber por Pix" />
      <div className="psb-main"><div className="bdy">
        <Link href="/painel/perfil/links" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#B8AAB8', fontSize: '13px', textDecoration: 'none', marginBottom: '14px' }}><ArrowLeft size={14} />Voltar aos links</Link>
        <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#32BCAD', display: 'inline-flex' }}><IconeMarca id="pix" size={24} /></span>Receber por Pix</p>
        <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '8px' }}>Mostre um QR Code Pix e o Pix Copia e Cola direto na sua MiniPage. Gratuito em todos os planos.</p>
        <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '18px' }}>O dinheiro vai direto da conta de quem paga para a sua. A MiniPage Pro <strong style={{ color: '#F8F4F7' }}>não recebe, não retém e não confirma</strong> pagamentos, e nunca pede senha ou acesso ao seu banco.</p>
        {msg && <div className="crd" role="status" style={{ padding: '10px 16px', marginBottom: '14px', fontSize: '13px', color: msg.startsWith('Erro') || msg.startsWith('Corrija') ? '#F87171' : '#34D399' }}>{msg}</div>}

        {carregando ? <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando...</p> : !tabelaOk ? (
          <div className="crd" style={{ padding: '24px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '6px' }}>Recurso ainda não habilitado no banco de dados</p>
            <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6 }}>A tabela do Pix ainda não foi criada. O administrador precisa aplicar o script SQL <code>sql_marcas_pix/02_pagina_pix.sql</code> no Supabase. Seus dados atuais não são afetados.</p>
          </div>
        ) : (
          <div className="crd" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" style={abaStyle(modo === 'copia_cola')} onClick={() => setModo('copia_cola')}>Colar Pix Copia e Cola</button>
              <button type="button" style={abaStyle(modo === 'estatico')} onClick={() => setModo('estatico')}>Gerar com minha chave</button>
            </div>
            {modo === 'copia_cola' ? (
              <div>
                <label className="lbl" htmlFor="px-colar">Código Pix Copia e Cola</label>
                <textarea id="px-colar" className="inp" rows={4} value={colar} onChange={(e) => setColar(e.target.value)} placeholder="No app do seu banco, copie o Pix Copia e Cola da sua chave (sem valor) e cole aqui." style={{ resize: 'vertical', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '12px' }} />
              </div>
            ) : (
              <>
                <div className="fg2">
                  <div><label className="lbl" htmlFor="px-tipo">Tipo da chave</label>
                    <select id="px-tipo" className="inp" value={tipoChave} onChange={(e) => setTipoChave(e.target.value as TipoChave)}>{TIPOS_CHAVE.map((t) => <option key={t} value={t}>{ROTULO_CHAVE[t]}</option>)}</select></div>
                  <div><label className="lbl" htmlFor="px-chave">Chave Pix</label><input id="px-chave" className="inp" value={chave} onChange={(e) => setChave(e.target.value)} autoComplete="off" /></div>
                </div>
                <div className="fg2">
                  <div><label className="lbl" htmlFor="px-nome">Nome do recebedor (até 25)</label><input id="px-nome" className="inp" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} /></div>
                  <div><label className="lbl" htmlFor="px-cid">Cidade (até 15)</label><input id="px-cid" className="inp" value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={40} /></div>
                </div>
                <p style={{ fontSize: '11px', color: '#B8AAB8', lineHeight: 1.5 }}>Use o nome e a cidade como estão no seu banco: quem paga confere o nome antes de confirmar. Nome e cidade são convertidos para MAIÚSCULAS sem acentos (padrão do Pix).</p>
              </>
            )}

            {r && !r.ok && <p role="alert" style={{ fontSize: '13px', color: '#F87171', lineHeight: 1.5 }}>{r.erro}</p>}
            {r && r.ok && qr && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: '#fff', borderRadius: '14px', padding: '8px', width: '150px', aspectRatio: '1', flexShrink: 0 }}>
                  <svg viewBox={`0 0 ${qr.tamanho} ${qr.tamanho}`} role="img" aria-label="Pré-visualização do QR Code Pix" shapeRendering="crispEdges" style={{ display: 'block', width: '100%', height: '100%' }}><rect width={qr.tamanho} height={qr.tamanho} fill="#fff" /><path d={qr.d} fill="#000" /></svg>
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0, fontSize: '13px', color: '#E6DCE6', lineHeight: 1.6 }}>
                  <p style={{ color: '#34D399', fontWeight: 700 }}>Formato válido ✓</p>
                  <p>Recebedor: <strong>{r.nome}</strong> · {r.cidade}</p>
                  <p>Chave: {mascararChave(r.tipo, r.chave)}</p>
                  {r.avisos.map((a, i) => <p key={i} style={{ color: '#FCD34D', fontSize: '12px', marginTop: '4px' }}>{a}</p>)}
                  <p style={{ fontSize: '11px', color: '#B8AAB8', marginTop: '6px' }}>Isso confere só o formato do código. Teste lendo o QR no app do seu banco antes de divulgar.</p>
                </div>
              </div>
            )}
            {privacidade && <p style={{ fontSize: '12px', color: '#FCD34D', lineHeight: 1.5 }}>Atenção: com CPF, CNPJ, telefone ou e-mail, esse dado fica dentro do QR Code e do código copiável, visíveis a quem abrir seu Pix. Se preferir mais privacidade, use uma chave aleatória.</p>}

            <div className="fg2">
              <div><label className="lbl" htmlFor="px-tit">Título do card</label><input id="px-tit" className="inp" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={60} /></div>
              <div><label className="lbl" htmlFor="px-pos">Posição entre os links</label>
                <select id="px-pos" className="inp" value={posicao} onChange={(e) => setPosicao(e.target.value as 'topo' | 'fim')}><option value="topo">No início da lista</option><option value="fim">No fim da lista</option></select></div>
            </div>
            <div><label className="lbl" htmlFor="px-desc">Descrição (opcional)</label><input id="px-desc" className="inp" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={140} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#F8F4F7', cursor: 'pointer' }}><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} style={{ width: '18px', height: '18px' }} />Mostrar o card Pix na minha MiniPage</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" style={{ ...btn, background: G, border: 'none', color: '#fff', flex: '1 1 160px', opacity: salvando ? .6 : 1 }} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              {existente && <button type="button" style={{ ...btn, color: '#F87171' }} onClick={excluir}>Excluir meu Pix</button>}
            </div>
          </div>
        )}
      </div></div>
    </div>
  )
}
