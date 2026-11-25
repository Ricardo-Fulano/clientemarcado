-- SOMENTE LEITURA. Execute no SQL Editor antes de qualquer migração.
SELECT n.nspname AS schema, p.proname, pg_get_function_identity_arguments(p.oid) AS argumentos, pg_get_functiondef(p.oid) AS definicao
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('registrar_comissao_pagamento','aplicar_downgrade_inadimplencia','restaurar_plano_apos_pagamento') ORDER BY p.proname;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename IN ('perfis','billing_subscriptions','billing_payments','billing_stripe_checkout_attempts') ORDER BY tablename,policyname;
SELECT c.relname AS tabela,t.tgname,pg_get_triggerdef(t.oid) AS definicao FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('perfis','billing_subscriptions','billing_payments','billing_stripe_checkout_attempts') AND NOT t.tgisinternal ORDER BY c.relname,t.tgname;
