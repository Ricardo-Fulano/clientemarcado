import type { Idioma } from './idiomas'

// Textos da apresentacao da marca na primeira secao da landing.
// Separados do dicionario legado para preservar as traducoes ja existentes.
type TextoMarca = {
  selo: string
  titulo1: string
  titulo2: string
  subtitulo: string
  descricao: string
  qr: string
  assinatura: string
  chamadaGratis: string
  orientarPlanos: string
  botaoPlanos: string
}

export const TEXTOS_MARCA_MINIPAGE: Record<Idioma, TextoMarca> = {
  'pt-BR': {
    selo: 'Sua MiniPage, seu cartão de visita digital',
    titulo1: 'Tudo sobre você ou seu negócio.',
    titulo2: 'Em uma única MiniPage.',
    subtitulo: 'Seus contatos, suas redes sociais e tudo o que você oferece em um só lugar.',
    descricao: 'Reúna WhatsApp, links, vídeos, produtos, conteúdos e agendamentos em uma página profissional, pronta para compartilhar.',
    qr: 'Compartilhe com um link ou QR Code.',
    chamadaGratis: 'Comece grátis. Evolua quando quiser.',
    orientarPlanos: 'Desça até os planos, escolha o ideal e siga para o cadastro..',
    botaoPlanos: 'Conhecer os planos ↓',
    assinatura: 'Qual é a sua MiniPage?',
  },
  'en-US': {
    selo: 'Your digital business card',
    titulo1: 'Everything about you or your business.',
    titulo2: 'In one MiniPage.',
    subtitulo: 'Your contacts, social profiles, and everything you offer—all in one place.',
    descricao: 'Bring together WhatsApp, links, videos, products, content, and bookings on a professional page made to share.',
    qr: 'Share it with a link or QR code.',
    chamadaGratis: 'Start free. Upgrade whenever you want.',
    orientarPlanos: 'Scroll to the plans, choose yours, and continue to sign up.',
    botaoPlanos: 'Explore plans ↓',
    assinatura: 'What’s your MiniPage?',
  },
  'es-ES': {
    selo: 'Tu tarjeta de presentación digital',
    titulo1: 'Todo sobre ti o tu negocio.',
    titulo2: 'En una sola MiniPage.',
    subtitulo: 'Tus contactos, redes sociales y todo lo que ofreces en un solo lugar.',
    descricao: 'Reúne WhatsApp, enlaces, vídeos, productos, contenido y reservas en una página profesional lista para compartir.',
    qr: 'Compártela con un enlace o código QR.',
    chamadaGratis: 'Empieza gratis. Mejora tu plan cuando quieras.',
    orientarPlanos: 'Desplázate hasta los planes, elige el tuyo y continúa con el registro.',
    botaoPlanos: 'Ver planes ↓',
    assinatura: '¿Cuál es tu MiniPage?',
  },
  'fr-FR': {
    selo: 'Votre carte de visite numérique',
    titulo1: 'Tout sur vous ou votre activité.',
    titulo2: 'Sur une seule MiniPage.',
    subtitulo: 'Vos contacts, réseaux sociaux et toutes vos offres au même endroit.',
    descricao: 'Rassemblez WhatsApp, liens, vidéos, produits, contenus et réservations sur une page professionnelle facile à partager.',
    qr: 'Partagez-la par lien ou code QR.',
    chamadaGratis: 'Commencez gratuitement. Passez à une offre supérieure quand vous le souhaitez.',
    orientarPlanos: 'Faites défiler jusqu’aux offres, choisissez la vôtre et inscrivez-vous.',
    botaoPlanos: 'Découvrir les offres ↓',
    assinatura: 'Quelle est votre MiniPage ?',
  },
  'de-DE': {
    selo: 'Deine digitale Visitenkarte',
    titulo1: 'Alles über dich oder dein Business.',
    titulo2: 'Auf einer einzigen MiniPage.',
    subtitulo: 'Deine Kontakte, Social-Media-Profile und Angebote an einem Ort.',
    descricao: 'Vereine WhatsApp, Links, Videos, Produkte, Inhalte und Buchungen auf einer professionellen Seite zum Teilen.',
    qr: 'Teile sie per Link oder QR-Code.',
    chamadaGratis: 'Kostenlos starten. Jederzeit upgraden.',
    orientarPlanos: 'Scrolle zu den Tarifen, wähle deinen und fahre mit der Anmeldung fort.',
    botaoPlanos: 'Tarife ansehen ↓',
    assinatura: 'Wie lautet deine MiniPage?',
  },
  'it-IT': {
    selo: 'Il tuo biglietto da visita digitale',
    titulo1: 'Tutto su di te o sulla tua attività.',
    titulo2: 'In un’unica MiniPage.',
    subtitulo: 'Contatti, social e tutto ciò che offri in un unico posto.',
    descricao: 'Riunisci WhatsApp, link, video, prodotti, contenuti e prenotazioni in una pagina professionale pronta da condividere.',
    qr: 'Condividila con un link o un codice QR.',
    chamadaGratis: 'Inizia gratis. Passa a un piano superiore quando vuoi.',
    orientarPlanos: 'Scorri fino ai piani, scegli quello giusto e continua con la registrazione.',
    botaoPlanos: 'Scopri i piani ↓',
    assinatura: 'Qual è la tua MiniPage?',
  },
}
