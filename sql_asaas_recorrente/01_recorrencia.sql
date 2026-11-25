-- MiniPage Pro | aditivo | base c6be6cb. Executar primeiro em ambiente de validação.
BEGIN;
DO $$ BEGIN
 IF NOT (has_table_privilege('service_role','public.perfis','SELECT') AND has_table_privilege('service_role','public.perfis','UPDATE'))
 OR NOT (has_table_privilege('service_role','public.billing_subscriptions','SELECT') AND has_table_privilege('service_role','public.billing_subscriptions','INSERT') AND has_table_privilege('service_role','public.billing_subscriptions','UPDATE'))
 OR NOT (has_table_privilege('service_role','public.billing_payments','SELECT') AND has_table_privilege('service_role','public.billing_payments','INSERT') AND has_table_privilege('service_role','public.billing_payments','UPDATE'))
 OR NOT (has_table_privilege('service_role','public.historico_recuperacoes_inadimplencia','SELECT') AND has_table_privilege('service_role','public.historico_recuperacoes_inadimplencia','INSERT'))
 OR NOT (has_table_privilege('service_role','public.comissoes_parceiros','SELECT') AND has_table_privilege('service_role','public.comissoes_parceiros','UPDATE'))
 OR NOT has_function_privilege('service_role','public.registrar_comissao_pagamento(uuid,uuid,uuid,text,text,numeric,numeric,timestamptz,text)','EXECUTE') THEN
 RAISE EXCEPTION 'Permissoes financeiras service_role insuficientes; nenhuma migracao aplicada'; END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.billing_asaas_recurring_attempts (
 attempt_id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 contract_ref text NOT NULL UNIQUE CHECK (length(contract_ref)<=35),
 plan_code text NOT NULL CHECK (plan_code IN ('minipage','agenda','loja','essencial')),
 billing_cycle text NOT NULL CHECK (billing_cycle IN ('mensal','anual')),
 amount_minor bigint NOT NULL CHECK(amount_minor>0),
 method text NOT NULL CHECK(method IN ('card','pix')),
 status text NOT NULL CHECK(status IN ('sending','created','review','paid','closed')),
 customer_id text UNIQUE, checkout_id text UNIQUE, authorization_id text UNIQUE, subscription_id text UNIQUE,
 authorization_status text, renewal_active boolean NOT NULL DEFAULT false,
 qr_payload text, qr_image text, qr_expires text, conciliation_id text UNIQUE,
 initial_payment_id text UNIQUE, consent_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_asaas_recurring_attempts ADD COLUMN IF NOT EXISTS last_reconciled_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS mp_asaas_one_open_attempt ON public.billing_asaas_recurring_attempts(user_id) WHERE status<>'closed';
ALTER TABLE public.billing_asaas_recurring_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_asaas_recurring_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.billing_asaas_recurring_attempts TO service_role;
CREATE TABLE IF NOT EXISTS public.billing_asaas_recurring_events (
 event_id text PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES public.billing_asaas_recurring_attempts(attempt_id),
 event_type text NOT NULL, payment_id text, status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','processed','review')),
 received_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_asaas_recurring_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_asaas_recurring_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.billing_asaas_recurring_events TO service_role;
-- Serializa compras novas na mesma linha do perfil; a reserva persiste antes da chamada externa.
CREATE OR REPLACE FUNCTION public.mp_guard_new_checkout_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public.perfis%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.perfis WHERE user_id=NEW.user_id FOR UPDATE;
 IF NOT FOUND OR NOT (coalesce(p.status_acesso,'')='aguardando_pagamento' OR (p.plano_tipo='free' AND p.status_acesso='ativo'))
   OR (TG_TABLE_NAME='billing_asaas_recurring_attempts' AND (p.plano_tipo IS DISTINCT FROM 'free' OR coalesce(p.modalidade_acesso,'comercial') <> 'comercial'))
   OR coalesce(p.primeiro_pagamento_confirmado,false) OR nullif(p.gateway,'') IS NOT NULL
   OR nullif(p.gateway_customer_id,'') IS NOT NULL OR nullif(p.gateway_subscription_id,'') IS NOT NULL OR nullif(p.mp_subscription_id,'') IS NOT NULL
   THEN RAISE EXCEPTION 'PROFILE_NOT_ELIGIBLE'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_subscriptions WHERE user_id=NEW.user_id AND status IN ('active','trialing','pending','past_due','paused')) THEN RAISE EXCEPTION 'BILLING_ALREADY_EXISTS'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_asaas_recurring_attempts WHERE user_id=NEW.user_id AND status<>'closed') THEN RAISE EXCEPTION 'ASAAS_ATTEMPT_EXISTS'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_stripe_checkout_attempts WHERE user_id=NEW.user_id AND status IN ('reserved','sending','created','review')) THEN RAISE EXCEPTION 'STRIPE_ATTEMPT_EXISTS'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.mp_guard_new_checkout_v1() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS mp_guard_new_asaas_checkout_v1 ON public.billing_asaas_recurring_attempts;
