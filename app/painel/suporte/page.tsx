with open('app/painel/suporte/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar imports dos icones lucide
old_import = "import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Scissors, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings } from 'lucide-react'"
new_import = "import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Scissors, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings } from 'lucide-react'"
print('1 import:', old_import in c)
c = c.replace(old_import, new_import, 1)

# 2. Substituir CORES_CAT - remover icon emoji, adicionar componente de icone
old_cores = """const CORES_CAT: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  'Agenda':              { bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)',  text: '#93C5FD', iconBg: 'rgba(59,130,246,.18)'  },
  'Clientes':            { bg: 'rgba(34,211,238,.10)',  border: 'rgba(34,211,238,.25)',  text: '#22D3EE', iconBg: 'rgba(34,211,238,.14)'  },
  'Serviços':            { bg: 'rgba(168,85,247,.10)',  border: 'rgba(168,85,247,.25)',  text: '#C4B5FD', iconBg: 'rgba(168,85,247,.16)' },
  'Orçamentos':          { bg: 'rgba(167,139,250,.10)', border: 'rgba(167,139,250,.25)', text: '#A78BFA', iconBg: 'rgba(167,139,250,.16)' },
  'Cobranças':           { bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.25)',  text: '#F59E0B', iconBg: 'rgba(245,158,11,.14)'  },
  'Pagamentos':          { bg: 'rgba(34,197,94,.10)',   border: 'rgba(34,197,94,.25)',   text: '#22C55E', iconBg: 'rgba(34,197,94,.14)'   },
  'Página pública':      { bg: 'rgba(34,211,238,.10)',  border: 'rgba(34,211,238,.25)',  text: '#22D3EE', iconBg: 'rgba(34,211,238,.14)'  },
  'Conta e mensalidade': { bg: 'rgba(139,92,246,.10)',  border: 'rgba(139,92,246,.25)',  text: '#8B5CF6', iconBg: 'rgba(139,92,246,.16)'  },
}
const CAT_ICONS: Record<string, React.ReactNode> = {
  'Agenda':              <CalendarDays  size={24} />,
  'Clientes':            <Users         size={24} />,
  'Serviços':            <Scissors      size={24} />,
  'Orçamentos':          <ClipboardList size={24} />,
  'Cobranças':           <CreditCard    size={24} />,
  'Pagamentos':          <CircleDollarSign size={24} />,
  'Página pública':      <Globe         size={24} />,
  'Conta e mensalidade': <Settings      size={24} />,
}"""

new_cores = """const CORES_CAT: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  'Agenda':              { bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)',  text: '#93C5FD', iconBg: 'rgba(59,130,246,.18)'  },
  'Clientes':            { bg: 'rgba(34,211,238,.10)',  border: 'rgba(34,211,238,.25)',  text: '#22D3EE', iconBg: 'rgba(34,211,238,.14)'  },
  'Serviços':            { bg: 'rgba(168,85,247,.10)',  border: 'rgba(168,85,247,.25)',  text: '#C4B5FD', iconBg: 'rgba(168,85,247,.16)' },
  'Orçamentos':          { bg: 'rgba(167,139,250,.10)', border: 'rgba(167,139,250,.25)', text: '#A78BFA', iconBg: 'rgba(167,139,250,.16)' },
  'Cobranças':           { bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.25)',  text: '#F59E0B', iconBg: 'rgba(245,158,11,.14)'  },
  'Pagamentos':          { bg: 'rgba(34,197,94,.10)',   border: 'rgba(34,197,94,.25)',   text: '#22C55E', iconBg: 'rgba(34,197,94,.14)'   },
  'Página pública':      { bg: 'rgba(34,211,238,.10)',  border: 'rgba(34,211,238,.25)',  text: '#22D3EE', iconBg: 'rgba(34,211,238,.14)'  },
  'Conta e mensalidade': { bg: 'rgba(139,92,246,.10)',  border: 'rgba(139,92,246,.25)',  text: '#8B5CF6', iconBg: 'rgba(139,92,246,.16)'  },
}
const CAT_ICONS: Record<string, React.ReactNode> = {
  'Agenda':              <CalendarDays  size={24} />,
  'Clientes':            <Users         size={24} />,
  'Serviços':            <Scissors      size={24} />,
  'Orçamentos':          <ClipboardList size={24} />,
  'Cobranças':           <CreditCard    size={24} />,
  'Pagamentos':          <CircleDollarSign size={24} />,
  'Página pública':      <Globe         size={24} />,
  'Conta e mensalidade': <Settings      size={24} />,
}"""
print('2 cores:', old_cores in c)
c = c.replace(old_cores, new_cores, 1)

# 3. Substituir renderizacao do icone no card
old_icon_render = "                      <div style={{ width: 48, height: 48, borderRadius: 14, background: c.iconBg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: c.text }}>
                        {CAT_ICONS[cat]}
                      </div>"
new_icon_render = """                      <div style={{ width: 48, height: 48, borderRadius: 14, background: c.iconBg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: c.text }}>
                        {CAT_ICONS[cat]}
                      </div>"""
print('3 render:', old_icon_render in c)
c = c.replace(old_icon_render, new_icon_render, 1)

with open('app/painel/suporte/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
