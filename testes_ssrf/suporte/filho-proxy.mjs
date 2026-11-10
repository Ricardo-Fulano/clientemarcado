// Processo filho dos testes: roda o fetchSeguro com variaveis de PROXY por ambiente apontando para uma porta morta e imprime o resultado em JSON.
import { registrarCarregador } from './registrar.mjs'
registrarCarregador()
const { criarFabrica } = await import('./fabrica.mjs')
const porta = process.argv[2]
const f = await criarFabrica(); f.tabela.set('publico.teste', ['127.0.0.1'])
const r = await f.fetchSeguro(`http://publico.teste:${porta}/`)
process.stdout.write(JSON.stringify({ ok: r.ok, motivo: r.motivo ?? null, corpo: r.ok ? await r.text() : null, proxy: process.env.HTTP_PROXY, usaEnv: process.env.NODE_USE_ENV_PROXY }))
