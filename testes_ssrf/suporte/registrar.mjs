import { register } from 'node:module'
/** Registra o carregador de testes. Chame ANTES de importar (dinamicamente) qualquer modulo de app/. */
export function registrarCarregador(aliases = {}) { register('./carregador.mjs', import.meta.url, { data: { aliases } }) }
export const url = (arquivo) => new URL(arquivo, import.meta.url).href