CREATE TRIGGER mp_guard_new_asaas_checkout_v1 BEFORE INSERT ON public.billing_asaas_recurring_attempts FOR EACH ROW EXECUTE FUNCTION public.mp_guard_new_checkout_v1();
DROP TRIGGER IF EXISTS mp_guard_new_stripe_checkout_v1 ON public.billing_stripe_checkout_attempts;
CREATE TRIGGER mp_guard_new_stripe_checkout_v1 BEFORE INSERT ON public.billing_stripe_checkout_attempts FOR EACH ROW EXECUTE FUNCTION public.mp_guard_new_checkout_v1();
-- Verifica existência dos dois gatilhos e RPC de ativação antes de oferecer contratação.
CREATE OR REPLACE FUNCTION public.mp_asaas_recurring_ready_v1() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT (SELECT count(*)=2 FROM pg_trigger WHERE tgname IN ('mp_guard_new_asaas_checkout_v1','mp_guard_new_stripe_checkout_v1') AND NOT tgisinternal AND tgenabled IN ('O','A')) AND to_regprocedure('public.mp_asaas_apply_payment_v1(uuid,text,text,text,timestamptz,timestamptz,text,boolean)') IS NOT NULL AND to_regprocedure('public.mp_asaas_commission_v2(uuid,uuid,uuid,text,text,numeric,numeric,timestamptz,text)') IS NOT NULL AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='mp_asaas_guard_commission_payout_v2' AND tgrelid='public.comissoes_parceiros'::regclass AND tgenabled IN ('O','A'));
$$;
REVOKE ALL ON FUNCTION public.mp_asaas_recurring_ready_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_recurring_ready_v1() TO service_role;
-- Somente o servidor, após GET do pagamento e da autorização/assinatura, pode chamar.
-- Não soma meses sobre o acesso anterior: usa a competência da cobrança e deduplica pelo ID financeiro.
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
  IF p.plano_tipo IS DISTINCT FROM a.plan_code AND NOT (p.plano_tipo='free' AND p.plano_anterior_downgrade=a.plan_code AND p.motivo_downgrade='inadimplencia' AND p.status_acesso IN ('ativo','em_atraso')) THEN RAISE EXCEPTION 'PLAN_CHANGED'; END IF;
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
-- Atualiza recorrência sem prolongar ou retirar vigência paga. Binding da assinatura gerada depois do Pix inicial.
CREATE OR REPLACE FUNCTION public.mp_asaas_sync_renewal_v1(p_attempt uuid,p_customer text,p_subscription text,p_auth_status text,p_renewal boolean) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR a.customer_id IS DISTINCT FROM p_customer OR a.status='closed' OR (a.subscription_id IS NOT NULL AND p_subscription IS DISTINCT FROM a.subscription_id) OR (p_renewal AND p_subscription IS NULL) THEN RAISE EXCEPTION 'RENEWAL_MISMATCH'; END IF;
 IF a.initial_payment_id IS NOT NULL THEN
  PERFORM 1 FROM public.perfis WHERE user_id=a.user_id AND gateway='asaas' AND gateway_customer_id=a.customer_id AND gateway_subscription_id IS NOT DISTINCT FROM a.subscription_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_CHANGED'; END IF;
  UPDATE public.perfis SET gateway_subscription_id=p_subscription WHERE user_id=a.user_id;
  UPDATE public.billing_subscriptions SET provider_subscription_id=p_subscription,status=CASE WHEN p_renewal THEN CASE WHEN status='past_due' THEN 'past_due' ELSE 'active' END ELSE 'canceled' END,canceled_at=CASE WHEN p_renewal THEN NULL ELSE coalesce(canceled_at,now()) END,updated_at=now() WHERE id=a.attempt_id;
 END IF;
 UPDATE public.billing_asaas_recurring_attempts SET authorization_status=p_auth_status,subscription_id=p_subscription,renewal_active=p_renewal,updated_at=now() WHERE attempt_id=p_attempt;
