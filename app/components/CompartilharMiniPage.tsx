'use client'
import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import type { Idioma } from '../lib/i18n-publico'
const COPY = {
 pt:['Compartilhar','Compartilhar com um amigo','Link copiado!','Copie o link:','Conheça esta MiniPage'],
 en:['Share','Share with a friend','Link copied!','Copy the link:','Check out this MiniPage'],
 es:['Compartir','Compartir con un amigo','¡Enlace copiado!','Copia el enlace:','Conoce esta MiniPage'],
 fr:['Partager','Partager avec un ami','Lien copié !','Copiez le lien :','Découvrez cette MiniPage'],
 de:['Teilen','Mit einem Freund teilen','Link kopiert!','Link kopieren:','Entdecke diese MiniPage'],
 it:['Condividi','Condividi con un amico','Link copiato!','Copia il link:','Scopri questa MiniPage'],
} as const
export default function CompartilharMiniPage({slug,nome,idioma}:{slug:string;nome:string;idioma:Idioma}) {
 const t=COPY[idioma]||COPY.pt
 const [copiado,setCopiado]=useState(false)
 async function compartilhar(){
  // Mesmo no localhost, amigos recebem a URL publica oficial, sem parametros de rastreio.
  const url=`https://minipage.pro/${encodeURIComponent(slug)}`
  setCopiado(false)
  if(typeof navigator.share==='function'){
   try{await navigator.share({title:nome,text:`${t[4]}: ${nome}`,url});return}
   catch(error){if(error instanceof Error && error.name==='AbortError')return}
  }
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setCopiado(true);return}}catch{}
  window.prompt(t[3],url)
 }
 return <button type="button" className="rodape-cta-action rodape-cta-share" onClick={()=>void compartilhar()} title={t[1]} aria-label={t[1]}>
  {copiado?<Check size={14} aria-hidden="true"/>:<Share2 size={14} aria-hidden="true"/>}
  <span aria-live="polite">{copiado?t[2]:t[0]}</span>
 </button>
}
