import type { ProviderAdapter } from '../tipos'
import { kiwifyAdapter } from './kiwify'

// Registro de provedores. Provedor novo = 1 arquivo + 1 linha aqui (sem migracao de banco, sem mudar painel nem modelo).
const ADAPTADORES: Readonly<Record<string, ProviderAdapter>> = { kiwify: kiwifyAdapter }

export function obterAdaptador(id: string): ProviderAdapter | null {
  return Object.prototype.hasOwnProperty.call(ADAPTADORES, id) ? ADAPTADORES[id] : null
}
export function idsDeProvedores(): string[] {
  return Object.keys(ADAPTADORES)
}
