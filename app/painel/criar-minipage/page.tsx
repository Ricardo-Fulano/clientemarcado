'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useIdiomaGlobal } from '../../components/IdiomaProviderGlobal'
import { obterLimiteModelosCor, obterLimiteLinksRapidos, obterLimiteVideos, permiteDestaques, podeUsarCatalogo, permiteVideos, permiteAlbuns } from '../../lib/planos'
import { TEMAS_MINIPAGE } from '../../lib/temasMiniPage'
import { getTema } from '../../lib/tema-publico'
import ThemePreviewCard from '../../components/ThemePreviewCard'
import PreviewInstagramPremium from './PreviewInstagramPremium'
import { obterTextosPrevisao } from './textos-previsao'
import SmartMediaLookup from '../../components/SmartMediaLookup'
import SpotifyBuscaCatalogo from './SpotifyBuscaCatalogo'
import GuiaPlanosOnboarding, { type PlanoEscolhivel } from './GuiaPlanosOnboarding'
import { PLATAFORMAS_LINK, labelPlataforma, placeholderPlataforma, normalizarInstagram, normalizarFacebook } from '../../lib/plataformasLinks'

// IMPORTANTE: "Pular por agora" foi removido (Parte 2A) - a unica forma de liberar o painel
// agora e concluir o onboarding de verdade. O nome da chave abaixo continua o mesmo por
// seguranca (evita invalidar contas que ja testaram/concluiram o onboarding antes desta
// mudanca), mas o SIGNIFICADO mudou: agora ela so e gravada quando o onboarding e
// REALMENTE concluido (nunca mais por um atalho de "pular").
function chaveOnboarding(userId: string) {
  return `minipage_onboarding_visto_${userId}`
}

const G = '#C9FA45'
const TEXTOS_ASSISTENTE = {
  "pt-BR": {
    "introTitle": "Vamos colocar sua MiniPage no ar",
    "introSub": "Comece com seu nome e endereço. Depois você poderá mudar ou adicionar conteúdos.",
    "addPhoto": "Adicionar foto",
    "displayName": "Nome exibido",
    "pageLink": "Link da sua página",
    "shortBio": "Bio curta",
    "whatsappOptional": "WhatsApp (opcional)",
    "instagramOptional": "Instagram (opcional)",
    "continue": "Continuar",
    "chooseStyle": "Escolha um estilo",
    "chooseStyleSub": "Você pode trocar isso quando quiser em Aparência.",
    "back": "← Voltar",
    "previewTitle": "SUA MINIPAGE GANHANDO VIDA",
    "previewSub": "As alterações aparecem aqui imediatamente, antes de publicar.",
    "previewToggle": "Ver minha MiniPage enquanto crio",
    "previewName": "Seu nome ou negócio",
    "previewBio": "Conte ao mundo o que você faz.",
    "previewEmpty": "Seus contatos e links aparecerão aqui conforme você os adicionar.",
    "previewDisclaimer": "Prévia ilustrativa · a página publicada pode variar conforme o tema",
    "linksTitle": "Adicione seus links",
    "linksSub": "WhatsApp, Instagram, site... adicione quantos quiser, dentro do limite do seu plano. Isso é opcional.",
    "remove": "Remover",
    "addLink": "Adicionar link",
    "slugAvailable": "Este endereço parece disponível. Será confirmado ao salvar.",
    "goalTitle": "Para que você quer sua MiniPage?",
    "goalSub": "Isso ajuda a começar. Você pode mudar tudo depois.",
    "goalPersonal": "Pessoal",
    "goalPersonalDesc": "Compartilhar contatos e redes",
    "goalCreator": "Criador de conteúdo",
    "goalCreatorDesc": "Reunir vídeos e conteúdo",
    "goalBusiness": "Negócio ou marca",
    "goalBusinessDesc": "Mostrar serviços e produtos",
    "importTitle": "Cole um link para adicionar mais rápido",
    "importButton": "Adicionar da URL",
    "importPlaceholder": "Cole um link do Instagram, YouTube, TikTok ou site",
    "invalidUrl": "Endereço inválido. Use um link https:// válido.",
    "limitReached": "Você atingiu o limite de links do plano.",
    "duplicateUrl": "Este endereço já foi adicionado.",
    "unknownUrl": "Não foi possível reconhecer este link. Você pode adicioná-lo manualmente.",
    "platformLabel": "Escolha a plataforma",
    "profileOrUrl": "Perfil ou link",
    "profilePlaceholder": "Informe @usuario, telefone com DDI ou link",
    "phoneCodeError": "O número deve incluir o código internacional, como +55 ou +595.",
    "stepLabel": "Etapa",
  },
  "en-US": {
    "introTitle": "Let’s get your MiniPage online",
    "introSub": "Start with your name and address. You can update everything later.",
    "addPhoto": "Add photo",
    "displayName": "Display name",
    "pageLink": "Your page link",
    "shortBio": "Short bio",
    "whatsappOptional": "WhatsApp (optional)",
    "instagramOptional": "Instagram (optional)",
    "continue": "Continue",
    "chooseStyle": "Choose a style",
    "chooseStyleSub": "You can change this any time under Appearance.",
    "back": "← Back",
    "previewTitle": "YOUR MINIPAGE COMING TO LIFE",
    "previewSub": "Changes appear here instantly, before publishing.",
    "previewToggle": "Preview my MiniPage as I build",
    "previewName": "Your name or business",
    "previewBio": "Tell the world what you do.",
    "previewEmpty": "Your contacts and links will appear here as you add them.",
    "previewDisclaimer": "Illustrative preview · your published page may vary by theme",
    "linksTitle": "Add your links",
    "linksSub": "WhatsApp, Instagram, website… add as many as your plan allows. Optional.",
    "remove": "Remove",
    "addLink": "Add link",
    "slugAvailable": "This address seems available. Availability is confirmed when saved.",
    "goalTitle": "What will you use your MiniPage for?",
    "goalSub": "This helps you get started. You can change everything later.",
    "goalPersonal": "Personal",
    "goalPersonalDesc": "Share contacts and social profiles",
    "goalCreator": "Content creator",
    "goalCreatorDesc": "Share videos and content",
    "goalBusiness": "Business or brand",
    "goalBusinessDesc": "Show services and products",
    "importTitle": "Paste a link to add it faster",
    "importButton": "Add from URL",
    "importPlaceholder": "Paste an Instagram, YouTube, TikTok or website link",
    "invalidUrl": "Invalid address. Use a valid https:// link.",
    "limitReached": "You have reached your plan’s link limit.",
    "duplicateUrl": "This link has already been added.",
    "unknownUrl": "Could not recognize the link. You can add it manually.",
    "platformLabel": "Choose a platform",
    "profileOrUrl": "Profile or link",
    "profilePlaceholder": "Enter @username, international phone number or link",
    "phoneCodeError": "Include a country calling code, such as +1 or +595.",
    "stepLabel": "Step",
  },
  "es-ES": {
    "introTitle": "Vamos a poner tu MiniPage en línea",
    "introSub": "Empieza con tu nombre y dirección. Podrás cambiarlo todo después.",
    "addPhoto": "Añadir foto",
    "displayName": "Nombre visible",
    "pageLink": "Enlace de tu página",
    "shortBio": "Biografía corta",
    "whatsappOptional": "WhatsApp (opcional)",
    "instagramOptional": "Instagram (opcional)",
    "continue": "Continuar",
    "chooseStyle": "Elige un estilo",
    "chooseStyleSub": "Puedes cambiarlo cuando quieras en Apariencia.",
    "back": "← Volver",
    "previewTitle": "TU MINIPAGE COBRA VIDA",
    "previewSub": "Los cambios aparecen aquí al instante, antes de publicar.",
    "previewToggle": "Ver mi MiniPage mientras la creo",
    "previewName": "Tu nombre o negocio",
    "previewBio": "Cuenta al mundo lo que haces.",
    "previewEmpty": "Tus contactos y enlaces aparecerán aquí cuando los añadas.",
    "previewDisclaimer": "Vista previa ilustrativa · la página publicada puede variar según el tema",
    "linksTitle": "Añade tus enlaces",
    "linksSub": "WhatsApp, Instagram, sitio web… añade tantos como permita tu plan. Opcional.",
    "remove": "Eliminar",
    "addLink": "Añadir enlace",
    "slugAvailable": "Esta dirección parece disponible. Se confirmará al guardar.",
    "goalTitle": "¿Para qué usarás tu MiniPage?",
    "goalSub": "Esto te ayudará a empezar. Podrás cambiarlo después.",
    "goalPersonal": "Personal",
    "goalPersonalDesc": "Compartir contactos y redes",
    "goalCreator": "Creador de contenido",
    "goalCreatorDesc": "Compartir videos y contenido",
    "goalBusiness": "Negocio o marca",
    "goalBusinessDesc": "Mostrar servicios y productos",
    "importTitle": "Pega un enlace para añadirlo rápido",
    "importButton": "Añadir desde URL",
    "importPlaceholder": "Pega un enlace de Instagram, YouTube, TikTok o un sitio web",
    "invalidUrl": "Dirección no válida. Usa un enlace https:// válido.",
    "limitReached": "Has llegado al límite de enlaces de tu plan.",
    "duplicateUrl": "Este enlace ya se ha añadido.",
    "unknownUrl": "No se pudo reconocer el enlace. Puedes añadirlo manualmente.",
    "platformLabel": "Elige la plataforma",
    "profileOrUrl": "Perfil o enlace",
    "profilePlaceholder": "Introduce @usuario, teléfono internacional o enlace",
    "phoneCodeError": "Incluye el código internacional, como +34 o +595.",
    "stepLabel": "Paso",
  },
  "fr-FR": {
    "introTitle": "Créons votre MiniPage",
    "introSub": "Commencez par votre nom et votre adresse. Vous pourrez tout modifier ensuite.",
    "addPhoto": "Ajouter une photo",
    "displayName": "Nom affiché",
    "pageLink": "Lien de votre page",
    "shortBio": "Bio courte",
    "whatsappOptional": "WhatsApp (facultatif)",
    "instagramOptional": "Instagram (facultatif)",
    "continue": "Continuer",
    "chooseStyle": "Choisissez un style",
    "chooseStyleSub": "Vous pourrez le modifier à tout moment dans Apparence.",
    "back": "← Retour",
    "previewTitle": "VOTRE MINIPAGE PREND VIE",
    "previewSub": "Vos changements apparaissent ici avant publication.",
    "previewToggle": "Voir ma MiniPage pendant sa création",
    "previewName": "Votre nom ou activité",
    "previewBio": "Dites au monde ce que vous faites.",
    "previewEmpty": "Vos contacts et liens apparaîtront ici au fur et à mesure.",
    "previewDisclaimer": "Aperçu illustratif · la page publiée peut varier selon le thème",
    "linksTitle": "Ajoutez vos liens",
    "linksSub": "WhatsApp, Instagram, site… ajoutez-en selon votre forfait. Facultatif.",
    "remove": "Supprimer",
    "addLink": "Ajouter un lien",
    "slugAvailable": "Cette adresse semble disponible. Confirmation lors de l’enregistrement.",
    "goalTitle": "Pourquoi créer votre MiniPage ?",
    "goalSub": "Cela vous aide à démarrer. Vous pourrez tout changer ensuite.",
    "goalPersonal": "Personnel",
    "goalPersonalDesc": "Partager contacts et réseaux",
    "goalCreator": "Créateur de contenu",
    "goalCreatorDesc": "Partager vidéos et contenus",
    "goalBusiness": "Entreprise ou marque",
    "goalBusinessDesc": "Présenter services et produits",
    "importTitle": "Collez un lien pour l’ajouter rapidement",
    "importButton": "Ajouter depuis une URL",
    "importPlaceholder": "Collez un lien Instagram, YouTube, TikTok ou un site",
    "invalidUrl": "Adresse invalide. Utilisez une URL https:// valide.",
    "limitReached": "Vous avez atteint la limite de liens de votre forfait.",
    "duplicateUrl": "Ce lien a déjà été ajouté.",
    "unknownUrl": "Lien non reconnu. Vous pouvez l’ajouter manuellement.",
    "platformLabel": "Choisissez la plateforme",
    "profileOrUrl": "Profil ou lien",
    "profilePlaceholder": "Saisissez @utilisateur, un numéro international ou un lien",
    "phoneCodeError": "Incluez l’indicatif du pays, par exemple +33 ou +595.",
    "stepLabel": "Étape",
  },
  "de-DE": {
    "introTitle": "Bringen wir deine MiniPage online",
    "introSub": "Beginne mit deinem Namen und deiner Adresse. Du kannst später alles ändern.",
    "addPhoto": "Foto hinzufügen",
    "displayName": "Anzeigename",
    "pageLink": "Dein Seitenlink",
    "shortBio": "Kurzbiografie",
    "whatsappOptional": "WhatsApp (optional)",
    "instagramOptional": "Instagram (optional)",
    "continue": "Weiter",
    "chooseStyle": "Wähle einen Stil",
    "chooseStyleSub": "Du kannst ihn jederzeit unter Darstellung ändern.",
    "back": "← Zurück",
    "previewTitle": "DEINE MINIPAGE ENTSTEHT",
    "previewSub": "Änderungen erscheinen hier sofort vor der Veröffentlichung.",
    "previewToggle": "MiniPage beim Erstellen ansehen",
    "previewName": "Dein Name oder Unternehmen",
    "previewBio": "Zeige der Welt, was du machst.",
    "previewEmpty": "Deine Kontakte und Links erscheinen hier beim Hinzufügen.",
    "previewDisclaimer": "Beispielvorschau · die veröffentlichte Seite kann abweichen",
    "linksTitle": "Füge deine Links hinzu",
    "linksSub": "WhatsApp, Instagram, Website… entsprechend deinem Tarif. Optional.",
    "remove": "Entfernen",
    "addLink": "Link hinzufügen",
    "slugAvailable": "Diese Adresse scheint verfügbar. Bestätigung beim Speichern.",
    "goalTitle": "Wofür möchtest du deine MiniPage nutzen?",
    "goalSub": "Das hilft beim Start. Du kannst später alles ändern.",
    "goalPersonal": "Privat",
    "goalPersonalDesc": "Kontakte und Social Media teilen",
    "goalCreator": "Content Creator",
    "goalCreatorDesc": "Videos und Inhalte teilen",
    "goalBusiness": "Unternehmen oder Marke",
    "goalBusinessDesc": "Produkte und Leistungen zeigen",
    "importTitle": "Füge einen Link schneller per URL hinzu",
    "importButton": "Aus URL hinzufügen",
    "importPlaceholder": "Instagram-, YouTube-, TikTok- oder Website-Link einfügen",
    "invalidUrl": "Ungültige Adresse. Bitte einen gültigen https://-Link verwenden.",
    "limitReached": "Du hast das Link-Limit deines Tarifs erreicht.",
    "duplicateUrl": "Dieser Link wurde bereits hinzugefügt.",
    "unknownUrl": "Link nicht erkannt. Du kannst ihn manuell hinzufügen.",
    "platformLabel": "Plattform wählen",
    "profileOrUrl": "Profil oder Link",
    "profilePlaceholder": "@Benutzername, internationale Telefonnummer oder Link",
    "phoneCodeError": "Eine internationale Vorwahl ist nötig, z. B. +49 oder +595.",
    "stepLabel": "Schritt",
  },
  "it-IT": {
    "introTitle": "Mettiamo online la tua MiniPage",
    "introSub": "Inizia dal nome e dall’indirizzo. Potrai modificare tutto in seguito.",
    "addPhoto": "Aggiungi foto",
    "displayName": "Nome visualizzato",
    "pageLink": "Link della pagina",
    "shortBio": "Breve bio",
    "whatsappOptional": "WhatsApp (facoltativo)",
    "instagramOptional": "Instagram (facoltativo)",
    "continue": "Continua",
    "chooseStyle": "Scegli uno stile",
    "chooseStyleSub": "Puoi cambiarlo quando vuoi in Aspetto.",
    "back": "← Indietro",
    "previewTitle": "LA TUA MINIPAGE PRENDE FORMA",
    "previewSub": "Le modifiche appaiono subito qui, prima della pubblicazione.",
    "previewToggle": "Visualizza la MiniPage mentre la crei",
    "previewName": "Il tuo nome o attività",
    "previewBio": "Racconta al mondo cosa fai.",
    "previewEmpty": "I tuoi contatti e link appariranno qui man mano.",
    "previewDisclaimer": "Anteprima illustrativa · la pagina pubblicata può variare",
    "linksTitle": "Aggiungi i tuoi link",
    "linksSub": "WhatsApp, Instagram, sito… aggiungi i link consentiti dal piano. Facoltativo.",
    "remove": "Rimuovi",
    "addLink": "Aggiungi link",
    "slugAvailable": "Questo indirizzo sembra disponibile. Conferma al salvataggio.",
    "goalTitle": "Come userai la tua MiniPage?",
    "goalSub": "Questo ti aiuta a iniziare. Potrai cambiare tutto dopo.",
    "goalPersonal": "Personale",
    "goalPersonalDesc": "Condividere contatti e social",
    "goalCreator": "Creatore di contenuti",
    "goalCreatorDesc": "Condividere video e contenuti",
    "goalBusiness": "Attività o marchio",
    "goalBusinessDesc": "Presentare servizi e prodotti",
    "importTitle": "Incolla un link per aggiungerlo subito",
    "importButton": "Aggiungi da URL",
    "importPlaceholder": "Incolla un link di Instagram, YouTube, TikTok o un sito",
    "invalidUrl": "Indirizzo non valido. Usa un URL https:// valido.",
    "limitReached": "Hai raggiunto il limite di link del piano.",
    "duplicateUrl": "Questo link è già stato aggiunto.",
    "unknownUrl": "Link non riconosciuto. Puoi aggiungerlo manualmente.",
    "platformLabel": "Scegli la piattaforma",
    "profileOrUrl": "Profilo o link",
    "profilePlaceholder": "Inserisci @utente, telefono internazionale o link",
    "phoneCodeError": "Includi il prefisso internazionale, ad esempio +39 o +595.",
    "stepLabel": "Passaggio",
  }
} as const


