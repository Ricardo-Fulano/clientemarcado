'use client'
import { useIdiomaGlobal } from './IdiomaProviderGlobal'
import { googleCobrancaCopy } from '../lib/i18n-global/google-cobranca'

export default function BotaoGoogle({onClick, disabled, busy, separator=true}: {onClick:()=>void;disabled?:boolean;busy?:boolean;separator?:boolean}) {
 const {idioma}=useIdiomaGlobal(), t=googleCobrancaCopy(idioma)
 return <div style={{margin:'12px 0 20px'}}>
   <button type="button" disabled={disabled||busy} onClick={onClick} style={{width:'100%',minHeight:48,display:'flex',alignItems:'center',justifyContent:'center',gap:12,background:'#fff',color:'#1f1f1f',border:'1px solid #dadce0',borderRadius:24,padding:'12px 16px',fontSize:15,fontWeight:600,cursor:disabled||busy?'wait':'pointer',fontFamily:'Arial,sans-serif',opacity:disabled ? .65 : 1}}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" style={{flexShrink:0}}><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.2-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.2 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7V15.2H5.8a20 20 0 0 0 0 17.6z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.3A12 12 0 0 1 24 12z"/></svg>
    <span>{busy?t[2]:t[0]}</span>
   </button>
   {separator&&<div style={{display:'flex',alignItems:'center',gap:10,color:'#B9B0C9',fontSize:12,marginTop:17}}><span style={{height:1,background:'#45384D',flex:1}}/><span>{t[1]}</span><span style={{height:1,background:'#45384D',flex:1}}/></div>}
 </div>
}
