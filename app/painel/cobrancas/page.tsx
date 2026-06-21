with open('app/painel/cobrancas/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old = "    const _st=String(o.status||'').toLowerCase().trim()
    const _saldo=Number(o.saldo_restante||0)
    const _total=Number(o.total||0)
    const _pago=Number(o.valor_pago||0)
    const _ePaga=_st==='pago'||_st==='finalizado'||(_total>0&&_pago>=_total)||(_total>0&&_saldo<=0&&_pago>0)
    const passaF=(filtro==='Todas'&&!_ePaga&&_st!=='cancelado')||(filtro==='Em aberto'&&o.status==='Aberto')||(filtro==='Vencidas'&&o.vencimento&&new Date(o.vencimento)<new Date()&&!['Pago','Finalizado','Cancelado'].includes(o.status))||(filtro==='Parciais'&&o.status==='Parcialmente pago')||(filtro==='Pagas'&&_ePaga)||(filtro==='Canceladas'&&o.status==='Cancelado')"

new = "    const _st=String(o.status||'').toLowerCase().trim()\n    const _saldo=Number(o.saldo_restante||0)\n    const _total=Number(o.total||0)\n    const _pago=Number(o.valor_pago||0)\n    const _ePaga=_st==='pago'||_st==='finalizado'||(_total>0&&_pago>=_total)||(_total>0&&_saldo<=0&&_pago>0)\n    const passaF=(filtro==='Todas'&&!_ePaga&&_st!=='cancelado')||(filtro==='Em aberto'&&o.status==='Aberto')||(filtro==='Vencidas'&&o.vencimento&&new Date(o.vencimento)<new Date()&&!['Pago','Finalizado','Cancelado'].includes(o.status))||(filtro==='Parciais'&&o.status==='Parcialmente pago')||(filtro==='Pagas'&&_ePaga)||(filtro==='Canceladas'&&o.status==='Cancelado')"

if old in c:
    c = c.replace(old, new)
    with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK!')
else:
    print('ERRO - nao encontrou')
    idx = c.find('const filtradas')
    print(repr(c[idx:idx+400]))
