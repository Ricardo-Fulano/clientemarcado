'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Registro = Record<string, unknown> & { id: string; ativo?: boolean }
type Grupo = { tabela: string; titulo: string; registros: Registro[]; erro?: string }

const FONTES: ReadonlyArray<{ tabela: string; titulo: string }> = [
  { tabela: 'pagina_destaques', titulo: 'Destaques' },
  { tabela: 'pagina_links', titulo: 'Links' },
  { tabela: 'pagina_videos', titulo: 'Vídeos' },
  { tabela: 'pagina_cards', titulo: 'Cartões visuais' },
  { tabela: 'pagina_catalogo_itens', titulo: 'Itens do catálogo' },
]

const PISTAS_EXEMPLO = /seu banner|seu principal produto|sua principal oferta|escolha o t[ií]tulo|renomeie da sua maneira|adicione.*produto|trouxe a imagem|use este espa[cç]o|exemplo ilustrativo|minipage, do seu jeito/i

function texto(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function descricao(r: Registro): string {
  return [r.titulo, r.nome, r.descricao, r.descricao_curta, r.url, r.imagem_url].map(texto).filter(Boolean).join(' • ').slice(0, 260) || `Registro ${r.id.slice(0, 8)}`
}

export default function RevisarConteudoPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [status, setStatus] = useState('Conferindo sua conta...')
  const [desativando, setDesativando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setStatus('Lendo somente os conteúdos da sua conta...')
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser()
    if (erroAuth || !user) { setStatus('Entre na sua conta para revisar os conteúdos.'); setUserId(null); return }
    setUserId(user.id)
    const resultados: Grupo[] = []
    for (const fonte of FONTES) {
      const { data, error } = await supabase.from(fonte.tabela).select('*').eq('user_id', user.id).limit(200)
      resultados.push({
        ...fonte,
        registros: !error && Array.isArray(data) ? (data as Registro[]).filter(r => r && typeof r.id === 'string' && r.ativo !== false) : [],
        erro: error ? error.message : undefined,
      })
    }
    setGrupos(resultados)
    setStatus('Revisão concluída. Nada foi alterado.')
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  async function desativar(tabela: string, registro: Registro) {
    if (!userId || !FONTES.some(x => x.tabela === tabela) || desativando) return
    const titulo = descricao(registro)
    if (!window.confirm(`Desativar este conteúdo na sua MiniPage?\n\n${titulo}\n\nEle não será apagado do banco. Você poderá reativá-lo no painel correspondente.`)) return
    const idOperacao = `${tabela}/${registro.id}`
    setDesativando(idOperacao)
    setStatus('Desativando somente o item selecionado...')
    const { data, error } = await supabase.from(tabela)
      .update({ ativo: false })
      .eq('user_id', userId)
      .eq('id', registro.id)
      .select('id')
    if (error || !Array.isArray(data) || data.length !== 1) {
      setStatus(`Não foi possível confirmar a desativação. Nenhum sucesso foi presumido. ${error?.message || 'Verifique as permissões da conta.'}`)
    } else {
      setGrupos(prev => prev.map(g => g.tabela === tabela ? { ...g, registros: g.registros.filter(r => r.id !== registro.id) } : g))
      setStatus('Item desativado. Atualize sua página pública para confirmar.')
    }
    setDesativando(null)
  }

  const shell: CSSProperties = { minHeight: '100vh', padding: '28px 16px 60px', background: '#0B0A10', color: '#F6F3FA', fontFamily: 'system-ui,sans-serif' }
  const panel: CSSProperties = { padding: 20, borderRadius: 16, border: '1px solid #41364A', background: '#1A1422', marginBottom: 18 }
  const secondary: CSSProperties = { color: '#BFB3C9', fontSize: 14, lineHeight: 1.6 }

  return <main style={shell}>
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link href="/painel" style={{ color: '#C9FA45', textDecoration: 'none', fontSize: 14 }}>← Voltar ao painel</Link>
      <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', margin: '20px 0 8px' }}>Revisar conteúdos da MiniPage</h1>
      <p style={secondary}>Aqui você pode identificar conteúdos antigos e demonstrativos, sem apagar sua página, assinatura ou dados de pagamento. A sugestão de exemplo não significa que um item seja necessariamente fictício.</p>
      <div style={{ ...panel, borderColor: '#788E33' }}>
        <strong style={{ color: '#C9FA45' }}>Somente sua conta • Nenhuma exclusão permanente</strong>
        <p style={secondary}>Cada desativação exige uma confirmação individual. Os itens permanecem armazenados e podem ser reativados no gerenciador de conteúdo correspondente. Banner e foto de perfil não são alterados nesta ferramenta.</p>
        <button type="button" onClick={() => void carregar()} disabled={Boolean(desativando)} style={{ padding: '10px 16px', background: '#C9FA45', color: '#111', border: 0, borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}>Atualizar lista</button>
      </div>
      <p role="status" style={{ ...secondary, marginBottom: 20 }}>{status}</p>
      {grupos.map(g => <section key={g.tabela} style={panel}>
        <h2 style={{ fontSize: 19, margin: '0 0 12px' }}>{g.titulo} <span style={{ color: '#C9FA45', fontSize: 14 }}>({g.registros.length})</span></h2>
        {g.erro ? <p style={{ color: '#FFB3B3' }}>Consulta indisponível: {g.erro}. Nenhum item dessa seção foi alterado.</p> : null}
        {!g.erro && g.registros.length === 0 ? <p style={secondary}>Nenhum item ativo encontrado.</p> : null}
        <div style={{ display: 'grid', gap: 10 }}>
          {g.registros.map(r => {
            const desc = descricao(r)
            const suspeito = PISTAS_EXEMPLO.test(desc)
            const busy = desativando === `${g.tabela}/${r.id}`
            return <div key={r.id} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #44364E', borderRadius: 12, padding: 12, background: '#120E19' }}>
              <div style={{ minWidth: 200, flex: '1 1 300px', overflowWrap: 'anywhere' }}>
                {suspeito ? <span style={{ color: '#D5EF8A', fontWeight: 700, fontSize: 12 }}>Possível conteúdo de exemplo</span> : null}
                <p style={{ margin: '6px 0', fontSize: 14 }}>{desc}</p>
                <small style={{ color: '#9D8CA9' }}>ID: {r.id.slice(0, 12)}</small>
              </div>
              <button type="button" disabled={Boolean(desativando)} onClick={() => void desativar(g.tabela, r)} style={{ border: '1px solid #9E5263', borderRadius: 9, padding: '10px 14px', background: '#321D29', color: '#FFD3D9', cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Desativando...' : 'Desativar item'}</button>
            </div>
          })}
        </div>
      </section>)}
      <div style={panel}>
        <strong>Próxima etapa: criação realmente automática</strong>
        <p style={secondary}>Após separar o conteúdo antigo, conectaremos a importação autorizada do Instagram e a montagem de mídia real. Esta página não tenta importar fotos ou acessar redes sem permissão.</p>
      </div>
    </div>
  </main>
}
