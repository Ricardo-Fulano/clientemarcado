'use client'
import Link from 'next/link'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import AssistenteComercial from '@/app/components/AssistenteComercial'
import SeletorIdiomaGlobal from './components/SeletorIdiomaGlobal'
import { useIdiomaGlobal } from './components/IdiomaProviderGlobal'
import type { Idioma } from './lib/i18n-global/idiomas'
import { traduzirLanding } from './lib/i18n-global/landing'
import { TEXTOS_MARCA_MINIPAGE } from './lib/i18n-global/marca-minipage'
import { obterNomePlano, obterPrecoPlanoPorCiclo, type BillingCycle } from './lib/planos'
import { precoRegional, mostrarPrecoRegional, TEXTOS_PRECOS, type PaisRegional } from './lib/billing/precos-regionais-publicos'
const CHECKOUT_URL = "https://minipage.pro/#plano"
const G = '#C9FA45'
const MERCADOS: Record<Idioma,string[]> = {
  "pt-BR": [
    "Modalidade da assinatura",
    "Brasil",
    "Internacional",
    "O país de faturamento será confirmado no pagamento.",
    "Pagamento brasileiro em preparação. Você pode criar sua página grátis.",
    "Assinatura anual: cobrança antecipada a cada 12 meses, até o cancelamento.",
    "Compare os planos e escolha cobrança mensal ou anual.",
    "Reembolso",
    "Privacidade",
    "Contrato de adesão",
    "Planos pagos são ativados após a confirmação do pagamento. Impostos aplicáveis e o valor final são informados antes da contratação. Cancelamentos e reembolsos seguem os termos e direitos legais."
  ],
  "en-US": [
    "Subscription market",
    "Brazil",
    "International",
    "Billing country is confirmed at checkout.",
    "Brazilian payments are being prepared. You can create your page for free.",
    "Annual subscription: billed in advance every 12 months until canceled.",
    "Compare plans and choose monthly or annual billing.",
    "Refunds",
    "Privacy",
    "Subscription agreement",
    "Paid plans activate after payment confirmation. Applicable taxes and the final amount are shown before purchase. Cancellation and refunds follow the terms and legal rights."
  ],
  "es-ES": [
    "Modalidad de suscripción",
    "Brasil",
    "Internacional",
    "El país de facturación se confirma al pagar.",
    "Los pagos en Brasil están en preparación. Puedes crear tu página gratis.",
    "Suscripción anual: cobro anticipado cada 12 meses hasta la cancelación.",
    "Compara los planes y elige facturación mensual o anual.",
    "Reembolsos",
    "Privacidad",
    "Contrato de adhesión",
    "Los planes de pago se activan tras confirmar el pago. Los impuestos aplicables y el importe final se muestran antes de contratar. Las cancelaciones y los reembolsos se rigen por las condiciones y los derechos legales."
  ],
  "fr-FR": [
    "Zone d’abonnement",
    "Brésil",
    "International",
    "Le pays de facturation est confirmé lors du paiement.",
    "Les paiements au Brésil sont en préparation. Vous pouvez créer votre page gratuitement.",
    "Abonnement annuel : facturation anticipée tous les 12 mois jusqu’à résiliation.",
    "Comparez les forfaits et choisissez une facturation mensuelle ou annuelle.",
    "Remboursements",
    "Confidentialité",
    "Contrat d’abonnement",
    "Les forfaits payants sont activés après confirmation du paiement. Les taxes applicables et le montant final sont indiqués avant la souscription. Les résiliations et remboursements suivent les conditions et les droits légaux."
  ],
  "de-DE": [
    "Abonnementregion",
    "Brasilien",
    "International",
    "Das Rechnungsland wird beim Bezahlen bestätigt.",
    "Zahlungen in Brasilien werden vorbereitet. Sie können Ihre Seite kostenlos erstellen.",
    "Jahresabo: Vorauszahlung alle 12 Monate bis zur Kündigung.",
    "Vergleichen Sie die Tarife und wählen Sie monatliche oder jährliche Abrechnung.",
    "Erstattungen",
    "Datenschutz",
    "Abonnementvertrag",
    "Kostenpflichtige Tarife werden nach Zahlungsbestätigung aktiviert. Steuern und Endbetrag werden vor Abschluss angezeigt. Kündigungen und Erstattungen richten sich nach den Bedingungen und gesetzlichen Rechten."
  ],
  "it-IT": [
    "Area di abbonamento",
    "Brasile",
    "Internazionale",
    "Il paese di fatturazione viene confermato al pagamento.",
    "I pagamenti in Brasile sono in preparazione. Puoi creare la tua pagina gratis.",
    "Abbonamento annuale: addebito anticipato ogni 12 mesi fino alla disdetta.",
    "Confronta i piani e scegli la fatturazione mensile o annuale.",
    "Rimborsi",
    "Privacy",
    "Contratto di adesione",
    "I piani a pagamento si attivano dopo la conferma del pagamento. Le imposte applicabili e l’importo finale sono mostrati prima dell’abbonamento. Disdette e rimborsi seguono le condizioni e i diritti di legge."
  ]
}

function traduzirExemplos(idioma: string, chave: string): string {
 const mapa: Record<string,Record<string,string>> = {
 'en-US':{'Minha MiniPage':'My MiniPage','Pessoal':'Personal','Redes, contatos e projetos em um link.':'Profiles, contacts and projects in one link.','Criador de conteúdo':'Content creator','Vídeos, novidades e recomendações.':'Videos, updates and recommendations.','Meu negócio':'My business','Serviços, catálogo e contato direto.':'Services, catalog and direct contact.'},
 'es-ES':{'Minha MiniPage':'Mi MiniPage','Pessoal':'Personal','Redes, contatos e projetos em um link.':'Redes, contactos y proyectos en un enlace.','Criador de conteúdo':'Creador de contenido','Vídeos, novidades e recomendações.':'Vídeos, novedades y recomendaciones.','Meu negócio':'Mi negocio','Serviços, catálogo e contato direto.':'Servicios, catálogo y contacto directo.'},
 'fr-FR':{'Minha MiniPage':'Ma MiniPage','Pessoal':'Personnel','Redes, contatos e projetos em um link.':'Réseaux, contacts et projets dans un seul lien.','Criador de conteúdo':'Créateur de contenu','Vídeos, novidades e recomendações.':'Vidéos, actualités et recommandations.','Meu negócio':'Mon entreprise','Serviços, catálogo e contato direto.':'Services, catalogue et contact direct.'},
 'de-DE':{'Minha MiniPage':'Meine MiniPage','Pessoal':'Privat','Redes, contatos e projetos em um link.':'Profile, Kontakte und Projekte in einem Link.','Criador de conteúdo':'Content Creator','Vídeos, novidades e recomendações.':'Videos, Neuigkeiten und Empfehlungen.','Meu negócio':'Mein Unternehmen','Serviços, catálogo e contato direto.':'Dienstleistungen, Katalog und direkter Kontakt.'},
 'it-IT':{'Minha MiniPage':'La mia MiniPage','Pessoal':'Personale','Redes, contatos e projetos em um link.':'Social, contatti e progetti in un solo link.','Criador de conteúdo':'Creatore di contenuti','Vídeos, novidades e recomendações.':'Video, novità e consigli.','Meu negócio':'La mia attività','Serviços, catálogo e contato direto.':'Servizi, catalogo e contatto diretto.'},
 };return mapa[idioma]?.[chave] || chave
}

