import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, CalendarDays, CheckCircle } from 'lucide-react'

type Tema = {
  accent: string
  accentSoft: string
  accentBorder: string
  heroGlow: string
}

function getTema(tipo: string): Tema {
  if (['Clínica médica', 'Clínica odontológica'].includes(tipo)) {
    return { accent: '#38BDF8', accentSoft: 'rgba(56,189,248,0.1)', accentBorder: 'rgba(56,189,248,0.25)', heroGlow: 'rgba(56,189,248,0.14)' }
  }
  if (['Clínica estética', 'Salão de cabeleireiro'].includes(tipo)) {
    return { accent: '#A78BFA', accentSoft: 'rgba(167,139,250,0.1)', accentBorder: 'rgba(167,139,250,0.25)', heroGlow: 'rgba(167,139,250,0.12)' }
  }
  if (tipo === 'Petshop') {
    return { accent: '#34D399', accentSoft: 'rgba(52,211,153,0.1)', accentBorder: 'rgba(52,211,153,0.25)', heroGlow: 'rgba(52,211,153,0.12)' }
  }
  return { accent: '#3B82F6', accentSoft: 'rgba(59,130,246,0.1)', accentBorder: 'rgba(59,130,246,0.25)', heroGlow: 'rgba(59,130,246,0.15)' }
}

