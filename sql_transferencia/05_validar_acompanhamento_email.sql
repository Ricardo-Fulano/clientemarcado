-- Validacao SOMENTE LEITURA do acompanhamento de e-mail dos convites. Esperado: ultima linha "N de N OK".
with checks(n, verificacao, ok, detalhe) as (
  select 1, 'as 5 colunas de acompanhamento existem', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'convites_transferencia'
         and column_name in ('resend_email_id','email_status','email_enviado_em','email_entregue_em','email_erro')) = 5, 'colunas encontradas'
  union all select 2, 'CHECK de email_status presente', exists (select 1 from pg_constraint where conrelid = 'public.convites_transferencia'::regclass and conname = 'convites_transferencia_email_status_chk'), 'convites_transferencia_email_status_chk'
  union all select 3, 'indice unico parcial em resend_email_id presente', exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'uq_convites_transferencia_resend_email_id' and indexdef like '%UNIQUE%' and indexdef like '%resend_email_id IS NOT NULL%'), 'uq_convites_transferencia_resend_email_id'
  union all select 4, 'nenhum email_status fora da lista', not exists (select 1 from public.convites_transferencia where email_status is not null and email_status not in ('solicitado','entregue','atrasado','devolvido','spam','falhou','indeterminado')), 'ok'
  union all select 5, 'aceitar_convite_transferencia(uuid, uuid) existe, SECURITY DEFINER e search_path = public',
         exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'aceitar_convite_transferencia' and p.prosecdef and p.proconfig @> array['search_path=public']
                 and pg_get_function_identity_arguments(p.oid) = 'p_convite_id uuid, p_novo_user_id uuid'), 'funcao de aceite'
  union all select 6, 'as RPCs DESCARTADAS (preparar/ativar/recuperar) NAO estao instaladas',
         not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('preparar_convite_transferencia','ativar_convite_transferencia','recuperar_convite_transferencia')), 'nenhuma instalada'
  union all select 7, 'nenhum convite no estado descartado "preparando"', not exists (select 1 from public.convites_transferencia where status = 'preparando'), 'ok'
  union all select 8, 'INFORMATIVO: convites por status', true, (select coalesce(string_agg(status || '=' || n, ' | ' order by status), 'sem convites') from (select status, count(*) n from public.convites_transferencia group by status) s)
  union all select 9, 'INFORMATIVO: acompanhamento de e-mail por email_status', true, (select coalesce(string_agg(coalesce(email_status, 'sem_status') || '=' || n, ' | ' order by email_status nulls first), 'sem convites') from (select email_status, count(*) n from public.convites_transferencia group by email_status) s)
  union all select 10, 'INFORMATIVO: o convite pendente da Ana (bc832a52...) continua pendente', true, coalesce((select 'status=' || status || ' | criado_em=' || criado_em::text from public.convites_transferencia where id = 'bc832a52-e16f-448a-b993-2ca237efbc2b'), 'convite nao encontrado')
)
select n, verificacao, ok, detalhe from checks
union all select 999, 'RESULTADO', bool_and(ok), count(*) filter (where ok)::text || ' de ' || count(*)::text || ' OK' from checks
order by n;
