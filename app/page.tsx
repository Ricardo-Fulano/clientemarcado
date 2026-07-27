'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CalendarDays, Link2, ClipboardCheck, Users, CreditCard, BarChart3, MessageCircle, Clock, DollarSign } from 'lucide-react'
import AssistenteComercial from '@/app/components/AssistenteComercial'
const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const beneficios = [
  { I:CalendarDays, c:'#EC4899', bg:'rgba(236,72,153,.10)', bd:'rgba(236,72,153,.22)', titulo:'Agendamento online', texto:'Seu cliente escolhe serviço, profissional e horário pelo celular.' },
  { I:Link2, c:'#C4B5FD', bg:'rgba(139,92,246,.10)', bd:'rgba(139,92,246,.22)', titulo:'Página pública profissional', texto:'Um link moderno para colocar na bio, no Instagram e enviar pelo WhatsApp.' },
  { I:ClipboardCheck, c:'#4ADE80', bg:'rgba(34,197,94,.10)', bd:'rgba(34,197,94,.22)', titulo:'Controle presencial', texto:'Registre atendimentos feitos no balcão e mantenha o histórico organizado.' },
  { I:Users, c:'#8B5CF6', bg:'rgba(139,92,246,.10)', bd:'rgba(139,92,246,.22)', titulo:'Equipe e profissionais', texto:'Cadastre manicures, cabeleireiras, lash designers, esteticistas e outros profissionais.' },
  { I:CreditCard, c:'#FBBF24', bg:'rgba(245,158,11,.10)', bd:'rgba(245,158,11,.22)', titulo:'Financeiro simples', texto:'Veja valores recebidos, pendências, despesas e resultado do mês.' },
  { I:BarChart3, c:'#F472B6', bg:'rgba(236,72,153,.10)', bd:'rgba(236,72,153,.22)', titulo:'Relatórios do negócio', texto:'Entenda quais serviços, dias e profissionais mais movimentam seu negócio.' },
]
const dores = [
  { I:MessageCircle, c:'#F87171', bg:'rgba(239,68,68,.10)', bd:'rgba(239,68,68,.20)', titulo:'Cliente chama e você demora para responder', texto:'Enquanto você atende, outro cliente pode desistir esperando resposta no WhatsApp.' },
  { I:Clock, c:'#FBBF24', bg:'rgba(245,158,11,.10)', bd:'rgba(245,158,11,.20)', titulo:'Horário fica sem confirmação', texto:'Sem uma agenda clara, o cliente esquece e o profissional perde tempo.' },
  { I:DollarSign, c:'#C4B5FD', bg:'rgba(139,92,246,.10)', bd:'rgba(139,92,246,.20)', titulo:'Cobranças e retornos ficam espalhados', texto:'Organize clientes, pagamentos e histórico sem depender de conversas antigas.' },
]
const inclusosEssencial = [
  '1 login administrador',
  'Até 3 profissionais cadastrados',
  'Agenda online',
  'Página pública personalizada',
  'Cadastro de clientes',
  'Serviços e profissionais',
  'Controle financeiro',
  'Cobranças',
  'Relatórios',
  '7 dias grátis',
]
const inclusosEquipe = [
  '1 login administrador',
  'Até 15 profissionais cadastrados',
  'Login individual para cada profissional',
  'Cada profissional vê apenas a própria agenda',
  'Área "Meu Desempenho" para profissionais',
  'Administradora com acesso completo',
  'Financeiro, cobranças e relatórios protegidos',
  'Controle de equipe',
  'Página pública personalizada',
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
            <span style={{fontSize:'15px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
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
            <span style={{fontSize:'12px',fontWeight:600,color:'#EC4899',letterSpacing:'.04em'}}>7 dias grátis para organizar sua agenda de beleza</span>
          </div>
          <h1 style={{fontSize:'clamp(38px,6vw,66px)',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.04em',lineHeight:1.05,marginBottom:'24px'}}>
            Sua agenda de beleza<br/>organizada em um só link.
          </h1>
          <p style={{fontSize:'clamp(17px,2.4vw,20px)',fontWeight:700,background:G,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:'20px'}}>
            Seu cliente escolhe o serviço, o profissional e o horário. Você só atende.
          </p>
          <p style={{fontSize:'clamp(15px,2vw,17px)',color:'#B8AAB8',lineHeight:1.75,marginBottom:'44px',maxWidth:'580px',margin:'0 auto 44px'}}>
            Organize agendamentos, clientes, equipe, cobranças e atendimentos em um painel simples, moderno e profissional para negócios de estética e beleza.
          </p>
          <div className="hero-btns" style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/aceite-plano" className="btn-p">Começar 7 dias grátis</Link>
            <Link href="/login" className="btn-s">Já tenho conta</Link>
          </div>
          <p style={{fontSize:'12px',color:'#B8AAB8',marginTop:'16px'}}>Teste grátis por 7 dias. Depois R$ 79,90/mês. Sem fidelidade.</p>
        </div>
      </section>
      {/* SECAO DE DOR */}
      <section style={{padding:'60px 24px',maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <h2 style={{fontSize:'clamp(20px,3.5vw,30px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px',lineHeight:1.25}}>Você perde clientes quando sua agenda<br/>depende só do WhatsApp.</h2>
          <p style={{fontSize:'14px',color:'#B8AAB8',maxWidth:'460px',margin:'0 auto',lineHeight:1.65}}>Mensagens se perdem, horários confundem e o atendimento parece menos profissional. O ClienteMarcado organiza tudo em um só lugar.</p>
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
          <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Tudo que seu negócio de beleza precisa</h2>
          <p style={{fontSize:'15px',color:'#B8AAB8',maxWidth:'480px',margin:'0 auto',lineHeight:1.6}}>Do agendamento ao financeiro, um painel simples para organizar sua rotina.</p>
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
      {/* PLANO */}
      <section id="plano" style={{padding:'80px 24px',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.09),transparent 65%)'}}>
        <div style={{maxWidth:'980px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'48px'}}>
            <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Escolha o plano ideal para sua rotina de beleza</h2>
            <p style={{fontSize:'15px',color:'#B8AAB8',lineHeight:1.6,maxWidth:'560px',margin:'0 auto'}}>Comece organizando sua agenda com o Plano Essencial ou escolha o Plano Equipe para trabalhar com acessos individuais e mais controle sobre sua equipe.</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'24px',alignItems:'start'}}>

            {/* PLANO ESSENCIAL */}
            <div style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.10),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'40px 32px',position:'relative' as const}}>
              <div style={{textAlign:'center',marginBottom:'24px'}}>
                <h3 style={{fontSize:'20px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>Plano Essencial</h3>
                <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'18px',minHeight:'40px'}}>Para autônomas e negócios pequenos que querem organizar a agenda em um só lugar.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'44px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ 79</span>
                  <span style={{fontSize:'20px',fontWeight:700,color:'#F8F4F7'}}>,90</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>/mês</span>
                </div>
              </div>
              <div style={{marginBottom:'28px'}}>
                {inclusosEssencial.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <span style={{color:'#22C55E',fontSize:'14px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'14px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/aceite-plano?plano=essencial" className="btn-s" style={{width:'100%',justifyContent:'center',height:'50px',fontSize:'14px'}}>
                Começar com o Essencial
              </Link>
              <p style={{textAlign:'center',fontSize:'12px',color:'#B8AAB8',marginTop:'14px'}}>Ideal para quem centraliza a gestão do negócio.</p>
            </div>

            {/* PLANO EQUIPE */}
            <div style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.16),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid rgba(139,92,246,.50)',borderRadius:'22px',padding:'40px 32px',boxShadow:'0 0 64px rgba(139,92,246,.14)',position:'relative' as const}}>
              <div style={{position:'absolute' as const,top:'-13px',left:'50%',transform:'translateX(-50%)',background:G,borderRadius:'999px',padding:'4px 18px',fontSize:'11px',fontWeight:700,color:'#fff',whiteSpace:'nowrap' as const}}>Mais completo</div>
              <div style={{textAlign:'center',marginBottom:'24px'}}>
                <h3 style={{fontSize:'20px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>Plano Equipe</h3>
                <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'18px',minHeight:'40px'}}>Para salões, studios e clínicas de estética que precisam dividir acessos sem expor o financeiro.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'44px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ 149</span>
                  <span style={{fontSize:'20px',fontWeight:700,color:'#F8F4F7'}}>,90</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>/mês</span>
                </div>
              </div>
              <div style={{marginBottom:'28px'}}>
                {inclusosEquipe.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <span style={{color:'#22C55E',fontSize:'14px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'14px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/aceite-plano?plano=equipe" className="btn-p" style={{width:'100%',justifyContent:'center',height:'50px',fontSize:'14px'}}>
                Quero o Plano Equipe
              </Link>
              <p style={{textAlign:'center',fontSize:'12px',color:'#B8AAB8',marginTop:'14px'}}>Sua equipe acessa apenas o que precisa. Você continua no controle de tudo.</p>
            </div>

          </div>

          <p style={{textAlign:'center',fontSize:'13px',color:'#B8AAB8',marginTop:'32px'}}>Todos os planos incluem 7 dias grátis para testar o ClienteMarcado.</p>
        </div>
      </section>      {/* CTA FINAL */}
      <section style={{padding:'80px 24px',textAlign:'center',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.10),transparent 60%)'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'16px',lineHeight:1.2}}>
            Pronta para organizar sua agenda de beleza?
          </h2>
          <p style={{fontSize:'15px',color:'#B8AAB8',marginBottom:'36px',lineHeight:1.7}}>
            Comece grátis e veja como o ClienteMarcado pode deixar sua rotina mais profissional, simples e organizada.
          </p>
          <div className="cta-btns" style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/aceite-plano" className="btn-p">Começar 7 dias grátis</Link>
            <Link href="/login" className="btn-s">Já tenho conta</Link>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginTop:'20px'}}>Teste grátis por 7 dias. Depois R$ 79,90/mês. Sem fidelidade.</p>
        </div>
      </section>
      <footer style={{borderTop:'1px solid #2A1A2F',padding:'32px 24px',textAlign:'center'}}>
        <p style={{fontSize:'13px',color:'#B8AAB8'}}>© 2026 ClienteMarcado. Todos os direitos reservados.</p>
        <a href='https://instagram.com/clientemarcado' target='_blank' rel='noreferrer' style={{fontSize:'15px',color:'#E1306C',textDecoration:'none',marginTop:'16px',marginBottom:'60px',display:'inline-flex',alignItems:'center',gap:'6px',fontWeight:700}}><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#E1306C' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='2' width='20' height='20' rx='5' ry='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'/></svg>@clientemarcado</a>
      </footer>
      <AssistenteComercial checkoutUrl={CHECKOUT_URL} />
    </div>
  )
}
