'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { obterNomePlano, obterPrecoPlano } from '../lib/planos'

// Interface do painel admin para o endpoint EXISTENTE POST /api/admin/clientes/alterar-plano.
// Este componente NAO decide se uma operacao e segura: ele so mostra o que o backend devolveu e
// respeita executavel / bloqueios / confirmacao. Nao recria nenhuma regra financeira.
//
// Fluxo: escolher plano -> "Verificar alteracao" (dryRun:true, so leitura) -> revisao -> digitar
// CONFIRMAR -> execucao real (dryRun:false + confirmacao do dryRun) -> verificacao final automatica
// (novo dryRun). A "confirmacao" vive SO em memoria (estado do React): nunca vai para storage, log
// ou URL, e e usada UMA unica vez (descartada ao enviar a execucao real).
//
// Autenticacao: somente a sessao atual (supabase.auth.getSession -> Bearer). Nenhum segredo aqui.

const ENDPOINT = '/api/admin/clientes/alterar-plano'
const PALAVRA_CONFIRMACAO = 'CONFIRMAR'
// Opcoes do seletor (so apresentacao). O backend decide o que e permitido; o Free nao e oferecido.
const PLANOS_PAGOS = ['minipage', 'loja', 'essencial', 'equipe'] as const

export type ClienteAlterarPlano = {
  user_id: string
  email?: string | null
  nome_pagina?: string | null
  plano_tipo?: string | null
  plano_nome?: string | null
}

type Fase = 'escolher' | 'verificando' | 'revisao' | 'executando' | 'verificandoFinal' | 'concluido' | 'erroExec'
type Resp = { tipo: 'http'; status: number; corpo: any } | { tipo: 'rede' } | { tipo: 'semSessao' }
type ErroExec = { titulo: string; texto: string; codigo?: string; detalhes?: string[]; critico?: boolean; incerto?: boolean }

const brl = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—')
const centavos = (n: unknown) => Math.round(Number(n) * 100)
function dataBR(iso: unknown): string {
  const m = typeof iso === 'string' ? iso.match(/^(\d{4})-(\d{2})-(\d{2})/) : null
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—'
}
// Nome amigavel SEM usar o fallback de obterNomePlano (que devolve "MiniPage Pro" para qualquer valor desconhecido).
function nomePlano(p: unknown): string {
  if (typeof p !== 'string' || !p) return '—'
  if (p === 'free' || (PLANOS_PAGOS as readonly string[]).includes(p)) return `${obterNomePlano(p)} (${p})`
  return p
}
const OPERACAO: Record<string, string> = { upgrade: 'Upgrade de plano', sincronizacao: 'Sincronização de cobrança', downgrade: 'Downgrade', invalida: 'Operação inválida' }

// Chamada autenticada ao endpoint. Sempre devolve status + corpo (diferente de helpers que descartam o corpo em erros).
async function chamar(corpo: Record<string, unknown>): Promise<Resp> {
  let token: string | undefined
  try {
    const { data } = await supabase.auth.getSession()
    token = data?.session?.access_token
  } catch { token = undefined }
  if (!token) return { tipo: 'semSessao' }   // nada foi enviado
  let res: Response
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(corpo) })
  } catch { return { tipo: 'rede' } }          // a requisicao pode ou nao ter chegado
  const json = await res.json().catch(() => ({}))
  return { tipo: 'http', status: res.status, corpo: json }
}

