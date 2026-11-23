'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type PaddleApi={ Environment:{set:(v:'sandbox')=>void}; Initialize:(v:{token:string})=>void;
  Checkout:{open:(v:{transactionId:string})=>void} }
declare global {interface Window {Paddle?:PaddleApi}}
const supabaseUrl=process.env.NEXT_PUBLIC_PADDLE_TEST_SUPABASE_URL ?? ''
const anonKey=process.env.NEXT_PUBLIC_PADDLE_TEST_SUPABASE_ANON_KEY ?? ''
const clientToken=process.env.NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN ?? ''

export default function PaddleSandboxTeste(){
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [erro,setErro]=useState('')
 const [estado,setEstado]=useState('Entre com o usuario ficticio criado no Supabase de testes.')
 const [logado,setLogado]=useState(false)
 const [ocupado,setOcupado]=useState(false)
 const [jsPronto,setJsPronto]=useState(false)
 const [transactionId,setTransactionId]=useState<string|null>(null)
 const db=useRef<SupabaseClient|null>(null)
 const initialized=useRef(false)
 const attempt=useRef<string|null>(null)
 const storageKey='minipage_paddle_sandbox_attempt_v1'
 useEffect(()=>{
  if(!supabaseUrl||!anonKey)return
  db.current=createClient(supabaseUrl,anonKey,{auth:{persistSession:false,autoRefreshToken:false}})
 },[])
 const inicializar=useCallback(()=>{
  if(!jsPronto||!clientToken.startsWith('test_')||!window.Paddle)return
  if(initialized.current)return
  window.Paddle.Environment.set('sandbox')
  window.Paddle.Initialize({token:clientToken})
  initialized.current=true
 },[jsPronto])
 useEffect(()=>{inicializar()},[inicializar])
 async function entrar(){
  setErro('');setOcupado(true)
  try{
   if(!db.current)throw new Error('Configure as variaveis publicas de teste.')
   const {error}=await db.current.auth.signInWithPassword({email,password})
   if(error)throw new Error('Login invalido no banco de TESTES.')
   setLogado(true);setPassword('');setEstado('Autenticado somente no banco isolado de testes.')
  }catch(e){setErro(e instanceof Error?e.message:'Falha de login')}
  finally{setOcupado(false)}
 }
 async function comprar(){
  setErro('');setOcupado(true)
  try{
   if(!db.current)throw new Error('Cliente de teste nao configurado.')
   const {data:{session}}=await db.current.auth.getSession()
   if(!session)throw new Error('Faca login novamente.')
   if(!attempt.current){
    attempt.current=sessionStorage.getItem(storageKey)||crypto.randomUUID()
    sessionStorage.setItem(storageKey,attempt.current)
   }
   setEstado('Reservando e criando transacao na Paddle Sandbox...')
   const response=await fetch('/api/billing/paddle/local-sandbox-checkout',{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},
    body:JSON.stringify({attemptId:attempt.current})})
   const data=await response.json().catch(()=>null)
   if(!response.ok||data?.estado!=='pronto'){
    throw new Error(data?.mensagem||data?.error||'Checkout nao disponivel. Nao repita automaticamente.')
   }
   if(!/^txn_[a-z0-9]{26}$/.test(data.transactionId))throw new Error('Transacao sem ID valido.')
   setTransactionId(data.transactionId)
   setEstado(data.reused?'Transacao existente recuperada.':'Transacao Sandbox criada.')
   inicializar()
   if(!window.Paddle || !initialized.current) throw new Error('Paddle.js ainda nao carregado. Use Abrir checkout apos carregar.')
   window.Paddle.Checkout.open({transactionId:data.transactionId})
  }catch(e){setErro(e instanceof Error?e.message:'Falha na tentativa')}
  finally{setOcupado(false)}
 }
 const style={background:'#0b1020',color:'#e2e8f0',minHeight:'100vh',padding:32,fontFamily:'system-ui'} as const
 return <main style={style}>
  <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onLoad={()=>setJsPronto(true)}/>
  <div style={{maxWidth:520,margin:'40px auto',padding:28,border:'1px solid #334155',borderRadius:16}}>
   <h1 style={{fontSize:24,fontWeight:750}}>Checkout Paddle — Sandbox</h1>
   <p style={{color:'#fbbf24'}}>Somente testes locais. Nenhum pagamento real e nenhuma ativacao de planos.</p>
   <p>{estado}</p>
   {!logado?<>
    <label style={{display:'block',marginTop:14}}>E-mail ficticio de teste</label>
    <input style={{width:'100%',padding:12,color:'#111'}} value={email} onChange={e=>setEmail(e.target.value)}/>
    <label style={{display:'block',marginTop:14}}>Senha de teste</label>
    <input type="password" style={{width:'100%',padding:12,color:'#111'}} value={password} onChange={e=>setPassword(e.target.value)}/>
    <button disabled={ocupado} onClick={entrar} style={{padding:12,marginTop:18}}>Entrar no banco isolado</button>
   </>:<>
    <button disabled={ocupado||!jsPronto} onClick={comprar} style={{padding:14,marginTop:20}}>Iniciar pagamento de TESTE</button>
    {transactionId&&<button style={{marginLeft:10,padding:12}} onClick={()=>{
      inicializar();window.Paddle?.Checkout.open({transactionId})
    }}>Reabrir checkout</button>}
   </>}
   {erro&&<p role="alert" style={{color:'#fb7185'}}>{erro}</p>}
   <p style={{fontSize:12,color:'#94a3b8',marginTop:20}}>Se ocorrer erro de rede, nao inicie outra tentativa: ela pode ter sido criada na Paddle.</p>
  </div>
 </main>
}
