'use client'
// Card "Receber por Pix" da MiniPage publica + tela de pagamento (modal). Usa as MESMAS classes do card de link atual (crd/link-card/link-icon/link-title/link-sub/link-arrow),
// entao herda tema, translucidez e responsividade. O codigo Pix so e buscado quando o visitante toca no card (GET /api/pix/{slug}); nada de rede na renderizacao.
import { useCallback, useEffect, useRef, useState } from 'react'
import IconeMarca from './IconeMarca'
import { baixarQrPng, copiar } from '../lib/cartao-cliente'
import { montarTextoCompartilhamento } from '../lib/pix'

interface Dados { titulo: string; descricao: string; nome: string; cidade: string; payload: string; qrCaminho: string; qrTamanho: number }
interface Props { slug: string; titulo: string; descricao?: string | null; cardBorder?: string; cardShadow?: string; iconeBg: string; iconeBorder: string; iconeCor: string; setaCor: string }

const CSS = `
.pxm-ov{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:60;display:flex;align-items:center;justify-content:center;padding:14px}
.pxm{width:100%;max-width:430px;max-height:94dvh;overflow-y:auto;background:linear-gradient(160deg,#0C0710,#150B18);border:1.5px solid #2A1A2F;border-radius:22px;padding:22px 20px max(22px,env(safe-area-inset-bottom));color:#F8F4F7;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.pxm h2{font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px}
.pxm p{margin:0}.pxm-sub{font-size:14px;color:#E6DCE6;line-height:1.45;margin-bottom:12px}
.pxm-qr{background:#fff;border-radius:18px;padding:12px;width:min(72vw,290px);aspect-ratio:1;margin:0 auto 12px}
.pxm-qr svg{display:block;width:100%;height:100%}
.pxm-rec{font-size:13px;color:#B8AAB8;margin-bottom:4px}.pxm-rec strong{color:#F8F4F7}
.pxm-conf{font-size:12px;color:#FCD34D;margin-bottom:12px;line-height:1.4}
.pxm-cod{width:100%;min-height:74px;resize:none;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:12px;color:#F8F4F7;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;padding:10px;word-break:break-all;margin-bottom:10px}
.pxm-b{display:flex;flex-direction:column;gap:8px}
.pxm-btn{min-height:50px;border-radius:13px;border:1px solid #2A1A2F;background:rgba(24,16,27,.95);color:#F8F4F7;font:700 15px inherit;font-family:inherit;cursor:pointer}
.pxm-btn.p{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);border:none;color:#fff}
.pxm-btn:focus-visible,.pxm-cod:focus-visible{outline:3px solid #C4B5FD;outline-offset:2px}
.pxm-leg{font-size:11px;color:#8F838F;margin-top:12px;line-height:1.4}
.pxm-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#18101B;border:1px solid #2A1A2F;color:#F8F4F7;border-radius:12px;padding:10px 16px;font-size:14px;z-index:70}
`

