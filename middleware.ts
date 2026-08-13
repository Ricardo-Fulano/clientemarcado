import { NextRequest, NextResponse } from 'next/server'

// So atua na raiz do dominio minipage.pro (o link curto das paginas publicas).
// Todas as outras rotas (incluindo /@slug e /slug) passam direto, sem nenhuma alteracao.
// clientemarcado.com.br nunca entra nesse bloco, entao continua 100% como estava.
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const ehMinipage = host.toLowerCase().includes('minipage.pro')
  const pathname = decodeURIComponent(request.nextUrl.pathname)
  const ehRaiz = pathname === '/'

  if (ehMinipage && ehRaiz) {
    return NextResponse.redirect('https://clientemarcado.com.br')
  }

  // /@slug continua funcionando (compatibilidade), mas o link oficial divulgado agora e
  // sem @. Redireciona automaticamente pra manter só um link "canônico" sendo usado,
  // em qualquer dominio (minipage.pro ou clientemarcado.com.br). Cobre tambem /@slug/agendar.
  if (pathname.startsWith('/@')) {
    const novaUrl = request.nextUrl.clone()
    novaUrl.pathname = '/' + pathname.slice(2)
    return NextResponse.redirect(novaUrl, 308)
  }

  return NextResponse.next()
}

// Roda pra todas as rotas, exceto arquivos estaticos/internos do Next — a logica interna
// acima ja garante que so a raiz do minipage.pro e as rotas /@slug sofrem redirecionamento.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
