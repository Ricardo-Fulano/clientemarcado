'use client'
import { useState } from 'react'

type Media = {provider: 'youtube' | 'spotify'; title: string; author: string | null; thumbnail: string | null; url: string}
type Props = {value: string; language: string; onApply: (media: Media) => void}
const messages: Record<string, {check:string; add:string; loading:string; note:string; fail:string}> = {
  'pt-BR': {check:'Pré-visualizar conteúdo real',add:'Adicionar à MiniPage',loading:'Consultando fonte oficial…',note:'Importação assistida: esta consulta não importa o feed do Instagram.',fail:'Não foi possível verificar a mídia. Confira a URL pública.'},
  'en-US': {check:'Preview real content',add:'Add to MiniPage',loading:'Checking official provider…',note:'Assisted import: this does not import your Instagram feed.',fail:'Could not verify the media. Check the public URL.'},
  'es-ES': {check:'Vista previa del contenido real',add:'Añadir a MiniPage',loading:'Consultando fuente oficial…',note:'Esta consulta no importa el feed de Instagram.',fail:'No se pudo verificar el contenido. Revisa la URL.'},
  'fr-FR': {check:'Prévisualiser le contenu réel',add:'Ajouter à MiniPage',loading:'Consultation du fournisseur…',note:'Cette fonction n’importe pas le fil Instagram.',fail:'Impossible de vérifier ce contenu. Vérifiez l’URL.'},
  'de-DE': {check:'Echte Inhalte ansehen',add:'Zur MiniPage hinzufügen',loading:'Anbieter wird geprüft…',note:'Der Instagram-Feed wird nicht importiert.',fail:'Inhalt konnte nicht geprüft werden. URL kontrollieren.'},
  'it-IT': {check:'Anteprima contenuto reale',add:'Aggiungi a MiniPage',loading:'Verifica fonte ufficiale…',note:'Questa funzione non importa il feed Instagram.',fail:'Impossibile verificare il contenuto. Controlla l’URL.'},
}
export default function SmartMediaLookup({value,language,onApply}:Props) {
  const t=messages[language] || messages['pt-BR']
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [found,setFound]=useState<Media | null>(null)
  const [checkedValue,setCheckedValue]=useState('')
  const current=found && value.trim() === checkedValue ? found : null
  async function check(){
    setLoading(true);setError('');setFound(null)
    const submitted=value.trim();setCheckedValue(submitted)
    try {
      const response=await fetch('/api/onboarding/smart-preview?url='+encodeURIComponent(submitted),{cache:'no-store'})
      const result=await response.json().catch(()=>null)
      if(!response.ok || !result?.ok || !result.media) throw new Error('unsupported')
      setFound(result.media as Media)
    } catch {setError(t.fail)} finally {setLoading(false)}
  }
  return <div style={{marginTop:12}}>
    <button type="button" disabled={loading || !/^https:\/\//i.test(value.trim())} onClick={check} style={{border:'1px solid #74617E',background:'#21182D',color:'#F5F2FF',borderRadius:9,padding:'9px 12px',fontSize:12,cursor:'pointer',opacity:loading?.6:1}}>{loading?t.loading:t.check}</button>
    <p style={{fontSize:11,color:'#B8AAB8',margin:'8px 0'}}>{t.note}</p>
    {error && <p role="status" style={{fontSize:12,color:'#FFB4B4'}}>{error}</p>}
    {current && <div style={{display:'flex',gap:12,padding:12,border:'1px solid #51405F',borderRadius:12,alignItems:'center',flexWrap:'wrap'}}>
      {current.thumbnail && <img src={current.thumbnail} alt="" referrerPolicy="no-referrer" style={{width:96,height:68,objectFit:'cover',borderRadius:7}} />}
      <div style={{flex:'1 1 160px',minWidth:0}}><strong style={{fontSize:13,display:'block',overflowWrap:'anywhere'}}>{current.title}</strong><span style={{fontSize:11,color:'#B8AAB8'}}>{current.provider === 'spotify'?'Spotify':'YouTube'}{current.author?' · '+current.author:''}</span></div>
      <button type="button" onClick={()=>onApply(current)} style={{border:0,background:'#C9FA45',color:'#15180D',borderRadius:9,padding:'10px 12px',fontWeight:700,cursor:'pointer'}}>{t.add}</button>
    </div>}
  </div>
}
