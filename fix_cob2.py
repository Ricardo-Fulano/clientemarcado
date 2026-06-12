with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Remover SB_LINKS que nao e mais usado
import re
c = re.sub(r'const SB_LINKS=\[[\s\S]*?\]\n', '', c, count=1)

# Remover SidebarComp inteira
c = re.sub(r'  const SidebarComp=\(\)=>\([\s\S]*?\n  \)\n', '', c, count=1)

# Remover uso de SidebarComp
c = c.replace('      <SidebarComp/>\n', '')

# Remover drawer e ovl (mobile drawer proprio)
c = re.sub(r"      <div className=\{ovl\$\{mob.*?\}.*?/>\n", '', c, count=1)
c = re.sub(r"      <div className=\{drw\$\{mob.*?</div>\n      </div>\n", '', c, count=1)

# Remover estado mob e funcao sair
c = c.replace("  const [mob,setMob]=useState(false)\n", '')

# Remover mob-hdr proprio (PainelSidebar ja tem)
c = re.sub(r'        <div className="mob-hdr">[\s\S]*?</div>\n', '', c, count=1)

# Substituir div.main por psb-main
c = c.replace('<div className="main">', '<div className="psb-main">')

# Adicionar PainelSidebar no JSX (antes do psb-main)
c = c.replace('<div className="psb-main">', '<PainelSidebar nome={nome} tituloMobile="Cobrancas"/>\n      <div className="psb-main">', 1)

# Corrigir CSS main
c = c.replace('.main{margin-left:220px;flex:1;min-height:100vh;width:calc(100% - 220px);max-width:calc(100% - 220px)}', '')
c = c.replace("  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}", "")

print('SB_LINKS:', 'SB_LINKS' not in c)
print('SidebarComp:', 'SidebarComp' not in c)
print('PainelSidebar:', 'PainelSidebar' in c)

with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
