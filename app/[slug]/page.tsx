import os, glob, re

candidates = []
for root, dirs, files in os.walk('app'):
    for f in files:
        if f == 'page.tsx':
            full = os.path.join(root, f)
            candidates.append(full)

path = None
for p in candidates:
    with open(p, encoding='utf-8') as f:
        content = f.read()
    if 'nomeBusiness' in content and 'getTema' in content:
        path = p
        break

if not path:
    print('Nao encontrado. Dirs:', os.listdir('app'))
    exit()

print('Arquivo:', path)
with open(path, encoding='utf-8') as f:
    c = f.read()

# 1. Remover bloco CTA final via regex
before = len(c)
c = re.sub(
    r'\s*\{/\* CTA FINAL \*/\}[\s\S]*?</div>\s*\n\s*</div>',
    '',
    c,
    count=1
)
print('CTA removido:', len(c) < before)

# 2. Corrigir duracao
old = "{s.duracao && <span>{typeof s.duracao==='number'?s.duracao+' min':String(s.duracao).includes('min')?String(s.duracao):String(s.duracao)+' min'}</span>}"
new = "{s.duracao && <span>{typeof s.duracao==='number'?s.duracao+' min':String(s.duracao).includes('min')?String(s.duracao):String(s.duracao)+' min'}</span>}"
print('Achou duracao:', old in c)
c = c.replace(old, new, 1)

# 3. Rodape
c = c.replace(
    "Agendamento online via <span style={{ color: '#4B5563' }}>ClienteMarcado</span>",
    "Agendamento online via <span style={{ color: '#4B5563' }}>ClienteMarcado</span>"
)
print('Footer:', 'Agendamento online' in c)

# 4. Subtitulo servicos
old_sec = '<p className="sec-title">Serviços</p>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '-8px', marginBottom: '14px' }}>Escolha um serviço para ver os horários disponíveis.</p>'
new_sec = '<p className="sec-title">Serviços</p>\n            <p style={{ fontSize: \'12px\', color: \'#64748B\', marginTop: \'-8px\', marginBottom: \'14px\' }}>Escolha um serviço para ver os horários disponíveis.</p>'
print('Achou sec-title:', old_sec in c)
c = c.replace(old_sec, new_sec, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
