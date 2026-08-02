// Fonte unica do sistema de temas da pagina publica (Cor de destaque em /painel/perfil).
// Reutilizada por app/[slug]/page.tsx e app/[slug]/agendar/page.tsx para nao duplicar logica.
//
// Cada modelo agora e um conjunto de TOKENS de tema (mode + cores de fundo/texto/card),
// nao so uma cor de destaque isolada. Isso permite temas claros (modelo2, modelo6) com
// contraste correto, sem depender de "trocar 1 cor na marra".

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
export const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
export function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

export type TemaTokens = {
  mode: 'dark' | 'light'
  // cores de destaque (ja existiam, mantidas com o mesmo nome pra nao quebrar quem ja usa)
  accent: string
  accent2: string
  secondary: string
  soft: string
  border: string
  glow: string
  btnText: string
  // novos tokens de contraste (fundo/texto), necessarios pros temas claros
  bg: string          // fundo geral da pagina
  bgRGB: string       // mesmo valor de bg, em "r,g,b" (para usar em rgba() dinamico, ex: overlay do banner)
  card: string        // fundo dos cards (aceita gradiente completo)
  text: string        // texto principal
  textMuted: string   // texto secundario/legenda
  cardBorder: string  // borda neutra (nao-accent) de cards/inputs/divisores
  surface2: string    // fundo de inputs/botoes secundarios/nav
  headerBg: string    // fundo do header fixo (com blur)
}

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
    case 'modelo2': // NOVO modelo2: mesma familia do modelo1, versao clara ROSA BLUSH (nao branco)
      return {
        mode:'light',
        accent:'#F43F9D', accent2:'#EC4899', secondary:'#D946EF',
        soft:'rgba(236,72,153,.14)', border:'rgba(236,72,153,.45)', glow:'rgba(236,72,153,.16)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#F8DDEA 0%,#FBE6F1 45%,#FDF0F6 100%)', bgRGB:'248,221,234', card:'linear-gradient(145deg,#FFF3F8,#FCE8F1)',
        text:'#351025', textMuted:'#7A4B62',
        cardBorder:'rgba(236,72,153,.35)', surface2:'#FBDCEA', headerBg:'rgba(248,221,234,.92)',
      }
    case 'modelo3':
      return {
        mode:'dark',
        accent:'#D4AF37', accent2:'#F0D98A', secondary:'#9C7A2F',
        soft:'rgba(212,175,55,.12)', border:'rgba(212,175,55,.28)', glow:'rgba(212,175,55,.15)',
        btnText:'#1A140A',
        bg:'#06030A', bgRGB:'6,3,10', card:'linear-gradient(145deg,#160A1D,#120815)',
        text:'#FFFFFF', textMuted:'#CFC6D8',
        cardBorder:'#2A1A2F', surface2:'rgba(24,16,27,.88)', headerBg:'rgba(8,6,10,.97)',
      }
    case 'modelo4':
      return {
        mode:'dark',
        accent:'#A78BFA', accent2:'#C084FC', secondary:'#7C3AED',
        soft:'rgba(167,139,250,.12)', border:'rgba(167,139,250,.28)', glow:'rgba(167,139,250,.15)',
        btnText:'#fff',
        bg:'#06030A', bgRGB:'6,3,10', card:'linear-gradient(145deg,#160A1D,#120815)',
        text:'#FFFFFF', textMuted:'#CFC6D8',
        cardBorder:'#2A1A2F', surface2:'rgba(24,16,27,.88)', headerBg:'rgba(8,6,10,.97)',
      }
    case 'modelo5':
      return {
        mode:'dark',
        accent:'#D6A77A', accent2:'#E8C39E', secondary:'#A47148',
        soft:'rgba(214,167,122,.12)', border:'rgba(214,167,122,.28)', glow:'rgba(214,167,122,.15)',
        btnText:'#2A1810',
        bg:'#06030A', bgRGB:'6,3,10', card:'linear-gradient(145deg,#160A1D,#120815)',
        text:'#FFFFFF', textMuted:'#CFC6D8',
        cardBorder:'#2A1A2F', surface2:'rgba(24,16,27,.88)', headerBg:'rgba(8,6,10,.97)',
      }
    case 'modelo6': // NOVO: mesma familia do modelo5, versao clara CHAMPAGNE/NUDE (nao branco)
      return {
        mode:'light',
        accent:'#C79A6B', accent2:'#D6A86F', secondary:'#A47148',
        soft:'rgba(199,154,107,.14)', border:'rgba(199,154,107,.52)', glow:'rgba(199,154,107,.16)',
        btnText:'#fff',
        bg:'linear-gradient(180deg,#F2DEC8 0%,#F5E3CF 45%,#FFF0DD 100%)', bgRGB:'242,222,200', card:'linear-gradient(145deg,#FFF4E8,#F8E8D5)',
        text:'#3B2718', textMuted:'#7A5C43',
        cardBorder:'rgba(199,154,107,.42)', surface2:'#F0DEC0', headerBg:'rgba(242,222,200,.92)',
      }
    default:
      return MODELO1
  }
}

export const MODELOS_DISPONIVEIS = [
  { id:'modelo1', nome:'Modelo 1', desc:'Rosa vibrante, moderno e marcante.' },
  { id:'modelo2', nome:'Modelo 2', desc:'Rosa blush claro, moderno e delicado.' },
  { id:'modelo3', nome:'Modelo 3', desc:'Preto e dourado, visual luxuoso e de alto padrão.' },
  { id:'modelo4', nome:'Modelo 4', desc:'Lilás e roxo, delicado, moderno e sofisticado.' },
  { id:'modelo5', nome:'Modelo 5', desc:'Nude e champagne, visual natural e acolhedor.' },
  { id:'modelo6', nome:'Modelo 6', desc:'Champagne claro, elegante e sofisticado.' },
]
