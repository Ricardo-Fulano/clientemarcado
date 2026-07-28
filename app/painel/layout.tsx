import type { Metadata } from 'next'
import PainelLayoutClient from './PainelLayoutClient'

// Area privada: nao deve ser indexada pelo Google.
// Precisa ficar num Server Component (metadata nao pode ser exportada de Client Component),
// por isso a logica original (auth, trial, papel admin/profissional) foi movida,
// sem nenhuma alteracao, para PainelLayoutClient.tsx.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <PainelLayoutClient>{children}</PainelLayoutClient>
}
