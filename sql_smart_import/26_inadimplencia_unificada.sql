BEGIN;
-- Validar a base exata exportada em 27/11/2026; aborta integralmente se divergente.
DO $guard$ BEGIN
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.aplicar_downgrade_inadimplencia(uuid,text,text,text,date)')), E'\n\r ')) NOT IN ('08b158d16aea5a82a69ae1293aaa47a1','34c93d45446871fee1b699662d735a85') OR to_regprocedure('public.aplicar_downgrade_inadimplencia(uuid,text,text,text,date)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: aplicar_downgrade_inadimplencia'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.restaurar_plano_apos_pagamento(uuid,text,text,text,numeric,timestamp with time zone,boolean)')), E'\n\r ')) NOT IN ('a79eeba5eae7bd80c17bc154f7f4ca18','6942573a5050d56a4dfda1be63fe8503') OR to_regprocedure('public.restaurar_plano_apos_pagamento(uuid,text,text,text,numeric,timestamp with time zone,boolean)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: restaurar_plano_apos_pagamento'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.restaurar_plano_por_conciliacao(uuid,text,text,text,timestamp with time zone,numeric,timestamp with time zone)')), E'\n\r ')) NOT IN ('452a3a4283b83bc5bd464d22fd8ccd3b','273388e14d3bab4f89e4b765a8815b8d') OR to_regprocedure('public.restaurar_plano_por_conciliacao(uuid,text,text,text,timestamp with time zone,numeric,timestamp with time zone)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: restaurar_plano_por_conciliacao'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.mp_asaas_apply_payment_v1(uuid,text,text,text,timestamp with time zone,timestamp with time zone,text,boolean)')), E'\n\r ')) NOT IN ('698c5fac822ee3d889820d6d771b4e17','55245d3059c2ceb117c6a7e470717012') OR to_regprocedure('public.mp_asaas_apply_payment_v1(uuid,text,text,text,timestamp with time zone,timestamp with time zone,text,boolean)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: mp_asaas_apply_payment_v1'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.mp_asaas_apply_adverse_v1(uuid,text,text,timestamp with time zone)')), E'\n\r ')) NOT IN ('1554d9c0f503b3b2006db065c5340953','d9354045a11396568630cdd53ebd1673') OR to_regprocedure('public.mp_asaas_apply_adverse_v1(uuid,text,text,timestamp with time zone)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: mp_asaas_apply_adverse_v1'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.mp_stripe_sincronizar_estado_v1(text,text,text,text,timestamp with time zone)')), E'\n\r ')) NOT IN ('895a8e917f798fabf0ac41bbb554bc5b','d973c1a76e69a7e791bd1c1d61e762ab') OR to_regprocedure('public.mp_stripe_sincronizar_estado_v1(text,text,text,text,timestamp with time zone)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: mp_stripe_sincronizar_estado_v1'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.mp_stripe_renovar_fatura_v2(text,text,text,text,text,text,bigint,timestamp with time zone,timestamp with time zone,bigint)')), E'\n\r ')) NOT IN ('94f32f53ec8f7767340e37eca6fc15c9','3fb6934c16a9134bd191ad2ce7f3e227') OR to_regprocedure('public.mp_stripe_renovar_fatura_v2(text,text,text,text,text,text,bigint,timestamp with time zone,timestamp with time zone,bigint)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: mp_stripe_renovar_fatura_v2'; END IF;
 IF md5(btrim(pg_get_functiondef(to_regprocedure('public.mp_stripe_confirmar_fatura_v1(uuid,uuid,text,text,text,text,text,text,bigint,timestamp with time zone,timestamp with time zone)')), E'\n\r ')) NOT IN ('2cb3079ad2eeb8053b39275b15ceed46','0d4db165b84059c07626764d7675bbb9') OR to_regprocedure('public.mp_stripe_confirmar_fatura_v1(uuid,uuid,text,text,text,text,text,text,bigint,timestamp with time zone,timestamp with time zone)') IS NULL THEN RAISE EXCEPTION 'MP26_BASE_DIVERGENTE: mp_stripe_confirmar_fatura_v1'; END IF;
END; $guard$;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS inadimplencia_vencimento date;
CREATE TABLE IF NOT EXISTS public.billing_stripe_recoveries_mp26 (
 subscription_id uuid NOT NULL REFERENCES public.billing_subscriptions(id), user_id uuid NOT NULL,
 invoice_id text PRIMARY KEY, origin_invoice text NOT NULL, former_plan text NOT NULL, downgrade_at timestamptz NOT NULL,
 recovered_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_stripe_recoveries_mp26 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_stripe_recoveries_mp26 FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.billing_stripe_recoveries_mp26 TO service_role;
ALTER TABLE public.billing_subscriptions ADD COLUMN IF NOT EXISTS mp26_checked_at timestamptz;

CREATE OR REPLACE FUNCTION public.aplicar_downgrade_inadimplencia(p_user_id uuid, p_plano_esperado text, p_subscription_id text, p_payment_id text, p_vencimento date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_atualizados integer;
BEGIN
  IF current_user <> 'service_role' THEN RETURN false; END IF;
  IF p_user_id IS NULL
     OR p_plano_esperado IS NULL
     OR p_subscription_id IS NULL
     OR BTRIM(p_subscription_id) = ''
     OR p_payment_id IS NULL
     OR BTRIM(p_payment_id) = ''
     OR p_vencimento IS NULL
  THEN
    RETURN false;
  END IF;

  IF p_plano_esperado NOT IN (
    'minipage',
    'agenda',
    'loja',
    'essencial',
    'equipe'
  ) THEN
    RETURN false;
  END IF;

  -- Oitavo dia de atraso (sete dias completos).
  IF (
    NOW() AT TIME ZONE 'America/Sao_Paulo'
  )::date < p_vencimento + 8 THEN
    RETURN false;
  END IF;

  UPDATE public.perfis
  SET
    plano_anterior_downgrade = plano_tipo,
    plano_tipo = 'free',
    plano = 'free',
    inadimplencia_vencimento = p_vencimento,
    status_acesso = 'ativo',
    downgrade_em = NOW(),
    motivo_downgrade = 'inadimplencia',
    pagamento_origem_downgrade = p_payment_id
  WHERE user_id = p_user_id
    AND modalidade_acesso = 'comercial'
    AND gateway = 'asaas'
    AND gateway_subscription_id = p_subscription_id
    AND plano_tipo = p_plano_esperado
    AND status_acesso IN (
      'em_atraso',
      'aguardando_pagamento'
    )
    AND valor_contratado > 0
    AND (plano_ativo_ate IS NULL OR plano_ativo_ate <= now())
    AND plano_anterior_downgrade IS NULL
    AND downgrade_em IS NULL
    AND motivo_downgrade IS NULL
    AND pagamento_origem_downgrade IS NULL;

  GET DIAGNOSTICS v_atualizados = ROW_COUNT;

  RETURN v_atualizados = 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restaurar_plano_apos_pagamento(p_user_id uuid, p_subscription_id text, p_payment_id text, p_event_id text, p_valor_pagamento numeric, p_novo_plano_ativo_ate timestamp with time zone, p_regularizacao_completa boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_perfil public.perfis%ROWTYPE;
  v_evento public.asaas_eventos%ROWTYPE;
  v_atualizados integer;
BEGIN
  -- Somente o servidor administrativo pode executar.
  IF current_user <> 'service_role' THEN
    RETURN false;
  END IF;

  -- O servidor deve verificar a regularizacao no Asaas.
  -- Este parametro, sozinho, nao comprova pagamento.
  IF p_regularizacao_completa IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  IF p_user_id IS NULL
     OR NULLIF(BTRIM(p_subscription_id), '') IS NULL
     OR NULLIF(BTRIM(p_payment_id), '') IS NULL
     OR NULLIF(BTRIM(p_event_id), '') IS NULL
     OR p_valor_pagamento IS NULL
     OR p_valor_pagamento <= 0
     OR p_novo_plano_ativo_ate IS NULL
     OR p_novo_plano_ativo_ate <= NOW()
  THEN
    RETURN false;
  END IF;

  -- Bloqueia o perfil durante a transacao.
  SELECT *
  INTO v_perfil
  FROM public.perfis
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verifica o estado do downgrade.
  IF v_perfil.modalidade_acesso IS DISTINCT FROM 'comercial'
     OR v_perfil.gateway IS DISTINCT FROM 'asaas'
     OR v_perfil.plano_tipo IS DISTINCT FROM 'free'
     OR v_perfil.status_acesso IS DISTINCT FROM 'ativo'
     OR v_perfil.motivo_downgrade IS DISTINCT FROM 'inadimplencia'
     OR v_perfil.gateway_subscription_id IS DISTINCT FROM p_subscription_id
     OR v_perfil.plano_anterior_downgrade IS NULL
     OR v_perfil.plano_anterior_downgrade NOT IN (
       'minipage', 'agenda', 'loja', 'essencial', 'equipe'
     )
     OR v_perfil.downgrade_em IS NULL
     OR NULLIF(BTRIM(v_perfil.pagamento_origem_downgrade), '') IS NULL
     OR v_perfil.valor_contratado IS NULL
     OR v_perfil.valor_contratado <= 0
     OR NULLIF(BTRIM(v_perfil.gateway_customer_id), '') IS NULL
  THEN
    RETURN false;
  END IF;

  -- Preserva o valor contratado, nao o preco de tabela.
  IF ROUND(p_valor_pagamento, 2)
     <> ROUND(v_perfil.valor_contratado, 2)
  THEN
    RETURN false;
  END IF;

  -- Localiza e bloqueia o evento ja reivindicado.
  -- O user_id pode estar vazio nesta fase do webhook.
  SELECT *
  INTO v_evento
  FROM public.asaas_eventos
  WHERE event_id = p_event_id
    AND payment_id = p_payment_id
    AND subscription_id = p_subscription_id
    AND customer_id = v_perfil.gateway_customer_id
    AND (user_id IS NULL OR user_id = p_user_id)
    AND tipo IN (
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_RECEIVED_IN_CASH'
    )
    AND status = 'processando'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Confere tambem o valor registrado no evento.
  IF v_evento.valor IS NULL
     OR ROUND(v_evento.valor, 2)
        <> ROUND(p_valor_pagamento, 2)
  THEN
    RETURN false;
  END IF;

  -- Impede reutilizacao do pagamento.
  IF EXISTS (
    SELECT 1
    FROM public.historico_recuperacoes_inadimplencia
    WHERE pagamento_regularizacao = p_payment_id
  ) THEN
    RETURN false;
  END IF;

  -- Vincula o evento ao usuario identificado.
  UPDATE public.asaas_eventos
  SET
    user_id = p_user_id,
    atualizado_em = NOW()
  WHERE id = v_evento.id
    AND status = 'processando'
    AND (user_id IS NULL OR user_id = p_user_id);

  GET DIAGNOSTICS v_atualizados = ROW_COUNT;

  IF v_atualizados <> 1 THEN
    RETURN false;
  END IF;

  -- Registra a recuperacao antes de limpar o
  -- estado temporario de downgrade.
  INSERT INTO public.historico_recuperacoes_inadimplencia (
    user_id,
    plano_restaurado,
    pagamento_origem_downgrade,
    pagamento_regularizacao,
    gateway_subscription_id,
    valor_contratado,
    downgrade_em
  )
  VALUES (
    p_user_id,
    v_perfil.plano_anterior_downgrade,
    v_perfil.pagamento_origem_downgrade,
    p_payment_id,
    p_subscription_id,
    v_perfil.valor_contratado,
    v_perfil.downgrade_em
  );

  -- Restaura o plano em uma operacao atomica.
  UPDATE public.perfis
  SET
    plano_tipo = v_perfil.plano_anterior_downgrade,
    plano = v_perfil.plano_anterior_downgrade,
    inadimplencia_vencimento = NULL,
    status_acesso = 'ativo',
    plano_ativo_ate = GREATEST(
      COALESCE(plano_ativo_ate, p_novo_plano_ativo_ate),
      p_novo_plano_ativo_ate
    ),
    plano_anterior_downgrade = NULL,
    downgrade_em = NULL,
    motivo_downgrade = NULL,
    pagamento_origem_downgrade = NULL
  WHERE user_id = p_user_id
    AND plano_tipo = 'free'
    AND motivo_downgrade = 'inadimplencia';

  GET DIAGNOSTICS v_atualizados = ROW_COUNT;

  IF v_atualizados <> 1 THEN
    RAISE EXCEPTION
      'Falha ao restaurar perfil; transacao revertida';
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restaurar_plano_por_conciliacao(p_user_id uuid, p_subscription_id text, p_payment_id text, p_pagamento_origem text, p_downgrade_em timestamp with time zone, p_valor_pagamento numeric, p_novo_plano_ativo_ate timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_perfil public.perfis%ROWTYPE;
  v_count integer;
BEGIN
  IF current_user <> 'service_role' THEN RETURN false; END IF;
  IF p_user_id IS NULL
     OR NULLIF(BTRIM(p_subscription_id), '') IS NULL
     OR NULLIF(BTRIM(p_payment_id), '') IS NULL
     OR NULLIF(BTRIM(p_pagamento_origem), '') IS NULL
     OR p_downgrade_em IS NULL
     OR p_valor_pagamento IS NULL OR p_valor_pagamento <= 0
     OR p_novo_plano_ativo_ate IS NULL OR p_novo_plano_ativo_ate <= NOW()
  THEN RETURN false; END IF;

  SELECT * INTO v_perfil FROM public.perfis
  WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  IF v_perfil.modalidade_acesso IS DISTINCT FROM 'comercial'
     OR v_perfil.gateway IS DISTINCT FROM 'asaas'
     OR v_perfil.plano_tipo IS DISTINCT FROM 'free'
     OR v_perfil.status_acesso IS DISTINCT FROM 'ativo'
     OR v_perfil.motivo_downgrade IS DISTINCT FROM 'inadimplencia'
     OR v_perfil.plano_anterior_downgrade IS NULL
     OR v_perfil.plano_anterior_downgrade NOT IN ('minipage','agenda','loja','essencial','equipe')
     OR v_perfil.gateway_subscription_id IS DISTINCT FROM p_subscription_id
     OR NULLIF(BTRIM(v_perfil.gateway_customer_id), '') IS NULL
     OR v_perfil.billing_cycle IS DISTINCT FROM 'mensal'
     OR v_perfil.pagamento_origem_downgrade IS DISTINCT FROM p_pagamento_origem
     OR v_perfil.downgrade_em IS DISTINCT FROM p_downgrade_em
     OR v_perfil.valor_contratado IS NULL OR v_perfil.valor_contratado <= 0
     OR ROUND(v_perfil.valor_contratado,2) <> ROUND(p_valor_pagamento,2)
  THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM public.historico_recuperacoes_inadimplencia
    WHERE pagamento_regularizacao = p_payment_id
      OR (user_id = p_user_id
          AND pagamento_origem_downgrade = p_pagamento_origem
          AND downgrade_em = p_downgrade_em)
  ) THEN RETURN false; END IF;

  INSERT INTO public.historico_recuperacoes_inadimplencia (
    user_id, plano_restaurado, pagamento_origem_downgrade,
    pagamento_regularizacao, gateway_subscription_id, valor_contratado, downgrade_em
  ) VALUES (
    p_user_id, v_perfil.plano_anterior_downgrade, p_pagamento_origem,
    p_payment_id, p_subscription_id, v_perfil.valor_contratado, p_downgrade_em
  );

  UPDATE public.perfis SET
    plano_tipo = v_perfil.plano_anterior_downgrade,
    plano = v_perfil.plano_anterior_downgrade,
    inadimplencia_vencimento = NULL,
    status_acesso = 'ativo',
    plano_ativo_ate = GREATEST(
      COALESCE(plano_ativo_ate, p_novo_plano_ativo_ate), p_novo_plano_ativo_ate
    ),
    primeiro_pagamento_confirmado = true,
    data_primeiro_pagamento = COALESCE(data_primeiro_pagamento, NOW()),
    plano_anterior_downgrade = NULL,
    downgrade_em = NULL,
    motivo_downgrade = NULL,
    pagamento_origem_downgrade = NULL
  WHERE user_id = p_user_id
    AND plano_tipo = 'free'
    AND motivo_downgrade = 'inadimplencia';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Restauracao nao confirmou um unico perfil; transacao revertida';
  END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mp_asaas_apply_payment_v1(p_attempt uuid, p_payment text, p_customer text, p_subscription text, p_paid timestamp with time zone, p_due timestamp with time zone, p_status text, p_renewal boolean)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
 UPDATE public.perfis SET inadimplencia_vencimento=NULL,plano_anterior_downgrade=NULL,downgrade_em=NULL,motivo_downgrade=NULL,pagamento_origem_downgrade=NULL,plano_tipo=a.plan_code,plano=a.plan_code,gateway='asaas',gateway_customer_id=a.customer_id,gateway_subscription_id=p_subscription,billing_cycle=a.billing_cycle,modalidade_acesso='comercial',valor_contratado=a.amount_minor/100.0,valor_contratado_em=coalesce(valor_contratado_em,now()),primeiro_pagamento_confirmado=true,data_primeiro_pagamento=coalesce(data_primeiro_pagamento,p_paid),plano_ativo_ate=greatest(plano_ativo_ate,end_at),status_acesso='ativo' WHERE user_id=a.user_id;
 UPDATE public.billing_asaas_recurring_attempts SET status='paid',initial_payment_id=coalesce(initial_payment_id,p_payment),subscription_id=p_subscription,renewal_active=p_renewal,qr_payload=null,qr_image=null,updated_at=now() WHERE attempt_id=a.attempt_id;
 RETURN 'applied';
END; $function$;

CREATE OR REPLACE FUNCTION public.mp_asaas_apply_adverse_v1(p_attempt uuid, p_payment text, p_status text, p_due timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
  UPDATE public.perfis SET status_acesso='em_atraso',inadimplencia_vencimento=(p_due AT TIME ZONE 'America/Sao_Paulo')::date WHERE user_id=a.user_id AND gateway='asaas' AND gateway_customer_id=a.customer_id AND gateway_subscription_id IS NOT DISTINCT FROM a.subscription_id AND plano_tipo=a.plan_code AND status_acesso IN ('ativo','em_atraso') AND p_due IS NOT NULL;
  UPDATE public.billing_subscriptions SET status='past_due',updated_at=now() WHERE id=a.attempt_id AND status='active';
 END IF;
END; $function$;

CREATE OR REPLACE FUNCTION public.mp_stripe_sincronizar_estado_v1(p_event_id text, p_subscription_id text, p_customer_id text, p_live_status text, p_period_end timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_s public.billing_subscriptions%ROWTYPE;
 v_p public.perfis%ROWTYPE;
 v_event_type text;
 v_new_status text;
 v_outcome text := 'updated';
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE='42501'; END IF;
 IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9]+$'
 OR p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9]+$'
 OR p_customer_id IS NULL OR p_customer_id !~ '^cus_[A-Za-z0-9]+$'
 OR p_live_status NOT IN ('active','trialing','past_due','unpaid','paused','canceled','incomplete','incomplete_expired')
 OR p_period_end IS NULL OR p_period_end > now() + interval '2 years'
 THEN RAISE EXCEPTION 'INVALID_LIFECYCLE_PROOF'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_subscription_id,20261122));
 IF EXISTS(SELECT 1 FROM public.billing_stripe_lifecycle_events WHERE event_id=p_event_id) THEN RETURN 'already_applied'; END IF;
 SELECT i.event_type INTO v_event_type FROM public.billing_stripe_inbox i
 WHERE i.event_id=p_event_id AND i.livemode=true AND i.signature_verified=true
 FOR UPDATE;
 IF v_event_type IS NULL OR v_event_type NOT IN
 ('customer.subscription.updated','customer.subscription.deleted','invoice.payment_failed')
 THEN RAISE EXCEPTION 'EVENT_NOT_VERIFIED'; END IF;
 SELECT * INTO v_s FROM public.billing_subscriptions
 WHERE provider='stripe' AND provider_subscription_id=p_subscription_id FOR UPDATE;
 IF NOT FOUND THEN
   INSERT INTO public.billing_stripe_lifecycle_events(event_id,provider_subscription_id,observed_status,outcome)
   VALUES(p_event_id,p_subscription_id,p_live_status,'review');
   RETURN 'review_unknown_subscription';
 END IF;
 IF v_s.provider_customer_id IS DISTINCT FROM p_customer_id THEN RAISE EXCEPTION 'CUSTOMER_MISMATCH'; END IF;
 SELECT * INTO v_p FROM public.perfis WHERE user_id=v_s.user_id FOR UPDATE;
 IF NOT FOUND OR v_p.gateway IS DISTINCT FROM 'stripe'
 OR v_p.gateway_subscription_id IS DISTINCT FROM p_subscription_id
 OR v_p.gateway_customer_id IS DISTINCT FROM p_customer_id
 THEN RAISE EXCEPTION 'PROFILE_NOT_STRIPE_OWNED'; END IF;
 -- NAO reduzir periodo ja pago por um evento fora de ordem ou por um status de atraso.
 IF v_p.plano_ativo_ate IS NOT NULL AND p_period_end < v_p.plano_ativo_ate
 THEN RAISE EXCEPTION 'PERIOD_REGRESSION_REQUIRES_REVIEW'; END IF;
 v_new_status := CASE
  WHEN p_live_status IN ('active','trialing','past_due','paused','canceled') THEN p_live_status
  WHEN p_live_status IN ('unpaid','incomplete','incomplete_expired') THEN 'past_due'
  ELSE NULL END;
 IF v_new_status IS NULL THEN RAISE EXCEPTION 'UNHANDLED_STATUS'; END IF;
 UPDATE public.billing_subscriptions
 SET status=v_new_status,
     -- A vigencia paga somente avanca em invoice.paid.
     canceled_at=CASE WHEN p_live_status='canceled' THEN COALESCE(canceled_at,now()) ELSE canceled_at END,
     updated_at=now()
 WHERE id=v_s.id;
 -- Se ainda ha periodo pago, manter acesso. Falha de pagamento NAO prova expiracao.
 -- Mesmo apos a data, rebaixamento requer politica especifica de recuperacao e estorno.
 INSERT INTO public.billing_stripe_lifecycle_events(event_id,provider_subscription_id,observed_status,outcome)
 VALUES(p_event_id,p_subscription_id,p_live_status,v_outcome);
 RETURN v_outcome;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mp_stripe_renovar_fatura_v2(p_event_id text, p_invoice_id text, p_subscription_id text, p_customer_id text, p_price_id text, p_currency text, p_amount_minor bigint, p_period_start timestamp with time zone, p_period_end timestamp with time zone, p_paid_minor bigint)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_s public.billing_subscriptions%ROWTYPE;
 v_p public.perfis%ROWTYPE;
 v_a public.billing_stripe_checkout_attempts%ROWTYPE;
 v_invoice public.billing_payments%ROWTYPE;
 v_rows integer;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE='42501'; END IF;
 IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9]+$'
 OR p_invoice_id IS NULL OR p_invoice_id !~ '^in_[A-Za-z0-9]+$'
 OR p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9]+$'
 OR p_customer_id IS NULL OR p_customer_id !~ '^cus_[A-Za-z0-9]+$'
 OR p_price_id IS NULL OR p_price_id !~ '^price_[A-Za-z0-9]+$'
 OR p_currency NOT IN ('BRL','USD','EUR') OR p_amount_minor <= 0
 OR p_paid_minor IS NULL OR p_paid_minor <= 0
 OR p_period_start IS NULL OR p_period_end IS NULL OR p_period_end <= p_period_start
 OR p_period_end <= now() OR p_period_end > now()+interval '2 years'
 THEN RAISE EXCEPTION 'INVALID_RENEWAL_PROOF'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_subscription_id,20261122));
 -- O evento so pode ser processado se passou na verificacao criptografica no webhook.
 IF NOT EXISTS (SELECT 1 FROM public.billing_stripe_inbox i
 WHERE i.event_id=p_event_id AND i.event_type='invoice.paid' AND i.livemode=true
 AND i.signature_verified=true) THEN RAISE EXCEPTION 'EVENT_NOT_VERIFIED'; END IF;
 SELECT * INTO v_s FROM public.billing_subscriptions
 WHERE provider='stripe' AND provider_subscription_id=p_subscription_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'NOT_EXISTING_STRIPE_SUBSCRIPTION'; END IF;
 IF v_s.provider_customer_id IS DISTINCT FROM p_customer_id
 OR v_s.status NOT IN ('active','past_due','trialing')
 THEN RAISE EXCEPTION 'SUBSCRIPTION_MISMATCH'; END IF;
 SELECT * INTO v_p FROM public.perfis WHERE user_id=v_s.user_id FOR UPDATE;
 IF NOT FOUND OR v_p.gateway IS DISTINCT FROM 'stripe'
 OR v_p.gateway_subscription_id IS DISTINCT FROM p_subscription_id
 OR v_p.gateway_customer_id IS DISTINCT FROM p_customer_id
 OR v_p.modalidade_acesso IS DISTINCT FROM 'comercial'
 OR v_p.mp_subscription_id IS DISTINCT FROM v_s.id::text
 THEN RAISE EXCEPTION 'PROFILE_NOT_STRIPE_OWNED'; END IF;
 IF EXISTS (SELECT 1 FROM public.billing_subscriptions bs WHERE bs.user_id=v_s.user_id
 AND bs.provider<>'stripe' AND bs.status IN ('active','trialing','past_due','pending'))
 THEN RAISE EXCEPTION 'OTHER_GATEWAY_PRESERVED'; END IF;
 SELECT * INTO v_a FROM public.billing_stripe_checkout_attempts
 WHERE user_id=v_s.user_id AND status='created' AND stripe_session_id LIKE 'cs_live_%'
 AND stripe_price_id=p_price_id AND plan_code=v_s.plan_code
 AND billing_cycle=v_s.billing_cycle AND currency=p_currency
 AND amount_minor=p_amount_minor ORDER BY created_at ASC LIMIT 1;
 IF NOT FOUND OR v_s.currency IS DISTINCT FROM p_currency
 OR v_s.contracted_amount_minor IS DISTINCT FROM p_amount_minor
 THEN RAISE EXCEPTION 'ORIGINAL_CONTRACT_MISMATCH'; END IF;
 IF EXISTS (SELECT 1 FROM public.billing_payments WHERE provider='stripe'
 AND provider_payment_id=p_invoice_id) THEN
   IF EXISTS (SELECT 1 FROM public.billing_payments b WHERE b.provider='stripe'
   AND b.provider_payment_id=p_invoice_id AND b.subscription_id=v_s.id
   AND b.amount_minor=p_paid_minor AND b.currency=p_currency AND b.status IN ('confirmed','settled'))
   THEN RETURN 'already_applied'; END IF;
   RAISE EXCEPTION 'INVOICE_REPLAY_CONFLICT';
 END IF;
 -- Nao diminuir vigencia, nem permitir renovacao que retroceda a ultima vigencia consolidada.
 IF v_p.plano_ativo_ate IS NULL OR p_period_end <= v_p.plano_ativo_ate OR p_period_start < v_p.plano_ativo_ate
 THEN RAISE EXCEPTION 'PERIOD_NOT_ADVANCING'; END IF;
 IF p_period_start < v_s.current_period_start - interval '31 days'
 THEN RAISE EXCEPTION 'STALE_INVOICE_PERIOD'; END IF;
 IF v_p.status_acesso NOT IN ('ativo','em_atraso') OR v_p.primeiro_pagamento_confirmado IS DISTINCT FROM true OR (v_p.plano_tipo IS DISTINCT FROM v_s.plan_code AND NOT (v_p.plano_tipo='free' AND v_p.motivo_downgrade='inadimplencia' AND v_p.plano_anterior_downgrade=v_s.plan_code AND v_p.downgrade_em IS NOT NULL AND nullif(v_p.pagamento_origem_downgrade,'') IS NOT NULL)) THEN RAISE EXCEPTION 'ACCESS_REQUIRES_REVIEW'; END IF;
 IF v_p.plano_tipo='free' THEN
  -- Isolated audit: never feed Stripe invoices to the Asaas recovery commission queue.
  INSERT INTO public.billing_stripe_recoveries_mp26(subscription_id,user_id,invoice_id,origin_invoice,former_plan,downgrade_at) VALUES(v_s.id,v_s.user_id,p_invoice_id,v_p.pagamento_origem_downgrade,v_s.plan_code,v_p.downgrade_em);
 END IF;
 INSERT INTO public.billing_payments(subscription_id,provider,provider_payment_id,amount_minor,currency,status,paid_at)
 VALUES(v_s.id,'stripe',p_invoice_id,p_paid_minor,p_currency,'confirmed',now());
 UPDATE public.billing_subscriptions SET status='active',current_period_start=p_period_start,
 current_period_end=p_period_end,updated_at=now() WHERE id=v_s.id;
 UPDATE public.perfis SET plano_tipo=v_s.plan_code,plano=v_s.plan_code,status_acesso='ativo',
 inadimplencia_vencimento=NULL,plano_anterior_downgrade=NULL,downgrade_em=NULL,motivo_downgrade=NULL,pagamento_origem_downgrade=NULL,
 plano_ativo_ate=GREATEST(COALESCE(plano_ativo_ate,p_period_end),p_period_end),
 billing_cycle=v_s.billing_cycle,primeiro_pagamento_confirmado=true
 WHERE user_id=v_s.user_id AND gateway='stripe' AND gateway_subscription_id=p_subscription_id;
 GET DIAGNOSTICS v_rows = ROW_COUNT;
 IF v_rows<>1 THEN RAISE EXCEPTION 'PROFILE_WRITE_FAILED'; END IF;
 RETURN 'applied';
