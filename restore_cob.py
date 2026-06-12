import subprocess
r = subprocess.run(['git','show','HEAD~2:app/painel/cobrancas/page.tsx'], capture_output=True)
open('app/painel/cobrancas/page.tsx','wb').write(r.stdout)
print('Restaurado:', len(r.stdout))
