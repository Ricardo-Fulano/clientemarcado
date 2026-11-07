// QR Code: matriz de modulos + caminho SVG. Usa o gerador MIT vendored em ./vendor (sem dependencia nova).
// Regras: texto ASCII (as URLs do cartao sao percent-encoded), nivel de correcao M, zona de silencio de 4 modulos (exigida pela norma),
// preto sobre branco (alto contraste, lido pelas cameras nativas de Android e iPhone).
import qrcode from './vendor/qrcode-generator.mjs'

export type NivelQr = 'L' | 'M' | 'Q' | 'H'

export function matrizQr(texto: string, nivel: NivelQr = 'M'): boolean[][] {
  if (typeof texto !== 'string' || texto.length === 0 || texto.length > 1000) throw new Error('texto invalido para QR Code')
  if (/[^\x20-\x7e]/.test(texto)) throw new Error('o texto do QR Code deve ser ASCII (use percent-encoding)')
  const qr = qrcode(0, nivel) // 0 = escolhe o menor tipo que comporta o texto
  qr.addData(texto, 'Byte')
  qr.make()
  const n = qr.getModuleCount()
  const m: boolean[][] = []
  for (let r = 0; r < n; r++) {
    const linha: boolean[] = []
    for (let c = 0; c < n; c++) linha.push(qr.isDark(r, c))
    m.push(linha)
  }
  return m
}

export const ZONA_SILENCIO = 4

/** Caminho SVG unico (corridas horizontais de modulos escuros) + lado do viewBox, ja incluindo a zona de silencio. */
export function caminhoQr(texto: string, nivel: NivelQr = 'M'): { d: string; tamanho: number } {
  const m = matrizQr(texto, nivel)
  const q = ZONA_SILENCIO
  let d = ''
  for (let r = 0; r < m.length; r++) {
    const linha = m[r] as boolean[]
    let c = 0
    while (c < linha.length) {
      if (!linha[c]) { c++; continue }
      let fim = c
      while (fim < linha.length && linha[fim]) fim++
      d += `M${c + q} ${r + q}h${fim - c}v1h${c - fim}z`
      c = fim
    }
  }
  return { d, tamanho: m.length + q * 2 }
}

/** SVG completo e autonomo (para download/impressao). Fundo branco explicito: nunca depende do tema da pagina. */
export function svgQr(texto: string, nivel: NivelQr = 'M'): string {
  const { d, tamanho } = caminhoQr(texto, nivel)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tamanho} ${tamanho}" width="${tamanho * 8}" height="${tamanho * 8}" shape-rendering="crispEdges"><rect width="${tamanho}" height="${tamanho}" fill="#ffffff"/><path d="${d}" fill="#000000"/></svg>`
}
