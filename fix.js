const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')
c = c.replace(
  /const ESSENCIAL_CHECKOUT_URL = "[^"]*"/,
  'const ESSENCIAL_CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"'
)
c = c.replace(
  /const COMPLETO_CHECKOUT_URL = "[^"]*"/,
  'const COMPLETO_CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=5939bff1048d4e24849edaa1d2db8cc2"'
)
fs.writeFileSync('app/page.tsx', c, 'utf8')
console.log('Links inseridos!')