/** URL de checkout para uma escolha paga. Nunca ativa acesso ou cria cobrança. */
export function destinoCheckoutOnboarding(plano:string,ciclo:string,pais:string):string {
  if (!['minipage','agenda','loja','essencial'].includes(plano) || !['mensal','anual'].includes(ciclo) || !/^[A-Z]{2}$/.test(pais)) throw new Error('INVALID_CHECKOUT_INTENT')
  return '/painel/contratar?'+new URLSearchParams({plan:plano,cycle:ciclo,market:pais==='BR'?'BR':'INTL',confirm:'1'}).toString()
}
