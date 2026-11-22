'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ConcluirSocial() {
 const [estado,setEstado] = useState('Conectando sua conta…')
 useEffect(()=>{let ativo=true;(async()=>{
  try {
   const {data:{session},error}=await supabase.auth.getSession()
   if (!session || error) {if(ativo)setEstado('Não foi possível confirmar o acesso. Tente entrar novamente.');return}
   // O cupom jamais altera o plano. O servidor só registra indicação ativa válida.
   let cupom=''
   try { cupom=(window.localStorage.getItem('cm_cupom')||'').trim().toUpperCase() }catch{}
   if (cupom && /^[A-Z0-9]{1,50}$/.test(cupom)) {
     const {error:e}=await supabase.auth.updateUser({data:{cupom_indicacao:cupom}})
     if(e){if(ativo)setEstado('Não foi possível preservar a indicação. Volte ao cadastro ou procure o suporte.');return}
   }
   const {data:{session:atual}}=await supabase.auth.getSession()
   if(!atual){if(ativo)setEstado('Sessão expirada. Entre novamente.');return}
   const res=await fetch('/api/cadastro/criar-perfil',{method:'POST',headers:{Authorization:`Bearer ${atual.access_token}`}})
   if(!res.ok){if(ativo)setEstado('Conta conectada, mas não foi possível preparar sua MiniPage. Procure o suporte.');return}
   try {window.localStorage.removeItem('cm_cupom')}catch{}
   window.location.replace('/contato-inicial')
  }catch{if(ativo)setEstado('Não foi possível concluir. Tente entrar novamente.')}})();return()=>{ativo=false}},[])
 return <main style={{minHeight:'100vh',background:'#0C0913',color:'#F6F2FC',display:'grid',placeItems:'center',padding:20}}><div role="status">{estado}<p><a href="/login" style={{color:'#C9FA45'}}>Entrar</a></p></div></main>
}
