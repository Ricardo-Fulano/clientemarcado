# Corrige duplicidade: usa orcamento_pagamentos como fonte unica para pagamentos de orcamentos
# e remove inserção duplicada na tabela 'pagamentos'
with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Substituir o load() para usar orcamento_pagamentos (não orcamentos.valor_pago)
old_load = """    const [{data:p},{data:ps},{data:pags},{data:desp},{data:ags},{data:orcPags},{data:orcs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome,cargo,foto_url').eq('user_id',user.id).order('nome'),
      supabase.from('pagamentos').select('valor,data,status').eq('user_id',user.id),
      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id).then(r=>{if(r.error)console.error('Despesas:',r.error);return{data:r.data||[]}}),
      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(id,nome,preco),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),
      supabase.from('orcamento_pagamentos').select('valor,data,orcamento_id').eq('user_id',user.id),
      supabase.from('orcamentos').select('id,profissional_id,procedimentos_odonto,data,cliente_nome').eq('user_id',user.id).not('procedimentos_odonto','is',null),
    ])
    // Montar ids de orcamentos que já estão na tabela pagamentos (para evitar duplicar)
    // Os pagamentos de orcamento devem vir APENAS de orcamento_pagamentos
    // A tabela 'pagamentos' só deve conter pagamentos manuais (financeiro) e de agendamentos
    // Filtrar da tabela pagamentos os que têm orcamento_id (se existir o campo)
    const orcIds=new Set((orcs||[]).map((o:any)=>o.id))
    // Pagamentos de orçamentos via tabela orcamento_pagamentos (fonte única)
    const pagsDeOrc=(orcPags||[]).map((op:any)=>({valor:op.valor||0,data:op.data,status:'confirmado',_orcId:op.orcamento_id}))
    // Pagamentos manuais (tabela pagamentos - excluindo os que são de orçamento se tiverem campo)
    const pagsManuais=(pags||[]).filter((p:any)=>!p.orcamento_id)
    const todoPags=[...pagsManuais,...pagsDeOrc]
    // Mapear orçamentos para resumo de procedimentos odontológicos
    const orcsProcMap:Record<string,{proc:string,qtd:number,total:number}[]>={}
    ;(orcs||[]).forEach((o:any)=>{
      if(o.procedimentos_odonto?.length) orcsProcMap[o.id]=o.procedimentos_odonto
    })
    setPerfil(p);setProfs(ps||[]);setPagamentos(todoPags);setDespesas(desp||[]);setAgendamentos(ags||[])
    setOrcProcsData(Object.values(orcsProcMap).flat())
    setLoading(false)"""

new_load = """    const [{data:p},{data:ps},{data:pags},{data:desp},{data:ags},{data:orcPags},{data:orcs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome,cargo,foto_url').eq('user_id',user.id).order('nome'),
      supabase.from('pagamentos').select('valor,data,status').eq('user_id',user.id),
      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id).then(r=>{if(r.error)console.error('Despesas:',r.error);return{data:r.data||[]}}),
      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(id,nome,preco),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),
      supabase.from('orcamento_pagamentos').select('valor,data,orcamento_id').eq('user_id',user.id),
      supabase.from('orcamentos').select('id,profissional_id,procedimentos_odonto,data,cliente_nome').eq('user_id',user.id).not('procedimentos_odonto','is',null),
    ])
    // Montar ids de orcamentos que já estão na tabela pagamentos (para evitar duplicar)
    // Os pagamentos de orcamento devem vir APENAS de orcamento_pagamentos
    // A tabela 'pagamentos' só deve conter pagamentos manuais (financeiro) e de agendamentos
    // Filtrar da tabela pagamentos os que têm orcamento_id (se existir o campo)
    const orcIds=new Set((orcs||[]).map((o:any)=>o.id))
    // Pagamentos de orçamentos via tabela orcamento_pagamentos (fonte única)
    const pagsDeOrc=(orcPags||[]).map((op:any)=>({valor:op.valor||0,data:op.data,status:'confirmado',_orcId:op.orcamento_id}))
    // Pagamentos manuais (tabela pagamentos - excluindo os que são de orçamento se tiverem campo)
    const pagsManuais=(pags||[]).filter((p:any)=>!p.orcamento_id)
    const todoPags=[...pagsManuais,...pagsDeOrc]
    // Mapear orçamentos para resumo de procedimentos odontológicos
    const orcsProcMap:Record<string,{proc:string,qtd:number,total:number}[]>={}
    ;(orcs||[]).forEach((o:any)=>{
      if(o.procedimentos_odonto?.length) orcsProcMap[o.id]=o.procedimentos_odonto
    })
    setPerfil(p);setProfs(ps||[]);setPagamentos(todoPags);setDespesas(desp||[]);setAgendamentos(ags||[])
    setOrcProcsData(Object.values(orcsProcMap).flat())
    setLoading(false)"""

print('load:', old_load in c)
c = c.replace(old_load, new_load, 1)

