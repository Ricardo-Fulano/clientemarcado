- setOrcamentos(data||[])
+ setOrcamentos((data||[]).filter((o:any)=>o.origem!=='cobranca_manual'))observacoes:observacoes||null,updated_at:new Date().toISOString(),
+       origem:'orcamento','use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NovoOrcamento() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/painel/orcamentos?novo=1')
  }, [router])
  return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p>
    </div>
  )
}
