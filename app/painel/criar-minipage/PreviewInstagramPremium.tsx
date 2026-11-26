'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { reelUrl, formatoYoutube } from '../../lib/smart-import-vertical'
import type { TemaTokens } from '../../lib/tema-publico'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Image as ImageIcon, LockKeyhole, Play, Sparkles, X } from 'lucide-react'


// Icones de redes em SVG, sem depender das exportacoes opcionais do lucide-react.
type IconeRedeProps = { size?: number; color?: string; style?: CSSProperties }
function Instagram({ size = 18, color = 'currentColor', style }: IconeRedeProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/>
  </svg>
}
function Youtube({ size = 18, color = 'currentColor', style }: IconeRedeProps) {
  return <svg width={size} height={size} viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={style}><rect x="1" y="3" width="26" height="18" rx="5.5" fill={color}/><path d="M11 8.2L19 12L11 15.8Z" fill="#FFFFFF"/></svg>
}

type Midia = { id: string; tipo: string; imagem: string; link: string; legenda: string }
type Story = { id: string; tipo: string; imagem: string; url: string; timestamp: string }
type VideoYoutube = { videoId: string; titulo: string; miniatura: string; url: string }
type Idioma = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT'

type Props = {
  idioma: string
  nome: string
  slug: string
  bio: string
  fotoPerfilUrl: string
  instagram: string
  whatsapp: string
  perfilInstagram: { username: string; nome: string; bio: string; foto: string; seguidores: number | null } | null
  midias: Midia[]
  midiasSelecionadas: string[]
  midiaCapaId: string | null
  stories: Story[]
  storiesConsultados: boolean
  youtubeResultados: VideoYoutube[]
  youtubeSelecionados: string[]
  youtubeCanalDados: {nome:string;inscritos:number|null}|null
  links: Array<{ id: string; titulo: string; tipo: string; url: string }>
  temaPremium: TemaTokens
  temaFree: TemaTokens
  planoAtual: string
  modo: 'premium' | 'free'
  onModoChange: (modo: 'premium' | 'free') => void
}

