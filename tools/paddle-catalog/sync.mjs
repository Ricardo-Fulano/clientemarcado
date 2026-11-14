#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(root, 'catalogo.json');
const currencies = new Set(['BRL','USD','EUR']);
const allowedModes = new Set(['offline','preview','apply']);

export function minor(amount) {
  if (typeof amount !== 'string' || !/^(0|[1-9]\d*)\.\d{2}$/.test(amount)) throw new Error(`Valor invalido: ${amount}`);
  const [whole, cents] = amount.split('.');
  const result = BigInt(whole)*100n + BigInt(cents);
  if (result <= 0n || result > 9007199254740991n) throw new Error('Valor fora do limite');
  return result.toString();
}
export function validate(manifest) {
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.plans)) throw new Error('Catalogo incompativel');
  const codes = new Set();
  for (const p of manifest.plans) {
    if (!/^[a-z][a-z0-9_]*$/.test(p.code) || codes.has(p.code)) throw new Error('plan_code invalido/duplicado');
    codes.add(p.code);
    if (typeof p.name !== 'string' || !p.name.trim() || !p.base) throw new Error(`Dados ausentes: ${p.code}`);
    if (!currencies.has(p.base.currency)) throw new Error(`Moeda nao permitida: ${p.code}`);
    minor(p.base.amount);
    for (const [country, entry] of Object.entries(p.regional || {})) {
      if (!/^[A-Z]{2}$/.test(country) || !currencies.has(entry.currency)) throw new Error(`Regiao/moeda invalida: ${country}`);
      minor(entry.amount);
      if (country === 'BR') throw new Error('Brasil usa preco base BRL; nao sobrescreva BR aqui');
    }
  }
  return manifest;
}
export function desiredPrice(plan) {
  return {
    description: `${plan.code}_mensal_brl`,
    name: `${plan.name} — Mensal`,
    billing_cycle: { interval: 'month', frequency: 1 },
    unit_price: {amount: minor(plan.base.amount), currency_code: plan.base.currency},
    unit_price_overrides: Object.entries(plan.regional || {}).map(([country, info]) => ({
      country_codes: [country], unit_price: {amount: minor(info.amount), currency_code: info.currency}
    })),
    quantity: {minimum:1, maximum:1},
    tax_mode: 'account_setting',
    custom_data: {plan_code:plan.code, billing_cycle:'mensal'}
  };
}
function pricesEqual(a,b) {return a?.amount===b?.amount && a?.currency_code===b?.currency_code;}
function recurringMonthly(p) {return p.billing_cycle?.interval==='month' && p.billing_cycle?.frequency===1;}
function countryMap(overrides=[]) {
  const m=new Map();
  for(const o of overrides) for(const country of o.country_codes||[]) {
    if(m.has(country)) throw new Error(`Pais duplicado em overrides: ${country}`);
    m.set(country, o.unit_price);
  }
  return m;
}
export function planChanges(manifest, products, prices) {
  validate(manifest);
  const changes=[];
  for(const plan of manifest.plans.filter(p=>p.enabled)) {
    const found = products.filter(p=>p.custom_data?.plan_code===plan.code || p.name===plan.name);
    if(found.length>1) throw new Error(`Produto ambiguo: ${plan.code}; resolva manualmente`);
    if(!found.length) {changes.push({action:'create_product',code:plan.code,detail:plan.name,plan}); continue;}
    const product=found[0];
    if(product.tax_category !== 'saas') throw new Error(`Categoria nao SaaS em ${plan.code}`);
    const desired=desiredPrice(plan);
    const candidates=prices.filter(p=>p.product_id===product.id && recurringMonthly(p) && p.status==='active');
    // Nao reutilizar um preco com base divergente, mesmo que nome parecido.
    const matched=candidates.filter(p=>pricesEqual(p.unit_price, desired.unit_price));
    if(matched.length>1) throw new Error(`Precos mensais ambiguos para ${plan.code}`);
    if(!matched.length) {
      if(candidates.length) throw new Error(`Preco mensal base diferente para ${plan.code}; revisao manual obrigatoria`);
      changes.push({action:'create_price',code:plan.code,productId:product.id,detail:desired.unit_price,desired});
      continue;
    }
    const current=matched[0];
    if(current.trial_period) throw new Error(`Preco ${plan.code} tem trial; nao atualizar automaticamente`);
    const existing=countryMap(current.unit_price_overrides || []);
    const target=countryMap(desired.unit_price_overrides);
    const toChange=[];
    for(const [country, val] of target) if(!pricesEqual(existing.get(country),val)) toChange.push(country);
    if(toChange.length) {
      // Reune overrides antigos com os desejados, preservando paises fora do manifesto.
      const merged=new Map([...existing, ...target]);
      changes.push({action:'update_overrides',code:plan.code,priceId:current.id,detail:toChange,
        overrides:[...merged].map(([country,unit_price])=>({country_codes:[country],unit_price}))});
    } else changes.push({action:'keep',code:plan.code,detail:current.id});
  }
  return changes;
}
export function mockPlan(manifest){
  return manifest.plans.map(p=>({plan:p.code, enabled:!!p.enabled, base:`${p.base.currency} ${p.base.amount}`, countries:Object.keys(p.regional||{}).length}));
}
async function apiRequest(base,key,endpoint,method='GET',body) {
  const response=await fetch(base+endpoint, {method, headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'}, body:body?JSON.stringify(body):undefined});
  const json=await response.json().catch(()=>({}));
  if(!response.ok || json.error) throw new Error(`Paddle ${method} ${endpoint}: HTTP ${response.status} ${JSON.stringify(json.error||json.errors||'erro').slice(0,500)}`);
  return json.data !== undefined ? {data:json.data, meta:json.meta} : json;
}
async function getAll(base,key,endpoint) {
  const all=[]; let next=endpoint; let pages=0;
  do {
    if(++pages>100) throw new Error('Limite de paginacao excedido');
    const out=await apiRequest(base,key,next);
    all.push(...(out.data||[]));
    const pagination=out.meta?.pagination;
    if(!pagination?.has_more) break;
    const url=new URL(pagination.next);
    if(url.origin!==base) throw new Error('URL de paginacao inesperada');
    next=url.pathname+url.search;
  } while(true);
  return all;
}
export async function remotePlan(base,key,manifest) {
  const products=await getAll(base,key,'/products?per_page=200&status=active');
  const prices=await getAll(base,key,'/prices?per_page=200&status=active');
  return planChanges(manifest,products,prices);
}
function concise(changes){ return changes.map(c=>({action:c.action,plan:c.code,detail:c.detail})); }
export async function main(args=process.argv.slice(2)) {
  const mode=args[0]||'offline';
  const env=args[1]||'sandbox';
  if(!allowedModes.has(mode) || !['sandbox','live'].includes(env)) throw new Error('Uso: node sync.mjs offline|preview|apply sandbox|live [--confirm=...]');
  const manifest=validate(JSON.parse(fs.readFileSync(manifestPath,'utf8')));
  if(mode==='offline') {console.log(JSON.stringify({note:manifest.note,plans:mockPlan(manifest)},null,2)); return;}
  const base=env==='sandbox'?'https://sandbox-api.paddle.com':'https://api.paddle.com';
  const key=process.env[env==='sandbox'?'PADDLE_SANDBOX_API_KEY':'PADDLE_LIVE_API_KEY'];
  if(!key || !key.startsWith(env==='sandbox'?'pdl_sdbx_':'pdl_live_')) throw new Error('Chave de API ausente ou de ambiente errado; nao cole chaves nesta conversa');
  const changes=await remotePlan(base,key,manifest);
  console.log(JSON.stringify({environment:env,write:false,changes:concise(changes)},null,2));
  if(mode==='preview') return;
  if(manifest.approved_for_write !== true) throw new Error('BLOQUEADO: catalogo.json approved_for_write deve ser true apos revisao');
  const confirm=env==='sandbox'?'--confirm=APLICAR-SANDBOX':'--confirm=APLICAR-LIVE';
  if(!args.includes(confirm)) throw new Error(`BLOQUEADO: falta ${confirm}`);
  if(env==='live' && !args.includes('--live-reviewed')) throw new Error('BLOQUEADO: live exige --live-reviewed alem da confirmacao');
  for(const c of changes) {
    if(c.action==='keep') continue;
    let result;
    if(c.action==='create_product') {
      result=await apiRequest(base,key,'/products','POST',{
        name:c.plan.name, description:c.plan.description, tax_category:'saas',custom_data:{plan_code:c.code}
      });
      console.log(`Criado produto ${c.code}: ${result.data?.id}`);
      const p=desiredPrice(c.plan);
      const pr=await apiRequest(base,key,'/prices','POST',{...p,product_id:result.data.id});
      console.log(`Criado preco ${c.code}: ${pr.data?.id}`);
    } else if(c.action==='create_price') {
      result=await apiRequest(base,key,'/prices','POST',{...c.desired,product_id:c.productId});
      console.log(`Criado preco ${c.code}: ${result.data?.id}`);
    } else if(c.action==='update_overrides') {
      result=await apiRequest(base,key,`/prices/${encodeURIComponent(c.priceId)}`,'PATCH',{unit_price_overrides:c.overrides});
      console.log(`Atualizados paises ${c.code}: ${c.detail.join(',')}`);
    }
  }
  console.log('Aplicacao encerrada. Execute preview de novo para conferir.');
}
if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e=>{console.error(`ERRO: ${e.message}`);process.exitCode=1;});
}
