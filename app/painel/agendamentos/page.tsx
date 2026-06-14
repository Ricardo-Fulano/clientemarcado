with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Substituir o bottom sheet de acoes
old_bs = """        <p className="bs-label">Contato</p>
        <button className="bs-item" style={{color:'#CBD5E1'}} onClick={()=>{bsAg&&copiar(bsAg);setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar contato
        </button>
        <button className="bs-item" style={{color:'#60A5FA'}} onClick={()=>{bsAg&&resgatarCliente(bsAg);setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Resgatar cliente
        </button>
        <p className="bs-label">Status do atendimento</p>
        {bsAg&&bsAg.status!=='realizado'&&(
          <button className="bs-item" style={{color:'#4ADE80'}} onClick={()=>{updSt(bsAg.id,'realizado');setBsAg(null)}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Marcar como realizado
          </button>
        )}
        {bsAg&&bsAg.status!=='faltou'&&(
          <button className="bs-item" style={{color:'#F87171'}} onClick={()=>{updSt(bsAg.id,'faltou');setBsAg(null)}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Marcar como faltou
          </button>
        )}
        {bsAg&&bsAg.status!=='cancelado'&&(
          <button className="bs-item" style={{color:'#F87171'}} onClick={()=>{updSt(bsAg.id,'cancelado');setBsAg(null)}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Cancelar atendimento
          </button>
        )}
        <p className="bs-label">Continuidade</p>
        <button className="bs-item" style={{color:'#A78BFA'}} onClick={()=>{bsAg&&updSt(bsAg.id,'retorno');setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.55"/></svg>
          Criar retorno
        </button>"""

new_bs = """        <p className="bs-label">Contato</p>
        <button className="bs-item" style={{color:'#CBD5E1'}} onClick={()=>{bsAg&&copiar(bsAg);setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar contato
        </button>
        <button className="bs-item" style={{color:'#60A5FA'}} onClick={()=>{bsAg&&resgatarCliente(bsAg);setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Resgatar cliente
        </button>
        <p className="bs-label">Status do atendimento</p>
        {bsAg&&bsAg.status!=='realizado'&&(
          <button className="bs-item" style={{color:'#4ADE80'}} onClick={()=>{updSt(bsAg.id,'realizado');setBsAg(null)}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Marcar como realizado
          </button>
        )}
        {bsAg&&bsAg.status!=='faltou'&&(
          <button className="bs-item" style={{color:'#F87171'}} onClick={()=>{updSt(bsAg.id,'faltou');setBsAg(null)}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Marcar como faltou
          </button>
        )}
        {bsAg&&bsAg.status!=='cancelado'&&(
          <button className="bs-item" style={{color:'#F87171'}} onClick={()=>{updSt(bsAg.id,'cancelado');setBsAg(null)}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Cancelar atendimento
          </button>
        )}
        <p className="bs-label">Continuidade</p>
        <button className="bs-item" style={{color:'#A78BFA'}} onClick={()=>{bsAg&&updSt(bsAg.id,'retorno');setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.55"/></svg>
          Criar retorno
        </button>"""

print('1 bs:', old_bs in c)
c = c.replace(old_bs, new_bs, 1)

# 2. Corrigir area de confirmacao no card - mostrar status correto
old_conf = """                      {!['realizado','faltou','cancelado'].includes(a.status)&&(
                        <div className="conf-area" onClick={e=>e.stopPropagation()}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Confirmação</span>
                            <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:cc.bg,color:cc.c}}>{cc.t}</span>
                          </div>
                        </div>
                      )}
                      {a.status==='realizado'&&(
                        <div className="conf-area">
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.22)'}}>Atendimento realizado</span>
                        </div>
                      )}
                      {a.status==='faltou'&&(
                        <div className="conf-area">
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(239,68,68,.12)',color:'#F87171',border:'1px solid rgba(239,68,68,.22)'}}>Cliente faltou</span>
                        </div>
                      )}
                      {a.status==='cancelado'&&(
                        <div className="conf-area">
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(239,68,68,.10)',color:'#F87171',border:'1px solid rgba(239,68,68,.18)'}}>Cancelado</span>
                        </div>
                      )}"""

new_conf = """                      {!['realizado','faltou','cancelado'].includes(a.status)&&(
                        <div className="conf-area" onClick={e=>e.stopPropagation()}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Confirmação</span>
                            <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:cc.bg,color:cc.c}}>{cc.t}</span>
                          </div>
                        </div>
                      )}
                      {a.status==='realizado'&&(
                        <div className="conf-area">
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.22)'}}>Atendimento realizado</span>
                        </div>
                      )}
                      {a.status==='faltou'&&(
                        <div className="conf-area">
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(239,68,68,.12)',color:'#F87171',border:'1px solid rgba(239,68,68,.22)'}}>Cliente faltou</span>
                        </div>
                      )}
                      {a.status==='cancelado'&&(
                        <div className="conf-area">
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(239,68,68,.10)',color:'#F87171',border:'1px solid rgba(239,68,68,.18)'}}>Cancelado</span>
                        </div>
                      )}"""

print('2 conf:', old_conf in c)
c = c.replace(old_conf, new_conf, 1)

with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
