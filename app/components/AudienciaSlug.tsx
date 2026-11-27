'use client'
import { copySlug, destaqueAudiencia, type RedeAudiencia } from '../lib/slug-recursos'
import { useIdiomaGlobal } from './IdiomaProviderGlobal'
import type { Idioma } from '../lib/i18n-publico'
export default function AudienciaSlug({redes,idioma:idiomaInicial}:{redes:RedeAudiencia[];idioma:Idioma}) {
 const {idioma:global}=useIdiomaGlobal()
 const idioma=(global?.slice(0,2)||idiomaInicial) as Idioma
 const t=copySlug(idioma), destaque=destaqueAudiencia(redes,idioma)
 if(!destaque)return null
 return <details className="mp-audiencia-18" style={{width:'100%',maxWidth:420,margin:'10px auto',color:'var(--text)',textShadow:'none',textAlign:'left'}}>
  <style>{`.mp-audiencia-18>summary{list-style:none}.mp-audiencia-18>summary::-webkit-details-marker{display:none}.mp-audiencia-18[open]>summary svg{transform:rotate(180deg)}`}</style>
  <summary title={t[0]} style={{cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'fit-content',maxWidth:'100%',margin:'auto',background:'var(--card)',border:'1px solid var(--accent-border)',borderRadius:99,padding:'7px 14px',fontSize:12,fontWeight:700}}><span>{destaque}</span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></summary>
  <div style={{background:'var(--card)',border:'1px solid var(--accent-border)',borderRadius:12,marginTop:6,padding:12}}>{redes.map(r=><a key={r.rede} href={r.url} target="_blank" rel="noopener noreferrer" style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',textDecoration:'none',color:'inherit',padding:'8px 0',fontSize:12}}><span style={{minWidth:0,overflowWrap:'anywhere'}}><strong>{r.rede}</strong><br/>{r.nome}</span><strong style={{textAlign:'right',flexShrink:0}}>{r.quantidade.toLocaleString(global)}<br/>{r.rede==='Instagram'?t[1]:t[2]}</strong></a>)}<p style={{fontSize:10,color:'var(--text-muted)',lineHeight:1.4}}>{t[3]}</p></div>
 </details>
}
