'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'
import { permiteDestaques, permiteVideos, obterLimiteCatalogos, permiteCatalogoWhatsapp } from '../../lib/planos'
import { gerarCsvBlob, gerarXlsxBlob, montarNomeArquivo, baixarArquivo } from '../../lib/exportarDesempenho'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

type Periodo = '7d' | '30d' | 'mes' | 'tudo'

const OPCOES_PERIODO: { valor: Periodo; label: string }[] = [
  { valor: '7d', label: 'Últimos 7 dias' },
  { valor: '30d', label: 'Últimos 30 dias' },
  { valor: 'mes', label: 'Este mês' },
  { valor: 'tudo', label: 'Todo o período' },
]

// Limite defensivo pra "todo o periodo" nao trazer um volume enorme de linhas de uma vez -
// primeira versao do dashboard, sem paginacao/agregacao no banco ainda.
const LIMITE_EVENTOS_TUDO = 5000

function calcularDataInicio(periodo: Periodo): string | null {
  const agora = new Date()
  if (periodo === '7d') { const d = new Date(agora); d.setDate(d.getDate() - 7); return d.toISOString() }
  if (periodo === '30d') { const d = new Date(agora); d.setDate(d.getDate() - 30); return d.toISOString() }
  if (periodo === 'mes') { const d = new Date(agora.getFullYear(), agora.getMonth(), 1); return d.toISOString() }
  return null // 'tudo' - sem filtro de data
}

