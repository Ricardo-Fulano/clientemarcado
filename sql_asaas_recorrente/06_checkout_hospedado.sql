-- Aditiva. Não libera reservas, não modifica clientes ou assinaturas existentes.
BEGIN;
ALTER TABLE public.billing_asaas_recurring_attempts ADD COLUMN IF NOT EXISTS hosted_card boolean NOT NULL DEFAULT false;
ALTER TABLE public.billing_asaas_recurring_attempts ADD COLUMN IF NOT EXISTS previous_customer_id text;
-- Closure is a CAS: an in-flight payment/customer bind cannot be overwritten by a stale event.
CREATE OR REPLACE FUNCTION public.mp_asaas_close_hosted_unpaid_v6(p_attempt uuid,p_checkout text,p_updated_at timestamptz) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE n integer;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 UPDATE public.billing_asaas_recurring_attempts SET status='closed',renewal_active=false,updated_at=now()
 WHERE attempt_id=p_attempt AND checkout_id=p_checkout AND updated_at=p_updated_at AND hosted_card AND method='card' AND customer_id IS NULL AND initial_payment_id IS NULL AND subscription_id IS NULL AND status IN ('created','review');
 GET DIAGNOSTICS n=ROW_COUNT; RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.mp_asaas_close_hosted_unpaid_v6(uuid,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_close_hosted_unpaid_v6(uuid,text,timestamptz) TO service_role;
CREATE OR REPLACE FUNCTION public.mp_asaas_recurring_ready_v6() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT public.mp_asaas_recurring_ready_v3() AND to_regprocedure('public.mp_asaas_close_hosted_unpaid_v6(uuid,text,timestamptz)') IS NOT NULL AND (SELECT count(*)=2 FROM information_schema.columns WHERE table_schema='public' AND table_name='billing_asaas_recurring_attempts' AND column_name IN ('hosted_card','previous_customer_id'));
$$;
REVOKE ALL ON FUNCTION public.mp_asaas_recurring_ready_v6() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_recurring_ready_v6() TO service_role;
DO $$ BEGIN IF NOT public.mp_asaas_recurring_ready_v6() OR has_function_privilege('authenticated','public.mp_asaas_recurring_ready_v6()','EXECUTE') THEN RAISE EXCEPTION 'CHECKOUT_SCHEMA_NOT_READY'; END IF; END $$;
COMMIT;
SELECT public.mp_asaas_recurring_ready_v6() AS pronto, has_function_privilege('authenticated','public.mp_asaas_recurring_ready_v6()','EXECUTE') AS authenticated_exec;
