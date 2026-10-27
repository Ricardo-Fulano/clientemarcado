import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validarEntrada, processarNotificacao } from '../../../lib/notificar-agendamento'

// Cria notificacoes de "novo agendamento" para a administradora e, se aplicavel, para a profissional vinculada.
// Chamada pela pagina publica de agendamento DEPOIS que o agendamento ja foi inserido - falha aqui nunca impede o agendamento
// (a pagina ignora a resposta).
//
// SEGURANCA (hotfix N2): rota PUBLICA com service_role. O corpo NAO e confiavel: so notifica se existir um agendamento real e
// recente correspondente, da mesma conta, dentro dos limites de frequencia (ver app/lib/notificar-agendamento.ts).
// Respostas: 400 corpo malformado, 429 limite de frequencia, 200 {ok:true} em todo o resto (uniforme: nao revela nada).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const entrada = validarEntrada(body)
    if (!entrada.ok) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null

    const r = await processarNotificacao(supabase, entrada.dados, { ip })
    if (r.limitado) return NextResponse.json({ error: 'Muitas requisicoes' }, { status: 429 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Nunca deixa isso "vazar" como erro critico - e so uma notificacao
    console.error('[publico/notificar-agendamento] Erro interno:', err)
    return NextResponse.json({ ok: true })
  }
}
