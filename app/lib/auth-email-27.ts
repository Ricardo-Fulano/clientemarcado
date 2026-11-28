// Somente servidor. Nunca persistir ou registrar codigo em texto claro.
import { createHmac, randomInt, randomUUID, createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { auth27Copy } from './i18n-global/auth-27'
import { criarEnvioResend } from './resend-envio'
export const email27=(v:unknown)=>typeof v==='string'?v.trim().toLowerCase():''
export const emailValido27=(v:string)=>v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
export const uuid27=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
export function digest27(id:string,email:string,code:string){
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!secret)throw Error('MP27_CONFIG')
 return createHmac('sha256',secret).update('mp27:signup:'+id+':'+email+':'+code).digest('hex')
}
async function limite(s:SupabaseClient,chave:string,max:number){
 const {data,error}=await s.rpc('checar_rate_limit',{p_chave:'mp27:'+createHash('sha256').update(chave).digest('hex').slice(0,40),p_max:max,p_janela_segundos:900})
 return !error&&data===true
}
export async function emitirCodigo27(s:SupabaseClient,email:string,ip:string,idioma:unknown){
 if(!emailValido27(email))return {status:400,body:{codigo:'EMAIL_INVALIDO'}}
 const key=process.env.RESEND_API_KEY
 if(!key)return {status:503,body:{codigo:'EMAIL_INDISPONIVEL'}}
 if(!(await limite(s,'ip:'+ip,12))||!(await limite(s,'email:'+email,4)))return {status:429,body:{codigo:'MUITAS_TENTATIVAS'}}
 const id=randomUUID(),code=String(randomInt(0,1000000)).padStart(6,'0'), t=auth27Copy(idioma)
 // Limpeza dos desafios expirados; não bloqueia a emissão se a limpeza falhar.
 await s.from('mp27_email_challenges').delete().lt('expires_at',new Date(Date.now()-86400000).toISOString())
 const {error}=await s.from('mp27_email_challenges').insert({id,email,code_hash:digest27(id,email,code)})
 if(error)return {status:503,body:{codigo:'EMAIL_INDISPONIVEL'}}
 const result=await criarEnvioResend(key,{from:'MiniPage Pro <noreply@clientemarcado.com.br>'}).enviar({para:email,assunto:t.subject,html:`<h2>MiniPage Pro</h2><p>${t.mail}</p><p style="font-size:32px;letter-spacing:6px"><strong>${code}</strong></p><p>${t.expiry}</p>`},'mp27-'+id)
 if(result.tipo!=='aceito'){await s.from('mp27_email_challenges').delete().eq('id',id);return {status:503,body:{codigo:'EMAIL_INDISPONIVEL'}}}
 return {status:200,body:{ok:true,challengeId:id}}
}
export async function consumirCodigo27(s:SupabaseClient,email:string,id:unknown,code:unknown){
 if(!uuid27(id)||typeof code!=='string'||!/^\d{6}$/.test(code))return false
 const {data,error}=await s.rpc('mp27_consumir_codigo',{p_id:id,p_email:email,p_hash:digest27(id,email,code)})
 return !error&&data===true
}
