'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import EditorVideos from './EditorVideos'
import SecoesVideos from './SecoesVideos'

type Acesso = 'carregando' | 'free' | 'pago' | 'erro'
export default function PaginaVideos(){
  const [acesso,setAcesso]=useState<Acesso>('carregando')
  useEffect(()=>{
    let ativo=true
    async function carregar(){
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){window.location.href='/login';return}
      const {data,error}=await supabase.from('perfis').select('plano_tipo,status_acesso').eq('user_id',user.id).maybeSingle()
      if(!ativo)return
      if(error||!data){setAcesso('erro');return}
      const plano=(data.plano_tipo||'').trim().toLowerCase()
      const status=(data.status_acesso||'ativo').trim().toLowerCase()
      setAcesso(['minipage','loja','essencial','equipe'].includes(plano) && !['aguardando_pagamento','bloqueado','cancelado'].includes(status)?'pago':'free')
    }
    void carregar()
    return()=>{ativo=false}
  },[])
  if(acesso==='carregando')return <div style={{background:'#08060A',color:'#B8AAB8',minHeight:'100vh',padding:32}}>Carregando...</div>
  if(acesso==='erro')return <div style={{background:'#08060A',color:'#F8F4F7',minHeight:'100vh',padding:32}}>Não foi possível confirmar seu plano. Recarregue a página.</div>
  return acesso==='pago'?<SecoesVideos/>:<EditorVideos/>
}
