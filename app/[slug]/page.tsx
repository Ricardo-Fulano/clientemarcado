import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, CalendarDays, CheckCircle } from 'lucide-react'

type Tema = {
  accent: string
  accentSoft: string
  accentBorder: string
  cardBg: string
  cardBorder: string
  cardBorderHover: string
  heroGradient: string
  pillBg: string
  pillBorder: string
  pillText: string
  iconBg: string
  iconBorder: string
}

function getTema(tipo: string): Tema {
  if (['Clínica médica', 'Clínica odontológica'].includes(tipo)) {
    return {
      accent: '#38BDF8',
      accentSoft: 'rgba(56,189,248,0.08)',
      accentBorder: 'rgba(56,189,248,0.2)',
      cardBg: 'linear-gradient(145deg, #0D1117 0%, #0A0E14 100%)',
      cardBorder: '#1E2D3D',
      cardBorderHover: '#38BDF8',
      heroGradient: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.14) 0%, transparent 60%), #08080A',
      pillBg: 'rgba(56,189,248,0.07)',
      pillBorder: 'rgba(56,189,248,0.15)',
      pillText: '#38BDF8',
      iconBg: 'rgba(56,189,248,0.08)',
      iconBorder: 'rgba(56,189,248,0.15)',
    }
  }
  if (['Clínica estética', 'Salão de cabeleireiro'].includes(tipo)) {
    return {
      accent: '#A78BFA',
      accentSoft: 'rgba(167,139,250,0.08)',
      accentBorder: 'rgba(167,139,250,0.2)',
      cardBg: 'linear-gradient(145deg, #0E0D12 0%, #0A0910 100%)',
      cardBorder: '#221E2E',
      cardBorderHover: '#A78BFA',
      heroGradient: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.12) 0%, transparent 60%), #08080A',
      pillBg: 'rgba(167,139,250,0.07)',
      pillBorder: 'rgba(167,139,250,0.15)',
      pillText: '#A78BFA',
      iconBg: 'rgba(167,139,250,0.08)',
      iconBorder: 'rgba(167,139,250,0.15)',
    }
  }
  if (tipo === 'Petshop') {
    return {
      accent: '#34D399',
      accentSoft: 'rgba(52,211,153,0.08)',
      accentBorder: 'rgba(52,211,153,0.2)',
      cardBg: 'linear-gradient(145deg, #0A0F0D 0%, #080C0A 100%)',
      cardBorder: '#1A2B22',
      cardBorderHover: '#34D399',
      heroGradient: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%), #08080A',
      pillBg: 'rgba(52,211,153,0.07)',
      pillBorder: 'rgba(52,211,153,0.15)',
      pillText: '#34D399',
      iconBg: 'rgba(52,211,153,0.08)',
      iconBorder: 'rgba(52,211,153,0.15)',
    }
  }
  // Barbearia + padrão
  return {
    accent: '#3B82F6',
    accentSoft: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.2)',
    cardBg: 'linear-gradient(145deg, #0F1014 0%, #0C0D10 100%)',
    cardBorder: '#1F1F23',
    cardBorderHover: '#3B82F6',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.16) 0%, transparent 60%), #08080A',
    pillBg: 'rgba(59,130,246,0.07)',
    pillBorder: 'rgba(59,130,246,0.15)',
    pillText: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.08)',
    iconBorder: 'rgba(59,130,246,0.15)',
  }
}

function getSubtitulo(tipo: string) {
  const map: Record<string, string> = {
    'Barbearia': 'Agende seu corte, barba ou serviço online.',
    'Salão de cabeleireiro': 'Agende seu serviço de beleza online.',
    'Clínica estética': 'Agende seu procedimento online.',
    'Clínica odontológica': 'Agende sua consulta online.',
    'Clínica médica': 'Agende sua consulta online.',
    'Petshop': 'Agende o atendimento do seu pet online.',
  }
  return map[tipo] || 'Agende seu atendimento em segundos.'
}