// Beneficios de cada plano. Cada plano mostra so o que ADICIONA em relacao ao anterior ("Tudo do ... +" fica no
// cabecalho da lista), para o cliente enxergar a evolucao. A heranca Loja->Agenda e a regra
// comercial aprovada, AINDA PENDENTE de alinhamento no backend. NAO publicar antes disso.
//   t = texto do item | hl = trecho em destaque (cor) | forte = item de destaque (chip) | nota = explicacao curta
type ItemDoPlano = { t: string; hl?: string; forte?: boolean; nota?: string }
const itensFree: ItemDoPlano[] = [
  { t: 'Até 5 links rápidos', hl: 'Até 5' },
  { t: 'Foto, bio e redes sociais' },
  { t: 'Modelos básicos' },
  { t: 'Desempenho básico' },
]
const itensMiniPage: ItemDoPlano[] = [
  { t: 'Banner com vídeo' },
  { t: 'Links ilimitados', hl: 'ilimitados' },
  { t: 'Destaques ilimitados', hl: 'ilimitados' },
  { t: 'Vídeos' },
  { t: 'Agenda de eventos', nota: 'Divulga eventos na sua página. Não é o agendamento de clientes.' },
  { t: 'Todos os modelos de cor' },
  { t: 'Spotify' },
  { t: 'Painel de desempenho' },
  { t: 'Exportação CSV e Excel' },
  { t: 'Meta Pixel e Google Analytics 4' },
]
const itensAgenda: ItemDoPlano[] = [
  { t: 'Agendamento automático de clientes', forte: true },
  { t: 'Agenda de atendimento' },
  { t: 'Gestão de horários e disponibilidade' },
]
const itensLoja: ItemDoPlano[] = [
  { t: 'Catálogos ilimitados', forte: true },
  { t: 'WhatsApp no catálogo' },
  { t: 'Mensagem automática por item' },
  { t: 'Links de venda e achadinhos' },
  { t: 'Desempenho por produto/link' },
  { t: 'Captação de leads', forte: true },
  { t: 'Integrações de vendas externas' },
  { t: 'IA com ChatGPT e Claude', forte: true },
]
const itensProfissional: ItemDoPlano[] = [
  { t: 'Clientes' },
  { t: 'Orçamentos' },
  { t: 'Cobranças' },
  { t: 'Financeiro' },
  { t: 'Relatórios' },
  { t: 'Até 3 profissionais', hl: 'Até 3' },
]
const COR_DESTAQUE = '#C9FA45'   // Marca MiniPage: destaque visual nos planos.
const COR_SUAVE = '#C4B5FD'      // violeta claro: "ilimitados", "Ate N", separador "Tudo do ... +"

// Destaca (cor + negrito) um trecho do texto; sem trecho, devolve o texto como esta.
function Destacar({ texto, hl, cor }: { texto: string; hl?: string; cor: string }) {
  const i = hl ? texto.toLocaleLowerCase().indexOf(hl.toLocaleLowerCase()) : -1
  if (!hl || i < 0) return <>{texto}</>
  return <>{texto.slice(0, i)}<strong style={{color:cor,fontWeight:800}}>{hl}</strong>{texto.slice(i + hl.length)}</>
}