const FRASES: Record<Idioma, {
  premium: string; free: string; example: string; paidFrom: string; previewOnly: string;
  demoCover: string; coverPhoto: string; coverVideo: string; selectedMedia: string;
  mediaNotSaved: string; noMedia: string; follower: string; followerDetail: string;
  onlyInstagram: string; futureNetworks: string; stories: string; storiesRecent: string; demoStories: string;
  noActiveStories: string; checkStories: string; storiesDemoInfo: string;
  otherLinks: string; previewNotPublished: string; close: string; next: string; previous: string;
  freeInfo: string; paidInfo: string; subscribe: string; video: string;
}> = {
  'pt-BR': {
    premium:'Premium',free:'Free',example:'Demonstração',paidFrom:'Visual pago · preço conforme modalidade',
    previewOnly:'Prévia visual: não altera seu plano.',demoCover:'Selecione uma foto ou vídeo acima para pré-visualizar a capa.',
    coverPhoto:'Foto de capa selecionada',coverVideo:'Miniatura de vídeo (sem reprodução automática)',
    selectedMedia:'Álbuns / Fotos',mediaNotSaved:'Prévia da importação. As mídias ainda não foram salvas nos seus álbuns.',
    noMedia:'Selecione fotos ou vídeos do Instagram para compor sua galeria.',follower:'seguidores no Instagram',
    followerDetail:'Audiência por rede',onlyInstagram:'Instagram — contagem obtida pela API oficial',
    futureNetworks:'Outras redes aparecerão somente após autorização e leitura oficial. Não somamos números informados manualmente.',
    stories:'Stories',storiesRecent:'Stories recentes',demoStories:'Stories · demonstração',noActiveStories:'Nenhum Story ativo retornado.',
    checkStories:'Use “Consultar meus Stories ativos” no formulário para testar a API.',
    storiesDemoInfo:'Visual ilustrativo. Stories reais ainda não são publicados na slug. A seção final aparecerá somente com conteúdo ativo e autorização.',
    otherLinks:'Links oficiais',previewNotPublished:'Esta é uma simulação. Mídias não foram publicadas.',close:'Fechar',next:'Próximo',previous:'Anterior',
    freeInfo:'No Free: foto circular e links. Capa e galeria Premium não serão publicados.',
    paidInfo:'Modelo pago: capa e recursos mostrados são ilustrativos e sujeitos ao seu plano.',subscribe:'Ver planos',video:'Vídeo'
  },
  'en-US': {
    premium:'Premium',free:'Free',example:'Demo',paidFrom:'Paid design · pricing depends on subscription market',previewOnly:'Visual preview only: your plan is unchanged.',
    demoCover:'Select a photo or video above to preview your cover.',coverPhoto:'Selected photo cover',coverVideo:'Video thumbnail (no autoplay)',
    selectedMedia:'Albums / Photos',mediaNotSaved:'Import preview only. Media has not been saved to your albums.',
    noMedia:'Select Instagram photos or videos to build your gallery.',follower:'Instagram followers',followerDetail:'Audience by network',
    onlyInstagram:'Instagram — official API count',futureNetworks:'Other networks appear only after authorization and official retrieval. No manual figures are summed.',
    stories:'Stories',storiesRecent:'Recent Stories',demoStories:'Stories · demo',noActiveStories:'No active Stories returned.',
    checkStories:'Use “Check active Stories” in the form to test the API.',
    storiesDemoInfo:'Illustration only. Real Stories are not published to your MiniPage yet. The final section appears only with authorized active content.',
    otherLinks:'Official links',previewNotPublished:'This is a simulation. Media was not published.',close:'Close',next:'Next',previous:'Previous',
    freeInfo:'Free: round avatar and links. Premium cover and gallery will not be published.',
    paidInfo:'Paid preview: visual features depend on your actual plan.',subscribe:'View plans',video:'Video'
  },
  'es-ES': {
    premium:'Premium',free:'Free',example:'Demostración',paidFrom:'Diseño de pago · precio según modalidad',previewOnly:'Solo vista previa: no cambia tu plan.',
    demoCover:'Elige una foto o vídeo para ver la portada.',coverPhoto:'Foto de portada',coverVideo:'Miniatura de vídeo (sin reproducción automática)',
    selectedMedia:'Álbumes / Fotos',mediaNotSaved:'Vista previa: las publicaciones aún no se guardaron en tus álbumes.',
    noMedia:'Elige fotos o vídeos para la galería.',follower:'seguidores en Instagram',followerDetail:'Audiencia por red',
    onlyInstagram:'Instagram — cifra de la API oficial',futureNetworks:'Otras redes solo después de autorización y consulta oficial.',
    stories:'Stories',storiesRecent:'Historias recientes',demoStories:'Stories · demostración',noActiveStories:'No hay Stories activos.',
    checkStories:'Consulta los Stories activos en el formulario.',
    storiesDemoInfo:'Ilustración: los Stories reales aún no se publican. Solo aparecerán con autorización y contenido activo.',
    otherLinks:'Enlaces oficiales',previewNotPublished:'Esta es una simulación. No se han publicado archivos.',close:'Cerrar',next:'Siguiente',previous:'Anterior',
    freeInfo:'En Free: avatar circular y enlaces; sin portada, ni galería Premium.',
    paidInfo:'Vista de pago ilustrativa; las funciones dependen de tu plan.',subscribe:'Ver planes',video:'Vídeo'
  },
  'fr-FR': {
    premium:'Premium',free:'Free',example:'Démonstration',paidFrom:'Présentation payante · prix selon la formule',previewOnly:'Aperçu uniquement : votre forfait ne change pas.',
    demoCover:'Choisissez une photo ou une vidéo pour la couverture.',coverPhoto:'Photo de couverture',coverVideo:'Miniature vidéo (sans lecture automatique)',
    selectedMedia:'Albums / Photos',mediaNotSaved:'Aperçu uniquement : les médias ne sont pas enregistrés dans vos albums.',
    noMedia:'Choisissez des photos ou vidéos Instagram.',follower:'abonnés Instagram',followerDetail:'Audience par réseau',
    onlyInstagram:'Instagram — données officielles',futureNetworks:'Les autres réseaux seront ajoutés uniquement après autorisation.',
    stories:'Stories',storiesRecent:'Stories récents',demoStories:'Stories · démo',noActiveStories:'Aucune Story active.',
    checkStories:'Vérifiez les Stories dans le formulaire.',
    storiesDemoInfo:'Illustration seulement. La publication de Stories réelles n’est pas encore activée.',
    otherLinks:'Liens officiels',previewNotPublished:'Simulation : aucune publication réalisée.',close:'Fermer',next:'Suivant',previous:'Précédent',
    freeInfo:'Free : photo ronde et liens. Pas de couverture, ni galerie Premium.',
    paidInfo:'Aperçu payant illustratif ; fonctions selon le forfait.',subscribe:'Voir les forfaits',video:'Vidéo'
  },
  'de-DE': {
    premium:'Premium',free:'Free',example:'Demovorschau',paidFrom:'Bezahltes Design · Preis nach Abonnementmarkt',previewOnly:'Nur Vorschau: Dein Tarif bleibt unverändert.',
    demoCover:'Wähle ein Foto oder Video für das Titelbild.',coverPhoto:'Ausgewähltes Titelbild',coverVideo:'Video-Vorschaubild (kein Autoplay)',
    selectedMedia:'Alben / Fotos',mediaNotSaved:'Nur Vorschau: Medien wurden noch nicht in Alben gespeichert.',
    noMedia:'Wähle Instagram-Fotos oder Videos.',follower:'Instagram-Follower',followerDetail:'Publikum nach Netzwerk',
    onlyInstagram:'Instagram — offiziell abgerufen',futureNetworks:'Weitere Netzwerke erst nach Autorisierung und Abruf.',
    stories:'Stories',storiesRecent:'Aktuelle Stories',demoStories:'Stories · Demo',noActiveStories:'Keine aktiven Stories.',
    checkStories:'Prüfe aktive Stories im Formular.',
    storiesDemoInfo:'Nur Illustration. Echte Stories werden noch nicht veröffentlicht.',
    otherLinks:'Offizielle Links',previewNotPublished:'Simulation: keine Medien veröffentlicht.',close:'Schließen',next:'Weiter',previous:'Zurück',
    freeInfo:'Free: rundes Profilbild und Links, ohne Premium-Titelbild, Galerie.',
    paidInfo:'Bezahlte Vorschau; Funktionen hängen vom Tarif ab.',subscribe:'Tarife ansehen',video:'Video'
  },
  'it-IT': {
    premium:'Premium',free:'Free',example:'Dimostrazione',paidFrom:'Design a pagamento · prezzo secondo il mercato',previewOnly:'Solo anteprima: il tuo piano non cambia.',
    demoCover:'Scegli una foto o un video per la copertina.',coverPhoto:'Foto di copertina',coverVideo:'Anteprima video (senza riproduzione automatica)',
    selectedMedia:'Album / Foto',mediaNotSaved:'Solo anteprima: i media non sono ancora salvati negli album.',
    noMedia:'Scegli foto o video Instagram.',follower:'follower Instagram',followerDetail:'Pubblico per rete',
    onlyInstagram:'Instagram — dati ufficiali',futureNetworks:'Altre reti solo dopo autorizzazione e lettura ufficiale.',
    stories:'Stories',storiesRecent:'Storie recenti',demoStories:'Stories · demo',noActiveStories:'Nessuna Story attiva.',
    checkStories:'Controlla le Stories attive nel modulo.',
    storiesDemoInfo:'Solo illustrazione. Le Stories reali non sono ancora pubblicate.',
    otherLinks:'Link ufficiali',previewNotPublished:'Simulazione: nessuna pubblicazione effettuata.',close:'Chiudi',next:'Avanti',previous:'Indietro',
    freeInfo:'Free: foto circolare e link. Nessuna copertina, galleria Premium.',
    paidInfo:'Anteprima a pagamento illustrativa; funzioni secondo il piano.',subscribe:'Vedi piani',video:'Video'
  }
}

