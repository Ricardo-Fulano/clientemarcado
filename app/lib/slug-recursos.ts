import type { Idioma } from './i18n-publico'
export const CARD_VERTICAL_WIDTH = 'clamp(88px, 38%, 190px)'
export const CARD_VERTICAL_RATIO = '9/16'
export function permiteInscricaoSlug(plano: unknown) { return ['loja','essencial','pro','equipe'].includes(String(plano || '').trim().toLowerCase()) }
export const COPY = {
 pt:['Audiência nas redes','seguidores','inscritos','Contagens públicas por plataforma; números sujeitos a atualização.','Seu e-mail','Inscrever-se','Aceito receber novidades desta página por e-mail.','Política de privacidade','Inscrição registrada!','Não foi possível registrar. Tente novamente.','Captar e-mails na página','Mostrar formulário entre a bio e os links. Os contatos aparecem em Leads capturados.','Disponível no Loja e Pro (Equipe legado).','Salvar','Configuração salva.','Não foi possível salvar.','Inscrição na MiniPage'],
 en:['Social audience','followers','subscribers','Public counts by platform; numbers may change.','Your email','Subscribe','I agree to receive email updates from this page.','Privacy policy','Subscribed!','Unable to subscribe. Try again.','Capture emails on the page','Show a form between the bio and links. Contacts appear in Captured leads.','Available on Store and Pro (legacy Team).','Save','Settings saved.','Unable to save.','MiniPage subscription'],
 es:['Audiencia en redes','seguidores','suscriptores','Cifras públicas por plataforma; pueden cambiar.','Tu correo','Suscribirme','Acepto recibir novedades de esta página por correo.','Política de privacidad','¡Suscripción registrada!','No se pudo registrar. Inténtalo de nuevo.','Captar correos en la página','Muestra un formulario entre la biografía y los enlaces. Los contactos aparecen en Leads.','Disponible en Tienda y Pro (Equipo antiguo).','Guardar','Configuración guardada.','No se pudo guardar.','Suscripción MiniPage'],
 fr:['Audience sur les réseaux','abonnés','abonnés','Chiffres publics par plateforme, susceptibles de changer.','Votre e-mail','S’abonner','J’accepte de recevoir les actualités de cette page par e-mail.','Politique de confidentialité','Inscription enregistrée !','Impossible de vous inscrire. Réessayez.','Collecter les e-mails sur la page','Affiche un formulaire entre la bio et les liens. Les contacts apparaissent dans les prospects.','Disponible avec Boutique et Pro (ancienne formule Équipe).','Enregistrer','Paramètres enregistrés.','Impossible d’enregistrer.','Inscription MiniPage'],
 de:['Reichweite nach Netzwerk','Follower','Abonnenten','Öffentliche Zahlen je Plattform; Änderungen möglich.','Deine E-Mail','Abonnieren','Ich möchte Neuigkeiten dieser Seite per E-Mail erhalten.','Datenschutz','Anmeldung gespeichert!','Anmeldung fehlgeschlagen. Bitte erneut versuchen.','E-Mails auf der Seite erfassen','Formular zwischen Bio und Links anzeigen. Kontakte erscheinen unter Leads.','Verfügbar mit Shop und Pro (früher Team).','Speichern','Einstellungen gespeichert.','Speichern fehlgeschlagen.','MiniPage-Anmeldung'],
 it:['Pubblico sui social','follower','iscritti','Numeri pubblici per piattaforma; possono variare.','La tua e-mail','Iscriviti','Accetto di ricevere novità di questa pagina via e-mail.','Informativa sulla privacy','Iscrizione registrata!','Impossibile registrarsi. Riprova.','Raccogli e-mail nella pagina','Mostra un modulo tra bio e link. I contatti appaiono nei lead.','Disponibile con Negozio e Pro (vecchio Team).','Salva','Impostazioni salvate.','Impossibile salvare.','Iscrizione MiniPage']
} as const
export function copySlug(idioma: Idioma) { return COPY[idioma] || COPY.pt }
export type RedeAudiencia={rede:'Instagram'|'YouTube';nome:string;url:string;quantidade:number;consultadoEm:number}
export function fontesAudiencia(instagram: unknown, links: unknown[]) {
 let ig='', yt='';
 for(const [i,raw] of [instagram,...links].entries()) {
  if(typeof raw!=='string'||raw.length>250)continue
  const v=raw.trim();
  if(i===0 && /^@?[a-zA-Z0-9._]{1,30}$/.test(v)){const handle=v.replace(/^@/,'').toLowerCase();if(!/^\.+$/.test(handle)&&!/^(p|reel|reels|stories|explore|accounts|direct|tv|about)$/.test(handle))ig=handle;continue}
  try {const u=new URL(v);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)continue;const h=u.hostname.toLowerCase().replace(/^www\./,'');const p=u.pathname.split('/').filter(Boolean);
   if(!ig&&h==='instagram.com'&&p.length===1&&/^[a-zA-Z0-9._]{1,30}$/.test(p[0])&&!/^(p|reel|reels|stories|explore|accounts|direct|tv|about)$/i.test(p[0]))ig=p[0].toLowerCase();
   if(!yt&&['youtube.com','m.youtube.com'].includes(h)){if(p.length===1&&/^@[a-zA-Z0-9._-]{3,30}$/.test(p[0]))yt=p[0];else if(p.length===2&&p[0]==='channel'&&/^UC[a-zA-Z0-9_-]{22}$/.test(p[1]))yt=p[1]}
  }catch{}
 }
 return {ig,yt}
}

// Um único número no botão; as demais fontes ficam nos detalhes, sem agregação.
export function destaqueAudiencia(redes: readonly Pick<RedeAudiencia,'rede'|'quantidade'>[], idioma: Idioma) {
 const validas=redes.filter(r=>Number.isSafeInteger(r.quantidade)&&r.quantidade>=0)
 const principal=validas.find(r=>r.rede==='Instagram')||validas.find(r=>r.rede==='YouTube')
 if(!principal)return ''
 const locale={pt:'pt-BR',en:'en-US',es:'es-ES',fr:'fr-FR',de:'de-DE',it:'it-IT'}[idioma]||'pt-BR'
 const t=copySlug(idioma)
 return `${principal.quantidade.toLocaleString(locale)} ${principal.rede==='Instagram'?t[1]:t[2]}`
}