function agruparPorTitulo(eventos: any[], tipo: string, top = 5) {
  const contagem: Record<string, number> = {}
  eventos.filter(e => e.tipo_evento === tipo).forEach(e => {
    const titulo = e.item_titulo || '(sem título)'
    contagem[titulo] = (contagem[titulo] || 0) + 1
  })
  return Object.entries(contagem)
    .map(([titulo, qtd]) => ({ titulo, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, top)
}

function RankingCard({ titulo, itens, corVazio }: { titulo: string; itens: { titulo: string; qtd: number }[]; corVazio?: string }) {
  return (
    <div className="crd" style={{ padding: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '14px' }}>{titulo}</p>
      {itens.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#6B5F6B' }}>Sem cliques registrados no período.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {itens.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: '#B8AAB8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.titulo}</p>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#F8F4F7', background: 'rgba(139,92,246,.14)', borderRadius: '999px', padding: '2px 10px', flexShrink: 0 }}>{it.qtd}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CardBloqueado({ titulo }: { titulo: string }) {
  return (
    <div className="crd" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7' }}>{titulo}</p>
      <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.5 }}>Disponível em planos superiores.</p>
      <Link href="/painel/plano" style={{ fontSize: '12px', fontWeight: 700, color: '#EC4899', textDecoration: 'none' }}>Ver planos →</Link>
    </div>
  )
}

export default function Desempenho() {
  const [carregando, setCarregando] = useState(true)
  const [perfil, setPerfil] = useState<any>(null)
  const [eventos, setEventos] = useState<any[]>([])
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [copiado, setCopiado] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [inicioCarregado, setInicioCarregado] = useState<string | null>(null)
  const [menuExportar, setMenuExportar] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [erroExportar, setErroExportar] = useState('')

  useEffect(() => { carregar() }, [periodo])

  async function carregar() {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: p } = await supabase.from('perfis').select('user_id, slug, nome_negocio, plano_tipo').eq('user_id', user.id).maybeSingle()
    setPerfil(p)

    const dataInicio = calcularDataInicio(periodo)
    setInicioCarregado(dataInicio)
    // Sempre filtra explicitamente por user_id (defesa em profundidade, alem do RLS que ja
    // restringe "dono le so os proprios eventos" - nunca confia so numa camada).
    let query = supabase.from('mini_page_eventos').select('tipo_evento, item_titulo, created_at').eq('user_id', user.id)
    if (dataInicio) query = query.gte('created_at', dataInicio)
    query = query.order('created_at', { ascending: false }).limit(LIMITE_EVENTOS_TUDO)

    const { data: evts } = await query
    setEventos(evts || [])

    // Mesmo padrao de defesa em profundidade ja usado acima pros eventos - filtro explicito
    // por user_id, alem do RLS que ja restringe "dono le so os proprios leads".
    if (permiteCatalogoWhatsapp(p?.plano_tipo)) {
      const { data: lds } = await supabase.from('minipage_leads').select('email, item_titulo, origem, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
      setLeads(lds || [])
    }
    setCarregando(false)
  }

  const pubUrl = perfil?.slug ? `https://minipage.pro/${perfil.slug}` : ''

  function copiarLink() {
    if (!pubUrl) return
    navigator.clipboard.writeText(pubUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const totalPageViews = eventos.filter(e => e.tipo_evento === 'page_view').length
  const cliquesTotais = eventos.filter(e => e.tipo_evento !== 'page_view').length
  const cliquesWhatsapp = eventos.filter(e => e.tipo_evento === 'whatsapp_click').length
  const taxaClique = totalPageViews > 0 ? (cliquesTotais / totalPageViews) * 100 : 0

  const topLinks = agruparPorTitulo(eventos, 'link_rapido_click')
  const topDestaques = agruparPorTitulo(eventos, 'destaque_click')
  const topVideos = agruparPorTitulo(eventos, 'video_click')
  const topCatalogo = agruparPorTitulo(eventos, 'catalogo_click')
  const topWhatsapp = agruparPorTitulo(eventos, 'whatsapp_click')
  const topSocial = agruparPorTitulo(eventos, 'social_click')

  const planoAtual = perfil?.plano_tipo
  const temAlgumDado = eventos.length > 0

  // Exportacao (CSV / XLSX): usa SO os dados que a tela ja carregou (mesmo periodo, mesmo user_id da consulta acima) - nenhuma consulta nova.
  async function exportar(formato: 'csv' | 'xlsx') {
    setMenuExportar(false)
    setErroExportar('')
    setExportando(true)
    try {
      const geradoEm = new Date()
      const inicio = inicioCarregado ? new Date(inicioCarregado) : null
      // O card "Leads capturados" da tela mostra o total historico; na exportacao os leads respeitam o periodo selecionado.
      const leadsPeriodo = inicio ? leads.filter(l => l.created_at && new Date(l.created_at) >= inicio) : leads
      const rk = (tipo: string, permitido: boolean) => ({ permitido, itens: permitido ? agruparPorTitulo(eventos, tipo, Infinity) : [] })
      const dados = {
        periodo,
        periodoLabel: OPCOES_PERIODO.find(o => o.valor === periodo)?.label || periodo,
        inicio,
        geradoEm,
        pubUrl,
        visualizacoes: totalPageViews,
        cliquesTotais,
        cliquesWhatsapp,
        taxaClique,
        leadsPermitido: permiteCatalogoWhatsapp(planoAtual),
        leads: leadsPeriodo,
        leadsTotalHistorico: leads.length,
        rankings: {
          links: rk('link_rapido_click', true),
          social: rk('social_click', true),
          destaques: rk('destaque_click', permiteDestaques(planoAtual)),
          videos: rk('video_click', permiteVideos(planoAtual)),
          catalogo: rk('catalogo_click', obterLimiteCatalogos(planoAtual) > 0),
          whatsapp: rk('whatsapp_click', permiteCatalogoWhatsapp(planoAtual)),
        },
        limiteEventos: LIMITE_EVENTOS_TUDO,
        eventosCarregados: eventos.length,
      }
      const blob = formato === 'csv' ? gerarCsvBlob(dados) : await gerarXlsxBlob(dados)
      baixarArquivo(blob, montarNomeArquivo(periodo, geradoEm, formato))
    } catch (e) {
      console.error('Falha ao exportar o desempenho', e)
      setErroExportar('Não foi possível gerar o arquivo.')
      setTimeout(() => setErroExportar(''), 6000)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .crd{background:radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 55%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
        .desemp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
        .desemp-rankings{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
      ` }} />
      <PainelSidebar nome={perfil?.nome_negocio} tituloMobile="Desempenho" />
      <div className="psb-main">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em' }}>Desempenho</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select value={periodo} onChange={e => setPeriodo(e.target.value as Periodo)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#F8F4F7', cursor: 'pointer' }}>
                {OPCOES_PERIODO.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
              </select>
              <div style={{ position: 'relative' }} onKeyDown={e => { if (e.key === 'Escape') setMenuExportar(false) }}>
                <button type="button" aria-haspopup="menu" aria-expanded={menuExportar} disabled={carregando || exportando} onClick={() => setMenuExportar(v => !v)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, color: '#F8F4F7', cursor: carregando || exportando ? 'default' : 'pointer', opacity: carregando || exportando ? .6 : 1, fontFamily: 'inherit' }}>{exportando ? 'Gerando arquivo...' : 'Exportar ▾'}</button>
                {menuExportar && (
                  <>
                    <div onClick={() => setMenuExportar(false)} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 40 }} />
                    <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41, minWidth: '190px', background: 'rgba(24,16,27,.98)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 10px 30px rgba(0,0,0,.45)' }}>
                      <button type="button" role="menuitem" onClick={() => exportar('csv')} style={{ background: 'transparent', border: 'none', color: '#F8F4F7', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Exportar CSV</button>
                      <button type="button" role="menuitem" onClick={() => exportar('xlsx')} style={{ background: 'transparent', border: 'none', color: '#F8F4F7', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Exportar Excel (.xlsx)</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: erroExportar ? '8px' : '20px' }}>Acompanhe acessos e cliques da sua MiniPage.</p>
          {erroExportar && <p role="alert" style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444', marginBottom: '14px' }}>{erroExportar}</p>}

          {pubUrl && (
            <div className="crd" style={{ padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '12px', color: '#B8AAB8' }}>{pubUrl.replace('https://', '')}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={pubUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Ver MiniPage</a>
                <button onClick={copiarLink} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{copiado ? 'Copiado!' : 'Copiar link'}</button>
                <Link href="/painel/perfil" style={{ background: G, color: '#fff', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Editar MiniPage</Link>
              </div>
            </div>
          )}

          {carregando ? (
            <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando...</p>
          ) : !temAlgumDado ? (
            <div className="crd" style={{ padding: '40px 30px', textAlign: 'center' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Ainda não há dados suficientes</p>
              <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '22px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>Compartilhe sua MiniPage para começar a acompanhar acessos, cliques e interesses dos visitantes.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {pubUrl && <a href={pubUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Ver minha MiniPage</a>}
                <button onClick={copiarLink} style={{ background: G, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{copiado ? 'Copiado!' : 'Copiar link'}</button>
              </div>
            </div>
          ) : (
            <>
              <div className="desemp-cards" style={{ marginBottom: '26px' }}>
                <div className="crd" style={{ padding: '18px' }}>
                  <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Visualizações</p>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7' }}>{totalPageViews}</p>
                </div>
                <div className="crd" style={{ padding: '18px' }}>
                  <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Cliques totais</p>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7' }}>{cliquesTotais}</p>
                </div>
                <div className="crd" style={{ padding: '18px' }}>
                  <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Cliques no WhatsApp</p>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7' }}>{cliquesWhatsapp}</p>
                </div>
                <div className="crd" style={{ padding: '18px' }}>
                  <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Taxa de clique</p>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7' }}>{taxaClique.toFixed(1)}%</p>
                </div>
                {permiteCatalogoWhatsapp(planoAtual) ? (
                  <div className="crd" style={{ padding: '18px' }}>
                    <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Leads capturados</p>
                    <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>{leads.length}</p>
                    <Link href="/painel/desempenho/leads" style={{ display: 'inline-block', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit' }}>Ver lista</Link>
                  </div>
                ) : <CardBloqueado titulo="Leads capturados" />}
              </div>

              <div className="desemp-rankings">
                <RankingCard titulo="Links mais clicados" itens={topLinks} />
                <RankingCard titulo="Redes sociais mais clicadas" itens={topSocial} />

                {permiteDestaques(planoAtual) ? (
                  <RankingCard titulo="Destaques mais clicados" itens={topDestaques} />
                ) : <CardBloqueado titulo="Destaques mais clicados" />}

                {permiteVideos(planoAtual) ? (
                  <RankingCard titulo="Vídeos mais clicados" itens={topVideos} />
                ) : <CardBloqueado titulo="Vídeos mais clicados" />}

                {obterLimiteCatalogos(planoAtual) > 0 ? (
                  <RankingCard titulo="Catálogo mais clicado" itens={topCatalogo} />
                ) : <CardBloqueado titulo="Catálogo mais clicado" />}

                {permiteCatalogoWhatsapp(planoAtual) ? (
                  <RankingCard titulo="Cliques no WhatsApp (detalhado)" itens={topWhatsapp} />
                ) : <CardBloqueado titulo="Cliques no WhatsApp (detalhado)" />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
