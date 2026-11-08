// Varreduras estaticas de seguranca e isolamento do Pix e dos icones (leem os arquivos do pacote ja instalado). Nao substituem testes com o Supabase real.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
const RAIZ = path.resolve(import.meta.dirname, '..')
const ler = (f) => readFileSync(path.join(RAIZ, f), 'utf8')
const semStrings = (t) => t.replace(/'(?:[^']|'')*'/g, "''")
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[ \t])\/\/.*$/gm, '$1').replace(/^\s*--.*$/gm, '')
const NOVOS = ['app/lib/marcas.ts', 'app/lib/pix.ts', 'app/lib/pix-servidor.ts', 'app/components/IconeMarca.tsx', 'app/components/PixCardPublico.tsx', 'app/api/pix/[slug]/route.ts', 'app/painel/perfil/pix/page.tsx']

test('Pix publico: a rota so LE (GET), so pelo helper de servidor, sem cliente anon, sem consulta propria ao banco, revalida o payload e nunca serve invalido', () => {
  const s = semComentarios(ler('app/api/pix/[slug]/route.ts'))
  assert.deepEqual([...s.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]), ['GET'])
  assert.doesNotMatch(s, /\.(insert|update|upsert|delete|from|rpc)\(|service_role|SERVICE_ROLE|createClient\(|lib\/supabase'|console\.|cookies\(|headers\(/)
  assert.match(s, /buscarCodigoPix\(slug\)/); assert.match(s, /normalizarSlug\(bruto\)/); assert.match(s, /validarPayloadPix\(pix\.payload\)/); assert.match(s, /if \(!v\.ok\) return naoEncontrado\(\)/)
  assert.match(s, /'Content-Type': 'application\/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'/)
  assert.doesNotMatch(s, /user_id:|chave|tipo_chave|modo:/) // a resposta nao devolve user_id, chave separada nem modo
})
test('Pix: a tabela pagina_pix so e acessada pelo painel (sessao do dono, RLS); a pagina publica so recebe o RESUMO pelo servidor; nenhum codigo Pix vai no HTML publico', () => {
  assert.match(semComentarios(ler('app/painel/perfil/pix/page.tsx')), /from\('pagina_pix'\)/)
  const pc = semComentarios(ler('app/components/PixCardPublico.tsx'))
  assert.doesNotMatch(pc, /supabase|from\(|rpc\(/)
  assert.match(pc, /fetch\(`\/api\/pix\/\$\{encodeURIComponent\(p\.slug\)\}`/); assert.match(pc, /cache: 'no-store'/); assert.doesNotMatch(pc, /payload=\{|chave=\{/)
  const props = /interface Props \{([^}]*)\}/.exec(pc)[1]; assert.doesNotMatch(props, /payload|chave|nome_recebedor|user_id/)
  for (const f of ['app/lib/pix-servidor.ts', 'app/api/pix/[slug]/route.ts', 'app/components/PixCardPublico.tsx']) assert.doesNotMatch(semComentarios(ler(f)), /pagina_pix_publico/, f) // a view publica nao existe mais
})
test('Pix: a chave de servidor (service_role) so e usada em lib/pix-servidor.ts; nenhum componente cliente a importa; so as funcoes por slug sao chamadas; nada de listagem', () => {
  for (const f of NOVOS) { const s = semComentarios(ler(f)); const usa = /SERVICE_ROLE|service_role/.test(s); assert.equal(usa, f === 'app/lib/pix-servidor.ts', f) }
  const sv = semComentarios(ler('app/lib/pix-servidor.ts'))
  assert.match(sv, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/); assert.doesNotMatch(sv, /NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_[A-Z_]*SERVICE/); assert.match(sv, /persistSession: false/)
  assert.deepEqual([...new Set([...sv.matchAll(/\.rpc\(/g)].map(() => 'rpc'))], ['rpc']); assert.doesNotMatch(sv, /\.from\(|\.select\(|\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
  assert.match(sv, /'pix_publico_resumo' \| 'pix_publico_codigo'/) // so os dois nomes de funcao conhecidos
  const varre = (dir) => readdirSync(path.join(RAIZ, dir), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === 'node_modules' || e.name === '.next' ? [] : varre(path.join(dir, e.name))) : [path.join(dir, e.name)])
  for (const f of varre('app').filter((x) => /\.(tsx?|jsx?)$/.test(x))) { const t = readFileSync(path.join(RAIZ, f), 'utf8'); if (/^\s*['"]use client['"]/.test(t)) assert.doesNotMatch(t, /pix-servidor/, 'componente CLIENTE importa o modulo de servidor: ' + f) }
  const pagina = semComentarios(ler('app/[slug]/page.tsx')); assert.match(pagina, /import \{ buscarResumoPix \} from '\.\.\/lib\/pix-servidor'/); assert.match(pagina, /await buscarResumoPix\(perfil\.slug \|\| slug\)/); assert.doesNotMatch(pagina, /pagina_pix/)
})
test('Pix e icones: NENHUM bloqueio por plano nem dependencia de pagamentos (Asaas, Mercado Pago, assinaturas, afiliados, comissoes)', () => {
  for (const f of NOVOS) {
    const s = semComentarios(ler(f))
    assert.doesNotMatch(s, /ehPlano|permite[A-Z]|obterLimite|plano_tipo|status_acesso|data_vencimento|trial_ends|upgrade/i, f)
    assert.doesNotMatch(s, /asaas|mercado_?pago|mp_subscription|gateway|comiss|afiliad|parceiro|webhook|checkout|assinatura/i, f)
  }
})
test('Pix e icones: sem armazenamento local, sem cookies/sessao no lado publico, sem HTML dinamico (so CSS estatico no painel), sem eval', () => {
  for (const f of NOVOS) {
    const s = semComentarios(ler(f))
    assert.doesNotMatch(s, /localStorage|sessionStorage|document\.cookie|\beval\s*\(|new Function|innerHTML/, f)
    if (f !== 'app/painel/perfil/pix/page.tsx') assert.doesNotMatch(s, /dangerouslySetInnerHTML/, f)
  }
  const painel = ler('app/painel/perfil/pix/page.tsx'); assert.equal((painel.match(/dangerouslySetInnerHTML/g) || []).length, 1); assert.match(painel, /__html: CSS/)
  for (const f of ['app/components/PixCardPublico.tsx', 'app/components/IconeMarca.tsx', 'app/api/pix/[slug]/route.ts']) assert.doesNotMatch(semComentarios(ler(f)), /supabase\.auth|getSession|getUser|access_token|Authorization|Bearer/, f)
})
test('painel Pix: grava so em pagina_pix com user_id da SESSAO (upsert por user_id), valida o formato antes e nunca pede credenciais bancarias', () => {
  const s = semComentarios(ler('app/painel/perfil/pix/page.tsx'))
  assert.match(s, /supabase\.auth\.getUser\(\)/); assert.match(s, /\.upsert\(\s*\{ user_id: userId,/); assert.match(s, /onConflict: 'user_id'/); assert.match(s, /\.delete\(\)\.eq\('user_id', userId\)/)
  assert.match(s, /validarPayloadPix\(colar\)/); assert.match(s, /montarPixEstatico\(\{ tipoChave, chave, nome, cidade \}\)/); assert.match(s, /if \(!r \|\| !r\.ok\)/)
  assert.doesNotMatch(s, /type="password"|name="(senha|password|token|cvv)"|\b(senha|password|token|cvv|agencia|conta_corrente)\w*\s*[:=]/i) // nenhum CAMPO de credencial (o texto da tela pode dizer que nunca pede senha)
  assert.doesNotMatch(s, /\bfetch\(/) // o painel nao chama nenhuma API externa
})
test('SQL do Pix v2: SEM view publica; RLS do dono; leitura publica so por funcoes SECURITY DEFINER com search_path vazio, sem SQL dinamico, EXECUTE so para service_role', () => {
  const s = semComentarios(ler('sql_marcas_pix/02_pagina_pix.sql'))
  assert.doesNotMatch(s, /create (or replace )?view/i); assert.match(s, /drop view if exists public\.pagina_pix_publico/)
  assert.match(s, /enable row level security/); assert.doesNotMatch(s, /force row level security/) // o dono da tabela (funcoes) precisa ler; nao ha FORCE
  assert.equal((s.match(/create policy/g) || []).length, 4); assert.equal((s.match(/user_id = auth\.uid\(\)/g) || []).length, 5)
  assert.match(s, /revoke all on public\.pagina_pix from public, anon/); assert.doesNotMatch(s, /grant[^;]*\banon\b/); assert.doesNotMatch(s, /grant\b[^;]*\bto\s+(?:[a-z_]+\s*,\s*)*public\s*(?:,|;|$)/im) /* nenhum grant TO PUBLIC (o schema 'public.' nao conta) */
  assert.match(s, /grant select, insert, update, delete on public\.pagina_pix to authenticated/)
  for (const fn of ['pix_publico_resumo', 'pix_publico_codigo']) {
    assert.match(s, new RegExp(`revoke all on function public\\.${fn}\\(text\\) from public, anon, authenticated`)); assert.match(s, new RegExp(`grant execute on function public\\.${fn}\\(text\\) to service_role`))
    const corpo = new RegExp(`function public\\.${fn}\\(p_slug text\\)[\\s\\S]*?\\$f\\$;`).exec(s)[0]
    assert.match(corpo, /char_length\(p_slug\) not between 1 and 80/); assert.match(corpo, /p_slug is null or/); assert.match(corpo, /\[\[:cntrl:\]\[:space:\]\/\\\\\?#%@<>"''`\]/) // CADA funcao valida o slug
    assert.match(corpo, /security definer set search_path = ''/); assert.match(corpo, /language plpgsql stable/); assert.doesNotMatch(corpo, /\bexecute\b|format\(/i); assert.match(corpo, /limit 1/); assert.match(corpo, /where p\.slug = p_slug and x\.ativo/)
    assert.doesNotMatch(corpo.split('return query')[1].split('from')[0], /user_id|id\b|payload.*payload/) // o SELECT nao devolve user_id
  }
  assert.match(s, /char_length\(p_slug\) not between 1 and 80/); assert.match(s, /\[\[:cntrl:\]\[:space:\]\/\\\\\?#%@<>"''`\]/)
  assert.equal((s.match(/to service_role/g) || []).length, 2); assert.match(s, /references auth\.users\(id\) on delete cascade/); assert.match(s, /user_id\s+uuid not null unique/)
  assert.match(s, /payload ~ '\^\[ -~\]\+\$'/); assert.match(s, /char_length\(payload\) between 40 and 512/); assert.doesNotMatch(s, /drop table|truncate|delete from|update public\.(?!pagina_pix)/)
})
test('SQL aditivo e reversivel: 01 so adiciona uma coluna opcional; 02 so cria objetos novos; rollback nasce INERTE; validacao so le', () => {
  const s1 = semComentarios(ler('sql_marcas_pix/01_icone_marca.sql')); assert.match(s1, /add column if not exists icone_marca text/); assert.doesNotMatch(s1, /drop |delete |truncate|update public|policy|grant/i)
  const rb = ler('sql_marcas_pix/04_rollback_inerte.sql'); assert.match(rb, /v_pix text := 'NAO'/); assert.match(rb, /v_remover_coluna text := 'NAO'/)
  const val = semStrings(semComentarios(ler('sql_marcas_pix/03_validar.sql'))); assert.doesNotMatch(val, /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke)\b/i)
  assert.deepEqual(readdirSync(path.join(RAIZ, 'sql_marcas_pix')).sort(), ['01_icone_marca.sql', '02_pagina_pix.sql', '03_validar.sql', '04_rollback_inerte.sql'])
})
test('icones: IconeMarca so desenha tracados da tabela fixa do codigo (nunca dado do usuario) e o logo proprio local', () => {
  const s = semComentarios(ler('app/components/IconeMarca.tsx'))
  assert.match(s, /ICONES_MARCAS\[id\]/); assert.match(s, /\/brand-icons\/minipage\.png/); assert.doesNotMatch(s, /https?:\/\//)
})
