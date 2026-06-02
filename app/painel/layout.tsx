'use client'
import AcessoGuard from '../components/AcessoGuard'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <AcessoGuard>{children}</AcessoGuard>
}
