'use client'
import Link from 'next/link'
import { nomeDoProvedor } from '../lib/integracoes/catalogo'
import type { DadosVendas } from '../lib/integracoes/carregarVendas'
import { cliquesVsVendas, formatarMoeda, moedasDoRanking, rankingPorReceita, resumirVendas, type EventoClique, type LinhaRanking } from '../lib/integracoes/resumo'
import { nVendas, texto, tipoDeItemRotulo } from '../lib/integracoes/textosVendas'

// Secao "Vendas externas" do Desempenho. So APRESENTA: os dados chegam ja lidos pela pagina (mesmo periodo do seletor da pagina, leitura com RLS).
// Fala em "plataforma", "vendas externas" e "conversoes": o nome de um provedor so aparece dentro dos rankings por plataforma (vem do catalogo).
const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const ROTULO = { fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: '6px' }
const MUDO = { fontSize: '12px', color: '#B8AAB8', lineHeight: 1.6 }

export interface PropsVendasExternas {
  permitido: boolean; carregando: boolean; erro: boolean; aoTentarDeNovo: () => void; periodoLabel: string
  dados: DadosVendas | null; eventos: EventoClique[]; limiteEventos: number
}

export function rotuloDoItem(l: LinhaRanking): string {
  if (l.kind === 'sem_atribuicao') return texto('sem_atribuicao')
  if (l.removido) return texto('item_removido')
  return l.titulo ?? texto('item_sem_titulo')
}
const pct = (n: number) => `${n.toFixed(1).replace('.', ',')}%`
const botaoLink = { display: 'inline-block', background: G, color: '#fff', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' } as const

function Linhas({ itens }: { itens: { rotulo: string; extra?: string; valor: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {itens.map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', color: '#F8F4F7' }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.rotulo}{it.extra ? <span style={{ color: '#B8AAB8', fontSize: '11px' }}> · {it.extra}</span> : null}</span>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{it.valor}</span>
        </div>
      ))}
    </div>
  )
}
function Cartao({ titulo, children, ranking }: { titulo: string; children: React.ReactNode; ranking?: string }) {
  return (
    <div className="crd" style={{ padding: '18px' }} data-ranking={ranking}>
      <p style={{ ...ROTULO, marginBottom: '12px' }}>{titulo}</p>
      {children}
    </div>
  )
}

