 'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Tipo='track'|'album'|'artist'|'playlist'|'show'|'episode'
type Resultado={tipo:Tipo;titulo:string;subtitulo:string;url:string;imagem:string|null}
const TIPOS: Tipo[]=['track','album','artist','playlist','show','episode']
const COPIA: Record<string,{title:string;subtitle:string;input:string;search:string;searching:string;add:string;done:string;empty:string;fallback:string;types:Record<Tipo,string>}>={
 'pt-BR':{title:'Buscar no Spotify',subtitle:'Encontre músicas, artistas, álbuns, playlists e podcasts pelo nome. Ou continue colando o link acima.',input:'Nome da música, artista, playlist...',search:'Buscar',searching:'Buscando...',add:'Adicionar à MiniPage',done:'Adicionado à prévia',empty:'Nenhum resultado. Confira a escrita ou procure no Spotify.',fallback:'Abrir busca no Spotify',types:{track:'Músicas',album:'Álbuns',artist:'Artistas',playlist:'Playlists',show:'Podcasts',episode:'Episódios'}},
 'en-US':{title:'Search Spotify',subtitle:'Find songs, artists, albums, playlists or podcasts by name. Or paste a link above.',input:'Song, artist or playlist name...',search:'Search',searching:'Searching...',add:'Add to MiniPage',done:'Added to preview',empty:'No results. Try another term or search on Spotify.',fallback:'Search on Spotify',types:{track:'Songs',album:'Albums',artist:'Artists',playlist:'Playlists',show:'Podcasts',episode:'Episodes'}},
 'es-ES':{title:'Buscar en Spotify',subtitle:'Encuentra canciones, artistas, álbumes, listas y podcasts por nombre. O pega un enlace arriba.',input:'Canción, artista o lista...',search:'Buscar',searching:'Buscando...',add:'Añadir a MiniPage',done:'Añadido a la vista previa',empty:'Sin resultados. Prueba otro término.',fallback:'Buscar en Spotify',types:{track:'Canciones',album:'Álbumes',artist:'Artistas',playlist:'Playlists',show:'Podcasts',episode:'Episodios'}},
 'fr-FR':{title:'Rechercher sur Spotify',subtitle:'Trouvez des titres, artistes, albums, playlists et podcasts par nom. Ou collez un lien ci-dessus.',input:'Titre, artiste, playlist...',search:'Rechercher',searching:'Recherche...',add:'Ajouter à MiniPage',done:'Ajouté à l’aperçu',empty:'Aucun résultat. Essayez un autre terme.',fallback:'Ouvrir Spotify',types:{track:'Titres',album:'Albums',artist:'Artistes',playlist:'Playlists',show:'Podcasts',episode:'Épisodes'}},
 'de-DE':{title:'Spotify durchsuchen',subtitle:'Songs, Künstler, Alben, Playlists und Podcasts anhand des Namens finden. Oder Link oben einfügen.',input:'Song, Künstler, Playlist...',search:'Suchen',searching:'Suche...',add:'Zur MiniPage hinzufügen',done:'Zur Vorschau hinzugefügt',empty:'Keine Ergebnisse. Anderen Begriff versuchen.',fallback:'Auf Spotify suchen',types:{track:'Songs',album:'Alben',artist:'Künstler',playlist:'Playlists',show:'Podcasts',episode:'Episoden'}},
 'it-IT':{title:'Cerca su Spotify',subtitle:'Trova brani, artisti, album, playlist e podcast per nome. Oppure incolla un link sopra.',input:'Brano, artista o playlist...',search:'Cerca',searching:'Ricerca...',add:'Aggiungi alla MiniPage',done:'Aggiunto all’anteprima',empty:'Nessun risultato. Prova un altro termine.',fallback:'Cerca su Spotify',types:{track:'Brani',album:'Album',artist:'Artisti',playlist:'Playlist',show:'Podcast',episode:'Episodi'}}
}
export default function SpotifyBuscaCatalogo({idioma,onSelecionar}:{idioma:string;onSelecionar:(item:{titulo:string;url:string})=>void}) {
 const t=COPIA[idioma]||COPIA['pt-BR']
 const [nome,setNome]=useState('')
 const [tipo,setTipo]=useState<Tipo>('track')
 const [buscando,setBuscando]=useState(false)
 const [erro,setErro]=useState('')
 const [resultados,setResultados]=useState<Resultado[]>([])
 const [ultimo,setUltimo]=useState('')
 const [selecionado,setSelecionado]=useState('')
 const mercado=idioma.match(/-([A-Z]{2})$/)?.[1] || 'BR'
 async function pesquisar() {
   const termo=nome.trim().replace(/^@/,'')
   if (termo.length<2 || termo.length>80) {setErro('Informe pelo menos 2 caracteres (máximo 80).');return}
   setErro('');setResultados([]);setSelecionado('');setBuscando(true);setUltimo(termo)
   try {
     const {data:{session}}=await supabase.auth.getSession()
     if (!session?.access_token) throw new Error('Entre novamente na MiniPage Pro para pesquisar.')
     const controller=new AbortController()
     const timer=setTimeout(()=>controller.abort(),12_000)
     try {
       const qs=new URLSearchParams({q:termo,tipo,mercado})
       const response=await fetch('/api/smart-import/spotify/buscar?'+qs.toString(),{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store',signal:controller.signal})
       const body=await response.json().catch(()=>null)
       if (!response.ok) throw new Error(typeof body?.error==='string'?body.error:'A busca no Spotify não está disponível.')
       setResultados(Array.isArray(body?.resultados)?body.resultados:[])
     } finally { clearTimeout(timer) }
   } catch (e) {setErro(e instanceof Error?e.message:'Falha na busca do Spotify.')} finally {setBuscando(false)}
 }
 const urlBusca='https://open.spotify.com/search/'+encodeURIComponent(nome.trim()||ultimo||'')
 return <section style={{background:'#171221',border:'1px solid #4F405F',borderRadius:12,padding:14,marginTop:12,marginBottom:14}} aria-label={t.title}>
   <h3 style={{fontSize:15,color:'#F8F4F7',margin:'0 0 5px',fontWeight:700}}>♫ {t.title}</h3>
   <p style={{fontSize:12,lineHeight:1.5,color:'#BAACCC',margin:'0 0 12px'}}>{t.subtitle}</p>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:9}}>
     <select aria-label={t.title} value={tipo} onChange={e=>{setTipo(e.target.value as Tipo);setResultados([]);setErro('');setSelecionado('')}} style={{background:'#241B2E',border:'1px solid #5E5070',color:'#F8F4F7',borderRadius:9,padding:'10px',fontSize:12,flex:'1 1 135px',minWidth:0}}>
       {TIPOS.map(item=><option key={item} value={item}>{t.types[item]}</option>)}
     </select>
     <input aria-label={t.input} value={nome} onChange={e=>{setNome(e.target.value);setErro('')}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(!buscando)void pesquisar()}}} placeholder={t.input} maxLength={80} style={{background:'#0B0910',border:'1px solid #5E5070',color:'#F8F4F7',borderRadius:9,padding:'10px 12px',fontSize:12,flex:'2 1 200px',minWidth:0}} />
     <button type="button" disabled={buscando || nome.trim().length<2} onClick={()=>{void pesquisar()}} style={{border:0,borderRadius:9,padding:'10px 16px',background:'#C9FA45',color:'#13170B',fontWeight:750,opacity:buscando||nome.trim().length<2?.5:1,cursor:buscando?'wait':'pointer'}}>{buscando?t.searching:t.search}</button>
   </div>
   {erro && <p role="alert" style={{color:'#FFB6B6',fontSize:12,lineHeight:1.5,margin:'6px 0'}}>{erro}</p>}
   {!buscando && ultimo && !erro && resultados.length===0 && <p style={{fontSize:12,color:'#D3C6D8'}}>{t.empty}</p>}
   {ultimo && <a href={urlBusca} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:'#C9FA45',display:'inline-block',margin:'5px 0 10px'}}>{t.fallback} ↗</a>}
   {resultados.length>0 && <div style={{display:'grid',gap:8,maxHeight:335,overflowY:'auto'}}>
      {resultados.map(item=><div key={item.url} style={{display:'flex',alignItems:'center',gap:10,padding:8,border:'1px solid #4F405F',borderRadius:9,background:'#21182B'}}>
        {item.imagem?<img alt="" src={item.imagem} loading="lazy" referrerPolicy="no-referrer" style={{width:50,height:50,borderRadius:6,objectFit:'cover',flexShrink:0}}/>:<div aria-hidden="true" style={{width:50,height:50,borderRadius:6,background:'#352544',display:'grid',placeItems:'center',fontSize:24}}>♫</div>}
        <div style={{flex:1,minWidth:0}}><div title={item.titulo} style={{fontSize:12,color:'#F8F4F7',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.titulo}</div><div style={{color:'#B9B0C9',fontSize:11,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.subtitulo||t.types[item.tipo]}</div></div>
        <button type="button" onClick={()=>{onSelecionar({titulo:item.titulo,url:item.url});setSelecionado(item.url)}} style={{background:selecionado===item.url?'#385129':'#C9FA45',color:selecionado===item.url?'#FFFFFF':'#18200C',border:0,borderRadius:8,padding:'8px 10px',fontSize:11,fontWeight:700,flexShrink:0,cursor:'pointer'}}>{selecionado===item.url?t.done:t.add}</button>
      </div>)}
   </div>}
 </section>
}
