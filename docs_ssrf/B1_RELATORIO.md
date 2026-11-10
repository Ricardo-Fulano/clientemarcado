# B1 (versão 2): correção do SSRF em `/api/catalogo/preview-link`

Commit de referência: `cf8cbfbbb79e0178b164cb983f7c4f56d858b0ad`. Estado deste pacote: **versão 2, preparada e validada no ambiente isolado; não instalado**. Não toca em pagamentos, Asaas, Mercado Pago, Pix, afiliados, transferências, MCP, integrações de vendas, banco/Supabase, Git, Vercel nem nos 24 arquivos da B0.

## 0. Revisão final (v2): ajustes em relação à v1
1. **Leitura do corpo com prazo e cancelamento** (`lerJsonLimitado`): prazo de `TEMPO_CORPO_MS = 5000` ms; a leitura é cancelada (`reader.cancel()`) ao esgotar o prazo, ao exceder o teto de 4 KB e quando o **cliente desconecta** (`request.signal`); cada leitura compete com o prazo, então a função retorna no prazo **mesmo que o fluxo ignore o cancelamento**. Na rota, o corpo passou a ser lido **antes** de ocupar a vaga de concorrência (ordem: autenticação → corpo → vaga → limite por usuário → lógica original): um cliente lento **nunca** retém vaga. Corpo lento, incompleto ou cancelado resulta em `400` (mesma mensagem de sempre) e nenhuma busca externa.
2. **Prazo no navegador** (`chamarPreviewLink`): `TEMPO_CLIENTE_MS = 20000` ms (o servidor responde em até ~14 s no pior caso). Ao esgotar, o pedido é cancelado (`AbortController`) e o usuário recebe "A consulta demorou demais. Tente novamente ou preencha manualmente."; o helper também retorna no prazo se o `fetch` ignorar o cancelamento ou se a leitura do JSON travar.
3. **Sessão expirada preserva os dados e não redireciona**: o helper não redireciona, não faz logout, não recarrega a página e não devolve nenhum campo de dados (só `success`, `message` e `origemCliente: true`). As telas só preenchem campos a partir de uma prévia bem-sucedida; na falha usam apenas `titulo_fallback`, que o helper nunca devolve. Para que o usuário **veja** o motivo, as telas de **Eventos** e **Vídeos** (que ignoravam `dados.message`) ganharam uma 3ª edição de uma linha: `setMsg(dados.origemCliente?dados.message:'<mensagem original>')`; Catálogo e Destaques já exibiam `dados.message`. As mensagens originais continuam como fallback.
4. **`LIMITE_POR_USUARIO_CONFIRMADO = false` mantido.** Nenhum SQL foi executado e a definição de `checar_rate_limit` continua não confirmada.
Ver também `evidencias/DIFERENCAS_V1_V2.md`.

## 1. O que mudou
**Rota** (`route.ts`, 5 edições por âncora; a lógica de extração de prévias continua intacta):
- Exige `Authorization: Bearer <token>` e valida no servidor com `supabase.auth.getUser(token)` (cliente de chave pública, sem sessão persistida). Nunca usa IDs enviados pelo cliente. Sem token válido: `401 {success:false,message:'Sua sessão expirou. Entre novamente.'}`.
- Corpo limitado a 4 KB **e a 5 s de recebimento (lido antes de ocupar vaga)**; a URL é validada **antes de qualquer rede** (`validarUrlExterna`): só `http`/`https`, portas 80/443, sem usuário/senha, sem hosts internos, IP somente público. URL inválida ou proibida: `400` com a mesma mensagem de sempre, sem nenhuma chamada externa.
- Toda busca externa passa por `fetchSeguro` (as 4 chamadas: 3 oEmbed e a página). `export const runtime = 'nodejs'`.
- Concorrência: no máximo 8 consultas simultâneas **por instância** (ver 3).

**`fetchSeguro`**: conexão **fixada** em endereço público validado (lookup próprio: resolve uma vez, valida todos os endereços, entrega ao socket só os validados; resposta mista recusa tudo); redirecionamentos manuais (máx. 3) com revalidação completa a cada salto; TLS padrão do Node (certificado e hostname verificados, SNI pelo nome, TLS ≥ 1.2) e recusa de HTTPS se `NODE_TLS_REJECT_UNAUTHORIZED=0`; `Agent` próprio (o agente global, afetado por variáveis de proxy, nunca é usado); só cabeçalhos `User-Agent`, `Accept`, `Accept-Language` (nunca `Authorization`, cookies ou `Referer`); sem keep-alive; limites de tempo total (8 s), corpo (3 MB; 256 KB para oEmbed, **contados após a descompressão**), cabeçalhos (16 KB) e tipos de conteúdo.