function getLabels(tipo: string) {
  if (['Clínica médica', 'Clínica odontológica'].includes(tipo)) return { secao: 'Consultas', acao: 'Agendar consulta', equipe: 'Profissionais' }
  if (tipo === 'Petshop') return { secao: 'Serviços', acao: 'Agendar atendimento', equipe: 'Equipe' }
  if (tipo === 'Clínica estética') return { secao: 'Procedimentos', acao: 'Agendar procedimento', equipe: 'Profissionais' }
  return { secao: 'Serviços', acao: 'Agendar serviço', equipe: 'Equipe' }
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

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: perfil } = await supabase.from('perfis').select('*').eq('slug', slug).single()
  if (!perfil) return notFound()

  const { data: servicos } = await supabase.from('servicos').select('*').eq('user_id', perfil.user_id)
  const { data: profissionais } = await supabase.from('profissionais').select('*').eq('user_id', perfil.user_id)

  const tipo = perfil.tipo_negocio || ''
  const tema = getTema(tipo)
  const labels = getLabels(tipo)
  const subtitulo = getSubtitulo(tipo)
  const temBanner = !!perfil.banner_url
  const linkWpp = perfil.whatsapp
    ? 'https://wa.me/55' + perfil.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Olá! Vim pela página e gostaria de falar com vocês.')
    : null

  return (
    <main style={{ minHeight: '100vh', background: '#08080A', color: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      <style>{`
        .card-base {
          background: linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .card-clickable {
          background: linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          display: block;
        }
        .card-clickable:hover {
          border-color: rgba(59,130,246,0.55);
          box-shadow: 0 0 0 1px rgba(59,130,246,0.15), 0 16px 40px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }
        .card-benefit {
          background: linear-gradient(180deg, rgba(18,22,30,0.95) 0%, rgba(10,12,16,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-top: 1px solid rgba(59,130,246,0.35);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245,245,247,0.82);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .section-title::before {
          content: "";
          width: 3px;
          height: 16px;
          border-radius: 999px;
          background: #3B82F6;
          box-shadow: 0 0 10px rgba(59,130,246,0.35);
          flex-shrink: 0;
        }
        .acao-label {
          font-size: 12px;
          font-weight: 700;
          color: #3B82F6;
          flex-shrink: 0;
          white-space: nowrap;
          padding: 5px 10px;
          border-radius: 6px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .card-clickable:hover .acao-label {
          background: rgba(59,130,246,0.18);
          border-color: rgba(59,130,246,0.4);
        }
      `}</style>

      {/* HERO */}
      <div style={{
        position: 'relative',
        minHeight: temBanner ? '380px' : '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        ...(temBanner ? {
          backgroundImage: 'linear-gradient(to bottom, rgba(8,8,10,0.18) 0%, rgba(8,8,10,0.52) 50%, rgba(8,8,10,0.96) 100%), url(' + perfil.banner_url + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          background: 'radial-gradient(ellipse at 50% -10%, ' + tema.heroGlow + ' 0%, transparent 65%), linear-gradient(180deg, #0d0f1a 0%, #08080A 100%)',
        }),
      }}>
        {/* Nav topo */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '700', padding: '5px 12px', borderRadius: '999px', background: 'rgba(0,0,0,0.45)', color: tema.accent, border: '1px solid ' + tema.accentBorder, textTransform: 'uppercase', letterSpacing: '0.1em', backdropFilter: 'blur(8px)' }}>
            ● Agendamento online
          </div>
          {linkWpp && (
            <a href={linkWpp} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontWeight: '600', padding: '8px 16px', borderRadius: '999px', textDecoration: 'none', fontSize: '13px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          )}
        </div>

        {/* Conteúdo hero */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 32px 48px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#fff', margin: '0 0 10px', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>
            {perfil.nome_negocio}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', lineHeight: 1.5 }}>{subtitulo}</p>
          {perfil.endereco && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', margin: '0 0 24px' }}>📍 {perfil.endereco}</p>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href={'/' + slug + '/agendar'} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: tema.accent, color: '#fff', fontWeight: '700', padding: '13px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', boxShadow: '0 0 0 1px ' + tema.accentBorder + ', 0 8px 24px ' + tema.accentSoft }}>
              Agendar agora →
            </Link>
            {linkWpp && (
              <a href={linkWpp} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.82)', fontWeight: '600', padding: '13px 22px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(8px)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,9,11,0.95)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 32px', display: 'flex', flexWrap: 'wrap' }}>
          {[
            { icon: '📅', texto: 'Horário marcado' },
            { icon: '🕐', texto: 'Agendamento online' },
            ...(perfil.endereco ? [{ icon: '📍', texto: perfil.endereco }] : []),
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 24px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize: '13px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{item.texto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 32px 72px' }}>

        {/* SERVIÇOS + EQUIPE */}
        {((servicos && servicos.length > 0) || (profissionais && profissionais.length > 0)) && (
          <div style={{ display: 'grid', gridTemplateColumns: profissionais && profissionais.length > 0 && servicos && servicos.length > 0 ? '1fr 260px' : '1fr', gap: '24px', marginBottom: '16px', alignItems: 'start' }}>

            {/* SERVIÇOS */}
            {servicos && servicos.length > 0 && (
              <div>
                <p className="section-title">{labels.secao}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {servicos.map((s) => (
                    <Link key={s.id} href={'/' + slug + '/agendar?servico=' + s.id} className="card-clickable" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, ' + tema.accent + '70, transparent)' }} />
                      <div className="icon-box" style={{ background: tema.accentSoft, border: '1px solid ' + tema.accentBorder }}>
                        <span style={{ fontSize: '16px' }}>✂️</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '700', fontSize: '14px', color: '#F1F5F9', marginBottom: '3px' }}>{s.nome}</p>
                        {s.descricao ? (
                          <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px', lineHeight: 1.4 }}>{s.descricao}</p>
                        ) : (
                          <p style={{ fontSize: '11px', color: '#4B5563', marginBottom: '3px' }}>Atendimento com horário marcado</p>
                        )}
                        <p style={{ fontSize: '12px', color: '#6B7280' }}>
                          {s.duracao_minutos ? s.duracao_minutos + ' min' : ''}
                          {s.duracao_minutos && s.preco ? ' · ' : ''}
                          {s.preco ? <span style={{ color: '#22C55E', fontWeight: '600' }}>{'R$ ' + s.preco}</span> : null}
                        </p>
                      </div>
                      <span className="acao-label">{labels.acao} →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* EQUIPE */}
            {profissionais && profissionais.length > 0 && (
              <div>
                <p className="section-title">{labels.equipe}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profissionais.map((p) => (
                    <div key={p.id} className="card-base" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                      {p.foto_url ? (
                        <img src={p.foto_url} alt={p.nome} style={{ width: '42px', height: '42px', borderRadius: '999px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '999px', background: tema.accentSoft, border: '1px solid ' + tema.accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '700', color: tema.accent, flexShrink: 0 }}>
                          {p.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', marginBottom: '2px' }}>{p.nome}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280' }}>{p.cargo || 'Profissional'}</p>
                      </div>
                      <span style={{ fontSize: '14px', color: '#374151' }}>›</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BENEFÍCIOS */}
        <div style={{ marginBottom: '20px' }}>
          <p className="section-title">Por que agendar aqui?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { icon: <Zap size={16} color={tema.accent} />, titulo: 'Agende em segundos', desc: 'Sem ligação. Sem espera.' },
              { icon: <CalendarDays size={16} color={tema.accent} />, titulo: 'Horários reais', desc: 'Veja apenas horários livres.' },
              { icon: <CheckCircle size={16} color={tema.accent} />, titulo: 'Tudo registrado', desc: 'Sua agenda fica organizada.' },
            ].map((b) => (
              <div key={b.titulo} className="card-benefit" style={{ padding: '18px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div className="icon-box">
                  {b.icon}
                </div>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '13px', color: '#E2E8F0', marginBottom: '4px' }}>{b.titulo}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA FINAL */}
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(10,10,14,0.98) 70%)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '18px', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>
            ✂️
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '17px', fontWeight: '700', color: '#F1F5F9', marginBottom: '5px', letterSpacing: '-0.01em' }}>Pronto para marcar seu horário?</p>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>Escolha o serviço, veja os horários disponíveis e finalize em poucos segundos.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            <Link href={'/' + slug + '/agendar'} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: tema.accent, color: '#fff', fontWeight: '700', padding: '12px 22px', borderRadius: '9px', textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 16px ' + tema.accentSoft }}>
              Agendar agora →
            </Link>
            {linkWpp && (
              <a href={linkWpp} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'transparent', color: '#9CA3AF', fontWeight: '600', padding: '12px 18px', borderRadius: '9px', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Falar no WhatsApp
              </a>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#374151', marginTop: '24px' }}>
          Agendamento via <span style={{ color: '#4B5563' }}>ClienteMarcado</span>
        </p>
      </div>
    </main>
  )
}