// Utilitarios SOMENTE de navegador do cartao (copiar e baixar o QR Code). Sem React, sem dependencias.

export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const t = document.createElement('textarea')
      t.value = texto
      t.setAttribute('readonly', '')
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(t)
      return ok
    } catch {
      return false
    }
  }
}

export function svgDoQr(caminho: string, tamanho: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tamanho} ${tamanho}" width="1024" height="1024" shape-rendering="crispEdges"><rect width="${tamanho}" height="${tamanho}" fill="#ffffff"/><path d="${caminho}" fill="#000000"/></svg>`
}

export async function baixarQrPng(caminho: string, tamanho: number, nomeArquivo: string): Promise<boolean> {
  try {
    const url = URL.createObjectURL(new Blob([svgDoQr(caminho, tamanho)], { type: 'image/svg+xml' }))
    const img = new Image()
    // limite de tempo: se o navegador nunca disparar load/error, o usuario recebe retorno (falha) em vez de um botao que "nao faz nada"
    await new Promise<void>((ok, erro) => {
      const t = setTimeout(() => erro(new Error('timeout')), 8000)
      img.onload = () => { clearTimeout(t); ok() }
      img.onerror = () => { clearTimeout(t); erro(new Error('img')) }
      img.src = url
    })
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 1024
    const ctx = c.getContext('2d')
    if (!ctx) return false
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, 1024, 1024)
    URL.revokeObjectURL(url)
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/png'))
    if (!blob) return false
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = nomeArquivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    return true
  } catch {
    return false
  }
}
