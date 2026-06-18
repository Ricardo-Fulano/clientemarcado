with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')
for i,l in enumerate(lines):
    if "view==='form'" in l or 'padding:' in l and ('32px' in l or '20px' in l or '24px' in l) and i>400 and i<700:
        print(i+1, repr(l[:120]))
