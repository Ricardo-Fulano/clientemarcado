import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { permiteCatalogoWhatsapp } from '../../../lib/planos'

// Rota PUBLICA (chamada por visitantes anonimos da pagina publica, nunca logados) - por
// isso usa service role pra inserir (nao existe policy de INSERT direta na tabela,
// so a service role consegue gravar, evitando que qualquer pessoa insira leads falsos
// direto no banco via requisicao manipulada ao Supabase).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { slug, email, origem, item_tipo, item_id, item_titulo } = body

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug inválido' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Busca o perfil pelo slug - so precisamos do user_id/plano_tipo/captacao_leads_ativa,
    // nunca expostos de volta pro visitante.
    const { data: perfil } = await supabase
      .from('perfis')
      .select('user_id, plano_tipo, captacao_leads_ativa')
      .eq('slug', slug)
      .maybeSingle()

    if (!perfil) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
    }

    // Mesma funcao ja usada pra liberar WhatsApp no catalogo (Loja/Pro/Equipe) - reutilizada
    // sem inventar regra paralela, como pedido.
    if (!permiteCatalogoWhatsapp(perfil.plano_tipo)) {
      return NextResponse.json({ error: 'Recurso não disponível para este plano' }, { status: 403 })
    }
    if (!perfil.captacao_leads_ativa) {
      return NextResponse.json({ error: 'Captação de leads desativada' }, { status: 403 })
    }

    // Duplicidade: se o e-mail ja existe pra esse dono, so atualiza origem/item (nao falha,
    // nao cria linha nova) - evita lead duplicado descontrolado.
    const emailLimpo = email.trim().toLowerCase()
    const { data: existente } = await supabase
      .from('minipage_leads')
      .select('id')
      .eq('user_id', perfil.user_id)
      .eq('email', emailLimpo)
      .maybeSingle()

    if (existente) {
      await supabase.from('minipage_leads').update({
        origem: origem || null,
        item_tipo: item_tipo || null,
        item_id: item_id ? String(item_id) : null,
        item_titulo: item_titulo || null,
      }).eq('id', existente.id)
      return NextResponse.json({ ok: true })
    }

    const userAgent = request.headers.get('user-agent') || null
    const { error: erroInsert } = await supabase.from('minipage_leads').insert({
      perfil_id: perfil.user_id,
      user_id: perfil.user_id,
      email: emailLimpo,
      origem: origem || null,
      item_tipo: item_tipo || null,
      item_id: item_id ? String(item_id) : null,
      item_titulo: item_titulo || null,
      slug,
      consentimento: true,
      consentimento_texto: 'Ao enviar, você aceita receber contatos e novidades desta página.',
      user_agent: userAgent,
    })

    if (erroInsert) {
      console.error('[Leads] Erro ao inserir lead:', erroInsert.message)
      return NextResponse.json({ error: 'Não foi possível salvar agora' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Leads] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
