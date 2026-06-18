with open('app/[slug]/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Remover CTA final - do comentario ate o fechamento do div
import re
c2 = re.sub(
    r"\s*\{/\* CTA FINAL \*/\}[\s\S]{1,2000}?Agendar agora \u2192\s*</Link>\s*</div>\s*</div>\s*</div>",
    "",
    c, count=1
)
print('CTA removido:', 'Pronto para escolher' not in c2)
if 'Pronto para escolher' not in c2:
    c = c2

# 2. Duracao: {s.duracao} -> com min
old_dur = "{s.duracao && <span>{s.duracao}</span>}"
new_dur = "{s.duracao && <span>{typeof s.duracao==='number'?s.duracao+' min':String(s.duracao).includes('min')?String(s.duracao):String(s.duracao)+' min'}</span>}"
print('Achou duracao:', old_dur in c)
c = c.replace(old_dur, new_dur, 1)

# 3. Rodape
old_f = "Agendamento via <span style={{ color: '#4B5563' }}>ClienteMarcado</span>"
new_f = "Agendamento online via <span style={{ color: '#4B5563' }}>ClienteMarcado</span>"
print('Achou rodape:', old_f in c)
c = c.replace(old_f, new_f, 1)

# 4. Subtitulo servicos
old_s = '<p className="sec-title">Serviços</p>'
new_s = '<p className="sec-title">Serviços</p>\n            <p style={{ fontSize: \'12px\', color: \'#64748B\', marginTop: \'-8px\', marginBottom: \'14px\' }}>Escolha um serviço para ver os horários disponíveis.</p>'
print('Achou sec-title:', old_s in c)
c = c.replace(old_s, new_s, 1)

with open('app/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
