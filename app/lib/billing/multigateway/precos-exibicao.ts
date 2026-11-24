import { consultarPrecoInternacionalUnico } from '../stripe/catalogo-internacional-unico'
export type PlanoCheckout = 'free'|'minipage'|'agenda'|'loja'|'essencial'
export type CicloCheckout = 'mensal'|'anual'
/** Cotação de EXIBIÇÃO dos preços Live previamente aprovados.
 * Países fora da V1 permanecem sem preço. O servidor revalida tudo no checkout.
 */
export function precoReferenciaCheckout(plano:PlanoCheckout,ciclo:CicloCheckout,pais:string,idioma='pt-BR') {
 if(plano==='free') return {texto:'Grátis',moeda:'BRL',centavos:0,origem:'gratuito' as const}
 const codigo=pais.trim().toUpperCase()
 const p=consultarPrecoInternacionalUnico(plano,ciclo,codigo)
 if(!p)return {texto:'Preço regional em definição',moeda:null,centavos:null,origem:'pendente' as const}
 let texto:string
 try{texto=new Intl.NumberFormat(idioma,{style:'currency',currency:p.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(p.amountMinor/100)}
 catch{texto=new Intl.NumberFormat('pt-BR',{style:'currency',currency:p.currency}).format(p.amountMinor/100)}
 return {texto,moeda:p.currency,centavos:p.amountMinor,origem:codigo==='BR'?'brasil' as const:'catalogo_internacional_aprovado' as const}
}
