/**
 * Reconcilia perfis Free por inadimplencia independentemente dos webhooks.
 * Desativado por padrao; apenas servidor administrativo; sem comissoes diretas.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { avaliarAmbienteAsaas } from './asaas-ambiente'
import { conciliarRecuperacaoAsaas } from './conciliacao-recuperacao'
import { listarCobrancasAssinatura } from './cobrancas-asaas'
import { conferirPagamento, fimDoAcesso } from './asaas-webhook'

export type DepsReconciliacao = {
  env: Record<string, string | undefined>
  criarCliente: typeof createClient
  fetchFn: typeof fetch
  conciliarFn?: typeof conciliarRecuperacaoAsaas
  conferirFn?: typeof conferirPagamento
  fimFn?: typeof fimDoAcesso
  avaliarAmbienteFn?: typeof avaliarAmbienteAsaas
}

const PAGOS = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'])
const PLANOS = new Set(['minipage', 'agenda', 'loja', 'essencial', 'equipe'])
const DATA = /^\d{4}-\d{2}-\d{2}$/
const valido = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const centavos = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 100) : null

export async function executarReconciliacaoPlanos(request: Request, deps: DepsReconciliacao) {
  const { env, criarCliente, fetchFn } = deps
  if (env.ASAAS_RECONCILIACAO_PLANOS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Reconciliacao de planos desativada.' }, { status: 503 })
  }
  if (!env.CRON_SECRET) return NextResponse.json({ error: 'Rotina nao configurada.' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase nao configurado.' }, { status: 503 })
  }
  const ambiente = (deps.avaliarAmbienteFn ?? avaliarAmbienteAsaas)(env)
  if (!ambiente.ok) return NextResponse.json({ error: 'Ambiente Asaas invalido.' }, { status: 503 })
  const db = criarCliente(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const resumo = { ok: true, analisados: 0, restaurados: 0, recusados: 0, erros: 0, comissoesProcessadas: 0 }
  const consultar = async (path: string): Promise<any> => {
    const response = await fetchFn(`${ambiente.baseUrl}${path}`, {
      method: 'GET', headers: { 'Content-Type': 'application/json', access_token: env.ASAAS_API_KEY || '' },
      cache: 'no-store', signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error(`Asaas HTTP ${response.status}`)
    return response.json()
  }
  try {
    const { data: perfis, error } = await db.from('perfis')
      .select('user_id,plano_tipo,status_acesso,modalidade_acesso,gateway,gateway_customer_id,gateway_subscription_id,billing_cycle,valor_contratado,plano_anterior_downgrade,motivo_downgrade,pagamento_origem_downgrade,downgrade_em,plano_ativo_ate')
      .eq('plano_tipo', 'free').eq('motivo_downgrade', 'inadimplencia')
      .eq('modalidade_acesso', 'comercial').eq('gateway', 'asaas')
      .order('downgrade_em', { ascending: true }).limit(25)
    if (error) throw new Error('Falha ao consultar perfis: ' + error.message)
    for (const p of perfis ?? []) {
      resumo.analisados++
      try {
        if (p.status_acesso !== 'ativo' || p.billing_cycle !== 'mensal' ||
          !PLANOS.has(p.plano_anterior_downgrade) || !valido(p.user_id) ||
          !valido(p.gateway_subscription_id) || !valido(p.gateway_customer_id) ||
          !valido(p.pagamento_origem_downgrade) || !valido(p.downgrade_em) ||
          centavos(Number(p.valor_contratado)) === null) {
          resumo.recusados++; continue
        }
        const sub = p.gateway_subscription_id
        const cus = p.gateway_customer_id
        const origem: any = await consultar(`/payments/${encodeURIComponent(p.pagamento_origem_downgrade)}`)
        if (origem.id !== p.pagamento_origem_downgrade || origem.customer !== cus ||
          origem.subscription !== sub || origem.deleted === true ||
          !DATA.test(origem.dueDate || '')) { resumo.recusados++; continue }
        const historico = await listarCobrancasAssinatura(consultar, sub, cus)
        if (!historico.ok) { resumo.recusados++; continue }
        // A obrigacao que justificou o downgrade ou outra posterior deve ter sido quitada.
        const candidatos = historico.cobrancas
          .filter(c => PAGOS.has(c.status || '') && DATA.test(c.dueDate || '') &&
            c.dueDate! >= origem.dueDate)
          .sort((a, b) => b.dueDate!.localeCompare(a.dueDate!) || b.id.localeCompare(a.id))
        const alvo = candidatos[0]
        if (!alvo) { resumo.recusados++; continue }
        const conciliacao = await (deps.conciliarFn ?? conciliarRecuperacaoAsaas)(consultar, sub, cus, alvo.id)
        if (!conciliacao.apta) { resumo.recusados++; continue }
        const pg = conciliacao.pagamento
        const motivo = (deps.conferirFn ?? conferirPagamento)(pg, { ...p, plano_tipo: p.plano_anterior_downgrade })
        const fim = (deps.fimFn ?? fimDoAcesso)(pg, 'mensal')
        if (motivo || !fim || !Number.isFinite(fim.getTime()) || fim <= new Date()) {
          resumo.recusados++; continue
        }
        // Revalidar a identidade, periodo e status da mesma cobranca na ultima leitura.
        const pgFinal: any = await consultar(`/payments/${encodeURIComponent(alvo.id)}`)
        if (pgFinal.id !== pg.id || pgFinal.status !== pg.status ||
          pgFinal.customer !== cus || pgFinal.subscription !== sub ||
          pgFinal.deleted === true || pgFinal.dueDate !== pg.dueDate ||
          centavos(Number(pgFinal.value)) !== centavos(Number(pg.value))) {
          resumo.recusados++; continue
        }
        const { data: restaurou, error: erroRpc } = await db.rpc('restaurar_plano_por_conciliacao', {
          p_user_id: p.user_id,
          p_subscription_id: sub,
          p_payment_id: alvo.id,
          p_pagamento_origem: p.pagamento_origem_downgrade,
          p_downgrade_em: p.downgrade_em,
          p_valor_pagamento: Number(pg.value),
          p_novo_plano_ativo_ate: fim.toISOString(),
        })
        if (erroRpc || restaurou !== true) {
          resumo.recusados++
          if (erroRpc) console.error('[Reconciliacao planos] RPC recusada:', erroRpc.message)
          continue
        }
        resumo.restaurados++
      } catch (err) {
        resumo.erros++
        console.error('[Reconciliacao planos] Conta inconclusiva:', err instanceof Error ? err.message : 'Erro desconhecido')
      }
    }
    return NextResponse.json(resumo, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[Reconciliacao planos] Falha geral:', err instanceof Error ? err.message : 'Erro desconhecido')
    return NextResponse.json({ error: 'Falha na reconciliacao.' }, { status: 500 })
  }
}
