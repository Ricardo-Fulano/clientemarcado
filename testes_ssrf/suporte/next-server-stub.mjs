// Duplo de 'next/server' para testes em Node puro: NextResponse.json devolve uma Response padrao.
export const NextResponse = { json: (corpo, init) => Response.json(corpo, init) }
