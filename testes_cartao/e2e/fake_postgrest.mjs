// PostgREST FALSO (sandbox): so as 2 tabelas/views que o cartao le, com o mesmo contrato HTTP do supabase-js.
import http from 'node:http'
const PERFIS = [
  { id: 'p1', user_id: 'u-maria', slug: 'maria', nome_negocio: 'Maria <b>Studio</b> & "Cia"', descricao: 'Descrição longa da Maria', pagina_descricao_curta: 'Unhas e beleza em SP', foto_perfil_url: 'https://cdn.exemplo.com/maria.jpg', plano_tipo: 'free', pagina_mostrar_contato: true, endereco: 'Rua A, 10', cidade: 'São Paulo' },
  { id: 'p2', user_id: 'u-joao', slug: 'joao', nome_negocio: 'João Barbearia', descricao: 'Cortes', plano_tipo: 'essencial', pagina_mostrar_contato: false, endereco: 'Rua Secreta, 99', cidade: 'Campinas' },
  { id: 'p3', user_id: 'u-loja', slug: 'loja1', nome_negocio: 'Loja Um', descricao: null, plano_tipo: 'loja', pagina_mostrar_contato: true, endereco: null, cidade: null },
  { id: 'p4', user_id: 'u-ana', slug: 'anakbeautystudio-', nome_negocio: 'Ana Beauty Studio', descricao: '', pagina_descricao_curta: '', plano_tipo: 'equipe', pagina_mostrar_contato: true, endereco: null, cidade: 'Rio' },
  { id: 'p5', user_id: 'u-mal', slug: 'mal', nome_negocio: 'Nome\nEND:VCARD\nBEGIN:VCARD\nFN:Falso', descricao: 'x;y,z\\w', plano_tipo: 'free', pagina_mostrar_contato: true, endereco: 'Rua; 1, ap\n2', cidade: 'X' },
]
const LINKS = {
  'u-maria': [{ id: 'l0', tipo: 'instagram', url: 'https://instagram.com/maria', ativo: true, ordem: 0 }, { id: 'l1', tipo: 'whatsapp', url: 'https://wa.me/5511941059063?text=oi', ativo: true, ordem: 1 }, { id: 'l2', tipo: 'whatsapp', url: 'https://wa.me/5511999990000', ativo: false, ordem: 0 }],
  'u-joao': [{ id: 'l3', tipo: 'telefone', url: 'tel:+55 11 2222-3333', ativo: true, ordem: 1 }],
  'u-ana': [{ id: 'l4', tipo: 'whatsapp', url: 'https://wa.me/message/CODIGOQUALQUER', ativo: true, ordem: 1 }],
  'u-mal': [{ id: 'l5', tipo: 'whatsapp', url: 'https://api.whatsapp.com/send?phone=5511988887777', ativo: true, ordem: 1 }],
}
const log = []
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); log.push(u.pathname + u.search)
  const obj = (req.headers.accept || '').includes('vnd.pgrst.object')
  const eq = (k) => { const v = u.searchParams.get(k); return v && v.startsWith('eq.') ? decodeURIComponent(v.slice(3)) : null }
  let rows = []
  if (u.pathname === '/rest/v1/perfis_publicos') rows = PERFIS.filter((p) => p.slug === eq('slug'))
  else if (u.pathname === '/rest/v1/pagina_links') rows = (LINKS[eq('user_id')] || []).filter((l) => eq('ativo') !== 'true' || l.ativo).sort((a, b) => a.ordem - b.ordem)
  else if (u.pathname === '/__log') { res.writeHead(200); return res.end(JSON.stringify(log)) }
  res.setHeader('Content-Type', obj ? 'application/vnd.pgrst.object+json' : 'application/json')
  if (obj) { if (rows.length !== 1) { res.writeHead(406); return res.end(JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })) } res.writeHead(200); return res.end(JSON.stringify(rows[0])) }
  res.writeHead(200); res.end(JSON.stringify(rows))
}).listen(54399, '127.0.0.1', () => console.log('postgrest falso em 54399'))
