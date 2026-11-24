/** Preços Live aprovados e fixos no servidor; nunca aceitar priceId do cliente. */
import { consultarPrecoAprovadoV1 } from './catalogo-v1-aprovado'
import { consultarPrecoInternacionalUnico } from './catalogo-internacional-unico'
export type PlanCode='minipage'|'agenda'|'loja'|'essencial'
export type BillingCycle='mensal'|'anual'
export type ApprovedPrice={priceId:string;country:string;currency:string;amountMinor:number;plan:PlanCode;cycle:BillingCycle}
export function approvedPrice(plan:string,cycle:string,country:string):ApprovedPrice|null {
 const p=consultarPrecoInternacionalUnico(plan,cycle,country)
 if(!p)return null
 return {priceId:p.priceId,country,currency:p.currency,amountMinor:p.amountMinor,plan:plan as PlanCode,cycle:cycle as BillingCycle}
}

/** Valida contratos V1 antigos e V2 novos pelo PRICE ID contratado, sem migrar valores. */
export function approvedPriceForExisting(plan:string,cycle:string,country:string,storedPriceId:string):ApprovedPrice|null {
 const newer=approvedPrice(plan,cycle,country)
 if(newer?.priceId===storedPriceId)return newer
 const old=consultarPrecoAprovadoV1(plan,cycle,country)
 if(!old||old.priceId!==storedPriceId)return null
 return {priceId:old.priceId,country,currency:old.currency,amountMinor:old.amountMinor,plan:plan as PlanCode,cycle:cycle as BillingCycle}
}
