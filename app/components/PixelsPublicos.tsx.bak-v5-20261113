'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'
import { ehMetaPixelIdValido, ehGa4IdValido, lerConsentimento, salvarConsentimento, textosConsentimento, type Decisao } from '../lib/pixelsPublicos'

// Meta Pixel + GA4 da MiniPage - SO carrega depois que o visitante aceita (consentimento guardado POR MiniPage).
//  - sem Pixel ID nem Measurement ID validos: nao renderiza nada (sem banner, sem script, sem leitura de armazenamento);
//  - com algum configurado: mostra o aviso; "Aceitar" carrega os scripts (assincronos), "Recusar" nao carrega nada;
//  - os IDs sao revalidados aqui (so digitos / G-XXXXXXXXXX) ANTES de entrarem em qualquer script.
const estiloBotao = { flex: '1 1 110px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.38)', color: '#fff', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' } as const

export default function PixelsPublicos({ slug, metaPixelId, ga4Id, idioma }: { slug: string; metaPixelId?: string | null; ga4Id?: string | null; idioma?: string | null }) {
  const meta = ehMetaPixelIdValido(metaPixelId) ? metaPixelId : null
  const ga = ehGa4IdValido(ga4Id) ? ga4Id : null
  const [decisao, setDecisao] = useState<Decisao | null | undefined>(undefined) // undefined = ainda nao leu (servidor/1o render)

  useEffect(() => {
    if (!meta && !ga) return
    setDecisao(lerConsentimento(slug))
  }, [slug, meta, ga])

  if (!meta && !ga) return null
  if (decisao === undefined || decisao === 'recusado') return null

  if (decisao === null) {
    const t = textosConsentimento(idioma)
    const escolher = (d: Decisao) => { salvarConsentimento(slug, d); setDecisao(d) }
    return (
      <div role="dialog" aria-live="polite" aria-label={t.aviso} data-pixels-consent style={{ position: 'fixed', left: '12px', right: '12px', bottom: 'max(12px, env(safe-area-inset-bottom))', zIndex: 9999, maxWidth: '560px', margin: '0 auto', background: 'rgba(18,12,20,.96)', border: '1px solid rgba(255,255,255,.16)', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 10px 34px rgba(0,0,0,.5)', color: '#F4EEF3', fontSize: '13px', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: 0 }}>{t.aviso}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" data-consent="recusado" onClick={() => escolher('recusado')} style={estiloBotao}>{t.recusar}</button>
          <button type="button" data-consent="aceito" onClick={() => escolher('aceito')} style={estiloBotao}>{t.aceitar}</button>
        </div>
      </div>
    )
  }

  return (
    <>
      {meta && (
        // autoConfig=false ANTES do init: o Pixel nao le campos de formulario (ex.: e-mail do lead) nem textos de botoes - so os eventos que NOS enviamos.
        <Script id="mp-meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${meta}');fbq('init','${meta}');fbq('track','PageView');`}</Script>
      )}
      {ga && (
        <>
          <Script id="mp-ga4-lib" src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="mp-ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}
    </>
  )
}
