-- Parceiro Estrategico: percentual de comissao por parceiro (20% padrao | 30% estrategico).
-- Aditiva: nao toca em comissoes_parceiros, repasses_parceiros, indicacoes_parceiros nem na RPC
-- registrar_comissao_pagamento. Parceiros existentes ficam em 0.20 (default). Sem backfill.
-- RLS de public.parceiros ja esta ligada e anon/authenticated nao tem permissao: nenhuma policy,
-- grant ou trigger novo.
-- ORDEM: aplicar esta migration ANTES do deploy do codigo.

alter table public.parceiros
  add column percentual_comissao numeric(4,2) not null default 0.20
  constraint parceiros_percentual_comissao_check
  check (percentual_comissao in (0.20, 0.30));
