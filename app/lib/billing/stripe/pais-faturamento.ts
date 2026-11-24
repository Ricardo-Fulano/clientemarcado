/** Verifica apenas coerencia dos paises informados.
 * O endereco fornecido no Checkout nao prova residencia fiscal/nacionalidade.
 * IP, emissor do cartao ou uso de VPN requerem controles adicionais proporcionais.
 */
export type CountryMatch='ok'|'mismatch'|'missing'
export function avaliarPaisFaturamento(paisPreco:unknown,paisStripe:unknown):CountryMatch{
 const normalize=(v:unknown)=>typeof v==='string'?v.trim().toUpperCase():''
 const a=normalize(paisPreco),b=normalize(paisStripe)
 if(!/^[A-Z]{2}$/.test(a)||!/^[A-Z]{2}$/.test(b))return 'missing'
 return a===b?'ok':'mismatch'
}
