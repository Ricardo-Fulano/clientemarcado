BEGIN;
SET LOCAL lock_timeout='5s';
CREATE OR REPLACE FUNCTION public.mp_asaas_apply_payment_v1(p_attempt uuid,p_payment text,p_customer text,p_subscription text,p_paid timestamptz,p_due timestamptz,p_status text,p_renewal boolean)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE; p public.perfis%ROWTYPE; s public.billing_subscriptions%ROWTYPE; oldpay public.billing_payments%ROWTYPE; start_at timestamptz; end_at timestamptz;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR a.customer_id IS DISTINCT FROM p_customer OR a.status='closed' OR p_status NOT IN ('confirmed','settled') OR p_paid IS NULL OR p_due IS NULL OR nullif(p_payment,'') IS NULL THEN RAISE EXCEPTION 'INVALID_PAYMENT'; END IF;
 IF a.subscription_id IS NOT NULL AND p_subscription IS DISTINCT FROM a.subscription_id THEN RAISE EXCEPTION 'SUBSCRIPTION_MISMATCH'; END IF;
 IF a.method='card' AND p_subscription IS NULL THEN RAISE EXCEPTION 'CARD_WITHOUT_SUBSCRIPTION'; END IF;
 IF p_renewal AND p_subscription IS NULL THEN RAISE EXCEPTION 'NO_RECURRING_ID'; END IF;
 SELECT * INTO p FROM public.perfis WHERE user_id=a.user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_MISSING'; END IF;
 IF a.initial_payment_id IS NULL THEN
  IF p.plano_tipo IS DISTINCT FROM 'free' OR coalesce(p.status_acesso,'') NOT IN ('ativo','aguardando_pagamento') OR coalesce(p.primeiro_pagamento_confirmado,false) OR nullif(p.gateway,'') IS NOT NULL OR nullif(p.gateway_customer_id,'') IS NOT NULL OR nullif(p.gateway_subscription_id,'') IS NOT NULL OR nullif(p.mp_subscription_id,'') IS NOT NULL OR coalesce(p.modalidade_acesso,'comercial') <> 'comercial' THEN RAISE EXCEPTION 'PROFILE_CHANGED'; END IF;
 ELSE
  IF p.gateway IS DISTINCT FROM 'asaas' OR p.gateway_customer_id IS DISTINCT FROM a.customer_id OR p.gateway_subscription_id IS DISTINCT FROM a.subscription_id OR coalesce(p.modalidade_acesso,'') <> 'comercial' THEN RAISE EXCEPTION 'PROFILE_BINDING_CHANGED'; END IF;
  IF p.plano_tipo IS DISTINCT FROM a.plan_code AND NOT (p.plano_tipo='free' AND p.plano_anterior_downgrade=a.plan_code AND p.motivo_downgrade IN ('inadimplencia','estorno') AND p.status_acesso IN ('ativo','em_atraso')) THEN RAISE EXCEPTION 'PLAN_CHANGED'; END IF;
  IF p.status_acesso NOT IN ('ativo','em_atraso') THEN RAISE EXCEPTION 'ACCESS_REQUIRES_REVIEW'; END IF;
 END IF;
 SELECT * INTO oldpay FROM public.billing_payments WHERE provider='asaas' AND provider_payment_id=p_payment;
 IF FOUND THEN
  IF oldpay.subscription_id IS DISTINCT FROM a.attempt_id OR oldpay.amount_minor IS DISTINCT FROM a.amount_minor OR oldpay.status NOT IN ('confirmed','settled') THEN RAISE EXCEPTION 'PAYMENT_ALREADY_BOUND_OR_REVERSED'; END IF;
  IF oldpay.status='confirmed' AND p_status='settled' THEN UPDATE public.billing_payments SET status='settled',updated_at=now() WHERE id=oldpay.id; END IF;
  RETURN 'duplicate';
 END IF;
 start_at=p_due;
 end_at=((start_at AT TIME ZONE 'America/Sao_Paulo') + CASE WHEN a.billing_cycle='anual' THEN interval '1 year' ELSE interval '1 month' END) AT TIME ZONE 'America/Sao_Paulo';
 IF a.initial_payment_id IS NULL THEN
  INSERT INTO public.billing_subscriptions(id,user_id,provider,provider_customer_id,provider_subscription_id,plan_code,billing_cycle,currency,contracted_amount_minor,status,current_period_start,current_period_end)
   VALUES(a.attempt_id,a.user_id,'asaas',a.customer_id,p_subscription,a.plan_code,a.billing_cycle,'BRL',a.amount_minor,CASE WHEN p_renewal THEN 'active' ELSE 'canceled' END,start_at,end_at);
 ELSE
  SELECT * INTO s FROM public.billing_subscriptions WHERE id=a.attempt_id FOR UPDATE;
  IF NOT FOUND OR s.user_id IS DISTINCT FROM a.user_id OR s.provider_customer_id IS DISTINCT FROM a.customer_id OR s.contracted_amount_minor IS DISTINCT FROM a.amount_minor THEN RAISE EXCEPTION 'CONTRACT_CHANGED'; END IF;
  -- Não reativar por pagamento de competência anterior à última aplicada.
  IF EXISTS(SELECT 1 FROM public.billing_payments WHERE subscription_id=a.attempt_id AND status IN ('confirmed','settled') AND due_at>=p_due) THEN RAISE EXCEPTION 'OLD_OR_DUPLICATE_PERIOD'; END IF;
  UPDATE public.billing_subscriptions SET provider_subscription_id=p_subscription,status=CASE WHEN p_renewal THEN 'active' ELSE 'canceled' END,current_period_start=start_at,current_period_end=greatest(current_period_end,end_at),updated_at=now() WHERE id=a.attempt_id;
 END IF;
 INSERT INTO public.billing_payments(subscription_id,provider,provider_payment_id,currency,amount_minor,status,paid_at,due_at)
  VALUES(a.attempt_id,'asaas',p_payment,'BRL',a.amount_minor,p_status,p_paid,p_due);
 IF p.motivo_downgrade='inadimplencia' THEN
  IF p.plano_tipo<>'free' OR p.plano_anterior_downgrade IS DISTINCT FROM a.plan_code OR p.downgrade_em IS NULL OR nullif(p.pagamento_origem_downgrade,'') IS NULL OR end_at<=now() THEN RAISE EXCEPTION 'RECOVERY_REQUIRES_REVIEW'; END IF;
  INSERT INTO public.historico_recuperacoes_inadimplencia(user_id,plano_restaurado,pagamento_origem_downgrade,pagamento_regularizacao,gateway_subscription_id,valor_contratado,downgrade_em)
   VALUES(a.user_id,a.plan_code,p.pagamento_origem_downgrade,p_payment,p_subscription,a.amount_minor/100.0,p.downgrade_em);
 END IF;
 UPDATE public.perfis SET plano_anterior_downgrade=NULL,downgrade_em=NULL,motivo_downgrade=NULL,pagamento_origem_downgrade=NULL,plano_tipo=a.plan_code,plano=a.plan_code,gateway='asaas',gateway_customer_id=a.customer_id,gateway_subscription_id=p_subscription,billing_cycle=a.billing_cycle,modalidade_acesso='comercial',valor_contratado=a.amount_minor/100.0,valor_contratado_em=coalesce(valor_contratado_em,now()),primeiro_pagamento_confirmado=true,data_primeiro_pagamento=coalesce(data_primeiro_pagamento,p_paid),plano_ativo_ate=greatest(plano_ativo_ate,end_at),status_acesso='ativo' WHERE user_id=a.user_id;
 UPDATE public.billing_asaas_recurring_attempts SET status='paid',initial_payment_id=coalesce(initial_payment_id,p_payment),subscription_id=p_subscription,renewal_active=p_renewal,qr_payload=null,qr_image=null,updated_at=now() WHERE attempt_id=a.attempt_id;
 RETURN 'applied';
