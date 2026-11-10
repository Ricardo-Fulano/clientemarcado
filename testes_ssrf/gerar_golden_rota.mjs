// REGENERA rota-regressao.golden.json a partir do route.ts ORIGINAL (antes da B1) com fetch SIMULADO (nenhuma rede). Uso:
//   git show cf8cbfbbb79e0178b164cb983f7c4f56d858b0ad:app/api/catalogo/preview-link/route.ts > "%TEMP%\route.original.ts"
//   node --no-warnings testes_ssrf/gerar_golden_rota.mjs "%TEMP%\route.original.ts"
import { writeFileSync, copyFileSync, mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { registrarCarregador, url } from './suporte/registrar.mjs'
const origem = process.argv[2]
if (!origem) { console.error('Informe o caminho do route.ts ORIGINAL.'); process.exit(2) }
registrarCarregador({ 'next/server': url('./next-server-stub.mjs') })
const { responder, CASOS, CASOS_INVALIDOS } = await import('./suporte/fixtures.mjs')
const pasta = mkdtempSync(path.join(tmpdir(), 'rota-original-')); const destino = path.join(pasta, 'route.ts'); copyFileSync(origem, destino)
globalThis.fetch = async (u) => { const r = responder(String(u)); return new Response(typeof r.corpo === 'string' ? r.corpo : JSON.stringify(r.corpo), { status: r.status, headers: { 'content-type': r.tipo === 'json' ? 'application/json' : 'text/html; charset=utf-8' } }) }
const { POST } = await import(pathToFileURL(destino).href)
const saida = []
for (const c of [...CASOS, ...CASOS_INVALIDOS]) {
  const corpo = c.semCampo ? {} : { url: c.url, ...(c.tipo ? { tipo: c.tipo } : {}) }
  const r = await POST(new Request('http://localhost/api/catalogo/preview-link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) }))
  saida.push({ id: c.id, entrada: corpo, status: r.status, corpo: await r.json() })
}
writeFileSync(path.join(import.meta.dirname, 'rota-regressao.golden.json'), JSON.stringify(saida, null, 1))
console.log(`golden gerado: ${saida.length} casos (${saida.filter((s) => s.corpo.success).length} com success:true)`)
