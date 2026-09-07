import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calendar, Link2, Wallet, BarChart3, Users, MessageCircle, CheckCircle,
  Sparkles, ArrowRight, MonitorSmartphone, Music2, PlayCircle,
  Clock, TrendingUp, CreditCard, ClipboardList, X, Check,
} from 'lucide-react'

// Página demonstrativa estática — não usa Supabase, não usa dados reais.
// Isolada de /demo, /[slug], painel e agenda reais.
export const metadata: Metadata = {
  title: 'ClienteMarcado | Conheça o sistema',
  description: 'Veja como o ClienteMarcado une página profissional, agenda online, links personalizados, financeiro e painel de gestão para beleza e estética.',
}

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const WPP_INFO = 'https://wa.me/5511941059063?text=Ol%C3%A1%21%20Quero%20saber%20mais%20sobre%20o%20ClienteMarcado.'
const WPP_CRIAR = 'https://wa.me/5511941059063?text=Ol%C3%A1%21%20Quero%20criar%20minha%20p%C3%A1gina%20profissional%20no%20ClienteMarcado.'

const InstagramIcon = ({ size = 16, color = '#EC4899' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const RECURSOS = [
  { I: MonitorSmartphone, titulo: 'Página profissional', desc: 'Mostre sua marca, seus serviços, cursos, mentorias, produtos e redes sociais em uma página bonita e personalizada.' },
  { I: Calendar, titulo: 'Agenda online', desc: 'Sua cliente escolhe serviço, profissional, data e horário sem baixar aplicativo.' },
  { I: Link2, titulo: 'Links personalizados', desc: 'Organize WhatsApp, Instagram, TikTok, YouTube, cursos, produtos e outros links em um só lugar.' },
  { I: BarChart3, titulo: 'Painel de gestão', desc: 'Acompanhe agenda, clientes, cobranças, financeiro e relatórios em uma área simples e profissional.' },
]

const PARA_QUEM = [
  'Nail designers', 'Lash designers', 'Salões de beleza', 'Clínicas de estética', 'Sobrancelhas',
  'Cabeleireiras', 'Mentoras', 'Professoras de cursos', 'Profissionais que vendem produtos', 'Studios de beleza',
]

const ANTES = ['Link solto na bio', 'Conversas espalhadas', 'Agenda manual', 'Cobranças esquecidas', 'Cliente sem clareza']
const DEPOIS = ['Página profissional', 'Agenda online', 'Links organizados', 'Financeiro no painel', 'Mais confiança para fechar']

const COBRANCAS = [
  { I: MessageCircle, titulo: 'Envio de confirmação', desc: 'Mensagens claras de confirmação do horário marcado.' },
  { I: CreditCard, titulo: 'Cobrança pelo WhatsApp', desc: 'Contato direto e organizado para lembrar pendências.' },
  { I: Wallet, titulo: 'Controle de valores pendentes', desc: 'Veja quem ainda precisa pagar, tudo em um lugar só.' },
  { I: CheckCircle, titulo: 'Status do atendimento', desc: 'Confirmado, pendente ou concluído — sempre visível.' },
]

function SectionTitle({ kicker, titulo, sub }: { kicker?: string; titulo: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 44px' }}>
      {kicker && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(236,72,153,.10)', border: '1px solid rgba(236,72,153,.30)', borderRadius: '999px', padding: '6px 16px', marginBottom: '18px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EC4899' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#EC4899', letterSpacing: '.04em' }}>{kicker}</span>
        </div>
      )}
      <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: sub ? '14px' : 0 }}>{titulo}</h2>
      {sub && <p style={{ fontSize: '16px', color: '#B8AAB8', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  )
}

function BarraFake({ label, pct, valor }: { label: string; pct: number; valor: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D8C7D8', marginBottom: '6px' }}>
        <span>{label}</span><span style={{ fontWeight: 700, color: '#FFFFFF' }}>{valor}</span>
      </div>
      <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '999px', background: G }} />
      </div>
    </div>
  )
}