# Adicionar estado orcProcsData
old_state = "  const [profSel,setProfSel]=useState<any>(null) // modal individual
  const [orcProcsData,setOrcProcsData]=useState<any[]>([])"
new_state = "  const [profSel,setProfSel]=useState<any>(null) // modal individual\n  const [orcProcsData,setOrcProcsData]=useState<any[]>([])"
print('state:', old_state in c)
c = c.replace(old_state, new_state, 1)

# Corrigir resumo por servico — incluir procedimentos odontos
old_resumo_title = '              <p style={{fontSize:\'13px\',color:\'#64748B\'}}>Veja quais serviços foram realizados no período selecionado.</p>'
new_resumo_title = "              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quais serviços e procedimentos movimentaram o período selecionado.</p>"
print('titulo:', old_resumo_title in c)
c = c.replace(old_resumo_title, new_resumo_title, 1)

# Substituir "Serviço mais realizado" por texto genérico
old_sv_mais = "              <p style={{fontSize:'10px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Serviço/procedimento mais realizado</p>"
new_sv_mais = "              <p style={{fontSize:'10px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Serviço/procedimento mais realizado</p>"
print('sv mais:', old_sv_mais in c)
c = c.replace(old_sv_mais, new_sv_mais, 1)

# Adicionar procedimentos odontológicos no resumo por serviço
# Inserir antes do fechamento do bloco de resumoServicos
old_resumo_end = "          {/* Procedimentos odontológicos no período */}
          {(()=>{
            const procsMes=orcProcsData.filter((_:any)=>true) // todos os procs de orçamentos
            if(procsMes.length===0)return null
            const procsMap:Record<string,{nome:string,qtd:number,total:number,dentes:number}>={}
            procsMes.forEach((p:any)=>{
              const nome=p.proc||p.nome||p.procedimento||'Procedimento'
              if(!procsMap[nome])procsMap[nome]={nome,qtd:0,total:0,dentes:0}
              procsMap[nome].qtd+=(p.qtd||1)
              procsMap[nome].total+=(p.total||0)
              procsMap[nome].dentes+=(p.dentes?.length||0)
            })
            const procs=Object.values(procsMap).sort((a,b)=>b.total-a.total)
            if(procs.length===0)return null
            return(
              <div style={{marginBottom:'22px'}}>
                <div style={{marginBottom:'16px'}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Procedimentos odontológicos</p>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Procedimentos de orçamentos odontológicos cadastrados.</p>
                </div>
                <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:'16px',overflow:'hidden'}}>
                  {procs.map((sv,i)=>(
                    <div key={sv.nome} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'13px 18px',borderBottom:i<procs.length-1?'1px solid rgba(255,255,255,.05)':'none'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{sv.nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B'}}>{sv.qtd} procedimento{sv.qtd!==1?'s':''}{sv.dentes>0?` · ${sv.dentes} dente${sv.dentes!==1?'s':''}`:''}
                        </p>
                      </div>
                      <p style={{fontSize:'15px',fontWeight:800,color:'#C4B5FD',flexShrink:0}}>{fBRL(sv.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          {/* Desempenho por profissional */}"
new_resumo_end = """          {/* Procedimentos odontológicos no período */}
          {(()=>{
            const procsMes=orcProcsData.filter((_:any)=>true) // todos os procs de orçamentos
            if(procsMes.length===0)return null
            const procsMap:Record<string,{nome:string,qtd:number,total:number,dentes:number}>={}
            procsMes.forEach((p:any)=>{
              const nome=p.proc||p.nome||p.procedimento||'Procedimento'
              if(!procsMap[nome])procsMap[nome]={nome,qtd:0,total:0,dentes:0}
              procsMap[nome].qtd+=(p.qtd||1)
              procsMap[nome].total+=(p.total||0)
              procsMap[nome].dentes+=(p.dentes?.length||0)
            })
            const procs=Object.values(procsMap).sort((a,b)=>b.total-a.total)
            if(procs.length===0)return null
            return(
              <div style={{marginBottom:'22px'}}>
                <div style={{marginBottom:'16px'}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Procedimentos odontológicos</p>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Procedimentos de orçamentos odontológicos cadastrados.</p>
                </div>
                <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:'16px',overflow:'hidden'}}>
                  {procs.map((sv,i)=>(
                    <div key={sv.nome} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'13px 18px',borderBottom:i<procs.length-1?'1px solid rgba(255,255,255,.05)':'none'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{sv.nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B'}}>{sv.qtd} procedimento{sv.qtd!==1?'s':''}{sv.dentes>0?` · ${sv.dentes} dente${sv.dentes!==1?'s':''}`:''}
                        </p>
                      </div>
                      <p style={{fontSize:'15px',fontWeight:800,color:'#C4B5FD',flexShrink:0}}>{fBRL(sv.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          {/* Desempenho por profissional */}"""
print('resumo end:', old_resumo_end in c)
c = c.replace(old_resumo_end, new_resumo_end, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