// D2: respostas da rota de aplicacao do modelo que NAO sao falha tecnica (a recusa e esperada ou nao se resolve tentando de novo):
// o onboarding conclui normalmente, sem modelo. Qualquer outra resposta (rede, 5xx, erro inesperado) oferece "Tentar de novo".
const RECUSAS_ESPERADAS_MODELO = [
  'TEMPLATE_INDISPONIVEL', 'TEMPLATE_NAO_ENCONTRADO', 'PLANO_INCOMPATIVEL', 'STATUS_NAO_ATIVO', 'CONTA_JA_TEM_CONTEUDO',
  'CONTA_ANTERIOR_AO_MODELO', 'MODELO_VAZIO', 'MODULO_NAO_SUPORTADO', 'USUARIO_E_A_PROPRIA_FONTE', 'PERFIL_NAO_ENCONTRADO',
]

function montarLinkWhatsapp(valor: string) {
  const v = (valor || '').trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const somenteDigitos = v.replace(/\D/g, '')
  const temLetra = /[a-zA-Z]/.test(v)
  if (temLetra) return `https://wa.me/${v.replace('@', '').trim()}`
  if (somenteDigitos) return `https://wa.me/${somenteDigitos.startsWith('55') ? somenteDigitos : `55${somenteDigitos}`}`
  return v
}

const TEXTOS_CANAIS: Record<string,{heading:string,sub:string,prompt:string,selected:string,warning:string,proceed:string,choose:string,free:string,upgrade:string,complete:string}> = {
 'pt-BR':{heading:'Onde as pessoas podem encontrar você?',sub:'Escolha suas redes e contatos. Adicione os endereços logo abaixo.',prompt:'Toque para adicionar',selected:'Canais escolhidos',warning:'Sua página tem poucos contatos. Inclua mais uma rede para facilitar que encontrem você.',proceed:'Continuar mesmo assim',choose:'Selecione seus canais',free:'Continuar no Free',upgrade:'Ver planos pagos',complete:'Sua MiniPage já está publicada. Você pode crescer quando quiser.'},
 'en-US':{heading:'Where can people find you?',sub:'Select social networks and contacts, then add each address below.',prompt:'Tap to add',selected:'Selected channels',warning:'Your page has few contacts. Add another way to reach you.',proceed:'Continue anyway',choose:'Select your channels',free:'Continue with Free',upgrade:'View paid plans',complete:'Your MiniPage is published. Upgrade whenever you want.'},
 'es-ES':{heading:'¿Dónde pueden encontrarte?',sub:'Elige redes y contactos y añade las direcciones abajo.',prompt:'Toca para añadir',selected:'Canales elegidos',warning:'Tu página tiene pocos contactos. Añade otra forma de encontrarte.',proceed:'Continuar de todos modos',choose:'Elige tus canales',free:'Seguir con Free',upgrade:'Ver planes de pago',complete:'Tu MiniPage está publicada. Mejora tu plan cuando quieras.'},
 'fr-FR':{heading:'Où peut-on vous trouver ?',sub:'Choisissez vos réseaux et contacts, puis ajoutez les adresses.',prompt:'Touchez pour ajouter',selected:'Canaux sélectionnés',warning:'Votre page comporte peu de contacts. Ajoutez un autre moyen de vous joindre.',proceed:'Continuer quand même',choose:'Choisissez vos canaux',free:'Rester sur Free',upgrade:'Voir les offres payantes',complete:'Votre MiniPage est publiée. Passez à une offre supérieure quand vous voulez.'},
 'de-DE':{heading:'Wo kann man dich finden?',sub:'Wähle Netzwerke und Kontakte und füge unten die Adressen hinzu.',prompt:'Zum Hinzufügen tippen',selected:'Ausgewählte Kanäle',warning:'Deine Seite hat noch wenige Kontakte. Füge eine weitere Möglichkeit hinzu.',proceed:'Trotzdem fortfahren',choose:'Wähle Kanäle',free:'Free behalten',upgrade:'Bezahlpläne ansehen',complete:'Deine MiniPage ist veröffentlicht. Upgrade jederzeit möglich.'},
 'it-IT':{heading:'Dove possono trovarti?',sub:'Scegli social e contatti, poi inserisci gli indirizzi.',prompt:'Tocca per aggiungere',selected:'Canali selezionati',warning:'La pagina ha pochi contatti. Aggiungi un altro modo per trovarti.',proceed:'Continua comunque',choose:'Scegli i canali',free:'Continua con Free',upgrade:'Scopri i piani a pagamento',complete:'La tua MiniPage è pubblicata. Puoi passare a un altro piano quando vuoi.'}
}
type LinkForm = { id: string; tipo: string; titulo: string; url: string; descricao: string }
type YoutubeImportItem = { videoId: string; titulo: string; miniatura: string; url: string }
const TEXTOS_IMPORT_IG = {
  "pt-BR": {
    "title": "Importe seu Instagram em poucos passos",
    "explainer": "Traga sua foto, nome, bio e publicações sem preencher tudo manualmente. Para importar, conecte uma conta profissional (Criador ou Empresa). Você escolhe o que usar; nada é publicado automaticamente.",
    "connecting": "Conectando...",
    "connect": "Conectar meu Instagram",
    "apply": "Usar nome, foto e bio do Instagram",
    "applied": "✓ Dados aplicados — você pode editar abaixo",
    "media": "Selecione as fotos que deseja adicionar a Álbuns / Fotos. Ao concluir, as fotos serão importadas se seu plano permitir. Vídeos e Reels ainda não são adicionados a álbuns.",
    "post": "Ver publicação"
  },
  "en-US": {
    "title": "Import my Instagram",
    "explainer": "Connect a professional account (Creator or Business). Meta may provide your name, picture, bio, followers and posts. Nothing changes until you confirm.",
    "connecting": "Connecting...",
    "connect": "Connect official Instagram",
    "apply": "Use Instagram name, photo and bio",
    "applied": "✓ Applied — you can edit below",
    "media": "Preview of real posts found. Publishing to the gallery requires a separate permissions check for your plan.",
    "post": "Open post"
  },
  "es-ES": {
    "title": "Importar mi Instagram",
    "explainer": "Conecta una cuenta profesional (Creador o Empresa). Meta puede proporcionar nombre, foto, biografía, seguidores y publicaciones. Nada cambia sin tu confirmación.",
    "connecting": "Conectando...",
    "connect": "Conectar Instagram oficial",
    "apply": "Usar nombre, foto y biografía",
    "applied": "✓ Aplicado — puedes editar abajo",
    "media": "Vista previa de publicaciones reales. La galería pública requiere una revisión de permisos según el plan.",
    "post": "Ver publicación"
  },
  "fr-FR": {
    "title": "Importer mon Instagram",
    "explainer": "Connectez un compte professionnel (Créateur ou Entreprise). Meta peut fournir le nom, la photo, la bio, les abonnés et les publications. Rien ne change sans confirmation.",
    "connecting": "Connexion...",
    "connect": "Connecter Instagram officiel",
    "apply": "Utiliser le nom, la photo et la bio",
    "applied": "✓ Appliqué — modifiable ci-dessous",
    "media": "Aperçu des publications réelles. La galerie publique nécessite une vérification des autorisations selon le forfait.",
    "post": "Voir la publication"
  },
  "de-DE": {
    "title": "Mein Instagram importieren",
    "explainer": "Verbinde ein professionelles Konto (Creator oder Unternehmen). Meta kann Name, Foto, Bio, Follower und Beiträge bereitstellen. Änderungen werden erst nach deiner Bestätigung übernommen.",
    "connecting": "Verbindung...",
    "connect": "Instagram verbinden",
    "apply": "Name, Foto und Bio übernehmen",
    "applied": "✓ Übernommen — unten bearbeitbar",
    "media": "Vorschau echter Beiträge. Die öffentliche Galerie benötigt eine separate Berechtigungsprüfung für deinen Tarif.",
    "post": "Beitrag öffnen"
  },
  "it-IT": {
    "title": "Importa il mio Instagram",
    "explainer": "Collega un account professionale (Creator o Azienda). Meta può fornire nome, foto, bio, follower e post. Nulla cambia senza la tua conferma.",
    "connecting": "Collegamento...",
    "connect": "Collega Instagram ufficiale",
    "apply": "Usa nome, foto e bio",
    "applied": "✓ Applicato — puoi modificare sotto",
    "media": "Anteprima dei post reali. La galleria pubblica richiede una verifica dei permessi del piano.",
    "post": "Apri post"
  }
} as const
const TEXTOS_CAPA_INSTAGRAM = {
  'pt-BR': {choose:'Usar como capa', chosen:'Capa escolhida', hint:'Na prévia Premium, escolha uma publicação do Instagram como capa. Para trocar a foto ou enviar um banner depois, use Painel → Perfil → Aparência.'},
  'en-US': {choose:'Use as cover', chosen:'Selected cover', hint:'Choose an Instagram post for your Premium cover preview. To replace it or upload a banner later, use Dashboard → Profile → Appearance.'},
  'es-ES': {choose:'Usar como portada', chosen:'Portada elegida', hint:'Elige una publicación de Instagram como portada Premium. Para cambiarla o subir un banner después, ve a Panel → Perfil → Apariencia.'},
  'fr-FR': {choose:'Utiliser en couverture', chosen:'Couverture choisie', hint:'Choisissez une publication Instagram comme couverture Premium. Pour la modifier ou importer une bannière, rendez-vous dans Tableau de bord → Profil → Apparence.'},
  'de-DE': {choose:'Als Titelbild nutzen', chosen:'Titelbild gewählt', hint:'Wähle einen Instagram-Beitrag als Premium-Titelbild. Danach kannst du es unter Dashboard → Profil → Darstellung ändern oder ein Banner hochladen.'},
  'it-IT': {choose:'Usa come copertina', chosen:'Copertina scelta', hint:'Scegli un post Instagram come copertina Premium. In seguito puoi cambiarla o caricare un banner in Pannello → Profilo → Aspetto.'}
} as const

type InstagramImportItem = {id:string;tipo:string;imagem:string;link:string;legenda:string}
type InstagramImportPerfil = {username:string;nome:string;bio:string;foto:string;seguidores:number|null}


