with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')

print('Antes:', len(lines))
print('L740:', repr(lines[739]))
print('L801:', repr(lines[800]))

# Remover linhas 740 a 801 (indices 739 a 800) - bloco odonto toggle + odontograma
new_lines = lines[:739] + lines[801:]
print('Depois:', len(new_lines))

# Verificar que nao quebrou
print('L739 nova:', repr(new_lines[739]))

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
print('SALVO!')
