// Fonte unica do sistema de temas da pagina publica (Cor de destaque em /painel/perfil).
// Reutilizada por app/[slug]/page.tsx e app/[slug]/agendar/page.tsx para nao duplicar logica.
//
// Cada modelo agora e um conjunto de TOKENS de tema (mode + cores de fundo/texto/card),
// nao so uma cor de destaque isolada. Isso permite temas claros com contraste correto,
// sem depender de "trocar 1 cor na marra".
//
// Evolucao pra 12 modelos: cada um tem bg/card com diferenca real de luminosidade entre
// si (regra mais importante - card sempre precisa se separar visualmente do fundo).
// O Modelo 1 e a referencia de qualidade e nao foi alterado.

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
export const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
export function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

export type TemaTokens = {
  mode: 'dark' | 'light'
  accent: string
  accent2: string
  secondary: string
  soft: string
  border: string
  glow: string
  btnText: string
  bg: string
  bgRGB: string
  card: string
  text: string
  textMuted: string
  cardBorder: string
  surface2: string
  headerBg: string
}

// MODELO 1 - Dark Pink Premium. Referencia de qualidade - NAO ALTERADO.
const MODELO1: TemaTokens = {
  mode:'dark',
  accent:'#FF4FA3', accent2:'#EC4899', secondary:'#D946EF',
  soft:'rgba(255,79,163,.12)', border:'rgba(255,79,163,.28)', glow:'rgba(255,79,163,.15)',
  btnText:'#fff',
  bg:'#06030A', bgRGB:'6,3,10', card:'linear-gradient(145deg,#160A1D,#120815)',
  text:'#FFFFFF', textMuted:'#CFC6D8',
  cardBorder:'#2A1A2F', surface2:'rgba(24,16,27,.88)', headerBg:'rgba(8,6,10,.97)',
}