export default function CriarMiniPage() {
  const { idioma } = useIdiomaGlobal()
  const ti = TEXTOS_IMPORT_IG[idioma] || TEXTOS_IMPORT_IG["pt-BR"]
  const capaTexto = TEXTOS_CAPA_INSTAGRAM[idioma as keyof typeof TEXTOS_CAPA_INSTAGRAM] || TEXTOS_CAPA_INSTAGRAM['pt-BR']
  const txt = TEXTOS_ASSISTENTE[idioma]
  const tc = TEXTOS_CANAIS[idioma] || TEXTOS_CANAIS['pt-BR']
  const tx = obterTextosPrevisao(idioma)
  const [carregando, setCarregando] = useState(true)
  const [userId, setUserId] = useState('')
  const [planoTipo, setPlanoTipo] = useState('free')
  const [slugOriginal, setSlugOriginal] = useState('')
  // O indice da etapa atual dentro da lista dinamica calculada a partir do plano (ver
  // etapasAtivas abaixo) - nao mais um numero fixo de 1 a 4, ja que o numero de etapas
  // varia por plano.
  const [etapaIndex, setEtapaIndex] = useState(0)
  // Escolha informativa: nao modifica plano_tipo nem inicia checkout.
  const [guiaPlanosAberto, setGuiaPlanosAberto] = useState(false)
  const [stripeDesejado,setStripeDesejado]=useState<{plano:'minipage'|'agenda'|'loja'|'essencial';ciclo:'mensal'|'anual';pais:string}|null>(null)
  const [planoDeInteresse, setPlanoDeInteresse] = useState<PlanoEscolhivel | null>(null)
  const [estadoInteresseHomolog, setEstadoInteresseHomolog] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [concluido, setConcluido] = useState(false)
  const [resumoFinal, setResumoFinal] = useState<string[]>([])
  const [previewMobileAberta, setPreviewMobileAberta] = useState(true)
  const [modoPrevia, setModoPrevia] = useState<'premium'|'free'>('premium')
  const [objetivo, setObjetivo] = useState<'pessoal' | 'criador' | 'negocio' | null>(null)
  const [urlRapida, setUrlRapida] = useState('')
  const [plataformaRapida, setPlataformaRapida] = useState('instagram')
  const [avisoUrlRapida, setAvisoUrlRapida] = useState('')
  const [confirmarPoucosLinks,setConfirmarPoucosLinks] = useState(false)
  const [conteudoAnterior, setConteudoAnterior] = useState(false)
  const [youtubeFonte, setYoutubeFonte] = useState('')
  const [youtubeConsultando, setYoutubeConsultando] = useState(false)
  const [youtubeErro, setYoutubeErro] = useState('')
  const [youtubeResultados, setYoutubeResultados] = useState<YoutubeImportItem[]>([])
  const [youtubeSelecionados, setYoutubeSelecionados] = useState<string[]>([])
  const [youtubeCanalDados, setYoutubeCanalDados] = useState<{nome:string;inscritos:number|null}|null>(null)
  const [igConsultando,setIgConsultando] = useState(false)
  const [igErro,setIgErro] = useState('')
  const [igPerfil,setIgPerfil] = useState<InstagramImportPerfil|null>(null)
  const [igMidias,setIgMidias] = useState<InstagramImportItem[]>([])
  const [igMidiasSelecionadas,setIgMidiasSelecionadas] = useState<string[]>([])
  const [igMidiaCapaId,setIgMidiaCapaId] = useState<string|null>(null)
  const [igAplicado,setIgAplicado] = useState(false)
  const [igStories,setIgStories] = useState<Array<{id:string;tipo:string;imagem:string;url:string;timestamp:string}>>([])
  const [igStoriesConsultados,setIgStoriesConsultados] = useState(false)
  const [igStoriesConsultando,setIgStoriesConsultando] = useState(false)
  const [igStoriesErro,setIgStoriesErro] = useState('')


  // D2: modelo automatico (produtos-vendas). So existe quando o SERVIDOR diz que esta conta e elegivel (conta nova, plano e status
  // compativeis, modelo ligado). Free e contas antigas recebem lista vazia e o onboarding fica EXATAMENTE como sempre foi.
  const [modeloAuto, setModeloAuto] = useState<{ id: string; tema_sugerido: string | null } | null>(null)
  const [temaTocado, setTemaTocado] = useState(false)
  const [temaOriginal, setTemaOriginal] = useState('modelo1')
  const [aplicandoModelo, setAplicandoModelo] = useState(false)
  const [erroModelo, setErroModelo] = useState(false)
  const [modeloAplicado, setModeloAplicado] = useState(false)
  const etapaIndexRef = useRef(0)

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'vazio' | 'consultando' | 'livre' | 'ocupado' | 'indefinido'>('vazio')
  const sugestoesSlug = (() => {
    const base = (slug || nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
    if (!base) return []
    return [`${base}-pro`, `${base}-oficial`, `${base}-online`, `${base}-2026`].filter(s => s !== slug)
  })()

  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugStatus('vazio'); return }
    if (slug === slugOriginal) { setSlugStatus('livre'); return }
    let ativo = true
    setSlugStatus('consultando')
    const timer = setTimeout(async () => {
      const {data, error} = await supabase.from('perfis_publicos').select('user_id').eq('slug', slug).maybeSingle()
      if (!ativo) return
      setSlugStatus(error ? 'indefinido' : data && data.user_id !== userId ? 'ocupado' : 'livre')
    }, 450)
    return () => { ativo = false; clearTimeout(timer) }
  }, [slug, slugOriginal, userId])

  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('')
  const [bio, setBio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')

  const [temaEscolhido, setTemaEscolhido] = useState('modelo1')

  const [links, setLinks] = useState<LinkForm[]>([])
  const [avisoImportacaoConcluida, setAvisoImportacaoConcluida] = useState('')

  // Destaque (Parte 2A) - guarda o id do destaque ja criado NESTA sessao de onboarding,
  // pra evitar duplicar caso o cliente volte e avance de novo (nesse caso faz UPDATE em vez
  // de INSERT). Nao cria nada no banco so por preencher os campos - so no salvamento final.
  const [destaqueId, setDestaqueId] = useState<string | null>(null)
  const [destaqueTitulo, setDestaqueTitulo] = useState('')
  const [destaqueDescricao, setDestaqueDescricao] = useState('')
  const [destaqueUrl, setDestaqueUrl] = useState('')
  const [destaqueImagemUrl, setDestaqueImagemUrl] = useState('')

  // Etapas adaptativas por plano - uma unica lista + filtro, sem criar 5 componentes
  // separados. Free nao ve Destaque (permiteDestaques ja e a mesma regra usada no resto do
  // sistema pra liberar esse modulo). Declarado aqui, antes de qualquer funcao que precise
  // ler etapaAtual/etapasAtivas (avancar etapa, useEffect de finalizacao, etc).
  const etapasAtivas: Array<'identidade' | 'visual' | 'links' | 'destaque' | 'planos' | 'finalizar'> = [
    'identidade', 'visual',
    // D2: com modelo automatico a etapa de links some (o modelo ja traz links de exemplo e a funcao do banco recusa conta que ja tem links).
    'links',
    // Etapa de Destaque DESATIVADA por enquanto: destaques criados sem secao_id (decisao
    // tomada por seguranca, ja que nao encontramos onde uma secao e criada com garantia) nao
    // apareciam na pagina publica. Fica pronta pra reativar quando isso for resolvido -
    // basta trocar a linha abaixo de volta para: ...(permiteDestaques(planoTipo) ? ['destaque' as const] : []),
    ...([] as Array<'destaque'>),
    // Quarta etapa para todos: revisar a MiniPage completa antes de qualquer escrita.
    'planos',
    'finalizar',
  ]
  const etapaAtual = etapasAtivas[etapaIndex]
  etapaIndexRef.current = etapaIndex

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).maybeSingle()
      if (p) {
        setPlanoTipo(p.plano_tipo || 'free')
        setNome(p.nome_negocio === 'Minha MiniPage' ? '' : (p.nome_negocio || ''))
        // Nunca sobrescreva um endereço existente: desejo escolhido na landing é só sugestão.
        let slugInicial = p.slug || ''
        // O slug tecnico do Free recem-cadastrado pode ser trocado pelo endereco
        // escolhido na landing, sem alterar automaticamente dados persistidos.
        if (!slugInicial || (p.nome_negocio === 'Minha MiniPage' && /^mp[a-f0-9]{14}$/.test(slugInicial))) {
          try {
            const sugerido = sessionStorage.getItem('mp_slug_desejado') || ''
            if (/^[a-z0-9][a-z0-9-]{2,31}$/.test(sugerido)) slugInicial = sugerido
            sessionStorage.removeItem('mp_slug_desejado')
          } catch { /* storage indisponivel */ }
        }
        setSlug(slugInicial)
        setSlugOriginal(p.slug || '')
        setFotoPerfilUrl(p.foto_perfil_url || '')
        setBio(p.pagina_descricao_curta || p.descricao || '')
        setWhatsapp(p.whatsapp || '')
        setInstagram(p.instagram || '')
        setTemaEscolhido(p.public_theme || p.tema_publico || 'modelo1')
        setTemaOriginal(p.public_theme || p.tema_publico || 'modelo1')
      }
      // Se a conta já tem seções publicadas, avisamos que o assistente edita
      // a página existente; jamais apagamos dados sem consentimento.
      const fontesLegadas = ['pagina_destaques', 'pagina_videos', 'pagina_catalogos', 'pagina_cards'] as const
      const verificacoes = await Promise.all(fontesLegadas.map(tabela =>
        supabase.from(tabela).select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('ativo', true)
      ))
      setConteudoAnterior(verificacoes.some(r => !r.error && (r.count ?? 0) > 0))
      // Smart Import: nao aplicar templates de demonstracao a novos usuarios.
      // Integracoes de conteudo real sao adicionadas somente apos confirmacao explicita.
      setCarregando(false)
    }
    // Smart Builder: templates demonstrativos não são consultados neste fluxo.
    carregar()
  }, [])

  // D2: o tema sugerido pelo modelo vem PRE-SELECIONADO, mas a escolha e do cliente: so vale se ele ainda nao escolheu nenhum
  // e se o plano permite esse tema.
  useEffect(() => {
    const sugerido = modeloAuto?.tema_sugerido
    if (!sugerido || temaTocado) return
    const limite = obterLimiteModelosCor(planoTipo)
    const permitidos = TEMAS_MINIPAGE.slice(0, limite === Infinity ? TEMAS_MINIPAGE.length : limite)
    if (permitidos.some(m => m.id === sugerido)) setTemaEscolhido(sugerido)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeloAuto])

  function marcarVistoEIr(destino: string) {
    try { localStorage.setItem(chaveOnboarding(userId), '1') } catch (e) {}
    window.location.href = destino
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setMsg('Envie uma imagem JPG, PNG ou WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('A imagem deve ter no máximo 5MB.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `perfis/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    setFotoPerfilUrl(data.publicUrl)
    setMsg('')
  }

  async function uploadImagemDestaque(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setMsg('Envie uma imagem JPG, PNG ou WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('A imagem deve ter no máximo 5MB.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `destaques/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    setDestaqueImagemUrl(data.publicUrl)
    setMsg('')
  }

  function avancarEtapa1() {
    if (!nome.trim() || !slug.trim()) { setMsg('Nome e link são obrigatórios.'); return }
    if (slugStatus === 'ocupado' || slugStatus === 'consultando') { setMsg('Aguarde a verificação do endereço ou escolha outra opção.'); return }
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  function avancarEtapa2() {
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  // No assistente é possível experimentar mais conteúdos, mas apenas o que cabe no plano
  // será efetivamente salvo/publicado. Evita anúncios enganosos de limites.
  const limiteLinks = obterLimiteLinksRapidos(planoTipo)
  const limiteRascunhoLinks = 25
  const atingiuLimiteLinks = links.length >= limiteRascunhoLinks
  const linksExcedentesFree = planoTipo === 'free' && links.filter(l => l.url.trim()).length > 5
  const videosExcedentesFree = planoTipo === 'free' && youtubeSelecionados.length > 1

  function adicionarLink() {
    if (atingiuLimiteLinks) return
    setLinks(prev => [...prev, { id: 'novo-' + Date.now(), tipo: 'site', titulo: '', url: '', descricao: '' }])
  }
  function importarLinkManual() {
    if (atingiuLimiteLinks && !links.some(l=>l.tipo===plataformaRapida)) { setAvisoUrlRapida(txt.limitReached); return }
    const bruto = urlRapida.trim()
    let endereco = ''
    const usuario = bruto.replace(/^@/, '')
    // Handle curto só é interpretado após a escolha explícita da plataforma.
    if (!/^https?:\/\//i.test(bruto) && /^[a-zA-Z0-9._-]{2,40}$/.test(usuario) && plataformaRapida !== 'whatsapp' && plataformaRapida !== 'site') {
      const bases: Record<string,string> = { instagram:'https://www.instagram.com/', tiktok:'https://www.tiktok.com/@', youtube:'https://www.youtube.com/@', facebook:'https://www.facebook.com/', x:'https://x.com/' }
      const base = bases[plataformaRapida]
      if (base) endereco = base + usuario
    } else if (plataformaRapida === 'whatsapp' && !/^https?:\/\//i.test(bruto)) {
      // Números internacionais precisam trazer DDI. Não presumir +55.
      const digitos = bruto.replace(/[^0-9]/g,'')
      if (!bruto.startsWith('+') || digitos.length < 8 || digitos.length > 15) { setAvisoUrlRapida(txt.phoneCodeError); return }
      endereco = `https://wa.me/${digitos}`
    } else {
      if (['instagram','tiktok','youtube','facebook','x'].includes(plataformaRapida) && !/^https?:\/\//i.test(bruto)) {
        setAvisoUrlRapida('Não reconheci esse usuário. Informe @usuario (ex.: @ricardofulano) ou cole o link completo.')
        return
      }
      try {
        const destino = new URL(/^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`)
        if (!['http:', 'https:'].includes(destino.protocol) || !destino.hostname.includes('.') || destino.username || destino.password) throw new Error('invalid')
        endereco = destino.toString()
      } catch { setAvisoUrlRapida(txt.invalidUrl); return }
    }
    if (!endereco) {
      const rede = ['instagram','tiktok','youtube','facebook','x'].includes(plataformaRapida)
      setAvisoUrlRapida(rede ? 'Informe @usuario ou cole o link completo da rede selecionada.' : txt.invalidUrl)
      return
    }
    // URLs Spotify compartilhaveis podem incluir /intl-pt/ ou /intl-en/.
    // Salvar a URL canonica permite reconhecer o album no oEmbed e no player publico.
    try {
      const u = new URL(endereco)
      if (u.hostname === 'open.spotify.com') {
        u.pathname = u.pathname.replace(/^\/intl-[a-z]{2}(?:-[a-z]{2})?(?=\/)/i, '')
        u.search = ''
        endereco = u.toString()
      }
    } catch { /* a validacao ja ocorreu acima */ }
    const url = new URL(endereco)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    const tipo = ['instagram.com','tiktok.com','youtube.com','youtu.be','facebook.com','fb.com','wa.me','api.whatsapp.com','x.com','twitter.com','open.spotify.com'].includes(host)
      ? ({'instagram.com':'instagram','tiktok.com':'tiktok','youtube.com':'youtube','youtu.be':'youtube','facebook.com':'facebook','fb.com':'facebook','wa.me':'whatsapp','api.whatsapp.com':'whatsapp','x.com':'x','twitter.com':'x','open.spotify.com':'spotify'} as Record<string,string>)[host] : 'site'
    if (links.some(l => l.url.trim().replace(/\/$/, '') === endereco.replace(/\/$/, ''))) { setPlataformaRapida(tipo); setAvisoUrlRapida(`${labelPlataforma(tipo) || tipo}: este conteúdo já está na sua MiniPage. Você pode editá-lo abaixo.`); return }
    const titulo = tipo === 'site' ? host : (labelPlataforma(tipo) || host)
    // Complete o cartão selecionado em vez de criar outro cartão da mesma plataforma.
    setLinks(prev => {
      const index = prev.findIndex(l => l.tipo === tipo)
      if (index >= 0) return prev.map((l,i) => i === index ? { ...l, titulo: l.titulo.trim() || titulo, url: endereco } : l)
      if (prev.length >= limiteRascunhoLinks) return prev
      return [...prev, { id: `link-${Date.now()}`, tipo, titulo, url: endereco, descricao: '' }]
    })
    setUrlRapida('')
    setAvisoUrlRapida('')
    setPlataformaRapida(tipo)
    setAvisoImportacaoConcluida(tipo === plataformaRapida
      ? `${labelPlataforma(tipo) || 'Link'} adicionado à MiniPage.`
      : `Endereço identificado como ${labelPlataforma(tipo) || tipo}. Adicionado na plataforma correta, sem alterar seu WhatsApp.`)
  }

  function adicionarMidiaVerificada(midia: {provider: 'spotify' | 'youtube'; title: string; url: string}) {
    const titulo = midia.title.trim().slice(0, 100) || (midia.provider === 'spotify' ? 'Spotify' : 'YouTube')
    const jaExiste = links.some(l => l.url.trim().replace(/\/$/, '') === midia.url.replace(/\/$/, ''))
    if (jaExiste) { setAvisoUrlRapida(txt.duplicateUrl); return }
    const vazio = links.find(l => l.tipo === midia.provider && !l.url.trim())
    if (!vazio && links.length >= limiteRascunhoLinks) { setAvisoUrlRapida(tx.demoLimitLinks); return }
    setLinks(prev => {
      if (vazio) return prev.map(l => l.id === vazio.id ? { ...l, titulo, url: midia.url } : l)
      return [...prev, { id: `smart-${Date.now()}`, tipo: midia.provider, titulo, url: midia.url, descricao: '' }]
    })
    setAvisoUrlRapida('')
    setUrlRapida('')
    setPlataformaRapida(midia.provider)
    setAvisoImportacaoConcluida(`${midia.provider === 'spotify' ? 'Spotify' : 'YouTube'} adicionado à prévia.`)
  }

  async function conectarInstagram() {
    setIgErro('')
    setIgConsultando(true)
    try {
      const {data:{session}} = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Entre novamente na MiniPage Pro.')
      // Conexão existente dentro da sessão temporária: evita abrir OAuth outra vez.
      const current = await fetch('/api/smart-import/instagram/perfil', { headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store' })
      if (current.ok) {
        const data = await current.json().catch(()=>null)
        if (data?.perfil) {
          setIgPerfil(data.perfil as InstagramImportPerfil)
          setIgMidias(Array.isArray(data.midias) ? data.midias : [])
          setIgMidiasSelecionadas((Array.isArray(data.midias) ? data.midias : []).filter((m:InstagramImportItem)=>['IMAGE','CAROUSEL_ALBUM'].includes(m.tipo)).slice(0,6).map((m:InstagramImportItem)=>m.id))
          setIgMidiaCapaId(null)
          setIgAplicado(false)
          setIgConsultando(false)
          return
        }
      }
      const res = await fetch('/api/smart-import/instagram/iniciar',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'})
      const result = await res.json().catch(()=>null)
      if (!res.ok || typeof result?.url !== 'string') throw new Error(result?.error || 'Não foi possível conectar o Instagram.')
      window.location.assign(result.url)
    } catch(e) {setIgErro(e instanceof Error?e.message:'Falha ao conectar Instagram.');setIgConsultando(false)}
  }

  async function carregarInstagramConectado() {
    setIgConsultando(true)
    setIgErro('')
    try {
      const {data:{session}} = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Entre novamente na MiniPage Pro.')
      const res = await fetch('/api/smart-import/instagram/perfil',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'})
      const result = await res.json().catch(()=>null)
      if (!res.ok || !result?.perfil) throw new Error(result?.error || 'Não foi possível buscar os dados do Instagram.')
      setIgPerfil(result.perfil as InstagramImportPerfil)
      setIgAplicado(false)
      setIgMidias(Array.isArray(result.midias)?result.midias:[])
      setIgMidiasSelecionadas((Array.isArray(result.midias)?result.midias:[]).filter((m:InstagramImportItem)=>['IMAGE','CAROUSEL_ALBUM'].includes(m.tipo)).slice(0,6).map((m:InstagramImportItem)=>m.id))
      setIgMidiaCapaId(null)
      setIgStories([])
      setIgStoriesConsultados(false)
      setIgStoriesErro('')
    } catch(e) {setIgErro(e instanceof Error?e.message:'Falha ao consultar Instagram.')}
    finally {setIgConsultando(false)}
  }

  async function consultarStoriesInstagram() {
    if (!igPerfil || igStoriesConsultando) return
    setIgStoriesConsultando(true)
    setIgStoriesErro('')
    try {
      const {data:{session}} = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Entre novamente na MiniPage Pro.')
      const resposta = await fetch('/api/smart-import/instagram/stories',{
        headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'
      })
      const resultado = await resposta.json().catch(()=>null)
      if (!resposta.ok || !Array.isArray(resultado?.stories))
        throw new Error(resultado?.error || 'Não foi possível consultar os Stories ativos.')
      setIgStories(resultado.stories)
      setIgStoriesConsultados(true)
    } catch (erro) {setIgStoriesErro(erro instanceof Error?erro.message:'Falha ao consultar Stories.')}
    finally {setIgStoriesConsultando(false)}
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const status=params.get('instagram')
    if (!status) return
    params.delete('instagram')
    const url=window.location.pathname+(params.toString()?'?'+params.toString():'')
    window.history.replaceState(null,'',url)
    if(status==='conectado') {void carregarInstagramConectado()}
    else setIgErro(status==='configuracao'?'A conexão Instagram não está configurada.':'Conexão com o Instagram não concluída ou recusada.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  async function aplicarIdentidadeInstagram() {
    if (!igPerfil || igConsultando) return
    setIgConsultando(true)
    setIgErro('')
    try {
      let fotoSegura: string | null = null
      if (igPerfil.foto) {
        if (!userId) throw new Error('Aguarde o carregamento da sua conta.')
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('Entre novamente na MiniPage Pro.')
        const resposta = await fetch('/api/smart-import/instagram/foto', {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store'
        })
        if (!resposta.ok) {
          const erro = await resposta.json().catch(() => null)
          throw new Error(erro?.error || 'Não foi possível importar a foto com segurança.')
        }
        const blob = await resposta.blob()
        const tipos: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
        const extensao = tipos[blob.type]
        if (!extensao || blob.size < 1 || blob.size > 5 * 1024 * 1024)
          throw new Error('A foto do Instagram não está em formato suportado.')
        const caminho = `perfis/${userId}-instagram-${Date.now()}.${extensao}`
        const { error: erroUpload } = await supabase.storage.from('fotos').upload(caminho, blob, {
          upsert: false, contentType: blob.type, cacheControl: '3600'
        })
        if (erroUpload) throw new Error('Não foi possível salvar a foto: ' + erroUpload.message)
        fotoSegura = supabase.storage.from('fotos').getPublicUrl(caminho).data.publicUrl
      }
      // Aplicar os campos somente após o armazenamento da foto concluir com sucesso.
      // O usuário continua podendo editar os campos antes de publicar.
      if (igPerfil.nome.trim()) setNome(igPerfil.nome.trim().slice(0, 120))
      else if (igPerfil.username) setNome(igPerfil.username)
      if (igPerfil.bio) setBio(igPerfil.bio.slice(0, 500))
      if (fotoSegura) setFotoPerfilUrl(fotoSegura)
      if (igPerfil.username) setInstagram(`https://www.instagram.com/${igPerfil.username}/`)
      setIgAplicado(true)
    } catch (erro) {
      setIgErro(erro instanceof Error ? erro.message : 'Falha na importação da foto do Instagram.')
    } finally { setIgConsultando(false) }
  }

  async function buscarVideosCanal() {
    const fonte = youtubeFonte.trim()
    setYoutubeErro('')
    setYoutubeResultados([])
    setYoutubeSelecionados([])
    setYoutubeCanalDados(null)
    if (!fonte) { setYoutubeErro(tx.typeChannel); return }
    setYoutubeConsultando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Entre novamente para buscar o canal.')
      const resp = await fetch(`/api/smart-import/youtube?canal=${encodeURIComponent(fonte)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store'
      })
      const corpo = await resp.json().catch(() => null)
      if (!resp.ok || !Array.isArray(corpo?.videos)) throw new Error(corpo?.error || 'Não foi possível buscar o canal.')
      setYoutubeResultados(corpo.videos as YoutubeImportItem[])
      // Apenas estatisticas devolvidas pela API oficial; sem valores ficticios.
      const quantidade = corpo.inscritosYoutube
      const inscritos = typeof quantidade === 'number' && Number.isSafeInteger(quantidade) && quantidade >= 0 ? quantidade : null
      setYoutubeCanalDados({nome:typeof corpo.canal === 'string' ? corpo.canal : '',inscritos})
      if (corpo.videos.length === 0) setYoutubeErro(tx.noPublicVideos)
    } catch (erro) {
      setYoutubeErro(erro instanceof Error ? erro.message : 'Não foi possível buscar o canal.')
    } finally { setYoutubeConsultando(false) }
  }

  function alternarVideoYouTube(videoId: string) {
    setYoutubeSelecionados(anteriores => anteriores.includes(videoId)
      ? anteriores.filter(id => id !== videoId)
      : anteriores.length >= 4 ? anteriores : [...anteriores, videoId])
  }

  function removerLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
  }
  function editarLink(id: string, campo: keyof LinkForm, valor: string) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l))
  }

  function escolherCanal(tipo: string) {
    setConfirmarPoucosLinks(false)
    if (links.some(l=>l.tipo===tipo)) { setPlataformaRapida(tipo);return }
    if (atingiuLimiteLinks) {setMsg(txt.limitReached);return}
    const titulo=labelPlataforma(tipo) || tipo
    setLinks(prev=>[...prev,{id:`link-${Date.now()}-${tipo}`,tipo,titulo,url:'',descricao:''}])
    setPlataformaRapida(tipo)
    setMsg('')
  }
  function avancarEtapa3() {
    // Não contabilizar duplicadamente Instagram/WhatsApp já informados na identidade.
    const tiposValidos=new Set(links.filter(l=>l.titulo.trim() && l.url.trim()).map(l=>l.tipo))
    if (whatsapp.trim()) tiposValidos.add('whatsapp')
    if (instagram.trim()) tiposValidos.add('instagram')
    const completos=tiposValidos.size
    if (completos === 0) { setMsg(tc.warning); return }
    if(completos<2 && !confirmarPoucosLinks){setConfirmarPoucosLinks(true);return}
    setConfirmarPoucosLinks(false)
    setMsg('')
    setEtapaIndex(i=>i+1)
  }

  // Homologacao exclusivamente local: cria uma intencao de compra sem alterar o plano
  // contratado, checkout, perfis, assinaturas nem conteudo da MiniPage.
  async function registrarInteresseHomolog(plano: PlanoEscolhivel) {
    if (process.env.NEXT_PUBLIC_MP_BILLING_INTENT_HOMOLOG_ENABLED !== 'true' || plano === 'free') return
    setEstadoInteresseHomolog('Verificando a intencao de contratacao, sem gerar cobranca...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Entre novamente para registrar a intencao.')
      const resposta = await fetch('/api/billing/intencao-homologacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plano, ciclo: 'mensal', attemptId: crypto.randomUUID() }),
        cache: 'no-store',
      })
      const data: { estado?: string; error?: string } = await resposta.json().catch(() => ({}))
      if (!resposta.ok || data.estado !== 'registrada') throw new Error(data.error || 'Ainda nao foi possivel registrar o interesse.')
      setEstadoInteresseHomolog('Interesse registrado para homologacao. Nenhum pagamento foi iniciado. Continue com seu plano atual.')
    } catch (erro) {
      setEstadoInteresseHomolog(erro instanceof Error ? erro.message : 'Nao foi possivel registrar interesse. Nenhuma cobranca foi feita.')
    }
  }

  function avancarDestaque() {
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  useEffect(() => {
    if (etapaAtual !== 'finalizar' || carregando || concluido) return
    finalizarOnboarding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaAtual, carregando, concluido])

  async function finalizarOnboarding() {
    setSalvando(true)
    setMsg('')
    const slugFmt = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    // Os limites de PUBLICAÇÃO são reavaliados na conta atual, não no estado visual.
    // Uma sessão de criação Free nunca faz publicação de temas/links/vídeos Premium.
    const { data: perfilParaPublicar, error: erroPlanoParaPublicar } = await supabase
      .from('perfis').select('plano_tipo, public_theme').eq('user_id', userId).maybeSingle()
    if (erroPlanoParaPublicar || !perfilParaPublicar) {
      setMsg(tx.verifyPlan)
      setSalvando(false)
      setEtapaIndex(etapasAtivas.indexOf('planos'))
      return
    }
    const planoParaPublicar = perfilParaPublicar.plano_tipo || 'free'
    const limiteLinksParaPublicar = obterLimiteLinksRapidos(planoParaPublicar)
    const limiteVideosParaPublicar = Math.min(4, obterLimiteVideos(planoParaPublicar))
    const limiteTemasParaPublicar = obterLimiteModelosCor(planoParaPublicar)
    const temaNovoPermitido = TEMAS_MINIPAGE.slice(0, limiteTemasParaPublicar === Infinity ? TEMAS_MINIPAGE.length : limiteTemasParaPublicar).some(t => t.id === temaEscolhido)
    const temaExistente = perfilParaPublicar.public_theme || temaOriginal || 'modelo1'
    const temaParaPublicar = temaNovoPermitido ? temaEscolhido :
      (TEMAS_MINIPAGE.slice(0, 6).some(t => t.id === temaExistente) ? temaExistente : 'modelo1')

    if (slugFmt !== slugOriginal) {
      const { data: existente } = await supabase.from('perfis_publicos').select('user_id').eq('slug', slugFmt).maybeSingle()
      if (existente && existente.user_id !== userId) {
        setMsg(tx.slugTaken)
        setSalvando(false)
        setEtapaIndex(0)
        return
      }
    }

    const { error } = await supabase.from('perfis').update({
      nome_negocio: nome.trim(),
      slug: slugFmt,
      foto_perfil_url: fotoPerfilUrl || null,
      pagina_descricao_curta: bio.trim() || null,
      whatsapp: whatsapp.replace(/\D/g, '') || null,
      instagram: instagram.trim() || null,
      public_theme: (planoParaPublicar === 'free' && !temaTocado && !temaNovoPermitido) ? temaExistente : temaParaPublicar,
    }).eq('user_id', userId)

    if (error) { setMsg('Erro ao salvar: ' + error.message); setSalvando(false); setEtapaIndex(0); return }

    const linksValidos = links.filter(l => l.titulo.trim() && l.url.trim()).slice(0, limiteLinksParaPublicar)
    let linksSalvos = 0
    // Verifica os links anteriores antes de inserir. Se a leitura falhar, nao
    // arrisca duplicacao. Nao exclui nem altera nenhum link preexistente.
    const {data: linksExistentes, error: erroConsultaLinks} = await supabase
      .from('pagina_links').select('url').eq('user_id', userId)
    if (erroConsultaLinks) {
      setMsg('Não foi possível verificar os links existentes: ' + erroConsultaLinks.message)
      setSalvando(false)
      setEtapaIndex(etapasAtivas.indexOf('links'))
      return
    }
    const canon = (valor: string) => {
      try {
        const u = new URL(valor.trim())
        u.hash = ''
        u.hostname = u.hostname.toLowerCase()
        if (u.hostname === 'open.spotify.com') {
          u.pathname = u.pathname.replace(/^\/intl-[a-z]{2}(?:-[a-z]{2})?(?=\/)/i, '')
          u.search = ''
        }
        return u.toString().replace(/\/$/, '')
      } catch { return valor.trim().replace(/\/$/, '').toLowerCase() }
    }
    const existentes = new Set((linksExistentes || []).map((item: {url: string | null}) => canon(item.url || '')))
    let totalLinksPublicados = (linksExistentes || []).length
    for (let i = 0; i < linksValidos.length; i++) {
      if (totalLinksPublicados >= limiteLinksParaPublicar) break
      const l = linksValidos[i]
      let urlFinal = l.url.trim()
      if (l.tipo === 'whatsapp') urlFinal = montarLinkWhatsapp(l.url)
      else if (l.tipo === 'email') urlFinal = `mailto:${l.url.trim()}`
      else if (l.tipo === 'instagram') urlFinal = normalizarInstagram(l.url)
      else if (l.tipo === 'facebook') urlFinal = normalizarFacebook(l.url)
      const chave = canon(urlFinal)
      if (existentes.has(chave)) continue
      const { error: erroLink } = await supabase.from('pagina_links').insert({
        user_id: userId, tipo: l.tipo, titulo: l.titulo.trim(), descricao: l.descricao.trim() || null, url: urlFinal, ativo: true, ordem: i,
      })
      if (erroLink) {
        setMsg('Não foi possível salvar todos os links: ' + erroLink.message)
        setSalvando(false)
        setEtapaIndex(etapasAtivas.indexOf('links'))
        return
      }
      existentes.add(chave)
      totalLinksPublicados++
      linksSalvos++
    }

    // Importacao autorizada: cada video foi selecionado explicitamente no assistente.
    // Nunca sobrescrever videos antigos. Consulta previa evita repeticoes entre sessoes.
    let videosImportados = 0
    if (youtubeSelecionados.length > 0 && limiteVideosParaPublicar > 0) {
      const { data: videosExistentes, error: erroVideos } = await supabase.from('pagina_videos')
        .select('url_video').eq('user_id', userId)
      if (erroVideos) {
        setMsg('Não foi possível conferir os vídeos existentes: ' + erroVideos.message)
        setSalvando(false)
        setEtapaIndex(etapasAtivas.indexOf('links'))
        return
      }
      const urlsExistentes = new Set((videosExistentes || []).map((v: {url_video: string | null}) => v.url_video || ''))
      const escolhidos = youtubeSelecionados.slice(0, limiteVideosParaPublicar).map(id => youtubeResultados.find(v => v.videoId === id))
        .filter((v): v is YoutubeImportItem => !!v)
      // Planos pagos usam secoes personalizadas; o Free usa o bloco fixo de videos.
      // Uma secao real criada aqui nao contem nenhum conteudo de demonstracao.
      let secaoId: string | null = null
      if (escolhidos.length && ['minipage','agenda','loja','essencial','equipe'].includes(planoParaPublicar.toLowerCase())) {
        const {data: secoes, error: erroSecoes} = await supabase.from('pagina_videos_secoes')
          .select('id').eq('user_id',userId).eq('ativo',true).order('ordem',{ascending:true}).limit(1)
        if (erroSecoes) {
          setMsg('Não foi possível verificar a seção de vídeos: ' + erroSecoes.message)
          setSalvando(false);setEtapaIndex(etapasAtivas.indexOf('links'));return
        }
        secaoId = secoes?.[0]?.id || null
        if (!secaoId) {
          const {data:secao,error:erroCriarSecao} = await supabase.from('pagina_videos_secoes').insert({
            user_id:userId,titulo:'Vídeos do YouTube',subtitulo:null,ativo:true,ordem:0,
          }).select('id').single()
          if (erroCriarSecao || !secao) {
            setMsg('Não foi possível criar a seção de vídeos: ' + (erroCriarSecao?.message || 'sem retorno'))
            setSalvando(false);setEtapaIndex(etapasAtivas.indexOf('links'));return
          }
          secaoId = secao.id
        }
      }
      let totalVideosPublicados = (videosExistentes || []).length
      for (const [indice, video] of escolhidos.entries()) {
        if (totalVideosPublicados >= limiteVideosParaPublicar) break
        if (!/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}$/.test(video.url)) continue
        if (urlsExistentes.has(video.url)) continue
        const { error: erroSalvarVideo } = await supabase.from('pagina_videos').insert({
          user_id: userId, titulo: video.titulo.slice(0, 160),
          url_video: video.url, thumbnail_url: video.miniatura,
          ativo: true, ordem: indice, ...(secaoId ? {secao_id:secaoId} : {}),
        })
        if (erroSalvarVideo) {
          setMsg('Os links foram salvos, mas a importação do YouTube falhou: ' + erroSalvarVideo.message)
          setSalvando(false)
          setEtapaIndex(etapasAtivas.indexOf('links'))
          return
        }
        urlsExistentes.add(video.url)
        totalVideosPublicados++
        videosImportados++
      }
    }

    // Destaque: so salva se o titulo foi preenchido (nunca cria destaque vazio/ficticio). Se
    // o cliente ja tinha confirmado um destaque nesta MESMA sessao de onboarding (voltou e
    // avancou de novo), atualiza o registro existente em vez de inserir outro.
    let destaqueSalvo = false
    if (destaqueTitulo.trim()) {
      const payloadDestaque = {
        user_id: userId,
        titulo: destaqueTitulo.trim(),
        descricao: destaqueDescricao.trim() || null,
        texto_botao: 'Ver mais',
        url: destaqueUrl.trim() || null,
        imagem_url: destaqueImagemUrl || null,
        ativo: true,
        ordem: 0,
      }
      if (destaqueId) {
        const { error: erroUpdate } = await supabase.from('pagina_destaques').update(payloadDestaque).eq('id', destaqueId).eq('user_id', userId)
        destaqueSalvo = !erroUpdate
      } else {
        const { data: novoDestaque, error: erroInsert } = await supabase.from('pagina_destaques').insert(payloadDestaque).select().single()
        if (!erroInsert && novoDestaque) { setDestaqueId(novoDestaque.id); destaqueSalvo = true }
      }
    }

    // As fotos selecionadas do Instagram entram no MESMO sistema Álbuns / Fotos.
    // Nunca há uma segunda galeria pública, e nenhuma foto antiga é excluída.
    let resumoInstagram = ''
    const fotosSelecionadas = igMidias.filter(m => igMidiasSelecionadas.includes(m.id) &&
      ['IMAGE', 'CAROUSEL_ALBUM'].includes(m.tipo) && /^\d+$/.test(m.id))
    if (fotosSelecionadas.length && permiteAlbuns(planoParaPublicar)) {
      let novasFotos = 0
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('Instagram não conectado')
        const { data: albunsAtuais, error: erroAlbuns } = await supabase.from('pagina_albuns')
          .select('id,titulo').eq('user_id', userId).order('ordem')
        if (erroAlbuns) throw new Error('Falha ao consultar álbuns')
        let albumId: string | null = albunsAtuais?.find((a: {titulo?:string}) =>
          String(a.titulo || '').trim().toLowerCase() === 'importadas do instagram')?.id || null
        if (!albumId) {
          const {data:novoAlbum,error:erroNovoAlbum} = await supabase.from('pagina_albuns').insert({
            user_id:userId,titulo:'Importadas do Instagram',subtitulo:null,proporcao:'1:1',
            ativo:true,ordem:albunsAtuais?.length || 0
          }).select('id').single()
          if (erroNovoAlbum || !novoAlbum) throw new Error('Falha ao criar álbum')
          albumId = novoAlbum.id
        }
        const { data: fotosAtuais, error: erroFotos } = await supabase.from('pagina_album_fotos')
          .select('imagem_url,album_id').eq('user_id',userId)
        if (erroFotos) throw new Error('Falha ao verificar fotos atuais')
        const fotosSalvas = new Set((fotosAtuais || []).map((f: {imagem_url?:string|null})=>f.imagem_url || ''))
        let ordem = (fotosAtuais || []).filter((f: {album_id:string})=>f.album_id===albumId).length
        for (const m of fotosSelecionadas) {
          const resposta = await fetch(`/api/smart-import/instagram/midia?midiaId=${encodeURIComponent(m.id)}`, {
            headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'
          })
          if (!resposta.ok) throw new Error('Falha ao baixar uma foto do Instagram')
          const imagem = await resposta.blob()
          const extensao = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as Record<string,string>)[imagem.type]
          if (!extensao || imagem.size<1 || imagem.size>8*1024*1024) throw new Error('Foto inválida')
          const caminho = `album-fotos/${userId}-instagram-${m.id}.${extensao}`
          const storage = supabase.storage.from('fotos')
          const urlPublica = storage.getPublicUrl(caminho).data.publicUrl
          if (fotosSalvas.has(urlPublica)) continue
          const {error:erroUpload} = await storage.upload(caminho,imagem,{
            upsert:false,contentType:imagem.type,cacheControl:'3600'
          })
          if (erroUpload) throw new Error('Falha ao salvar foto no armazenamento')
          const {error:erroFoto} = await supabase.from('pagina_album_fotos').insert({
            user_id:userId,album_id:albumId,imagem_url:urlPublica,titulo:'Instagram',
            descricao:m.legenda.slice(0,500)||null,ativo:true,ordem
          })
          if (erroFoto) {
            await storage.remove([caminho])
            throw new Error('Falha ao adicionar foto ao álbum')
          }
          fotosSalvas.add(urlPublica)
          ordem++
          novasFotos++
        }
        resumoInstagram = `${novasFotos} fotos do Instagram` + (novasFotos < fotosSelecionadas.length ? ' (sem duplicatas)' : '')
      } catch {
        // O cadastro já está salvo: não desfazer outros recursos nem fingir que as fotos entraram.
        // O usuário poderá recuperar a seleção via Painel → Álbuns / Fotos.
        resumoInstagram = novasFotos ? `${novasFotos} fotos importadas; outras pendentes no painel` :
          'Importação de fotos pendente em Álbuns / Fotos'
      }
    } else if (fotosSelecionadas.length) {
      resumoInstagram = 'Fotos do Instagram disponíveis no plano MiniPage'
    }

    // Publicação construída exclusivamente com os dados informados pelo assinante.
    // Não aplica templates, imagens, vídeos ou produtos fictícios.
    concluirOnboarding(slugFmt, linksSalvos, destaqueSalvo, false, videosImportados, resumoInstagram)
  }

  // So marca o onboarding como visto quando ele REALMENTE conclui (nunca na falha tecnica do modelo: se o cliente sair, reabre e tenta de novo).
  function concluirOnboarding(slugFmt: string, linksSalvos: number, destaqueSalvo: boolean, aplicouModelo: boolean, videosImportados = 0, resumoInstagram = '') {
    setSlug(slugFmt)
    setSlugOriginal(slugFmt)
    try { localStorage.setItem(chaveOnboarding(userId), '1') } catch { /* localStorage indisponivel */ }

    const resumo = ['Perfil', 'Visual']
    if (linksSalvos > 0) resumo.push(`${linksSalvos} link${linksSalvos > 1 ? 's' : ''}`)
    if (destaqueSalvo) resumo.push('1 destaque')
    if (videosImportados > 0) resumo.push(`${videosImportados} vídeos do YouTube`)
    if (resumoInstagram) resumo.push(resumoInstagram)
    setResumoFinal(resumo)
    setModeloAplicado(aplicouModelo)
    setErroModelo(false)
    setSalvando(false)
    setConcluido(true)
  }

  async function aplicarModeloAutomatico(templateId: string): Promise<'aplicado' | 'recusado' | 'falha'> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return 'falha'
      const res = await fetch('/api/onboarding/aplicar-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ template_id: templateId }),
      })
      const corpo = await res.json().catch(() => null)
      if (res.ok && corpo && corpo.ok === true) return 'aplicado'
      if (corpo && typeof corpo.codigo === 'string' && RECUSAS_ESPERADAS_MODELO.includes(corpo.codigo)) return 'recusado'
      return 'falha'
    } catch {
      return 'falha'
    }
  }

  async function tentarModeloDeNovo() {
    if (!modeloAuto) return
    setSalvando(true)
    setErroModelo(false)
    setAplicandoModelo(true)
    const r = await aplicarModeloAutomatico(modeloAuto.id)
    setAplicandoModelo(false)
    if (r === 'falha') { setSalvando(false); setErroModelo(true); return }
    concluirOnboarding(slug, 0, false, r === 'aplicado')
  }

  function continuarSemModelo() {
    concluirOnboarding(slug, 0, false, false)
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p>
      </div>
    )
  }

  const limiteTemas = obterLimiteModelosCor(planoTipo)
  // Exibir os 20 temas para comparação. O Free publica somente um dos 6 primeiros.
  const midiaCapaAtivaId = igMidiaCapaId && igMidiasSelecionadas.includes(igMidiaCapaId)
    ? igMidiaCapaId
    : igMidias.find(m => igMidiasSelecionadas.includes(m.id) && /^https:\/\//i.test(m.imagem))?.id || null
  const temasVisiveis = TEMAS_MINIPAGE
  const temaFreeId = TEMAS_MINIPAGE.slice(0, 6).some(t => t.id === temaEscolhido) ? temaEscolhido :
    (TEMAS_MINIPAGE.slice(0, 6).some(t => t.id === temaOriginal) ? temaOriginal : 'modelo1')
  const temaPremium = getTema(temaEscolhido)
  const temaFree = getTema(temaFreeId)
  // As cores do tema selecionado são aplicadas apenas dentro da MiniPage simulada.
  // O assistente preserva a identidade visual da plataforma em todas as etapas.

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%,rgba(149,82,245,.10),transparent 42%),#0B0A10', fontFamily: 'system-ui', padding: '24px 16px' }}>
      <style>{`
        .mp2-shell { max-width: 1120px; margin: 0 auto; }
        .mp2-grid { display: grid; grid-template-columns: minmax(0, 1fr) 370px; gap: 24px; align-items: start; }
        .mp2-grid-checkout { display: block; }
        .mp2-grid-checkout .mp2-preview-column { display: none; }
        .mp2-editor { min-width: 0; }
        .mp2-preview-column { position: sticky; top: 20px; min-width: 0; }
        .mp2-preview-toggle { display: none; }
        .mp2-live-phone { width: 100%; max-width: 340px; margin: 0 auto; }
        .mp2-live-link { padding: 12px; min-height: 46px; border-radius: 12px; background: rgba(255,255,255,.095); border: 1px solid rgba(255,255,255,.10); font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }
        @media (max-width: 800px) {
          .mp2-grid { display: flex; flex-direction: column; gap: 14px; }
          .mp2-editor, .mp2-preview-column { width: 100%; }
          .mp2-preview-column { order: -1; position: static; }
          .mp2-preview-toggle { display: flex; width: 100%; align-items: center; justify-content: space-between; background: #21182D; border: 1px solid #4B3A59; color: #F5F2FF; border-radius: 12px; padding: 13px 15px; font-weight: 700; cursor: pointer; }
          .mp2-preview-closed { display: none; }
          .mp2-preview-body { padding-top: 12px; }
        }
        @media (max-width: 430px) {
          .mp2-onboarding-card { padding: 20px 16px !important; }
          .mp2-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="mp2-shell">

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {etapasAtivas.slice(0,-1).map((_, n) => (
            <div key={n} style={{ flex: 1, height: '4px', borderRadius: '999px', background: n <= etapaIndex ? G : 'rgba(255,255,255,.10)' }} />
          ))}
        </div>
        <div style={{textAlign:'center',color:'#B9B0C9',fontSize:'12px',marginTop:'-13px',marginBottom:'18px'}}>{txt.stepLabel} {Math.min(etapaIndex + 1, 4)} / 4 · {Math.round((Math.min(etapaIndex, 4) / 4) * 100)}%</div>
        <div className={`mp2-grid ${guiaPlanosAberto && etapaAtual === 'planos' ? 'mp2-grid-checkout' : ''}`}>
        <div className="mp2-editor">

        {etapaAtual === 'identidade' && (
          <div className="crd mp2-onboarding-card" style={{ background: 'rgba(33,24,45,.74)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{txt.introTitle}</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '24px' }}>{txt.introSub}</p>

            <p style={{color:'#B8AAB8',fontSize:12,marginBottom:20}}>
              {idioma === 'pt-BR' ? 'A foto e os conteúdos poderão ser adicionados depois. Primeiro vamos criar sua identidade.' :
               idioma === 'es-ES' ? 'Puedes añadir la foto y el contenido más adelante. Primero crea tu identidad.' :
               idioma === 'fr-FR' ? 'Vous pourrez ajouter une photo et du contenu plus tard. Commençons par votre identité.' :
               idioma === 'de-DE' ? 'Foto und Inhalte kannst du später hinzufügen. Beginnen wir mit deinem Profil.' :
               idioma === 'it-IT' ? 'Potrai aggiungere foto e contenuti più tardi. Iniziamo dal tuo profilo.' :
               'You can add your photo and content later. Let’s start with your identity.'}
            </p>

            <section aria-label="Importação oficial do Instagram" style={{background:'#15101E',border:'1px solid #544160',borderRadius:14,padding:16,marginBottom:18}}>
              <h2 style={{color:'#F8F4F7',fontSize:17,fontWeight:750,margin:'0 0 7px'}}>{ti.title}</h2>
              <p style={{color:'#B9B0C9',fontSize:12,lineHeight:1.5,margin:'0 0 12px'}}>{ti.explainer}</p>
              <button type="button" onClick={conectarInstagram} disabled={igConsultando} style={{background:G,color:'#171B0D',padding:'11px 15px',borderRadius:10,border:0,fontWeight:750,cursor:'pointer'}}>{igConsultando?ti.connecting:ti.connect}</button>
              {igErro && <p role="alert" style={{color:'#FFB4B4',fontSize:12,marginTop:10}}>{igErro}</p>}
              {igPerfil && <div style={{marginTop:14}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                  {igPerfil.foto && <img src={igPerfil.foto} alt="Foto de perfil recebida do Instagram" style={{height:55,width:55,objectFit:'cover',borderRadius:'50%'}}/>}
                  <div style={{minWidth:0}}><strong style={{color:'#F8F4F7'}}>{igPerfil.nome||igPerfil.username}</strong><p style={{color:'#C9FA45',fontSize:12,margin:'4px 0'}}>@{igPerfil.username}{igPerfil.seguidores!==null?` · ${igPerfil.seguidores.toLocaleString()} ${tx.followers}`:''}</p></div>
                </div>
                <p style={{color:'#C8C0D4',fontSize:12,whiteSpace:'pre-wrap'}}>{igPerfil.bio}</p>
                <button type="button" onClick={aplicarIdentidadeInstagram} disabled={igConsultando || igAplicado} style={{border:'1px solid #C9FA45',background:'#242B17',color:'#C9FA45',padding:'10px 12px',borderRadius:9,cursor:'pointer',fontWeight:700}}>{igAplicado?ti.applied:ti.apply}</button>
                <div style={{margin:'13px 0 0',padding:'11px 12px',border:'1px solid #50415B',borderRadius:10,background:'#1B1626'}}>
                  <button type="button" onClick={consultarStoriesInstagram} disabled={igStoriesConsultando} style={{background:'#31233C',color:'#F7EDFF',border:'1px solid #6D507A',borderRadius:9,padding:'9px 12px',fontSize:12,fontWeight:700,cursor:igStoriesConsultando?'wait':'pointer'}}>
                    {igStoriesConsultando?tx.checkingStories:tx.checkStories}
                  </button>
                  <p style={{fontSize:11,color:'#C2B8CE',lineHeight:1.5,margin:'7px 0 0'}}>{tx.storiesReadOnly}</p>
                  {igStoriesConsultados && <p role="status" style={{fontSize:12,color:'#C9FA45',margin:'7px 0 0'}}>{igStories.length} {tx.activeStories}.</p>}
                  {igStoriesErro && <p role="alert" style={{fontSize:12,color:'#FFB4B4',margin:'7px 0 0'}}>{igStoriesErro}</p>}
                </div>
                {igMidias.length>0 && <>
                  <p style={{fontSize:12,color:'#C8C0D4',margin:'14px 0 8px'}}>{ti.media}</p>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}}>
                    <strong style={{color:'#C9FA45',fontSize:12}}>{igMidiasSelecionadas.length} / {igMidias.length} {tx.postsSelected} · {igMidias.filter(m=>igMidiasSelecionadas.includes(m.id) && m.tipo.toUpperCase()==='VIDEO').length} {tx.videos}</strong>
                    <div style={{display:'flex',gap:6}}>
                      <button type="button" onClick={()=>setIgMidiasSelecionadas(igMidias.map(m=>m.id))} style={{background:'#2B2340',color:'#FFF',border:'1px solid #685F79',borderRadius:7,padding:'6px 10px',fontSize:11,cursor:'pointer'}}>{tx.selectAll}</button>
                      <button type="button" onClick={()=>{setIgMidiasSelecionadas([]);setIgMidiaCapaId(null)}} style={{background:'#2B2340',color:'#FFF',border:'1px solid #685F79',borderRadius:7,padding:'6px 10px',fontSize:11,cursor:'pointer'}}>{tx.clear}</button>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:7}}>{igMidias.map(m=>{
                    const escolhida=igMidiasSelecionadas.includes(m.id)
                    return <div key={m.id} style={{position:'relative',minWidth:0}}>
                      <button type="button" aria-pressed={escolhida} aria-label={`${escolhida?'Remover':'Selecionar'} ${m.tipo==='VIDEO'?'vídeo':'foto'} ${m.legenda||m.id}`} onClick={()=>setIgMidiasSelecionadas(atual=>atual.includes(m.id)?atual.filter(id=>id!==m.id):[...atual,m.id])} style={{display:'block',width:'100%',aspectRatio:'1',border:escolhida?'3px solid #C9FA45':'2px solid #524462',background:'#271C34',borderRadius:8,overflow:'hidden',position:'relative',padding:0,cursor:'pointer'}}>
                        {m.imagem?<img src={m.imagem} alt={m.legenda||'Publicação do Instagram'} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#DAD1EB',fontSize:12,padding:8,display:'block'}}>{ti.post}</span>}
                        <span aria-hidden="true" style={{position:'absolute',top:6,right:6,background:escolhida?'#C9FA45':'#15101EDD',color:escolhida?'#102000':'white',borderRadius:99,width:25,height:25,display:'grid',placeItems:'center',fontWeight:800}}>{escolhida?'✓':'+'}</span>
                        {m.tipo.toUpperCase()==='VIDEO'&&<span aria-hidden="true" style={{position:'absolute',left:5,bottom:5,padding:'3px 6px',borderRadius:5,background:'#111A',color:'#FFF',fontSize:10}}>▶ Vídeo</span>}
                      </button>
                      {escolhida && /^https:\/\//i.test(m.imagem) && <button type="button"
                        aria-pressed={midiaCapaAtivaId===m.id}
                        onClick={()=>setIgMidiaCapaId(m.id)}
                        style={{display:'block',width:'100%',marginTop:4,padding:'6px 4px',borderRadius:7,border:midiaCapaAtivaId===m.id?'1px solid #C9FA45':'1px solid #655778',color:midiaCapaAtivaId===m.id?'#C9FA45':'#E1D8EE',background:midiaCapaAtivaId===m.id?'#26321D':'#20182A',fontSize:10,fontWeight:700,cursor:'pointer'}}>
                        {midiaCapaAtivaId===m.id?'✓ '+capaTexto.chosen:capaTexto.choose}
                      </button>}
                      <a href={m.link} target="_blank" rel="noopener noreferrer" style={{color:'#D5CBDF',fontSize:10,display:'block',textAlign:'center',paddingTop:4}}>{tx.openOriginal}</a>
                    </div>
                  })}</div>
                  <p style={{fontSize:11,color:'#CEC6DD',lineHeight:1.5,margin:'10px 0 0'}}>{capaTexto.hint}</p>
                  <p role="status" style={{fontSize:12,color:'#FFD88C',lineHeight:1.5,margin:'12px 0 0'}}>
                    {tx.mediaPreviewOnly}
                  </p>
                </>}
              </div>}
            </section>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>{txt.displayName}</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Estúdio Bella" style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>{txt.pageLink}</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
              <span style={{ padding: '0 0 0 14px', fontSize: '13px', color: '#8B8594', whiteSpace: 'nowrap' }}>minipage.pro/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="seunome" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 14px 12px 2px', fontSize: '14px', color: '#F8F4F7', fontFamily: 'inherit' }} />
            </div>

            <div style={{marginTop:'-6px',marginBottom:'18px'}}>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'8px'}}>{tx.slugPreview} <strong style={{color:'#C9FA45'}}>minipage.pro/{slug || 'seunome'}</strong>. {tx.changeAddress}</p>
              {slugStatus === 'consultando' && <p role="status" style={{fontSize:'12px',color:'#AFA2C5'}}>{tx.checkingSlug}</p>}
              {slugStatus === 'livre' && <p role="status" style={{fontSize:'12px',color:'#C9FA45'}} >{txt.slugAvailable}</p>}
              {slugStatus === 'ocupado' && <p role="status" style={{fontSize:'12px',color:'#FF9A9A'}}>{tx.slugBusy}</p>}
              {slugStatus === 'indefinido' && slug.length >= 3 && <p role="status" style={{fontSize:'12px',color:'#B8AAB8'}}>{tx.slugUnavailable}</p>}
              {slugStatus === 'ocupado' && <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'}}>
                {sugestoesSlug.map(s => <button type="button" key={s} onClick={() => setSlug(s)} style={{padding:'8px 12px',background:'#21182D',border:'1px solid #625077',borderRadius:'999px',color:'#F8F4F7',cursor:'pointer',fontSize:'12px'}}>{s}</button>)}
              </div>}
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>{txt.shortBio}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={tx.bioPlaceholder} rows={2} style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit', resize: 'none' }} />



            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <button onClick={avancarEtapa1} style={{ width: '100%', height: '48px', background: G, color: '#15180D', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {txt.continue}
            </button>
          </div>
        )}

        {etapaAtual === 'visual' && (
          <div className="crd mp2-onboarding-card" style={{ background: 'rgba(33,24,45,.74)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{txt.chooseStyle}</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '12px' }}>{txt.chooseStyleSub}</p>
            {modoPrevia === 'free' && <p role="status" style={{fontSize:12,color:'#EFE6F5',background:'#2B2036',border:'1px solid #584567',padding:'10px 12px',borderRadius:10,margin:'0 0 14px'}}><strong>{tx.pageDemo}:</strong> {tx.pageDemoSub} {tx.freeThemes}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '12px', marginBottom: '24px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {temasVisiveis.map(m => (
                <ThemePreviewCard key={m.id} tema={m} selecionado={temaEscolhido === m.id} badge={modoPrevia === 'free' && TEMAS_MINIPAGE.indexOf(m) >= limiteTemas ? <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',whiteSpace:'nowrap',background:'#C9FA45',border:'1px solid #C9FA45',color:'#15180D',fontSize:10,fontWeight:850,lineHeight:1,borderRadius:8,padding:'5px 9px'}}>Premium</span> : undefined} onClick={() => { setTemaTocado(true); setTemaEscolhido(m.id); if (planoTipo==='free' && TEMAS_MINIPAGE.indexOf(m) >= limiteTemas) setModoPrevia('premium') }} />
              ))}
            </div>

            {planoTipo === 'free' && !TEMAS_MINIPAGE.slice(0, limiteTemas).some(t => t.id === temaEscolhido) && <p role="status" style={{background:'#2B2036',border:'1px solid #C9FA45',padding:12,borderRadius:10,fontSize:12,color:'#F0E2FA',lineHeight:1.6}}><strong style={{color:'#C9FA45'}}>Premium:</strong> {tx.premiumTheme}</p>}
            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapaIndex(i => i - 1)} style={{ flexShrink: 0, height: '48px', padding: '0 18px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {txt.back}
              </button>
              <button onClick={avancarEtapa2} style={{ flex: 1, height: '48px', background: G, color: '#15180D', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {txt.continue}
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'links' && (
          <div className="crd mp2-onboarding-card" style={{ background: 'rgba(33,24,45,.74)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{txt.linksTitle}</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '20px' }}>{txt.linksSub}</p>

            <div style={{margin:'6px 0 18px'}}>
              <h2 style={{fontSize:17,fontWeight:750,color:'#F5F2FF',margin:'0 0 7px'}}>{tc.heading}</h2>
              <p style={{fontSize:12,color:'#B9B0C9',margin:'0 0 14px'}}>{tc.sub}</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8}}>
                {(['instagram','whatsapp','tiktok','youtube','facebook','site','x','spotify'] as const).map(tipo=>{
                  const adicionado=links.some(l=>l.tipo===tipo)
                  return <button key={tipo} type="button" onClick={()=>escolherCanal(tipo)} aria-pressed={adicionado}
                    style={{minWidth:0,minHeight:78,padding:'10px 4px',borderRadius:12,cursor:'pointer',border:`1px solid ${adicionado?G:'#554560'}`,background:adicionado?'#273019':'#211A2A',color:'#F5F2FF',fontFamily:'inherit',fontSize:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                    <span aria-hidden="true" style={{fontSize:19,color:adicionado?G:'#C8BFD3'}}>{tipo==='instagram'?'◎':tipo==='whatsapp'?'◉':tipo==='tiktok'?'♫':tipo==='youtube'?'▶':tipo==='facebook'?'f':tipo==='site'?'⊕':tipo==='x'?'𝕏':'♫'}</span>
                    <span style={{overflowWrap:'anywhere'}}>{tipo==='site'?'Site':tipo==='x'?'X':tipo.charAt(0).toUpperCase()+tipo.slice(1)}</span>
                    {adicionado&&<span style={{color:G,fontSize:11}}>✓</span>}
                  </button>
                })}
              </div>
              <p style={{color:G,fontSize:12,margin:'12px 0 0'}}>{tc.selected}: {new Set(links.filter(l=>l.url.trim()).map(l=>l.tipo)).size}</p>
            </div>
            <div style={{background:'#14101C',border:'1px solid #51405F',borderRadius:'13px',padding:'14px',marginBottom:'16px'}}>
              <label htmlFor="mp2-url-rapida" style={{display:'block',fontSize:'13px',fontWeight:700,color:'#F5F2FF',marginBottom:'9px'}}>{txt.importTitle}</label>
              <label htmlFor="mp2-plataforma-rapida" style={{display:'block',fontSize:'12px',color:'#B9B0C9',marginBottom:'6px'}}>{txt.platformLabel}</label>
              <select id="mp2-plataforma-rapida" value={plataformaRapida} onChange={e=>{setPlataformaRapida(e.target.value);setUrlRapida('');setAvisoUrlRapida('');setAvisoImportacaoConcluida('')}} style={{width:'100%',marginBottom:'10px',padding:'11px 12px',background:'#211A2A',color:'#F5F2FF',border:'1px solid #51405F',borderRadius:'10px'}}>
                <option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="x">X</option><option value="whatsapp">WhatsApp</option><option value="site">Site / Website</option><option value="spotify">Spotify</option>
              </select>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <input id="mp2-url-rapida" type="text" inputMode="text" value={urlRapida} aria-invalid={!!avisoUrlRapida} aria-describedby={avisoUrlRapida ? 'mp2-aviso-url-rapida' : undefined} onChange={e=>{const valor=e.target.value;setUrlRapida(valor);setAvisoUrlRapida('');setAvisoImportacaoConcluida('');try{const u=new URL(valor);const host=u.hostname.toLowerCase().replace(/^www\./,'');if(host==='open.spotify.com')setPlataformaRapida('spotify');else if(host==='youtube.com'||host==='youtu.be')setPlataformaRapida('youtube')}catch{}}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();importarLinkManual()}}} placeholder={txt.profilePlaceholder} style={{flex:'1 1 210px',minWidth:0,padding:'12px',borderRadius:'10px',border:'1px solid #51405F',background:'#0B0910',color:'#F5F2FF',fontFamily:'inherit'}} />
                <button type="button" disabled={atingiuLimiteLinks} onClick={importarLinkManual} style={{padding:'10px 14px',background:G,color:'#15180D',border:0,borderRadius:'10px',fontWeight:700,cursor:atingiuLimiteLinks?'not-allowed':'pointer'}}>{txt.importButton}</button>
              </div>
              {avisoUrlRapida && <p id="mp2-aviso-url-rapida" role="alert" style={{fontSize:12,color:'#FFB4B4',margin:'8px 0 10px',lineHeight:1.5}}>{avisoUrlRapida}</p>}
              {avisoImportacaoConcluida && <p role="status" style={{fontSize:12,color:'#C9FA45',margin:'8px 0 10px',lineHeight:1.5}}>{avisoImportacaoConcluida}</p>}
              <SmartMediaLookup value={urlRapida} onApply={adicionarMidiaVerificada} language={idioma} />
              {plataformaRapida === 'spotify' && <SpotifyBuscaCatalogo idioma={idioma} onSelecionar={item => adicionarMidiaVerificada({provider:'spotify', title:item.titulo, url:item.url})} />}
              <div style={{marginTop:16,padding:14,border:'1px solid #4F405F',borderRadius:12,background:'#14101C'}}>
                <h3 style={{fontSize:15,color:'#F8F4F7',margin:'0 0 6px'}}>{tx.importYoutube}</h3>
                <p style={{fontSize:12,color:'#B9B0C9',margin:'0 0 10px'}}>{tx.youtubeIntro}</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input aria-label={tx.channel} value={youtubeFonte} onChange={e => {setYoutubeFonte(e.target.value);setYoutubeErro('')}}
                    placeholder="@canal ou https://www.youtube.com/@canal"
                    style={{flex:'1 1 220px',minWidth:0,padding:11,borderRadius:9,background:'#0B0910',color:'#F8F4F7',border:'1px solid #51405F'}} />
                  <button type="button" onClick={buscarVideosCanal} disabled={youtubeConsultando || !permiteVideos(planoTipo)}
                    style={{padding:'10px 14px',background:'#C9FA45',color:'#15180D',border:0,borderRadius:9,fontWeight:700,opacity:!permiteVideos(planoTipo)?0.5:1}}>
                    {youtubeConsultando ? tx.lookingUp : tx.searchVideos}
                  </button>
                </div>
                {!permiteVideos(planoTipo) && <p style={{fontSize:12,color:'#FCD34D'}}>{tx.videoUnavailable}</p>}
                {youtubeErro && <p role="alert" style={{fontSize:12,color:'#FFB4B4',marginTop:10}}>{youtubeErro}</p>}
                {youtubeResultados.length > 0 && <>
                  <p style={{fontSize:12,color:'#C9FA45',margin:'12px 0 8px'}}>{tx.selected}: {youtubeSelecionados.length}/4. {tx.freeOneVideo}</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
                    {youtubeResultados.map(video => <button key={video.videoId} type="button" onClick={() => alternarVideoYouTube(video.videoId)}
                      aria-pressed={youtubeSelecionados.includes(video.videoId)}
                      style={{padding:8,textAlign:'left',background:'#20182A',border:`2px solid ${youtubeSelecionados.includes(video.videoId)?'#C9FA45':'#51405F'}`,borderRadius:10,color:'#F8F4F7',cursor:'pointer'}}>
                      <span style={{display:'block',position:'relative',width:'100%',aspectRatio:'16/9',overflow:'hidden',borderRadius:8,background:'#0B0A10'}}>
                        <img src={video.miniatura} alt="" loading="lazy" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
                        <span aria-label="YouTube" style={{position:'absolute',top:7,left:7,display:'grid',placeItems:'center',width:25,height:25,background:'#FFFFFF',color:'#FF0033',borderRadius:'50%',fontSize:12,fontWeight:900,boxShadow:'0 1px 6px rgba(0,0,0,.3)'}}><svg width="17" height="17" viewBox="0 0 28 24" aria-hidden="true"><rect x="1" y="3" width="26" height="18" rx="5.5" fill="#FF0033"/><path d="M11 8.2L19 12L11 15.8Z" fill="#FFFFFF"/></svg></span>
                        {youtubeSelecionados.includes(video.videoId) && <span style={{position:'absolute',top:7,right:7,background:'#C9FA45',color:'#15180D',borderRadius:6,padding:'2px 6px',fontSize:11,fontWeight:900}}>✓</span>}
                        <span style={{position:'absolute',bottom:0,left:0,right:0,padding:'24px 8px 8px',background:'linear-gradient(transparent,rgba(0,0,0,.92))',color:'#FFF',textAlign:'center',fontSize:11,fontWeight:800,lineHeight:1.3,display:'-webkit-box',WebkitBoxOrient:'vertical',WebkitLineClamp:2,overflow:'hidden',overflowWrap:'anywhere'}} title={video.titulo}>{video.titulo}</span>
                      </span>
                    </button>)}
                  </div>
                </>}
                {videosExcedentesFree && <p role="status" style={{color:'#F6CFFF',fontSize:12,marginTop:11}}>{tx.upgradeVideos}</p>}
              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {links.map(l => (
                <div key={l.id} style={{ background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select value={l.tipo} onChange={e => editarLink(l.id, 'tipo', e.target.value)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '8px', padding: '8px 10px', fontSize: '12.5px', color: '#F8F4F7', fontFamily: 'inherit' }}>
                      {PLATAFORMAS_LINK.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <button onClick={() => removerLink(l.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>{txt.remove}</button>
                  </div>
                  <input value={l.titulo} onChange={e => editarLink(l.id, 'titulo', e.target.value)} placeholder={tx.linkTitlePlaceholder} style={{ width: '100%', background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#F8F4F7', marginBottom: '8px', fontFamily: 'inherit' }} />
                  <input value={l.url} onChange={e => editarLink(l.id, 'url', e.target.value)} placeholder={placeholderPlataforma(l.tipo)} style={{ width: '100%', background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#F8F4F7', fontFamily: 'inherit' }} />
                </div>
              ))}
            </div>

            <button onClick={adicionarLink} disabled={atingiuLimiteLinks} style={{ width: '100%', height: '42px', background: 'rgba(139,92,246,.10)', border: '1px dashed rgba(139,92,246,.35)', borderRadius: '10px', color: atingiuLimiteLinks ? '#6B5C6E' : '#C4B5FD', fontSize: '13px', fontWeight: 600, cursor: atingiuLimiteLinks ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
              + {txt.addLink}
            </button>
            {linksExcedentesFree && <p role="status" style={{fontSize:12,color:'#E3C7F6',marginBottom:10}}>{tx.upgradeLinks}</p>}
            {atingiuLimiteLinks && <p style={{ fontSize: '12px', color: '#FCD34D', marginBottom: '10px' }}>{tx.demoLimitLinks}</p>}

            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            {confirmarPoucosLinks && <div role="status" style={{padding:14,border:'1px solid #C9FA45',borderRadius:12,margin:'0 0 12px',color:'#F2EAF8',fontSize:13}}>
               {tc.warning}
               <button type="button" onClick={avancarEtapa3} style={{display:'block',marginTop:12,padding:'10px 14px',background:'#332543',color:'#F5F2FF',border:'1px solid #66546F',borderRadius:9,cursor:'pointer'}}>{tc.proceed}</button>
             </div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapaIndex(i => i - 1)} style={{ flexShrink: 0, height: '48px', padding: '0 18px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {txt.back}
              </button>
              <button onClick={avancarEtapa3} style={{ flex: 1, height: '48px', background: G, color: '#15180D', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {txt.continue}
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'destaque' && (
          <div className="crd mp2-onboarding-card" style={{ background: 'rgba(33,24,45,.74)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{tx.addHighlight}</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '20px' }}>{tx.highlightIntro}</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
              <label style={{ cursor: 'pointer' }}>
                {destaqueImagemUrl ? (
                  <img src={destaqueImagemUrl} alt="Imagem do destaque" style={{ width: '100%', maxWidth: '220px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #2A1A2F' }} />
                ) : (
                  <div style={{ width: '220px', height: '120px', borderRadius: '12px', border: '1px dashed #2A1A2F', background: 'rgba(8,6,10,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', color: '#8B8594' }}>
                    {tx.highlightImage}
                  </div>
                )}
                <input type="file" accept="image/*" onChange={uploadImagemDestaque} style={{ display: 'none' }} />
              </label>
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>{tx.title}</label>
            <input value={destaqueTitulo} onChange={e => setDestaqueTitulo(e.target.value)} placeholder={tx.highlightTitlePlaceholder} style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>{tx.descriptionOptional}</label>
            <textarea value={destaqueDescricao} onChange={e => setDestaqueDescricao(e.target.value)} placeholder={tx.highlightDescriptionPlaceholder} rows={2} style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit', resize: 'none' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>{tx.linkOptional}</label>
            <input value={destaqueUrl} onChange={e => setDestaqueUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '24px', fontFamily: 'inherit' }} />

            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapaIndex(i => i - 1)} style={{ flexShrink: 0, height: '48px', padding: '0 18px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {txt.back}
              </button>
              <button onClick={avancarDestaque} style={{ flex: 1, height: '48px', background: G, color: '#15180D', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {txt.continue}
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'planos' && (guiaPlanosAberto ? (
          <GuiaPlanosOnboarding idioma={idioma} planoAtual={planoTipo} onFechar={()=>setGuiaPlanosAberto(false)} onSelecionarPago={(plano,ciclo,pais)=>{
              if(planoTipo!=='free'){setMsg('Assinaturas existentes são preservadas; mudanças devem ser tratadas pelo suporte.');return}
              setStripeDesejado({plano,ciclo,pais})
              setPlanoDeInteresse(plano)
              setGuiaPlanosAberto(false)
              setEtapaIndex(i=>i+1)
            }} onEscolher={(tipo)=>{
              // Nunca avance para a tela de sucesso por uma escolha paga ainda sem pagamento confirmado.
              // Contas pagas existentes podem concluir com seu plano ja contratado.
              if(tipo!=='free' && tipo!==planoTipo) {
                setMsg('A contratação do plano escolhido depende da confirmação do pagamento.');
                return
              }
              // Nunca rebaixe uma assinatura paga quando o visitante apenas consultar o Free.
              if(tipo==='free' && planoTipo!=='free') {setGuiaPlanosAberto(false);return}
              if(tipo==='free' && planoTipo==='free')setStripeDesejado(null)
              setPlanoDeInteresse(tipo===planoTipo ? null : tipo)
              setGuiaPlanosAberto(false)
              // Preserva a intencao de compra opcional, apenas para conta Free em homologacao.
              if(planoTipo==='free' && tipo!=='free') void registrarInteresseHomolog(tipo)
              setEtapaIndex(i=>i+1)
          }}/>
        ) : (
          <div className="crd mp2-onboarding-card" style={{background:'rgba(33,24,45,.74)',border:'1px solid #4C3B59',borderRadius:20,padding:'28px 24px'}}>
            <h1 style={{fontSize:22,fontWeight:800,color:'#F8F4F7',margin:'0 0 12px'}}>{tx.reviewTitle}</h1>
            <p style={{fontSize:13,color:'#CFC5D9',lineHeight:1.6,marginBottom:16}}>{tx.reviewIntro}</p>
            <div style={{border:'1px solid #5B4A69',borderRadius:13,padding:15,background:'#17101F',marginBottom:12}}>
              <strong style={{color:'#F8F4F7',fontSize:15}}>{tx.preparedSummary}</strong>
              <p style={{fontSize:12,color:'#E7DCEE',lineHeight:1.7,margin:'9px 0 0'}}>{links.filter(l=>l.url.trim()).length} links · {youtubeSelecionados.length} {tx.videos} YouTube · {igMidiasSelecionadas.length} {tx.instagramPosts}.</p>
              <p style={{fontSize:11,color:'#C6B8D0',lineHeight:1.6,margin:'9px 0 0'}}>{tx.previewCaveat}</p>
            </div>
            <p style={{fontSize:12,color:'#D5BDD8',lineHeight:1.6,margin:'8px 0 12px'}}>
              {planoTipo==='free'
                ? (idioma==='pt-BR'?'Você escolherá expressamente o Free (sem cobrança) ou um plano pago na próxima etapa.':idioma==='es-ES'?'Elegirás Free (sin cobro) o un plan de pago en el siguiente paso.':idioma==='fr-FR'?'Choisissez Free (sans paiement) ou une formule payante à l’étape suivante.':idioma==='de-DE'?'Im nächsten Schritt wählst du Free (kostenlos) oder einen bezahlten Tarif.':idioma==='it-IT'?'Nel prossimo passaggio scegli Free (gratuito) o un piano a pagamento.':'Next you will explicitly choose Free (no charge) or a paid plan.')
                : tx.currentPaid}
            </p>
            <button type="button" onClick={()=>setGuiaPlanosAberto(true)} style={{background:G,color:'#121609',border:0,borderRadius:10,padding:'15px 18px',width:'100%',fontWeight:850,cursor:'pointer'}}>{txt.continue}</button>

            {planoDeInteresse && <div role="status" style={{background:'#21192A',border:'1px solid #675679',borderRadius:11,padding:'12px 13px',marginTop:12,color:'#F8F4F7',fontSize:12,lineHeight:1.55}}>
              {idioma==='pt-BR' ? 'Você escolheu um plano para consultar. Sua assinatura atual não foi alterada e nenhuma cobrança foi criada. Conclua a MiniPage com seu plano atual; no final você poderá consultar a contratação do plano escolhido.' :
               idioma==='es-ES' ? 'Elegiste un plan para consultar. Tu suscripción no ha cambiado y no se ha generado ningún cargo. Termina tu MiniPage antes de solicitar el cambio.' :
               idioma==='fr-FR' ? 'Vous avez choisi une formule à consulter. Aucun abonnement ni paiement n’a été modifié. Terminez votre MiniPage avant de demander un changement.' :
               idioma==='de-DE' ? 'Du hast einen Tarif zur Prüfung gewählt. Dein Abo bleibt unverändert und es erfolgt keine Zahlung. Schließe deine MiniPage zuerst ab.' :
               idioma==='it-IT' ? 'Hai scelto un piano da valutare. L’abbonamento resta invariato e non avviene alcun addebito. Prima completa la MiniPage.' :
               'You selected a plan for review. Your subscription has not changed and no charge was created. Finish your MiniPage before requesting a plan change.'}
            </div>}
            {msg && <p role="alert" style={{color:'#FFB4B4',fontSize:12,marginTop:10}}>{msg}</p>}
            <button type="button" onClick={()=>setEtapaIndex(i=>i-1)} style={{marginTop:16,background:'none',border:0,color:'#CFC5D9',padding:8,cursor:'pointer'}}>{txt.back}</button>
          </div>
        ))}

        {etapaAtual === 'finalizar' && (
          <div className="crd mp2-onboarding-card" style={{ background: 'rgba(33,24,45,.74)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '36px 24px', textAlign: 'center' }}>
            {salvando ? (
              <p style={{ fontSize: '14px', color: '#B8AAB8' }}>{aplicandoModelo ? tx.buildingTemplate : tx.saving}</p>
            ) : erroModelo ? (
              <>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '8px' }}>{tx.templateReady}</p>
                <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '22px' }}>{tx.retryTemplate}</p>
                <button onClick={tentarModeloDeNovo} style={{ width: '100%', height: '48px', background: G, color: '#15180D', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
                  {tx.tryAgain}
                </button>
                <button onClick={continuarSemModelo} style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {tx.continueNoTemplate}
                </button>
              </>
            ) : !concluido ? (
              <>
                {estadoInteresseHomolog && <p role="status" style={{fontSize:12,color:'#D5E8BA',lineHeight:1.55,marginBottom:12}}>{estadoInteresseHomolog}</p>}
                {msg && <p style={{ fontSize: '13px', color: '#F87171', marginBottom: '20px' }}>{msg}</p>}
                <button onClick={() => setEtapaIndex(i => i - 1)} style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {txt.back}
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '56px', height: '56px', borderRadius: '999px', background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '26px' }}>
                  ✓
                </div>
                {modeloAplicado ? (
                  <>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>{tx.savedPage}</h1>
                    <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '14px' }}>{tx.customizeNow}</p>
                    {!podeUsarCatalogo(planoTipo) && (
                      <p style={{ fontSize: '12.5px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '14px' }}>{tx.catalogFromStore}</p>
                    )}
                  </>
                ) : (
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>{tx.savedPage}</h1>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginBottom: '24px' }}>
                  {resumoFinal.map(r => (
                    <p key={r} style={{ fontSize: '12.5px', color: '#B8AAB8' }}>✓ {r}</p>
                  ))}
                </div>

                {planoTipo==='free' && <div style={{border:'1px solid #4A3D54',borderRadius:14,background:'#15101F',padding:16,marginBottom:18}}>
                  {stripeDesejado ? (stripeDesejado.pais==='BR' ? (
                    <>
                      <p role="status" style={{color:'#F9DB9D',fontSize:13,margin:'0 0 14px'}}>{idioma==='pt-BR'?'Pagamento brasileiro pela EBANX ainda não habilitado. Sua MiniPage foi salva no Free, sem cobrança.':'EBANX payments in Brazil are not yet available. Your page is saved on Free, with no charge.'}</p>
                      <button type="button" onClick={()=>marcarVistoEIr('/painel')} style={{display:'block',width:'100%',border:'1px solid #C9FA45',borderRadius:10,background:'#C9FA45',padding:'14px',color:'#0B0A10',fontWeight:850,cursor:'pointer',fontSize:14,marginBottom:10}}>{idioma==='pt-BR'?'Continuar no Free — sem cobrança':'Continue with Free — no charge'}</button>
                      <button type="button" onClick={()=>{setGuiaPlanosAberto(true);setEtapaIndex(etapasAtivas.indexOf('planos'))}} style={{display:'block',width:'100%',border:'1px solid #66546F',borderRadius:10,background:'transparent',padding:'12px',color:'#F8F4F7',fontWeight:700,cursor:'pointer',fontSize:13}}>{idioma==='pt-BR'?'← Voltar aos planos':'← Back to plans'}</button>
                    </>
                  ) : (
                    <>
                      <p style={{color:'#DFD5EA',fontSize:13,margin:'0 0 14px'}}>{idioma==='pt-BR'?'Sua página foi salva. Conclua o pagamento para ativar o plano escolhido. Até a confirmação, o Free permanece ativo.':'Your page is saved. Complete payment to activate your selected plan. Free remains active until confirmation.'}</p>
                      <button type="button" onClick={()=>marcarVistoEIr('/painel/contratar?plan='+stripeDesejado.plano+'&cycle='+stripeDesejado.ciclo+'&country='+stripeDesejado.pais)} style={{display:'block',width:'100%',border:'1px solid #C9FA45',borderRadius:10,background:'#C9FA45',padding:'14px',color:'#0B0A10',fontWeight:850,cursor:'pointer',fontSize:14,marginBottom:10}}>{idioma==='pt-BR'?'Continuar para pagamento seguro':'Continue to secure checkout'}</button>
                      <button type="button" onClick={()=>{setGuiaPlanosAberto(true);setEtapaIndex(etapasAtivas.indexOf('planos'))}} style={{display:'block',width:'100%',border:'1px solid #66546F',borderRadius:10,background:'transparent',padding:'12px',color:'#F8F4F7',fontWeight:700,cursor:'pointer',fontSize:13}}>{idioma==='pt-BR'?'← Voltar aos planos':'← Back to plans'}</button>
                    </>
                  )) : (
                    <>
                      <p style={{color:'#DFD5EA',fontSize:13,margin:'0 0 14px'}}>{idioma==='pt-BR'?'Sua MiniPage foi salva no plano Free, sem cobrança.':'Your MiniPage is saved on Free, with no charge.'}</p>
                      <button type="button" onClick={()=>marcarVistoEIr('/painel')} style={{display:'block',width:'100%',border:'1px solid #C9FA45',borderRadius:10,background:'#C9FA45',padding:'14px',color:'#0B0A10',fontWeight:850,cursor:'pointer',fontSize:14,marginBottom:10}}>{idioma==='pt-BR'?'Continuar com o Free — sem cobrança':'Continue with Free — no charge'}</button>
                      <button type="button" onClick={()=>{setGuiaPlanosAberto(true);setEtapaIndex(etapasAtivas.indexOf('planos'))}} style={{display:'block',width:'100%',border:'1px solid #66546F',borderRadius:10,background:'transparent',padding:'12px',color:'#F8F4F7',fontWeight:700,cursor:'pointer',fontSize:13}}>{idioma==='pt-BR'?'← Voltar aos planos':'← Back to plans'}</button>
                    </>
                  )}
                </div>}

                {conteudoAnterior && (
                  <div role="status" style={{padding:'14px 16px',border:'1px solid #746136',borderRadius:12,background:'#241D14',color:'#F6E2AF',fontSize:13,lineHeight:1.6,marginBottom:15,textAlign:'left'}}>
                    {tx.previousContents} <a href="/painel/limpar-legado" style={{color:'#C9FA45',textDecoration:'underline'}}>{tx.cleanupTool}</a>.
                  </div>
                )}
                {planoTipo!=='free' && (
                  <div style={{border:'1px solid #4A3D54',borderRadius:14,background:'#15101F',padding:16,marginBottom:18}}>
                    <p role="status" style={{fontSize:13,color:'#DFD5EA',lineHeight:1.5,margin:'0 0 14px'}}>{idioma==='pt-BR'?'Esta conta ja possui um plano. A contratacao de outro plano deve ser tratada em Meu Plano para evitar cobranças duplicadas.':'This account already has a plan. Manage changes under My Plan to prevent duplicate billing.'}</p>
                    <button type="button" onClick={()=>marcarVistoEIr('/painel/plano')} style={{display:'block',width:'100%',border:'1px solid #C9FA45',borderRadius:10,background:'#C9FA45',padding:'14px',color:'#0B0A10',fontWeight:850,cursor:'pointer',fontSize:14,marginBottom:10}}>{idioma==='pt-BR'?'Ir para Meu Plano':'Go to My Plan'}</button>
                    <button type="button" onClick={()=>{setGuiaPlanosAberto(true);setEtapaIndex(etapasAtivas.indexOf('planos'))}} style={{display:'block',width:'100%',border:'1px solid #66546F',borderRadius:10,background:'transparent',padding:'12px',color:'#F8F4F7',fontWeight:700,cursor:'pointer',fontSize:13}}>{idioma==='pt-BR'?'← Retornar aos planos':'← Back to plans'}</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
        {etapaAtual !== 'finalizar' && (
          <aside className="mp2-preview-column" aria-label="Prévia da sua MiniPage">
            <button type="button" className="mp2-preview-toggle" aria-expanded={previewMobileAberta} onClick={() => setPreviewMobileAberta(v => !v)}>
              <span>◉ {txt.previewToggle}</span>
              <span aria-hidden="true">{previewMobileAberta ? '−' : '+'}</span>
            </button>
            <div className={`mp2-preview-body ${previewMobileAberta ? '' : 'mp2-preview-closed'}`}>
              <div style={{color:'#C9FA45',fontSize:'11px',letterSpacing:'.10em',fontWeight:800,marginBottom:'10px',textAlign:'center'}}>{txt.previewTitle}</div>
              <div style={{color:'#B9B0C9',fontSize:'12px',lineHeight:1.5,textAlign:'center',marginBottom:'16px'}}>{txt.previewSub}</div>
              <PreviewInstagramPremium
                idioma={idioma}
                nome={nome}
                slug={slug}
                bio={bio}
                fotoPerfilUrl={fotoPerfilUrl}
                instagram={instagram}
                whatsapp={whatsapp}
                perfilInstagram={igPerfil}
                midias={igMidias}
                midiasSelecionadas={igMidiasSelecionadas}
                midiaCapaId={midiaCapaAtivaId}
                stories={igStories}
                storiesConsultados={igStoriesConsultados}
                youtubeResultados={youtubeResultados}
                youtubeSelecionados={youtubeSelecionados}
                youtubeCanalDados={youtubeCanalDados}
                links={links.filter(l=>l.url.trim()).map(l=>({id:l.id,titulo:l.titulo.trim()||labelPlataforma(l.tipo)||'Meu link',tipo:l.tipo,url:l.url.trim()}))}
                temaPremium={temaPremium}
                temaFree={temaFree}
                planoAtual={planoTipo}
                modo={modoPrevia}
                onModoChange={setModoPrevia}
              />
            </div>
          </aside>
        )}
        </div>
      </div>
    </div>
  )
}