// Imagem local somente para demonstrar a diferenca visual; nao salva nem envia ao servidor.
const FOTO_PREVIA: Record<Idioma, { choose: string; clear: string; note: string; error: string }> = {
  'pt-BR': { choose:'Experimentar fotografia', clear:'Retirar foto de teste', note:'Prévia: foto circular no Free e capa no Premium. Nada é enviado ou salvo; o upload definitivo fica em Painel → Perfil → Aparência.', error:'Escolha uma imagem JPG, PNG ou WebP com até 8 MB.' },
  'en-US': { choose:'Try a photo', clear:'Remove test photo', note:'Preview: round avatar on Free, cover on Premium. Nothing is uploaded or saved; permanent upload is in Dashboard → Profile → Appearance.', error:'Choose a JPG, PNG or WebP image up to 8 MB.' },
  'es-ES': { choose:'Probar fotografía', clear:'Quitar foto de prueba', note:'Vista previa: foto circular en Free y portada en Premium. Nada se envía ni se guarda; la carga definitiva está en Panel → Perfil → Apariencia.', error:'Elige una imagen JPG, PNG o WebP de hasta 8 MB.' },
  'fr-FR': { choose:'Essayer une photo', clear:'Retirer la photo', note:'Aperçu : photo ronde en Free et couverture en Premium. Aucun fichier envoyé ou enregistré ; téléchargement définitif dans Profil → Apparence.', error:'Choisissez une image JPG, PNG ou WebP de 8 Mo maximum.' },
  'de-DE': { choose:'Foto ausprobieren', clear:'Testfoto entfernen', note:'Vorschau: rundes Bild im Free-, Titelbild im Premium-Modus. Nichts wird hochgeladen oder gespeichert; dauerhaft im Profil → Darstellung.', error:'Wähle ein JPG-, PNG- oder WebP-Bild bis 8 MB.' },
  'it-IT': { choose:'Prova una foto', clear:'Rimuovi foto di prova', note:'Anteprima: foto circolare su Free e copertina su Premium. Nessun caricamento o salvataggio; caricamento definitivo in Profilo → Aspetto.', error:'Scegli un’immagine JPG, PNG o WebP fino a 8 MB.' }
}

const VIDEO_LAYOUT: Record<Idioma, {list:string;grid:string;followHint:string;ytSubscribers:string;totalAudience:string;combinedNote:string;publicYtNote:string}> = {
  'pt-BR': {list:'Lista',grid:'Grade',followHint:'Conecte o Instagram ou pesquise um canal YouTube com inscritos públicos para ver a audiência.',ytSubscribers:"inscritos no YouTube",totalAudience:"seguidores + inscritos",combinedNote:"Soma das contagens por rede; não são pessoas únicas.",publicYtNote:"Inscritos públicos do canal importado (valor arredondado pelo YouTube)."},
  'en-US': {list:'List',grid:'Grid',followHint:'Connect Instagram or search a YouTube channel with public subscribers to view audience counts.',ytSubscribers:"YouTube subscribers",totalAudience:"followers + subscribers",combinedNote:"Sum of network counts, not unique people.",publicYtNote:"Public subscribers of the selected channel (rounded by YouTube)."},
  'es-ES': {list:'Lista',grid:'Cuadrícula',followHint:'Conecta Instagram o busca un canal de YouTube con suscriptores públicos para ver las cifras.',ytSubscribers:"suscriptores de YouTube",totalAudience:"seguidores + suscriptores",combinedNote:"Suma de cifras por red; no son personas únicas.",publicYtNote:"Suscriptores públicos del canal elegido (redondeados por YouTube)."},
  'fr-FR': {list:'Liste',grid:'Grille',followHint:'Connectez Instagram ou recherchez une chaîne YouTube affichant son nombre d’abonnés.',ytSubscribers:"abonnés YouTube",totalAudience:"abonnés cumulés",combinedNote:"Somme par réseau, sans dédupliquer les personnes.",publicYtNote:"Nombre public d’abonnés du canal choisi (arrondi par YouTube)."},
  'de-DE': {list:'Liste',grid:'Raster',followHint:'Verbinde Instagram oder suche einen YouTube-Kanal mit öffentlicher Abonnentenzahl.',ytSubscribers:"YouTube-Abonnenten",totalAudience:"Follower + Abonnenten",combinedNote:"Summe je Netzwerk, keine eindeutigen Personen.",publicYtNote:"Öffentliche Abonnenten des ausgewählten Kanals (von YouTube gerundet)."},
  'it-IT': {list:'Elenco',grid:'Griglia',followHint:'Collega Instagram o cerca un canale YouTube con iscritti pubblici per vedere i conteggi.',ytSubscribers:"iscritti YouTube",totalAudience:"follower + iscritti",combinedNote:"Somma dei conteggi per rete, non persone uniche.",publicYtNote:"Iscritti pubblici del canale selezionato (arrotondati da YouTube)."}
}

const safeImage = (url: string) => /^https:\/\//i.test(url) ? url : undefined
const accent = '#C9FA45'

