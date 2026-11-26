-- Migração aditiva; a reserva permanece aberta. Não cria cobranças.
BEGIN;
ALTER TABLE public.billing_asaas_recurring_attempts ADD COLUMN IF NOT EXISTS card_retry_safe boolean NOT NULL DEFAULT false;
-- Somente a tentativa cuja rejeição HTTP 400 foi comprovada no log Asaas pelo operador.
-- Nunca autorizar outras tentativas em review por ausência de IDs ou timeout.
UPDATE public.billing_asaas_recurring_attempts a SET card_retry_safe=true,updated_at=now()
WHERE a.attempt_id='f4688faa-ad26-451c-aaa2-31f2d746f25e'::uuid
 AND a.contract_ref='mp_f4688faaad26451caaa231f2d746f25e' AND a.customer_id='cus_000219822281'
 AND a.updated_at='2026-11-25T23:01:06.307+00:00'::timestamptz
 AND a.method='card' AND a.status='review' AND a.card_retry_safe=false
 AND a.checkout_id IS NULL AND a.authorization_id IS NULL AND a.subscription_id IS NULL AND a.initial_payment_id IS NULL AND NOT a.renewal_active
 AND NOT EXISTS(SELECT 1 FROM public.billing_asaas_recurring_events e WHERE e.attempt_id=a.attempt_id)
 AND NOT EXISTS(SELECT 1 FROM public.billing_subscriptions s WHERE s.user_id=a.user_id AND s.status IN ('active','trialing','pending','past_due','paused'))
 AND NOT EXISTS(SELECT 1 FROM public.billing_stripe_checkout_attempts s WHERE s.user_id=a.user_id AND s.status IN ('reserved','sending','created','review'));
COMMIT;
SELECT status,card_retry_safe,checkout_id IS NULL AS sem_checkout_local FROM public.billing_asaas_recurring_attempts WHERE attempt_id='f4688faa-ad26-451c-aaa2-31f2d746f25e'::uuid;
