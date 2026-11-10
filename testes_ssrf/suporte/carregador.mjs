// Hooks de resolucao de modulos, SOMENTE PARA OS TESTES: (1) completa importacoes relativas sem extensao (estilo Next) com .ts; (2) troca modulos por duplos de teste (aliases).
// Nada disto existe no codigo de producao.
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
let aliases = {}
export async function initialize(dados) { aliases = (dados && dados.aliases) || {} }
export async function resolve(especificador, contexto, proximo) {
  for (const [padrao, destino] of Object.entries(aliases)) if (especificador === padrao || especificador.endsWith('/' + padrao)) return { url: destino, shortCircuit: true }
  if ((especificador.startsWith('./') || especificador.startsWith('../')) && !path.extname(especificador) && contexto.parentURL) {
    const base = fileURLToPath(new URL(especificador, contexto.parentURL))
    for (const c of [base + '.ts', path.join(base, 'index.ts')]) if (existsSync(c)) return { url: pathToFileURL(c).href, shortCircuit: true }
  }
  return proximo(especificador, contexto)
}
