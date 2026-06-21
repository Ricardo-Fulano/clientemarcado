with open('app/painel/cobrancas/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Localizar e substituir por posicao
start = c.find('const isPaga=(o:any)=>{const st=String(o.status||'').toLowerCase();const saldo=Number(o.saldo_restante||0);const total=Number(o.total||0);const vp=Number(o.valor_pago||0);return st==='pago'||st==='finalizado'||saldo<=0||(total>0&&vp>=total)}
  const filtradas=cobrancas.filter(o=>{
    const saldo=Number(o.saldo_restante||0)
    const passaF=
      (filtro==='Todas'&&!isPaga(o)&&o.status!=='Cancelado')||
      (filtro==='Em aberto'&&o.status==='Aberto'&&saldo>0)||
      (filtro==='Vencidas'&&o.vencimento&&new Date(o.vencimento)<new Date()&&!isPaga(o)&&o.status!=='Cancelado')||
      (filtro==='Parciais'&&o.status==='Parcialmente pago'&&saldo>0)||
      (filtro==='Pagas'&&isPaga(o))||
      (filtro==='Canceladas'&&o.status==='Cancelado')
    const passaB=!busca||[o.cliente_nome,o.cliente_whatsapp,o.tipo].some((v:string)=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })', start) + 4

if start == -1:
    print('ERRO: nao encontrou const filtradas')
    exit(1)

print(f'Bloco de {start} a {end}')

novo = """const isPaga=(o:any)=>{const st=String(o.status||'').toLowerCase();const saldo=Number(o.saldo_restante||0);const total=Number(o.total||0);const vp=Number(o.valor_pago||0);return st==='pago'||st==='finalizado'||saldo<=0||(total>0&&vp>=total)}
  const filtradas=cobrancas.filter(o=>{
    const saldo=Number(o.saldo_restante||0)
    const passaF=
      (filtro==='Todas'&&!isPaga(o)&&o.status!=='Cancelado')||
      (filtro==='Em aberto'&&o.status==='Aberto'&&saldo>0)||
      (filtro==='Vencidas'&&o.vencimento&&new Date(o.vencimento)<new Date()&&!isPaga(o)&&o.status!=='Cancelado')||
      (filtro==='Parciais'&&o.status==='Parcialmente pago'&&saldo>0)||
      (filtro==='Pagas'&&isPaga(o))||
      (filtro==='Canceladas'&&o.status==='Cancelado')
    const passaB=!busca||[o.cliente_nome,o.cliente_whatsapp,o.tipo].some((v:string)=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })"""

c = c[:start] + novo + c[end:]

with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('OK!')
