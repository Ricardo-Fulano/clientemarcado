-- ==================================================================================
-- Modulo Spotify incorporado - mesma arquitetura ja aprovada em pagina_cards_secoes /
-- pagina_cards (secao "pai" + itens "filhos", ambos com user_id direto, ordem e
-- ativo/oculto). Nao reaproveita bucket de Storage (nao ha upload de imagem aqui - so
-- uma URL do Spotify, validada e derivada no momento da leitura, nunca no banco).
--
-- IMPORTANTE: tipo de conteudo (track/album/playlist/artist/show/episode), o ID do
-- Spotify e a URL de embed NUNCA sao persistidos. Sao sempre derivados de spotify_url
-- via app/lib/spotify.ts (parseSpotifyUrl), tanto no painel quanto na slug publica -
-- evita dado redundante que poderia desatualizar se o parser evoluir.
-- ==================================================================================

create table if not exists pagina_spotify_secoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  titulo text not null,
  subtitulo text,
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pagina_spotify_itens (
  id uuid primary key default gen_random_uuid(),
  secao_id uuid not null references pagina_spotify_secoes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  spotify_url text not null,
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pagina_spotify_secoes_user_id on pagina_spotify_secoes(user_id);
create index if not exists idx_pagina_spotify_itens_secao_id on pagina_spotify_itens(secao_id);
create index if not exists idx_pagina_spotify_itens_user_id on pagina_spotify_itens(user_id);

-- RLS: mesmo padrao ja usado em pagina_cards_secoes/pagina_cards - dono (auth.uid() =
-- user_id) gerencia tudo via painel (select/insert/update/delete); leitura publica so do
-- que esta ativo, exatamente como as outras tabelas de conteudo da MiniPage. Nenhuma
-- policy ampla, nenhum insert/update/delete publico.
alter table pagina_spotify_secoes enable row level security;
alter table pagina_spotify_itens enable row level security;

create policy "Dono gerencia suas secoes de spotify" on pagina_spotify_secoes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Leitura publica de secoes de spotify ativas" on pagina_spotify_secoes
  for select using (ativo = true);

create policy "Dono gerencia seus itens de spotify" on pagina_spotify_itens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Leitura publica de itens de spotify ativos" on pagina_spotify_itens
  for select using (ativo = true);
