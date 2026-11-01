// URL do webhook mostrada ao usuario. Usa SEMPRE o host canonico (constante), nunca o host da requisicao:
// o middleware redireciona www.minipage.pro -> minipage.pro (308) e a Kiwify NAO segue redirecionamento.
// Sem imports de Node: pode ser usado no navegador e no servidor.
export const HOST_CANONICO_WEBHOOK = 'https://minipage.pro'

export function urlDoWebhook(provider: string, publicId: string): string {
  return `${HOST_CANONICO_WEBHOOK}/api/integracoes/webhook/${encodeURIComponent(provider)}/${encodeURIComponent(publicId)}`
}
