with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Corrigir: trocar view de 'hoje'|'semana' para 'hoje'|'semana'|'todos'
old_state = "const [view,setView]=useState<'hoje'|'semana'>('hoje')"
new_state = "const [view,setView]=useState<'hoje'|'semana'|'todos'>('hoje')"
print('Achou state:', old_state in c)
c = c.replace(old_state, new_state, 1)

# Corrigir filtro agsF para suportar view=todos
old_filter = "    if(view==='hoje'&&d!==hoje)return false"
new_filter = "    if(view==='hoje'&&d!==hoje)return false\n    if(view==='semana')return false"
# Nao precisa adicionar semana aqui - a view semana ja tem seu proprio bloco
# Apenas garantir que 'todos' nao filtra por data
old_filter2 = "    const d=new Date(a.data_hora).toISOString().split('T')[0]\n    if(view==='hoje'&&d!==hoje)return false"
new_filter2 = "    const d=new Date(a.data_hora).toISOString().split('T')[0]\n    if(view==='hoje'&&d!==hoje)return false\n    if(view==='todos'){}"
print('Achou filter2:', old_filter2 in c)

# Corrigir botoes de view - adicionar Todos como terceira opcao de periodo
old_btns = "            {(['hoje','semana'] as const).map(v=>(\n              <button key={v} onClick={()=>{setView(v);setDiaSel(null)}}\n                style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.4)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.15)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>\n                {v==='hoje'?'Hoje':'Semana'}\n              </button>\n            ))}"
new_btns = "            {(['hoje','semana','todos'] as const).map(v=>(\n              <button key={v} onClick={()=>{setView(v);setDiaSel(null)}}\n                style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.4)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.15)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>\n                {v==='hoje'?'Hoje':v==='semana'?'Semana':'Todos'}\n              </button>\n            ))}"
print('Achou btns:', old_btns in c)
c = c.replace(old_btns, new_btns, 1)

# Remover filtro de status 'todos' do grupo de status (era confuso com o Todos de periodo)
# Manter apenas os status reais: pendente confirmado realizado cancelado
old_st = "            {view==='hoje'&&['todos','pendente','confirmado','realizado','cancelado'].map(f=>(\n              <button key={f} onClick={()=>setFSt(f)}\n                style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>\n                {f==='todos'?'Todos':stCfg[f]?.t||f}\n              </button>\n            ))}"
new_st = "            {(view==='hoje'||view==='todos')&&['todos','pendente','confirmado','realizado','cancelado'].map(f=>(\n              <button key={f} onClick={()=>setFSt(f)}\n                style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>\n                {f==='todos'?'Status':stCfg[f]?.t||f}\n              </button>\n            ))}"
print('Achou st:', old_st in c)
c = c.replace(old_st, new_st, 1)

# Fazer view='todos' mostrar o mesmo bloco que 'hoje' mas sem filtro de data
old_hoje = "          {view==='hoje'&&("
new_hoje = "          {(view==='hoje'||view==='todos')&&("
print('Achou view hoje:', old_hoje in c)
c = c.replace(old_hoje, new_hoje, 1)

with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
