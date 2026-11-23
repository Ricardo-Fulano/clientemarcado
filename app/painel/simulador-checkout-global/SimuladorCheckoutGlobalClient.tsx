 'use client'
import {useMemo,useState} from 'react'
import {simularMercadoGlobal} from '../../lib/billing/multigateway/roteador'
import {propostaRegional} from '../../lib/billing/multigateway/regioes'
import {precoReferenciaCheckout} from '../../lib/billing/multigateway/precos-exibicao'
import {CORES_CHECKOUT as C} from '../../lib/billing/multigateway/checkout-visual'
import SeletorPaisCheckout from '../criar-minipage/SeletorPaisCheckout'

/** Laboratorio local: exibe SOMENTE escolha de pagamento; plano ja vem da etapa anterior. */
export default function SimuladorCheckoutGlobalClient(){
 const [pais,setPais]=useState('BR')
 const [metodo,setMetodo]=useState('')
 const plano='loja' as const
 const ciclo='mensal' as const
 const regiao=propostaRegional(pais)
 const simulacao=useMemo(()=>simularMercadoGlobal(plano,pais),[pais])
 const metodos=simulacao.situacao==='nao_habilitado'?simulacao.metodosCandidatos:[]
 const preco=precoReferenciaCheckout(plano,ciclo,pais)
 return <main style={{minHeight:'100vh',background:C.fundo,color:C.texto,padding:'30px 14px 50px',fontFamily:'system-ui,Arial,sans-serif'}}>
  <div style={{maxWidth:740,margin:'0 auto'}}>
   <p style={{fontSize:11,color:C.verde,letterSpacing:'.07em',fontWeight:800}}>MINIPAGE CHECKOUT · AMBIENTE DE DEMONSTRAÇÃO</p>
   <h1 style={{fontSize:'clamp(24px,4vw,33px)',fontWeight:900,margin:'9px 0'}}>Forma de pagamento</h1>
   <p style={{color:C.mutado,fontSize:13,lineHeight:1.6,margin:'0 0 24px'}}>O assinante escolhe o plano antes de chegar aqui. Esta página demonstra apenas os meios de pagamento recorrentes disponíveis por país.</p>
   <section style={{background:C.card,border:'1px solid '+C.borda,borderRadius:16,padding:21,marginBottom:14}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:15,alignItems:'start',flexWrap:'wrap'}}>
     <div><span style={{display:'block',color:C.mutado,fontSize:11}}>PLANO JÁ ESCOLHIDO</span><strong style={{fontSize:20}}>MiniPage Loja</strong><p style={{fontSize:12,color:C.mutado}}>Tudo do Agenda + catálogos, produtos, cursos e vendas.</p></div>
     <div style={{textAlign:'right'}}><strong style={{fontSize:23}}>{preco.texto}</strong><span style={{display:'block',color:C.mutado,fontSize:11}}>Mensal · {pais}</span></div>
    </div>
    <div style={{borderTop:'1px solid '+C.borda,marginTop:12,paddingTop:16}}><SeletorPaisCheckout pais={pais} onPais={p=>{setPais(p);setMetodo('')}}/><p style={{fontSize:11,color:C.mutado,marginTop:8}}>Faixa: {regiao.nomeFaixa}. País selecionável não é garantia de disponibilidade de cobrança.</p></div>
   </section>
   <section style={{background:C.card,border:'1px solid '+C.borda,borderRadius:16,padding:21}}>
    <h2 style={{fontSize:18,margin:'0 0 16px'}}>Como deseja pagar?</h2>
    {!metodos.length?<p style={{fontSize:13,color:C.alerta}}>Não há método recorrente documentado e habilitado neste mercado. A MiniPage Free continua disponível.</p>:<div style={{display:'grid',gap:10}}>{metodos.map(m=><label key={m.metodo} style={{display:'flex',alignItems:'start',gap:10,padding:14,background:metodo===m.metodo?C.verdeEscuro:C.cardElevado,border:'1px solid '+(metodo===m.metodo?C.verde:C.borda),borderRadius:12,cursor:'pointer'}}>
     <input type="radio" name="metodo-recorrente-demo" checked={metodo===m.metodo} onChange={()=>setMetodo(m.metodo)} style={{accentColor:C.verde,marginTop:3}}/>
     <span><strong style={{display:'block',fontSize:13}}>{m.nome}</strong><span style={{display:'block',fontSize:11,color:C.mutado,marginTop:4}}>{m.ressalva||'Autorização recorrente necessária.'}</span></span>
    </label>)}</div>}
    <div style={{marginTop:18,padding:'11px 13px',borderRadius:10,background:C.cardElevado,color:C.alerta,fontSize:12,lineHeight:1.5}}>Os métodos listados são candidatos. EBANX e Stripe aguardam credenciamento e homologação. Esta tela não inicia pagamentos.</div>
    <button type="button" disabled style={{display:'block',width:'100%',marginTop:14,padding:15,background:C.verde,color:'#111609',border:0,borderRadius:10,fontWeight:850,opacity:.45,cursor:'not-allowed'}}>Confirmar assinatura — aguardando habilitação</button>
   </section>
   <p style={{fontSize:11,color:C.mutado,lineHeight:1.6,marginTop:17}}>Simulador somente local. Nenhum pagamento, assinatura, webhook, SQL ou alteração de plano é executado. O preço internacional apresentado é apenas referência; os valores finais exigem cotação autorizada no servidor.</p>
  </div>
 </main>
}