END; $$;
REVOKE ALL ON FUNCTION public.mp_asaas_apply_payment_v1(uuid,text,text,text,timestamptz,timestamptz,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_apply_payment_v1(uuid,text,text,text,timestamptz,timestamptz,text,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.mp_asaas_apply_adverse_v1(p_attempt uuid,p_payment text,p_status text,p_due timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE; bp public.billing_payments%ROWTYPE; pf public.perfis%ROWTYPE; bs public.billing_subscriptions%ROWTYPE; remaining_end timestamptz;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR a.status<>'paid' OR a.initial_payment_id IS NULL OR p_status NOT IN ('overdue','refunded','chargeback') THEN RAISE EXCEPTION 'ADVERSE_REVIEW'; END IF;
 SELECT * INTO bp FROM public.billing_payments WHERE provider='asaas' AND provider_payment_id=p_payment FOR UPDATE;
 IF FOUND AND bp.subscription_id IS DISTINCT FROM a.attempt_id THEN RAISE EXCEPTION 'PAYMENT_MISMATCH'; END IF;
 IF p_status='overdue' AND bp.status IN ('confirmed','settled','refunded','chargeback') THEN RETURN; END IF;
 IF p_status IN ('refunded','chargeback') THEN
  IF bp.id IS NULL THEN RAISE EXCEPTION 'REVERSED_UNKNOWN_PAYMENT'; END IF;
  PERFORM public.mp_asaas_commission_adverse_v2(p_attempt,p_payment,p_status);
  UPDATE public.billing_payments SET status=p_status,updated_at=now() WHERE id=bp.id;
  IF p_status='refunded' THEN
   SELECT * INTO pf FROM public.perfis WHERE user_id=a.user_id FOR UPDATE;
   SELECT * INTO bs FROM public.billing_subscriptions WHERE id=a.attempt_id FOR UPDATE;
   IF pf.gateway='asaas' AND pf.gateway_customer_id=a.customer_id AND pf.gateway_subscription_id IS NOT DISTINCT FROM a.subscription_id AND pf.modalidade_acesso='comercial' AND pf.plano_tipo=a.plan_code AND pf.status_acesso IN ('ativo','em_atraso') AND bs.user_id=a.user_id AND bs.provider='asaas' AND bs.provider_customer_id=a.customer_id AND bs.provider_subscription_id IS NOT DISTINCT FROM a.subscription_id AND pf.plano_ativo_ate IS NOT DISTINCT FROM bs.current_period_end THEN
    SELECT max(((due_at AT TIME ZONE 'America/Sao_Paulo')+CASE WHEN a.billing_cycle='anual' THEN interval '1 year' ELSE interval '1 month' END) AT TIME ZONE 'America/Sao_Paulo') INTO remaining_end FROM public.billing_payments WHERE subscription_id=a.attempt_id AND provider='asaas' AND status IN ('confirmed','settled') AND due_at IS NOT NULL;
    IF coalesce(remaining_end,'-infinity'::timestamptz)<=now() THEN
     UPDATE public.perfis SET plano_tipo='free',plano='free',plano_ativo_ate=least(now(),coalesce(remaining_end,now())),status_acesso='ativo',plano_anterior_downgrade=a.plan_code,downgrade_em=now(),motivo_downgrade='estorno',pagamento_origem_downgrade=p_payment WHERE user_id=a.user_id;
     UPDATE public.billing_subscriptions SET current_period_end=greatest(coalesce(current_period_start,now()),least(now(),coalesce(remaining_end,now()))),status=CASE WHEN a.renewal_active THEN 'past_due' ELSE 'canceled' END,updated_at=now() WHERE id=a.attempt_id;
    ELSIF remaining_end<bs.current_period_end THEN
     UPDATE public.perfis SET plano_ativo_ate=remaining_end WHERE user_id=a.user_id;
     UPDATE public.billing_subscriptions SET current_period_end=remaining_end,updated_at=now() WHERE id=a.attempt_id;
    END IF;
   END IF;
  END IF;
 END IF;
 IF p_status='overdue' AND NOT EXISTS(SELECT 1 FROM public.billing_payments WHERE subscription_id=a.attempt_id AND status IN ('confirmed','settled') AND due_at>p_due) THEN
  UPDATE public.perfis SET status_acesso='em_atraso' WHERE user_id=a.user_id AND gateway='asaas' AND gateway_customer_id=a.customer_id AND plano_tipo=a.plan_code AND status_acesso='ativo';
  UPDATE public.billing_subscriptions SET status='past_due',updated_at=now() WHERE id=a.attempt_id AND status='active';
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.mp_asaas_apply_adverse_v1(uuid,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_apply_adverse_v1(uuid,text,text,timestamptz) TO service_role;


-- Repair only the already verified, specifically identified refund. No cancellation or new charge.
SET LOCAL ROLE service_role;
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT a.attempt_id,b.provider_payment_id,b.due_at FROM public.billing_asaas_recurring_attempts a JOIN public.billing_payments b ON b.subscription_id=a.attempt_id AND b.provider='asaas' JOIN public.billing_asaas_recurring_events e ON e.attempt_id=a.attempt_id AND e.payment_id=b.provider_payment_id WHERE a.method='card' AND b.provider_payment_id='pay_0_84nxgguytn0ot2' AND b.status='refunded' AND e.event_type='PAYMENT_REFUNDED' AND e.status='processed' LOOP
  PERFORM public.mp_asaas_apply_adverse_v1(r.attempt_id,r.provider_payment_id,'refunded',r.due_at);
 END LOOP;
END $$;
RESET ROLE;

COMMIT;
SELECT a.method,a.status,a.initial_payment_id,p.plano_tipo,p.plano_ativo_ate,p.motivo_downgrade FROM public.billing_asaas_recurring_attempts a JOIN public.perfis p ON p.user_id=a.user_id WHERE a.initial_payment_id='pay_0_84nxgguytn0ot2' OR a.attempt_id='14c04ed3-6e9d-42a8-98ef-9652306efe44'::uuid;
