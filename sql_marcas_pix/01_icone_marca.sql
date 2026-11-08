-- ===================================================================================================
-- Escolha MANUAL do icone de um link: coluna opcional pagina_links.icone_marca (ADITIVO e IDEMPOTENTE)
-- ===================================================================================================
-- O QUE FAZ: acrescenta UMA coluna de texto, nula por padrao, com CHECK de formato (so letras minusculas, digitos e "_", ate 40).
--   NULL = comportamento atual (reconhecimento automatico). 'generico' ou o id de uma marca = escolha do dono.
-- O QUE NAO FAZ: nao altera nenhuma linha (todos os links existentes ficam com NULL), nao toca em RLS/politicas, tipo, url, titulo, descricao, ordem, ativo,
--   cliques, nem em nenhuma outra tabela. Sem esta coluna o sistema continua funcionando; so a escolha manual do icone fica indisponivel.
-- ===================================================================================================
begin;
set local lock_timeout = '5s';
do $mig$
declare v_antes bigint; v_depois bigint;
begin
  if to_regclass('public.pagina_links') is null then raise exception 'ABORTADO: public.pagina_links nao existe.'; end if;
  select count(*) into v_antes from public.pagina_links;
  alter table public.pagina_links add column if not exists icone_marca text;
  if not exists (select 1 from pg_constraint where conrelid = 'public.pagina_links'::regclass and conname = 'pagina_links_icone_marca_chk') then
    alter table public.pagina_links add constraint pagina_links_icone_marca_chk check (icone_marca is null or icone_marca ~ '^[a-z0-9_]{1,40}$');
  end if;
  select count(*) into v_depois from public.pagina_links;
  if v_antes <> v_depois then raise exception 'ABORTADO: o numero de links mudou (% -> %).', v_antes, v_depois; end if;
end
$mig$;
commit;
select 'icone_marca criada/confirmada; nenhum link alterado' as resultado, (select count(*) from public.pagina_links) as links, (select count(*) from public.pagina_links where icone_marca is not null) as com_icone_manual;
