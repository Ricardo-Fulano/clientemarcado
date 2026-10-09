-- ==================================================================================
-- Idempotencia do webhook do Asaas + registro de eventos orfaos/rejeitados.
-- O Asaas entrega webhooks "pelo menos uma vez": o MESMO evento pode chegar varias vezes.
-- Cada evento e gravado por ID; a reivindicacao e ATOMICA no banco (duas requisicoes
-- simultaneas do mesmo evento nunca processam as duas).
-- Nao altera nenhuma tabela existente, exceto criar indices unicos em perfis (com pre-checagem).
-- Aplicar ESTE SQL ANTES de publicar o codigo novo do webhook.
-- ==================================================================================

create table if not exists public.asaas_eventos (
  id bigserial primary key,
  event_id text not null,                 -- id do evento enviado pelo Asaas (ou chave sintetica)
  tipo text not null,                     -- ex: PAYMENT_CONFIRMED
  payment_id text,
  subscription_id text,
  customer_id text,
  user_id uuid,                           -- perfil localizado (vazio = orfao)
  valor numeric,
  vencimento date,                        -- dueDate da cobranca (usado para ordenar obrigacoes)
  data_evento timestamptz,
  status text not null default 'processando'
    check (status in ('processando', 'processado', 'ignorado', 'rejeitado', 'orfao', 'erro')),
  motivo text,                            -- por que foi ignorado/rejeitado/orfao/erro
  tentativas integer not null default 1,
  payload jsonb not null,                 -- evento completo, para reconciliacao
  recebido_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint asaas_eventos_event_id_key unique (event_id)
);
create index if not exists idx_asaas_eventos_payment on public.asaas_eventos (payment_id);
create index if not exists idx_asaas_eventos_user on public.asaas_eventos (user_id, status, vencimento desc);
create index if not exists idx_asaas_eventos_pendentes on public.asaas_eventos (recebido_em desc) where status in ('orfao', 'rejeitado', 'erro');

-- RLS ligada e SEM policies: so o service_role (servidor) acessa; navegador nunca.
alter table public.asaas_eventos enable row level security;

-- Reivindica um evento de forma ATOMICA. Devolve:
--   {acao:'processar'}    -> este e o dono do processamento (evento novo, ou reprocessavel)
--   {acao:'duplicado'}    -> ja foi tratado (processado/ignorado/rejeitado): nao repetir nada
--   {acao:'em_andamento'} -> outra requisicao esta processando agora: o Asaas deve tentar de novo
-- Reprocessaveis: 'erro', 'orfao' (o perfil pode existir agora) e 'processando' parado ha > 2 min.
create or replace function public.asaas_evento_reivindicar(
  p_event_id text, p_tipo text, p_payment_id text, p_subscription_id text, p_customer_id text,
  p_valor numeric, p_vencimento date, p_data_evento timestamptz, p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_status text;
begin
  insert into asaas_eventos (event_id, tipo, payment_id, subscription_id, customer_id, valor, vencimento, data_evento, payload)
  values (p_event_id, p_tipo, p_payment_id, p_subscription_id, p_customer_id, p_valor, p_vencimento, p_data_evento, p_payload)
  on conflict (event_id) do nothing
  returning id into v_id;

  if v_id is not null then
    return jsonb_build_object('acao', 'processar', 'novo', true);
  end if;

  -- Ja existia: so reivindica se for reprocessavel. O UPDATE condicional e atomico: com varias
  -- requisicoes ao mesmo tempo, so uma obtem a linha de volta.
  update asaas_eventos
     set status = 'processando', tentativas = tentativas + 1, atualizado_em = now()
   where event_id = p_event_id
     and (status in ('erro', 'orfao') or (status = 'processando' and atualizado_em < now() - interval '2 minutes'))
  returning id into v_id;

  if v_id is not null then
    return jsonb_build_object('acao', 'processar', 'novo', false);
  end if;

  select status into v_status from asaas_eventos where event_id = p_event_id;
  if v_status = 'processando' then
    return jsonb_build_object('acao', 'em_andamento');
  end if;
  return jsonb_build_object('acao', 'duplicado', 'status', v_status);
end;
$$;

revoke all on function public.asaas_evento_reivindicar(text, text, text, text, text, numeric, date, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.asaas_evento_reivindicar(text, text, text, text, text, numeric, date, timestamptz, jsonb) to service_role;

-- Unicidade dos ids do Asaas em perfis (hoje nao existe nenhuma). So cria se NAO houver duplicados
-- hoje; se houver, avisa e pula (nao quebra a migration). Os indices tambem aceleram o webhook.
do $$
begin
  if exists (select 1 from perfis where gateway_subscription_id is not null group by gateway_subscription_id having count(*) > 1) then
    raise notice 'PULADO: existem gateway_subscription_id duplicados em perfis - resolva antes de criar o indice unico';
  else
    create unique index if not exists ux_perfis_gateway_subscription_id on perfis (gateway_subscription_id) where gateway_subscription_id is not null;
  end if;
  if exists (select 1 from perfis where gateway_customer_id is not null group by gateway_customer_id having count(*) > 1) then
    raise notice 'PULADO: existem gateway_customer_id duplicados em perfis - resolva antes de criar o indice unico';
  else
    create unique index if not exists ux_perfis_gateway_customer_id on perfis (gateway_customer_id) where gateway_customer_id is not null;
  end if;
end $$;
