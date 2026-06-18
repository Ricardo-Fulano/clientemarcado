with open('app/painel/servicos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar Outros aos FILTROS
c = c.replace(
    "const FILTROS=['Todos','Ativos','Inativos','Barbearia / Salão','Estética','Clínica','Odontologia']",
    "const FILTROS=['Todos','Ativos','Inativos','Barbearia / Salão','Estética','Clínica','Odontologia','Outros']"
)

# 2. Corrigir logica de filtro para incluir Outros
old_f = "const passaF=filtro==='Todos'||(filtro==='Ativos'&&s.ativo)||(filtro==='Inativos'&&!s.ativo)||s.categoria===filtro"
new_f = "const CATS_MAIN=['Barbearia / Salão','Estética','Clínica','Odontologia'];const passaF=filtro==='Todos'||(filtro==='Ativos'&&s.ativo)||(filtro==='Inativos'&&!s.ativo)||(filtro==='Outros'&&(!s.categoria||!CATS_MAIN.includes(s.categoria)))||s.categoria===filtro"
print('Achou filtro:', old_f in c)
c = c.replace(old_f, new_f, 1)

# 3. Trocar fil-sv para grid 2 colunas no mobile
old_css = ".fil-sv{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;width:100%}.fil-sv .pill{flex:1 1 calc(33% - 8px);text-align:center;justify-content:center;display:flex;align-items:center}@media(max-width:480px){.fil-sv .pill{flex:1 1 calc(50% - 8px)}}"
new_css = ".fil-sv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;width:100%}.fil-sv .pill{flex-shrink:0;text-align:center;justify-content:center;display:flex;align-items:center;white-space:normal;font-size:11px;height:36px;padding:0 8px}@media(max-width:767px){.fil-sv{grid-template-columns:repeat(2,1fr)!important}.fil-sv .pill{height:40px!important;font-size:12px!important}}"
print('Achou CSS:', old_css in c)
c = c.replace(old_css, new_css, 1)

with open('app/painel/servicos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