export default function DemoSistema() {
  return (
    <div style={{ background: '#050007', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', color: '#F8F4F7' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .wrap-ds{max-width:1140px;margin:0 auto;padding:0 20px}
        .btn-p-ds{background:${G};color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:0 26px;height:52px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .18s,box-shadow .18s;box-shadow:0 14px 34px rgba(236,72,153,.28);white-space:nowrap}
        .btn-p-ds:hover{transform:translateY(-2px)}
        .btn-s-ds{background:rgba(24,16,27,.86);color:#F8F4F7;border:1px solid rgba(236,72,153,.35);border-radius:14px;padding:0 26px;height:52px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:border-color .18s,transform .18s;white-space:nowrap}
        .btn-s-ds:hover{border-color:rgba(236,72,153,.6);transform:translateY(-2px)}
        .card-ds{background:rgba(24,16,27,.86);border:1px solid rgba(236,72,153,.22);border-radius:18px;padding:26px 22px;transition:border-color .2s,transform .2s}
        .card-ds:hover{border-color:rgba(236,72,153,.4);transform:translateY(-3px)}
        .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
        .hero-cols{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
        .antes-depois{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .para-quem-grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
        @media(max-width:980px){
          .grid-4{grid-template-columns:repeat(2,1fr)}
          .grid-3{grid-template-columns:1fr}
          .grid-2{grid-template-columns:1fr}
          .hero-cols{grid-template-columns:1fr;gap:36px}
          .antes-depois{grid-template-columns:1fr}
        }
        @media(max-width:640px){
          .grid-4{grid-template-columns:1fr}
          .wrap-ds{padding:0 16px}
          .sec-pad{padding:56px 0!important}
          .btn-row{flex-direction:column!important;align-items:stretch!important}
          .btn-row a{width:100%!important}
        }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="wrap-ds" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>ClienteMarcado</span>
          </div>
          <Link href="/demo" className="btn-s-ds" style={{ height: '40px', padding: '0 18px', fontSize: '13px' }}>← Voltar para demonstração</Link>
        </div>
      </header>

      {/* 1. HERO */}
      <section style={{ padding: '72px 0 80px', background: 'radial-gradient(circle at 15% 10%,rgba(236,72,153,.16),transparent 40%),radial-gradient(circle at 85% 0%,rgba(139,92,246,.16),transparent 42%)' }}>
        <div className="wrap-ds hero-cols">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(236,72,153,.10)', border: '1px solid rgba(236,72,153,.30)', borderRadius: '999px', padding: '6px 16px', marginBottom: '22px' }}>
              <Sparkles size={13} color="#EC4899" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#EC4899', letterSpacing: '.04em' }}>Conheça o sistema</span>
            </div>
            <h1 style={{ fontSize: 'clamp(30px,4.6vw,46px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '20px' }}>
              Conheça o sistema que transforma o link da bio em uma página profissional com agenda e gestão
            </h1>
            <p style={{ fontSize: '17px', color: '#D8C7D8', lineHeight: 1.65, marginBottom: '32px', maxWidth: '520px' }}>
              Com o ClienteMarcado, profissionais da beleza divulgam serviços, cursos, mentorias e redes sociais, recebem agendamentos e acompanham o financeiro em um só painel.
            </p>
            <div className="btn-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/cadastro" className="btn-p-ds">Quero criar minha página <ArrowRight size={16} /></Link>
              <a href={WPP_INFO} target="_blank" rel="noopener noreferrer" className="btn-s-ds">Falar no WhatsApp</a>
            </div>
          </div>

          {/* Mockup celular */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '290px', background: '#0B0610', border: '1px solid rgba(236,72,153,.30)', borderRadius: '30px', padding: '14px', boxShadow: '0 30px 70px rgba(139,92,246,.20), 0 0 40px rgba(236,72,153,.12)' }}>
              <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#120A14' }}>
                <div style={{ position: 'relative', height: '108px', backgroundImage: 'url(/banners/beauty/banner-01.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(5,0,7,0) 50%,rgba(5,0,7,.75) 100%)' }} />
                </div>
                <div style={{ padding: '0 16px 16px', marginTop: '-28px', position: 'relative' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '999px', background: G, border: '3px solid #EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#fff', boxShadow: '0 0 18px rgba(236,72,153,.4)' }}>SB</div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '8px' }}>Studio Bella</p>
                  <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '10px' }}>Nail designer • Mentora</p>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {[{ I: InstagramIcon, c: '#EC4899' }, { I: Music2, c: '#F8F4F7' }, { I: PlayCircle, c: '#FF3B30' }, { I: MessageCircle, c: '#22C55E' }].map((s, i) => (
                      <div key={i} style={{ width: '26px', height: '26px', borderRadius: '999px', background: `${s.c}1F`, border: `1px solid ${s.c}48`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <s.I size={12} color={s.c} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '10px' }}>
                    {['Agendar', 'Cursos', 'Mentoria'].map(t => (
                      <div key={t} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(236,72,153,.22)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>{t}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[{ I: Calendar, t: 'Agendar agora', c: '#EC4899' }, { I: MessageCircle, t: 'WhatsApp', c: '#22C55E' }].map(l => (
                      <div key={l.t} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '10px', padding: '8px 10px' }}>
                        <l.I size={12} color={l.c} />
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff' }}>{l.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. O QUE É */}
      <section className="sec-pad" style={{ padding: '80px 0' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="O que é o ClienteMarcado" titulo="Mais que uma agenda: uma página profissional para o seu negócio" sub="O ClienteMarcado centraliza em um único link tudo que uma profissional da beleza precisa para se apresentar melhor, atender com mais organização e vender com mais confiança." />
          <div className="grid-4">
            {RECURSOS.map(r => (
              <div key={r.titulo} className="card-ds">
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <r.I size={19} color="#EC4899" />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>{r.titulo}</p>
                <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PÁGINA PROFISSIONAL */}
      <section className="sec-pad" style={{ padding: '80px 0', background: 'radial-gradient(circle at 90% 20%,rgba(236,72,153,.08),transparent 40%)' }}>
        <div className="wrap-ds">
          <div className="hero-cols">
            <div>
              <SectionTitle kicker="Página profissional" titulo="Sua marca com uma página própria" />
              <p style={{ fontSize: '15px', color: '#D8C7D8', lineHeight: 1.7, marginBottom: '22px' }}>
                Com a página profissional, sua cliente entende quem você é, o que você oferece e para onde ela deve ir: agendar, chamar no WhatsApp, acessar um curso, ver uma mentoria ou entrar em uma rede social.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Banner personalizado', 'Foto/logo do negócio', 'Destaques com imagem', 'Links rápidos', 'Agenda opcional', 'Visual claro ou escuro'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={16} color="#22C55E" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#F8F4F7' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-ds" style={{ padding: '20px' }}>
              <div style={{ position: 'relative', height: '110px', borderRadius: '14px', overflow: 'hidden', marginBottom: '-26px', backgroundImage: 'url(/banners/beauty/banner-03.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(5,0,7,0) 50%,rgba(5,0,7,.7) 100%)' }} />
              </div>
              <div style={{ position: 'relative', paddingTop: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '999px', background: G, border: '3px solid #EC4899', flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Studio Bella</p>
                      <CheckCircle size={14} color="#EC4899" />
                    </div>
                    <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Nail designer • Mentora • Cursos</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', margin: '16px 0' }}>
                  {['Curso presencial', 'Mentoria VIP'].map(t => (
                    <div key={t} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(236,72,153,.22)', borderRadius: '12px', padding: '14px 12px', height: '58px', display: 'flex', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{t}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[{ I: Calendar, t: 'Agende seu horário' }, { I: InstagramIcon, t: 'Instagram' }].map(l => (
                    <div key={l.t} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '10px', padding: '9px 12px' }}>
                      <l.I size={13} color="#EC4899" />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{l.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AGENDA ONLINE */}
      <section className="sec-pad" style={{ padding: '80px 0' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Agenda online" titulo="Sua cliente agenda sem baixar aplicativo" sub="Ela escolhe o serviço, o profissional, a data e o horário direto pelo link. Você acompanha tudo pelo painel." />
          <div className="hero-cols">
            <div className="card-ds" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
                {['Atendimento', 'Profissional', 'Data e hora', 'Seus dados'].map((et, i) => (
                  <div key={et} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: '4px', borderRadius: '999px', background: i === 0 ? G : 'rgba(255,255,255,.08)', marginBottom: '6px' }} />
                    <p style={{ fontSize: '9px', color: i === 0 ? '#EC4899' : '#B8AAB8', fontWeight: 600 }}>{et}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Escolha o atendimento</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['Alongamento de unha', 'Esmaltação', 'Corte de cabelo'].map(s => (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(236,72,153,.18)', borderRadius: '10px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{s}</span>
                    <ArrowRight size={13} color="#EC4899" />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Horários disponíveis</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {['08:00', '08:30', '09:00', '09:30'].map((h, i) => (
                  <div key={h} style={{ textAlign: 'center', padding: '9px 0', borderRadius: '10px', fontSize: '12px', fontWeight: 700, background: i === 1 ? G : 'rgba(255,255,255,.05)', border: i === 1 ? 'none' : '1px solid rgba(255,255,255,.08)', color: '#fff' }}>{h}</div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['Cliente agenda sozinha', 'Você acompanha tudo no painel', 'Sem baixar aplicativo', 'Ideal para beleza e estética'].map(t => (
                <div key={t} className="card-ds" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px' }}>
                  <CheckCircle size={18} color="#22C55E" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{t}</span>
                </div>
              ))}
              <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.7, marginTop: '4px' }}>
                A agenda online reduz conversas repetitivas, facilita a marcação de horários e deixa o atendimento mais profissional desde o primeiro contato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PAINEL DE GESTÃO */}
      <section className="sec-pad" style={{ padding: '80px 0', background: 'radial-gradient(circle at 10% 30%,rgba(139,92,246,.10),transparent 42%)' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Painel de gestão" titulo="Um painel simples para organizar sua rotina" sub="Veja atendimentos, clientes, serviços, profissionais e atalhos importantes em um só lugar." />
          <div className="grid-4" style={{ marginBottom: '20px' }}>
            {[{ l: 'Atendimentos hoje', v: '6', I: Clock }, { l: 'Próximos agendamentos', v: '14', I: Calendar }, { l: 'Total a receber', v: 'R$ 1.240', I: Wallet }, { l: 'Recebido no mês', v: 'R$ 4.860', I: TrendingUp }].map(k => (
              <div key={k.l} className="card-ds">
                <k.I size={18} color="#EC4899" style={{ marginBottom: '10px' }} />
                <p style={{ fontSize: '11px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>{k.l}</p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{k.v}</p>
              </div>
            ))}
          </div>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
            {[{ l: 'Agenda', I: Calendar }, { l: 'Clientes', I: Users }, { l: 'Serviços', I: ClipboardList }, { l: 'Profissionais', I: Users }, { l: 'Financeiro', I: Wallet }, { l: 'Relatórios', I: BarChart3 }].map(a => (
              <div key={a.l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '16px 8px', textAlign: 'center' }}>
                <a.I size={17} color="#B8AAB8" style={{ marginBottom: '6px' }} />
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#D8C7D8' }}>{a.l}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: '#B8AAB8', textAlign: 'center', maxWidth: '640px', margin: '26px auto 0', lineHeight: 1.7 }}>
            O painel foi pensado para facilitar a rotina de quem atende, vende e precisa se organizar sem perder tempo com planilhas ou mensagens espalhadas.
          </p>
        </div>
      </section>

      {/* 6. FINANCEIRO */}
      <section className="sec-pad" style={{ padding: '80px 0' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Financeiro" titulo="Controle entradas, despesas e resultado do mês" sub="Registre pagamentos, receitas adicionais, cursos, mentorias, produtos e despesas para entender melhor o resultado do seu negócio." />
          <div className="card-ds" style={{ padding: '24px' }}>
            <div className="grid-4" style={{ marginBottom: '20px' }}>
              {[{ l: 'Recebido no mês', v: 'R$ 4.860', c: '#22C55E' }, { l: 'Despesas do mês', v: 'R$ 1.120', c: '#EF4444' }, { l: 'Resultado estimado', v: 'R$ 3.740', c: '#EC4899' }, { l: 'A receber', v: 'R$ 620', c: '#F8F4F7' }].map(k => (
                <div key={k.l}>
                  <p style={{ fontSize: '10px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>{k.l}</p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: k.c }}>{k.v}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {['Resumo', 'Pagamentos', 'Receitas adicionais', 'Despesas'].map((t, i) => (
                <span key={t} style={{ fontSize: '12px', fontWeight: 700, padding: '7px 14px', borderRadius: '10px', background: i === 2 ? G : 'rgba(255,255,255,.05)', color: i === 2 ? '#fff' : '#B8AAB8' }}>{t}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ n: 'Curso presencial', v: 'R$ 900' }, { n: 'Mentoria individual', v: 'R$ 350' }, { n: 'Venda de esmaltes', v: 'R$ 180' }].map(r => (
                <div key={r.n} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '10px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '13px', color: '#fff' }}>{r.n}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#22C55E' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid-4" style={{ marginTop: '20px' }}>
            {['Entradas do mês', 'Despesas', 'Receitas adicionais', 'Valores pendentes'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={15} color="#22C55E" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#D8C7D8' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. COBRANÇAS */}
      <section className="sec-pad" style={{ padding: '80px 0', background: 'radial-gradient(circle at 90% 60%,rgba(236,72,153,.08),transparent 42%)' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Cobranças e confirmações" titulo="Confirmações e cobranças pelo WhatsApp" sub="Envie mensagens de confirmação, acompanhe pendências e organize contatos importantes com mais praticidade." />
          <div className="grid-4">
            {COBRANCAS.map(c => (
              <div key={c.titulo} className="card-ds">
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <c.I size={18} color="#22C55E" />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '5px' }}>{c.titulo}</p>
                <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.55 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. RELATÓRIOS */}
      <section className="sec-pad" style={{ padding: '80px 0' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Relatórios" titulo="Relatórios simples para decidir melhor" sub="Veja o que mais vende, acompanhe atendimentos realizados e entenda melhor o crescimento do seu negócio." />
          <div className="hero-cols">
            <div className="card-ds" style={{ padding: '24px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '16px' }}>Serviços mais realizados</p>
              <BarraFake label="Alongamento em gel" pct={90} valor="38" />
              <BarraFake label="Esmaltação em gel" pct={64} valor="27" />
              <BarraFake label="Manutenção" pct={45} valor="19" />
              <BarraFake label="Spa dos pés" pct={26} valor="11" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="grid-2">
                {[{ l: 'Faturamento do mês', v: 'R$ 4.860' }, { l: 'Atendimentos realizados', v: '96' }].map(k => (
                  <div key={k.l} className="card-ds">
                    <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '4px' }}>{k.l}</p>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{k.v}</p>
                  </div>
                ))}
              </div>
              <div className="card-ds">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '12px' }}>Desempenho por profissional</p>
                {[{ n: 'Ana Souza', v: 42 }, { n: 'Bruna Lima', v: 31 }].map(p => (
                  <div key={p.n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ fontSize: '13px', color: '#fff' }}>{p.n}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#EC4899' }}>{p.v} atend.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PARA QUEM */}
      <section className="sec-pad" style={{ padding: '80px 0', background: 'radial-gradient(circle at 50% 0%,rgba(139,92,246,.10),transparent 45%)' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Para quem é" titulo="Feito para profissionais e negócios da beleza" sub="Se você atende, vende, ensina ou divulga serviços na área da beleza, o ClienteMarcado pode centralizar sua presença profissional em um único link." />
          <div className="para-quem-grid">
            {PARA_QUEM.map(p => (
              <span key={p} style={{ fontSize: '13px', fontWeight: 600, color: '#F8F4F7', background: 'rgba(24,16,27,.86)', border: '1px solid rgba(236,72,153,.25)', borderRadius: '999px', padding: '10px 18px' }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 10. ANTES / DEPOIS */}
      <section className="sec-pad" style={{ padding: '80px 0' }}>
        <div className="wrap-ds">
          <SectionTitle kicker="Por que isso ajuda a vender mais" titulo="Mais profissionalismo antes mesmo da cliente chamar" />
          <div className="antes-depois">
            <div className="card-ds" style={{ borderColor: 'rgba(239,68,68,.3)' }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '16px' }}>Antes</p>
              {ANTES.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0' }}>
                  <X size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#D8C7D8' }}>{t}</span>
                </div>
              ))}
            </div>
            <div className="card-ds" style={{ borderColor: 'rgba(34,197,94,.35)' }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '16px' }}>Depois</p>
              {DEPOIS.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0' }}>
                  <Check size={15} color="#22C55E" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#F8F4F7', fontWeight: 600 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11. CTA FINAL */}
      <section style={{ padding: '80px 0 90px' }}>
        <div className="wrap-ds">
          <div style={{ background: `radial-gradient(circle at top left,rgba(236,72,153,.16),transparent 45%),radial-gradient(circle at bottom right,rgba(139,92,246,.16),transparent 45%),#0B0610`, border: '1.5px solid rgba(236,72,153,.35)', borderRadius: '26px', padding: 'clamp(36px,6vw,64px)', textAlign: 'center', boxShadow: '0 0 60px rgba(236,72,153,.12)' }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '14px' }}>Pronta para ter uma página profissional como essa?</h2>
            <p style={{ fontSize: '15px', color: '#D8C7D8', maxWidth: '520px', margin: '0 auto 30px', lineHeight: 1.65 }}>
              Crie sua conta grátis e comece a organizar sua presença online, sua agenda e a gestão do seu negócio.
            </p>
            <div className="btn-row" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/cadastro" className="btn-p-ds">Criar minha conta grátis <ArrowRight size={16} /></Link>
              <a href={WPP_CRIAR} target="_blank" rel="noopener noreferrer" className="btn-s-ds">Falar no WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '36px 0' }}>
        <div className="wrap-ds" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>ClienteMarcado</p>
            <p style={{ fontSize: '12px', color: '#B8AAB8' }}>Página profissional, agenda online e gestão para beleza e estética.</p>
          </div>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/cadastro" style={{ fontSize: '12px', color: '#D8C7D8', textDecoration: 'none' }}>Criar conta</Link>
            <Link href="/login" style={{ fontSize: '12px', color: '#D8C7D8', textDecoration: 'none' }}>Entrar</Link>
            <a href={WPP_INFO} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#D8C7D8', textDecoration: 'none' }}>WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
