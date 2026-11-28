'use client'
import { useIdiomaGlobal } from './IdiomaProviderGlobal'
import {inadimplencia26Copy} from '../lib/i18n-global/inadimplencia-26'
import { googleCobrancaCopy } from '../lib/i18n-global/google-cobranca'
export const SUPORTE_REGULARIZACAO='https://wa.me/5511941059063?text='+encodeURIComponent('Olá! Preciso regularizar uma cobrança existente da minha assinatura MiniPage Pro ou atualizar meu meio de pagamento.')
export default function AvisoPagamentoPendente({nivel}:{nivel:'leve'|'forte'|'free'}){
 const {idioma}=useIdiomaGlobal(),t=googleCobrancaCopy(idioma),m=inadimplencia26Copy(idioma)
 return <section className={"mp25-billing mp26-"+nivel} aria-label={t[8]} role="status">
 <style>{`.mp25-billing{box-sizing:border-box;margin-left:240px;position:sticky;top:0;z-index:35;background:#17121E;color:#fff;border-top:3px solid #C9FA45;border-bottom:1px solid #55425F;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:system-ui,sans-serif}.mp25-billing.mp26-leve{position:relative;top:auto;border-top-width:1px}.mp25-billing.mp26-free{border-top-color:#FBBF73}.mp25-billing-text{min-width:0;flex:1 1 260px}.mp25-billing-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mp25-billing-actions a{box-sizing:border-box;padding:11px 16px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:750;min-height:42px;display:inline-flex;align-items:center;justify-content:center;text-align:center}.mp25-billing-actions a:focus-visible{outline:3px solid #fff;outline-offset:2px}@media(max-width:1023px){.mp25-billing{margin-left:0;top:56px;padding:13px 16px;gap:10px;max-height:50vh;overflow-y:auto}.mp25-billing-actions{width:100%}.mp25-billing-actions a{flex:1 1 130px}.mp25-billing-text{flex-basis:100%}}`}</style>
 <div className="mp25-billing-text"><div style={{fontWeight:800,fontSize:11,letterSpacing:'.07em',color:'#FBBF73',marginBottom:5}}>{t[8]}</div><h2 style={{fontSize:16,margin:'0 0 5px',lineHeight:1.25}}>{nivel==='free'?m[0]:t[9]}</h2><p style={{fontSize:13,margin:0,color:'#D3C8DF',lineHeight:1.45}}>{nivel==='free'?m[1]:nivel==='forte'?m[2]:t[10]}</p></div>
 <div className="mp25-billing-actions"><a href={SUPORTE_REGULARIZACAO} target="_blank" rel="noopener noreferrer" style={{background:'#C9FA45',color:'#0B0A10'}}>{t[11]}</a><a href="/painel/plano" style={{border:'1px solid #776784',color:'#fff'}}>{t[12]}</a></div>
 </section>
}