const CSS = `
.ap-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.ap-modal{background:#18101B;border:1.5px solid #2A1A2F;border-radius:22px;padding:28px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;color:#F8F4F7;font-family:inherit;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.ap-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:4px}
.ap-h{font-size:19px;font-weight:800;margin:0;letter-spacing:-.02em}
.ap-x{background:none;border:none;color:#B8AAB8;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;font-family:inherit}
.ap-x:disabled{opacity:.35;cursor:not-allowed}
.ap-sub{font-size:12px;color:#B8AAB8;margin:0 0 18px;line-height:1.55}
.ap-lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}
.ap-inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:12px;padding:11px 14px;color:#F8F4F7;font-size:14px;outline:none;font-family:inherit;box-sizing:border-box}
.ap-inp:focus{border-color:rgba(139,92,246,.55)}
.ap-inp:disabled{opacity:.6;cursor:not-allowed}
.ap-btn{border-radius:12px;padding:11px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:1px solid #2A1A2F;background:rgba(255,255,255,.08);color:#F8F4F7}
.ap-btn-p{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);border:1px solid rgba(255,255,255,.10);color:#fff}
.ap-btn:disabled{opacity:.45;cursor:not-allowed}
.ap-acoes{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.ap-box{border-radius:14px;padding:12px 14px;border:1px solid #2A1A2F;background:rgba(255,255,255,.03);margin-top:14px;font-size:13px;line-height:1.55}
.ap-ok{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.28);color:#22C55E}
.ap-err{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.30);color:#EF4444}
.ap-warn{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.32);color:#F59E0B}
.ap-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
.ap-k{font-size:10px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px}
.ap-v{font-size:13px;font-weight:600;word-break:break-all}
.ap-tag{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}
.ap-lista{margin:6px 0 0;padding-left:18px}
.ap-mini{font-size:11px;color:#B8AAB8;margin-top:6px}
@media(max-width:520px){.ap-grid{grid-template-columns:1fr}.ap-modal{padding:20px}}
`