**Ao ultrapassar qualquer limite a leitura é INTERROMPIDA e o resultado é `ok:false`**: o fluxo existente usa o fallback seguro. Um corpo truncado **nunca** é processado como prévia válida (teste dedicado).

**Telas** (Catálogo, Destaques, Eventos, Vídeos): cada uma troca 2 linhas (`fetch` + `res.json()`) por `chamarPreviewLink(...)` e ganha 1 `import`; Eventos e Vídeos têm ainda a edição de 1 linha da mensagem (seção 0, item 3). O helper envia o token da sessão (`getSession()`, mesmo padrão de `garantir-perfil-cliente.ts`) e devolve o JSON do servidor **inalterado**; só 401, 429, prazo esgotado, falha de rede e resposta ilegível viram `{success:false,message,origemCliente:true}`.

## 2. Arquivos
**Modificados (5)** — só se o SHA-256 bruto bater com o esperado:
| Arquivo | SHA-256 esperado (início) | Edições |
|---|---|---|
| `app/api/catalogo/preview-link/route.ts` | `abc3ba413ca5…` | 5 |
| `app/painel/perfil/catalogo/[catalogoId]/page.tsx` | `96c6fa4fdcfe…` | 2 |
| `app/painel/perfil/destaques/[secaoId]/page.tsx` | `3e16e09d9614…` | 2 |
| `app/painel/perfil/eventos/page.tsx` | `4e0edf193434…` | 3 |
| `app/painel/perfil/videos/page.tsx` | `6bd116f626eb…` | 3 |

**Novos (28):** `app/lib/seguranca/url-externa.ts`, `app/lib/seguranca/fetch-seguro.ts`, `app/lib/auth-bearer-servidor.ts`, `app/lib/preview-link-limite.ts`, `app/lib/preview-link-cliente.ts`; `docs_ssrf/B1_RELATORIO.md`; `testes_ssrf/` com 10 suítes `*.test.mjs`, `rota-regressao.golden.json`, `gerar_golden_rota.mjs` e `suporte/` (10 arquivos). Nenhuma dependência nova (só módulos nativos do Node e o `@supabase/supabase-js` já existente).

## 3. Limites, pendências e o que NÃO foi feito
1. **Concorrência é POR INSTÂNCIA.** O limite de 8 consultas simultâneas é um contador em memória do processo. **Não é proteção global na Vercel**: cada instância tem o seu contador e o número de instâncias não é controlado aqui. Serve para limitar o consumo de recursos de uma instância.
2. **Limitador por usuário via `checar_rate_limit`: PENDENTE e DESATIVADO.** A definição da função não foi confirmada, então a semântica do retorno **não é presumida**. O módulo existe e é testado, mas `LIMITE_POR_USUARIO_CONFIRMADO = false` e a rota funciona sem acessar o banco. Para ativar: confirmar a definição, mudar a constante em `preview-link-limite.ts` e ajustar a leitura do retorno se for diferente de `true`/`false`. Um teste falha se alguém ativar a constante sem rever este ponto.
3. **Saneamento de URLs de imagem NÃO foi incluído**: o código original devolve as imagens como extraídas (inclusive relativas, ver o caso `http-antigo` do golden) e as telas dependem disso. Mudar isso alteraria o contrato.
4. A rota **não consegue** impedir o acesso a hosts públicos (por definição) nem a coleta lenta feita por usuário autenticado; o limitador por usuário (item 2) é a mitigação prevista.
5. O teste de conexão por IPv6 real foi **ignorado no ambiente de validação** (sem IPv6 em *loopback*); a classificação de IPv6 é testada por tabelas (66 endereços). Ele roda na sua máquina se houver IPv6.
6. Outras rotas com `fetch` de URL controlada pelo usuário **não** foram auditadas (fora do escopo).
7. A validação do token (`supabase.auth.getUser`) não tem prazo explícito próprio (usa o padrão do cliente); ela ocorre **antes** da leitura do corpo e da vaga, então não retém vaga, mas um Supabase lento atrasaria a resposta até o limite da função na Vercel. Pode virar um ajuste futuro.

## 4. Mudanças de comportamento (aprovadas no plano)
Portas diferentes de 80/443, hosts sem ponto, URLs com usuário/senha e IPs privados deixam de funcionar (400). Corpo não-JSON agora é `400` (antes `500`). HTML acima de 3 MB, tipos de conteúdo inesperados (PDF, imagem...) e destinos que resolvem para IP privado viram o fallback uniforme. Todas as chamadas exigem sessão válida; abas antigas recebem a mensagem de sessão expirada até recarregar.

