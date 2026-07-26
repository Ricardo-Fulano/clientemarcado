// Fonte unica do sistema de temas da pagina publica (Cor de destaque em /painel/perfil).
// Reutilizada por app/[slug]/page.tsx e app/[slug]/agendar/page.tsx para nao duplicar logica.

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
export const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
export function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

export function getTema(temaPublico: string) {
  switch(temaPublico) {
    case 'modelo1':  return { accent:'#FF4FA3', accent2:'#EC4899', secondary:'#D946EF', soft:'rgba(255,79,163,.12)', border:'rgba(255,79,163,.28)', glow:'rgba(255,79,163,.15)', btnText:'#fff' }
    case 'modelo2':  return { accent:'#DB6A9A', accent2:'#B85C8E', secondary:'#8B5CF6', soft:'rgba(219,106,154,.12)',border:'rgba(219,106,154,.28)',glow:'rgba(219,106,154,.15)',btnText:'#fff' }
    case 'modelo3':  return { accent:'#D4AF37', accent2:'#F0D98A', secondary:'#9C7A2F', soft:'rgba(212,175,55,.12)', border:'rgba(212,175,55,.28)', glow:'rgba(212,175,55,.15)', btnText:'#1A140A' }
    case 'modelo4':  return { accent:'#A78BFA', accent2:'#C084FC', secondary:'#7C3AED', soft:'rgba(167,139,250,.12)',border:'rgba(167,139,250,.28)',glow:'rgba(167,139,250,.15)',btnText:'#fff' }
    case 'modelo5':  return { accent:'#D6A77A', accent2:'#E8C39E', secondary:'#A47148', soft:'rgba(214,167,122,.12)',border:'rgba(214,167,122,.28)',glow:'rgba(214,167,122,.15)',btnText:'#2A1810' }
    default:         return { accent:'#DB6A9A', accent2:'#B85C8E', secondary:'#8B5CF6', soft:'rgba(219,106,154,.12)',border:'rgba(219,106,154,.28)',glow:'rgba(219,106,154,.15)',btnText:'#fff' }
  }
}