END; $$;
REVOKE ALL ON FUNCTION public.mp_asaas_sync_renewal_v1(uuid,text,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_sync_renewal_v1(uuid,text,text,text,boolean) TO service_role;
-- Liberar somente depois de evento terminal autenticado e consulta sem cobrança/assinatura.
CREATE OR REPLACE FUNCTION public.mp_asaas_close_unpaid_v1(p_attempt uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.billing_asaas_recurring_attempts SET status='closed',renewal_active=false,qr_payload=null,qr_image=null,updated_at=now()
 WHERE attempt_id=p_attempt AND initial_payment_id IS NULL AND subscription_id IS NULL AND status IN ('created','review');
 IF NOT FOUND THEN RAISE EXCEPTION 'CANNOT_CLOSE'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.mp_asaas_close_unpaid_v1(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_close_unpaid_v1(uuid) TO service_role;
-- Só registra efeitos adversos confirmados pelo GET do pagamento. Não cancela contratos nem estorna o provedor.
CREATE OR REPLACE FUNCTION public.mp_asaas_apply_adverse_v1(p_attempt uuid,p_payment text,p_status text,p_due timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE; bp public.billing_payments%ROWTYPE;
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
 END IF;
 IF p_status='overdue' AND NOT EXISTS(SELECT 1 FROM public.billing_payments WHERE subscription_id=a.attempt_id AND status IN ('confirmed','settled') AND due_at>p_due) THEN
  UPDATE public.perfis SET status_acesso='em_atraso' WHERE user_id=a.user_id AND gateway='asaas' AND gateway_customer_id=a.customer_id AND plano_tipo=a.plan_code AND status_acesso='ativo';
  UPDATE public.billing_subscriptions SET status='past_due',updated_at=now() WHERE id=a.attempt_id AND status='active';
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.mp_asaas_apply_adverse_v1(uuid,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_apply_adverse_v1(uuid,text,text,timestamptz) TO service_role;

-- Pendencias de ajuste para os contratos novos. Nao altera historico de repasse efetivamente pago.
CREATE TABLE IF NOT EXISTS public.billing_asaas_commission_reviews (
 payment_id text PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES public.billing_asaas_recurring_attempts(attempt_id),
 reason text NOT NULL CHECK(reason IN ('refunded','chargeback','partial_refund','refund_pending')),
 status text NOT NULL DEFAULT 'review' CHECK(status IN ('review','resolved')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_asaas_commission_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_asaas_commission_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.billing_asaas_commission_reviews TO service_role;
-- A chamada de comissao nova e serializada com o estado do pagamento. Reutiliza a regra real de 12 meses.
CREATE OR REPLACE FUNCTION public.mp_asaas_commission_v2(p_indicacao_id uuid,p_parceiro_id uuid,p_user_id uuid,p_asaas_payment_id text,p_plano_tipo text,p_valor_pago numeric,p_percentual numeric,p_data_pagamento_cliente timestamptz,p_ciclo_cobranca text DEFAULT NULL)
RETURNS public.comissoes_parceiros LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE bp public.billing_payments%ROWTYPE; a public.billing_asaas_recurring_attempts%ROWTYPE;
BEGIN
 SELECT * INTO bp FROM public.billing_payments WHERE provider='asaas' AND provider_payment_id=p_asaas_payment_id FOR UPDATE;
 IF NOT FOUND OR bp.status NOT IN ('confirmed','settled') THEN RAISE EXCEPTION 'COMMISSION_PAYMENT_NOT_ELIGIBLE'; END IF;
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=bp.subscription_id;
 IF NOT FOUND OR a.user_id IS DISTINCT FROM p_user_id OR a.plan_code IS DISTINCT FROM p_plano_tipo OR a.billing_cycle IS DISTINCT FROM p_ciclo_cobranca OR bp.amount_minor IS DISTINCT FROM round(p_valor_pago*100)::bigint THEN RAISE EXCEPTION 'COMMISSION_BINDING_MISMATCH'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_asaas_commission_reviews WHERE payment_id=p_asaas_payment_id AND status='review') THEN RAISE EXCEPTION 'COMMISSION_REQUIRES_REVIEW'; END IF;
 RETURN public.registrar_comissao_pagamento(p_indicacao_id,p_parceiro_id,p_user_id,p_asaas_payment_id,p_plano_tipo,p_valor_pago,p_percentual,p_data_pagamento_cliente,p_ciclo_cobranca);
END $$;
REVOKE ALL ON FUNCTION public.mp_asaas_commission_v2(uuid,uuid,uuid,text,text,numeric,numeric,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_commission_v2(uuid,uuid,uuid,text,text,numeric,numeric,timestamptz,text) TO service_role;
-- Bloqueia repasse novo somente para a comissao especifica em disputa. Nenhum repasse antigo e alterado.
CREATE OR REPLACE FUNCTION public.mp_asaas_guard_commission_payout_v2() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.status='paga' AND OLD.status IS DISTINCT FROM 'paga' AND EXISTS(SELECT 1 FROM public.billing_asaas_commission_reviews WHERE payment_id=NEW.asaas_payment_id AND status='review') THEN RAISE EXCEPTION 'Comissao Asaas em conciliacao; repasse nao autorizado'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.mp_asaas_guard_commission_payout_v2() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS mp_asaas_guard_commission_payout_v2 ON public.comissoes_parceiros;
CREATE TRIGGER mp_asaas_guard_commission_payout_v2 BEFORE UPDATE ON public.comissoes_parceiros FOR EACH ROW EXECUTE FUNCTION public.mp_asaas_guard_commission_payout_v2();
-- Recebe apenas o estado atual verificado no Asaas, nunca uma mensagem do browser.
CREATE OR REPLACE FUNCTION public.mp_asaas_commission_adverse_v2(p_attempt uuid,p_payment text,p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE a public.billing_asaas_recurring_attempts%ROWTYPE; bp public.billing_payments%ROWTYPE;
BEGIN
 SELECT * INTO a FROM public.billing_asaas_recurring_attempts WHERE attempt_id=p_attempt FOR UPDATE;
 IF NOT FOUND OR p_reason NOT IN ('refunded','chargeback','partial_refund','refund_pending') THEN RAISE EXCEPTION 'INVALID_ADJUSTMENT'; END IF;
 SELECT * INTO bp FROM public.billing_payments WHERE provider='asaas' AND provider_payment_id=p_payment FOR UPDATE;
 IF NOT FOUND OR bp.subscription_id IS DISTINCT FROM p_attempt THEN RAISE EXCEPTION 'ADJUSTMENT_PAYMENT_NOT_BOUND'; END IF;
 INSERT INTO public.billing_asaas_commission_reviews(payment_id,attempt_id,reason) VALUES(p_payment,p_attempt,p_reason)
 ON CONFLICT(payment_id) DO UPDATE SET reason=excluded.reason,status='review',updated_at=now();
 IF p_reason='refunded' THEN
  UPDATE public.comissoes_parceiros SET status='estornada' WHERE asaas_payment_id=p_payment AND user_id=a.user_id AND status='pendente' AND repasse_id IS NULL;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.mp_asaas_commission_adverse_v2(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp_asaas_commission_adverse_v2(uuid,text,text) TO service_role;

COMMIT;
