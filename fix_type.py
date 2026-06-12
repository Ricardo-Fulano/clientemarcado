with open('app/painel/servicos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix 1: adicionar duracao_minutos no tipo
c = c.replace(
    "type Servico={id:string;nome:string;descricao?:string;preco?:number;duracao?:string;categoria?:string;profissional_nome?:string;profissionais_ids?:string[];ativo:boolean}",
    "type Servico={id:string;nome:string;descricao?:string;preco?:number;duracao?:number;duracao_minutos?:number;categoria?:string;profissional_nome?:string;profissionais_ids?:string[];ativo:boolean}"
)
print('Tipo fix:', 'duracao_minutos?:number' in c)
with open('app/painel/servicos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
