'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'
import BloqueioPorPlano from '@/app/components/BloqueioPorPlano'
import { obterNomePlano, permiteIntegracoesExternas } from '../../lib/planos'
import { CATALOGO_PROVEDORES, nomeDoProvedor, obterProvedorUI, type ProvedorUI } from '../../lib/integracoes/catalogo'
import type { AcaoConexao, ConexaoVisao, EstadoEfetivo, RespostaComToken, RespostaConexao, RespostaLista } from '../../lib/integracoes/conexoesTipos'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:860px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.btn{border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.12);font-family:inherit}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-p{background:${G};color:#fff}
.btn-s{background:rgba(24,16,27,.92);color:#F8F4F7;border-color:rgba(229,72,184,.28)}
.btn-d{background:rgba(239,68,68,.10);color:#EF4444;border-color:rgba(239,68,68,.25)}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}}
`

const ROTULO_ESTADO: Record<EstadoEfetivo, { texto: string; cor: string; fundo: string }> = {
  teste: { texto: 'Modo teste', cor: '#F59E0B', fundo: 'rgba(245,158,11,.12)' },
  ativa: { texto: 'Ativa', cor: '#22C55E', fundo: 'rgba(34,197,94,.12)' },
  pausada: { texto: 'Pausada', cor: '#B8AAB8', fundo: 'rgba(184,170,184,.12)' },
  suspensa_plano: { texto: 'Suspensa pelo plano', cor: '#EF4444', fundo: 'rgba(239,68,68,.12)' },
  sem_token: { texto: 'Sem token: gere um novo', cor: '#EF4444', fundo: 'rgba(239,68,68,.12)' },
}
const MSG_GENERICA = 'Não foi possível concluir. Tente novamente em instantes.'

// "A", "A e B", "A, B e C": os exemplos citados nos textos vêm do catálogo (nada fixo na tela).
function listaDeNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('')
  return nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1]
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
async function copiarTexto(t: string): Promise<boolean> {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(t); return true } } catch { /* tenta o plano B */ }
  try {
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok
  } catch { return false }
}
function tokenInformadoValido(t: string): boolean { const v = t.trim(); return v.length >= 16 && v.length <= 256 && /^[\x21-\x7E]+$/.test(v) }

async function chamar(metodo: string, caminho: string, corpo?: unknown): Promise<{ ok: boolean; status: number; dados: any }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) { window.location.href = '/login'; return { ok: false, status: 401, dados: null } }
  const res = await fetch(caminho, { method: metodo, headers: { Authorization: 'Bearer ' + token, ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: corpo !== undefined ? JSON.stringify(corpo) : undefined, cache: 'no-store' })
  let dados: any = null
  try { dados = await res.json() } catch { dados = null }
  if (res.status === 401) window.location.href = '/login'
  return { ok: res.ok, status: res.status, dados }
}
const textoErro = (dados: any): string => (dados && typeof dados.error === 'string' ? dados.error : MSG_GENERICA)

function CaixaCopiavel({ rotulo, valor, id, destaque }: { rotulo: string; valor: string; id: string; destaque?: boolean }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() { const ok = await copiarTexto(valor); setCopiado(ok); if (ok) setTimeout(() => setCopiado(false), 2000) }
  return (
    <div style={{ marginBottom: '12px' }}>
      <label className="lbl" htmlFor={id}>{rotulo}</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input id={id} className="inp mono" readOnly value={valor} onFocus={(e) => e.currentTarget.select()} style={{ flex: '1 1 260px', ...(destaque ? { borderColor: 'rgba(245,158,11,.5)' } : {}) }} />
        <button type="button" className="btn btn-s" onClick={copiar} aria-label={'Copiar ' + rotulo}>{copiado ? 'Copiado!' : 'Copiar'}</button>
      </div>
    </div>
  )
}

function PassoAPasso({ ui }: { ui: ProvedorUI }) {
  return (
    <div style={{ marginTop: '14px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '8px' }}>Como configurar na {ui.nome}</p>
      <ol style={{ paddingLeft: '18px', fontSize: '12px', color: '#B8AAB8', lineHeight: 1.7 }}>
        {ui.passos.map((p, i) => <li key={i}>{p}</li>)}
      </ol>
      {ui.eventos.length > 0 && <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.7, marginTop: '8px' }}>Eventos para marcar: <strong style={{ color: '#F8F4F7' }}>{ui.eventos.join(', ')}</strong>.</p>}
      {ui.avisoTeste && <p style={{ fontSize: '11px', color: '#8B7D8B', lineHeight: 1.6, marginTop: '8px' }}>{ui.avisoTeste}</p>}
    </div>
  )
}

function CartaoConexao({ c, permitido, ocupado, onAcao, onRotacionar, onRemover }: {
  c: ConexaoVisao; permitido: boolean; ocupado: boolean
  onAcao: (id: string, acao: AcaoConexao, extra?: Record<string, unknown>) => Promise<boolean>
  onRotacionar: (id: string) => Promise<void>
  onRemover: (id: string) => Promise<void>
}) {
  const [confirmar, setConfirmar] = useState<'ativar' | 'rotacionar' | 'remover' | null>(null)
  const [renomeando, setRenomeando] = useState(false)
  const [rotulo, setRotulo] = useState(c.label ?? '')
  const est = ROTULO_ESTADO[c.efetivo]
  const nome = nomeDoProvedor(c.provider)
  const dados = { fontSize: '12px', color: '#B8AAB8', lineHeight: 1.6 }

  async function salvarNome() { const ok = await onAcao(c.id, 'renomear', { label: rotulo }); if (ok) setRenomeando(false) }
  function pedir(qual: 'ativar' | 'rotacionar' | 'remover') { setConfirmar(qual) }
  async function confirmarAcao() {
    const qual = confirmar; setConfirmar(null)
    if (qual === 'ativar') await onAcao(c.id, 'ativar')
    else if (qual === 'rotacionar') await onRotacionar(c.id)
    else if (qual === 'remover') await onRemover(c.id)
  }

  return (
    <div className="crd" style={{ padding: '18px' }} data-conexao={c.id} data-provider={c.provider} data-estado={c.efetivo}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{nome}{c.label ? <span style={{ color: '#B8AAB8', fontWeight: 600 }}> · {c.label}</span> : null}</p>
        </div>
        <span data-status style={{ fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '3px 10px', color: est.cor, background: est.fundo }}>{est.texto}</span>
      </div>

      {c.efetivo === 'suspensa_plano' && <p role="status" style={{ ...dados, color: '#F59E0B', marginBottom: '8px' }}>Seu plano atual não inclui esta integração, então novas vendas não estão sendo registradas. A conexão e o histórico ficam guardados e tudo volta sozinho se você retornar a um plano com acesso.</p>}
      {c.efetivo === 'teste' && <p style={{ ...dados, marginBottom: '8px' }}>As vendas chegam marcadas como teste e não entram nos totais. Depois de ver o evento de teste chegar, clique em &quot;Ativar vendas reais&quot;.</p>}

      <p style={dados} data-ultimo-evento>{c.last_event_at ? <>Último evento recebido: <strong style={{ color: '#F8F4F7' }}>{fmt(c.last_event_at)}</strong></> : 'Nenhum evento recebido ainda.'}</p>
      {c.dropped_count > 0 && <p style={dados} data-descartados>{c.dropped_count} {c.dropped_count === 1 ? 'evento descartado' : 'eventos descartados'} (conexão pausada ou plano sem acesso){c.last_dropped_at ? <>, o último em {fmt(c.last_dropped_at)}</> : null}.</p>}
      <p style={{ ...dados, marginBottom: '12px' }}>Criada em {fmt(c.created_at)}.</p>

      <CaixaCopiavel rotulo={`URL do webhook (${nome})`} valor={c.url} id={'url-' + c.id} />
      {c.usa_token && <p style={{ ...dados, marginBottom: '4px' }} data-token-info>
        {c.token.existe ? <>Token cifrado e guardado{c.token.rotated_at ? <>, gerado em {fmt(c.token.rotated_at)}</> : null}. Por segurança ele não pode ser exibido de novo; se precisar, gire o token.</> : 'Esta conexão não tem token. Gire o token para gerar um novo.'}
      </p>}
      {c.token.anterior_ate && <p style={{ ...dados, color: '#F59E0B' }} data-token-anterior>O token anterior ainda é aceito até {fmt(c.token.anterior_ate)}, para você atualizar a plataforma sem perder vendas.</p>}

      {renomeando && (
        <div style={{ marginTop: '12px' }}>
          <label className="lbl" htmlFor={'ap-' + c.id}>Apelido</label>
          <input id={'ap-' + c.id} className="inp" value={rotulo} maxLength={60} onChange={(e) => setRotulo(e.target.value)} placeholder="Ex.: Curso de maquiagem" />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="button" className="btn btn-p" disabled={ocupado} onClick={salvarNome}>Salvar apelido</button>
            <button type="button" className="btn btn-s" onClick={() => { setRenomeando(false); setRotulo(c.label ?? '') }}>Cancelar</button>
          </div>
        </div>
      )}

      {confirmar && (
        <div role="alertdialog" aria-label="Confirmação" style={{ marginTop: '12px', border: '1px solid rgba(245,158,11,.35)', borderRadius: '12px', padding: '12px 14px', background: 'rgba(245,158,11,.06)' }}>
          <p style={{ fontSize: '12px', color: '#F8F4F7', lineHeight: 1.6, marginBottom: '10px' }}>
            {confirmar === 'ativar' && 'Depois de ativar, as vendas passam a contar nos totais. Ative só depois de ver o evento de teste chegar.'}
            {confirmar === 'rotacionar' && 'Vamos gerar um novo token. O token atual continua aceito por 24 horas para você atualizar a plataforma sem perder vendas.'}
            {confirmar === 'remover' && 'A conexão deixa de receber vendas e o token é apagado. As vendas já registradas continuam no seu histórico.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className={confirmar === 'remover' ? 'btn btn-d' : 'btn btn-p'} disabled={ocupado} onClick={confirmarAcao}>
              {confirmar === 'ativar' ? 'Sim, ativar' : confirmar === 'rotacionar' ? 'Gerar novo token' : 'Sim, remover'}
            </button>
            <button type="button" className="btn btn-s" onClick={() => setConfirmar(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
        {permitido && c.status === 'test' && <button type="button" className="btn btn-p" disabled={ocupado} onClick={() => pedir('ativar')}>Ativar vendas reais</button>}
        {permitido && c.status === 'paused' && <button type="button" className="btn btn-p" disabled={ocupado} onClick={() => onAcao(c.id, 'reativar')}>Reativar</button>}
        {c.status !== 'paused' && <button type="button" className="btn btn-s" disabled={ocupado} onClick={() => onAcao(c.id, 'pausar')}>Pausar</button>}
        {permitido && c.usa_token && <button type="button" className="btn btn-s" disabled={ocupado} onClick={() => pedir('rotacionar')}>Girar token</button>}
        {c.token.anterior_ate && <button type="button" className="btn btn-s" disabled={ocupado} onClick={() => onAcao(c.id, 'encerrar_token_anterior')}>Encerrar token anterior</button>}
        {!renomeando && <button type="button" className="btn btn-s" disabled={ocupado} onClick={() => setRenomeando(true)}>Renomear</button>}
        <button type="button" className="btn btn-d" disabled={ocupado} onClick={() => pedir('remover')}>Remover</button>
      </div>
    </div>
  )
}

type Etapa = 'lista' | 'escolher' | 'configurar' | 'resultado'
interface Resultado { conexao: ConexaoVisao; token: string | null; origem: 'criada' | 'rotacionada' }

export default function VendasExternas() {
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState('')
  const [dados, setDados] = useState<RespostaLista | null>(null)
  const [perfil, setPerfil] = useState<{ plano_tipo: string | null; status_acesso: string | null } | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)
  const [etapa, setEtapa] = useState<Etapa>('lista')
  const [provedorId, setProvedorId] = useState('')
  const [apelido, setApelido] = useState('')
  const [campos, setCampos] = useState<Record<string, string | boolean>>({})
  const [tokenModo, setTokenModo] = useState<'gerar' | 'informar'>('gerar')
  const [tokenInformado, setTokenInformado] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [criando, setCriando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setErroCarga('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const [{ data: p }, r] = await Promise.all([
      supabase.from('perfis').select('plano_tipo, status_acesso').eq('user_id', user.id).maybeSingle(),
      chamar('GET', '/api/integracoes/conexoes'),
    ])
    setPerfil(p ? { plano_tipo: p.plano_tipo ?? null, status_acesso: p.status_acesso ?? null } : null)
    if (r.ok && r.dados) setDados(r.dados as RespostaLista)
    else if (r.status !== 401) setErroCarga(textoErro(r.dados))
    setCarregando(false)
  }

  function trocar(conexao: ConexaoVisao) {
    setDados((d) => (d ? { ...d, conexoes: d.conexoes.map((x) => (x.id === conexao.id ? conexao : x)) } : d))
  }
  async function acao(id: string, a: AcaoConexao, extra?: Record<string, unknown>): Promise<boolean> {
    setAviso(null); setOcupadoId(id)
    const r = await chamar('PATCH', '/api/integracoes/conexoes/' + id, { acao: a, ...(extra ?? {}) })
    setOcupadoId(null)
    if (!r.ok) { setAviso({ ok: false, texto: textoErro(r.dados) }); return false }
    trocar((r.dados as RespostaConexao).conexao)
    const ok: Record<string, string> = { pausar: 'Conexão pausada.', reativar: 'Conexão reativada.', ativar: 'Vendas reais ativadas.', renomear: 'Apelido salvo.', encerrar_token_anterior: 'Token anterior encerrado.' }
    setAviso({ ok: true, texto: ok[a] })
    return true
  }
  async function rotacionar(id: string) {
    setAviso(null); setOcupadoId(id)
    const r = await chamar('POST', '/api/integracoes/conexoes/' + id + '/rotacionar', {})
    setOcupadoId(null)
    if (!r.ok) { setAviso({ ok: false, texto: textoErro(r.dados) }); return }
    const resp = r.dados as RespostaComToken
    trocar(resp.conexao); setResultado({ conexao: resp.conexao, token: resp.token, origem: 'rotacionada' }); setEtapa('resultado')
  }
  async function remover(id: string) {
    setAviso(null); setOcupadoId(id)
    const r = await chamar('DELETE', '/api/integracoes/conexoes/' + id)
    setOcupadoId(null)
    if (!r.ok) { setAviso({ ok: false, texto: textoErro(r.dados) }); return }
    setDados((d) => (d ? { ...d, conexoes: d.conexoes.filter((x) => x.id !== id) } : d))
    setAviso({ ok: true, texto: 'Conexão removida.' })
  }

  const disponiveis: ProvedorUI[] = CATALOGO_PROVEDORES.filter((p) => !dados || dados.provedores.includes(p.id))
  const ui = obterProvedorUI(provedorId)

  function abrirAdicionar() { setAviso(null); setProvedorId(''); setApelido(''); setCampos({}); setTokenModo('gerar'); setTokenInformado(''); setErroForm(''); setResultado(null); setEtapa('escolher') }
  function escolher(id: string) { setProvedorId(id); setCampos({}); setErroForm(''); setEtapa('configurar') }
  async function gerar() {
    if (!ui) return
    setErroForm('')
    if (ui.usaSegredo && tokenModo === 'informar' && !tokenInformadoValido(tokenInformado)) { setErroForm('O token deve ter de 16 a 256 caracteres, sem espaços.'); return }
    const config: Record<string, unknown> = {}
    for (const c of ui.campos) { const v = campos[c.chave]; if (c.tipo === 'booleano') config[c.chave] = v === true; else if (typeof v === 'string' && v.trim()) config[c.chave] = v.trim() }
    setCriando(true)
    const r = await chamar('POST', '/api/integracoes/conexoes', { provider: ui.id, label: apelido.trim() || undefined, config, ...(ui.usaSegredo && tokenModo === 'informar' ? { token: tokenInformado.trim() } : {}) })
    setCriando(false)
    if (!r.ok) { setErroForm(textoErro(r.dados)); return }
    const resp = r.dados as RespostaComToken
    setDados((d) => (d ? { ...d, conexoes: [...d.conexoes, resp.conexao] } : d))
    setResultado({ conexao: resp.conexao, token: resp.token, origem: 'criada' }); setEtapa('resultado')
  }
  function concluir() { setResultado(null); setTokenInformado(''); setEtapa('lista') }

  if (carregando) return (<div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}><p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p></div>)

  const conexoes = dados?.conexoes ?? []
  const planoPermite = permiteIntegracoesExternas(perfil?.plano_tipo, perfil?.status_acesso)
  const permitido = planoPermite && Boolean(dados?.elegivel)
  const temConexoes = conexoes.length > 0
  const exemplos = listaDeNomes(CATALOGO_PROVEDORES.map((p) => p.nome))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Vendas externas" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '8px' }}>Vendas externas</p>
          <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '18px' }}>Conecte plataformas de venda{exemplos ? `, como ${exemplos},` : ''} para saber quais vendas vieram da sua MiniPage.</p>

          {erroCarga && (
            <div className="crd" role="alert" style={{ padding: '14px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '8px' }}>{erroCarga}</p>
              <button type="button" className="btn btn-s" onClick={() => { setCarregando(true); carregar() }}>Tentar de novo</button>
            </div>
          )}

          <BloqueioPorPlano
            permitido={permitido || temConexoes}
            titulo="Vendas externas está disponível nos planos Loja, Pro e Equipe"
            descricao={`Seu plano atual é ${obterNomePlano(perfil?.plano_tipo)}. Com este recurso você conecta plataformas de venda${exemplos ? ` (${exemplos})` : ''} e vê quais vendas vieram da sua MiniPage.`}
          >
            <div className="crd" style={{ padding: '14px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.7 }}>
                Como funciona: você cria uma conexão aqui, copia a <strong style={{ color: '#F8F4F7' }}>URL</strong> e o <strong style={{ color: '#F8F4F7' }}>token</strong> e cola na plataforma de vendas. Cada venda aprovada, reembolso ou chargeback chega automaticamente.
                <strong style={{ color: '#F8F4F7' }}> Não guardamos dados do comprador</strong> (nome, e-mail, CPF, telefone ou endereço): só o valor, a moeda, o status e de qual item da sua MiniPage a venda veio.
              </p>
            </div>

            {!permitido && temConexoes && (
              <div className="crd" role="status" style={{ padding: '14px 16px', marginBottom: '16px', borderColor: 'rgba(245,158,11,.35)' }}>
                <p style={{ fontSize: '13px', color: '#F59E0B', lineHeight: 1.6 }}>Seu plano atual ({obterNomePlano(perfil?.plano_tipo)}) não inclui Vendas externas. Suas conexões e o histórico ficam guardados, mas novas vendas não são registradas. Você ainda pode pausar ou remover as conexões.</p>
              </div>
            )}

            {aviso && <p role={aviso.ok ? 'status' : 'alert'} style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px', color: aviso.ok ? '#22C55E' : '#EF4444' }}>{aviso.texto}</p>}

            {etapa === 'lista' && permitido && <div style={{ marginBottom: '16px' }}><button type="button" className="btn btn-p" onClick={abrirAdicionar} style={{ padding: '10px 18px', fontSize: '13px' }}>Adicionar integração</button></div>}

            {etapa === 'escolher' && (
              <div className="crd" style={{ padding: '18px', marginBottom: '16px' }} data-etapa="escolher">
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '4px' }}>1. Escolha a plataforma</p>
                <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '12px' }}>De onde vêm as vendas que você quer acompanhar?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px' }}>
                  {disponiveis.map((p) => (
                    <button key={p.id} type="button" onClick={() => escolher(p.id)} data-provedor={p.id} className="crd" style={{ padding: '14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '4px' }}>{p.nome}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#B8AAB8', lineHeight: 1.5 }}>{p.descricao}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '14px' }}><button type="button" className="btn btn-s" onClick={concluir}>Cancelar</button></div>
              </div>
            )}

            {etapa === 'configurar' && ui && (
              <div className="crd" style={{ padding: '18px', marginBottom: '16px' }} data-etapa="configurar">
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '4px' }}>2. Configure a conexão com a {ui.nome}</p>
                <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '14px' }}>{ui.descricao}</p>
                <label className="lbl" htmlFor="f-apelido">Apelido (opcional)</label>
                <input id="f-apelido" className="inp" value={apelido} maxLength={60} onChange={(e) => setApelido(e.target.value)} placeholder="Ex.: Curso de maquiagem" autoComplete="off" />
                <p style={{ fontSize: '11px', color: '#8B7D8B', marginTop: '6px', marginBottom: '12px' }}>Ajuda você a diferenciar conexões da mesma plataforma.</p>
                {ui.campos.map((c) => (
                  <div key={c.chave} style={{ marginBottom: '12px' }}>
                    {c.tipo === 'booleano'
                      ? <label style={{ fontSize: '12px', color: '#F8F4F7', display: 'flex', gap: '8px', alignItems: 'center' }}><input type="checkbox" checked={campos[c.chave] === true} onChange={(e) => setCampos((p) => ({ ...p, [c.chave]: e.target.checked }))} /> {c.rotulo}</label>
                      : <><label className="lbl" htmlFor={'c-' + c.chave}>{c.rotulo}</label><input id={'c-' + c.chave} className="inp" value={typeof campos[c.chave] === 'string' ? (campos[c.chave] as string) : ''} placeholder={c.placeholder} onChange={(e) => setCampos((p) => ({ ...p, [c.chave]: e.target.value }))} /></>}
                    {c.ajuda && <p style={{ fontSize: '11px', color: '#8B7D8B', marginTop: '6px' }}>{c.ajuda}</p>}
                  </div>
                ))}
                {ui.usaSegredo && (
                  <fieldset style={{ border: 'none', marginTop: '4px' }}>
                    <legend className="lbl">{ui.rotuloSegredo}</legend>
                    <label style={{ fontSize: '12px', color: '#F8F4F7', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}><input type="radio" name="tokenModo" checked={tokenModo === 'gerar'} onChange={() => setTokenModo('gerar')} /> Gerar um token seguro para mim (recomendado)</label>
                    <label style={{ fontSize: '12px', color: '#F8F4F7', display: 'flex', gap: '8px', alignItems: 'center' }}><input type="radio" name="tokenModo" checked={tokenModo === 'informar'} onChange={() => setTokenModo('informar')} /> Usar um token que já tenho</label>
                    {tokenModo === 'informar' && <div style={{ marginTop: '8px' }}><label className="lbl" htmlFor="f-token">Seu token</label><input id="f-token" className="inp mono" value={tokenInformado} onChange={(e) => setTokenInformado(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Mínimo de 16 caracteres, sem espaços" /></div>}
                  </fieldset>
                )}
                {erroForm && <p role="alert" style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444', marginTop: '10px' }}>{erroForm}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-p" disabled={criando} onClick={gerar} style={{ padding: '10px 18px', fontSize: '13px' }}>{criando ? 'Gerando...' : 'Gerar conexão'}</button>
                  <button type="button" className="btn btn-s" disabled={criando} onClick={() => setEtapa('escolher')}>Voltar</button>
                </div>
              </div>
            )}

            {etapa === 'resultado' && resultado && (() => {
              const rui = obterProvedorUI(resultado.conexao.provider)
              const nome = nomeDoProvedor(resultado.conexao.provider)
              return (
                <div className="crd" style={{ padding: '18px', marginBottom: '16px', borderColor: 'rgba(34,197,94,.35)' }} data-etapa="resultado">
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '4px' }}>{resultado.origem === 'criada' ? `3. Conexão com a ${nome} criada` : `Novo token gerado para a ${nome}`}</p>
                  <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '14px' }}>{resultado.origem === 'criada' ? 'Copie os dados abaixo e cole na plataforma.' : 'Atualize o token na plataforma. O token anterior continua aceito por 24 horas.'}</p>
                  <CaixaCopiavel rotulo={`URL do webhook (${nome})`} valor={resultado.conexao.url} id="r-url" />
                  {resultado.token !== null && <>
                    <CaixaCopiavel rotulo={rui?.rotuloSegredo ?? 'Token'} valor={resultado.token} id="r-token" destaque />
                    <p role="note" style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600, marginBottom: '8px' }}>Guarde este token agora: por segurança ele não será exibido de novo. Se perder, é só girar o token.</p>
                  </>}
                  {rui && resultado.origem === 'criada' && <PassoAPasso ui={rui} />}
                  <div style={{ marginTop: '16px' }}><button type="button" className="btn btn-p" onClick={concluir} style={{ padding: '10px 18px', fontSize: '13px' }}>Concluir</button></div>
                </div>
              )
            })()}

            {etapa !== 'resultado' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {conexoes.length === 0 && etapa === 'lista' && (
                  <div className="crd" style={{ padding: '22px', textAlign: 'center' }} data-vazio>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '6px' }}>Nenhuma integração ainda</p>
                    <p style={{ fontSize: '12px', color: '#B8AAB8' }}>Clique em &quot;Adicionar integração&quot; para conectar sua primeira plataforma.</p>
                  </div>
                )}
                {conexoes.map((c) => (
                  <CartaoConexao key={c.id} c={c} permitido={permitido} ocupado={ocupadoId === c.id} onAcao={acao} onRotacionar={rotacionar} onRemover={remover} />
                ))}
              </div>
            )}
          </BloqueioPorPlano>
        </div></div>
      </div>
    </div>
  )
}
