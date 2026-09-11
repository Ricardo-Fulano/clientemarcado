import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // /pos-confirmacao decide pra onde mandar o cliente (Free direto pro painel, pago
  // aguardando pagamento mostra a escolha Cartao/Pix, pago ja liberado direto pro painel) -
  // nunca mais direto pro /painel, que so mostraria a tela de bloqueio sem a escolha de metodo.
  return NextResponse.redirect(`${origin}/pos-confirmacao`)
}
