import 'server-only'
/** Fail closed. True requires real production configuration; this is not a substitute for end-to-end financial verification. */
const enabled=(name:string)=>process.env[name]==='true'
const strong=(name:string)=>Boolean(process.env[name] && process.env[name]!.length>=32)
export function stripeLiveReadiness(){
 const requiredFlags=[
  'STRIPE_LIVE_CHECKOUT_WRITE_ENABLED','STRIPE_LIVE_COMPLIANCE_APPROVED',
  'STRIPE_LIVE_WEBHOOK_INGEST_ENABLED','MP_STRIPE_WEBHOOK_SYNC_DISPATCH_ENABLED',
  'MP_STRIPE_ORCHESTRATION_ENABLED','MP_STRIPE_RECONCILE_READINESS_ENABLED',
  'MP_STRIPE_ATOMIC_CLAIM_ENABLED','MP_STRIPE_INVOICE_ROUTER_ENABLED',
  'MP_STRIPE_ACTIVATION_ENABLED','MP_STRIPE_RENEWAL_ENABLED',
  'MP_STRIPE_LIFECYCLE_ENABLED','MP_STRIPE_CRON_ENABLED'
 ] as const
 const requiredSecrets=[
  'MP_STRIPE_ORCHESTRATION_SECRET','MP_STRIPE_RECONCILE_SECRET',
  'MP_STRIPE_INVOICE_ROUTER_SECRET','MP_STRIPE_SETTLE_SECRET',
  'MP_STRIPE_RENEWAL_SECRET','MP_STRIPE_LIFECYCLE_SECRET','CRON_SECRET'
 ] as const
 const missingFlags=requiredFlags.filter(k=>!enabled(k))
 const missingSecrets=requiredSecrets.filter(k=>!strong(k))
 const basic=process.env.VERCEL_ENV==='production' &&
  (/^(?:sk|rk)_live_/.test(process.env.STRIPE_LIVE_SECRET_KEY||''))===true &&
  process.env.STRIPE_LIVE_WEBHOOK_SECRET?.startsWith('whsec_')===true &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  process.env.STRIPE_LIVE_RETURN_ORIGIN==='https://minipage.pro'
 return {ready:Boolean(basic)&&missingFlags.length===0&&missingSecrets.length===0, flagsConfigured:missingFlags.length===0, secretsConfigured:missingSecrets.length===0, environmentConfigured:Boolean(basic)}
}