## 5. Testes (validados no sandbox; Node 24.15.0 e 22.23.4)
| Suíte | Resultado |
|---|---|
| B1 `testes_ssrf` (10 arquivos) | **136 testes: 135 aprovados, 1 ignorado (IPv6 real)** |
| Instalador (32 cenários) | 32 de 32 |
| Mutação | **54 de 54** defeitos de segurança detectados |
| E2E com Next 16.2.6 real e servidor de autenticação falso (inclui 12 clientes lentos) | **24 de 24** |
| `tsc --noEmit` estrito e `next build` (Next 16.2.6, Turbopack) | sem erros; rota dinâmica |
| Regressão no mesmo repositório | B0 68/68, Card 28/28, Marcas+Pix 50/50 |

A suíte de **transferência (36 testes, `npx --no-install tsx --test`) não existe no ambiente de validação**: ela é a parte da referência de **182 testes** (28 + 50 + 36 + 68) que **você** executa.
Cobertura (a v2 acrescenta: prazo e cancelamento do corpo, vaga nunca retida por cliente lento, prazo do navegador, sessão expirada sem redirecionamento e sem perda de dados): DNS rebinding (resolvedor falso que muda de resposta; o servidor "isca" nunca é tocado), conexão ao IP validado, redirecionamentos (cadeia, laço, esquemas e IPs proibidos), IPv4/IPv6 (mais de 150 endereços), TLS (certificado válido, sem CA confiável, hostname errado, autoassinado, expirado, `NODE_TLS_REJECT_UNAUTHORIZED=0`, SNI), limites (Content-Length, fluxo infinito interrompido, *zip bomb*, cabeçalhos gigantes, tipos, tempo total e *slow-loris*), proxy por ambiente, autenticação, 401/400/429, fallback sem processar HTML truncado e regressão diferencial contra o `route.ts` **original** (27 casos: YouTube, TikTok, Spotify, genéricas, Shopee, Mercado Livre, Kiwify, eventos, erros, entradas inválidas). Todos os testes de rede usam servidores em *loopback* e resolvedor falso: nenhuma requisição sai da máquina.
Os certificados em `suporte/certificados-teste.mjs` são chaves descartáveis só para teste (scanners de segredos podem sinalizá-las: falso positivo).

## 6. Procedimento (um passo por vez, na raiz do projeto, SOMENTE após auditar o pacote)
1. `node C:\caminho\do\pacote\aplicar_b1.js . --verificar` (nada é gravado): os 5 arquivos devem aparecer como "versão esperada".
2. `node C:\caminho\do\pacote\aplicar_b1.js . --dry-run`: lista **exatamente** os 5 arquivos que serão modificados e os 28 novos. **Se qualquer um aparecer DIVERGENTE ou a âncora não bater, a instalação aborta sem alterar nada.**
3. **(só com autorização)** `node C:\caminho\do\pacote\aplicar_b1.js .` (backup fora do projeto em `<pasta>_backups_b1_ssrf` + recibo).
4. `node --no-warnings --test --test-reporter=tap "testes_ssrf/*.test.mjs" 2>&1 | findstr /b /c:"# tests" /c:"# pass" /c:"# fail" /c:"# skipped" /c:"not ok"` (esperado 136 / 135 / 0 / 1, ou 136 / 136 / 0 / 0 se houver IPv6 em *loopback*).
5. Regressão: `node --test "testes_cartao/*.test.mjs"` (28), `node --test "testes_marcas_pix/*.test.mjs"` (50), `npx --no-install tsx --test` na suíte de transferência (36), `node --no-warnings --test "testes_caracterizacao/*.test.mjs"` (68): **182**.
6. `npx tsc --noEmit` (se acusar `res` não definido em alguma tela, uma delas usava `res` depois do trecho trocado: me avise) e `npm run build`.
7. Checklist no localhost (`npm run dev`), nas 4 telas: colar link do YouTube, Spotify, TikTok e de loja pública e conferir título/imagem; colar `http://localhost` e ver a mensagem de link inválido; fazer logout em outra aba e gerar prévia (mensagem de sessão expirada); conferir que campos já preenchidos não são sobrescritos.
8. Commit **apenas** com lista explícita (nunca `-A`): os 5 modificados e os 28 novos listados no manifesto; conferir `git diff --cached --name-only`. Rota e telas vão **no mesmo deploy**.

**Reversão:** `node aplicar_b1.js . --reverter` (ou `--reverter --dry-run` para simular). Restaura só os arquivos que ainda forem idênticos ao que o instalador gravou, remove só arquivos novos ainda idênticos ao pacote, **preserva** qualquer arquivo alterado depois e **nunca apaga** arquivo preexistente nem backup.