// Um beneficio da lista. "forte" vira um chip rosa (so alguns itens-chave por plano, para nao poluir).
function ItemLista({ item }: { item: ItemDoPlano }) {
  const check = <span style={{color:'#C9FA45',fontSize:'13px',flexShrink:0,fontWeight:700}}>✓</span>
  if (item.forte) {
    return (
      <div style={{background:'rgba(139,92,246,.10)',border:'1px solid rgba(139,92,246,.34)',borderRadius:'10px',padding:'8px 10px',marginBottom:'11px',boxShadow:'0 0 22px rgba(139,92,246,.12)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
          {check}
          <span style={{fontSize:'13px',fontWeight:800,color:COR_DESTAQUE,lineHeight:1.3}}>{item.t}</span>
        </div>
        {item.nota && <div style={{fontSize:'11px',color:'#D9CFD9',lineHeight:1.45,marginTop:'4px',paddingLeft:'22px'}}>{item.nota}</div>}
      </div>
    )
  }
  return (
    <div style={{marginBottom:'11px'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:'9px'}}>
        {check}
        <span style={{fontSize:'12px',fontWeight:600,color:'#E8DFE8',lineHeight:1.4}}><Destacar texto={item.t} hl={item.hl} cor={COR_SUAVE} /></span>
      </div>
      {item.nota && <div style={{fontSize:'11px',color:'#B8AAB8',lineHeight:1.45,marginTop:'3px',paddingLeft:'22px'}}>{item.nota}</div>}
    </div>
  )
}

type TipoPlanoLanding = 'free' | 'minipage' | 'agenda' | 'loja' | 'essencial'
// Cartao de plano. Nome, preco e botao continuam vindo de planos.ts / dos mesmos links de antes (o botao entra pronto em "cta").
function CartaoPlano({ tipo, billing, idioma, pais, selo, nicho, descricao, descricaoHl, herda, itens, variante = 'padrao', cta, disponivel, consultando, recomendado = false }: {
  tipo: TipoPlanoLanding; billing: BillingCycle; idioma: Idioma; pais: PaisRegional; selo: string; nicho?: string; descricao?: string; descricaoHl?: string
  herda?: string; itens: ItemDoPlano[]; variante?: 'padrao' | 'pro'; cta: ReactNode; disponivel: boolean; consultando: boolean; recomendado?: boolean
}) {
  const lp = (texto: string) => traduzirLanding(idioma, texto)
  const preco = precoRegional(tipo, tipo === 'free' ? 'mensal' : billing, pais, obterPrecoPlanoPorCiclo(tipo, tipo === 'free' ? 'mensal' : billing))
  const textoPreco = tipo === 'free' ? TEXTOS_PRECOS[idioma].gratuito : (preco ? mostrarPrecoRegional(preco, idioma) : (pais === 'OUTROS' ? TEXTOS_PRECOS[idioma].selecionarPais : TEXTOS_PRECOS[idioma].precoEmPreparacao))
  const pro = variante === 'pro'
  const fundo = pro ? 'radial-gradient(ellipse at top,rgba(139,92,246,.16),transparent 55%),rgba(24,16,27,.97)'
    : 'radial-gradient(ellipse at top,rgba(139,92,246,.10),transparent 55%),rgba(24,16,27,.97)'
  return (
    <div data-mp-plano={tipo} className={`plano-card${recomendado ? ' mp-recomendado' : ''}`} style={{background:fundo,border:pro?'1.5px solid rgba(139,92,246,.55)':'1.5px solid #2A1A2F',borderRadius:'22px',padding:'30px 22px',boxShadow:pro?'0 0 72px rgba(139,92,246,.20)':undefined,position:'relative' as const,display:'flex',flexDirection:'column' as const,flex:'0 0 250px',minWidth:'250px',scrollSnapAlign:'start'}}>
      {pro && <div style={{position:'absolute' as const,top:'-13px',left:'50%',transform:'translateX(-50%)',background:G,borderRadius:'999px',padding:'4px 18px',fontSize:'11px',fontWeight:700,color:'#15180D',whiteSpace:'nowrap' as const}}>{lp("Mais escolhido")}</div>}
      <div style={{textAlign:'center',marginBottom:'16px'}}>
        <h3 style={{fontSize:'19px',fontWeight:900,letterSpacing:'-0.02em',marginBottom:'8px',background:'linear-gradient(135deg,#C9FA45,#F5F2FF)',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',color:COR_DESTAQUE}}>{lp(obterNomePlano(tipo))}</h3>
        <div>
          <span style={{fontSize:'30px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em',whiteSpace:'nowrap'}}>{textoPreco}</span>
          {(tipo !== 'free' && preco) && <span style={{fontSize:'13px',color:'#B8AAB8',marginLeft:'3px'}}>{lp(billing === 'anual' ? '/ano' : '/mês')}</span>}
          {tipo !== 'free' && preco && billing === 'anual' && <div style={{fontSize:'11px',color:'#C9FA45',fontWeight:800,marginTop:'6px'}}>{lp("Anual · economize 17%")}</div>}
        </div>
      </div>
      <div className="plano-ideal" style={{textAlign:'center',marginBottom:'16px'}}>
        <span style={{display:'inline-block',fontSize:'10px',fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#C9FA45',background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.32)',borderRadius:'999px',padding:'3px 10px',marginBottom:'8px'}}>{lp(selo)}</span>
        {nicho && <p style={{fontSize:'13px',fontWeight:700,color:'#F8F4F7',lineHeight:1.4,marginBottom:descricao?'6px':0}}>{lp(nicho)}</p>}
        {descricao && <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5}}><Destacar texto={lp(descricao)} hl={descricaoHl ? lp(descricaoHl) : undefined} cor={COR_DESTAQUE} /></p>}
      </div>
      <div style={{flex:1,marginBottom:'18px'}}>
        {herda && (
          <div style={{display:'flex',alignItems:'center',gap:'8px',margin:'0 0 14px'}}>
            <span style={{flex:1,height:'1px',background:'rgba(139,92,246,.30)'}} />
            <span style={{fontSize:'11px',fontWeight:700,color:COR_SUAVE,whiteSpace:'nowrap' as const}}>{lp(herda)}</span>
            <span style={{flex:1,height:'1px',background:'rgba(139,92,246,.30)'}} />
          </div>
        )}
        {itens.map((item, i) => <ItemLista key={i} item={{ ...item, t: lp(item.t), hl: item.hl ? lp(item.hl) : undefined, nota: item.nota ? lp(item.nota) : undefined }} />)}
      </div>
      {tipo !== 'free' && pais !== 'BR' && !disponivel ? (
        <button type="button" disabled aria-disabled="true" title={TEXTOS_PRECOS[idioma].indisponivel}
          style={{width:'100%',padding:'12px 10px',minHeight:'46px',borderRadius:'12px',background:'#33263b',color:'#d9c6e0',border:'1px solid #67516c',fontWeight:700,cursor:'not-allowed'}}>
          {consultando ? "…" : TEXTOS_PRECOS[idioma].indisponivel}
        </button>
      ) : cta}
    </div>
  )
}
type GuiaPlano = { tipo: TipoPlanoLanding; titulo: string; resumo: string }
const HERANCA_LOJA: Record<string, string> = {
  'pt-BR': 'Tudo do Agenda +',
  'en-US': 'Everything in Agenda +',
  'es-ES': 'Todo lo de Agenda +',
  'fr-FR': 'Tout le forfait Agenda +',
  'de-DE': 'Alles aus Agenda +',
  'it-IT': 'Tutto di Agenda +',
}

const GUIA_PLANOS: Record<string, { titulo: string; introducao: string; opcoes: GuiaPlano[] }> = {
  "pt-BR": { titulo: "Qual plano combina com você?", introducao: "Escolha seu objetivo. Vamos destacar o plano recomendado; você decide antes de contratar.", opcoes: [
    { tipo: "free", titulo: "Quero começar grátis", resumo: "Foto, bio e até 5 links" },
    { tipo: "minipage", titulo: "Quero minha página profissional", resumo: "Tudo do Free + vídeos, links ilimitados, destaques, banner e Spotify" },
    { tipo: "agenda", titulo: "Preciso receber agendamentos", resumo: "Tudo do MiniPage + agendamento online, agenda e horários" },
    { tipo: "loja", titulo: "Quero mostrar e vender produtos", resumo: "Tudo do Agenda + catálogos, cursos e ferramentas de venda" },
    { tipo: "essencial", titulo: "Quero gestão completa", resumo: "Tudo do Loja + clientes, cobranças, financeiro e gestão" },
  ] },
  "en-US": { titulo: "Which plan fits your goal?", introducao: "Choose what you need. We will highlight a suggested plan; you decide before checkout.", opcoes: [
    { tipo: "free", titulo: "I want to start free", resumo: "Photo, bio and up to 5 links" },
    { tipo: "minipage", titulo: "I need a professional page", resumo: "All Free features + videos, unlimited links, banners and Spotify" },
    { tipo: "agenda", titulo: "I need online bookings", resumo: "All MiniPage features + online bookings and schedule management" },
    { tipo: "loja", titulo: "I want to sell products", resumo: "All Agenda features + catalogs, courses and sales tools" },
    { tipo: "essencial", titulo: "I need complete management", resumo: "All Store features + clients, billing, finance and management" },
  ] },
  "es-ES": { titulo: "¿Qué plan se adapta a ti?", introducao: "Elige tu objetivo. Destacaremos una recomendación; tú decides antes de pagar.", opcoes: [
    { tipo: "free", titulo: "Quiero empezar gratis", resumo: "Foto, biografía y hasta 5 enlaces" },
    { tipo: "minipage", titulo: "Quiero una página profesional", resumo: "Todo Free + vídeos, enlaces ilimitados, portadas y Spotify" },
    { tipo: "agenda", titulo: "Necesito reservas en línea", resumo: "Todo MiniPage + reservas en línea y gestión de horarios" },
    { tipo: "loja", titulo: "Quiero vender productos", resumo: "Todo Agenda + catálogos, cursos y herramientas de venta" },
    { tipo: "essencial", titulo: "Necesito gestión completa", resumo: "Todo Loja + clientes, cobros, finanzas y gestión" },
  ] },
  "fr-FR": { titulo: "Quel forfait vous convient ?", introducao: "Choisissez votre objectif. Nous suggérons une formule, sans vous engager.", opcoes: [
    { tipo: "free", titulo: "Je veux commencer gratuitement", resumo: "Photo, bio et 5 liens maximum" },
    { tipo: "minipage", titulo: "Je veux une page professionnelle", resumo: "Tout Free + vidéos, liens illimités, bannières et Spotify" },
    { tipo: "agenda", titulo: "Je veux des réservations", resumo: "Tout MiniPage + réservations et gestion des horaires" },
    { tipo: "loja", titulo: "Je veux vendre des produits", resumo: "Tout Agenda + catalogues, cours et outils de vente" },
    { tipo: "essencial", titulo: "Je veux une gestion complète", resumo: "Tout Loja + clients, facturation, finances et gestion" },
  ] },
  "de-DE": { titulo: "Welcher Tarif passt zu Ihnen?", introducao: "Wählen Sie Ihr Ziel. Wir markieren eine Empfehlung; Sie entscheiden vor der Zahlung.", opcoes: [
    { tipo: "free", titulo: "Kostenlos starten", resumo: "Foto, Bio und bis zu 5 Links" },
    { tipo: "minipage", titulo: "Professionelle Seite erstellen", resumo: "Alles aus Free + Videos, unbegrenzte Links, Banner und Spotify" },
    { tipo: "agenda", titulo: "Online-Buchungen anbieten", resumo: "Alles aus MiniPage + Online-Termine und Kalenderverwaltung" },
    { tipo: "loja", titulo: "Produkte verkaufen", resumo: "Alles aus Agenda + Kataloge, Kurse und Verkaufsfunktionen" },
    { tipo: "essencial", titulo: "Alles zentral verwalten", resumo: "Alles aus Loja + Kunden, Abrechnung, Finanzen und Verwaltung" },
  ] },
  "it-IT": { titulo: "Quale piano fa per te?", introducao: "Scegli il tuo obiettivo. Evidenziamo un suggerimento, senza obblighi.", opcoes: [
    { tipo: "free", titulo: "Voglio iniziare gratis", resumo: "Foto, bio e fino a 5 link" },
    { tipo: "minipage", titulo: "Voglio una pagina professionale", resumo: "Tutto Free + video, link illimitati, banner e Spotify" },
    { tipo: "agenda", titulo: "Ho bisogno di prenotazioni", resumo: "Tutto MiniPage + prenotazioni online e gestione orari" },
    { tipo: "loja", titulo: "Voglio vendere prodotti", resumo: "Tutto Agenda + cataloghi, corsi e strumenti di vendita" },
    { tipo: "essencial", titulo: "Voglio una gestione completa", resumo: "Tutto Loja + clienti, incassi, finanze e gestione" },
  ] },
}

export default function LandingPublica({somentePrecos = false}: {somentePrecos?: boolean}) {
  const { idioma, t } = useIdiomaGlobal()
  const lp = (texto: string) => traduzirLanding(idioma, texto)
  function irComCupom(e: React.MouseEvent<HTMLAnchorElement>, destino: string) {
    const cupom = new URLSearchParams(window.location.search).get('cupom')
    if (!cupom) return

    e.preventDefault()
    const separador = destino.includes('?') ? '&' : '?'
    window.location.href = `${destino}${separador}cupom=${encodeURIComponent(cupom)}`
  }

  const planosScrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [nomeDesejado, setNomeDesejado] = useState('')
  const [mostrarPlanos, setMostrarPlanos] = useState(somentePrecos)
  const [planoSugerido, setPlanoSugerido] = useState<TipoPlanoLanding | null>(null)
  const guiaDePlanos = GUIA_PLANOS[idioma] || GUIA_PLANOS['pt-BR']
  const avisoHeranca: Record<string, string> = {
    'pt-BR': 'Os planos são cumulativos: Loja inclui Agenda; Pro inclui Loja, Agenda e MiniPage.',
    'en-US': 'Plans build on each other: Store includes Agenda; Pro includes Store, Agenda and MiniPage.',
    'es-ES': 'Los planes son acumulativos: Loja incluye Agenda; Pro incluye Loja, Agenda y MiniPage.',
    'fr-FR': 'Les forfaits sont cumulatifs : Loja inclut Agenda ; Pro inclut Loja, Agenda et MiniPage.',
    'de-DE': 'Die Tarife bauen aufeinander auf: Loja enthält Agenda; Pro enthält Loja, Agenda und MiniPage.',
    'it-IT': 'I piani sono cumulativi: Loja include Agenda; Pro include Loja, Agenda e MiniPage.',
  }
  const nomeLimpo = nomeDesejado.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)
  function iniciarMinhaMiniPage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nomeLimpo || nomeLimpo.length < 3) return
    // Preferencia visual, NAO e reserva de nome: a disponibilidade sera revalidada ao criar.
    try { sessionStorage.setItem('mp_slug_desejado', nomeLimpo) } catch { /* navegacao sem storage */ }
    const cupom = new URLSearchParams(window.location.search).get('cupom')
    window.location.assign(`/cadastro?plano=free&slug=${encodeURIComponent(nomeLimpo)}${cupom ? `&cupom=${encodeURIComponent(cupom)}` : ''}`)
  }

  const [billingSelecionado, setBillingSelecionado] = useState<BillingCycle>('mensal')
  const [paisPrecos, setPaisPrecos] = useState<PaisRegional>('BR')
  const escolhaManual = useRef(false)
  const [cotacoes,setCotacoes] = useState<{ciclo:BillingCycle; planos:TipoPlanoLanding[]} | null>(null)
  const marca = TEXTOS_MARCA_MINIPAGE[idioma]
  const copy = MERCADOS[idioma] || MERCADOS['pt-BR']
  useEffect(() => {
    let ativo = true
    async function sugerirPais() {
      try {
        const r = await fetch('/api/geo/pais-preco', {cache:'no-store'})
        const d = r.ok ? await r.json() : null
        if (ativo && !escolhaManual.current && /^[A-Z]{2}$/.test(d?.pais || '')) setPaisPrecos(d.pais === 'BR' ? 'BR' : 'US')
      } catch { /* escolha manual permanece disponivel */ }
    }
    void sugerirPais()
    return () => { ativo = false }
  }, [])
  useEffect(() => {
    let ativo = true
    setCotacoes(null)
    if (paisPrecos !== 'BR' && mostrarPlanos) {
      const planos = ['minipage','agenda','loja','essencial'] as const
      void Promise.all(planos.map(async plano => {
        try {
          const r = await fetch(`/api/billing/stripe/quote?plan=${plano}&cycle=${billingSelecionado}&country=US`, {cache:'no-store'})
          const q = r.ok ? await r.json() : null
          const esperado = precoRegional(plano,billingSelecionado,'US',0)
          return q?.available === true && q.checkoutEnabled === true && q.plan === plano && q.cycle === billingSelecionado && q.country === 'US' && q.currency === 'USD' && q.amountMinor === esperado?.centavos ? plano : null
        } catch { return null }
      })).then(resultados => {if(ativo) setCotacoes({ciclo:billingSelecionado,planos:resultados.filter((v): v is typeof planos[number] => v !== null)})})
    }
    return () => {ativo=false}
  }, [paisPrecos,billingSelecionado,mostrarPlanos])
  const consultando = paisPrecos !== 'BR' && cotacoes?.ciclo !== billingSelecionado
  const disponivel = (plano:TipoPlanoLanding) => cotacoes?.ciclo === billingSelecionado && cotacoes.planos.includes(plano)
  const destinoPlano = (plano:TipoPlanoLanding) => `/cadastro?plano=free&interesse=${plano}&cycle=${billingSelecionado}&market=${paisPrecos === 'BR' ? 'BR' : 'INTL'}`
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  // MINIPAGE_2F_ABRIR_PLANOS_HASH
  useEffect(() => {
    if (window.location.hash === '#plano') {
      setMostrarPlanos(true)
      window.setTimeout(() => document.getElementById('plano')?.scrollIntoView({block:'start'}), 100)
    }
  }, [])
  const scrollToPlano = () => {
    setMostrarPlanos(true)
    window.requestAnimationFrame(() => window.setTimeout(() => document.getElementById('plano')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30))
  }
  const escolherObjetivo = (tipo: TipoPlanoLanding) => {
    setPlanoSugerido(tipo)
    window.requestAnimationFrame(() => {
      const card = document.querySelector<HTMLElement>(`[data-mp-plano="${tipo}"]`)
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    })
  }
  const moverCarrosselPlanos = (direcao: -1 | 1) => {
    const elemento = planosScrollRef.current
    if (!elemento) return
    const cartao = elemento.querySelector<HTMLElement>('.plano-card')
    const distancia = (cartao?.getBoundingClientRect().width ?? 250) + 18
    elemento.scrollBy({ left: direcao * distancia, behavior: 'smooth' })
  }
  return (
    <div style={{background:'#08070D',minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .btn-p{background:${G};color:#15180D;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 12px 32px rgba(139,92,246,.25);white-space:nowrap}
        .btn-p:hover{transform:translateY(-2px)}
        .btn-s{background:rgba(24,16,27,.88);color:#B8AAB8;border:1px solid #2A1A2F;border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;white-space:nowrap}
        .btn-s:hover{border-color:rgba(139,92,246,.45);color:#fff}
        .btn-ver-exemplos{background:rgba(139,92,246,.12);color:#F8F4F7;border:1.5px solid rgba(139,92,246,.55);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;white-space:nowrap;box-shadow:0 0 24px rgba(139,92,246,.16)}
        .btn-ver-exemplos:hover{background:rgba(139,92,246,.20);border-color:rgba(139,92,246,.8);transform:translateY(-2px);box-shadow:0 0 32px rgba(139,92,246,.26)}
        .card-b{background:radial-gradient(circle at top left,rgba(139,92,246,.07),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.96),rgba(18,10,20,.99));border:1px solid #2A1A2F;border-radius:18px;padding:28px 24px;transition:border-color .2s,transform .2s}
        .card-b:hover{border-color:rgba(139,92,246,.28);transform:translateY(-3px)}
        .tudo-conectado-orbita{position:relative;width:100%;max-width:520px;aspect-ratio:1/1;margin:0 auto}
        .tudo-conectado-linhas{position:absolute;inset:0;width:100%;height:100%;opacity:1;z-index:0;filter:drop-shadow(0 0 3px rgba(139,92,246,.25))}
        .tudo-conectado-central{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:132px;height:132px;border-radius:20px;background:radial-gradient(circle at top left,rgba(139,92,246,.16),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(10,6,12,.99));border:1.5px solid rgba(139,92,246,.32);box-shadow:0 0 40px rgba(139,92,246,.28),0 12px 32px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;z-index:2;animation:pulseGlow 3.5s ease-in-out infinite}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 40px rgba(139,92,246,.28),0 12px 32px rgba(0,0,0,.4)}50%{box-shadow:0 0 56px rgba(139,92,246,.38),0 12px 32px rgba(0,0,0,.4)}}
        .tudo-conectado-pill{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:5px;background:rgba(24,16,27,.92);border:1px solid #2A1A2F;border-radius:14px;padding:10px 12px;min-width:76px;z-index:1;backdrop-filter:blur(6px)}
        .tudo-conectado-pill span{font-size:10px;font-weight:600;color:#B8AAB8;white-space:nowrap}
        @media(max-width:360px){
          .mp-header-nav{gap:5px!important}
          .mp-header-login{padding:0 8px!important}
          .mp-nav-pricing{padding:0 9px!important}
        }
        @media(max-width:768px){
          .tudo-conectado-orbita{max-width:100%;aspect-ratio:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;place-items:center}
          .tudo-conectado-linhas{display:none}
          .tudo-conectado-central{position:static;transform:none;grid-column:1/-1;width:100%;max-width:220px;margin:0 auto 6px;animation:none}
          .tudo-conectado-pill{position:static;transform:none;width:100%}
        }
        /* MiniPage 2.0: hero de conversao, com demonstracao visual mobile-first. */
        .mp-hero-grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr);gap:68px;align-items:center;text-align:left}
        .mp-hero-copy{min-width:0}
        .mp-hero-form{display:flex;gap:8px;background:#1E1A26;border:1px solid #554364;border-radius:18px;padding:7px;margin:24px 0 10px;align-items:center;box-shadow:0 20px 54px rgba(0,0,0,.24)}
        .mp-hero-form:focus-within{border-color:#C9FA45;box-shadow:0 0 0 3px rgba(201,250,69,.12)}
        .mp-hero-form-prefix{font-size:14px;color:#E3DBEC;white-space:nowrap;padding-left:12px;font-weight:700}
        .mp-hero-form input{flex:1;width:30px;min-width:0;padding:14px 2px;background:transparent;color:white;border:0;outline:0;font-size:16px}
        .mp-hero-form button{height:46px;border:0;background:#C9FA45;color:#16190B;border-radius:12px;padding:0 19px;font-size:14px;font-weight:900;white-space:nowrap;cursor:pointer}
        .mp-hero-form button:disabled{opacity:.48;cursor:not-allowed}
        .mp-demo-wrap{position:relative;padding:22px 22px 22px 12px}
        .mp-demo-halo{position:absolute;inset:10% 2%;border-radius:45%;background:radial-gradient(ellipse,rgba(149,82,245,.22),transparent 67%);filter:blur(22px)}
        .mp-demo-phone{position:relative;margin:0 auto;width:100%;max-width:340px;min-height:480px;border:8px solid #292332;border-radius:35px;background:linear-gradient(155deg,#292038 0%,#15111C 48%,#0F0E15 100%);box-shadow:0 26px 90px rgba(0,0,0,.55);padding:26px 20px;text-align:center}
        .mp-demo-photo{width:74px;height:74px;border-radius:50%;background:#21182D;border:1px solid #C9FA45;display:grid;place-items:center;margin:14px auto;color:#C9FA45;font-size:30px;font-weight:900}
        .mp-demo-link{background:#2A2432;border:1px solid #493953;border-radius:13px;padding:15px;margin-top:10px;text-align:left;display:flex;justify-content:space-between;color:#F5F5F7;font-weight:700;font-size:14px}
        .mp-demo-link span:last-child{color:#C9FA45}
        .mp-demo-caption{font-size:11px;letter-spacing:.08em;color:#C6BDD0;margin-top:18px}
        .mp-tiny-steps{display:flex;gap:13px;flex-wrap:wrap;color:#CFC5D7;font-size:13px;margin-top:18px}
        .mp-tiny-steps span{display:flex;align-items:center;gap:5px}
        .mp-tiny-steps b{color:#C9FA45}
        @media(max-width:900px){.mp-hero-grid{grid-template-columns:1fr;gap:22px;text-align:center}.mp-hero-copy{max-width:670px;margin:0 auto}.mp-demo-wrap{padding:10px 8px 0}.mp-demo-phone{min-height:370px;max-width:315px}.mp-tiny-steps{justify-content:center}}
        @media(max-width:500px){.mp-hero-form{gap:3px;padding:6px}.mp-hero-form-prefix{font-size:12px;padding-left:5px}.mp-hero-form button{padding:0 11px;font-size:12px}.mp-hero-form input{font-size:15px}.mp-demo-phone{max-width:292px;min-height:350px;padding:16px}.mp-hero-copy h1{font-size:clamp(36px,10vw,48px)!important}}
        /* Mobile: header sem sobreposicoes e transicao compacta entre hero e secoes. */
        @media(max-width:640px){
          .mp-site-header{padding:0 12px!important}
          .mp-header-inner{height:auto!important;min-height:0!important;display:flex!important;flex-direction:column;gap:6px!important;padding:8px 0!important;align-items:stretch!important}
          .mp-header-brand{justify-content:flex-start;min-width:0;gap:8px!important}
          .mp-header-brand img{width:30px!important;height:30px!important}
          .mp-header-brand span:first-child{font-size:15px!important}
          .mp-header-brand span:last-child{font-size:9px!important}
          .mp-header-nav{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;justify-content:stretch!important;width:100%;gap:6px!important;min-width:0;flex-wrap:nowrap!important}
          .mp-header-language{min-width:0;width:100%;display:block}
          .mp-header-language label{display:block!important;width:100%;min-width:0}
          .mp-header-language select{max-width:100%;width:100%;height:36px!important;padding:5px 22px 5px 9px!important;font-size:12px!important;border-radius:9px!important}
          .mp-header-login{display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 10px!important;font-size:12px!important;white-space:nowrap;border:1px solid #50415B;border-radius:9px}
          .mp-nav-pricing{display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 12px!important;font-size:12px!important;white-space:nowrap;border-radius:9px!important}
          .mp-header-nav .btn-p{padding:0 10px!important}
          .mp-hero-section{padding:52px 20px 16px!important}
          .tudo-conectado-section{padding:20px 20px 42px!important}
          .tudo-conectado-section > div:first-child{margin-bottom:34px!important}
          .mp-recursos-section{padding:42px 20px!important}
        }
        @media(max-width:768px){
          .hero-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .hero-btns a,.hero-btns button{width:100%!important}
          .grid-3{grid-template-columns:1fr!important}
          .cta-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .cta-btns a,.cta-btns button{width:100%!important}
        }

        /* MiniPage 2.0 — jornada enxuta, foco em celular, sem modificar temas dos assinantes. */
        .mp-eyebrow{display:inline-block;margin-bottom:16px;letter-spacing:.13em;font-size:11px;font-weight:850;color:#C9FA45}
        .mp-section-heading{font-size:clamp(30px,4vw,49px);line-height:1.12;letter-spacing:-.048em;color:#F8F6FA;font-weight:900;margin-bottom:18px;text-align:center}
        .mp-section-copy{font-size:clamp(15px,1.5vw,18px);line-height:1.72;color:#BFB7C9;text-align:center;max-width:650px;margin:0 auto}
        .mp-three-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .mp-step-card{border:1px solid #302738;border-radius:23px;background:#191520;padding:28px;min-height:225px;text-align:left}
        .mp-step-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:38px;color:#C9FA45;font-size:13px;font-weight:850}
        .mp-step-head b{font-size:27px;font-weight:600}
        .mp-step-card h3{color:#F8F6FA;font-size:21px;letter-spacing:-.03em;font-weight:850;margin-bottom:10px}
        .mp-step-card p{color:#BDB3C8;font-size:14px;line-height:1.6}
        .mp-examples-grid{display:grid;grid-template-columns:1fr 1fr;max-width:1080px;gap:70px;margin:0 auto;align-items:center}
        .mp-example-types{display:flex;flex-direction:column;gap:12px}
        .mp-example-type{display:flex;align-items:center;gap:16px;padding:20px;border-radius:17px;border:1px solid #34293D;background:#1C1723}
        .mp-example-icon{width:46px;height:46px;border-radius:14px;background:#30223F;display:flex;align-items:center;justify-content:center;color:#C9FA45;font-size:23px;flex-shrink:0}
        .mp-example-type strong{display:block;color:#F7F4FB;font-size:17px;margin-bottom:3px}
        .mp-example-type small{color:#BAB0C8;font-size:13px;line-height:1.5}
        .mp-outline-cta{display:inline-flex;align-items:center;justify-content:center;gap:12px;text-decoration:none;background:#211A2B;border:1px solid #4B3C58;color:#F8F4FB;border-radius:13px;padding:14px 21px;font-size:14px;font-weight:750;min-height:48px}
        .mp-outline-cta:hover{border-color:#9774BD}
        .mp-pricing-link,.mp-nav-pricing{background:transparent;border:0;color:#D0C4DA;font-weight:700;font-size:14px;cursor:pointer;padding:12px 8px}
        .mp-nav-pricing{border:1px solid #50415B;border-radius:11px;padding:10px 17px}
        .mp-pricing-link:hover,.mp-nav-pricing:hover{color:#C9FA45}
        [hidden]{display:none!important}
        @media(max-width:800px){.mp-three-steps{grid-template-columns:1fr}.mp-step-card{min-height:0;padding:24px}.mp-step-head{margin-bottom:24px}.mp-examples-grid{grid-template-columns:1fr;gap:34px}.mp-section-heading{text-align:center!important}.mp-section-copy{text-align:center!important}.mp-examples-grid>div:first-child{text-align:center}.mp-simples-section,.mp-examples-section{padding:58px 20px!important}}
        @media(max-width:500px){.mp-hero-section{padding:38px 18px 48px!important}.mp-hero-grid{gap:34px}.mp-nav-pricing{padding:8px 12px}.mp-simple-cta{padding:55px 16px!important}.mp-demo-phone{max-width:270px!important}.mp-step-card h3{font-size:20px}}
      `}</style>
      {/* HEADER */}
      <header className="mp-site-header" style={{position:'sticky',top:0,zIndex:50,background:scrolled?'rgba(8,6,10,.97)':'transparent',backdropFilter:'blur(20px)',borderBottom:scrolled?'1px solid #2A1A2F':'1px solid transparent',transition:'all .3s',padding:'0 24px'}}>
        <div className="mp-header-inner" style={{maxWidth:'1100px',margin:'0 auto',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" className="mp-header-brand" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <img src="/brand/minipage-icone.svg" alt="MiniPage Pro" width={36} height={36} style={{borderRadius:'9px',flexShrink:0,objectFit:'contain'}}/>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1.15}}>
              <span style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>MiniPage <span style={{color:'#C9FA45'}}>Pro</span></span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#B9B0C9',letterSpacing:'.02em'}}>{lp('Tudo conectado. Em um só lugar.')}</span>
            </div>
          </Link>
          <div className="mp-header-nav" style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <span className="mp-header-language"><SeletorIdiomaGlobal compacto abreviadoMobile /></span>
            <Link className="mp-header-login" href="/login" style={{fontSize:'13px',color:'#B8AAB8',textDecoration:'none',fontWeight:500}}>{t('nav.login')}</Link>
            <button onClick={scrollToPlano} className="mp-nav-pricing">{t('nav.pricing')}</button>
          </div>
        </div>
      </header>
      {!somentePrecos && <>
      {/* HERO MiniPage 2.0 — escolha primeiro o nome; planos continuam abaixo. */}
      <section className="mp-hero-section" style={{padding:'74px 22px 72px',background:'radial-gradient(ellipse at 78% 20%,rgba(149,82,245,.13),transparent 52%),#0B0A10'}}>
        <div className="mp-hero-grid">
          <div className="mp-hero-copy">
            <div style={{display:'inline-flex',gap:'8px',alignItems:'center',padding:'8px 12px',borderRadius:'999px',background:'rgba(201,250,69,.07)',color:'#C9FA45',border:'1px solid rgba(201,250,69,.3)',fontSize:'12px',fontWeight:800,marginBottom:'24px'}}><span aria-hidden="true">●</span>{lp('Seu espaço na internet começa aqui')}</div>
            <h1 style={{fontSize:'clamp(43px,5.5vw,68px)',fontWeight:900,lineHeight:1.04,letterSpacing:'-.055em',color:'#F7F4FA',marginBottom:'22px'}}>{lp('Tudo o que você faz, vende e compartilha. Em um só lugar.')}</h1>
            <p style={{fontSize:'clamp(17px,2.1vw,21px)',fontWeight:650,color:'#CFC2E5',lineHeight:1.5,maxWidth:'540px',margin:'0 auto 8px 0'}}>{lp('Reúna seus contatos, redes sociais, conteúdos, produtos e serviços em uma MiniPage profissional, pronta para compartilhar e crescer com você.')}</p>
            <p style={{fontSize:'15px',color:'#B7ACBF',lineHeight:1.65,maxWidth:'530px',margin:'16px 0 0'}}>{lp('Comece com o essencial. Personalize e cresça no seu ritmo.')}</p>
            <form className="mp-hero-form" onSubmit={iniciarMinhaMiniPage} aria-label={lp('Escolha o endereço da sua MiniPage')}>
              <label className="mp-hero-form-prefix" htmlFor="mp-nome-desejado">minipage.pro/</label>
              <input id="mp-nome-desejado" value={nomeDesejado} onChange={e=>setNomeDesejado(e.target.value)} placeholder={lp('seunome')} autoComplete="off" maxLength={40} aria-label={lp('Nome de usuário desejado')} />
              <button type="submit" disabled={nomeLimpo.length<3}>{lp('Criar grátis')} →</button>
            </form>
            <p style={{fontSize:'12px',color:'#AFA4BB',lineHeight:1.5}}>{nomeDesejado ? (nomeLimpo.length>=3 ? `${lp('Seu endereço desejado:')} minipage.pro/${nomeLimpo}. ${lp('A disponibilidade será confirmada na criação.')}` : lp('Digite pelo menos 3 caracteres para continuar.')) : lp('Escolha seu nome agora. Sem pagamento para começar no plano Free.')}</p>
            <div className="mp-tiny-steps"><span><b>✓</b>{lp('Escolha seu nome')}</span><span><b>✓</b>{lp('Crie sua página')}</span><span><b>✓</b>{lp('Compartilhe')}</span></div>
            <div className="hero-btns" style={{display:'flex',gap:'10px',marginTop:'24px',flexWrap:'wrap'}}>
              <a href="https://minipage.pro/modelos" className="mp-outline-cta">{lp('Ver exemplos reais')} ↗</a>
              <button type="button" onClick={scrollToPlano} className="mp-pricing-link">{lp('Ver planos e preços')} ↓</button>
            </div>
          </div>
          <div className="mp-demo-wrap" aria-label={lp('Exemplo de uma MiniPage no celular')}>
            <div className="mp-demo-halo" />
            <div className="mp-demo-phone">
              <div style={{width:'60px',height:'5px',borderRadius:'4px',background:'#6F6179',margin:'0 auto 18px'}} />
              <div className="mp-demo-photo">M</div>
              <strong style={{display:'block',fontSize:'23px',color:'#FFFFFF',letterSpacing:'-.035em'}}>{traduzirExemplos(idioma,'Minha MiniPage')}</strong>
              <span style={{fontSize:'12px',color:'#C7BCD1'}}>minipage.pro/seunome</span>
              <p style={{fontSize:'13px',color:'#BFB3C9',margin:'16px auto 20px',lineHeight:1.55,maxWidth:'235px'}}>{lp('Meus contatos, conteúdos e serviços em um só lugar.')}</p>
              <div className="mp-demo-link"><span>WhatsApp</span><span>↗</span></div>
              <div className="mp-demo-link"><span>Instagram</span><span>↗</span></div>
              <div className="mp-demo-link"><span>{lp('Meus serviços')}</span><span>↗</span></div>
              <div className="mp-demo-caption">{lp('EXEMPLO ILUSTRATIVO — VOCÊ ESCOLHE O VISUAL')}</div>
            </div>
          </div>
        </div>
      </section>
      {/* MINI 2.0: primeiro a facilidade, depois os recursos. */}
      <section id="como-funciona" className="mp-simples-section" style={{padding:'84px 24px 96px',background:'#100C17',borderTop:'1px solid #231B2B'}}>
        <div style={{maxWidth:1080,margin:'0 auto'}}>
          <div style={{textAlign:'center',maxWidth:700,margin:'0 auto 42px'}}>
            <span className="mp-eyebrow">{lp('SIMPLES PARA COMEÇAR')}</span>
            <h2 className="mp-section-heading">{lp('Sua página pronta em três passos.')}</h2>
            <p className="mp-section-copy">{lp('Sem precisar entender de tecnologia. Comece com o essencial e personalize quando quiser.')}</p>
          </div>
          <div className="mp-three-steps">
            {[
              {n:'01',icone:'@',titulo:'Escolha seu nome',texto:'Crie seu endereço minipage.pro/seunome. Fácil de lembrar e compartilhar.'},
              {n:'02',icone:'✦',titulo:'Mostre quem você é',texto:'Adicione sua foto, suas redes sociais, links e o que você oferece.'},
              {n:'03',icone:'↗',titulo:'Compartilhe com todos',texto:'Sua MiniPage em um só link. Coloque na bio ou envie pelo WhatsApp.'},
            ].map(p=><div key={p.n} className="mp-step-card">
              <div className="mp-step-head"><span>{p.n}</span><b aria-hidden="true">{p.icone}</b></div>
              <h3>{lp(p.titulo)}</h3><p>{lp(p.texto)}</p>
            </div>)}
          </div>
        </div>
      </section>
      <section id="exemplos" className="mp-examples-section" style={{padding:'80px 24px',background:'radial-gradient(ellipse at 52% 5%,rgba(149,82,245,.11),transparent 62%),#0B0A10'}}>
        <div className="mp-examples-grid">
          <div>
            <span className="mp-eyebrow">{lp('PARA PESSOAS E NEGÓCIOS')}</span>
            <h2 className="mp-section-heading" style={{textAlign:'left'}}>{lp('Uma MiniPage para cada momento.')}</h2>
            <p className="mp-section-copy" style={{textAlign:'left',margin:'0 0 24px'}}>{lp('Você pode começar com seus contatos e links. Depois, acrescentar vídeos, produtos, serviços ou agendamentos conforme sua necessidade e seu plano.')}</p>
            <a href="https://minipage.pro/modelos" className="mp-outline-cta">{lp('Explorar exemplos reais')} <span aria-hidden="true">↗</span></a>
          </div>
          <div className="mp-example-types">
            {[
              {icon:'◉',name:traduzirExemplos(idioma,'Pessoal'),line:traduzirExemplos(idioma,'Redes, contatos e projetos em um link.')},
              {icon:'✧',name:traduzirExemplos(idioma,'Criador de conteúdo'),line:traduzirExemplos(idioma,'Vídeos, novidades e recomendações.')},
              {icon:'▣',name:traduzirExemplos(idioma,'Meu negócio'),line:traduzirExemplos(idioma,'Serviços, catálogo e contato direto.')},
            ].map(p=><div className="mp-example-type" key={p.name}>
              <span className="mp-example-icon" aria-hidden="true">{p.icon}</span>
              <span><strong>{lp(p.name)}</strong><small>{lp(p.line)}</small></span>
            </div>)}
          </div>
        </div>
      </section>
      <section className="mp-simple-cta" style={{padding:'64px 24px 84px',background:'#100F17',textAlign:'center'}}>
        <div style={{maxWidth:650,margin:'0 auto'}}>
          <span className="mp-eyebrow">{lp('GRÁTIS PARA COMEÇAR')}</span>
          <h2 className="mp-section-heading">{lp('Qual é a sua MiniPage?')}</h2>
          <p className="mp-section-copy">{lp('Escolha seu nome, crie sua página e compartilhe. Sem precisar escolher um plano pago agora.')}</p>
          <form className="mp-hero-form" onSubmit={iniciarMinhaMiniPage} style={{maxWidth:510,margin:'25px auto 12px'}}>
            <label className="mp-hero-form-prefix" htmlFor="mp-nome-rodape">minipage.pro/</label>
            <input id="mp-nome-rodape" value={nomeDesejado} onChange={e=>setNomeDesejado(e.target.value)} placeholder={lp('seunome')} autoComplete="off" maxLength={40} aria-label={lp('Nome de usuário desejado')}/>
            <button type="submit" disabled={nomeLimpo.length<3}>{lp('Começar')} ↗</button>
          </form>
          <button className="mp-pricing-link" type="button" onClick={scrollToPlano}>{lp('Quero conhecer os planos e preços')} <span aria-hidden="true">↓</span></button>
        </div>
      </section>
      </>}
      {/* PLANO */}
      <section id="plano" hidden={!mostrarPlanos} style={{scrollMarginTop:'80px',padding:'80px 24px',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.09),transparent 65%)'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'48px'}}>
            <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>{({ 'pt-BR':'Cinco planos. Um para cada objetivo.', 'en-US':'Five plans. One for every goal.', 'es-ES':'Cinco planes. Uno para cada objetivo.', 'fr-FR':'Cinq forfaits. Un pour chaque objectif.', 'de-DE':'Fünf Tarife. Einer für jedes Ziel.', 'it-IT':'Cinque piani. Uno per ogni obiettivo.' } as Record<string,string>)[idioma] || 'Cinco planos. Um para cada objetivo.'}</h2>
            <p style={{fontSize:'15px',color:'#B8AAB8',lineHeight:1.6,maxWidth:'560px',margin:'0 auto'}}>{lp("Compare recursos e preços antes de criar sua conta. Comece com uma bio profissional ou avance para loja, agendamento e gestão.")}</p>
          </div>

          <div role="group" aria-label={lp('Periodicidade da assinatura')} style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
            <button type="button" aria-pressed={billingSelecionado === 'mensal'} onClick={() => setBillingSelecionado('mensal')} style={{cursor:'pointer',padding:'12px 22px',borderRadius:'12px',fontWeight:800,color:billingSelecionado === 'mensal' ? '#15180D' : '#fff',background:billingSelecionado === 'mensal' ? G : '#201527',border:'1px solid #6B3A73'}}>{lp("Mensal")}</button>
            <button type="button" aria-pressed={billingSelecionado === 'anual'} onClick={() => setBillingSelecionado('anual')} style={{cursor:'pointer',padding:'12px 22px',borderRadius:'12px',fontWeight:800,color:billingSelecionado === 'anual' ? '#15180D' : '#fff',background:billingSelecionado === 'anual' ? G : '#201527',border:'1px solid #6B3A73'}}>{lp("Anual · economize 17%")}</button>
          </div>
          <p style={{textAlign:'center',color:'#B8AAB8',fontSize:'12px',marginBottom:'24px'}}>{billingSelecionado === 'anual' ? copy[5] : lp('Assinaturas mensais recorrentes. Você escolhe o plano ideal.')}</p>
          <div role="group" aria-label={copy[0]} style={{maxWidth:570,margin:'0 auto 24px',padding:14,background:'#1d1527',border:'1px solid #493450',borderRadius:14}}>
            <p style={{fontSize:13,fontWeight:700,marginBottom:10,color:'#F8F4F7'}}>{copy[0]}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
              {(['BR','US'] as const).map(p => <button key={p} type="button" aria-pressed={paisPrecos===p} onClick={()=>{escolhaManual.current=true;if(p!==paisPrecos)setCotacoes(null);setPaisPrecos(p)}} style={{padding:'14px 8px',borderRadius:12,background:paisPrecos===p?'rgba(201,250,69,.10)':'#21182D',border:`1px solid ${paisPrecos===p?G:'#514361'}`,color:paisPrecos===p?G:'#F8F4F7',cursor:'pointer',fontWeight:800}}>{p==='BR'?copy[1]:copy[2]}<span style={{display:'block',fontSize:12,marginTop:5}}>{p==='BR'?'BRL · R$':'USD · US$'}</span></button>)}
            </div>
            <p style={{fontSize:12,color:'#C9B8D2',marginTop:10}}>{copy[3]}</p>
            {paisPrecos==='BR' && <p style={{fontSize:12,color:'#FCD34D',marginTop:8}}>{copy[4]}</p>}
          </div>
          <section aria-labelledby="mp-guia-planos" style={{maxWidth:1080,margin:'8px auto 24px',padding:'20px',background:'rgba(31,22,40,.82)',border:'1px solid #4B3A59',borderRadius:17}}>
            <h3 id="mp-guia-planos" style={{fontSize:20,fontWeight:850,color:'#F8F4F7',marginBottom:7}}>{guiaDePlanos.titulo}</h3>
            <p style={{fontSize:13,color:'#B8AAB8',lineHeight:1.5,marginBottom:14}}>{guiaDePlanos.introducao}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
              {guiaDePlanos.opcoes.map(opcao => <button key={opcao.tipo} type="button" aria-pressed={planoSugerido===opcao.tipo} onClick={()=>escolherObjetivo(opcao.tipo)} style={{minHeight:89,textAlign:'left',background:planoSugerido===opcao.tipo?'rgba(201,250,69,.12)':'#21182C',border:planoSugerido===opcao.tipo?'1.5px solid #C9FA45':'1px solid #54405E',borderRadius:12,padding:12,color:'#F8F4F7',cursor:'pointer'}}>
                <strong style={{display:'block',fontSize:13,lineHeight:1.3,marginBottom:6}}>{opcao.titulo}</strong>
                <span style={{fontSize:11,lineHeight:1.4,color:'#CFC5D9'}}>{opcao.resumo}</span>
              </button>)}
            </div>
            <p style={{fontSize:12,lineHeight:1.5,color:'#DAF6A1',margin:'14px 0 0',fontWeight:650}}>{avisoHeranca[idioma] || avisoHeranca['pt-BR']}</p>
          </section>
          <style>{`
            .planos-scroll::-webkit-scrollbar{display:none}
            .planos-navegacao-mobile{display:none}
            @media(max-width:899px){
              .planos-navegacao-mobile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;margin:0 0 8px}
              .planos-navegacao-mobile .planos-navegacao-setas{display:flex;align-items:center;justify-content:center;gap:28px}
              .planos-navegacao-mobile button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(244,114,182,.65);background:rgba(64,30,68,.9);color:#FCE7F3;font-size:22px;font-weight:900;cursor:pointer;box-shadow:0 3px 14px rgba(139,92,246,.15)}
              .planos-navegacao-mobile button:focus-visible{outline:2px solid #C9FA45;outline-offset:3px}
              .planos-navegacao-mobile span{font-size:13px;font-weight:700;color:#E9D5FF;text-align:center}
            }
            /* Desktop com espaco suficiente: os cards distribuidos em duas linhas,
               sem scroll horizontal nenhum. !important e necessario pra sobrescrever os
               estilos inline (base mobile) so a partir deste breakpoint. */
            @media(min-width:900px){
              .planos-scroll{display:grid !important;grid-template-columns:repeat(3,minmax(0,1fr)) !important;overflow-x:visible !important;}
              .plano-card{flex:none !important;min-width:0 !important;width:auto !important;}
            }
            /* Bloco "Ideal para": altura minima igual nos cartoes, para as listas comecarem alinhadas. */
            .plano-card[data-mp-plano].mp-recomendado{outline:3px solid #C9FA45;outline-offset:2px}
            .plano-ideal{min-height:82px}
            @media(min-width:900px){.plano-ideal{min-height:93px}}

        /* MiniPage 2.0 — jornada enxuta, foco em celular, sem modificar temas dos assinantes. */
        .mp-eyebrow{display:inline-block;margin-bottom:16px;letter-spacing:.13em;font-size:11px;font-weight:850;color:#C9FA45}
        .mp-section-heading{font-size:clamp(30px,4vw,49px);line-height:1.12;letter-spacing:-.048em;color:#F8F6FA;font-weight:900;margin-bottom:18px;text-align:center}
        .mp-section-copy{font-size:clamp(15px,1.5vw,18px);line-height:1.72;color:#BFB7C9;text-align:center;max-width:650px;margin:0 auto}
        .mp-three-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .mp-step-card{border:1px solid #302738;border-radius:23px;background:#191520;padding:28px;min-height:225px;text-align:left}
        .mp-step-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:38px;color:#C9FA45;font-size:13px;font-weight:850}
        .mp-step-head b{font-size:27px;font-weight:600}
        .mp-step-card h3{color:#F8F6FA;font-size:21px;letter-spacing:-.03em;font-weight:850;margin-bottom:10px}
        .mp-step-card p{color:#BDB3C8;font-size:14px;line-height:1.6}
        .mp-examples-grid{display:grid;grid-template-columns:1fr 1fr;max-width:1080px;gap:70px;margin:0 auto;align-items:center}
        .mp-example-types{display:flex;flex-direction:column;gap:12px}
        .mp-example-type{display:flex;align-items:center;gap:16px;padding:20px;border-radius:17px;border:1px solid #34293D;background:#1C1723}
        .mp-example-icon{width:46px;height:46px;border-radius:14px;background:#30223F;display:flex;align-items:center;justify-content:center;color:#C9FA45;font-size:23px;flex-shrink:0}
        .mp-example-type strong{display:block;color:#F7F4FB;font-size:17px;margin-bottom:3px}
        .mp-example-type small{color:#BAB0C8;font-size:13px;line-height:1.5}
        .mp-outline-cta{display:inline-flex;align-items:center;justify-content:center;gap:12px;text-decoration:none;background:#211A2B;border:1px solid #4B3C58;color:#F8F4FB;border-radius:13px;padding:14px 21px;font-size:14px;font-weight:750;min-height:48px}
        .mp-outline-cta:hover{border-color:#9774BD}
        .mp-pricing-link,.mp-nav-pricing{background:transparent;border:0;color:#D0C4DA;font-weight:700;font-size:14px;cursor:pointer;padding:12px 8px}
        .mp-nav-pricing{border:1px solid #50415B;border-radius:11px;padding:10px 17px}
        .mp-pricing-link:hover,.mp-nav-pricing:hover{color:#C9FA45}
        [hidden]{display:none!important}
        @media(max-width:800px){.mp-three-steps{grid-template-columns:1fr}.mp-step-card{min-height:0;padding:24px}.mp-step-head{margin-bottom:24px}.mp-examples-grid{grid-template-columns:1fr;gap:34px}.mp-section-heading{text-align:center!important}.mp-section-copy{text-align:center!important}.mp-examples-grid>div:first-child{text-align:center}.mp-simples-section,.mp-examples-section{padding:58px 20px!important}}
        @media(max-width:500px){.mp-hero-section{padding:38px 18px 48px!important}.mp-hero-grid{gap:34px}.mp-nav-pricing{padding:8px 12px}.mp-simple-cta{padding:55px 16px!important}.mp-demo-phone{max-width:270px!important}.mp-step-card h3{font-size:20px}}
      `}</style>
          <div className="planos-navegacao-mobile">
            <div className="planos-navegacao-setas">
              <button type="button" onClick={() => moverCarrosselPlanos(-1)} aria-label={idioma === 'pt-BR' ? 'Plano anterior' : 'Previous plan'}>‹</button>
              <button type="button" onClick={() => moverCarrosselPlanos(1)} aria-label={idioma === 'pt-BR' ? 'Próximo plano' : 'Next plan'}>›</button>
            </div>
            <span>{idioma === 'pt-BR' ? 'Deslize ou use as setas para ver os planos' : idioma === 'es-ES' ? 'Desliza o usa las flechas para ver los planes' : idioma === 'fr-FR' ? 'Balayez ou utilisez les fleches pour voir les offres' : idioma === 'de-DE' ? 'Wischen oder Pfeile nutzen, um Tarife zu sehen' : idioma === 'it-IT' ? 'Scorri o usa le frecce per vedere i piani' : 'Swipe or use arrows to explore plans'}</span>
          </div>
          <div ref={planosScrollRef} className="planos-scroll" style={{display:'flex',flexWrap:'nowrap',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollSnapType:'x proximity',gap:'18px',alignItems:'stretch',paddingTop:'20px',paddingBottom:'8px',scrollbarWidth:'none'}}>

            {/* PLANO FREE */}
            <CartaoPlano recomendado={planoSugerido === 'free'} tipo="free" consultando={consultando} disponivel={disponivel('free') === true} idioma={idioma} pais={paisPrecos} billing={billingSelecionado} selo="Para começar" descricao="Presença online simples com links básicos." itens={itensFree}
              cta={
                <Link href="/cadastro?plano=free" onClick={(e) => irComCupom(e, '/cadastro?plano=free')} className="btn-s" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                  {lp("Começar grátis")}
                </Link>
              } />

            {/* PLANO MINIPAGE */}
            <CartaoPlano recomendado={planoSugerido === 'minipage'} tipo="minipage" consultando={consultando} disponivel={disponivel('minipage') === true} idioma={idioma} pais={paisPrecos} billing={billingSelecionado} selo="Ideal para" nicho="autônomos e profissionais" descricao="Página profissional com links, destaques, vídeos e agenda de eventos." herda="Tudo do Free +" itens={itensMiniPage}
              cta={
                <Link href={destinoPlano('minipage')} onClick={(e) => irComCupom(e, destinoPlano('minipage'))} className="btn-p" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                  {lp("Começar com a MiniPage")}
                </Link>
              } />

            {/* PLANO AGENDA */}
            <CartaoPlano recomendado={planoSugerido === 'agenda'} tipo="agenda" consultando={consultando} disponivel={disponivel('agenda') === true} idioma={idioma} pais={paisPrecos} billing={billingSelecionado} selo="Ideal para" nicho="profissionais que trabalham com horários" descricao="MiniPage com agendamento automático para clientes." herda="Tudo da MiniPage +" itens={itensAgenda}
              cta={
                <Link href={destinoPlano('agenda')} onClick={(e) => irComCupom(e, destinoPlano('agenda'))} className="btn-p" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                  {lp("Quero o MiniPage Agenda")}
                </Link>
              } />

            {/* PLANO LOJA */}
            <CartaoPlano recomendado={planoSugerido === 'loja'} tipo="loja" consultando={consultando} disponivel={disponivel('loja') === true} idioma={idioma} pais={paisPrecos} billing={billingSelecionado} selo="Ideal para" nicho="quem vende e também recebe agendamentos" descricao="Catálogos, produtos, cursos e agendamento online para seu negócio." herda={HERANCA_LOJA[idioma] || HERANCA_LOJA['pt-BR']} itens={itensLoja}
              cta={
                <Link href={destinoPlano('loja')} onClick={(e) => irComCupom(e, destinoPlano('loja'))} className="btn-p" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                  {lp("Quero o MiniPage Loja")}
                </Link>
              } />

            {/* PLANO PRO (interno: essencial) */}
            <CartaoPlano recomendado={planoSugerido === 'essencial'} tipo="essencial" consultando={consultando} disponivel={disponivel('essencial') === true} idioma={idioma} pais={paisPrecos} billing={billingSelecionado} variante="pro" selo="Ideal para" nicho="quem quer presença, agendamento, vendas e gestão" descricao="Tudo do Loja, com clientes, financeiro, cobranças e gestão do negócio." herda="Tudo da Loja +" itens={itensProfissional}
              cta={
                <Link href={destinoPlano('essencial')} onClick={(e) => irComCupom(e, destinoPlano('essencial'))} className="btn-p" style={{width:'100%',justifyContent:'center',height:'auto',minHeight:'46px',padding:'12px 14px',fontSize:'13px',whiteSpace:'normal',lineHeight:1.3,textAlign:'center' as const}}>
                  {idioma === 'de-DE' ? `${obterNomePlano('essencial')} wählen` : `${lp('Começar com o ')}${obterNomePlano('essencial')}`}
                </Link>
              } />



          </div>

          <p style={{textAlign:'center',fontSize:'13px',color:'#B8AAB8',marginTop:'32px'}}>{copy[6]}</p>
        </div>
      </section>
      <section className="mp-last-cta" style={{padding:'42px 24px',textAlign:'center',borderTop:'1px solid #211A2A'}}>
        <button type="button" className="mp-pricing-link" onClick={scrollToPlano}>{lp('Consultar todos os planos e recursos')} ↗</button>
      </section>
      {somentePrecos && <p style={{maxWidth:1060,margin:'0 auto',padding:'0 24px',fontSize:13,lineHeight:1.7,color:'#B8AAB8'}}>{copy[10]}</p>}
      {somentePrecos && <nav style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:18,padding:24}}>{['/politica-de-reembolso','/politica-de-privacidade','/contrato-de-adesao'].map((href,i)=><Link key={href} href={href} style={{color:G}}>{copy[7+i]}</Link>)}</nav>}
      <footer style={{borderTop:'1px solid #2A1A2F',padding:'32px 24px',textAlign:'center'}}>
        <p style={{fontSize:'13px',color:'#B8AAB8'}}>© 2026 MiniPage Pro.</p>
        <p style={{fontSize:'11px',color:'#475569',marginTop:'4px'}}>CNPJ: 31.671.616/0001-18</p>
        <a href='https://instagram.com/clientemarcado' target='_blank' rel='noreferrer' style={{fontSize:'15px',color:'#F5F2FF',textDecoration:'none',marginTop:'16px',marginBottom:'60px',display:'inline-flex',alignItems:'center',gap:'6px',fontWeight:700}}><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#F5F2FF' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='2' width='20' height='20' rx='5' ry='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'/></svg>Instagram</a>
      </footer>
      <AssistenteComercial checkoutUrl={CHECKOUT_URL} />
    </div>
  )
}