export function getTema(temaPublico: string): TemaTokens {
  switch(temaPublico) {
    case 'modelo1':
      return MODELO1
    case 'modelo2': // Black + Graphite - dark, minimalista, otimo pra artistas e creators
      return {
        mode:'dark',
        accent:'#EDEDF0', accent2:'#D4D4D8', secondary:'#A1A1AA',
        soft:'rgba(237,237,240,.10)', border:'rgba(237,237,240,.20)', glow:'rgba(237,237,240,.12)',
        btnText:'#0A0A0B',
        bg:'#08090B', bgRGB:'8,9,11', card:'linear-gradient(145deg,#232326,#1C1C1F)',
        text:'#FFFFFF', textMuted:'#B8B8BD',
        cardBorder:'#2E2E32', surface2:'rgba(35,35,38,.88)', headerBg:'rgba(8,9,11,.97)',
      }
    case 'modelo3': // Graphite + Black - hierarquia invertida do Modelo 2
      return {
        mode:'dark',
        accent:'#E8A672', accent2:'#F0C29A', secondary:'#B87D4E',
        soft:'rgba(232,166,114,.12)', border:'rgba(232,166,114,.24)', glow:'rgba(232,166,114,.14)',
        btnText:'#1A0F06',
        bg:'#1C1C1F', bgRGB:'28,28,31', card:'linear-gradient(145deg,#0A0A0B,#050506)',
        text:'#FFFFFF', textMuted:'#B0AEB2',
        cardBorder:'#333338', surface2:'rgba(10,10,11,.9)', headerBg:'rgba(28,28,31,.95)',
      }
    case 'modelo4': // Black + Gold - luxuoso, dourado como acento
      return {
        mode:'dark',
        accent:'#D4AF37', accent2:'#F0D98A', secondary:'#9C7A2F',
        soft:'rgba(212,175,55,.12)', border:'rgba(212,175,55,.26)', glow:'rgba(212,175,55,.15)',
        btnText:'#1A140A',
        bg:'#050505', bgRGB:'5,5,5', card:'linear-gradient(145deg,#151210,#0F0D0B)',
        text:'#FFFFFF', textMuted:'#C9BFAE',
        cardBorder:'#2A2520', surface2:'rgba(21,18,16,.9)', headerBg:'rgba(5,5,5,.97)',
      }
    case 'modelo5': // Soft Gray + White - claro, clean, editorial
      return {
        mode:'light',
        accent:'#C97B93', accent2:'#DDA0B3', secondary:'#8B5D73',
        soft:'rgba(201,123,147,.12)', border:'rgba(201,123,147,.30)', glow:'rgba(201,123,147,.14)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#E3E4E8 0%,#EAEBEE 100%)', bgRGB:'227,228,232', card:'linear-gradient(145deg,#FFFFFF,#FDFDFE)',
        text:'#1A1A1E', textMuted:'#6B6B72',
        cardBorder:'rgba(26,26,30,.10)', surface2:'#E7E8EA', headerBg:'rgba(237,238,240,.92)',
      }
    case 'modelo6': // White + Soft Gray - card puxa pro cinza (inverso do Modelo 5)
      return {
        mode:'light',
        accent:'#5FA8A0', accent2:'#84C2BB', secondary:'#3D7871',
        soft:'rgba(95,168,160,.12)', border:'rgba(95,168,160,.30)', glow:'rgba(95,168,160,.14)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#FAFAFB 0%,#FCFCFD 100%)', bgRGB:'250,250,251', card:'linear-gradient(145deg,#E4E4E9,#DCDCE1)',
        text:'#232326', textMuted:'#75757C',
        cardBorder:'rgba(35,35,38,.10)', surface2:'#EFEFF1', headerBg:'rgba(250,250,251,.92)',
      }
    case 'modelo7': // Beauty Pink - forte presenca de rosa, premium, pensado pra nail/estetica/beleza
      return {
        mode:'light',
        accent:'#E83E8C', accent2:'#F06BA8', secondary:'#C23F6C',
        soft:'rgba(232,62,140,.14)', border:'rgba(232,62,140,.34)', glow:'rgba(232,62,140,.18)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#F5C3D6 0%,#F7CEDD 50%,#FAD9E5 100%)', bgRGB:'245,195,214', card:'linear-gradient(145deg,#FEF0F6,#FCE3EC)',
        text:'#3D1F2A', textMuted:'#805663',
        cardBorder:'rgba(232,62,140,.28)', surface2:'#FBDCE9', headerBg:'rgba(245,195,214,.92)',
      }
    case 'modelo8': // Rose Champagne - corrige o contraste bg/card da versao antiga
      return {
        mode:'light',
        accent:'#D4967A', accent2:'#E8B79C', secondary:'#B8724F',
        soft:'rgba(212,150,122,.13)', border:'rgba(212,150,122,.32)', glow:'rgba(212,150,122,.15)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#F3E0D6 0%,#F7E8DC 50%,#FCF1E6 100%)', bgRGB:'243,224,214', card:'linear-gradient(145deg,#FFFBF5,#FFF6EC)',
        text:'#4A2F1E', textMuted:'#8A6B54',
        cardBorder:'rgba(212,150,122,.30)', surface2:'#F5E5D8', headerBg:'rgba(243,224,214,.92)',
      }
    case 'modelo9': // Lilac Premium - dark, roxo/lilas sofisticado
      return {
        mode:'dark',
        accent:'#B69AF0', accent2:'#D4C2FF', secondary:'#8B6FD9',
        soft:'rgba(182,154,240,.13)', border:'rgba(182,154,240,.28)', glow:'rgba(182,154,240,.16)',
        btnText:'#fff',
        bg:'#0D0817', bgRGB:'13,8,23', card:'linear-gradient(145deg,#221B33,#1A1428)',
        text:'#FFFFFF', textMuted:'#C9BEDD',
        cardBorder:'#332B47', surface2:'rgba(34,27,51,.88)', headerBg:'rgba(13,8,23,.96)',
      }
    case 'modelo10': // Mocha / Nude - bege quente, acolhedor e sofisticado
      return {
        mode:'light',
        accent:'#A67C52', accent2:'#C9A578', secondary:'#7A5A3A',
        soft:'rgba(166,124,82,.13)', border:'rgba(166,124,82,.32)', glow:'rgba(166,124,82,.15)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#E8DCCB 0%,#EDE1D0 50%,#F3E9D9 100%)', bgRGB:'232,220,203', card:'linear-gradient(145deg,#FBF5EA,#F7EEDF)',
        text:'#4A3524', textMuted:'#8A7359',
        cardBorder:'rgba(166,124,82,.30)', surface2:'#EEE2CF', headerBg:'rgba(232,220,203,.92)',
      }
    case 'modelo11': // Deep Burgundy - vinho profundo, marcante e elegante
      return {
        mode:'dark',
        accent:'#D4A574', accent2:'#E8C39E', secondary:'#A67849',
        soft:'rgba(212,165,116,.13)', border:'rgba(212,165,116,.26)', glow:'rgba(212,165,116,.15)',
        btnText:'#2A1408',
        bg:'#160408', bgRGB:'22,4,8', card:'linear-gradient(145deg,#2B0A14,#1F0810)',
        text:'#F5E8EA', textMuted:'#D4B0BA',
        cardBorder:'#3D1420', surface2:'rgba(43,10,20,.88)', headerBg:'rgba(22,4,8,.96)',
      }
    case 'modelo12': // Blue Midnight - azul-marinho, premium e versatil
      return {
        mode:'dark',
        accent:'#7C9CF0', accent2:'#A5BDFF', secondary:'#5878D0',
        soft:'rgba(124,156,240,.13)', border:'rgba(124,156,240,.26)', glow:'rgba(124,156,240,.15)',
        btnText:'#fff',
        bg:'#050810', bgRGB:'5,8,16', card:'linear-gradient(145deg,#141C2E,#0F1622)',
        text:'#FFFFFF', textMuted:'#B8C2D4',
        cardBorder:'#243048', surface2:'rgba(20,28,46,.88)', headerBg:'rgba(5,8,16,.96)',
      }
    default:
      return MODELO1
  }
}

export const MODELOS_DISPONIVEIS = [
  { id:'modelo1', nome:'Modelo 1', desc:'Rosa vibrante, moderno e marcante.' },
  { id:'modelo2', nome:'Modelo 2', desc:'Preto e grafite, premium e minimalista.' },
  { id:'modelo3', nome:'Modelo 3', desc:'Grafite e preto, moderno e sofisticado.' },
  { id:'modelo4', nome:'Modelo 4', desc:'Preto e dourado, visual luxuoso e de alto padrão.' },
  { id:'modelo5', nome:'Modelo 5', desc:'Cinza claro e branco, clean e editorial.' },
  { id:'modelo6', nome:'Modelo 6', desc:'Branco e cinza suave, refinado e elegante.' },
  { id:'modelo7', nome:'Modelo 7', desc:'Rosa blush premium, ideal para beleza e estética.' },
  { id:'modelo8', nome:'Modelo 8', desc:'Champagne rosé, natural e sofisticado.' },
  { id:'modelo9', nome:'Modelo 9', desc:'Lilás profundo, sofisticado e marcante.' },
  { id:'modelo10', nome:'Modelo 10', desc:'Nude e mocha, acolhedor e refinado.' },
  { id:'modelo11', nome:'Modelo 11', desc:'Bordô profundo, elegante e marcante.' },
  { id:'modelo12', nome:'Modelo 12', desc:'Azul-meia-noite, premium e versátil.' },
]
