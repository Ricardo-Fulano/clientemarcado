-- Validacao SOMENTE LEITURA (marcas + Pix v2). Esperado: ultima linha "N de N OK". Itens 1-2 so passam depois do 01; 3-11 depois do 02.
with checks(n, verificacao, ok, detalhe) as (
  select 1, 'pagina_links.icone_marca existe', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pagina_links' and column_name = 'icone_marca'), 'coluna opcional'
  union all select 2, 'CHECK de formato de icone_marca', exists (select 1 from pg_constraint where conname = 'pagina_links_icone_marca_chk'), 'pagina_links_icone_marca_chk'
  union all select 3, 'pagina_pix existe com RLS ligado', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.pagina_pix')), false), 'RLS'
  union all select 4, '4 politicas do dono (select/insert/update/delete) e nenhuma para anon/public', (select count(*) from pg_policies where schemaname = 'public' and tablename = 'pagina_pix') = 4
         and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pagina_pix' and (roles::text like '%anon%' or roles::text like '%public%')), 'politicas'
  union all select 5, 'anon e authenticated nao tem acesso de leitura/escrita direta que contorne a RLS: anon sem privilegio algum na tabela', to_regclass('public.pagina_pix') is not null and not coalesce(has_table_privilege('anon', to_regclass('public.pagina_pix'), 'select,insert,update,delete'), false), 'sem grant para anon'
  union all select 6, 'NAO existe view publica de Pix (nada listavel pela API publica)', to_regclass('public.pagina_pix_publico') is null and to_regclass('public.pagina_pix') is not null, 'sem pagina_pix_publico'
  union all select 7, 'funcoes de leitura publica: SECURITY DEFINER com search_path vazio', (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('pix_publico_resumo', 'pix_publico_codigo') and p.prosecdef and p.proconfig @> array['search_path=""']) = 2, 'resumo + codigo'
  union all select 8, 'EXECUTE somente para service_role (anon, authenticated e PUBLIC sem acesso)', (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('pix_publico_resumo', 'pix_publico_codigo')
         and has_function_privilege('service_role', p.oid, 'execute') and not has_function_privilege('anon', p.oid, 'execute') and not has_function_privilege('authenticated', p.oid, 'execute')
         and not exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')) = 2, 'ACL'
  union all select 9, 'colunas retornadas: resumo (titulo, descricao, ordem) e codigo (titulo, descricao, payload): sem user_id', (select string_agg(p.proname || ':' || pg_get_function_result(p.oid), ' | ' order by p.proname) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('pix_publico_resumo', 'pix_publico_codigo'))
         = 'pix_publico_codigo:TABLE(titulo text, descricao text, payload text) | pix_publico_resumo:TABLE(titulo text, descricao text, ordem integer)', 'resultado das funcoes'
  union all select 10, 'user_id unico (uma linha por MiniPage) e nenhuma FK para tabelas de pagamento', exists (select 1 from pg_index i where i.indrelid = to_regclass('public.pagina_pix') and i.indisunique and (select array_agg(a.attname::text) from pg_attribute a where a.attrelid = i.indrelid and a.attnum = any(i.indkey)) = array['user_id'])
         and not exists (select 1 from pg_constraint c where c.conrelid = to_regclass('public.pagina_pix') and c.contype = 'f' and c.confrelid <> 'auth.users'::regclass), 'unique + so FK auth.users'
  union all select 11, 'INFORMATIVO: total de links existentes (nao e alterado por estes scripts)', true, (select count(*)::text from public.pagina_links)
)
select n, verificacao, ok, detalhe from checks
union all select 999, 'RESULTADO', bool_and(ok), count(*) filter (where ok)::text || ' de ' || count(*)::text || ' OK' from checks
order by n;
