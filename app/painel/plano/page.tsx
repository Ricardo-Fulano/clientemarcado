'use client'
import { useEffect, useState } from 'react'
import { CreditCard, Crown, Store, Sparkles, CheckCircle2, MessageCircle, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '../../components/PainelSidebar'
import {
  normalizarPlano, obterNomePlano, obterPrecoPlano, obterLimiteProfissionais,
  obterLimiteCatalogos, ehPlanoFree, type PlanoTipo,
} from '../../lib/planos'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const WPP = '5511941059063'

// Ordem comercial dos 5 planos (do mais simples ao mais completo) - usada pra decidir se um
// botao mostra "Fazer upgrade" ou "Alterar plano" (downgrade), comparando posicoes nessa lista.
const ORDEM_PLANOS: PlanoTipo[] = ['free', 'minipage', 'loja', 'essencial', 'equipe']
function indexPlano(tipo: PlanoTipo) { return ORDEM_PLANOS.indexOf(tipo) }

function formatarPreco(tipo: PlanoTipo) {
  const preco = obterPrecoPlano(tipo)
  if (preco === 0) return 'R$ 0'
  return `R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ',')}`
}

const PLANOS: Record<PlanoTipo, { desc: string; beneficios: string[]; icone: any }> = {
  free: {
    desc: 'Ideal para começar sua página profissional com links básicos.',
    icone: Sparkles,
    beneficios: [
      'Link minipage.pro/seunome',
      'Foto de perfil, bio e redes sociais',
      'Até 5 links rápidos',
      'Modelos de cor básicos (1 a 6)',
      'Ideal para começar grátis',
    ],
  },
  minipage: {
    desc: 'Página profissional com links, destaques, vídeos e catálogo básico.',
    icone: CreditCard,
    beneficios: [
      'Tudo do plano Free',
      'Links rápidos ilimitados',
      'Destaques da página',
      'Vídeos em destaque',
      'Agenda/Eventos da página',
      '1 catálogo',
      'Todos os modelos de cor',
    ],
  },
  loja: {
    desc: 'Ideal para divulgar produtos, achadinhos, músicas, cursos e links de venda.',
    icone: Store,
    beneficios: [
      'Tudo do plano MiniPage',
      'Catálogos ilimitados',
      'WhatsApp no catálogo (com mensagem automática)',
      'Ideal para produtos, achadinhos, músicas e cursos',
    ],
  },
  essencial: {
    desc: 'MiniPage completa com agenda, clientes, cobranças, financeiro e gestão.',
    icone: CheckCircle2,
    beneficios: [
      'Tudo do plano Loja',
      'Agenda de atendimento',
      'Serviços e horários',
      'Cadastro de clientes',
      'Orçamentos e cobranças',
      'Controle financeiro',
      'Relatórios',
      'Até 3 profissionais cadastrados',
    ],
  },
  equipe: {
    desc: 'Gestão completa com equipe e acessos individuais.',
    icone: Crown,
    beneficios: [
      'Tudo do plano Pro',
      'Até 15 profissionais cadastrados',
      'Login individual para cada profissional',
      'Cada profissional vê apenas a própria agenda',
      'Área "Meu Desempenho" para profissionais',
      'Financeiro, cobranças e relatórios protegidos',
      'Controle de equipe',
    ],
  },
}

const STATUS_LABEL: Record<string, { texto: string; cor: string; bg: string }> = {
  ativo: { texto: 'Ativo', cor: '#22C55E', bg: 'rgba(34,197,94,.12)' },
  trial: { texto: 'Período de teste', cor: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  em_atraso: { texto: 'Em atraso', cor: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  bloqueado: { texto: 'Bloqueado', cor: '#EF4444', bg: 'rgba(239,68,68,.12)' },
  cancelado: { texto: 'Cancelado', cor: '#EF4444', bg: 'rgba(239,68,68,.12)' },
}

function formatarData(iso?: string | null) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '' }
}

function linkWpp(mensagem: string) {
  return `https://wa.me/${WPP}?text=${encodeURIComponent(mensagem)}`
}

export default function MeuPlano() {
  const [carregando, setCarregando] = useState(true)
  const [perfil, setPerfil] = useState<any>(null)
  const [totalProfissionais, setTotalProfissionais] = useState(0)
  const [avisoDowngrade, setAvisoDowngrade] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
      setPerfil(p)
      if (p?.id) {
        const { data: profs } = await supabase.from('profissionais').select('id').eq('perfil_id', p.id)
        setTotalProfissionais(profs?.length || 0)
      }
      setCarregando(false)
    }
    carregar()
  }, [])

  const planoAtual = normalizarPlano(perfil?.plano_tipo)
  const status = STATUS_LABEL[perfil?.status_acesso] || STATUS_LABEL.ativo
  const limiteProfissionaisAtual = obterLimiteProfissionais(planoAtual)
  const limiteCatalogosAtual = obterLimiteCatalogos(planoAtual)
  const nome = perfil?.nome_negocio || ''
  const IconeAtual = PLANOS[planoAtual].icone

  function botaoParaPlano(tipoAlvo: PlanoTipo) {
    if (tipoAlvo === planoAtual) return null // "Plano atual" ja mostrado como selo, sem botao

    // Free nunca tem cobranca nem fluxo de autoatendimento pra downgrade - so orienta a falar
    // com o suporte, como pedido.
    if (tipoAlvo === 'free') {
      return (
        <a href={linkWpp('Olá! Quero saber mais sobre voltar para o plano Free.')} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', background: 'rgba(24,16,27,.92)', color: '#B8AAB8', border: '1px solid #2A1A2F', borderRadius: '12px', padding: '12px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          Para mudar para o Free, fale com o suporte
        </a>
      )
    }

    const ehUpgrade = indexPlano(tipoAlvo) > indexPlano(planoAtual)
    const nomeAlvo = obterNomePlano(tipoAlvo)

    // Loja: plano novo, fluxo de cobranca automatica ainda nao confirmado como pronto -
    // mantem WhatsApp por enquanto, com o texto exato pedido.
    if (tipoAlvo === 'loja') {
      return (
        <a href={linkWpp('Olá! Quero alterar meu plano para MiniPage Loja.')} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          Quero o MiniPage Loja
        </a>
      )
    }

    // Downgrade pra MiniPage: mesma checagem de profissionais cadastrados que ja existia -
    // MiniPage nao tem agenda nem equipe, entao precisa remover profissionais antes.
    if (!ehUpgrade && tipoAlvo === 'minipage') {
      return (
        <button type="button" onClick={() => {
          if (totalProfissionais > 0) {
            setAvisoDowngrade('Para voltar ao plano MiniPage, remova os profissionais cadastrados (o MiniPage não inclui agenda nem equipe).')
            return
          }
          setAvisoDowngrade('')
          window.open(linkWpp('Olá! Quero solicitar a mudança do meu plano do ClienteMarcado para o plano MiniPage.'), '_blank', 'noopener,noreferrer')
        }} style={{ width: '100%', background: 'rgba(24,16,27,.92)', color: '#F8F4F7', border: '1px solid rgba(229,72,184,.28)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Alterar para MiniPage
        </button>
      )
    }

    const mensagem = ehUpgrade
      ? `Olá! Quero fazer upgrade do meu plano do ClienteMarcado para o Plano ${nomeAlvo}.`
      : `Olá! Quero alterar meu plano do ClienteMarcado para o Plano ${nomeAlvo}.`

    return (
      <a href={linkWpp(mensagem)} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', textAlign: 'center', background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
        {ehUpgrade ? `Fazer upgrade para ${nomeAlvo}` : `Alterar para ${nomeAlvo}`}
      </a>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .mp-card{background:radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 55%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:20px}
        .mp-card.atual{border-color:rgba(236,72,153,.45);box-shadow:0 0 40px rgba(236,72,153,.10)}
        .mp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
        @media(max-width:860px){.mp-grid{grid-template-columns:1fr}}
      `}} />
      <PainelSidebar nome={nome} tituloMobile="Meu plano" />
      <div className="psb-main">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '4px' }}>Meu plano</p>
          <p style={{ fontSize: '14px', color: '#B8AAB8', marginBottom: '28px' }}>Veja seu plano atual, benefícios disponíveis e opções para alterar sua assinatura.</p>

          {carregando ? (
            <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando...</p>
          ) : (
            <>
              {/* CARD PRINCIPAL - PLANO ATUAL */}
              <div className="mp-card" style={{ padding: '28px 26px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconeAtual size={22} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '2px' }}>Plano atual</p>
                      <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7' }}>{obterNomePlano(planoAtual)}</p>
                      <p style={{ fontSize: '13px', color: '#B8AAB8' }}>{formatarPreco(planoAtual)}{!ehPlanoFree(planoAtual) && '/mês'}</p>
                    </div>
                  </div>
                  {!ehPlanoFree(planoAtual) && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: status.cor, background: status.bg, border: `1px solid ${status.cor}40`, borderRadius: '999px', padding: '6px 14px' }}>{status.texto}</span>
                  )}
                </div>

                <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.65, marginBottom: '20px' }}>{PLANOS[planoAtual].desc}</p>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid #2A1A2F' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Catálogos</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{limiteCatalogosAtual === Infinity ? 'Ilimitado' : limiteCatalogosAtual}</p>
                  </div>
                  {limiteProfissionaisAtual > 0 && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Profissionais cadastrados</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: totalProfissionais >= limiteProfissionaisAtual ? '#F87171' : '#F8F4F7' }}>{totalProfissionais} de {limiteProfissionaisAtual}</p>
                    </div>
                  )}
                  {perfil?.trial_ends_at && !ehPlanoFree(planoAtual) && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Teste grátis até</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{formatarData(perfil.trial_ends_at)}</p>
                    </div>
                  )}
                  {perfil?.plano_ativo_ate && !ehPlanoFree(planoAtual) && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Próxima cobrança</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{formatarData(perfil.plano_ativo_ate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LISTA COMPACTA DOS OUTROS PLANOS */}
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '14px' }}>Todos os planos</p>
              <div className="mp-grid" style={{ marginBottom: '28px' }}>
                {ORDEM_PLANOS.map(tipo => {
                  const p = PLANOS[tipo]
                  const Icone = p.icone
                  const ehAtual = tipo === planoAtual
                  return (
                    <div key={tipo} className={`mp-card${ehAtual ? ' atual' : ''}`} style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Icone size={16} color="#B8AAB8" />
                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#F8F4F7', flex: 1 }}>{obterNomePlano(tipo)}</p>
                      </div>
                      {ehAtual && <span style={{ fontSize: '11px', fontWeight: 700, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.30)', borderRadius: '999px', padding: '4px 10px', alignSelf: 'flex-start', marginBottom: '10px' }}>Plano atual</span>}
                      <p style={{ fontSize: '20px', fontWeight: 900, color: '#F8F4F7', marginBottom: '4px' }}>{formatarPreco(tipo)}{!ehPlanoFree(tipo) && <span style={{ fontSize: '12px', fontWeight: 500, color: '#B8AAB8' }}>/mês</span>}</p>
                      <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '14px' }}>{p.desc}</p>
                      <div style={{ marginBottom: '18px', flex: 1 }}>
                        {p.beneficios.map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '7px' }}>
                            <CheckCircle2 size={13} color="#22C55E" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.4 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                      {ehAtual ? (
                        <div style={{ textAlign: 'center', background: 'rgba(24,16,27,.7)', color: '#6B5F6B', border: '1px solid #2A1A2F', borderRadius: '12px', padding: '12px', fontSize: '12px', fontWeight: 700 }}>Plano atual</div>
                      ) : botaoParaPlano(tipo)}
                    </div>
                  )
                })}
              </div>

              {avisoDowngrade && (
                <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.28)', borderRadius: '14px', padding: '18px 20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Users size={17} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '13px', color: '#F8F4F7', lineHeight: 1.55 }}>{avisoDowngrade}</p>
                  </div>
                  <a href={linkWpp('Olá! Quero alterar meu plano do ClienteMarcado.')} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', background: 'rgba(24,16,27,.92)', color: '#F8F4F7', border: '1px solid rgba(245,158,11,.35)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                    <MessageCircle size={15} color="#22C55E" /> Falar com suporte
                  </a>
                </div>
              )}

              {ehPlanoFree(planoAtual) && (
                <div className="mp-card" style={{ padding: '26px 24px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Pronto para ir além do básico?</p>
                  <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.65, marginBottom: '18px' }}>Com o Plano MiniPage, você libera links ilimitados, destaques, vídeos, agenda/eventos e catálogo.</p>
                  <a href={linkWpp('Olá! Quero fazer upgrade do meu plano do ClienteMarcado para o Plano MiniPage.')} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px 22px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                    <Sparkles size={15} /> Fazer upgrade para MiniPage
                  </a>
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#B8AAB8', marginTop: '24px', lineHeight: 1.6 }}>Alterações de plano são feitas pelo suporte até a automação de cobrança estar disponível.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
