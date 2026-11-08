-- ROLLBACK (NASCE INERTE). Para executar, troque a chave para 'SIM'. DESTRUTIVO para os dados de Pix: apaga a tabela pagina_pix e as funcoes (os dados cadastrados se perdem).
-- A coluna icone_marca so e removida se a chave v_remover_coluna tambem for 'SIM' (as escolhas manuais de icone se perdem). Nada mais e tocado.
begin;
set local lock_timeout = '5s';
do $rb$
declare v_pix text := 'NAO'; v_remover_coluna text := 'NAO';  -- >>> CHAVES <<<
begin
  if v_pix = 'SIM' then
    drop function if exists public.pix_publico_resumo(text);
    drop function if exists public.pix_publico_codigo(text);
    drop view if exists public.pagina_pix_publico;
    drop table if exists public.pagina_pix;
    drop function if exists public.pagina_pix_toca_updated_at();
  end if;
  if v_remover_coluna = 'SIM' then
    alter table public.pagina_links drop constraint if exists pagina_links_icone_marca_chk;
    alter table public.pagina_links drop column if exists icone_marca;
  end if;
end
$rb$;
commit;
select case when to_regclass('public.pagina_pix') is null then 'pagina_pix REMOVIDA' else 'pagina_pix PRESENTE (rollback inerte ou nao executado)' end as resultado;
