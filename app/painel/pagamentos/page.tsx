'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function PagamentosRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/painel/financeiro?aba=pagamentos') }, [router])
  return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Redirecionando...</p>
    </div>
  )
}
