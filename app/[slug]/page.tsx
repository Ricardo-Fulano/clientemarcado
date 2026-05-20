import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, CalendarDays, CheckCircle } from 'lucide-react'

function getSubtitulo(tipo: string) {
  const map: Record<string, string> = {
    'Barbearia': 'Escolha seu corte, barba ou serviço e marque seu horário.',
    'Salão de cabeleireiro': 'Escolha seu serviço de beleza e agende seu atendimento.',
    'Clínica estética': 'Escolha seu procedimento e agende seu atendimento.',
    'Clínica odontológica': 'Escolha o atendimento e marque sua consulta.',
    'Clínica médica': 'Escolha o serviço e agende sua consulta.',
    'Petshop': 'Escolha o serviço do seu pet e agende o atendimento.',
  }
  return map[tipo] || 'Escolha o serviço e agende seu atendimento em segundos.'
}

function getLabelEquipe(tipo: string) {
  return ['Clínica médica', 'Clínica odontológica', 'Clínica estética'].includes(tipo) ? 'Profissionais' : 'Equipe'
}

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: perfil } = await supabase.from('perfis').select('*').eq('slug', slug).single()
  if (!perfil) return notFound()

  const { data: servicos } = await supabase.from('servicos').select('*').eq('user_id', perfil.user_id)
  const { data: profissionais } = await supabase.from('profissionais').select('*').eq('user_id', perfil.user_id)

  const subtitulo = getSubtitulo(perfil.tipo_negocio || '')
  const labelEquipe = getLabelEquipe(perfil.tipo_negocio || '')
  const temBanner = !!perfil.banner_url

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* HERO */}
      <div style={{
        position: 'relative',
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '72px 24px 60px',
        overflow: 'hidden',
        ...(temBanner ? {
          backgroundImage: `linear-gradient(rgba(8,8,10,0.42), rgba(8,8,10,0.68)), url(${perfil.banner_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.22) 0%, transparent 55%), linear-gradient(180deg, #0d0f1a 0%, #08080A 100%)',
        }),
      }}>
        {!temBanner && (
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '350px', background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        )}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', padding: '4px 13px', borderRadius: '999px', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            ✦ Agendamento online
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: '800', letterSpacing: '-0.025em', lineHeight: 1.1, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.4)', margin: 0 }}>
            {perfil.nome_negocio}
          </h1>

          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: '440px', margin: 0 }}>
            {subtitulo}
          </p>

          {perfil.endereco && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.48)', margin: 0 }}>
              📍 {perfil.endereco}
            </p>
          )}

          <Link href={`/${slug}/agendar`} style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: '#fff',
            fontWeight: '700',
            padding: '14px 38px',
            borderRadius: '999px',
            textDecoration: 'none',
            fontSize: '15px',
            boxShadow: '0 10px 28px rgba(59,130,246,0.36), 0 0 0 1px rgba(59,130,246,0.18)',
            marginTop: '4px',
          }}>
            Agendar agora
          </Link>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 24px 56px' }}>

        {/* SERVIÇOS */}
        {servicos && servicos.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Serviços</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: servicos.length === 1 ? 'minmax(auto, 580px)' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '10px',
            }}>
              {servicos.map((s) => (
                <Link key={s.id} href={`/${slug}/agendar`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '15px 18px',
                  textDecoration: 'none',
                  gap: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '15px' }}>
                      🛎️
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{s.nome}</span>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--accent)', whiteSpace: 'nowrap' }}>R$ {s.preco}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* EQUIPE */}
        {profissionais && profissionais.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{labelEquipe}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
              {profissionais.map((p) => (
                <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} style={{ width: '80px', height: '80px', borderRadius: '999px', objectFit: 'cover', border: '2px solid var(--accent-border)', boxShadow: '0 4px 16px rgba(59,130,246,0.18)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--accent-soft), rgba(59,130,246,0.04))', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'var(--accent)', flexShrink: 0 }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{p.nome}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profissional</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BENEFÍCIOS */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Por que agendar aqui?</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {[
              { icon: <Zap size={16} color="#3B82F6" />, titulo: 'Agendamento rápido', desc: 'Reserve seu horário em menos de 1 minuto, sem ligação.' },
              { icon: <CalendarDays size={16} color="#3B82F6" />, titulo: 'Escolha seu horário', desc: 'Veja disponibilidade e escolha o melhor horário.' },
              { icon: <CheckCircle size={16} color="#3B82F6" />, titulo: 'Atendimento organizado', desc: 'Confirmação garantida. Sem surpresas, sem filas.' },
            ].map((b) => (
              <div key={b.titulo} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3B82F6, transparent)' }} />
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  {b.icon}
                </div>
                <p style={{ fontWeight: '600', fontSize: '13px', marginBottom: '3px', color: 'var(--text-primary)' }}>{b.titulo}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(18,18,22,0.98) 100%)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '40px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }} />
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '280px', height: '160px', background: 'radial-gradient(circle, rgba(59,130,246,0.09), transparent 70%)', pointerEvents: 'none' }} />
          <p style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.01em' }}>Pronto para agendar?</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '22px', maxWidth: '340px', margin: '0 auto 22px', lineHeight: 1.6 }}>
            Escolha o serviço, profissional e horário em poucos segundos.
          </p>
          <Link href={`/${slug}/agendar`} style={{ display: 'inline-block', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff', fontWeight: '700', padding: '14px 38px', borderRadius: '999px', textDecoration: 'none', fontSize: '15px', boxShadow: '0 10px 28px rgba(59,130,246,0.32)' }}>
            Agendar agora
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Agendamento via <span style={{ color: 'var(--text-secondary)' }}>ClienteMarcado</span>
        </p>
      </div>
    </main>
  )
}