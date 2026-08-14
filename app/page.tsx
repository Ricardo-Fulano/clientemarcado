'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CalendarDays, Link2, Users, BarChart3, MessageCircle, Globe, PlayCircle, Megaphone } from 'lucide-react'
import AssistenteComercial from '@/app/components/AssistenteComercial'
const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const beneficios = [
  { I:Globe, c:'#EC4899', bg:'rgba(236,72,153,.10)', bd:'rgba(236,72,153,.22)', titulo:'Página profissional', texto:'Crie uma página moderna com foto, banner, descrição, redes sociais e links importantes.' },
  { I:Link2, c:'#C4B5FD', bg:'rgba(139,92,246,.10)', bd:'rgba(139,92,246,.22)', titulo:'Links rápidos', texto:'Adicione WhatsApp, Instagram, TikTok, YouTube, cursos, produtos, grupos e muito mais.' },
  { I:Megaphone, c:'#FB923C', bg:'rgba(251,146,60,.10)', bd:'rgba(251,146,60,.22)', titulo:'Divulgações e publicidades', texto:'Destaque marcas, campanhas, parceiros, publis e links patrocinados na sua página.' },
  { I:PlayCircle, c:'#4ADE80', bg:'rgba(34,197,94,.10)', bd:'rgba(34,197,94,.22)', titulo:'Vídeos em destaque', texto:'Mostre conteúdos, aulas, depoimentos, bastidores, resultados ou apresentações.' },
  { I:CalendarDays, c:'#8B5CF6', bg:'rgba(139,92,246,.10)', bd:'rgba(139,92,246,.22)', titulo:'Agenda online', texto:'Permita que clientes escolham serviço, profissional e horário pelo link.' },
  { I:BarChart3, c:'#FBBF24', bg:'rgba(245,158,11,.10)', bd:'rgba(245,158,11,.22)', titulo:'Painel de gestão', texto:'Acompanhe clientes, agendamentos, cobranças, contatos e resultados em um só lugar.' },
  { I:Users, c:'#F472B6', bg:'rgba(236,72,153,.10)', bd:'rgba(236,72,153,.22)', titulo:'Equipe profissional', texto:'Controle profissionais e acessos quando seu negócio crescer.' },
]
const dores = [
  { I:Link2, c:'#F87171', bg:'rgba(239,68,68,.10)', bd:'rgba(239,68,68,.20)', titulo:'Links espalhados', texto:'Seu público não encontra WhatsApp, redes, cursos, produtos, serviços e campanhas em um só lugar.' },
  { I:Megaphone, c:'#FBBF24', bg:'rgba(245,158,11,.10)', bd:'rgba(245,158,11,.20)', titulo:'Divulgações sem destaque', texto:'Publicidades, parcerias e links de venda podem passar despercebidos quando ficam perdidos nos stories ou na bio.' },
  { I:MessageCircle, c:'#C4B5FD', bg:'rgba(139,92,246,.10)', bd:'rgba(139,92,246,.20)', titulo:'Atendimento desorganizado', texto:'Mensagens, contatos, agendamentos e cobranças ficam espalhados em conversas antigas.' },
]
const inclusosMiniPage = [
  'MiniPage profissional',
  'Link minipage.pro/seunome',
  'Foto, banner e descrição',
  'Redes sociais',
  'Links rápidos',
  'Cards de destaque',
  'Vídeos em destaque',
  'Espaço para divulgações e publicidades',
  'Botão WhatsApp',
  '7 dias grátis',
]
const inclusosProfissional = [
  'Tudo do plano MiniPage',
  'Agenda online',
  'Serviços e horários',
  'Cadastro de clientes',
  'Cobranças',
  'Controle financeiro',
  'Relatórios',
  'Até 3 profissionais cadastrados',
  '7 dias grátis',
]
const inclusosEquipe = [
  'Tudo do plano Profissional',
  'Até 15 profissionais cadastrados',
  'Login individual para cada profissional',
  'Cada profissional vê apenas a própria agenda',
  'Área "Meu Desempenho" para profissionais',
  'Administradora com acesso completo',
  'Financeiro, cobranças e relatórios protegidos',
  'Controle de equipe',
  '7 dias grátis',
]
export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  const scrollToPlano = () => {
    document.getElementById('plano')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div style={{background:'#08060A',minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 12px 32px rgba(236,72,153,.25);white-space:nowrap}
        .btn-p:hover{transform:translateY(-2px)}
        .btn-s{background:rgba(24,16,27,.88);color:#B8AAB8;border:1px solid #2A1A2F;border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;white-space:nowrap}
        .btn-s:hover{border-color:rgba(139,92,246,.45);color:#fff}
        .card-b{background:radial-gradient(circle at top left,rgba(139,92,246,.07),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.96),rgba(18,10,20,.99));border:1px solid #2A1A2F;border-radius:18px;padding:28px 24px;transition:border-color .2s,transform .2s}
        .card-b:hover{border-color:rgba(139,92,246,.28);transform:translateY(-3px)}
        @media(max-width:768px){
          .hero-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .hero-btns a{width:100%!important}
          .grid-3{grid-template-columns:1fr!important}
          .cta-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .cta-btns a{width:100%!important}
        }
      `}</style>
      {/* HEADER */}
      <header style={{position:'sticky',top:0,zIndex:50,background:scrolled?'rgba(8,6,10,.97)':'transparent',backdropFilter:'blur(20px)',borderBottom:scrolled?'1px solid #2A1A2F':'1px solid transparent',transition:'all .3s',padding:'0 24px'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'9px',background:G,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(139,92,246,.45)',flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1.15}}>
              <span style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>MiniPage Pro</span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#B8AAB8',letterSpacing:'.02em'}}>por ClienteMarcado</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <Link href="/login" style={{fontSize:'13px',color:'#B8AAB8',textDecoration:'none',fontWeight:500}}>Entrar</Link>
            <button onClick={scrollToPlano} className="btn-p" style={{height:'40px',padding:'0 20px',fontSize:'13px',borderRadius:'10px'}}>Começar grátis</button>
          </div>
        </div>
      </header>
      {/* HERO */}
      <section style={{padding:'100px 24px 80px',textAlign:'center',background:'radial-gradient(ellipse at 50% -10%,rgba(139,92,246,.22),transparent 55%)'}}>
        <div style={{maxWidth:'760px',margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(236,72,153,.10)',border:'1px solid rgba(236,72,153,.22)',borderRadius:'999px',padding:'6px 18px',marginBottom:'36px'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#EC4899',display:'inline-block',flexShrink:0}}/>
            <span style={{fontSize:'12px',fontWeight:600,color:'#EC4899',letterSpacing:'.04em'}}>7 dias grátis para criar sua MiniPage profissional</span>
          </div>
          <h1 style={{fontSize:'clamp(38px,6vw,66px)',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.04em',lineHeight:1.05,marginBottom:'24px'}}>
            Transforme sua bio<br/>em uma página profissional.
          </h1>
          <p style={{fontSize:'clamp(17px,2.4vw,20px)',fontWeight:700,background:G,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:'20px'}}>
            Com a MiniPage Pro, você reúne links, vídeos, publicidades, agenda e gestão em um só lugar.
          </p>
          <p style={{fontSize:'clamp(15px,2vw,17px)',color:'#B8AAB8',lineHeight:1.75,marginBottom:'44px',maxWidth:'580px',margin:'0 auto 44px'}}>
            Crie uma página moderna para divulgar no Instagram, WhatsApp e TikTok, apresentar seus conteúdos, destacar divulgações, vender produtos e organizar contatos em um painel simples.
          </p>
          <div className="hero-btns" style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/aceite-plano?plano=minipage" className="btn-p">Criar minha MiniPage grátis</Link>
            <Link href="/demo" className="btn-s">Ver exemplo</Link>
          </div>
          <p style={{fontSize:'12px',color:'#B8AAB8',marginTop:'16px'}}>Teste grátis por 7 dias. Planos a partir de R$ 29,90/mês. Sem fidelidade.</p>
        </div>

        {/* MOCKUP VISUAL DA MINIPAGE */}
        <div style={{display:'flex',justifyContent:'center',marginTop:'40px'}}>
          <div style={{width:'330px',background:'#0B0610',border:'1px solid rgba(236,72,153,.30)',borderRadius:'32px',padding:'16px',boxShadow:'0 34px 80px rgba(139,92,246,.24), 0 0 46px rgba(236,72,153,.14)'}}>
            <div style={{borderRadius:'22px',overflow:'hidden',background:'#120A14'}}>
              <div style={{position:'relative',height:'98px',background:'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'}} />
              <div style={{padding:'0 18px 18px',marginTop:'-32px',position:'relative'}}>
                <div style={{width:'64px',height:'64px',borderRadius:'999px',background:G,border:'3px solid #08060A',boxShadow:'0 0 20px rgba(236,72,153,.4)'}} />
                <p style={{fontSize:'16px',fontWeight:800,color:'#fff',marginTop:'9px'}}>seunome</p>
                <p style={{fontSize:'12px',color:'#EC4899',fontWeight:600,marginBottom:'14px'}}>minipage.pro/seunome</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'11px'}}>
                  {['Links','Vídeos','Publi'].map(t=>(
                    <div key={t} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(236,72,153,.22)',borderRadius:'11px',padding:'9px 7px',textAlign:'center'}}>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#fff'}}>{t}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                  {[{t:'Fale no WhatsApp',c:'#22C55E'},{t:'Redes sociais',c:'#8B5CF6'}].map(l=>(
                    <div key={l.t} style={{display:'flex',alignItems:'center',gap:'9px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'11px',padding:'9px 11px'}}>
                      <span style={{width:'9px',height:'9px',borderRadius:'999px',background:l.c,flexShrink:0}}/>
                      <span style={{fontSize:'11px',fontWeight:600,color:'#fff'}}>{l.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* PLANO */}
      <section id="plano" style={{padding:'80px 24px',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.09),transparent 65%)'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'48px'}}>
            <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Escolha o plano ideal para sua presença profissional</h2>
            <p style={{fontSize:'15px',color:'#B8AAB8',lineHeight:1.6,maxWidth:'560px',margin:'0 auto'}}>Comece com uma MiniPage para divulgar seu trabalho ou escolha um plano com agenda e gestão para organizar seus atendimentos.</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:'22px',alignItems:'start'}}>

            {/* PLANO MINIPAGE */}
            <div style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.10),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'36px 28px',position:'relative' as const}}>
              <div style={{textAlign:'center',marginBottom:'22px'}}>
                <h3 style={{fontSize:'19px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>MiniPage</h3>
                <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'18px',minHeight:'55px'}}>Para criadores, influencers, profissionais e pequenos negócios que querem uma página profissional na bio.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'40px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ 29</span>
                  <span style={{fontSize:'19px',fontWeight:700,color:'#F8F4F7'}}>,90</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>/mês</span>
                </div>
              </div>
              <div style={{marginBottom:'26px'}}>
                {inclusosMiniPage.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <span style={{color:'#22C55E',fontSize:'14px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'13px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/aceite-plano?plano=minipage" className="btn-p" style={{width:'100%',justifyContent:'center',height:'50px',fontSize:'14px'}}>
                Começar com a MiniPage
              </Link>
              <p style={{textAlign:'center',fontSize:'12px',color:'#B8AAB8',marginTop:'14px'}}>Ideal para divulgar links, conteúdos, produtos, publicidades e contatos.</p>
            </div>

            {/* PLANO PROFISSIONAL */}
            <div style={{background:'radial-gradient(ellipse at top,rgba(236,72,153,.16),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid rgba(236,72,153,.50)',borderRadius:'22px',padding:'36px 28px',boxShadow:'0 0 64px rgba(236,72,153,.14)',position:'relative' as const}}>
              <div style={{position:'absolute' as const,top:'-13px',left:'50%',transform:'translateX(-50%)',background:G,borderRadius:'999px',padding:'4px 18px',fontSize:'11px',fontWeight:700,color:'#fff',whiteSpace:'nowrap' as const}}>Mais escolhido</div>
              <div style={{textAlign:'center',marginBottom:'22px'}}>
                <h3 style={{fontSize:'19px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>Profissional</h3>
                <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'18px',minHeight:'55px'}}>Para profissionais e negócios que querem MiniPage completa com agenda, clientes e gestão.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'40px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ 79</span>
                  <span style={{fontSize:'19px',fontWeight:700,color:'#F8F4F7'}}>,90</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>/mês</span>
                </div>
              </div>
              <div style={{marginBottom:'26px'}}>
                {inclusosProfissional.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <span style={{color:'#22C55E',fontSize:'14px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'13px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/aceite-plano?plano=essencial" className="btn-p" style={{width:'100%',justifyContent:'center',height:'50px',fontSize:'14px'}}>
                Começar com o Profissional
              </Link>
              <p style={{textAlign:'center',fontSize:'12px',color:'#B8AAB8',marginTop:'14px'}}>Ideal para quem atende clientes e precisa organizar agenda, valores e contatos.</p>
            </div>

            {/* PLANO EQUIPE */}
            <div style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.16),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'36px 28px',position:'relative' as const}}>
              <div style={{textAlign:'center',marginBottom:'22px'}}>
                <h3 style={{fontSize:'19px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>Equipe</h3>
                <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'18px',minHeight:'55px'}}>Para negócios com equipe, agenda compartilhada e controle de atendimentos.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'40px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ 149</span>
                  <span style={{fontSize:'19px',fontWeight:700,color:'#F8F4F7'}}>,90</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>/mês</span>
                </div>
              </div>
              <div style={{marginBottom:'26px'}}>
                {inclusosEquipe.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <span style={{color:'#22C55E',fontSize:'14px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'13px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/aceite-plano?plano=equipe" className="btn-p" style={{width:'100%',justifyContent:'center',height:'50px',fontSize:'14px'}}>
                Quero o Plano Equipe
              </Link>
              <p style={{textAlign:'center',fontSize:'12px',color:'#B8AAB8',marginTop:'14px'}}>Ideal para negócios que precisam dividir acessos sem perder o controle.</p>
            </div>

          </div>

          <p style={{textAlign:'center',fontSize:'13px',color:'#B8AAB8',marginTop:'32px'}}>Todos os planos incluem 7 dias grátis. MiniPage Pro é uma solução ClienteMarcado.</p>
        </div>
      </section>
      {/* SECAO DE DOR */}
      <section style={{padding:'60px 24px',maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <h2 style={{fontSize:'clamp(20px,3.5vw,30px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px',lineHeight:1.25}}>Você perde oportunidades quando sua bio<br/>não mostra tudo o que você oferece.</h2>
          <p style={{fontSize:'14px',color:'#B8AAB8',maxWidth:'460px',margin:'0 auto',lineHeight:1.65}}>Links se perdem, divulgações passam despercebidas e o atendimento fica menos profissional quando tudo depende de mensagens soltas.</p>
        </div>
        <div className="grid-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px'}}>
          {dores.map((d,i)=>(
            <div key={i} style={{background:`radial-gradient(circle at top left,${d.bg},transparent 55%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))`,border:`1px solid ${d.bd}`,borderRadius:'16px',padding:'22px 20px',display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <div style={{width:'38px',height:'38px',borderRadius:'10px',background:d.bg,border:`1px solid ${d.bd}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <d.I size={18} color={d.c}/>
              </div>
              <div>
                <p style={{fontSize:'13px',fontWeight:700,color:'#F8F4F7',marginBottom:'5px',lineHeight:1.35}}>{d.titulo}</p>
                <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.6}}>{d.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* FUNCIONALIDADES */}
      <section style={{padding:'60px 24px 80px',maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'52px'}}>
          <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Tudo que sua MiniPage precisa para divulgar, vender e parecer profissional</h2>
          <p style={{fontSize:'15px',color:'#B8AAB8',maxWidth:'480px',margin:'0 auto',lineHeight:1.6}}>Uma página completa para transformar visitantes em contatos, clientes e oportunidades.</p>
        </div>
        <div className="grid-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
          {beneficios.map((b,i)=>(
            <div key={i} className="card-b">
              <div style={{width:'44px',height:'44px',borderRadius:'12px',background:b.bg,border:`1px solid ${b.bd}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
                <b.I size={20} color={b.c}/>
              </div>
              <h3 style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'8px'}}>{b.titulo}</h3>
              <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.65}}>{b.texto}</p>
            </div>
          ))}
        </div>
      </section>
      {/* CTA FINAL */}
      <section style={{padding:'80px 24px',textAlign:'center',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.10),transparent 60%)'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'16px',lineHeight:1.2}}>
            Pronto para transformar sua bio em uma MiniPage profissional?
          </h2>
          <p style={{fontSize:'15px',color:'#B8AAB8',marginBottom:'36px',lineHeight:1.7}}>
            Comece grátis e crie uma página completa para divulgar seus links, vídeos, publicidades, produtos, serviços e agenda.
          </p>
          <div className="cta-btns" style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/aceite-plano?plano=minipage" className="btn-p">Criar minha MiniPage grátis</Link>
            <Link href="/login" className="btn-s">Já tenho conta</Link>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginTop:'20px'}}>Teste grátis por 7 dias. Planos a partir de R$ 29,90/mês. Sem fidelidade.</p>
        </div>
      </section>
      <footer style={{borderTop:'1px solid #2A1A2F',padding:'32px 24px',textAlign:'center'}}>
        <p style={{fontSize:'13px',color:'#B8AAB8'}}>© 2026 ClienteMarcado. MiniPage Pro é uma solução ClienteMarcado.</p>
        <p style={{fontSize:'11px',color:'#475569',marginTop:'4px'}}>CNPJ: 31.671.616/0001-18</p>
        <a href='https://instagram.com/minipagepro' target='_blank' rel='noreferrer' style={{fontSize:'15px',color:'#E1306C',textDecoration:'none',marginTop:'16px',marginBottom:'60px',display:'inline-flex',alignItems:'center',gap:'6px',fontWeight:700}}><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#E1306C' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='2' width='20' height='20' rx='5' ry='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'/></svg>@minipagepro</a>
      </footer>
      <AssistenteComercial checkoutUrl={CHECKOUT_URL} />
    </div>
  )
}
