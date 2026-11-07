'use client'
// Cartao digital: 2 paineis (Meu cartao | Meu QR Code) em rolagem horizontal nativa com scroll-snap (gesto no Android/iPhone sem JS pesado),
// botoes como alternativa aos gestos, respeito a "reduzir movimento", instalacao na tela inicial e compartilhamento.
// Todo texto vem como TEXTO React (escape automatico); nenhum HTML dinamico.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { copiar } from '../../lib/cartao-cliente'

export interface CartaoProps {
  nome: string
  fotoUrl: string | null
  slug: string
  enderecoCurto: string
  urlPublica: string
  urlPainel: string
  urlCompartilhar: string
  urlQr: string
  qrCaminho: string
  qrTamanho: number
  vcfHref: string
  ehFree: boolean
  cadastroUrl: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#08060A;color:#F8F4F7;overflow-x:hidden;-webkit-text-size-adjust:100%}
.cd-root{min-height:100dvh;background:radial-gradient(circle at 15% 0%,rgba(139,92,246,.28),transparent 42%),radial-gradient(circle at 90% 8%,rgba(236,72,153,.20),transparent 38%),linear-gradient(160deg,#08060A 0%,#120A14 55%,#08060A 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.cd-pager{display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;min-height:100dvh}
.cd-pager::-webkit-scrollbar{display:none}
.cd-panel{flex:0 0 100%;scroll-snap-align:center;scroll-snap-stop:always;min-height:100dvh;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:max(28px,env(safe-area-inset-top)) 22px max(28px,env(safe-area-inset-bottom));text-align:center;gap:14px}
.cd-avatar{width:112px;height:112px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);box-shadow:0 14px 44px rgba(139,92,246,.40);flex-shrink:0}
.cd-avatar-in{width:100%;height:100%;border-radius:50%;object-fit:cover;background:#18101B;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;color:#F8F4F7;overflow:hidden}
.cd-nome{font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.15;overflow-wrap:anywhere;max-width:420px}
.cd-desc{font-size:15px;line-height:1.5;color:#B8AAB8;max-width:380px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cd-url{font-size:13px;color:#C4B5FD;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.30);border-radius:999px;padding:6px 14px;overflow-wrap:anywhere}
.cd-btns{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;margin-top:6px}
.cd-row{display:flex;gap:10px}
.cd-btn{flex:1;min-height:54px;border-radius:14px;border:1px solid #2A1A2F;background:rgba(24,16,27,.92);color:#F8F4F7;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;padding:0 14px;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,border-color .12s ease}
.cd-btn:active{transform:scale(.98)}
.cd-row .cd-btn{font-size:14px;padding:0 10px;text-align:center;line-height:1.2}
.cd-instalar{border-style:dashed;border-color:rgba(196,181,253,.55);color:#E9D5FF;background:rgba(139,92,246,.10)}
.cd-sublinks{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.cd-btn:focus-visible,.cd-link:focus-visible,.cd-x:focus-visible{outline:3px solid #C4B5FD;outline-offset:2px}
.cd-primario{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);border-color:transparent;box-shadow:0 10px 30px rgba(236,72,153,.32)}
.cd-dica{font-size:12px;color:#B8AAB8;display:flex;align-items:center;gap:6px}
.cd-seta{display:inline-block;animation:cd-nudge 1.6s ease-in-out infinite}
@keyframes cd-nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
.cd-qrbox{background:#fff;border-radius:22px;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.5);width:min(78vw,360px);aspect-ratio:1}
.cd-qrbox svg{display:block;width:100%;height:100%}
.cd-qrtxt{font-size:17px;font-weight:700}
.cd-sub{font-size:14px;color:#B8AAB8}
.cd-link{color:#C4B5FD;font-size:13px;font-weight:600;text-decoration:none;background:none;border:none;font-family:inherit;cursor:pointer;padding:8px}
.cd-dots{position:fixed;left:0;right:0;bottom:max(10px,env(safe-area-inset-bottom));display:flex;justify-content:center;gap:8px;pointer-events:none;z-index:5}
.cd-dot{width:8px;height:8px;border-radius:50%;background:rgba(248,244,247,.28);transition:background .2s,width .2s}
.cd-dot[aria-current="true"]{background:#EC4899;width:22px;border-radius:999px}
.cd-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);background:#18101B;border:1px solid #2A1A2F;color:#F8F4F7;border-radius:12px;padding:10px 16px;font-size:14px;z-index:20;max-width:90vw}
.cd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.66);z-index:30;display:flex;align-items:flex-end;justify-content:center}
.cd-sheet{width:100%;max-width:480px;background:#14091A;border:1px solid #2A1A2F;border-radius:22px 22px 0 0;padding:22px 20px max(24px,env(safe-area-inset-bottom));max-height:86dvh;overflow-y:auto;text-align:left}
.cd-sheet h2{font-size:18px;margin-bottom:8px}
.cd-sheet ol{margin:12px 0 14px 20px;line-height:1.7;font-size:15px;color:#E6DCE6}
.cd-nota{font-size:12px;color:#B8AAB8;line-height:1.5;margin-top:6px}
.cd-x{margin-top:14px;width:100%}
.cd-cta{font-size:12px;color:#B8AAB8;text-decoration:none;margin-top:6px}
.cd-cta strong{color:#EC4899}
@media (prefers-reduced-motion:reduce){.cd-pager{scroll-behavior:auto}.cd-seta{animation:none}.cd-btn,.cd-dot{transition:none}}
@media (max-height:640px){.cd-panel{justify-content:flex-start}.cd-avatar{width:84px;height:84px}}
`

const subscribeNoop = () => () => {}
/** ambiente do navegador como texto estavel (sem setState em efeito; no servidor devolve 'srv' para nao gerar divergencia de hidratacao) */
function lerAmbiente(): string {
  const ua = navigator.userAgent || ''
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const std = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  return `${ios ? 'ios' : 'outro'}|${std ? 'std' : 'nav'}`
}

export default function CartaoApp(p: CartaoProps) {
  const pagerRef = useRef<HTMLDivElement>(null)
  const [ativo, setAtivo] = useState(0)
  const [aviso, setAviso] = useState('')
  const [instalarAberto, setInstalarAberto] = useState(false)
  const [instalarFechado, setInstalarFechado] = useState(false)
  const [promptInstalar, setPromptInstalar] = useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = useState(false)
  const ambiente = useSyncExternalStore(subscribeNoop, lerAmbiente, () => 'srv')
  const ehIos = ambiente.startsWith('ios')
  const jaInstalado = ambiente.endsWith('std') || instalado
  // o painel abre o cartao com ?instalar=1 para ja mostrar o passo a passo (lido sem setState em efeito)
  const querInstalar = useSyncExternalStore(subscribeNoop, () => new URLSearchParams(window.location.search).get('instalar') === '1', () => false)
  const sheetAberta = instalarAberto || (querInstalar && !instalarFechado && !jaInstalado)
  const fecharSheet = () => { setInstalarAberto(false); setInstalarFechado(true) }

  const reduzirMovimento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const irPara = useCallback((i: number) => {
    const el = pagerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: reduzirMovimento() ? 'auto' : 'smooth' })
  }, [])

  // painel inicial via ?painel=qr (atalho "Meu QR Code" do icone no Android)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('painel') === 'qr') {
      const el = pagerRef.current
      if (el) el.scrollTo({ left: el.clientWidth, behavior: 'auto' })
    }
  }, [])

  // painel ativo (para pontos, foco e inert), atualizado so por evento de rolagem
  const aoRolar = useCallback(() => {
    const el = pagerRef.current
    if (el && el.clientWidth > 0) setAtivo(Math.round(el.scrollLeft / el.clientWidth))
  }, [])

  useEffect(() => {
    const antes = (e: Event) => { e.preventDefault(); setPromptInstalar(e as BeforeInstallPromptEvent) }
    const depois = () => { setInstalado(true); setPromptInstalar(null); setInstalarAberto(false); setInstalarFechado(true) }
    window.addEventListener('beforeinstallprompt', antes)
    window.addEventListener('appinstalled', depois)
    return () => { window.removeEventListener('beforeinstallprompt', antes); window.removeEventListener('appinstalled', depois) }
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2600)
    return () => clearTimeout(t)
  }, [aviso])

  useEffect(() => {
    if (!sheetAberta) return
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fecharSheet() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [sheetAberta])

  async function compartilhar() {
    const dados = { title: p.nome, text: `Conheça ${p.nome} na MiniPage Pro`, url: p.urlCompartilhar }
    if (typeof navigator.share === 'function') {
      try { await navigator.share(dados); return } catch (e) { if ((e as Error).name === 'AbortError') return }
    }
    setAviso((await copiar(p.urlCompartilhar)) ? 'Link copiado!' : 'Não foi possível copiar. Copie o link manualmente.')
  }
  async function copiarLink() {
    setAviso((await copiar(p.urlCompartilhar)) ? 'Link copiado!' : 'Não foi possível copiar. Copie o link manualmente.')
  }
  async function instalar() {
    if (promptInstalar) {
      await promptInstalar.prompt()
      const r = await promptInstalar.userChoice
      setPromptInstalar(null)
      if (r.outcome === 'accepted') fecharSheet()
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${p.nome}: ${p.urlCompartilhar}`)}`
  const inicial = (p.nome.trim()[0] || 'M').toUpperCase()

  return (
    <div className="cd-root">
      <style>{CSS}</style>
      <div ref={pagerRef} className="cd-pager" onScroll={aoRolar}>
        {/* ----------------------------------------------------------- TELA 1: MEU CARTAO */}
        <section className="cd-panel" aria-label="Meu cartão" inert={ativo !== 0}>
          <div className="cd-avatar">
            {p.fotoUrl ? <img className="cd-avatar-in" src={p.fotoUrl} alt="" referrerPolicy="no-referrer" /> : <div className="cd-avatar-in" aria-hidden="true">{inicial}</div>}
          </div>
          <h1 className="cd-nome">{p.nome}</h1>
          <p className="cd-desc">Seu cartão de visitas digital</p>
          <div className="cd-btns">
            <button type="button" className="cd-btn cd-primario" onClick={() => irPara(1)}>Mostrar meu QR Code</button>
            <button type="button" className="cd-btn" onClick={compartilhar}>Compartilhar MiniPage</button>
            <div className="cd-row">
              <a className="cd-btn" href={p.urlPublica}>Ver minha MiniPage</a>
              <a className="cd-btn" href={p.urlPainel} rel="noopener noreferrer">Entrar no painel</a>
            </div>
            {!jaInstalado && ambiente !== 'srv' && (
              <button type="button" className="cd-btn cd-instalar" onClick={() => setInstalarAberto(true)}>Adicionar à tela inicial</button>
            )}
          </div>
          <p className="cd-dica" aria-hidden="true">Deslize para o lado para mostrar o QR Code <span className="cd-seta">→</span></p>
          {p.ehFree && (
            <a className="cd-cta" href={p.cadastroUrl}>Crie sua MiniPage <strong>grátis</strong></a>
          )}
        </section>

        {/* ----------------------------------------------------------- TELA 2: MEU QR CODE */}
        <section className="cd-panel" aria-label="Meu QR Code" inert={ativo !== 1}>
          <p className="cd-qrtxt">{p.nome}</p>
          <div className="cd-qrbox">
            <svg viewBox={`0 0 ${p.qrTamanho} ${p.qrTamanho}`} role="img" aria-label={`QR Code da MiniPage de ${p.nome}`} shapeRendering="crispEdges">
              <rect width={p.qrTamanho} height={p.qrTamanho} fill="#ffffff" />
              <path d={p.qrCaminho} fill="#000000" />
            </svg>
          </div>
          <p className="cd-qrtxt">Aponte a câmera e acesse minha MiniPage</p>
          <p className="cd-sub">Escaneie o QR Code para acessar meus contatos e links</p>
          <div className="cd-btns">
            <button type="button" className="cd-btn cd-primario" onClick={compartilhar}>Compartilhar link</button>
            <div className="cd-row">
              <button type="button" className="cd-btn" onClick={copiarLink}>Copiar link</button>
              <a className="cd-btn" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
          <div className="cd-sublinks">
            <a className="cd-link" href={p.vcfHref} download>Salvar contato</a>
            <button type="button" className="cd-link" onClick={() => irPara(0)}>← Voltar ao cartão</button>
          </div>
        </section>
      </div>

      <div className="cd-dots" aria-hidden="true">
        <span className="cd-dot" aria-current={ativo === 0} />
        <span className="cd-dot" aria-current={ativo === 1} />
      </div>

      {aviso && <div className="cd-toast" role="status" aria-live="polite">{aviso}</div>}

      {sheetAberta && (
        <div className="cd-overlay" onClick={fecharSheet}>
          <div className="cd-sheet" role="dialog" aria-modal="true" aria-labelledby="cd-inst-t" onClick={(e) => e.stopPropagation()}>
            <h2 id="cd-inst-t">Adicionar à tela inicial</h2>
            {ehIos ? (
              <>
                <p className="cd-sub">No iPhone, a instalação é feita pelo próprio navegador:</p>
                <ol>
                  <li>Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima) na barra do Safari.</li>
                  <li>Role e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                  <li>Confirme em <strong>Adicionar</strong>.</li>
                </ol>
                <p className="cd-nota">Faça isso com <strong>esta página aberta</strong>: o ícone abre este cartão. O iOS não permite instalar automaticamente.</p>
              </>
            ) : (
              <>
                {promptInstalar ? (
                  <>
                    <p className="cd-sub">Instale para abrir o seu cartão direto da tela inicial.</p>
                    <button type="button" className="cd-btn cd-primario cd-x" onClick={instalar}>Instalar</button>
                  </>
                ) : (
                  <>
                    <p className="cd-sub">No Android (Chrome):</p>
                    <ol>
                      <li>Toque no menu <strong>⋮</strong> do navegador.</li>
                      <li>Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                      <li>Confirme.</li>
                    </ol>
                  </>
                )}
              </>
            )}
            <button type="button" className="cd-btn cd-x" onClick={fecharSheet}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
