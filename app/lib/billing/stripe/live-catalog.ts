/** Preços Live aprovados e fixos no servidor; nunca aceitar priceId do cliente. */
import { consultarPrecoAprovadoV1 } from './catalogo-v1-aprovado'
export type PlanCode='minipage'|'agenda'|'loja'|'essencial'
export type BillingCycle='mensal'|'anual'
export type ApprovedPrice={priceId:string;country:string;currency:string;amountMinor:number;plan:PlanCode;cycle:BillingCycle}
export function approvedPrice(plan:string,cycle:string,country:string):ApprovedPrice|null {
 const p=consultarPrecoAprovadoV1(plan,cycle,country)
 if(!p)return null
 return {priceId:p.priceId,country,currency:p.currency,amountMinor:p.amountMinor,plan:plan as PlanCode,cycle:cycle as BillingCycle}
}
