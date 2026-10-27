import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { criarPerfilInicial } from '../../../lib/perfil-inicial'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LIMITE_POR_USUARIO = { max: 10, janelaSeg: 600 }   // 10 chamadas por usuario em 10 min
const NOME_MAX = 80
const CONTROLE_REGEX = /[\u0000-\u001F\u007F-\u009F]/g

// Cria um perfil FREE para a PROPRIA pessoa logada, caso ainda nao exista (rede de seguranca do painel; o cadastro novo usa
// /api/cadastro/registrar). O dono vem SEMPRE da sessao (Bearer).
//
// SEGURANCA (P1, etapa A): o navegador NAO faz mais INSERT em "perfis"; esta e a unica porta de criacao automatica.
//  - o corpo da requisicao e IGNORADO (nenhum plano, ciclo, nome, cupom ou user_id vindo do navegador entra aqui);
//  - o plano e SEMPRE 'free' (fixo no servidor); o nome vem do user_metadata lido AQUI, so para exibicao;
//  - perfil que ja existe NAO e alterado (nem plano, nem status, nem ciclo, nem nome);
//  - profissional de equipe ativo NAO ganha perfil proprio (a regra vale aqui, e nao so na tela);
//  - limite de frequencia por usuario (checar_rate_limit; fail-open com log alto se a funcao falhar).
// Respostas: 200 {ok, criado, slug?, motivo?}, 401 sessao, 429 limite, 500 erro (mensagem generica).
function nomeDoNegocio(meta: unknown): string {
  const m = meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {}
  const bruto = typeof m.nome_negocio === 'string' && m.nome_negocio.trim() ? m.nome_negocio : typeof m.nome_usuario === 'string' ? m.nome_usuario : ''
  return bruto.replace(CONTROLE_REGEX, ' ').replace(/\s+/g, ' ').trim().slice(0, NOME_MAX) || 'Meu negócio'
}

async function dentroDoLimite(supabase: SupabaseClient, chave: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('checar_rate_limit', { p_chave: chave, p_max: LIMITE_POR_USUARIO.max, p_janela_segundos: LIMITE_POR_USUARIO.janelaSeg })
  if (error) { console.error('[criar-perfil] PERFIL_RATE_LIMIT_INDISPONIVEL', JSON.stringify({ erro: error.message })); return true }
  return data === true
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const bearer = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!bearer) return NextResponse.json({ error: 'Sessao obrigatoria' }, { status: 401 })
    const { data: sess, error: erroSess } = await supabase.auth.getUser(bearer)
    if (erroSess || !sess?.user) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })
    const userId = sess.user.id
    if (!UUID_REGEX.test(userId)) return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })

    if (!(await dentroDoLimite(supabase, 'criar-perfil:' + userId))) return NextResponse.json({ error: 'Muitas requisicoes' }, { status: 429 })

    // 1) perfil ja existe: nao altera NADA
    const { data: existente, error: erroExistente } = await supabase.from('perfis').select('id').eq('user_id', userId).maybeSingle()
    if (erroExistente) { console.error('[criar-perfil] PERFIL_CONSULTA_FALHOU', JSON.stringify({ erro: erroExistente.message })); return NextResponse.json({ error: 'Erro interno' }, { status: 500 }) }
    if (existente) return NextResponse.json({ ok: true, criado: false, motivo: 'JA_EXISTE' })

    // 2) profissional de equipe ativo nao ganha perfil proprio. Se a verificacao falhar, NAO cria (fail-closed).
    const { data: vinculos, error: erroVinculo } = await supabase.from('membros_equipe').select('profissional_id')
      .eq('auth_user_id', userId).eq('ativo', true).eq('role', 'profissional').limit(1)
    if (erroVinculo) { console.error('[criar-perfil] PERFIL_VERIFICACAO_EQUIPE_FALHOU', JSON.stringify({ erro: erroVinculo.message })); return NextResponse.json({ error: 'Erro interno' }, { status: 500 }) }
    if (vinculos && vinculos.length > 0) return NextResponse.json({ ok: true, criado: false, motivo: 'PROFISSIONAL_DE_EQUIPE' })

    // 3) cria FREE (plano e ciclo fixos no servidor)
    const r = await criarPerfilInicial(supabase, {
      userId, email: sess.user.email || '', nome_negocio: nomeDoNegocio(sess.user.user_metadata),
      plano_tipo: 'free', billing_cycle: null,
    })
    if (!r.ok) { console.error('[criar-perfil] PERFIL_CRIACAO_FALHOU', JSON.stringify({ erro: r.erro })); return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 }) }
    return NextResponse.json(r.criado ? { ok: true, criado: true, slug: r.slug } : { ok: true, criado: false, motivo: 'JA_EXISTE' })
  } catch (err) {
    console.error('[criar-perfil] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