END;
$function$;

CREATE OR REPLACE FUNCTION public.mp_stripe_confirmar_fatura_v1(p_user_id uuid, p_attempt_id uuid, p_event_id text, p_invoice_id text, p_stripe_subscription_id text, p_stripe_customer_id text, p_price_id text, p_currency text, p_amount_minor bigint, p_period_start timestamp with time zone, p_period_end timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_a public.billing_stripe_checkout_attempts%ROWTYPE;
 v_p public.perfis%ROWTYPE;
 v_s public.billing_subscriptions%ROWTYPE;
 v_subscription_id uuid;
 v_expected text;
 v_value numeric;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE='42501'; END IF;
 IF p_user_id IS NULL OR p_attempt_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9]+$'
 OR p_invoice_id !~ '^in_[A-Za-z0-9]+$' OR p_stripe_subscription_id !~ '^sub_[A-Za-z0-9]+$'
 OR p_stripe_customer_id !~ '^cus_[A-Za-z0-9]+$' OR p_price_id !~ '^price_[A-Za-z0-9]+$'
 OR p_currency NOT IN ('BRL','USD','EUR') OR p_amount_minor <= 0
 OR p_period_start IS NULL OR p_period_end IS NULL OR p_period_end <= now()
 OR p_period_start >= p_period_end OR p_period_end > now()+interval '2 years'
 THEN RAISE EXCEPTION 'INVALID_PAYMENT_PROOF'; END IF;
 -- Uma chave de serializacao por usuario garante isolamento contra callbacks concorrentes.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 20261122));
 SELECT * INTO v_a FROM public.billing_stripe_checkout_attempts WHERE attempt_id=p_attempt_id FOR UPDATE;
 IF NOT FOUND OR v_a.user_id IS DISTINCT FROM p_user_id OR v_a.stripe_price_id IS DISTINCT FROM p_price_id
 OR v_a.currency IS DISTINCT FROM p_currency OR v_a.amount_minor IS DISTINCT FROM p_amount_minor
 OR v_a.status <> 'created' OR v_a.stripe_session_id IS NULL
 THEN RAISE EXCEPTION 'ATTEMPT_MISMATCH'; END IF;
 SELECT * INTO v_p FROM public.perfis WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_NOT_FOUND'; END IF;
 IF v_p.modalidade_acesso IS NOT NULL AND v_p.modalidade_acesso <> 'comercial'
 THEN RAISE EXCEPTION 'NONCOMMERCIAL_PROFILE'; END IF;
 IF v_p.gateway IS NOT NULL AND v_p.gateway <> '' AND v_p.gateway <> 'stripe'
 THEN RAISE EXCEPTION 'OTHER_GATEWAY_PRESERVED'; END IF;
 IF v_p.gateway_customer_id IS NOT NULL AND v_p.gateway_customer_id <> p_stripe_customer_id
 OR v_p.gateway_subscription_id IS NOT NULL AND v_p.gateway_subscription_id <> p_stripe_subscription_id
 THEN RAISE EXCEPTION 'EXISTING_RELATIONSHIP_MISMATCH'; END IF;
 -- Impede que a primeira compra substitua um plano ativo concedido por outro provedor.
 IF v_p.gateway IS DISTINCT FROM 'stripe' AND (v_p.primeiro_pagamento_confirmado = true
 OR (v_p.plano_tipo NOT IN ('free') AND v_p.status_acesso='ativo'))
 THEN RAISE EXCEPTION 'PROFILE_NOT_ELIGIBLE'; END IF;
 IF EXISTS (SELECT 1 FROM public.billing_subscriptions s WHERE s.user_id=p_user_id
 AND s.provider<>'stripe' AND s.status IN ('active','trialing','past_due','pending'))
 THEN RAISE EXCEPTION 'OTHER_SUBSCRIPTION_PRESERVED'; END IF;
 IF EXISTS (SELECT 1 FROM public.billing_subscriptions s WHERE s.provider='stripe'
 AND s.provider_subscription_id=p_stripe_subscription_id AND s.user_id<>p_user_id)
 THEN RAISE EXCEPTION 'SUBSCRIPTION_OWNER_MISMATCH'; END IF;
 IF EXISTS (SELECT 1 FROM public.billing_payments bp WHERE bp.provider='stripe'
 AND bp.provider_payment_id=p_invoice_id)
 THEN
   IF EXISTS (SELECT 1 FROM public.billing_payments bp JOIN public.billing_subscriptions bs ON bs.id=bp.subscription_id
      WHERE bp.provider='stripe' AND bp.provider_payment_id=p_invoice_id AND bs.user_id=p_user_id
      AND bs.provider_subscription_id=p_stripe_subscription_id AND bp.amount_minor=p_amount_minor AND bp.currency=p_currency)
   THEN RETURN 'already_applied'; END IF;
   RAISE EXCEPTION 'INVOICE_REPLAY_CONFLICT';
 END IF;
 -- Reutiliza somente assinatura Stripe com mesmo titular; nunca sobrescreve Asaas.
 SELECT * INTO v_s FROM public.billing_subscriptions WHERE provider='stripe'
 AND provider_subscription_id=p_stripe_subscription_id FOR UPDATE;
 IF FOUND THEN
   IF v_s.user_id<>p_user_id OR v_s.plan_code<>v_a.plan_code OR v_s.billing_cycle<>v_a.billing_cycle
      OR v_s.contracted_amount_minor<>p_amount_minor OR v_s.currency<>p_currency
   THEN RAISE EXCEPTION 'EXISTING_STRIPE_SUBSCRIPTION_MISMATCH'; END IF;
   v_subscription_id:=v_s.id;
   UPDATE public.billing_subscriptions SET status='active',current_period_start=p_period_start,
    current_period_end=p_period_end,updated_at=now(),provider_customer_id=p_stripe_customer_id
    WHERE id=v_subscription_id;
 ELSE
   INSERT INTO public.billing_subscriptions(user_id,provider,plan_code,billing_cycle,contracted_amount_minor,
      currency,status,provider_customer_id,provider_subscription_id,current_period_start,current_period_end)
   VALUES(p_user_id,'stripe',v_a.plan_code,v_a.billing_cycle,p_amount_minor,p_currency,'active',
      p_stripe_customer_id,p_stripe_subscription_id,p_period_start,p_period_end)
   RETURNING id INTO v_subscription_id;
 END IF;
 INSERT INTO public.billing_payments(subscription_id,provider,provider_payment_id,amount_minor,currency,status,paid_at)
 VALUES(v_subscription_id,'stripe',p_invoice_id,p_amount_minor,p_currency,'confirmed',now());
 v_value:=p_amount_minor::numeric/100;
 UPDATE public.perfis SET plano_tipo=v_a.plan_code,plano=v_a.plan_code,status_acesso='ativo',inadimplencia_vencimento=NULL,modalidade_acesso='comercial',
   gateway='stripe',gateway_customer_id=p_stripe_customer_id,gateway_subscription_id=p_stripe_subscription_id,
   mp_subscription_id=v_subscription_id::text,plano_ativo_ate=p_period_end,billing_cycle=v_a.billing_cycle,
   primeiro_pagamento_confirmado=true,data_primeiro_pagamento=COALESCE(data_primeiro_pagamento,now()),
   valor_contratado=v_value,valor_contratado_em=now()
 WHERE user_id=p_user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_WRITE_FAILED'; END IF;
 RETURN 'applied';