function Linha({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><div className="ap-k">{k}</div><div className="ap-v">{v}</div></div>
}
function Pendentes({ lista }: { lista: any[] }) {
  return lista?.length
    ? <ul className="ap-lista">{lista.map((p: any) => <li key={p.id}>{p.id} · {p.status} · {brl(p.valor)} · vence {dataBR(p.vencimento)} · {p.billingType || '—'}</li>)}</ul>
    : <div className="ap-mini">Nenhuma cobrança pendente.</div>
}

// Botao da lista (estilo inline: nao depende de nenhuma classe da pagina).
export function BotaoAlterarPlano({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'rgba(139,92,246,.14)', border: '1px solid rgba(139,92,246,.45)', color: '#C4B5FD', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
      Alterar plano
    </button>
  )
}

export default function AlterarPlanoModal({ cliente, onFechar }: { cliente: ClienteAlterarPlano; onFechar: (alterou: boolean) => void }) {
  const planoInicial = (PLANOS_PAGOS as readonly string[]).includes(cliente.plano_tipo || '') ? (cliente.plano_tipo as string) : ''
  const [plano, setPlano] = useState(planoInicial)
  const [fase, setFase] = useState<Fase>('escolher')
  const [analise, setAnalise] = useState<any>(null)
  const [confirmacao, setConfirmacao] = useState<string | null>(null)   // SO em memoria; uso unico
  const [texto, setTexto] = useState('')
  const [erroVerif, setErroVerif] = useState('')
  const [erroExec, setErroExec] = useState<ErroExec | null>(null)
  const [resultadoExec, setResultadoExec] = useState<any>(null)
  const [analiseFinal, setAnaliseFinal] = useState<any>(null)
  const [erroFinal, setErroFinal] = useState('')

  const ocupadoRef = useRef(false)      // trava contra clique duplo / chamadas concorrentes (alem do estado)
  const alterouRef = useRef(false)      // houve (ou pode ter havido) alteracao -> recarregar a lista ao fechar
  const ativoRef = useRef(true)
  const bloqueado = fase === 'executando' || fase === 'verificandoFinal'
  const bloqueadoRef = useRef(false); bloqueadoRef.current = bloqueado

  function fechar() {
    if (bloqueadoRef.current) return
    setConfirmacao(null); setTexto('')
    onFechar(alterouRef.current)
  }
  const fecharRef = useRef(fechar); fecharRef.current = fechar

  useEffect(() => {
    ativoRef.current = true
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fecharRef.current() }
    document.addEventListener('keydown', onKey)
    return () => { ativoRef.current = false; document.removeEventListener('keydown', onKey) }
  }, [])

  function descartar() {            // descarta qualquer verificacao anterior (incluindo a confirmacao)
    setAnalise(null); setConfirmacao(null); setTexto('')
    setErroVerif(''); setErroExec(null); setResultadoExec(null); setAnaliseFinal(null); setErroFinal('')
  }

  function trocarPlano(novo: string) {
    if (ocupadoRef.current || bloqueadoRef.current) return
    setPlano(novo); descartar(); setFase('escolher')
  }

  // ---------- dryRun (so leitura) ----------
  async function verificar() {
    if (ocupadoRef.current || !plano) return
    ocupadoRef.current = true
    descartar(); setFase('verificando')
    const r = await chamar({ userId: cliente.user_id, novoPlano: plano, dryRun: true })
    ocupadoRef.current = false
    if (!ativoRef.current) return
    if (r.tipo === 'semSessao') { setErroVerif('Sessão expirada. Recarregue a página e entre novamente.'); setFase('escolher'); return }
    if (r.tipo === 'rede') { setErroVerif('Falha de conexão ao verificar. Nada foi alterado.'); setFase('escolher'); return }
    if (r.status === 200 && r.corpo?.dryRun === true) {
      const { confirmacao: conf, ...resto } = r.corpo
      setAnalise(resto)
      setConfirmacao(typeof conf === 'string' && conf ? conf : null)
      setFase('revisao')
      return
    }
    const cod = r.corpo?.codigo ? ` (${r.corpo.codigo})` : ''
    setErroVerif(r.status === 401 ? 'Sessão expirada. Recarregue a página e entre novamente.' : r.status === 403 ? 'Acesso não autorizado.' : `${r.corpo?.error || 'Não foi possível verificar.'}${cod}`)
    setFase('escolher')
  }

  // ---------- verificacao final (dryRun depois do sucesso, ou nova leitura do estado) ----------
  async function verificarFinal() {
    const r = await chamar({ userId: cliente.user_id, novoPlano: plano, dryRun: true })
    if (!ativoRef.current) return
    if (r.tipo === 'http' && r.status === 200 && r.corpo?.dryRun === true) {
      const { confirmacao: _descartada, ...resto } = r.corpo   // a confirmacao da verificacao final nunca e guardada
      void _descartada
      setAnaliseFinal(resto); setErroFinal('')
    } else {
      setAnaliseFinal(null)
      setErroFinal(r.tipo === 'semSessao' ? 'Sessão expirada; não foi possível reverificar.' : r.tipo === 'rede' ? 'Falha de conexão ao reverificar.' : (r.corpo?.error || 'Não foi possível reverificar.'))
    }
  }
  async function reverificarAposSucesso() {
    if (ocupadoRef.current) return
    ocupadoRef.current = true
    await verificarFinal()
    ocupadoRef.current = false
  }

  // ---------- execucao real ----------
  const podeConfirmar = fase === 'revisao' && analise?.executavel === true && Array.isArray(analise?.bloqueios) && analise.bloqueios.length === 0 && typeof confirmacao === 'string' && confirmacao.length > 0
  const palavraOk = texto === PALAVRA_CONFIRMACAO

  async function executar() {
    if (ocupadoRef.current || !podeConfirmar || !palavraOk) return
    const conf = confirmacao as string
    ocupadoRef.current = true
    setConfirmacao(null)             // uso unico: nunca pode ser reenviada
    setTexto(''); setErroExec(null); setFase('executando')
    const r = await chamar({ userId: cliente.user_id, novoPlano: plano, dryRun: false, confirmacao: conf })
    if (!ativoRef.current) { ocupadoRef.current = false; return }

    const falhar = (e: ErroExec) => { setErroExec(e); setFase('erroExec'); ocupadoRef.current = false }
    const incerto = (motivo: string) => {
      alterouRef.current = true      // pode ter sido aplicada: a lista sera recarregada ao fechar
      falhar({ titulo: 'Não foi possível confirmar se a alteração foi aplicada', texto: `${motivo} A operação PODE ter sido aplicada no Asaas. NÃO repita. Use “Verificar estado atual” para ler a situação real.`, incerto: true })
    }

    if (r.tipo === 'semSessao') return falhar({ titulo: 'Sessão expirada', texto: 'Nada foi enviado nem alterado. Recarregue a página, entre novamente e refaça a verificação.' })
    if (r.tipo === 'rede') return incerto('A conexão falhou durante a execução.')

    const c = r.corpo || {}
    if (r.status >= 200 && r.status < 300) {
      if (c.ok !== true) return incerto('O servidor respondeu de forma inesperada.')
      alterouRef.current = true
      setResultadoExec(c); setFase('verificandoFinal')
      await verificarFinal()          // verificacao final automatica (somente leitura)
      if (!ativoRef.current) { ocupadoRef.current = false; return }
      setFase('concluido'); ocupadoRef.current = false
      return
    }
    if (r.status >= 500 && !c.codigo) return incerto(`O servidor respondeu com erro ${r.status} sem detalhes.`)

    const codigo: string | undefined = typeof c.codigo === 'string' ? c.codigo : undefined
    const base = c.error || 'A operação não foi concluída.'
    if (r.status === 401) return falhar({ titulo: 'Sessão expirada', texto: 'Recarregue a página e entre novamente. Nada foi alterado.', codigo })
    if (r.status === 403) return falhar({ titulo: 'Acesso não autorizado', texto: 'Esta conta não tem permissão para alterar planos. Nada foi alterado.', codigo })
    if (codigo === 'ESTADO_MUDOU') return falhar({ titulo: 'O estado mudou desde a verificação', texto: 'Nada foi alterado. Verifique novamente para ver a situação atual.', codigo })
    if (codigo === 'NAO_EXECUTAVEL') return falhar({ titulo: 'A operação não pode ser executada', texto: 'Nada foi alterado.', codigo, detalhes: Array.isArray(c.bloqueios) ? c.bloqueios.map(String) : undefined })
    if (codigo === 'ASAAS_RECUSOU') return falhar({ titulo: 'O Asaas recusou a alteração', texto: 'Nada foi alterado.', codigo, detalhes: [c.detalhe ? String(c.detalhe) : '', c.asaasStatus ? `HTTP ${c.asaasStatus} do Asaas` : ''].filter(Boolean) })
    if (codigo === 'VERIFICACAO_FALHOU_REVERTIDO') return falhar({ titulo: 'A verificação após a alteração falhou', texto: 'O valor anterior foi restaurado. Nada foi alterado no banco.', codigo, detalhes: c.motivo ? [String(c.motivo)] : undefined })
    if (codigo === 'VERIFICACAO_FALHOU_SEM_REVERSAO') {
      alterouRef.current = true
      return falhar({ titulo: 'ATENÇÃO: valor alterado e NÃO revertido', texto: `O valor da assinatura ${analise?.gatewaySubscriptionId || ''} pode estar diferente do esperado no Asaas. A correção precisa ser feita manualmente. Use “Verificar estado atual” para ler a situação.`, codigo, critico: true, detalhes: c.motivo ? [String(c.motivo)] : undefined })
    }
    if (codigo === 'FALHA_AO_GRAVAR_PLANO') return falhar({ titulo: 'Não foi possível gravar o plano', texto: `${base} ${c.valorRestaurado === true ? 'O valor do Asaas foi restaurado.' : 'Confira o valor da assinatura no Asaas.'}`, codigo, critico: c.valorRestaurado !== true })
    return falhar({ titulo: 'A operação não foi concluída', texto: base, codigo })
  }

  const nomeCliente = cliente.nome_pagina || cliente.email || 'Cliente'
  const a = analise
  const af = analiseFinal
  const sincronizado = !!af && centavos(af.valorAtualAsaas) === centavos(af.precoEsperado) && Array.isArray(af.cobrancasPendentes) && af.cobrancasPendentes.every((p: any) => centavos(p.valor) === centavos(af.precoEsperado))

  return (
    <div className="ap-bg" onClick={() => fechar()}>
      <style>{CSS}</style>
      <div className="ap-modal" role="dialog" aria-modal="true" aria-labelledby="ap-titulo" onClick={e => e.stopPropagation()}>
        <div className="ap-topo">
          <h2 className="ap-h" id="ap-titulo">Alterar plano</h2>
          <button type="button" className="ap-x" onClick={() => fechar()} disabled={bloqueado} aria-label="Fechar">×</button>
        </div>
        <p className="ap-sub">
          <strong style={{ color: '#F8F4F7' }}>{nomeCliente}</strong>{cliente.email && cliente.nome_pagina ? ` · ${cliente.email}` : ''}<br />
          Plano atual: {cliente.plano_nome || '—'}
        </p>

        {/* ===== escolher / verificar ===== */}
        {(fase === 'escolher' || fase === 'verificando' || fase === 'revisao') && (
          <div>
            <label className="ap-lbl" htmlFor="ap-plano">Novo plano</label>
            <select id="ap-plano" className="ap-inp" value={plano} onChange={e => trocarPlano(e.target.value)} disabled={fase === 'verificando'}>
              <option value="">Selecione…</option>
              {PLANOS_PAGOS.map(p => <option key={p} value={p}>{obterNomePlano(p)} — {brl(obterPrecoPlano(p))}/mês</option>)}
            </select>
            <p className="ap-mini">A verificação consulta o sistema e o Asaas e não altera nada. O sistema decide se a operação é permitida.</p>
            {erroVerif && <div className="ap-box ap-err">{erroVerif}</div>}
            <div className="ap-acoes">
              <button type="button" className="ap-btn ap-btn-p" onClick={verificar} disabled={!plano || fase === 'verificando'}>
                {fase === 'verificando' ? 'Verificando…' : 'Verificar alteração'}
              </button>
              <button type="button" className="ap-btn" onClick={() => fechar()}>Cancelar</button>
            </div>
          </div>
        )}

        {/* ===== revisao do dryRun ===== */}
        {fase === 'revisao' && a && (
          <div>
            <div className="ap-box">
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Resultado da verificação</div>
              <div className="ap-grid">
                <Linha k="Operação" v={<>{OPERACAO[a.operacao] || String(a.operacao)}{a.recuperacao ? ' (recuperação: o Asaas já está no valor novo)' : ''}</>} />
                <Linha k="Executável" v={<span className={`ap-tag ${a.executavel === true ? 'ap-ok' : 'ap-err'}`}>{a.executavel === true ? 'Sim' : 'Não'}</span>} />
                <Linha k="Plano atual" v={nomePlano(a.planoAtual)} />
                <Linha k="Plano de destino" v={nomePlano(a.planoDestino)} />
                <Linha k="Valor esperado" v={brl(a.precoEsperado)} />
                <Linha k="Valor atual no Asaas" v={brl(a.valorAtualAsaas)} />
                <Linha k="Forma de pagamento" v={a.billingType || '—'} />
                <Linha k="Ciclo (perfil / Asaas)" v={`${a.cicloPerfil || '—'} / ${a.cicloAsaas || '—'}`} />
                <Linha k="Próximo vencimento" v={dataBR(a.proximoVencimento)} />
                <Linha k="Status do acesso" v={a.statusAcesso || '—'} />
                <Linha k="Ambiente" v={<span className={`ap-tag ${a.ambiente === 'production' ? 'ap-warn' : ''}`}>{a.ambiente === 'production' ? 'PRODUÇÃO' : String(a.ambiente || '—').toUpperCase()}</span>} />
                <Linha k="Ação no Asaas" v={a.acaoNoAsaas === 'put_valor' ? 'Atualizar o valor da assinatura' : a.acaoNoAsaas === 'nenhuma' ? 'Nenhuma alteração' : String(a.acaoNoAsaas || '—')} />
                <Linha k="Atualiza cobranças pendentes" v={a.enviaraUpdatePendingPayments ? 'Sim' : 'Não'} />
                <Linha k="Grava no banco" v={a.escreveNoBanco ? 'Sim (plano do cliente)' : 'Não'} />
                <Linha k="Assinatura" v={a.gatewaySubscriptionId || '—'} />
                <Linha k="Cliente no Asaas" v={a.gatewayCustomerId || '—'} />
              </div>
              <div className="ap-k" style={{ marginTop: 12 }}>Cobranças pendentes</div>
              <Pendentes lista={a.cobrancasPendentes} />
            </div>

            {Array.isArray(a.bloqueios) && a.bloqueios.length > 0 && (
              <div className="ap-box ap-err">
                <strong>Bloqueios informados pelo sistema</strong>
                <ul className="ap-lista">{a.bloqueios.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>
                <div className="ap-mini" style={{ color: '#B8AAB8' }}>Nada pode ser aplicado enquanto houver bloqueios.</div>
              </div>
            )}

            {a.executavel === true && Array.isArray(a.bloqueios) && a.bloqueios.length === 0 && !confirmacao && (
              <div className="ap-box ap-warn">O sistema não devolveu a confirmação. Refaça a verificação.</div>
            )}

            {podeConfirmar && (
              <div className="ap-box ap-warn">
                <strong>Esta ação altera a cobrança no Asaas.</strong>
                <div style={{ marginTop: 6, color: '#F8F4F7' }}>
                  {a.acaoNoAsaas === 'put_valor' ? <>Valor da assinatura: <strong>{brl(a.valorAtualAsaas)}</strong> → <strong>{brl(a.precoEsperado)}</strong>.</> : <>O Asaas já está no valor esperado; será apenas completado o registro do plano.</>}
                </div>
                <label className="ap-lbl" htmlFor="ap-confirmar" style={{ marginTop: 12 }}>Digite {PALAVRA_CONFIRMACAO} para aplicar</label>
                <input
                  id="ap-confirmar" className="ap-inp" value={texto} autoComplete="off" spellCheck={false}
                  placeholder={PALAVRA_CONFIRMACAO}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') executar() }}
                />
                <div className="ap-acoes">
                  <button type="button" className="ap-btn ap-btn-p" onClick={executar} disabled={!palavraOk}>Confirmar e aplicar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== executando / verificacao final ===== */}
        {(fase === 'executando' || fase === 'verificandoFinal') && (
          <div className="ap-box ap-warn" role="status">
            <strong>{fase === 'executando' ? 'Aplicando no Asaas…' : 'Verificando o estado final…'}</strong>
            <div className="ap-mini" style={{ color: '#F8F4F7' }}>Não feche esta janela.</div>
          </div>
        )}

        {/* ===== erro da execucao ===== */}
        {fase === 'erroExec' && erroExec && (
          <div>
            <div className={`ap-box ${erroExec.incerto && !erroExec.critico ? 'ap-warn' : 'ap-err'}`} role="alert">
              <strong>{erroExec.titulo}</strong>
              <div style={{ marginTop: 6, color: '#F8F4F7' }}>{erroExec.texto}</div>
              {erroExec.detalhes && erroExec.detalhes.length > 0 && <ul className="ap-lista" style={{ color: '#F8F4F7' }}>{erroExec.detalhes.map((d, i) => <li key={i}>{d}</li>)}</ul>}
              {erroExec.codigo && <div className="ap-mini">Código: {erroExec.codigo}</div>}
            </div>
            <div className="ap-acoes">
              <button type="button" className="ap-btn ap-btn-p" onClick={verificar} disabled={!plano}>Verificar estado atual</button>
            </div>
          </div>
        )}

        {/* ===== concluido ===== */}
        {fase === 'concluido' && (
          <div>
            <div className="ap-box ap-ok" role="status">
              <strong>Alteração aplicada.</strong>
              <div style={{ marginTop: 6, color: '#F8F4F7' }}>
                {resultadoExec?.operacao === 'upgrade' ? 'Upgrade' : 'Sincronização'}: {brl(resultadoExec?.valorAnterior)} → {brl(resultadoExec?.valorNovo)}.
                {' '}Atualizou cobranças pendentes: {resultadoExec?.enviouUpdatePendingPayments ? 'sim' : 'não'}.
                {' '}Gravou no banco: {resultadoExec?.escreveuNoBanco ? 'sim' : 'não'}.
              </div>
            </div>
            <div className="ap-box">
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Verificação final</div>
              {erroFinal && <div className="ap-box ap-warn" style={{ marginTop: 0 }}>{erroFinal}</div>}
              {af && (
                <>
                  <div className="ap-grid">
                    <Linha k="Valor atual no Asaas" v={brl(af.valorAtualAsaas)} />
                    <Linha k="Valor esperado" v={brl(af.precoEsperado)} />
                    <Linha k="Plano atual" v={nomePlano(af.planoAtual)} />
                    <Linha k="Próximo vencimento" v={dataBR(af.proximoVencimento)} />
                    <Linha k="Forma de pagamento" v={af.billingType || '—'} />
                    <Linha k="Valores conferem" v={<span className={`ap-tag ${sincronizado ? 'ap-ok' : 'ap-warn'}`}>{sincronizado ? 'Sim' : 'Revisar'}</span>} />
                  </div>
                  <div className="ap-k" style={{ marginTop: 12 }}>Cobranças pendentes</div>
                  <Pendentes lista={af.cobrancasPendentes} />
                  {Array.isArray(af.bloqueios) && af.bloqueios.length > 0 && <div className="ap-mini">Sistema: {af.bloqueios.join(' · ')}</div>}
                </>
              )}
              {!af && erroFinal && (
                <div className="ap-acoes"><button type="button" className="ap-btn" onClick={reverificarAposSucesso}>Verificar estado atual</button></div>
              )}
            </div>
            <div className="ap-acoes"><button type="button" className="ap-btn ap-btn-p" onClick={() => fechar()}>Fechar</button></div>
          </div>
        )}
      </div>
    </div>
  )
}
