import type { SupabaseClient } from '@supabase/supabase-js'
import { resolverPrecoSandbox } from './checkout-preview'

export type StatusReserva = 'reserved' | 'sending' | 'created' | 'completed' | 'failed' | 'expired'
export type Reserva = {
  attempt_id: string
  user_id: string
  plan_code: string
  billing_cycle: string
  paddle_price_id: string
  status: StatusReserva
  paddle_transaction_id: string | null
}

/** Exige banco Sandbox COM a tabela e RPCs instaladas. Exclusivamente service_role. */
export function repositorioReservasSandbox(supabase: SupabaseClient) {
  return {
    async reservar(input: {userId:string; attemptId:string; plano:string; ciclo:string}) {
      const p = resolverPrecoSandbox(input.plano,input.ciclo)
      const {data,error} = await supabase.rpc('billing_paddle_reserve_sandbox_attempt', {
        p_user_id:input.userId,p_attempt_id:input.attemptId,p_plan_code:p.plano,
        p_billing_cycle:p.ciclo,p_paddle_price_id:p.priceId,
      })
      if(error) throw new Error(`RESERVA_NEGADA:${error.message}`)
      const row = Array.isArray(data) ? data[0] : null
      if (!row || row.out_attempt_id !== input.attemptId || typeof row.out_reused !== 'boolean')
        throw new Error('RESPOSTA_RESERVA_INVALIDA')
      return { status:row.out_status as StatusReserva, reused:row.out_reused as boolean }
    },
    async iniciarEnvio(input:{userId:string;attemptId:string}) {
      const {data,error}=await supabase.rpc('billing_paddle_claim_sandbox_attempt', {
        p_user_id:input.userId,p_attempt_id:input.attemptId,
      })
      if(error) throw new Error(`CLAIM_INDISPONIVEL:${error.message}`)
      return data === true
    },
    async confirmarCriacao(input:{userId:string;attemptId:string;transactionId:string}) {
      const {data,error}=await supabase.rpc('billing_paddle_confirm_sandbox_created', {
        p_user_id:input.userId,p_attempt_id:input.attemptId,p_transaction_id:input.transactionId,
      })
      if(error || data !== true) throw new Error('TRANSACAO_CRIADA_PERSISTENCIA_INCERTA')
    },
    async buscar(userId:string,attemptId:string):Promise<Reserva|null> {
      const {data,error}=await supabase.from('billing_paddle_checkout_attempts')
        .select('attempt_id,user_id,plan_code,billing_cycle,paddle_price_id,status,paddle_transaction_id')
        .eq('user_id',userId).eq('attempt_id',attemptId).maybeSingle()
      if(error) throw new Error('RESERVA_CONSULTA_INDISPONIVEL')
      return data as Reserva|null
    },
  }
}