END;
$function$;
CREATE OR REPLACE FUNCTION public.mp26_stripe_atraso(p_subscription text,p_customer text,p_invoice text,p_due date,p_paid_until timestamptz,p_period_start timestamptz,p_live_status text,p_execute boolean)
RETURNS text LANGUAGE plpgsql SET search_path TO '' AS $fn$
DECLARE s public.billing_subscriptions%ROWTYPE; p public.perfis%ROWTYPE; d date;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE='42501'; END IF;
 IF p_subscription IS NULL OR p_subscription !~ '^sub_[A-Za-z0-9]+$' OR p_customer IS NULL OR p_customer !~ '^cus_[A-Za-z0-9]+$' OR p_invoice IS NULL OR p_invoice !~ '^in_[A-Za-z0-9]+$' OR p_due IS NULL OR p_paid_until IS NULL OR p_period_start IS NULL OR p_live_status IS NULL OR p_live_status NOT IN ('past_due','unpaid') OR p_execute IS NULL THEN RETURN 'review_proof'; END IF;
 d := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
 IF d <= p_due OR p_paid_until > now() OR p_period_start < p_paid_until OR p_period_start > now() THEN RETURN 'not_due'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_subscription,20261122));
 SELECT * INTO s FROM public.billing_subscriptions WHERE provider='stripe' AND provider_subscription_id=p_subscription FOR UPDATE;
 IF NOT FOUND OR s.provider_customer_id IS DISTINCT FROM p_customer OR s.status NOT IN ('active','past_due','trialing') OR s.plan_code NOT IN ('minipage','agenda','loja','essencial') THEN RETURN 'review_contract'; END IF;
 SELECT * INTO p FROM public.perfis WHERE user_id=s.user_id FOR UPDATE;
 IF NOT FOUND OR p.gateway IS DISTINCT FROM 'stripe' OR p.gateway_customer_id IS DISTINCT FROM p_customer OR p.gateway_subscription_id IS DISTINCT FROM p_subscription OR p.mp_subscription_id IS DISTINCT FROM s.id::text OR p.modalidade_acesso IS DISTINCT FROM 'comercial' OR p.primeiro_pagamento_confirmado IS DISTINCT FROM true OR p.plano_ativo_ate IS DISTINCT FROM p_paid_until OR p.status_acesso NOT IN ('ativo','em_atraso') THEN RETURN 'review_profile'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_subscriptions b WHERE b.user_id=s.user_id AND b.id<>s.id AND b.status IN ('active','trialing','past_due','pending')) OR EXISTS(SELECT 1 FROM public.billing_payments b WHERE b.provider='stripe' AND b.provider_payment_id=p_invoice) THEN RETURN 'review_paid_or_conflict'; END IF;
 IF p.plano_tipo='free' AND p.motivo_downgrade='inadimplencia' AND p.plano_anterior_downgrade=s.plan_code THEN RETURN 'already_free'; END IF;
 IF p.plano_tipo IS DISTINCT FROM s.plan_code OR p.motivo_downgrade IS NOT NULL OR p.plano_anterior_downgrade IS NOT NULL OR p.downgrade_em IS NOT NULL OR p.pagamento_origem_downgrade IS NOT NULL THEN RETURN 'review_plan'; END IF;
 IF NOT p_execute THEN RETURN CASE WHEN d>=p_due+8 THEN 'simulation_free' ELSE 'simulation_warning' END; END IF;
 UPDATE public.billing_subscriptions SET status='past_due',updated_at=now() WHERE id=s.id;
 IF d>=p_due+8 THEN
  UPDATE public.perfis SET plano_tipo='free',plano='free',status_acesso='ativo',plano_anterior_downgrade=s.plan_code,downgrade_em=now(),motivo_downgrade='inadimplencia',pagamento_origem_downgrade=p_invoice,inadimplencia_vencimento=p_due WHERE user_id=s.user_id;
  RETURN 'downgraded';
 END IF;
 UPDATE public.perfis SET status_acesso='em_atraso',inadimplencia_vencimento=p_due WHERE user_id=s.user_id;
 RETURN 'warning';
