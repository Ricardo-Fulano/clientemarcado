with open('app/painel/suporte/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Trocar Scissors por Sparkles no import
old_i = "import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Scissors, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings } from 'lucide-react'"
new_i = "import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Star, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings } from 'lucide-react'"
print('import:', old_i in c)
c = c.replace(old_i, new_i, 1)

# Trocar Scissors por Star no CAT_ICONS
old_ic = "  'Serviços':            <Scissors      size={24} />,"
new_ic = "  'Serviços':            <Star          size={24} />,"
print('icon:', old_ic in c)
c = c.replace(old_ic, new_ic, 1)

with open('app/painel/suporte/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