export default function PreviewInstagramPremium({ idioma, nome, slug, bio, fotoPerfilUrl, instagram, whatsapp, perfilInstagram, midias, midiasSelecionadas, midiaCapaId, stories, storiesConsultados, youtubeResultados, youtubeSelecionados, youtubeCanalDados, links, temaPremium, temaFree, planoAtual, modo, onModoChange }: Props) {
  const lang = (idioma in FRASES ? idioma : 'pt-BR') as Idioma
  const t = FRASES[lang]
  const [seguidoresAbertos, setSeguidoresAbertos] = useState(false)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [storyInfo, setStoryInfo] = useState(false)
  const [videoReproduzindo, setVideoReproduzindo] = useState<string | null>(null)
  const [youtubeLayout, setYoutubeLayout] = useState<'lista' | 'grade'>('lista')
  const [galeriaLayout, setGaleriaLayout] = useState<'grade' | 'carrossel'>('grade')
  const [fotoTeste, setFotoTeste] = useState<File | null>(null)
  const [fotoTesteUrl, setFotoTesteUrl] = useState<string | null>(null)
  const [fotoTesteErro, setFotoTesteErro] = useState('')
  useEffect(() => {
    if (!fotoTeste) { setFotoTesteUrl(null); return }
    const urlLocal = URL.createObjectURL(fotoTeste)
    setFotoTesteUrl(urlLocal)
    return () => URL.revokeObjectURL(urlLocal)
  }, [fotoTeste])
  const media = midias.filter(m => midiasSelecionadas.includes(m.id))
  // A foto do perfil fica no avatar (Free). A capa Premium vem exclusivamente
  // de uma publicacao selecionada e autorizada do Instagram.
  // Sem publicacoes escolhidas, nao ampliamos o avatar circular como banner.
  const primeiroVisual = media.find(m => m.id === midiaCapaId && !!safeImage(m.imagem))
    || media.find(m => m.tipo.toUpperCase() !== 'VIDEO' && !!safeImage(m.imagem))

  // A imagem local e temporaria: serve como capa no Premium ou avatar no Free.
  // Sem ela, mantemos a foto de perfil oficial e a capa selecionada no Instagram.
  const capa = fotoTesteUrl || safeImage(primeiroVisual?.imagem || '')
  const avatar = fotoTesteUrl || safeImage(fotoPerfilUrl) || safeImage(perfilInstagram?.foto || '')
  const tokensTema = modo === 'premium' ? temaPremium : temaFree
  const fundo = tokensTema.bg
  const destaque = tokensTema.accent
  const claro = tokensTema.mode === 'light'
  const fore = tokensTema.text
  const nomeExibido = nome.trim() || perfilInstagram?.nome || perfilInstagram?.username || (lang==='pt-BR'?'Sua marca':'Your brand')
  const bioExibida = bio.trim() || (lang==='pt-BR'?'Conte ao mundo o que você faz.':'Tell the world what you do.')
  const inscricao = typeof perfilInstagram?.seguidores==='number' && Number.isFinite(perfilInstagram.seguidores) && perfilInstagram.seguidores >= 0 ? perfilInstagram.seguidores : null
  const inscritosYoutube = typeof youtubeCanalDados?.inscritos === 'number' && Number.isSafeInteger(youtubeCanalDados.inscritos) && youtubeCanalDados.inscritos >= 0 ? youtubeCanalDados.inscritos : null
  const temAudiencia = inscricao !== null || inscritosYoutube !== null
  const totalAudiencia = (inscricao || 0) + (inscritosYoutube || 0)
  const legendaAudiencia = inscricao !== null && inscritosYoutube !== null ? VIDEO_LAYOUT[lang].totalAudience : inscricao !== null ? t.follower : VIDEO_LAYOUT[lang].ytSubscribers
  const storiesValidos = stories.filter(s => !!safeImage(s.imagem) || !!safeImage(s.url))
  const storyAtual = storyIndex === null ? null : storiesValidos[storyIndex]
  const youtubes = youtubeResultados.filter(y => youtubeSelecionados.includes(y.videoId))
  const linksMostrar = modo === 'free' ? links.slice(0, 5) : links
  const horizontais=youtubes.filter(v=>formatoYoutube(v.url)==='16:9')
  const shortsMostrar=modo==='premium'?youtubes.filter(v=>formatoYoutube(v.url)==='9:16'):[]
  const videosMostrar = modo === 'free' ? horizontais.slice(0, 1) : horizontais
  // Somente contatos que o assinante efetivamente escolheu, sem criar links ficticios.
  const redesDoTopo = Array.from(new Set([
    ...(instagram.trim() || perfilInstagram?.username ? ['instagram'] : []),
    ...(whatsapp.trim() ? ['whatsapp'] : []),
    ...linksMostrar.filter(l => l.url.trim()).map(l => l.tipo),
    ...(videosMostrar.length || shortsMostrar.length ? ['youtube'] : []),
  ])).filter(tipo => ['instagram','facebook','youtube','whatsapp','tiktok','spotify','x','site'].includes(tipo)).slice(0, 10)
  const linksSpotify = modo === 'premium' ? linksMostrar.map(l => ({ ...l, embed: spotifyEmbedUrl(l.url) })).filter(l => !!l.embed) : []
  const isPago = planoAtual !== 'free'

  useEffect(() => {
    if (storyIndex === null && !storyInfo) return
    function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') { setStoryIndex(null); setStoryInfo(false) } }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [storyIndex, storyInfo])

  return (
    <div style={{color:'#F9F7FC'}}>
      <div role="group" aria-label="Modelo de prévia" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,background:'#211A29',borderRadius:12,padding:5,marginBottom:11}}>
        {(['premium','free'] as const).map(item => <button key={item} type="button" aria-pressed={modo===item} onClick={()=>onModoChange(item)} style={{border:modo===item?'1px solid #C9FA45':'1px solid transparent',borderRadius:9,background:modo===item?'#314020':'transparent',color:modo===item?accent:'#D0C7DC',fontWeight:800,padding:'9px 7px',cursor:'pointer',fontSize:12}}>{item==='premium'?'✦ '+t.premium:t.free}</button>)}
      </div>
      <p style={{color:'#D1C6DC',fontSize:11,textAlign:'center',lineHeight:1.45,margin:'0 0 9px'}}>
        {modo==='premium'?t.paidFrom:t.freeInfo} · {t.previewOnly}
      </p>
      <div style={{display:'flex',gap:7,alignItems:'center',justifyContent:'center',flexWrap:'wrap',marginBottom:9}}>
        <label style={{cursor:'pointer',fontSize:11,fontWeight:750,color:'#E4F5BE',background:'#253018',border:'1px solid #586C32',borderRadius:8,padding:'7px 10px'}}>
          {FOTO_PREVIA[lang].choose}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>{
            const imagem = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (!imagem) return
            if (!['image/jpeg','image/png','image/webp'].includes(imagem.type) || imagem.size > 8 * 1024 * 1024) {
              setFotoTesteErro(FOTO_PREVIA[lang].error)
              return
            }
            setFotoTesteErro('')
            setFotoTeste(imagem)
          }}/>
        </label>
        {fotoTeste && <button type="button" onClick={()=>{setFotoTeste(null);setFotoTesteErro('')}} style={{cursor:'pointer',fontSize:11,color:'#DDD1E5',background:'transparent',border:'1px solid #766781',padding:'6px 10px',borderRadius:8}}>{FOTO_PREVIA[lang].clear}</button>}
        <div role={fotoTesteErro?'alert':undefined} style={{width:'100%',fontSize:10,lineHeight:1.5,textAlign:'center',color:fotoTesteErro?'#FFB4B4':'#BFB2C8'}}>{fotoTesteErro || FOTO_PREVIA[lang].note}</div>
      </div>
      {modo==='premium' && !temAudiencia && <p style={{textAlign:'center',fontSize:10,color:'#BEB2C9',lineHeight:1.45,margin:'0 4px 9px'}}>{VIDEO_LAYOUT[lang].followHint}</p>}
      <div className="mp2-live-phone" style={{padding:'10px',border:'5px solid #3A3043',borderRadius:30,background:'#0A0910',boxShadow:'0 22px 70px rgba(0,0,0,.35)'}}>
        <div style={{height:5,width:44,borderRadius:99,background:'#706478',margin:'1px auto 10px'}}/>
        <div style={{maxHeight:595,overflowY:'auto',overscrollBehavior:'contain',borderRadius:20,background:fundo,color:fore,border:`1px solid ${tokensTema.cardBorder}`}}>
          {modo==='premium' ? (
            <>
              <div style={{position:'relative',height:capa?445:240,background:tokensTema.card,overflow:'hidden'}}>
                {capa ? <img src={capa} alt={t.coverPhoto} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 38%',transform:'scale(1.08)',transformOrigin:'center 38%'}}/> : <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',color:destaque}}><ImageIcon size={44}/></div>}
                <div style={{position:'absolute',inset:0,background:capa?`linear-gradient(to bottom,rgba(0,0,0,0) 28%,rgba(${tokensTema.bgRGB},.35) 68%,rgba(${tokensTema.bgRGB},.9) 100%),linear-gradient(to bottom,transparent 65%,rgba(0,0,0,.27) 100%)`:`linear-gradient(to bottom,rgba(${tokensTema.bgRGB},0) 30%,rgba(${tokensTema.bgRGB},.5) 65%,rgba(${tokensTema.bgRGB},.9) 100%)`}}/>
                <span style={{position:'absolute',top:12,left:11,fontSize:10,background:'rgba(13,12,20,.75)',border:'1px solid rgba(255,255,255,.2)',padding:'5px 8px',borderRadius:99,color:'#F7F2FF',display:'flex',gap:5,alignItems:'center'}}><Eye size={12}/> {t.premium} · {t.example}</span>
                {primeiroVisual?.tipo.toUpperCase()==='VIDEO' && <span style={{position:'absolute',top:12,right:11,display:'flex',gap:3,alignItems:'center',fontSize:10,color:'#FFF',background:'#15111EA8',borderRadius:7,padding:'5px 7px'}}><Play size={12}/> {t.video}</span>}
                {!capa && <span style={{position:'absolute',top:55,left:12,right:12,color:'#EEE',fontSize:10,textAlign:'center'}}>{t.demoCover}</span>}
                <div style={{position:'absolute',left:13,right:13,bottom:capa?22:17,textAlign:'center'}}>
                  <div style={{fontWeight:850,fontSize:23,lineHeight:1.1,color:'#FFF',overflowWrap:'anywhere',textShadow:'0 2px 12px #000C'}}>{nomeExibido}</div>
                  <div style={{fontSize:11,marginTop:5,color:'#E3DDE8'}}>@{perfilInstagram?.username || slug || 'seunome'}</div>
                  <div aria-label="Redes e contatos selecionados" style={{marginTop:10,display:'flex',gap:7,justifyContent:'center',flexWrap:'wrap'}}>
                    {redesDoTopo.map(tipo => <span key={tipo} title={nomeDaRede(tipo)} aria-label={nomeDaRede(tipo)} style={{display:'grid',placeItems:'center',border:'1px solid #FFFFFF66',background:`rgba(${tokensTema.bgRGB},.55)`,borderRadius:'50%',height:30,width:30,color:'#FFF'}}><IconeRede tipo={tipo}/></span>)}
                  </div>
                  {capa && temAudiencia && <button type="button" aria-expanded={seguidoresAbertos} onClick={()=>setSeguidoresAbertos(v=>!v)} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:5,border:'1px solid #FFFFFF55',background:'rgba(0,0,0,.24)',borderRadius:99,color:'#FFF',padding:'5px 9px',fontWeight:800,fontSize:11,cursor:'pointer',marginTop:9}}>{totalAudiencia.toLocaleString(lang)} {legendaAudiencia} {seguidoresAbertos?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</button>}
                  {capa && <p style={{color:'#FFF',fontSize:11,lineHeight:1.35,margin:'9px auto 0',maxWidth:295,whiteSpace:'pre-wrap',overflowWrap:'anywhere',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden',textShadow:'0 1px 8px #000D'}}>{bioExibida}</p>}
                </div>
              </div>
              <div style={{textAlign:'center',padding:'11px 12px 9px'}}>
                {temAudiencia && <div>
                  {!capa && <button type="button" aria-expanded={seguidoresAbertos} onClick={()=>setSeguidoresAbertos(v=>!v)} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:5,border:`1px solid ${tokensTema.cardBorder}`,background:tokensTema.surface2,borderRadius:99,color:fore,padding:'7px 11px',fontWeight:800,fontSize:12,cursor:'pointer'}}>{totalAudiencia.toLocaleString(lang)} {legendaAudiencia} {seguidoresAbertos?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>}
                  {seguidoresAbertos && <div style={{margin:'10px 0 0',padding:12,borderRadius:12,border:`1px solid ${tokensTema.cardBorder}`,background:tokensTema.card,textAlign:'left'}}>
                    <div style={{fontSize:12,fontWeight:800,marginBottom:10}}>{t.followerDetail}</div>
                     {inscricao !== null && <div style={{display:'flex',justifyContent:'space-between',gap:7,alignItems:'center',marginBottom:inscritosYoutube!==null?7:0}}><span style={{display:'flex',gap:7,alignItems:'center',minWidth:0,fontSize:11}}><Instagram size={15} color="#E96CB7"/> @{perfilInstagram?.username}</span><strong style={{fontSize:12}}>{inscricao.toLocaleString(lang)}</strong></div>}
                     {inscritosYoutube !== null && <div style={{display:'flex',justifyContent:'space-between',gap:7,alignItems:'center'}}><span style={{display:'flex',gap:7,alignItems:'center',minWidth:0,fontSize:11}}><Youtube size={15} color="#FF4141"/> {youtubeCanalDados?.nome || 'YouTube'}</span><strong style={{fontSize:12}}>{inscritosYoutube.toLocaleString(lang)}</strong></div>}
                    <p style={{fontSize:9,opacity:.7,lineHeight:1.4,margin:'9px 0 0'}}>{inscritosYoutube!==null?VIDEO_LAYOUT[lang].publicYtNote:t.onlyInstagram}{inscricao!==null && inscritosYoutube!==null ? ' '+VIDEO_LAYOUT[lang].combinedNote : ''}</p>
                  </div>}
                </div>}
                {!capa && <div style={{fontSize:12,lineHeight:1.5,marginTop:10,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{bioExibida}</div>}

              </div>
              <div style={{padding:'4px 11px 17px'}}>
                <SectionLinks links={linksMostrar.filter(l => !linksSpotify.some(sp => sp.id===l.id))} tema={tokensTema} title={t.otherLinks}/>
                {linksSpotify.length>0 && <section aria-label="Spotify" style={{marginTop:14,textAlign:'left'}}><div style={{fontSize:12,fontWeight:850,marginBottom:8,color:fore}}>Spotify</div>{linksSpotify.map(l => <div key={l.id} style={{marginBottom:10,borderRadius:12,overflow:'hidden',background:tokensTema.card}}><iframe title={`Spotify: ${l.titulo}`} loading="lazy" src={l.embed} width="100%" height="152" style={{border:0,display:'block'}} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"/></div>)}</section>}
                <Galeria media={media.filter(m=>m.tipo!=='VIDEO')} tema={tokensTema} title={t.selectedMedia} empty={t.noMedia} footer={t.mediaNotSaved} layout={galeriaLayout} onLayoutChange={setGaleriaLayout} idioma={lang}/>
                {media.some(m=>m.tipo==='VIDEO'&&reelUrl(m.link))&&<section style={{marginTop:14,textAlign:'left'}}><strong style={{fontSize:12}}>Instagram Reels</strong><div style={{display:'flex',gap:7,overflowX:'auto',marginTop:8}}>{media.filter(m=>m.tipo==='VIDEO'&&reelUrl(m.link)).map(m=><div key={m.id} style={{flex:'0 0 38%',aspectRatio:'9/16',borderRadius:9,overflow:'hidden',background:tokensTema.card,position:'relative'}}>{safeImage(m.imagem)&&<img src={m.imagem} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}<span style={{position:'absolute',bottom:5,left:5,color:'#fff',background:'#111b',padding:4,borderRadius:5}}>▶</span></div>)}</div></section>}
                {videosMostrar.length>0 && <section aria-label="YouTube" style={{marginTop:16,textAlign:'left'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:7,marginBottom:9}}>
                    <strong style={{fontSize:12,color:fore}}>YouTube</strong>
                    {videosMostrar.length>1 && <div role="group" aria-label="Layout do YouTube" style={{display:'flex',gap:3,padding:3,borderRadius:9,background:tokensTema.surface2,border:`1px solid ${tokensTema.cardBorder}`}}>
                      {(['lista','grade'] as const).map(layout => <button key={layout} type="button" aria-pressed={youtubeLayout===layout} onClick={()=>setYoutubeLayout(layout)} style={{background:youtubeLayout===layout?tokensTema.card:'transparent',border:youtubeLayout===layout?`1px solid ${tokensTema.cardBorder}`:'1px solid transparent',borderRadius:7,color:fore,padding:'5px 7px',fontSize:10,fontWeight:800,cursor:'pointer'}}>{VIDEO_LAYOUT[lang][layout==='lista'?'list':'grid']}</button>)}
                    </div>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:youtubeLayout==='grade'?'repeat(2,minmax(0,1fr))':'minmax(0,1fr)',gap:9}}>
                    {videosMostrar.map(y => <div key={y.videoId} style={{minWidth:0,gridColumn:youtubeLayout==='grade' && videoReproduzindo===y.videoId?'1 / -1':undefined}}><YouTubeCard video={y} tema={tokensTema} compact={youtubeLayout==='grade' && videoReproduzindo!==y.videoId} reproduzindo={videoReproduzindo===y.videoId} onPlay={()=>setVideoReproduzindo(y.videoId)}/></div>)}
                  </div>
                </section>}
                {shortsMostrar.length>0&&<section aria-label="YouTube Shorts" style={{marginTop:16,textAlign:'left'}}><strong style={{fontSize:12,color:fore}}>YouTube Shorts</strong><div style={{display:'flex',gap:8,overflowX:'auto',marginTop:9}}>{shortsMostrar.map(v=><div key={v.videoId} style={{flex:'0 0 45%',minWidth:0}}><YouTubeCard video={v} tema={tokensTema} compact reproduzindo={videoReproduzindo===v.videoId} onPlay={()=>setVideoReproduzindo(v.videoId)}/></div>)}</div></section>}
              </div>
            </>
          ) : (
            <div style={{padding:'24px 13px 20px',textAlign:'center',minHeight:330}}>
              {avatar?<img src={avatar} alt={nomeExibido} style={{width:79,height:79,borderRadius:'50%',objectFit:'cover',border:`2px solid ${destaque}`,display:'block',margin:'0 auto 12px'}}/>:<div style={{width:79,height:79,borderRadius:'50%',background:tokensTema.surface2,color:destaque,border:`2px solid ${destaque}`,display:'grid',placeItems:'center',fontSize:30,fontWeight:850,margin:'0 auto 12px'}}>{nomeExibido[0]?.toUpperCase()||'M'}</div>}
              <div style={{fontSize:18,fontWeight:850,overflowWrap:'anywhere'}}>{nomeExibido}</div>
              <div style={{fontSize:11,opacity:.76,marginTop:5}}>minipage.pro/{slug || 'seunome'}</div>
              <p style={{fontSize:12,lineHeight:1.5,overflowWrap:'anywhere',whiteSpace:'pre-wrap',margin:'14px 0 18px'}}>{bioExibida}</p>
              <div style={{display:'flex',gap:7,justifyContent:'center',marginBottom:14}}>{instagram.trim()&&<span style={{padding:'6px 10px',borderRadius:99,background:tokensTema.soft,fontSize:11}}>Instagram</span>}{whatsapp.trim()&&<span style={{padding:'6px 10px',borderRadius:99,background:tokensTema.surface2,fontSize:11}}>WhatsApp</span>}</div>
              <SectionLinks links={linksMostrar} tema={tokensTema} title={t.otherLinks}/>
              {videosMostrar.length > 0 && <div style={{marginTop:13,textAlign:'left'}}><div style={{fontSize:11,fontWeight:800,marginBottom:7}}>{t.freeInfo.split(":")[0] === "Free" ? "YouTube · 1 Free video" : "YouTube · 1 vídeo Free"}</div>{videosMostrar.map(v => <YouTubeCard key={v.videoId} video={v} tema={tokensTema} reproduzindo={videoReproduzindo===v.videoId} onPlay={()=>setVideoReproduzindo(v.videoId)}/>)}</div>}
              {media.length>0 && <div style={{marginTop:16,padding:10,border:`1px dashed ${tokensTema.border}`,borderRadius:9,display:'flex',alignItems:'center',gap:6,textAlign:'left',fontSize:10,opacity:.8}}><LockKeyhole size={17}/>{t.freeInfo}</div>}
            </div>
          )}
        </div>
        <div style={{color:'#B8AFC5',textAlign:'center',fontSize:10,lineHeight:1.55,padding:'10px 1px 2px'}}>{modo==='premium'?(isPago?t.paidInfo:t.paidFrom):t.freeInfo}<div style={{marginTop:3}}>{t.previewNotPublished}</div></div>
      </div>

    </div>
  )
}

const navButton: CSSProperties = {background:'#3A3141',color:'#FFF',border:'1px solid #776B80',borderRadius:9,padding:'9px 11px',display:'flex',alignItems:'center',gap:4,cursor:'pointer'}

// O mesmo tipo de ícone identifica os links da prévia Free e Premium.
// Só apresentamos ícones para destinos existentes: não criamos redes nem links novos.
function identificarRedeCard(tipo: string, url: string): string {
  const informado = (tipo || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
  const aliases: Record<string,string> = {linkedin:'linkedin',applemusic:'apple_music',apple_music:'apple_music',deezer:'deezer',email:'email',e_mail:'email',telegram:'telegram',pinterest:'pinterest',twitch:'twitch',threads:'threads',instagram:'instagram',facebook:'facebook',youtube:'youtube',whatsapp:'whatsapp',tiktok:'tiktok',spotify:'spotify',x:'x',twitter:'x'}
  if (informado !== 'site' && aliases[informado]) return aliases[informado]
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    if (hostname === 'music.apple.com') return 'apple_music'
    if (hostname === 'deezer.com' || hostname.endsWith('.deezer.com')) return 'deezer'
    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'linkedin'
    if (hostname === 'instagram.com') return 'instagram'
    if (hostname === 'youtube.com' || hostname === 'youtu.be') return 'youtube'
    if (hostname === 'facebook.com' || hostname === 'fb.com') return 'facebook'
    if (hostname === 'open.spotify.com') return 'spotify'
    if (hostname === 'tiktok.com') return 'tiktok'
    if (hostname === 'wa.me' || hostname === 'api.whatsapp.com') return 'whatsapp'
    if (hostname === 'x.com' || hostname === 'twitter.com') return 'x'
    if (hostname === 't.me' || hostname === 'telegram.me') return 'telegram'
    if (hostname === 'pinterest.com') return 'pinterest'
    if (hostname === 'threads.net' || hostname === 'threads.com') return 'threads'
  } catch { /* Não inferimos uma plataforma de uma URL inválida. */ }
  if (/^mailto:/i.test(url)) return 'email'
  return informado === 'email' ? 'email' : 'site'
}
function IconeLinkCard({tipo,url,tema}:{tipo:string;url:string;tema:TemaTokens}) {
  const rede = identificarRedeCard(tipo,url)
  const cores: Record<string,string> = {
    instagram:'#FF3493',facebook:'#69A4FF',youtube:'#FF4545',whatsapp:'#37DB87',
    tiktok:tema.mode === 'light' ? '#17171D' : '#FFFFFF',spotify:'#32DD81',x:tema.mode === 'light' ? '#18181E' : '#E8E8ED',linkedin:'#3396E7',
    apple_music:'#FA3B67',deezer:'#B974EF',telegram:'#53B5EA',pinterest:'#ED405B',
    twitch:'#B98AF5',threads:'#E2E2E2',email:tema.text,site:tema.accent
  }
  const cor = cores[rede] || tema.accent
  let simbolo: ReactNode
  switch (rede) {
    case 'linkedin': simbolo = <span style={{fontWeight:900,fontSize:16,letterSpacing:'-.07em'}}>in</span>;break
    case 'apple_music': simbolo = <span style={{fontWeight:900,fontSize:24,lineHeight:1}}>♫</span>;break
    case 'deezer': simbolo = <svg width="22" height="20" viewBox="0 0 22 20" aria-hidden="true"><path fill="#FFBE48" d="M1 15h4v4H1zM1 10h4v4H1z"/><path fill="#FF647C" d="M6 15h4v4H6zM6 10h4v4H6zM6 5h4v4H6z"/><path fill="#B47EFF" d="M11 15h4v4h-4zM11 10h4v4h-4zM11 5h4v4h-4z"/><path fill="#58CCF2" d="M16 15h4v4h-4zM16 10h4v4h-4zM16 5h4v4h-4zM16 0h4v4h-4z"/></svg>;break
    case 'telegram': simbolo = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="m21 3-3.1 18-6.1-5-3.5 3 .6-4.7L21 3 3 10.8l5.3 2.1"/></svg>;break
    case 'pinterest': simbolo = <span style={{fontSize:23,fontWeight:900,fontFamily:'Georgia,serif'}}>P</span>;break
    case 'twitch': simbolo = <span style={{fontSize:22,fontWeight:900}}>▣</span>;break
    case 'threads': simbolo = <span style={{fontSize:23,fontWeight:900}}>@</span>;break
    case 'email': simbolo = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/></svg>;break
    case 'site': simbolo = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/></svg>;break
    default: simbolo = <IconeRede tipo={rede}/>;
  }
  return <span aria-hidden="true" style={{display:'grid',placeItems:'center',width:37,height:37,flex:'0 0 37px',border:`1px solid ${tema.cardBorder}`,borderRadius:11,background:tema.surface2,color:cor}}>{simbolo}</span>
}

function SectionLinks({links,tema,title}:{links:Props['links'];tema:TemaTokens;title:string}) {
  if (!links.length) return null
  return <section style={{textAlign:'left'}}>
    <div style={{textAlign:'center',fontSize:11,fontWeight:850,textTransform:'uppercase',letterSpacing:'.08em',color:tema.textMuted,margin:'11px 0 14px'}}>{title}</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {links.map(l=><div key={l.id} style={{background:tema.card,border:`1px solid ${tema.cardBorder}`,borderRadius:16,padding:'10px 11px',minHeight:61,color:tema.text,fontSize:12,fontWeight:800,overflowWrap:'anywhere',display:'flex',alignItems:'center',justifyContent:'space-between',gap:9}}>
        <span style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1}}><IconeLinkCard tipo={l.tipo} url={l.url} tema={tema}/><span style={{minWidth:0,overflowWrap:'anywhere'}}>{l.titulo}</span></span>
        <span aria-hidden="true" style={{color:tema.accent,fontSize:19,fontWeight:700,flexShrink:0}}>›</span>
      </div>)}
    </div>
  </section>
}

