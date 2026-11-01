// Limitador em memoria (por instancia serverless) para conter inundacao ANTES de qualquer consulta ao banco.
// Janela fixa de 60 s. Complementa (nao substitui) uma regra de rate limit no Firewall da Vercel.
interface Janela { inicio: number; total: number; falhas: number }
const JANELA_MS = 60_000
const MAX_CHAVES = 5000
const mapa = new Map<string, Janela>()

function obter(chave: string, agora: number): Janela {
  let j = mapa.get(chave)
  if (!j || agora - j.inicio >= JANELA_MS) {
    if (!j && mapa.size >= MAX_CHAVES) {
      const mais_antiga = mapa.keys().next().value
      if (mais_antiga !== undefined) mapa.delete(mais_antiga)
    }
    j = { inicio: agora, total: 0, falhas: 0 }
    mapa.set(chave, j)
  }
  return j
}
export const LIMITE_REQUISICOES_POR_MINUTO = 300
export const LIMITE_FALHAS_POR_MINUTO = 20
// Conta a requisicao e diz se ja estourou (total ou falhas de assinatura).
export const LIMITE_REQUISICOES_POR_MINUTO_POR_IP = 600
export function registrarEChecar(chave: string, agora: number, limiteTotal: number = LIMITE_REQUISICOES_POR_MINUTO): boolean {
  const j = obter(chave, agora)
  j.total++
  return j.total <= limiteTotal && j.falhas < LIMITE_FALHAS_POR_MINUTO
}
export function registrarFalha(chave: string, agora: number): void { obter(chave, agora).falhas++ }
export function __limparLimitador(): void { mapa.clear() }