function getLabelServico(tipo: string) {
  if (['Clínica médica', 'Clínica odontológica'].includes(tipo)) return 'Agendar consulta'
  if (tipo === 'Petshop') return 'Agendar atendimento'
  if (tipo === 'Clínica estética') return 'Agendar procedimento'
  return 'Agendar serviço'
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

  const tipo = perfil.tipo_negocio || ''
  const tema = getTema(tipo)
  const subtitulo = getSubtitulo(tipo)
  const labelServico = getLabelServico(tipo)
  const labelEquipe = getLabelEquipe(tipo)
  const temBanner = !!perfil.banner_url
  const linkWpp = perfil.whatsapp
    ? 'https://wa.me/55' + perfil.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Olá! Vim pela página e gostaria de falar com vocês.')
    : null

  return (
    <main style={{ minHeight: '100vh', background: '#08080A', color: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* HERO */}
      <div style={{
        position: 'relative',
        minHeight: '560px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 72px',
        overflow: 'hidden',
        ...(temBanner ? {
          backgroundImage: 'linear-gradient(rgba(8,8,10,0.4), rgba(8,8,10,0.78)), url(' + perfil.banner_url + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          background: tema.heroGradient,
        }),
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '700', padding: '5px 14px', borderRadius: '999px', background: tema.accentSoft, color: tema.accent, border: '1px solid ' + tema.accentBorder, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ✦ Agendamento online
          </div>

          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.05, color: '#fff', margin: 0 }}>
            {perfil.nome_negocio}
          </h1>

          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.6, maxWidth: '380px', margin: 0 }}>
            {subtitulo}
          </p>

          {perfil.endereco && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', margin: 0 }}>📍 {perfil.endereco}</p>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
            <Link href={'/' + slug + '/agendar'} style={{
              display: 'inline-block',
              background: tema.accent,
              color: '#fff',
              fontWeight: '700',
              padding: '14px 36px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '15px',
              boxShadow: '0 0 0 1px ' + tema.accentBorder + ', 0 8px 24px ' + tema.accentSoft.replace('0.08', '0.35'),
              letterSpacing: '0.01em',
            }}>
              Agendar agora
            </Link>

            {linkWpp && (
              <a href={linkWpp} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)',
                fontWeight: '600', padding: '14px 24px', borderRadius: '12px',
                textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* INFO PILLS */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '60px' }}>
          {[
            { icon: '📅', texto: 'Horário marcado' },
            { icon: '🕐', texto: 'Agendamento online' },
            ...(perfil.endereco ? [{ icon: '📍', texto: perfil.endereco }] : []),
          ].map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: tema.pillBg, border: '1px solid ' + tema.pillBorder, borderRadius: '999px', padding: '7px 14px' }}>
              <span style={{ fontSize: '12px' }}>{item.icon}</span>
              <span style={{ fontSize: '12px', color: '#71717A', fontWeight: '500' }}>{item.texto}</span>
            </div>
          ))}
        </div>

        {/* SERVIÇOS */}
        {servicos && servicos.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525B', marginBottom: '16px' }}>Serviços</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: servicos.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '10px',
              maxWidth: servicos.length === 1 ? '520px' : '100%',
            }}>
              {servicos.map((s) => (
                <Link key={s.id} href={'/' + slug + '/agendar?servico=' + s.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: tema.cardBg,
                  border: '1px solid ' + tema.cardBorder,
                  borderRadius: '14px',
                  padding: '20px 22px',
                  textDecoration: 'none',
                  gap: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, ' + tema.accent + '40, transparent)' }} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px', color: '#F5F5F7', marginBottom: '5px' }}>{s.nome}</p>
                    <p style={{ fontSize: '12px', color: '#52525B' }}>
                      {[s.duracao_minutos ? s.duracao_minutos + ' min' : null, s.preco ? 'R$ ' + s.preco : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: tema.accent, fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {labelServico} →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* EQUIPE */}
        {profissionais && profissionais.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525B', marginBottom: '16px' }}>{labelEquipe}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {profissionais.map((p) => (
                <div key={p.id} style={{ background: tema.cardBg, border: '1px solid ' + tema.cardBorder, borderRadius: '16px', padding: '28px 16px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} style={{ width: '72px', height: '72px', borderRadius: '999px', objectFit: 'cover', border: '1px solid ' + tema.cardBorder }} />
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '999px', background: tema.iconBg, border: '1px solid ' + tema.iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '700', color: tema.accent }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#F5F5F7', marginBottom: '3px' }}>{p.nome}</p>
                    <p style={{ fontSize: '11px', color: '#52525B' }}>{p.cargo || 'Profissional'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BENEFÍCIOS */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525B', marginBottom: '16px' }}>Por que agendar aqui?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {[
              { icon: <Zap size={14} color={tema.accent} />, titulo: 'Agende em segundos', desc: 'Sem ligação. Sem espera.' },
              { icon: <CalendarDays size={14} color={tema.accent} />, titulo: 'Horários reais', desc: 'Veja apenas horários livres.' },
              { icon: <CheckCircle size={14} color={tema.accent} />, titulo: 'Tudo registrado', desc: 'Sua agenda fica organizada.' },
            ].map((b) => (
              <div key={b.titulo} style={{ background: tema.cardBg, border: '1px solid ' + tema.cardBorder, borderRadius: '14px', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, ' + tema.accent + '50, transparent)' }} />
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: tema.iconBg, border: '1px solid ' + tema.iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  {b.icon}
                </div>
                <p style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px', color: '#E4E4E7' }}>{b.titulo}</p>
                <p style={{ fontSize: '12px', color: '#52525B', lineHeight: 1.5 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <div style={{ background: 'linear-gradient(145deg, ' + tema.accentSoft + ' 0%, rgba(8,8,10,0.98) 100%)', border: '1px solid ' + tema.accentBorder, borderRadius: '20px', padding: '52px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px ' + tema.accentSoft }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '240px', height: '1px', background: 'linear-gradient(90deg, transparent, ' + tema.accent + '80, transparent)' }} />
          <p style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.02em', color: '#F5F5F7' }}>Pronto para marcar seu horário?</p>
          <p style={{ fontSize: '14px', color: '#52525B', marginBottom: '28px', maxWidth: '340px', margin: '0 auto 28px', lineHeight: 1.7 }}>
            Escolha o serviço, veja os horários e agende em segundos.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={'/' + slug + '/agendar'} style={{ display: 'inline-block', background: tema.accent, color: '#fff', fontWeight: '700', padding: '13px 36px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', boxShadow: '0 0 0 1px ' + tema.accentBorder + ', 0 6px 20px ' + tema.accentSoft.replace('0.08', '0.3') }}>
              Agendar agora
            </Link>
            {linkWpp && (
              <a href={linkWpp} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'transparent', color: '#A1A1AA', fontWeight: '600', padding: '13px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', border: '1px solid #27272A' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Falar no WhatsApp
              </a>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#3F3F46', marginTop: '28px' }}>
          Agendamento via <span style={{ color: '#52525B' }}>ClienteMarcado</span>
        </p>
      </div>
    </main>
  )
}