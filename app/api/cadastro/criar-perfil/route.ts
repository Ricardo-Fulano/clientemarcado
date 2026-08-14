import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// UUID v4-like check (aceita qualquer versao de UUID valido, formato padrao)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Gera um slug inicial a partir do nome do negocio (o usuario pode trocar depois em Configuracoes).
// Mesma ideia de normalizacao usada em app/painel/perfil/page.tsx, mas sem hifen (so letras/numeros),
// pra reduzir chance de colisao e manter o link curto.
function gerarSlugBase(nome: string, userId: string) {
  const limpo = (nome || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30)
  return limpo || ('negocio' + userId.replace(/-/g, '').slice(0, 8))
}

// Rota chamada logo apos o cadastro (supabase.auth.signUp) dar certo.
// Objetivo: garantir que nome_negocio, tipo_negocio e plano_tipo cheguem em `perfis`,
// ja que nao existe nenhum trigger/funcao no banco que faca essa copia automaticamente
// (confirmado via diagnostico: nenhum trigger de auth.users->perfis, so o
// trigger_set_trial que preenche trial_ends_at/status_acesso quando a linha e inserida).
//
// IMPORTANTE: `perfis.slug` e obrigatorio (NOT NULL) e unico (UNIQUE). Como slug hoje so e
// definido manualmente pela usuaria em Configuracoes, uma conta recem-criada ainda nao tem
// slug nenhum. Por isso:
//   - se JA existe uma linha em perfis pra esse user_id, so atualizamos os 3 campos (nunca
//     tocamos em slug, banner, tema, horarios, status_acesso, trial_ends_at, etc.)
//   - se NAO existe, criamos a linha com um slug inicial gerado a partir do nome do negocio,
//     que a usuaria pode trocar a qualquer momento em Configuracoes (fluxo ja existente)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })

    const { user_id, nome_negocio, tipo_negocio, plano_tipo } = body

    if (!user_id || typeof user_id !== 'string' || !UUID_REGEX.test(user_id)) {
      return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })
    }

    // plano_tipo aceita 'equipe' e 'minipage' explicitamente; qualquer outra coisa vira 'essencial'
    const planoValido = plano_tipo === 'equipe' ? 'equipe' : plano_tipo === 'minipage' ? 'minipage' : 'essencial'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const camposComuns: Record<string, any> = { plano_tipo: planoValido }
    if (nome_negocio && typeof nome_negocio === 'string') camposComuns.nome_negocio = nome_negocio
    if (tipo_negocio && typeof tipo_negocio === 'string') camposComuns.tipo_negocio = tipo_negocio

    const { data: existente } = await supabase.from('perfis').select('id').eq('user_id', user_id).maybeSingle()

    if (existente) {
      // Perfil ja existe: so atualiza os 3 campos. Nunca mexe em slug/banner/tema/etc.
      const { error } = await supabase.from('perfis').update(camposComuns).eq('user_id', user_id)
      if (error) {
        console.error('[criar-perfil] Erro ao atualizar perfil existente:', error.message)
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, criado: false })
    }

    // Perfil novo: precisa de slug (unico) pra passar na constraint do banco
    const slugBase = gerarSlugBase(nome_negocio, user_id)
    let slugTentativa = slugBase
    let tentativas = 0

    while (tentativas < 3) {
      const { error } = await supabase.from('perfis').insert({ user_id, slug: slugTentativa, ...camposComuns })
      if (!error) {
        return NextResponse.json({ ok: true, criado: true, slug: slugTentativa })
      }
      if (error.code === '23505') {
        // slug colidiu com outro negocio: tenta de novo com um sufixo diferente
        const sufixo = user_id.replace(/-/g, '').slice(tentativas * 4, tentativas * 4 + 4)
        slugTentativa = `${slugBase}${sufixo}`
        tentativas++
        continue
      }
      console.error('[criar-perfil] Erro ao criar perfil:', error.message)
      return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 })
    }

    console.error('[criar-perfil] Nao foi possivel gerar slug unico apos tentativas')
    return NextResponse.json({ error: 'Erro ao gerar link unico' }, { status: 500 })
  } catch (err) {
    console.error('[criar-perfil] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
