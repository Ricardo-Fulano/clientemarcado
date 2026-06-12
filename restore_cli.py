import subprocess
r = subprocess.run(['git','show','HEAD~1:app/painel/clientes/page.tsx'], capture_output=True)
open('app/painel/clientes/page.tsx','wb').write(r.stdout)
print('Restaurado:', len(r.stdout), 'bytes')
