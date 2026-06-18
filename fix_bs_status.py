with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = """        <p className="bs-label">Status do atendimento</p>
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
        )}"""

new = """        <p className="bs-label">Status do atendimento</p>
        {bsAg&&(()=>{
          const st=(bsAg.status||'').toLowerCase()
          const jaRealizado=['realizado','concluido','concluído','compareceu'].includes(st)
          const jaFaltou=st==='faltou'
          const jaCancelado=st==='cancelado'
          return(<>
            {jaRealizado?(
              <div style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{fontSize:14,color:'#4ADE80',fontWeight:500}}>Atendimento já realizado</span>
              </div>
            ):jaCancelado?null:(
              <button className="bs-item" style={{color:'#4ADE80'}} onClick={()=>{updSt(bsAg.id,'realizado');setBsAg(null)}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Marcar como realizado
              </button>
            )}
            {jaFaltou?(
              <div style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span style={{fontSize:14,color:'#F87171',fontWeight:500}}>Cliente marcado como faltou</span>
              </div>
            ):jaCancelado?null:(
              <button className="bs-item" style={{color:'#F87171'}} onClick={()=>{updSt(bsAg.id,'faltou');setBsAg(null)}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Marcar como faltou
              </button>
            )}
            {jaCancelado?(
              <div style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{fontSize:14,color:'#94A3B8',fontWeight:500}}>Atendimento cancelado</span>
              </div>
            ):(
              <button className="bs-item" style={{color:'#F87171'}} onClick={()=>{updSt(bsAg.id,'cancelado');setBsAg(null)}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar atendimento
              </button>
            )}
          </>)
        })()}"""

print('achou:', old in c)
c = c.replace(old, new, 1)

with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
