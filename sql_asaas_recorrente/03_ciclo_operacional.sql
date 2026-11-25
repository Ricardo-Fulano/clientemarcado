-- MiniPage Pro: complements the already installed 01 migration. No customer writes during installation.
BEGIN;
CREATE OR REPLACE FUNCTION public.mp_asaas_downgrade_recurring_v3(p_attempt uuid,p_payment text,p_due date,p_expected_end timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE; s public.billing_subscriptions%ROWTYPE; p public.perfis%ROWTYPE; ok boolean;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR a.status<>'paid' OR NOT a.renewal_active OR a.initial_payment_id IS NULL OR a.subscription_id IS NULL THEN RETURN false; END IF;
 SELECT * INTO p FROM public.perfis WHERE user_id=a.user_id FOR UPDATE;
 IF NOT FOUND OR p.gateway IS DISTINCT FROM 'asaas' OR p.gateway_customer_id IS DISTINCT FROM a.customer_id OR p.gateway_subscription_id IS DISTINCT FROM a.subscription_id OR p.primeiro_pagamento_confirmado IS DISTINCT FROM true OR p.plano_tipo IS DISTINCT FROM a.plan_code OR p.status_acesso IS DISTINCT FROM 'em_atraso' THEN RETURN false; END IF;
 SELECT * INTO s FROM public.billing_subscriptions WHERE id=a.attempt_id FOR UPDATE;
 IF NOT FOUND OR s.current_period_end IS DISTINCT FROM p_expected_end OR s.current_period_end>now() OR p.plano_ativo_ate IS NULL OR p.plano_ativo_ate>now() OR s.status<>'past_due' THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_payments WHERE subscription_id=a.attempt_id AND status IN ('confirmed','settled') AND due_at >= (p_due::timestamp AT TIME ZONE 'America/Sao_Paulo')) THEN RETURN false; END IF;
 SELECT public.aplicar_downgrade_inadimplencia(a.user_id,a.plan_code,a.subscription_id,p_payment,p_due) INTO ok;
 RETURN coalesce(ok,false);
END $$;
REVOKE ALL ON FUNCTION public.mp_asaas_downgrade_recurring_v3(uuid,text,date,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_downgrade_recurring_v3(uuid,text,date,timestamptz) TO service_role;
-- Retain history and provider binding. No automatic second subscription after a canceled contract.
CREATE OR REPLACE FUNCTION public.mp_asaas_expire_access_v3(p_attempt uuid,p_expected_end timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE; s public.billing_subscriptions%ROWTYPE; p public.perfis%ROWTYPE; n integer;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR a.status<>'paid' OR a.renewal_active OR a.initial_payment_id IS NULL THEN RETURN false; END IF;
 SELECT * INTO p FROM public.perfis WHERE user_id=a.user_id FOR UPDATE;
 IF NOT FOUND OR p.gateway IS DISTINCT FROM 'asaas' OR p.gateway_customer_id IS DISTINCT FROM a.customer_id OR p.gateway_subscription_id IS DISTINCT FROM a.subscription_id OR p.modalidade_acesso IS DISTINCT FROM 'comercial' OR p.plano_tipo IS DISTINCT FROM a.plan_code OR p.status_acesso IS DISTINCT FROM 'ativo' OR p.plano_anterior_downgrade IS NOT NULL OR p.motivo_downgrade IS NOT NULL OR p.plano_ativo_ate IS NULL OR p.plano_ativo_ate>now() THEN RETURN false; END IF;
 SELECT * INTO s FROM public.billing_subscriptions WHERE id=a.attempt_id FOR UPDATE;
 IF NOT FOUND OR s.status<>'canceled' OR s.current_period_end IS NULL OR s.current_period_end IS DISTINCT FROM p_expected_end OR s.current_period_end>now() THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_payments WHERE subscription_id=a.attempt_id AND status NOT IN ('confirmed','settled')) OR EXISTS(SELECT 1 FROM public.billing_asaas_commission_reviews WHERE attempt_id=a.attempt_id AND status='review') THEN RETURN false; END IF;
 UPDATE public.perfis SET plano_tipo='free',plano='free',status_acesso='ativo' WHERE user_id=a.user_id;
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'EXPIRATION_PROFILE_CHANGED'; END IF;
 UPDATE public.billing_subscriptions SET status='expired',updated_at=now() WHERE id=a.attempt_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.mp_asaas_expire_access_v3(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_expire_access_v3(uuid,timestamptz) TO service_role;
CREATE OR REPLACE FUNCTION public.mp_asaas_sync_renewal_v1(p_attempt uuid,p_customer text,p_subscription text,p_auth_status text,p_renewal boolean) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR a.customer_id IS DISTINCT FROM p_customer OR a.status='closed' OR (a.subscription_id IS NOT NULL AND p_subscription IS DISTINCT FROM a.subscription_id) OR (p_renewal AND p_subscription IS NULL) THEN RAISE EXCEPTION 'RENEWAL_MISMATCH'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_subscriptions WHERE id=a.attempt_id AND status='expired') THEN RAISE EXCEPTION 'EXPIRED_CONTRACT_REQUIRES_REVIEW'; END IF;
 IF a.initial_payment_id IS NOT NULL THEN
  PERFORM 1 FROM public.perfis WHERE user_id=a.user_id AND gateway='asaas' AND gateway_customer_id=a.customer_id AND gateway_subscription_id IS NOT DISTINCT FROM a.subscription_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_CHANGED'; END IF;
  UPDATE public.perfis SET gateway_subscription_id=p_subscription WHERE user_id=a.user_id;
  UPDATE public.billing_subscriptions SET provider_subscription_id=p_subscription,status=CASE WHEN status='expired' THEN 'expired' WHEN p_renewal THEN CASE WHEN status='past_due' THEN 'past_due' ELSE 'active' END ELSE 'canceled' END,canceled_at=CASE WHEN p_renewal THEN NULL ELSE coalesce(canceled_at,now()) END,updated_at=now() WHERE id=a.attempt_id;
 END IF;
 UPDATE public.billing_asaas_recurring_attempts SET authorization_status=p_auth_status,subscription_id=p_subscription,renewal_active=p_renewal,updated_at=now() WHERE attempt_id=p_attempt;
END; $$;
REVOKE ALL ON FUNCTION public.mp_asaas_sync_renewal_v1(uuid,text,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_sync_renewal_v1(uuid,text,text,text,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.mp_asaas_recurring_ready_v3() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT public.mp_asaas_recurring_ready_v1() AND to_regprocedure('public.mp_asaas_expire_access_v3(uuid,timestamptz)') IS NOT NULL AND to_regprocedure('public.mp_asaas_downgrade_recurring_v3(uuid,text,date,timestamptz)') IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.mp_asaas_recurring_ready_v3() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_recurring_ready_v3() TO service_role;
DO $$ BEGIN
 IF NOT public.mp_asaas_recurring_ready_v3() OR has_function_privilege('authenticated','public.mp_asaas_expire_access_v3(uuid,timestamptz)','EXECUTE') OR has_function_privilege('authenticated','public.mp_asaas_downgrade_recurring_v3(uuid,text,date,timestamptz)','EXECUTE') OR NOT has_function_privilege('service_role','public.aplicar_downgrade_inadimplencia(uuid,text,text,text,date)','EXECUTE') THEN RAISE EXCEPTION 'OPERACAO_NAO_PRONTA'; END IF;
END $$;
COMMIT;
