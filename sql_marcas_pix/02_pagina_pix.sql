-- ===================================================================================================
-- MiniPage Pix v2: tabela pagina_pix + FUNCOES de leitura publica controlada (IDEMPOTENTE; nao altera nenhuma tabela existente)
-- ===================================================================================================
-- CORRECAO DE SEGURANCA: a versao anterior criava a view pagina_pix_publico com GRANT SELECT para anon, o que permitiria listar TODOS os Pix ativos pela API
-- publica do Supabase (GET /rest/v1/pagina_pix_publico). Esta versao NAO tem view nem acesso publico a tabela. A leitura publica e feita por funcoes que recebem UM slug.
-- Guarda SOMENTE o que o dono escolheu publicar (codigo Pix, titulo, descricao, posicao, ativo). Sem senha, token ou credencial. A MiniPage nao movimenta dinheiro.
-- SEGURANCA:
--   * RLS ligado: cada usuario le/insere/altera/exclui SOMENTE a propria linha (user_id = auth.uid()). anon e PUBLIC nao tem acesso a tabela.
--   * Leitura publica: pix_publico_resumo(slug) e pix_publico_codigo(slug), SECURITY DEFINER, search_path vazio, sem SQL dinamico, slug validado, UMA linha, colunas minimas
--     (sem user_id). EXECUTE concedido SOMENTE a service_role: a rota de servidor do app as chama; anon/authenticated NAO podem chama-las nem listar nada.
--   * Nao ha FORCE RLS de proposito: as funcoes rodam como dono da tabela (que ignora a RLS) para ler a linha do slug consultado.
-- Requer o schema auth do Supabase, a view public.perfis_publicos (colunas user_id e slug, a mesma que a pagina publica ja usa) e o papel service_role.
-- ===================================================================================================
begin;
set local lock_timeout = '5s';

do $pre$
begin
  if to_regclass('public.perfis_publicos') is null then raise exception 'ABORTADO: view public.perfis_publicos nao encontrada.'; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then raise exception 'ABORTADO: papel service_role nao encontrado (este script e para o Supabase).'; end if;
end
$pre$;

create table if not exists public.pagina_pix (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  ativo          boolean not null default false,
  titulo         text not null default 'Receber por Pix' check (char_length(titulo) between 1 and 60),
  descricao      text check (descricao is null or char_length(descricao) <= 140),
  ordem          integer not null default 100000,
  modo           text not null check (modo in ('copia_cola', 'estatico')),
  payload        text not null check (char_length(payload) between 40 and 512 and payload ~ '^[ -~]+$' and payload ~ '6304[0-9A-F]{4}$' and upper(payload) like '%BR.GOV.BCB.PIX%'),
  nome_recebedor text not null check (char_length(nome_recebedor) between 1 and 25),
  cidade         text not null check (char_length(cidade) between 1 and 15),
  tipo_chave     text not null check (tipo_chave in ('aleatoria', 'cpf', 'cnpj', 'telefone', 'email', 'desconhecida')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function public.pagina_pix_toca_updated_at() returns trigger language plpgsql set search_path = '' as $f$
begin new.updated_at := now(); return new; end $f$;
drop trigger if exists trg_pagina_pix_updated_at on public.pagina_pix;
create trigger trg_pagina_pix_updated_at before update on public.pagina_pix for each row execute function public.pagina_pix_toca_updated_at();

alter table public.pagina_pix enable row level security;
drop policy if exists pagina_pix_select_dono on public.pagina_pix;
drop policy if exists pagina_pix_insert_dono on public.pagina_pix;
drop policy if exists pagina_pix_update_dono on public.pagina_pix;
drop policy if exists pagina_pix_delete_dono on public.pagina_pix;
create policy pagina_pix_select_dono on public.pagina_pix for select to authenticated using (user_id = auth.uid());
create policy pagina_pix_insert_dono on public.pagina_pix for insert to authenticated with check (user_id = auth.uid());
create policy pagina_pix_update_dono on public.pagina_pix for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy pagina_pix_delete_dono on public.pagina_pix for delete to authenticated using (user_id = auth.uid());
revoke all on public.pagina_pix from public, anon;
grant select, insert, update, delete on public.pagina_pix to authenticated;

-- a view publica da versao anterior NAO deve existir (se um dia foi criada, e removida aqui junto com seus privilegios)
drop view if exists public.pagina_pix_publico;

-- resumo para a PAGINA publica (sem o codigo Pix)
create or replace function public.pix_publico_resumo(p_slug text)
returns table (titulo text, descricao text, ordem integer)
language plpgsql stable security definer set search_path = ''
as $f$
begin
  if p_slug is null or char_length(p_slug) not between 1 and 80 or p_slug ~ '[[:cntrl:][:space:]/\\?#%@<>"''`]' then return; end if;
  return query
    select x.titulo, x.descricao, x.ordem
    from public.perfis_publicos p
    join public.pagina_pix x on x.user_id = p.user_id
    where p.slug = p_slug and x.ativo
    limit 1;
end
$f$;

-- codigo Pix para a TELA de pagamento (so quando o visitante toca no card)
create or replace function public.pix_publico_codigo(p_slug text)
returns table (titulo text, descricao text, payload text)
language plpgsql stable security definer set search_path = ''
as $f$
begin
  if p_slug is null or char_length(p_slug) not between 1 and 80 or p_slug ~ '[[:cntrl:][:space:]/\\?#%@<>"''`]' then return; end if;
  return query
    select x.titulo, x.descricao, x.payload
    from public.perfis_publicos p
    join public.pagina_pix x on x.user_id = p.user_id
    where p.slug = p_slug and x.ativo
    limit 1;
end
$f$;

revoke all on function public.pix_publico_resumo(text) from public, anon, authenticated;
revoke all on function public.pix_publico_codigo(text) from public, anon, authenticated;
grant execute on function public.pix_publico_resumo(text) to service_role;
grant execute on function public.pix_publico_codigo(text) to service_role;

commit;
select 'pagina_pix e funcoes de leitura publica criadas/confirmadas; view publica removida; nenhuma tabela existente alterada' as resultado, (select count(*) from public.pagina_pix) as linhas;
