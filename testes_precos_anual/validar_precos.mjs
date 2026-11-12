import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync('app/lib/planos.ts','utf8');
const expected={minipage:[29.90,297.80],agenda:[39.90,397.40],loja:[49.90,497.00],essencial:[59.90,596.60],equipe:[149.90,1493.00]};
for(const [id,[mensal,anual]] of Object.entries(expected)){
  const annualSection=s.split('export function obterPrecoAnualPlano')[1].split('export type BillingCycle')[0];
  const expectedLine=id==='essencial' ? `return ${anual.toFixed(2)} // essencial/Pro` : `if (p === '${id}') return ${anual.toFixed(2)}`;
  assert.ok(annualSection.includes(expectedLine),`Preço anual ${id} incorreto`);
  assert.ok(Math.abs(anual-Math.round(mensal*12*.83*100)/100)<.001,`Desconto ${id} incorreto`);
}
const checkout=fs.readFileSync('app/lib/asaas-checkout.ts','utf8');
assert.ok(checkout.includes("if (ciclo === 'anual')"));
assert.ok(!checkout.includes('PRECO_ANUAL_PENDENTE'));
const signup=fs.readFileSync('app/lib/cadastro-registrar.ts','utf8');
assert.ok(!signup.includes('PRECO_ANUAL_PENDENTE'));
const aceite=fs.readFileSync('app/aceite-plano/page.tsx','utf8');
assert.ok(!aceite.includes("if (ehPlanoFree(planoValido) || billingParam === 'anual')"));
console.log('OK: cinco preços anuais, 17%, checkout, cadastro e aceite');
