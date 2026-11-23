import { notFound } from 'next/navigation'
import SimuladorCheckoutGlobalClient from './SimuladorCheckoutGlobalClient'

/** Somente localhost (next dev); rota intencionalmente inacessível em produção. */
export const dynamic = 'force-dynamic'
export default function SimuladorCheckoutGlobal() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <SimuladorCheckoutGlobalClient />
}