function Galeria({media,tema,title,empty,footer,layout,onLayoutChange,idioma}:{media:Midia[];tema:TemaTokens;title:string;empty:string;footer:string;layout:'grade'|'carrossel';onLayoutChange:(v:'grade'|'carrossel')=>void;idioma:Idioma}) {
  const opcoes:Record<Idioma,[string,string]> = {
    'pt-BR':['Grade','Carrossel'],'en-US':['Grid','Carousel'],'es-ES':['Cuadrícula','Carrusel'],
    'fr-FR':['Grille','Carrousel'],'de-DE':['Raster','Karussell'],'it-IT':['Griglia','Carosello']
  }
  return <section style={{marginTop:17,textAlign:'left'}} aria-label={title}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:5,marginBottom:9,flexWrap:'wrap'}}>
      <div style={{fontSize:12,fontWeight:850,color:tema.text}}>{title} {media.length>0&&<span style={{fontWeight:600,opacity:.7}}>({media.length})</span>}</div>
      <div role="group" aria-label="Formato da galeria" style={{display:'flex',gap:3}}>
        {(['grade','carrossel'] as const).map((tipo,i)=><button key={tipo} type="button" aria-pressed={layout===tipo} onClick={()=>onLayoutChange(tipo)} style={{fontSize:9,fontWeight:750,color:tema.text,cursor:'pointer',padding:'5px 7px',borderRadius:7,border:`1px solid ${tema.cardBorder}`,background:layout===tipo?tema.card:tema.surface2}}>{opcoes[idioma][i]}</button>)}
      </div>
    </div>
    {media.length>0 ?
      <div style={layout==='grade'?{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:5}:{display:'flex',gap:7,overflowX:'auto',scrollSnapType:'x mandatory',paddingBottom:5}}>
        {media.map(m=><div key={m.id} style={{position:'relative',aspectRatio:'1',overflow:'hidden',borderRadius:9,background:tema.card,border:`1px solid ${tema.cardBorder}`,...(layout==='carrossel'?{flex:'0 0 72%',scrollSnapAlign:'start'}:{})}}>
          {safeImage(m.imagem)?<img src={m.imagem} alt={m.legenda||'Instagram'} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:10,padding:7,color:tema.text}}>Instagram</div>}
          {m.tipo.toUpperCase()==='VIDEO'&&<span style={{position:'absolute',bottom:3,right:3,background:'rgba(0,0,0,.7)',padding:4,borderRadius:4,color:'#FFF'}}><Play size={12}/></span>}
        </div>)}
      </div>
      :<div style={{fontSize:11,border:`1px dashed ${tema.border}`,padding:10,borderRadius:9,color:tema.textMuted}}>{empty}</div>
    }
    <p style={{fontSize:9,color:tema.textMuted,lineHeight:1.4,margin:'8px 0 0'}}>{footer}</p>
  </section>
}

