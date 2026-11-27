import { createClient } from '@supabase/supabase-js'
export function clienteRecursosSlug(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return null;return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function leadSlugAtivo(uid:string){try{const db=clienteRecursosSlug();if(!db)return false;const {data,error}=await db.from('minipage_slug_config').select('lead_ativo').eq('user_id',uid).maybeSingle();return !error&&data?.lead_ativo===true}catch{return false}}