export default function PixCardPublico(p: Props) {
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [dados, setDados] = useState<Dados | null>(null)
  const [aviso, setAviso] = useState('')
  const fecharRef = useRef<HTMLButtonElement>(null)
  const origemFoco = useRef<HTMLElement | null>(null)

  const abrir = useCallback(() => {
    origemFoco.current = document.activeElement as HTMLElement | null
    setAberto(true); setEstado('carregando'); setDados(null)
    const ctl = new AbortController()
    fetch(`/api/pix/${encodeURIComponent(p.slug)}`, { cache: 'no-store', signal: ctl.signal })
      .then(async (r) => { if (!r.ok) throw new Error('http'); return (await r.json()) as Dados })
      .then((d) => { setDados(d); setEstado('ok') })
      .catch((e) => { if ((e as Error).name !== 'AbortError') setEstado('erro') })
  }, [p.slug])

  const fechar = useCallback(() => { setAberto(false); origemFoco.current?.focus?.() }, [])

  useEffect(() => {
    if (!aberto) return
    fecharRef.current?.focus()
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto, fechar])

  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 2600); return () => clearTimeout(t) }, [aviso])

  async function copiarCodigo() { if (dados) setAviso((await copiar(dados.payload)) ? 'Código Pix copiado!' : 'Não foi possível copiar. Selecione o código e copie manualmente.') }
  async function compartilhar() {
    if (!dados) return
    // compartilha a CHAVE Pix (com o tipo), extraida do proprio payload validado; sem chave confiavel, cai para o Copia e Cola identificado como tal
    const t = montarTextoCompartilhamento(dados.payload)
    if (!t) { setAviso('Não foi possível preparar o compartilhamento.'); return }
    const msg = { title: t.titulo, text: t.texto }
    if (typeof navigator.share === 'function') { try { await navigator.share(msg); return } catch (e) { if ((e as Error).name === 'AbortError') return } }
    setAviso((await copiar(t.texto)) ? (t.modo === 'chave' ? 'Chave Pix copiada! Cole na conversa.' : 'Código Pix copiado! Cole na conversa.') : 'Não foi possível compartilhar.')
  }
  async function baixar() { if (dados) setAviso((await baixarQrPng(dados.qrCaminho, dados.qrTamanho, `pix-${p.slug.replace(/[^A-Za-z0-9._-]/g, '-')}.png`)) ? 'QR Code do Pix salvo!' : 'Não foi possível salvar a imagem.') }

  return (
    <>
      <button type="button" onClick={abrir} className="crd link-card" aria-haspopup="dialog" style={{ appearance: 'none', font: 'inherit', textAlign: 'left', width: '100%', cursor: 'pointer', color: 'inherit', border: p.cardBorder, boxShadow: p.cardShadow }}>
        <div className="link-icon" style={{ background: p.iconeBg, border: `1px solid ${p.iconeBorder}`, color: p.iconeCor }}><IconeMarca id="pix" size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="link-title">{p.titulo}</p>
          {p.descricao && <p className="link-sub">{p.descricao}</p>}
        </div>
        <span className="link-arrow" style={{ color: p.setaCor }}>›</span>
      </button>
      {aberto && (
        <div className="pxm-ov" onClick={fechar}>
          <style>{CSS}</style>
          <div className="pxm" role="dialog" aria-modal="true" aria-labelledby="pxm-t" onClick={(e) => e.stopPropagation()}>
            <h2 id="pxm-t"><span style={{ color: '#32BCAD', display: 'inline-flex' }}><IconeMarca id="pix" size={24} /></span>Pagar com Pix</h2>
            {estado === 'carregando' && <p className="pxm-sub">Carregando...</p>}
            {estado === 'erro' && <p className="pxm-sub">Não foi possível carregar o Pix agora. Tente novamente em instantes.</p>}
            {estado === 'ok' && dados && (
              <>
                <p className="pxm-sub">Aponte a câmera do aplicativo do seu banco para pagar</p>
                <div className="pxm-qr">
                  <svg viewBox={`0 0 ${dados.qrTamanho} ${dados.qrTamanho}`} role="img" aria-label={`QR Code Pix de ${dados.nome}`} shapeRendering="crispEdges">
                    <rect width={dados.qrTamanho} height={dados.qrTamanho} fill="#ffffff" /><path d={dados.qrCaminho} fill="#000000" />
                  </svg>
                </div>
                <p className="pxm-rec">Recebedor: <strong>{dados.nome}</strong> · {dados.cidade}</p>
                <p className="pxm-conf">Confira o nome do destinatário antes de confirmar o pagamento.</p>
                <label htmlFor="pxm-cod" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Pix Copia e Cola</label>
                <textarea id="pxm-cod" className="pxm-cod" readOnly value={dados.payload} onFocus={(e) => e.currentTarget.select()} />
                <div className="pxm-b">
                  <button type="button" className="pxm-btn p" onClick={copiarCodigo}>Copiar código Pix</button>
                  <button type="button" className="pxm-btn" onClick={compartilhar}>Compartilhar Pix</button>
                  <button type="button" className="pxm-btn" onClick={baixar}>Baixar QR Code</button>
                </div>
              </>
            )}
            <div className="pxm-b" style={{ marginTop: 8 }}>
              <button ref={fecharRef} type="button" className="pxm-btn" onClick={fechar}>Voltar à MiniPage</button>
            </div>
            <p className="pxm-leg">O pagamento é feito diretamente entre o seu banco e o recebedor. A MiniPage Pro não processa, retém nem confirma pagamentos.</p>
          </div>
        </div>
      )}
      {aviso && <div className="pxm-toast" role="status" aria-live="polite">{aviso}</div>}
    </>
  )
}
