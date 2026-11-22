import { NextRequest, NextResponse } from 'next/server'
/** Somente sugestao visual. Cabeçalhos de pais nao sao comprovante de residencia
 * e NUNCA devem decidir valores de pagamento no servidor. */
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const raw = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || ''
  const pais = /^[A-Z]{2}$/.test(raw.toUpperCase()) ? raw.toUpperCase() : null
  return NextResponse.json({pais}, {headers:{'Cache-Control':'private, no-store'}})
}