END; $fn$;
REVOKE ALL ON FUNCTION public.mp26_stripe_atraso(text,text,text,date,timestamptz,timestamptz,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp26_stripe_atraso(text,text,text,date,timestamptz,timestamptz,text,boolean) TO service_role;

REVOKE ALL ON FUNCTION public.aplicar_downgrade_inadimplencia(uuid,text,text,text,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_downgrade_inadimplencia(uuid,text,text,text,date) TO service_role;

-- Service-only candidate queues: do not let currently paid or already downgraded Stripe profiles consume the batch.
CREATE OR REPLACE FUNCTION public.mp26_stripe_candidatos(p_limit integer DEFAULT 20)
RETURNS SETOF public.billing_subscriptions LANGUAGE sql STABLE SET search_path TO '' AS $q$
 SELECT s.* FROM public.billing_subscriptions s JOIN public.perfis p ON p.user_id=s.user_id
 WHERE current_user='service_role' AND s.provider='stripe' AND s.status IN ('active','past_due','trialing')
 AND p.gateway='stripe' AND p.gateway_subscription_id=s.provider_subscription_id
 AND p.modalidade_acesso='comercial' AND p.primeiro_pagamento_confirmado IS TRUE
 AND p.plano_tipo=s.plan_code AND p.plano_tipo IN ('minipage','agenda','loja','essencial')
 AND p.status_acesso IN ('ativo','em_atraso') AND p.plano_ativo_ate<=now()
 ORDER BY s.mp26_checked_at ASC NULLS FIRST,s.id LIMIT greatest(1,least(coalesce(p_limit,20),20));
$q$;
REVOKE ALL ON FUNCTION public.mp26_stripe_candidatos(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp26_stripe_candidatos(integer) TO service_role;
CREATE OR REPLACE FUNCTION public.mp26_asaas_candidatos(p_limit integer DEFAULT 6)
RETURNS SETOF public.billing_asaas_recurring_attempts LANGUAGE sql STABLE SET search_path TO '' AS $q$
 SELECT a.* FROM public.billing_asaas_recurring_attempts a
 JOIN public.billing_subscriptions s ON s.id=a.attempt_id
 JOIN public.perfis p ON p.user_id=a.user_id
 WHERE current_user='service_role' AND s.provider='asaas' AND s.user_id=a.user_id AND s.status='past_due'
 AND a.status='paid' AND p.gateway='asaas' AND p.gateway_subscription_id=a.subscription_id
 AND p.modalidade_acesso='comercial' AND p.primeiro_pagamento_confirmado IS TRUE
 AND (p.plano_tipo=a.plan_code OR (p.plano_tipo='free' AND p.motivo_downgrade='inadimplencia' AND p.plano_anterior_downgrade=a.plan_code))
 AND p.status_acesso IN ('ativo','em_atraso') AND s.current_period_end<=now()
 ORDER BY a.last_reconciled_at ASC NULLS FIRST,a.attempt_id LIMIT greatest(1,least(coalesce(p_limit,6),6));
$q$;
REVOKE ALL ON FUNCTION public.mp26_asaas_candidatos(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mp26_asaas_candidatos(integer) TO service_role;

COMMIT;