// Os players são carregados somente depois do clique. IDs e destinos são validados.
function spotifyEmbedUrl(raw: string): string | undefined {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' || u.hostname !== 'open.spotify.com') return undefined
    const segments = u.pathname.split('/').filter(Boolean)
    if (/^intl-[a-z]{2}(?:-[a-z]{2})?$/i.test(segments[0]||'')) segments.shift()
    const [kind,id] = segments
    if (!['track','album','artist','playlist','episode','show'].includes(kind) || !/^[a-zA-Z0-9]{22}$/.test(id||'')) return undefined
    return `https://open.spotify.com/embed/${kind}/${id}`
  } catch { return undefined }
}
function nomeDaRede(tipo: string): string {
  return ({instagram:'Instagram',facebook:'Facebook',youtube:'YouTube',whatsapp:'WhatsApp',tiktok:'TikTok',spotify:'Spotify',x:'X',site:'Website'} as Record<string,string>)[tipo] || tipo
}
function IconeRede({tipo}:{tipo:string}) {
  if (tipo==='instagram') return <Instagram size={17}/>
  if (tipo==='youtube') return <Youtube size={18} color="#FF4141"/>
  if (tipo==='spotify') return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#38D16C" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 9c6-2 12-1 17 2M5 13c5-2 10-1 14 2M6 17c4-1 8-1 11 1"/></svg>
  if (tipo==='whatsapp') return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4FE49A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.7 8.7 0 0 1-12.7 7.7L3 21l1.8-5.1A8.6 8.6 0 1 1 21 11.5Z"/><path d="M8 8.5c.6 3.5 2.5 5.6 6 7l2-1.7"/></svg>
  if (tipo==='facebook') return <span aria-hidden="true" style={{fontWeight:900,fontSize:20,color:'#6EA5FF'}}>f</span>
  if (tipo==='tiktok') return <span aria-hidden="true" style={{fontSize:20}}>♪</span>
  if (tipo==='x') return <span aria-hidden="true" style={{fontSize:17,fontWeight:800}}>𝕏</span>
  return <span aria-hidden="true" style={{fontSize:19}}>⊕</span>
}
function YouTubeCard({video,tema,reproduzindo,onPlay,compact=false}:{video:VideoYoutube;tema:TemaTokens;reproduzindo:boolean;onPlay:()=>void;compact?:boolean}) {
  const id = /^[a-zA-Z0-9_-]{11}$/.test(video.videoId) ? video.videoId : null
  const thumb = safeImage(video.miniatura)
  return <div style={{background:tema.card,border:`1px solid ${tema.cardBorder}`,borderRadius:12,overflow:'hidden'}}>
    <div style={{aspectRatio:formatoYoutube(video.url)==='9:16'?'9/16':'16/9',position:'relative',background:'#111',overflow:'hidden'}}>
      {id && reproduzindo ? <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`} title={video.titulo} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{width:'100%',height:'100%',border:0}}/> :
      <button type="button" disabled={!id} onClick={onPlay} aria-label={`Reproduzir ${video.titulo}`} style={{display:'block',width:'100%',height:'100%',border:0,background:'#111',padding:0,cursor:id?'pointer':'not-allowed',color:'#FFF',position:'relative'}}>
        {thumb && <img src={thumb} alt="" loading="lazy" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
        <span title="YouTube" aria-hidden="true" style={{position:'absolute',top:compact?6:10,left:compact?6:10,display:'grid',placeItems:'center',width:compact?24:34,height:compact?24:34,background:'#FFF',borderRadius:'50%',boxShadow:'0 1px 7px rgba(0,0,0,.3)'}}><Youtube size={compact?14:19} color="#FF0033"/></span>
        <span style={{position:'absolute',left:0,right:0,bottom:0,padding:compact?'22px 6px 7px':'35px 10px 11px',background:'linear-gradient(transparent,rgba(0,0,0,.90))',color:'#FFF',fontSize:compact?10:12,fontWeight:800,lineHeight:1.3,textAlign:'center'}}><span title={video.titulo} style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',overflowWrap:'anywhere'}}>{video.titulo}</span></span>
      </button>}
    </div>
  </div>
}
