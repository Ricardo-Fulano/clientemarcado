
with open('app/painel/clientes/page.tsx', encoding='utf-8') as f:
    c = f.read()

print('Arquivo ok, linhas:', c.count('\n'))
print('E clientes:', 'cli-card' in c)

# KPI icones
c = c.replace("ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#22D3EE' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>","ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#22D3EE' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>")
c = c.replace("ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#FBBF24' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='1 4 1 10 7 10'/><path d='M3.51 15a9 9 0 1 0 .49-4.95'/></svg>","ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#FBBF24' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='1 4 1 10 7 10'/><path d='M3.51 15a9 9 0 1 0 .49-4.95'/></svg>")
c = c.replace("ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#C4B5FD' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='1' y='4' width='22' height='16' rx='2'/><line x1='1' y1='10' x2='23' y2='10'/></svg>","ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#C4B5FD' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='1' y='4' width='22' height='16' rx='2'/><line x1='1' y1='10' x2='23' y2='10'/></svg>")
c = c.replace("ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#4ADE80' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><line x1='19' y1='8' x2='19' y2='14'/><line x1='22' y1='11' x2='16' y2='11'/></svg>","ico:<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#4ADE80' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><line x1='19' y1='8' x2='19' y2='14'/><line x1='22' y1='11' x2='16' y2='11'/></svg>")

# KPI fallbacks
c = c.replace("v:0","v:0")
c = c.replace("v:'R$ 0,00'","v:'R$ 0,00'")
c = c.replace("marginBottom:'10px'}}>{k.ico}","marginBottom:'10px'}}>{k.ico}")

# Empty state
c = c.replace("margin:'0 auto 16px'}}><svg width={26} height={26} viewBox='0 0 24 24' fill='none' stroke='#22D3EE' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg></div>","margin:'0 auto 16px'}}><svg width={26} height={26} viewBox='0 0 24 24' fill='none' stroke='#22D3EE' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg></div>")

# Telefone e email
c = c.replace("{c.whatsapp?<div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='#64748B' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.51 2 2 0 0 1 3.22 1.34h3a2 2 0 0 1 2 1.72c.1.9.32 1.82.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.99.38 1.9.6 2.81.7A2 2 0 0 1 22 15z'/></svg><p style={{fontSize:12,color:'#64748B'}}>{c.whatsapp}</p></div>:null}","{c.whatsapp?<div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='#64748B' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.51 2 2 0 0 1 3.22 1.34h3a2 2 0 0 1 2 1.72c.1.9.32 1.82.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.99.38 1.9.6 2.81.7A2 2 0 0 1 22 15z'/></svg><p style={{fontSize:12,color:'#64748B'}}>{c.whatsapp}</p></div>:null}")
c = c.replace("{c.email?<div style={{display:'flex',alignItems:'center',gap:4}}><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='#64748B' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'/><polyline points='22,6 12,13 2,6'/></svg><p style={{fontSize:12,color:'#64748B'}}>{c.email}</p></div>:null}","{c.email?<div style={{display:'flex',alignItems:'center',gap:4}}><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='#64748B' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'/><polyline points='22,6 12,13 2,6'/></svg><p style={{fontSize:12,color:'#64748B'}}>{c.email}</p></div>:null}")

# Botoes dos cards
c = c.replace("><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg> WhatsApp</button>","><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg> WhatsApp</button>")
c = c.replace("><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg> Agendar</Link>","><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg> Agendar</Link>")
c = c.replace("><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg> Orçamento</Link>","><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg> Orçamento</Link>")
c = c.replace("><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg> Excluir</button>","><svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg> Excluir</button>")

# Formulario
c = c.replace("'Salvar cliente'","'Salvar cliente'")
c = c.replace("setMsg('Cliente cadastrado!')","setMsg('Cliente cadastrado!')")
c = c.replace("setMsg('Informe o nome.')","setMsg('Informe o nome.')")

# Filtros wrap
c = c.replace("  .pills-row{overflow-x:auto!important;display:flex!important;gap:5px!important;flex-wrap:nowrap!important;scrollbar-width:none!important;padding-bottom:2px!important}\n  .pills-row::-webkit-scrollbar{display:none!important}","  .pills-row{display:flex!important;flex-wrap:wrap!important;gap:6px!important;width:100%!important;max-width:100%!important}")

import re
emojis_left = len(re.findall('[📱✉💬📅📄✕✨🔄💳👥]', c))
print('Emojis restantes:', emojis_left)
print('Excluir:', 'Excluir' in c)
print('filtros wrap:', 'flex-wrap:wrap' in c)

with open('app/painel/clientes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
