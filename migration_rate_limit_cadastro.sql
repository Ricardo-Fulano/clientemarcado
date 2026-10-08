-- ==================================================================================
-- Limite de tentativas do cadastro (por IP e por e-mail), usado por
-- /api/cadastro/registrar. Nao altera nenhuma tabela existente.
-- As chaves guardam so HASH (nunca o IP ou o e-mail em texto).
-- Aplicar ESTE SQL ANTES de publicar o codigo novo.
-- ==================================================================================
create table if not exists public.rate_limit_cadastro (
  id bigserial primary key,
  chave text not null,
  criado_em timestamptz not null default now()
);
create index if not exists idx_rate_limit_cadastro_chave on public.rate_limit_cadastro (chave, criado_em desc);
create index if not exists idx_rate_limit_cadastro_criado on public.rate_limit_cadastro (criado_em);

-- RLS ligada e SEM policies: so o service_role (servidor) acessa; anon/authenticated nao.
alter table public.rate_limit_cadastro enable row level security;

-- Devolve true se a tentativa pode seguir (e a registra); false se passou do limite.
create or replace function public.checar_rate_limit(p_chave text, p_max int, p_janela_segundos int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_qtd int;
begin
  -- limpeza barata: nada com mais de 1 dia interessa
  delete from rate_limit_cadastro where criado_em < now() - interval '1 day';
  select count(*) into v_qtd from rate_limit_cadastro
    where chave = p_chave and criado_em > now() - make_interval(secs => p_janela_segundos);
  if v_qtd >= p_max then return false; end if;
  insert into rate_limit_cadastro(chave) values (p_chave);
  return true;
end;
$$;

revoke all on function public.checar_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.checar_rate_limit(text, int, int) to service_role;
