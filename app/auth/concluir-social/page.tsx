'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useIdiomaGlobal } from '../../components/IdiomaProviderGlobal'
import { googleCobrancaCopy } from '../../lib/i18n-global/google-cobranca'
import { auth27Copy } from '../../lib/i18n-global/auth-27'
import { resolverDestinoLogin } from '../../lib/destino-login-social'

type Flow={kind:'login'|'signup';search?:string;accepted?:boolean;cupom?:string;at:number}
function readFlow():Flow|null{try{const raw=sessionStorage.getItem('mp25_google_flow');if(!raw)return null;const f=JSON.parse(raw);return (f.kind==='login'||f.kind==='signup')&&typeof f.at==='number'&&Date.now()-f.at>=0&&Date.now()-f.at<1800000?f:null}catch{return null}}
export default function ConcluirSocial(){
 const {idioma}=useIdiomaGlobal(), t=googleCobrancaCopy(idioma)
 const [state,setState]=useState<'loading'|'terms'|'error'>('loading'),[accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false)
 const ran=useRef(false),flow=useRef<Flow|null>(null),lock=useRef(false)
 async function finish(consent:boolean){
  if(lock.current)return;lock.current=true;setBusy(true)
  try{
   const params=new URLSearchParams(window.location.search),hash=new URLSearchParams(window.location.hash.slice(1));if(params.has('error')||hash.has('error'))throw Error('OAUTH_ERROR')
   const {data:{session}}=await supabase.auth.getSession()
   if(!session)throw Error('SESSION')
   const {data:{user},error}=await supabase.auth.getUser()
   if(error||!user||user.id!==session.user.id)throw Error('USER')
   const f=flow.current
   const res=await fetch('/api/cadastro/criar-perfil',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({termos:consent,cupom:f?.kind==='signup'?f.cupom:null})})
   const result=await res.json()
   if(res.status===428&&result.codigo==='TERMOS_SOCIAL'){setState('terms');return}
   if(!res.ok||result.ok!==true)throw Error('PROFILE')
   sessionStorage.removeItem('mp25_google_flow');localStorage.removeItem('cm_cupom')
   if(result.criado===true){window.location.replace('/contato-inicial');return}
   window.location.replace(await resolverDestinoLogin(f?.kind==='login'?f.search||'':'',session.access_token))
  }catch{setState('error')}finally{lock.current=false;setBusy(false)}
 }
 useEffect(()=>{if(ran.current)return;ran.current=true;flow.current=readFlow();void finish(flow.current?.kind==='signup'&&flow.current.accepted===true)},[])
 return <main style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,#21182D,#0B0A10 70%)',color:'#fff',display:'grid',placeItems:'center',padding:20}}><section style={{width:'100%',maxWidth:420,background:'#21182D',padding:24,border:'1px solid #443451',borderRadius:20,boxSizing:'border-box'}}>
 <strong style={{color:'#C9FA45'}}>MiniPage Pro</strong>
 {state==='loading'&&<p role="status" style={{marginTop:20}}>{t[2]}</p>}
 {state==='terms'&&<><h1 style={{fontSize:23,margin:'20px 0'}}>{t[5]}</h1><label style={{display:'flex',gap:10,lineHeight:1.5}}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>{t[6]}</span></label><p style={{margin:'14px 0'}}><a href="/termos-de-uso" target="_blank" rel="noreferrer" style={{color:'#C9FA45'}}>{t[14]}</a> · <a href="/politica-de-privacidade" target="_blank" rel="noreferrer" style={{color:'#C9FA45'}}>{t[15]}</a></p><button type="button" disabled={!accepted||busy} onClick={()=>finish(true)} style={{width:'100%',background:'#C9FA45',color:'#0B0A10',padding:13,border:0,borderRadius:12,fontWeight:700}}>{busy?t[2]:t[5]}</button></>}
 {state==='error'&&<div role="alert" style={{marginTop:20}}><p>{t[3]}</p><p style={{marginTop:10,color:'#C5BCD1'}}>{auth27Copy(idioma).legacy}</p></div>}
 <button type="button" onClick={async()=>{await supabase.auth.signOut();sessionStorage.removeItem('mp25_google_flow');window.location.replace('/login')}} style={{background:'none',border:0,color:'#C9FA45',marginTop:20,cursor:'pointer'}}>{t[7]}</button>
 </section></main>
}
