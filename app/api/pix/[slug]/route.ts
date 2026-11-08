import { normalizarSlug } from '../../../lib/cartao'
import { validarPayloadPix } from '../../../lib/pix'
import { caminhoQr } from '../../../lib/qr'
import { buscarCodigoPix } from '../../../lib/pix-servidor'

// Dados PUBLICOS do Pix de UMA MiniPage, buscados SOB DEMANDA quando o visitante toca no card (o codigo nao vai no HTML da pagina publica).
// Fonte: funcao SQL pix_publico_codigo(slug) chamada SOMENTE pelo servidor (lib/pix-servidor): o banco nao oferece listagem nem consulta publica do Pix.
// Revalida o payload (CRC/estrutura) antes de servir e responde 404 identico para slug invalido, inexistente ou Pix inativo. Somente leitura: nenhuma rota publica escreve.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const naoEncontrado = () => new Response(JSON.stringify({ error: 'nao_encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
  const { slug: bruto } = await ctx.params
  const slug = normalizarSlug(bruto)
  if (!slug) return naoEncontrado()
  const pix = await buscarCodigoPix(slug)
  if (!pix) return naoEncontrado()
  const v = validarPayloadPix(pix.payload)
  if (!v.ok) return naoEncontrado() // nunca serve um codigo invalido
  const qr = caminhoQr(v.payload)
  return new Response(JSON.stringify({ titulo: pix.titulo || 'Receber por Pix', descricao: pix.descricao || '', nome: v.nome, cidade: v.cidade, payload: v.payload, qrCaminho: qr.d, qrTamanho: qr.tamanho }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' },
  })
}
