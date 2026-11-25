-- SOMENTE LEITURA, após 01 em ambiente isolado.
SELECT public.mp_asaas_recurring_ready_v1() AS estrutura_instalada;
SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('billing_asaas_recurring_attempts','billing_asaas_recurring_events');
SELECT has_table_privilege('authenticated','public.billing_asaas_recurring_attempts','SELECT') AS authenticated_le_tentativas,has_table_privilege('authenticated','public.billing_asaas_recurring_attempts','INSERT') AS authenticated_insere_tentativas,has_function_privilege('authenticated','public.mp_asaas_apply_payment_v1(uuid,text,text,text,timestamptz,timestamptz,text,boolean)','EXECUTE') AS authenticated_ativa_plano;

SELECT has_function_privilege('authenticated','public.mp_asaas_commission_v2(uuid,uuid,uuid,text,text,numeric,numeric,timestamptz,text)','EXECUTE') AS authenticated_registra_comissao,has_table_privilege('authenticated','public.billing_asaas_commission_reviews','SELECT') AS authenticated_le_ajustes;
