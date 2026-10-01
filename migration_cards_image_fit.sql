-- ==================================================================================
-- Adiciona o campo de enquadramento de imagem SOMENTE em pagina_cards (Links visuais).
-- Nenhuma outra tabela (Destaques, Albuns, etc) e alterada.
--
-- Retrocompatibilidade: a coluna e criada com default 'auto' (comportamento mais
-- amigavel para NOVOS cards a partir de agora), mas os registros ja existentes sao
-- explicitamente atualizados para 'cover' logo em seguida - exatamente o comportamento
-- visual que ja estava no ar (equivalente a object-fit:cover hoje), para nao alterar
-- nenhuma pagina ja publicada.
-- ==================================================================================

alter table pagina_cards
  add column if not exists image_fit text not null default 'auto';

-- Registros ja existentes continuam se comportando exatamente como hoje (cover) -
-- rodado uma unica vez, so afeta linhas que ja existiam antes desta migration.
update pagina_cards set image_fit = 'cover' where image_fit = 'auto';

alter table pagina_cards
  add constraint pagina_cards_image_fit_check check (image_fit in ('auto', 'cover', 'contain'));
