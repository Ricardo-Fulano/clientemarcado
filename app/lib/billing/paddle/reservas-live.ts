import type { SupabaseClient } from '@supabase/supabase-js'
import { resolverPrecoPaddleLive } from './catalogo-live'

/** Adaptador para as RPCs atomicas. Somente no servidor, com service_role.
 * NAO faz POST, NAO ativa plano, NAO paga afiliados.
 */
export function repositorioReservasLive(db: SupabaseClient) {
  return {
    async reservar(input: {userId:string;attemptId:string;plano:string;ciclo:string}) {
      const expected = resolverPrecoPaddleLive(input.plano, input.ciclo)
      const {data,error} = await db.rpc('billing_paddle_live_reserve_attempt', {
        p_user_id:input.userId,p_attempt_id:input.attemptId,
        p_plan_code:expected.plano,p_billing_cycle:expected.ciclo,
      })
      if(error) throw new Error('PADDLE_LIVE_RESERVA_RECUSADA')
      const row=Array.isArray(data) ? data[0] : null
      if(!row || typeof row.out_status !== 'string' || typeof row.out_reused !== 'boolean' ||
         row.out_price_id !== expected.priceId) throw new Error('PADDLE_LIVE_RESERVA_INCONSISTENTE')
      return {status:row.out_status as string,reused:row.out_reused as boolean,priceId:row.out_price_id as string}
    },
    async iniciarEnvio(userId:string,attemptId:string) {
      const {data,error} = await db.rpc('billing_paddle_live_claim_attempt', {
        p_user_id:userId,p_attempt_id:attemptId,
      })
      if(error || typeof data !== 'boolean') throw new Error('PADDLE_LIVE_CLAIM_INDISPONIVEL')
      return data
    },
    async confirmarCriacao(userId:string,attemptId:string,transactionId:string) {
      const {data,error} = await db.rpc('billing_paddle_live_confirm_created', {
        p_user_id:userId,p_attempt_id:attemptId,p_transaction_id:transactionId,
      })
      if(error || data!==true) throw new Error('PADDLE_LIVE_CONFIRMACAO_INDETERMINADA')
    },
    async buscar(userId:string,attemptId:string) {
      const {data,error} = await db.from('billing_paddle_live_checkout_attempts')
        .select('attempt_id,user_id,plan_code,billing_cycle,price_id,status,transaction_id')
        .eq('user_id',userId).eq('attempt_id',attemptId).maybeSingle()
      if(error) throw new Error('PADDLE_LIVE_CONSULTA_INDISPONIVEL')
      return data
    },
  }
}
