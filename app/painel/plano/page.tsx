'use client'
import { useEffect, useState } from 'react'
import { CreditCard, Crown, Wallet, CheckCircle2, MessageCircle, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '../../components/PainelSidebar'
import { normalizarPlano, obterNomePlano, obterPrecoPlano, obterLimiteProfissionais } from '../../lib/planos'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const WPP = '5511941059063'
function formatarPreco(tipo: 'minipage'|'essencial'|'equipe') {
  return `R$ ${obterPrecoPlano(tipo).toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ',')}`
}

const PLANOS = {
  minipage: {
    desc: 'Página profissional com links, vídeos e divulgações — ideal pra quem ainda não precisa de agenda.',
    beneficios: [
      'MiniPage profissional (minipage.pro/seunome)',
      'Foto, banner e descrição',
      'Redes sociais e links rápidos',
      'Cards de destaque',
      'Vídeos em destaque',
      'Espaço para divulgações e publicidades',
      'Botão WhatsApp',
    ],
  },
  essencial: {
    desc: 'Tudo da MiniPage, com agenda online, clientes e financeiro organizados em um só lugar.',
    beneficios: [
      'Tudo do plano MiniPage',
      'Agenda online',
      'Serviços e horários',
      'Cadastro de clientes',
      'Cobranças',
      'Controle financeiro',
      'Relatórios',
      'Até 3 profissionais cadastrados',
    ],
  },
  equipe: {
    desc: 'Plano ideal para salões, studios e clínicas que precisam dividir acessos sem expor o financeiro.',
    beneficios: [
      'Tudo do plano Profissional',
      'Até 15 profissionais cadastrados',
      'Login individual para cada profissional',
      'Cada profissional vê apenas a própria agenda',
      'Área "Meu Desempenho" para profissionais',
      'Administradora com acesso completo',
      'Financeiro, cobranças e relatórios protegidos',
      'Controle de equipe',
    ],
  },
} as const

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

  const planoNormalizado = normalizarPlano(perfil?.plano_tipo)
  const planoAtual = planoNormalizado === 'equipe' ? 'equipe' : planoNormalizado === 'minipage' ? 'minipage' : 'essencial'
  const status = STATUS_LABEL[perfil?.status_acesso] || STATUS_LABEL.ativo
  const limiteAtual = obterLimiteProfissionais(planoAtual)
  const nome = perfil?.nome_negocio || ''

  const linkWppUpgrade = `https://wa.me/${WPP}?text=${encodeURIComponent('Olá! Quero alterar meu plano do ClienteMarcado para o Plano Equipe.')}`
  const linkWppDowngrade = `https://wa.me/${WPP}?text=${encodeURIComponent('Olá! Quero solicitar a mudança do meu plano do ClienteMarcado para o plano MiniPage.')}`
  const linkWppSuporte = `https://wa.me/${WPP}?text=${encodeURIComponent('Olá! Quero alterar meu plano do ClienteMarcado.')}`

  function tentarDowngrade() {
    if (totalProfissionais > 0) {
      setAvisoDowngrade('Para voltar ao plano MiniPage, remova os profissionais cadastrados (o MiniPage não inclui agenda nem equipe).')
      return
    }
    setAvisoDowngrade('')
    window.open(linkWppDowngrade, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .mp-card{background:radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 55%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:20px}
        .mp-card.atual{border-color:rgba(236,72,153,.45);box-shadow:0 0 40px rgba(236,72,153,.10)}
        .mp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
        @media(max-width:860px){.mp-grid{grid-template-columns:1fr}}
      `}} />
      <PainelSidebar nome={nome} tituloMobile="Meu plano" />
      <div className="psb-main">
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 80px' }}>
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
                      {planoAtual === 'equipe' ? <Crown size={22} color="#fff" /> : <CreditCard size={22} color="#fff" />}
                    </div>
                    <div>
                      <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7' }}>{obterNomePlano(planoAtual)}</p>
                      <p style={{ fontSize: '13px', color: '#B8AAB8' }}>{formatarPreco(planoAtual)}/mês</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: status.cor, background: status.bg, border: `1px solid ${status.cor}40`, borderRadius: '999px', padding: '6px 14px' }}>{status.texto}</span>
                </div>

                <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.65, marginBottom: '20px' }}>{PLANOS[planoAtual].desc}</p>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid #2A1A2F' }}>
                  {planoAtual !== 'minipage' && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Profissionais cadastrados</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: totalProfissionais >= limiteAtual ? '#F87171' : '#F8F4F7' }}>{totalProfissionais} de {limiteAtual}</p>
                    </div>
                  )}
                  {perfil?.trial_ends_at && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Teste grátis até</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{formatarData(perfil.trial_ends_at)}</p>
                    </div>
                  )}
                  {perfil?.plano_ativo_ate && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>Próxima cobrança</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{formatarData(perfil.plano_ativo_ate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CARDS COMPARATIVOS */}
              <div className="mp-grid" style={{ marginBottom: '28px' }}>
                {(['minipage', 'essencial', 'equipe'] as const).map(tipo => {
                  const p = PLANOS[tipo]
                  const ehAtual = tipo === planoAtual
                  return (
                    <div key={tipo} className={`mp-card${ehAtual ? ' atual' : ''}`} style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#F8F4F7' }}>{obterNomePlano(tipo)}</p>
                        {ehAtual && <span style={{ fontSize: '11px', fontWeight: 700, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.30)', borderRadius: '999px', padding: '4px 10px' }}>Plano atual</span>}
                      </div>
                      <p style={{ fontSize: '22px', fontWeight: 900, color: '#F8F4F7', marginBottom: '16px' }}>{formatarPreco(tipo)}<span style={{ fontSize: '13px', fontWeight: 500, color: '#B8AAB8' }}>/mês</span></p>
                      <div style={{ marginBottom: '20px', flex: 1 }}>
                        {p.beneficios.map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '9px' }}>
                            <CheckCircle2 size={15} color="#22C55E" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.4 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                      {!ehAtual && tipo === 'equipe' && (
                        <a href={linkWppUpgrade} target="_blank" rel="noopener noreferrer" style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                          Alterar para Plano Equipe
                        </a>
                      )}
                      {!ehAtual && tipo === 'essencial' && (
                        <a href={linkWppSuporte} target="_blank" rel="noopener noreferrer" style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                          Alterar para Profissional
                        </a>
                      )}
                      {!ehAtual && tipo === 'minipage' && (
                        <button type="button" onClick={tentarDowngrade} style={{ width: '100%', background: 'rgba(24,16,27,.92)', color: '#F8F4F7', border: '1px solid rgba(229,72,184,.28)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Solicitar mudança para MiniPage
                        </button>
                      )}
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
                  <a href={linkWppSuporte} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', background: 'rgba(24,16,27,.92)', color: '#F8F4F7', border: '1px solid rgba(245,158,11,.35)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                    <MessageCircle size={15} color="#22C55E" /> Falar com suporte
                  </a>
                </div>
              )}

              {/* INCENTIVO AO UPGRADE (so pra quem esta no essencial) */}
              {planoAtual === 'essencial' && (
                <div className="mp-card" style={{ padding: '26px 24px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Precisa cadastrar mais profissionais?</p>
                  <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.65, marginBottom: '18px' }}>Com o Plano Equipe, você pode cadastrar até 15 profissionais e liberar acesso individual para cada uma, mantendo financeiro, cobranças e relatórios protegidos.</p>
                  <a href={linkWppUpgrade} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px 22px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                    <Wallet size={15} /> Alterar para Plano Equipe
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
