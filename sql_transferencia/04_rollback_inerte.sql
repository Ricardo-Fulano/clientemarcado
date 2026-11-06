-- ROLLBACK da migracao 04 (NASCE INERTE). Remove SOMENTE o CHECK e o indice unico parcial; nenhum dado e tocado.
-- Para executar, troque a chave abaixo para 'SIM'. Nao mexe em colunas, linhas, funcoes nem convites.
begin;
set local lock_timeout = '5s';
do $rb$
declare v_confirmar text := 'NAO';  -- >>> CHAVE <<<  troque para 'SIM' para executar
begin
  if v_confirmar = 'SIM' then
    alter table public.convites_transferencia drop constraint if exists convites_transferencia_email_status_chk;
    drop index if exists public.uq_convites_transferencia_resend_email_id;
  end if;
end
$rb$;
commit;
select case when exists (select 1 from pg_constraint where conname = 'convites_transferencia_email_status_chk') or exists (select 1 from pg_indexes where indexname = 'uq_convites_transferencia_resend_email_id')
            then 'CHECK/indice PRESENTES (rollback inerte ou nao executado)' else 'CHECK e indice REMOVIDOS' end as resultado;
