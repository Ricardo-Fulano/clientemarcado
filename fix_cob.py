with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Trocar filtros de scroll horizontal para flex-wrap
old = "          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:'4px',marginBottom:'20px'}}>"
new = "          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'20px',width:'100%',maxWidth:'100%'}}>"
print('Achou filtros:', old in c)
c = c.replace(old, new, 1)

# 2. Remover flex-shrink:0 do pill (impedia wrap)
c = c.replace(
    ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}",
    ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;transition:all .18s;font-family:inherit}"
)

# 3. Trocar sidebar proprio por PainelSidebar
old_import = "import { CreditCard, AlertTriangle, Hourglass, CircleDollarSign, Search, Home, Calendar, Users, ClipboardList, Wallet, Sparkles, User, BarChart3, Settings } from 'lucide-react'"
new_import = "import { CreditCard, AlertTriangle, Hourglass, CircleDollarSign, Search, Calendar } from 'lucide-react'\nimport PainelSidebar from '@/app/components/PainelSidebar'"
print('Achou import:', old_import in c)
c = c.replace(old_import, new_import, 1)

# 4. Remover PlanoBloqueado import nao usado
c = c.replace("import PlanoBloqueado from '@/components/PlanoBloqueado'\n", "")

with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
