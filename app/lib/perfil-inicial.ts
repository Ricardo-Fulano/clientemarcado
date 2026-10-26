import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarPlano, ehPlanoFree, normalizarBillingCycle } from './planos'

// Criacao do perfil inicial + indicacao de parceiro. Usado pelo cadastro (rota
// /api/cadastro/registrar) e pela rota /api/cadastro/criar-perfil. So roda no servidor, com
// um client service_role. O dono (userId) e o e-mail SEMPRE vem de uma sessao/usuario ja
// validado pelo chamador - nunca de dados soltos do navegador.
//
// SEGURANCA (hotfix N1): o PLANO e o ciclo de cobranca so sao gravados num perfil NOVO. Num perfil que
// JA EXISTE, esta funcao nunca altera plano_tipo, billing_cycle nem status (rodando com service_role, ela
// passaria pelo gatilho que protege essas colunas do navegador). Quem pode conceder/alterar plano e so o
// fluxo de pagamento/administracao, nunca um dado enviado pelo cliente.

// Gera um slug inicial a partir do nome do negocio (a pessoa pode trocar depois em
// Configuracoes). Sem hifen (so letras/numeros) para reduzir colisao e manter o link curto.
function gerarSlugBase(nome: string, userId: string) {
  const limpo = (nome || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30)
  return limpo || ('negocio' + userId.replace(/-/g, '').slice(0, 8))
}

export type DadosPerfil = {
  userId: string
  email: string
  nome_negocio?: unknown
  tipo_negocio?: unknown
  plano_tipo?: unknown
  billing_cycle?: unknown
  cupom?: unknown
}
export type ResultadoPerfil = { ok: true; criado: boolean; slug?: string } | { ok: false; erro: string }

export async function criarPerfilInicial(supabase: SupabaseClient, d: DadosPerfil): Promise<ResultadoPerfil> {
  const planoValido = normalizarPlano(d.plano_tipo as string)
  const emailSessao = (d.email || '').toLowerCase().trim()

  // Indicacao de parceiro gravada no servidor, com o e-mail da propria conta. Falha aqui
  // nunca impede a criacao da conta.
  async function registrarIndicacao() {
    const cupom = d.cupom
    if (!cupom || typeof cupom !== 'string' || cupom.length > 50) return
    try {
      const cupomFmt = cupom.trim().toUpperCase()
      const { data: parceiro } = await supabase.from('parceiros').select('id, ativo').eq('cupom', cupomFmt).maybeSingle()
      if (!parceiro || !parceiro.ativo) return
      await supabase.from('indicacoes_parceiros').upsert({
        parceiro_id: parceiro.id,
        cupom_codigo: cupomFmt,
        nome_negocio: null,
        nome_responsavel: typeof d.nome_negocio === 'string' ? d.nome_negocio : null,
        email: emailSessao,
        status: 'cadastrado',
        is_pagante: false,
        comissao_status: 'nenhuma',
        comissao_valor: 0,
        plano_tipo: planoValido,
      }, { onConflict: 'email,cupom_codigo', ignoreDuplicates: true })
    } catch (e) { console.warn('[perfil-inicial] indicacao de parceiro:', e) }
  }

  // Campos NAO sensiveis: podem ser atualizados num perfil que ja existe.
  // CPF/CNPJ NAO e guardado em "perfis" (a tabela e legivel pelo navegador): fica so no cadastro do cliente no Asaas.
  const camposNaoSensiveis: Record<string, unknown> = {}
  if (d.nome_negocio && typeof d.nome_negocio === 'string') camposNaoSensiveis.nome_negocio = d.nome_negocio
  if (d.tipo_negocio && typeof d.tipo_negocio === 'string') camposNaoSensiveis.tipo_negocio = d.tipo_negocio
  // Plano e ciclo de cobranca: SO entram no INSERT de um perfil novo (nunca num update).
  // Free nunca tem billing_cycle (nao gera cobranca). Planos pagos: sempre 'mensal'|'anual'.
  const camposDoPlano: Record<string, unknown> = {
    plano_tipo: planoValido,
    billing_cycle: ehPlanoFree(planoValido) ? null : normalizarBillingCycle(d.billing_cycle as string),
  }

  const { data: existente } = await supabase.from('perfis').select('id').eq('user_id', d.userId).maybeSingle()

  if (existente) {
    // Perfil ja existe: so atualiza campos NAO sensiveis (nome/tipo do negocio). NUNCA altera plano_tipo,
    // billing_cycle, status nem slug/banner/tema/etc. Sem nada para atualizar, nem faz a chamada.
    if (Object.keys(camposNaoSensiveis).length > 0) {
      const { error } = await supabase.from('perfis').update(camposNaoSensiveis).eq('user_id', d.userId)
      if (error) { console.error('[perfil-inicial] Erro ao atualizar perfil existente:', error.message); return { ok: false, erro: 'Erro ao atualizar perfil' } }
    }
    await registrarIndicacao()
    return { ok: true, criado: false }
  }

  const slugBase = gerarSlugBase(typeof d.nome_negocio === 'string' ? d.nome_negocio : '', d.userId)
  let slugTentativa = slugBase
  let tentativas = 0
  while (tentativas < 3) {
    // pagina_mostrar_agenda:false so no INSERT de perfil novo (sobrescreveria contas antigas se fosse num update).
    const { error } = await supabase.from('perfis').insert({ user_id: d.userId, slug: slugTentativa, pagina_mostrar_agenda: false, ...camposNaoSensiveis, ...camposDoPlano })
    if (!error) { await registrarIndicacao(); return { ok: true, criado: true, slug: slugTentativa } }
    if (error.code === '23505') {
      const sufixo = d.userId.replace(/-/g, '').slice(tentativas * 4, tentativas * 4 + 4)
      slugTentativa = `${slugBase}${sufixo}`
      tentativas++
      continue
    }
    console.error('[perfil-inicial] Erro ao criar perfil:', error.message)
    return { ok: false, erro: 'Erro ao criar perfil' }
  }
  console.error('[perfil-inicial] Nao foi possivel gerar slug unico apos tentativas')
  return { ok: false, erro: 'Erro ao gerar link unico' }
}
