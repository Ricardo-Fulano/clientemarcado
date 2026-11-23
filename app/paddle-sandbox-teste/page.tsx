import { notFound } from 'next/navigation'
import CheckoutLocalClient from './CheckoutLocalClient'

/** Bloqueia a pagina completamente em Preview e producao. */
export default function Page(){
  if (process.env.NODE_ENV !== 'development' || process.env.VERCEL_ENV ||
      process.env.MINIPAGE_PADDLE_LOCAL_E2E_ENABLED !== 'true' ||
      process.env.PADDLE_ENVIRONMENT !== 'sandbox') notFound()
  return <CheckoutLocalClient />
}
