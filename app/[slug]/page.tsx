import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, CalendarDays, CheckCircle, Sparkles } from 'lucide-react'

// Presets de cor — mesmos do perfil
function getTema(temaPublico: string) {
  switch(temaPublico) {
    case 'beleza':    return { accent:'#EC4899', soft:'rgba(236,72,153,.12)', border:'rgba(236,72,153,.28)', glow:'rgba(236,72,153,.15)', btnText:'#fff', secondary:'#A855F7' }
    case 'saude':     return { accent:'#22C55E', soft:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.28)',  glow:'rgba(34,197,94,.15)',  btnText:'#fff', secondary:'#06B6D4' }
    case 'barbearia': return { accent:'#F59E0B', soft:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.28)', glow:'rgba(245,158,11,.15)', btnText:'#111827', secondary:'#FACC15' }
    case 'minimal':   return { accent:'#94A3B8', soft:'rgba(148,163,184,.12)', border:'rgba(203,213,225,.28)', glow:'rgba(148,163,184,.10)', btnText:'#0F172A', secondary:'#64748B' }
    default:          return { accent:'#3B82F6', soft:'rgba(59,130,246,.12)', border:'rgba(59,130,246,.28)', glow:'rgba(59,130,246,.15)', btnText:'#fff', secondary:'#7C3AED' }
  }
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
.hero{position:relative;width:100%;min-height:340px;display:flex;align-items:flex-end;overflow:hidden}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(5,11,22,.45) 0%,rgba(5,11,22,.82) 60%,#050B16 100%)}
.hero-content{position:relative;z-index:2;width:100%;max-width:1100px;margin:0 auto;padding:48px 24px 36px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:16px;transition:border-color .2s,box-shadow .2s}
.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
.svc-card{display:flex;align-items:center;gap:14px;padding:16px 18px;text-decoration:none;color:inherit}
.svc-card:hover{border-color:var(--accent-border)!important;box-shadow:0 0 20px var(--accent-glow)}
.sec-title{font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.benefit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.hero-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
@media(max-width:767px){
  .hero{min-height:280px}
  .hero-content{padding:32px 16px 28px}
  .benefit-grid{grid-template-columns:1fr}
  .hero-btns{flex-direction:column}
  .hero-btns a{width:100%;justify-content:center;text-align:center}
  .cta-inner{flex-direction:column!important;gap:16px!important}
  .cta-btns{width:100%!important;flex-direction:column!important}
  .cta-btns a{width:100%!important;justify-content:center!important}
  .wrap{padding:0 14px}
}
`

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: perfil } = await supabase.from('perfis').select('*').eq('slug', slug).single()
  if (!perfil) return notFound()

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase.from('servicos').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('nome'),
    supabase.from('profissionais').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('nome'),
  ])

  const temaId = perfil.public_theme || perfil.tema_publico || perfil.tema_cor || 'padrao'
  const tema = getTema(temaId)

  const nomeBusiness = perfil.nome_negocio || 'Agendamento Online'
  const descBusiness = perfil.descricao || 'Agende seu atendimento online de forma rápida e prática.'
  const endereco = perfil.endereco || perfil.cidade || ''
  const capaUrl = perfil.capa_url || perfil.imagem_capa || perfil.banner_url || ''
  const wppNum = (perfil.whatsapp || '').replace(/\D/g, '')
  const linkWpp = wppNum ? `https://wa.me/55${wppNum}?text=${encodeURIComponent('Olá! Vim pela página e gostaria de agendar.')}` : null

  const fBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <main style={{ minHeight: '100vh', background: '#050B16', color: '#F8FAFC', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS + `
        :root { --accent: ${tema.accent}; --accent-border: ${tema.border}; --accent-glow: ${tema.glow}; }
      ` }} />

      {/* HERO */}
      <div className="hero" style={{ minHeight: capaUrl ? '380px' : '280px' }}>
        {capaUrl && <img src={capaUrl} alt={nomeBusiness} className="hero-img"/>}
        {!capaUrl && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left,${tema.soft},transparent 40%),linear-gradient(135deg,#050B16,#07111F)` }}/>}
        <div className="hero-overlay"/>
        <div className="hero-content">
          <div className="badge" style={{ background: tema.soft, border: `1px solid ${tema.border}`, color: tema.accent }}>
            <Zap size={11} color={tema.accent}/> Agendamento Online
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.1 }}>
            {nomeBusiness}
          </h1>
          <p style={{ fontSize: '15px', color: '#CBD5E1', marginBottom: endereco ? '6px' : '0', maxWidth: '500px', lineHeight: 1.5 }}>
            {descBusiness}
          </p>
          {endereco && (
            <p style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '12px' }}>📍</span> {endereco}
            </p>
          )}
          <div className="hero-btns">
            <Link href={`/${slug}/agendar`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: tema.accent, color: tema.btnText, fontWeight: 800, padding: '13px 26px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', boxShadow: `0 8px 24px ${tema.glow}`, letterSpacing: '-0.01em' }}>
              Agendar agora →
            </Link>
            {linkWpp && (
              <a href={linkWpp} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(34,197,94,.14)', color: '#4ADE80', fontWeight: 700, padding: '13px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(34,197,94,.28)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CONTEUDO */}
      <div className="wrap" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* BANNER PROMOCAO — cores do tema ativo */}
        {perfil?.promocao_ativa && perfil?.promocao_titulo && (()=>{
          const hoje=new Date();hoje.setHours(0,0,0,0)
          if(perfil.promocao_data_inicio&&hoje<new Date(perfil.promocao_data_inicio))return null
          if(perfil.promocao_data_fim){const fim=new Date(perfil.promocao_data_fim);fim.setHours(23,59,59,999);if(hoje>fim)return null}
          const href=perfil.promocao_servico_id?`/${slug}/agendar?servico=${perfil.promocao_servico_id}`:`/${slug}/agendar`
          const fBRLp=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
          const btnTxt=perfil.promocao_botao_texto||'Agendar promoção'
          return(
            <div style={{
              background:`radial-gradient(circle at top right,${tema.soft},transparent 35%),radial-gradient(circle at bottom left,rgba(124,58,237,.10),transparent 40%),linear-gradient(135deg,rgba(15,23,42,.98),rgba(17,24,39,.96))`,
              border:`1px solid ${tema.border}`,
              borderRadius:24,
              padding:'28px 32px',
              marginBottom:32,
              boxShadow:`0 24px 70px rgba(0,0,0,.35), 0 0 40px ${tema.glow}`,
            }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:24,flexWrap:'wrap' as const}}>
                <div style={{flex:'1 1 280px',minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={tema.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    <span style={{fontSize:11,fontWeight:800,color:tema.accent,letterSpacing:'.12em',textTransform:'uppercase' as const}}>Oferta da semana</span>
                  </div>
                  <h2 style={{fontSize:'clamp(20px,4vw,28px)',fontWeight:900,color:'#F8FAFC',letterSpacing:'-0.02em',marginBottom:8,lineHeight:1.2}}>{perfil.promocao_titulo}</h2>
                  {perfil.promocao_descricao&&<p style={{fontSize:14,color:'#CBD5E1',lineHeight:1.6,marginBottom:10}}>{perfil.promocao_descricao}</p>}
                  {perfil.promocao_observacao&&<div style={{display:'flex',alignItems:'center',gap:6}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{fontSize:12,color:'#94A3B8'}}>{perfil.promocao_observacao}</span>
                  </div>}
                </div>
                <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:10,minWidth:200}}>
                  {perfil.promocao_preco_antigo&&<p style={{fontSize:13,color:'#64748B',textDecoration:'line-through',margin:0}}>De {fBRLp(perfil.promocao_preco_antigo)}</p>}
                  {perfil.promocao_preco_novo&&<div style={{textAlign:'center' as const}}>
                    <span style={{fontSize:13,color:'#CBD5E1',fontWeight:600}}>Por </span>
                    <span style={{fontSize:36,fontWeight:900,color:tema.accent,letterSpacing:'-0.02em',lineHeight:1}}>{fBRLp(perfil.promocao_preco_novo)}</span>
                  </div>}
                  <a href={href} style={{
                    display:'inline-flex',alignItems:'center',justifyContent:'center',
                    background:`linear-gradient(135deg,${tema.accent},${tema.secondary})`,
                    color:tema.btnText,
                    borderRadius:14,padding:'13px 26px',fontSize:15,fontWeight:800,
                    textDecoration:'none',whiteSpace:'nowrap' as const,
                    boxShadow:`0 8px 24px ${tema.glow}`,
                    width:'100%',
                  }}>{btnTxt} →</a>
                </div>
              </div>
            </div>
          )
        })()}

        {/* SERVICOS */}
        {servicos && servicos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="sec-title">Serviços</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {servicos.map(s => (
                <Link key={s.id} href={`/${slug}/agendar?servico=${s.id}`} className="crd svc-card" style={{ border: `1px solid rgba(148,163,184,.14)` }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: tema.soft, border: `1px solid ${tema.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={18} color={tema.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC', marginBottom: '3px' }}>{s.nome}</p>
                    {s.descricao && <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px', lineHeight: 1.4 }}>{s.descricao}</p>}
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {s.duracao && <span>{s.duracao}</span>}
                      {s.duracao && s.preco ? <span style={{ margin: '0 5px' }}>·</span> : null}
                      {s.preco && <span style={{ color: tema.accent, fontWeight: 700 }}>{fBRL(parseFloat(s.preco))}</span>}
                    </p>
                  </div>
                  <span style={{ fontSize: '18px', color: '#374151', flexShrink: 0 }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* EQUIPE */}
        {profissionais && profissionais.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="sec-title">Equipe</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profissionais.map(p => (
                <div key={p.id} className="crd" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} style={{ width: '44px', height: '44px', borderRadius: '999px', objectFit: 'cover', border: `1px solid ${tema.border}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '999px', background: tema.soft, border: `1px solid ${tema.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: tema.accent, flexShrink: 0 }}>
                      {(p.nome || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>{p.nome}</p>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>{p.cargo || 'Profissional'}</p>
                  </div>
                  <span style={{ fontSize: '18px', color: '#374151' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POR QUE AGENDAR */}
        <div style={{ marginBottom: '32px' }}>
          <p className="sec-title">Por que agendar aqui?</p>
          <div className="benefit-grid">
            {[
              { I: Zap, titulo: 'Agende em segundos', desc: 'Sem ligação. Sem espera.' },
              { I: CalendarDays, titulo: 'Horários reais', desc: 'Veja apenas horários livres.' },
              { I: CheckCircle, titulo: 'Tudo registrado', desc: 'Sua agenda fica organizada.' },
            ].map(b => (
              <div key={b.titulo} className="crd" style={{ padding: '18px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: tema.soft, border: `1px solid ${tema.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <b.I size={16} color={tema.accent} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: '#E2E8F0', marginBottom: '4px' }}>{b.titulo}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA FINAL */}
        <div style={{ background: `radial-gradient(circle at top left,${tema.soft},transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`, border: `1.5px solid ${tema.border}`, borderRadius: '18px', padding: '28px 28px', boxShadow: `0 0 32px ${tema.glow}` }}>
          <div className="cta-inner" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px', letterSpacing: '-0.02em' }}>Pronto para escolher seu horário?</p>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>Veja os serviços disponíveis e agende em poucos segundos.</p>
            </div>
            <div className="cta-btns" style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
              <Link href={`/${slug}/agendar`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: tema.accent, color: tema.btnText, fontWeight: 800, padding: '13px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', boxShadow: `0 8px 24px ${tema.glow}`, whiteSpace: 'nowrap' }}>
                Agendar agora →
              </Link>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#374151', marginTop: '24px' }}>
          Agendamento via <span style={{ color: '#4B5563' }}>ClienteMarcado</span>
        </p>
      </div>
    </main>
  )
}
