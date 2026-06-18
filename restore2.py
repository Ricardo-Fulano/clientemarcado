import subprocess
for path in ['app/[slug]/page.tsx', 'app/painel/orcamentos/novo/page.tsx']:
    r = subprocess.run(['git','show','HEAD~1:'+path], capture_output=True)
    if r.returncode == 0:
        open(path,'wb').write(r.stdout)
        print('Restaurado:', path)
    else:
        print('Erro:', path, r.stderr.decode())
