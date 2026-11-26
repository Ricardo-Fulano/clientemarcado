export function reelUrl(value: unknown): string | null {
  try { const u=new URL(String(value)); if(u.protocol!=="https:"||!['instagram.com','www.instagram.com'].includes(u.hostname)||u.username||u.password||u.port)return null; const m=u.pathname.match(/^\/reel\/([A-Za-z0-9_-]{1,100})\/?$/); return m?`https://www.instagram.com/reel/${m[1]}/`:null } catch{return null}
}
export function formatoYoutube(url: string): '9:16'|'16:9' {
  try { const u=new URL(url); return ['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)&&/^\/shorts\/[A-Za-z0-9_-]{11}$/.test(u.pathname)?'9:16':'16:9' }catch{return '16:9'}
}
export function youtubeFormato(id:string,vertical:boolean):string {
  if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw Error('INVALID_VIDEO');return vertical?`https://www.youtube.com/shorts/${id}`:`https://www.youtube.com/watch?v=${id}`
}
export const textoVertical = {
 'pt-BR':{banner:'Escolher banner',none:'Manter banner atual',reels:'Selecionar Reels',short:'Exibir como Shorts (vertical)',normal:'Vídeo horizontal',profile:'Importar foto de perfil',reelCount:'Reels adicionados',vertical:'Vídeos verticais'},
 'en-US':{banner:'Choose banner',none:'Keep current banner',reels:'Select Reels',short:'Display as Shorts (vertical)',normal:'Horizontal video',profile:'Import profile photo',reelCount:'Reels added',vertical:'Vertical videos'},
 'es-ES':{banner:'Elegir portada',none:'Mantener portada actual',reels:'Seleccionar Reels',short:'Mostrar como Shorts (vertical)',normal:'Vídeo horizontal',profile:'Importar foto de perfil',reelCount:'Reels añadidos',vertical:'Vídeos verticales'},
 'fr-FR':{banner:'Choisir la couverture',none:'Conserver la couverture',reels:'Sélectionner les Reels',short:'Afficher comme Shorts (vertical)',normal:'Vidéo horizontale',profile:'Importer la photo de profil',reelCount:'Reels ajoutés',vertical:'Vidéos verticales'},
 'de-DE':{banner:'Titelbild wählen',none:'Aktuelles Titelbild behalten',reels:'Reels auswählen',short:'Als Shorts anzeigen (vertikal)',normal:'Horizontales Video',profile:'Profilfoto importieren',reelCount:'Reels hinzugefügt',vertical:'Vertikale Videos'},
 'it-IT':{banner:'Scegli copertina',none:'Mantieni copertina attuale',reels:'Seleziona Reels',short:'Mostra come Shorts (verticale)',normal:'Video orizzontale',profile:'Importa foto profilo',reelCount:'Reels aggiunti',vertical:'Video verticali'},
} as const
export function verticalCopy(lang:string){return textoVertical[lang as keyof typeof textoVertical]||textoVertical['pt-BR']}
