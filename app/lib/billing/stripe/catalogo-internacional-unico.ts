/** MiniPage Pro — V2: oferta internacional unica em USD.
 * Reutiliza os 8 Stripe Price IDs Live do conjunto AR da V1.
 * Nao altera dados, contratos ou precos historicos.
 * BR permanece em BRL para futura EBANX; outros paises sao sujeitos
 * a elegibilidade real do Stripe, regras fiscais e sancoes aplicaveis.
 */
import {consultarPrecoAprovadoV1, type PrecoCatalogoV1} from './catalogo-v1-aprovado'
import {ISO_COUNTRIES} from './paises-iso'

// Exclusoes conservadoras. Esta lista nao substitui verificacoes de compliance do gateway.
const RESTRITOS=new Set<string>(['CU','IR','KP','SY','RU','BY'])
const PAISES=new Set<string>(ISO_COUNTRIES)
export const PAISES_OFERTA=Object.freeze(ISO_COUNTRIES.filter(c=>!RESTRITOS.has(c)))
export function consultarPrecoInternacionalUnico(plano:string,ciclo:string,pais:string):PrecoCatalogoV1|null{
 const country=typeof pais==='string'?pais.trim().toUpperCase():''
 if(!PAISES.has(country)||RESTRITOS.has(country))return null
 // Preserva o catalogo Brasil, que NAO pode ser cobrado pela Stripe neste fluxo.
 return consultarPrecoAprovadoV1(plano,ciclo,country==='BR'?'BR':'AR')
}
export const TABELA_INTERNACIONAL_USD=Object.freeze({
 minipage:{mensal:590,anual:5890},agenda:{mensal:790,anual:7890},
 loja:{mensal:990,anual:9890},essencial:{mensal:1190,anual:11890}
})
