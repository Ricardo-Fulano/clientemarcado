with open('app/painel/suporte/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar Clock ao import
old_imp = "import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Star, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings, Clock } from 'lucide-react'"
new_imp = "import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Star, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings, Clock } from 'lucide-react'"
print('1 import:', old_imp in c)
c = c.replace(old_imp, new_imp, 1)

# 2. Adicionar horário discreto abaixo do subtítulo do header
old_sub = "                <p style={{ fontSize: 13, color: '#64748B' }}>Tire dúvidas sobre o ClienteMarcado e encontre respostas rápidas.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.18)', borderRadius: 8, padding: '5px 10px', width: 'fit-content' }}>
                  <Clock size={12} style={{ color: '#60A5FA', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600 }}>Suporte humano: seg a sex, das 08h às 17h</span>
                </div>"
new_sub = """                <p style={{ fontSize: 13, color: '#64748B' }}>Tire dúvidas sobre o ClienteMarcado e encontre respostas rápidas.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.18)', borderRadius: 8, padding: '5px 10px', width: 'fit-content' }}>
                  <Clock size={12} style={{ color: '#60A5FA', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600 }}>Suporte humano: seg a sex, das 08h às 17h</span>
                </div>"""
print('2 header horario:', old_sub in c)
c = c.replace(old_sub, new_sub, 1)

# 3. Melhorar card "Ainda não resolveu?" com horário + texto fora do horário
old_card = """              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Ainda não resolveu?</p>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Se a central de ajuda não responder sua dúvida, fale com o suporte pelo WhatsApp.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Clock size={13} style={{ color: '#4ADE80', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600, marginBottom: 2 }}>Horário de atendimento: seg a sex, das 08h às 17h</p>
                    <p style={{ fontSize: 11, color: '#475569' }}>Fora desse horário, sua mensagem será respondida no próximo período útil.</p>
                  </div>
                </div>
              </div>"""
new_card = """              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Ainda não resolveu?</p>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Se a central de ajuda não responder sua dúvida, fale com o suporte pelo WhatsApp.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Clock size={13} style={{ color: '#4ADE80', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600, marginBottom: 2 }}>Horário de atendimento: seg a sex, das 08h às 17h</p>
                    <p style={{ fontSize: 11, color: '#475569' }}>Fora desse horário, sua mensagem será respondida no próximo período útil.</p>
                  </div>
                </div>
              </div>"""
print('3 card horario:', old_card in c)
c = c.replace(old_card, new_card, 1)

with open('app/painel/suporte/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
print("Clock import:", "Clock" in c)
print("Horario header:", "seg a sex, das 08h" in c)
