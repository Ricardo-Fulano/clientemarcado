-- ===================================================================================================
-- Transferencia de MiniPages: acompanhamento do e-mail do convite (MIGRACAO MINIMA E IDEMPOTENTE)
-- ===================================================================================================
-- O QUE FAZ (e so isso):
--   1) CHECK em convites_transferencia.email_status (valores aceitos: solicitado, entregue, atrasado, devolvido, spam, falhou,
--      indeterminado; NULL continua valido para os convites antigos);
--   2) indice UNICO PARCIAL em resend_email_id (o webhook do Resend localiza o convite por ele; duas linhas nunca compartilham um id).
-- O QUE NAO FAZ: nao cria funcoes/RPCs, nao altera aceitar_convite_transferencia, nao muda nenhuma linha (nenhum convite, inclusive o
--   pendente da Ana), nao toca em usuarios, assinaturas, Asaas, Mercado Pago, comissoes ou afiliados.
-- GARANTIAS: tudo em UMA transacao; aborta se faltar coluna ou se existir email_status fora da lista; ao final confere que o
--   numero de linhas, o numero de convites por status e a definicao de aceitar_convite_transferencia sao IDENTICOS aos do inicio.
-- NAO EXECUTE 01/02/03_*.sql (arquitetura descartada: preparar/ativar/recuperar). Rollback: 04_rollback_inerte.sql.
-- ===================================================================================================
begin;
set local lock_timeout = '5s';

do $mig$
declare
  v_faltam text;
  v_ruins bigint;
  v_antes_linhas bigint;
  v_antes_status text;
  v_antes_fn text;
  v_depois_status text;
begin
  -- guard: colunas esperadas
  select string_agg(c, ', ') into v_faltam
    from unnest(array['id','perfil_id','user_id_atual','email_novo','token_hash','status','criado_em','expira_em','aceito_em',
                      'resend_email_id','email_status','email_enviado_em','email_entregue_em','email_erro']) c
   where not exists (select 1 from information_schema.columns k where k.table_schema = 'public' and k.table_name = 'convites_transferencia' and k.column_name = c);
  if v_faltam is not null then raise exception 'ABORTADO: faltam colunas em convites_transferencia: %', v_faltam; end if;

  -- guard: a funcao de aceite existe (e vamos prova-la intacta no fim)
  select md5(pg_get_functiondef(p.oid)) into v_antes_fn
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'aceitar_convite_transferencia' and pg_get_function_identity_arguments(p.oid) = 'p_convite_id uuid, p_novo_user_id uuid';
  if v_antes_fn is null then raise exception 'ABORTADO: public.aceitar_convite_transferencia(uuid, uuid) nao encontrada.'; end if;

  -- guard: nenhum email_status fora da lista (o CHECK falharia)
  select count(*) into v_ruins from public.convites_transferencia
   where email_status is not null and email_status not in ('solicitado','entregue','atrasado','devolvido','spam','falhou','indeterminado');
  if v_ruins > 0 then raise exception 'ABORTADO: % linhas com email_status fora da lista permitida.', v_ruins; end if;

  select count(*) into v_antes_linhas from public.convites_transferencia;
  select coalesce(string_agg(status || '=' || n, ',' order by status), '') into v_antes_status
    from (select status, count(*) as n from public.convites_transferencia group by status) s;

  -- 1) CHECK (idempotente)
  if not exists (select 1 from pg_constraint where conrelid = 'public.convites_transferencia'::regclass and conname = 'convites_transferencia_email_status_chk') then
    alter table public.convites_transferencia
      add constraint convites_transferencia_email_status_chk
      check (email_status is null or email_status in ('solicitado','entregue','atrasado','devolvido','spam','falhou','indeterminado'));
  end if;

  -- 2) indice unico parcial (idempotente)
  create unique index if not exists uq_convites_transferencia_resend_email_id
    on public.convites_transferencia (resend_email_id) where resend_email_id is not null;

  -- prova: nada mudou nos dados nem na funcao de aceite
  select coalesce(string_agg(status || '=' || n, ',' order by status), '') into v_depois_status
    from (select status, count(*) as n from public.convites_transferencia group by status) s;
  if (select count(*) from public.convites_transferencia) <> v_antes_linhas or v_depois_status <> v_antes_status then
    raise exception 'ABORTADO: os dados de convites_transferencia mudaram (antes: % / depois: %).', v_antes_status, v_depois_status;
  end if;
  if (select md5(pg_get_functiondef(p.oid)) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'aceitar_convite_transferencia'
        and pg_get_function_identity_arguments(p.oid) = 'p_convite_id uuid, p_novo_user_id uuid') <> v_antes_fn then
    raise exception 'ABORTADO: aceitar_convite_transferencia foi alterada.';
  end if;
end
$mig$;

commit;

select 'Acompanhamento de e-mail dos convites: CHECK e indice criados/confirmados; dados e funcao de aceite INTACTOS' as resultado,
       (select count(*) from public.convites_transferencia) as convites,
       (select count(*) from public.convites_transferencia where status = 'pendente') as pendentes;