export default function DesempenhoVendasExternas({ permitido, carregando, erro, aoTentarDeNovo, periodoLabel, dados, eventos, limiteEventos }: PropsVendasExternas) {
  const cabecalho = (
    <>
      <h2 id="vendas-externas-titulo" style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '4px' }}>{texto('titulo')}</h2>
      <p style={{ ...MUDO, marginBottom: '16px' }}>{texto('subtitulo')} <span data-periodo>{texto('periodo', { periodo: periodoLabel })}</span></p>
    </>
  )
  const envolver = (conteudo: React.ReactNode) => <section aria-labelledby="vendas-externas-titulo" data-secao="vendas-externas" style={{ marginTop: '34px' }}>{cabecalho}{conteudo}</section>

  if (!permitido) return envolver(
    <div className="crd" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }} data-estado="bloqueado">
      <p style={MUDO}>{texto('bloqueado')}</p>
      <Link href="/painel/plano" style={{ fontSize: '12px', fontWeight: 700, color: '#EC4899', textDecoration: 'none' }}>{texto('ver_planos')}</Link>
    </div>)
  if (carregando) return envolver(<p style={MUDO} data-estado="carregando">{texto('carregando')}</p>)
  if (erro || !dados) return envolver(
    <div className="crd" role="alert" style={{ padding: '18px' }} data-estado="erro">
      <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '10px' }}>{texto('erro')}</p>
      <button type="button" onClick={aoTentarDeNovo} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{texto('tentar_de_novo')}</button>
    </div>)

  const { linhas, conexoes, titulos, testes, truncado } = dados
  const nota = (
    <>
      {testes > 0 && <p style={{ ...MUDO, marginTop: '12px' }} data-nota="testes">{texto(testes === 1 ? 'evento_teste_singular' : 'evento_teste_plural', { n: testes })}</p>}
      {truncado && <p style={{ ...MUDO, marginTop: '8px' }} data-nota="truncado">{texto('nota_truncado', { limite: linhas.length })}</p>}
    </>
  )

  if (linhas.length === 0 && conexoes.total === 0 && testes === 0) return envolver(
    <div className="crd" style={{ padding: '26px 22px', textAlign: 'center' }} data-estado="sem-conexao">
      <p style={{ fontSize: '15px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{texto('sem_conexao_titulo')}</p>
      <p style={{ ...MUDO, maxWidth: '440px', margin: '0 auto 16px' }}>{texto('sem_conexao_texto')}</p>
      <Link href="/painel/vendas-externas" style={botaoLink}>{texto('sem_conexao_cta')}</Link>
    </div>)

  if (linhas.length === 0) return envolver(
    <div className="crd" style={{ padding: '22px' }} data-estado="sem-vendas">
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '6px' }}>{texto('sem_vendas')}</p>
      {conexoes.total > 0 && conexoes.teste === conexoes.total && <p style={{ ...MUDO, marginBottom: '10px' }} data-nota="so-teste">{texto('so_teste')}</p>}
      <Link href="/painel/vendas-externas" style={{ fontSize: '12px', fontWeight: 700, color: '#EC4899', textDecoration: 'none' }}>{texto('gerenciar_cta')}</Link>
      {nota}
    </div>)

  const resumo = resumirVendas(linhas, titulos)
  const pagas = resumo.moedas.reduce((s, m) => s + m.pagas, 0)
  const reemb = resumo.moedas.reduce((s, m) => s + m.reembolsos.qtd, 0)
  const cbs = resumo.moedas.reduce((s, m) => s + m.chargebacks.qtd, 0)
  const porMoeda = (f: (m: (typeof resumo.moedas)[number]) => bigint) => resumo.moedas.map((m) => ({ rotulo: m.currency, valor: formatarMoeda(f(m), m.currency) }))
  const top = (l: LinhaRanking[]) => l.slice(0, 5)
  const itensPorVendas = (l: LinhaRanking[]) => top(l).map((r) => ({ rotulo: r.kind === 'provedor' ? nomeDoProvedor(r.provider ?? r.chave) : rotuloDoItem(r), extra: r.kind === 'item' && r.itemType ? tipoDeItemRotulo(r.itemType) : undefined, valor: nVendas(r.vendas) }))
  const blocoReceita = (l: LinhaRanking[], rotulo: (r: LinhaRanking) => string) => {
    const moedas = moedasDoRanking(l)
    return moedas.map((c) => (
      <div key={c} data-moeda={c} style={{ marginBottom: moedas.length > 1 ? '14px' : 0 }}>
        {moedas.length > 1 && <p style={{ ...ROTULO, marginBottom: '6px' }}>{c}</p>}
        <Linhas itens={rankingPorReceita(l, c).map((x) => ({ rotulo: rotulo(x.linha), extra: x.linha.kind === 'item' && x.linha.itemType ? tipoDeItemRotulo(x.linha.itemType) : undefined, valor: formatarMoeda(x.brutaMinor, c) }))} />
      </div>
    ))
  }
  const cv = cliquesVsVendas(linhas, eventos, { eventosTruncados: eventos.length >= limiteEventos }, titulos)
  const cvComparaveis = cv.filter((c) => c.motivo === null && c.taxa !== null)
  const grade = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: '14px' } as const)

  return envolver(
    <div data-estado="completo">
      <div style={{ ...grade(210), marginBottom: '16px' }}>
        <div className="crd" style={{ padding: '18px' }} data-metrica="vendas">
          <p style={ROTULO}>{texto('metrica_vendas')}</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{resumo.totalVendas}</p>
          <p style={MUDO}>{texto('detalhe_vendas', { pagas, reembolsadas: reemb, chargebacks: cbs })}</p>
        </div>
        <div className="crd" style={{ padding: '18px' }} data-metrica="receita">
          <p style={ROTULO}>{texto('metrica_receita')}</p>
          {resumo.moedas.map((m) => (
            <div key={m.currency} data-moeda={m.currency} style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7' }}>{m.currency}: {formatarMoeda(m.brutaMinor, m.currency)}</p>
              <p style={MUDO}>{texto('metrica_liquida', { valor: formatarMoeda(m.liquidaMinor, m.currency) })}</p>
            </div>
          ))}
        </div>
        <div className="crd" style={{ padding: '18px' }} data-metrica="reembolsos">
          <p style={ROTULO}>{texto('metrica_reembolsos')}</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{reemb}</p>
          {reemb > 0 && <Linhas itens={resumo.moedas.filter((m) => m.reembolsos.qtd > 0).map((m) => ({ rotulo: m.currency, valor: formatarMoeda(m.reembolsos.valorMinor, m.currency) }))} />}
        </div>
        <div className="crd" style={{ padding: '18px' }} data-metrica="chargebacks">
          <p style={ROTULO}>{texto('metrica_chargebacks')}</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>{cbs}</p>
          {cbs > 0 && <Linhas itens={resumo.moedas.filter((m) => m.chargebacks.qtd > 0).map((m) => ({ rotulo: m.currency, valor: formatarMoeda(m.chargebacks.valorMinor, m.currency) }))} />}
        </div>
      </div>

      <div style={grade(260)}>
        <Cartao titulo={texto('rank_vendas_item')} ranking="vendas-item"><Linhas itens={itensPorVendas(resumo.porItem)} /></Cartao>
        <Cartao titulo={texto('rank_receita_item')} ranking="receita-item">{blocoReceita(resumo.porItem, rotuloDoItem)}</Cartao>
        <Cartao titulo={texto('rank_vendas_plataforma')} ranking="vendas-plataforma"><Linhas itens={itensPorVendas(resumo.porProvedor)} /></Cartao>
        <Cartao titulo={texto('rank_receita_plataforma')} ranking="receita-plataforma">{blocoReceita(resumo.porProvedor, (r) => nomeDoProvedor(r.provider ?? r.chave))}</Cartao>
      </div>

      <div className="crd" style={{ padding: '18px', marginTop: '14px' }} data-bloco="cliques-vendas">
        <p style={{ ...ROTULO, marginBottom: '8px' }}>{texto('cliques_vendas_titulo')}</p>
        <p style={{ ...MUDO, marginBottom: '10px' }} data-origem-minipage>{texto('origem_minipage', { n: resumo.viaMinipage, total: resumo.totalVendas })}</p>
        {cv.length > 0 && <>
          <Linhas itens={cv.map((c) => ({
            rotulo: c.removido ? texto('item_removido') : c.titulo ?? texto('item_sem_titulo'), extra: tipoDeItemRotulo(c.itemType),
            valor: c.motivo === null && c.taxa !== null ? texto('cliques_vendas_linha', { cliques: c.cliques ?? 0, vendas: c.vendas, taxa: pct(c.taxa) }) : nVendas(c.vendas),
          }))} />
          {cvComparaveis.length === 0 && <p style={{ ...MUDO, marginTop: '10px' }} data-nota="cliques-sem-dados">{texto('cliques_vendas_sem_dados')}</p>}
          <p style={{ ...MUDO, marginTop: '10px', fontSize: '11px' }}>{texto('cliques_vendas_ajuda')}</p>
        </>}
      </div>
      {nota}
      <div style={{ marginTop: '14px' }}><Link href="/painel/vendas-externas" style={{ fontSize: '12px', fontWeight: 700, color: '#EC4899', textDecoration: 'none' }}>{texto('gerenciar_cta')}</Link></div>
    </div>
  )
}
