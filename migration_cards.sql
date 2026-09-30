-- ==================================================================================
-- Modulo "Links visuais" (Cards) - mesma arquitetura ja usada em pagina_albuns /
-- pagina_album_fotos (secao "pai" + itens "filhos", ambos com user_id direto, ordem e
-- ativo/oculto). Reaproveita o bucket de Storage "fotos" ja usado no resto do projeto.
--
-- exibir_no_topo comeca em FALSE por padrao (nunca opt-out automatico e arriscado): a UI
-- do painel so oferece marcar essa opcao quando a URL for reconhecida como uma
-- plataforma elegivel pro topo, e so entao persiste true.
-- ==================================================================================

create table if not exists pagina_cards_secoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  titulo text not null,
  subtitulo text,
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pagina_cards (
  id uuid primary key default gen_random_uuid(),
  secao_id uuid not null references pagina_cards_secoes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  imagem_url text,
  titulo text,
  exibir_titulo boolean not null default false,
  url text,
  exibir_no_topo boolean not null default false,
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pagina_cards_secoes_user_id on pagina_cards_secoes(user_id);
create index if not exists idx_pagina_cards_secao_id on pagina_cards(secao_id);
create index if not exists idx_pagina_cards_user_id on pagina_cards(user_id);

-- RLS: mesmo padrao ja usado em pagina_albuns/pagina_album_fotos - dono (auth.uid() =
-- user_id) gerencia tudo via painel (select/insert/update/delete); leitura publica so do
-- que esta ativo, exatamente como as outras tabelas de conteudo da MiniPage. Nenhuma
-- policy ampla, nenhum insert/update/delete publico.
alter table pagina_cards_secoes enable row level security;
alter table pagina_cards enable row level security;

create policy "Dono gerencia suas secoes de cards" on pagina_cards_secoes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Leitura publica de secoes de cards ativas" on pagina_cards_secoes
  for select using (ativo = true);

create policy "Dono gerencia seus cards" on pagina_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Leitura publica de cards ativos" on pagina_cards
  for select using (ativo = true);
