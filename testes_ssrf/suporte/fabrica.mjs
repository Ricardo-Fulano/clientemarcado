// Fabrica de teste do fetchSeguro: resolver FALSO (por nome), enderecos 127.0.0.1/::1 tratados como "publicos" SOMENTE aqui, e a regra de porta relaxada (servidores locais usam portas aleatorias).
// As demais regras (esquema, host, IP literal) sao as REAIS. O codigo de producao nao tem nenhuma dessas permissoes.
export async function criarFabrica(opcoesExtras = {}) {
  const { criarFetchSeguro } = await import('../../app/lib/seguranca/fetch-seguro.ts')
  const { validarUrlExterna, ipEhPublico } = await import('../../app/lib/seguranca/url-externa.ts')
  const tabela = new Map(); const chamadasResolver = []
  const resolver = async (host) => { chamadasResolver.push(host); const r = tabela.get(host); const resp = typeof r === 'function' ? r(chamadasResolver.filter((h) => h === host).length) : r; if (!resp) { const e = new Error('nao encontrado'); e.code = 'ENOTFOUND'; throw e } return resp.map((a) => ({ address: a, family: a.includes(':') ? 6 : 4 })) }
  const ehPublico = (ip) => ip === '127.0.0.1' || ip === '::1' || ipEhPublico(ip)
  const validarUrl = (entrada) => { let u; try { u = new URL(entrada) } catch { return { ok: false, motivo: 'invalida' } } const porta = u.port; u.port = ''; const r = validarUrlExterna(u.toString()); if (!r.ok) return r; return { ok: true, url: new URL(entrada), hostname: r.hostname, ehIp: r.ehIp, _porta: porta } }
  const fetchSeguro = criarFetchSeguro({ resolver, ehPublico, validarUrl, ...opcoesExtras })
  return { fetchSeguro, tabela, chamadasResolver, validarUrl, ehPublico }
}
