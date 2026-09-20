'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import AssistenteComercial from '@/app/components/AssistenteComercial'
import { obterNomePlano, obterPrecoPlanoPorCiclo, obterPercentualEconomiaAnual, type BillingCycle } from './lib/planos'
const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
function fPreco(tipo: 'free'|'minipage'|'loja'|'essencial'|'equipe', ciclo: BillingCycle) {
  const p = obterPrecoPlanoPorCiclo(tipo, ciclo)
  const [inteiro, decimal] = p.toFixed(2).split('.')
  return { inteiro, decimal }
}
const inclusosFree = [
  'Até 5 links rápidos',
  'Foto, bio e redes sociais',
  'Modelos básicos',
  'Desempenho básico',
]
const inclusosMiniPage = [
  'Banner com vídeo',
  'Links ilimitados',
  'Destaques',
  'Vídeos',
  'Agenda/Eventos',
  'Painel de desempenho',
  'Captação de leads',
]
const inclusosLoja = [
  'Tudo do MiniPage',
  'Banner com vídeo',
  'Destaques ilimitados',
  'Catálogos ilimitados',
  'WhatsApp no catálogo',
  'Mensagem automática por item',
  'Links de venda e achadinhos',
  'Painel de desempenho',
  'Desempenho por produto/link',
  'Captação de leads',
]
const inclusosProfissional = [
  'Tudo do Loja',
  'Banner com vídeo',
  'Agenda de atendimento',
  'Clientes',
  'Orçamentos',
  'Cobranças',
  'Financeiro',
  'Relatórios',
  'Até 3 profissionais',
  'Painel de desempenho',
  'Captação de leads',
]
const inclusosEquipe = [
  'Tudo do Pro',
  'Banner com vídeo',
  'Até 15 profissionais',
  'Login individual por profissional',
  'Minha agenda',
  'Meu desempenho',
  'Controle de equipe',
  'Painel de desempenho',
  'Captação de leads',
]
export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [billingSelecionado, setBillingSelecionado] = useState<BillingCycle>('mensal')
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
        .btn-ver-exemplos{background:rgba(236,72,153,.12);color:#F8F4F7;border:1.5px solid rgba(236,72,153,.55);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;white-space:nowrap;box-shadow:0 0 24px rgba(236,72,153,.16)}
        .btn-ver-exemplos:hover{background:rgba(236,72,153,.20);border-color:rgba(236,72,153,.8);transform:translateY(-2px);box-shadow:0 0 32px rgba(236,72,153,.26)}
        .card-b{background:radial-gradient(circle at top left,rgba(139,92,246,.07),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.96),rgba(18,10,20,.99));border:1px solid #2A1A2F;border-radius:18px;padding:28px 24px;transition:border-color .2s,transform .2s}
        .card-b:hover{border-color:rgba(139,92,246,.28);transform:translateY(-3px)}
        .tudo-conectado-orbita{position:relative;width:100%;max-width:520px;aspect-ratio:1/1;margin:0 auto}
        .tudo-conectado-linhas{position:absolute;inset:0;width:100%;height:100%;opacity:1;z-index:0;filter:drop-shadow(0 0 3px rgba(236,72,153,.25))}
        .tudo-conectado-central{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:132px;height:132px;border-radius:20px;background:radial-gradient(circle at top left,rgba(139,92,246,.16),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(10,6,12,.99));border:1.5px solid rgba(236,72,153,.32);box-shadow:0 0 40px rgba(139,92,246,.28),0 12px 32px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;z-index:2;animation:pulseGlow 3.5s ease-in-out infinite}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 40px rgba(139,92,246,.28),0 12px 32px rgba(0,0,0,.4)}50%{box-shadow:0 0 56px rgba(236,72,153,.38),0 12px 32px rgba(0,0,0,.4)}}
        .tudo-conectado-pill{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:5px;background:rgba(24,16,27,.92);border:1px solid #2A1A2F;border-radius:14px;padding:10px 12px;min-width:76px;z-index:1;backdrop-filter:blur(6px)}
        .tudo-conectado-pill span{font-size:10px;font-weight:600;color:#B8AAB8;white-space:nowrap}
        @media(max-width:768px){
          .tudo-conectado-orbita{max-width:100%;aspect-ratio:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;place-items:center}
          .tudo-conectado-linhas{display:none}
          .tudo-conectado-central{position:static;transform:none;grid-column:1/-1;width:100%;max-width:220px;margin:0 auto 6px;animation:none}
          .tudo-conectado-pill{position:static;transform:none;width:100%}
        }
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
            <img src="/minipage-pro-icon.png" alt="MiniPage Pro" width={36} height={36} style={{borderRadius:'9px',flexShrink:0,objectFit:'contain'}}/>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1.15}}>
              <span style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>MiniPage Pro</span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#B8AAB8',letterSpacing:'.02em'}}>por ClienteMarcado</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <Link href="/login" style={{fontSize:'13px',color:'#B8AAB8',textDecoration:'none',fontWeight:500}}>Entrar</Link>
            <button onClick={scrollToPlano} className="btn-p" style={{height:'40px',padding:'0 20px',fontSize:'13px',borderRadius:'10px'}}>Ver planos</button>
          </div>
        </div>
      </header>
      {/* HERO */}
      <section style={{padding:'100px 24px 80px',textAlign:'center',background:'radial-gradient(ellipse at 50% -10%,rgba(139,92,246,.22),transparent 55%)'}}>
        <div style={{maxWidth:'760px',margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(236,72,153,.10)',border:'1px solid rgba(236,72,153,.22)',borderRadius:'999px',padding:'6px 18px',marginBottom:'36px'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#EC4899',display:'inline-block',flexShrink:0}}/>
            <span style={{fontSize:'12px',fontWeight:600,color:'#EC4899',letterSpacing:'.04em'}}>Crie sua MiniPage profissional</span>
          </div>
          <h1 style={{fontSize:'clamp(38px,6vw,66px)',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.04em',lineHeight:1.05,marginBottom:'24px'}}>
            Transforme sua bio<br/>em uma MiniPage profissional.
          </h1>
          <p style={{fontSize:'clamp(17px,2.4vw,20px)',fontWeight:700,background:G,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:'20px'}}>
            Crie em poucos cliques uma página moderna para organizar seus links, vídeos, divulgações, produtos, agenda e contatos em um só lugar.
          </p>
          <p style={{fontSize:'clamp(15px,2vw,17px)',color:'#B8AAB8',lineHeight:1.75,marginBottom:'32px',maxWidth:'580px',margin:'0 auto 32px'}}>
            Pronta para divulgar no Instagram, WhatsApp, TikTok e onde quiser.
          </p>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginTop:'18px'}}>Quer ver exemplos antes de criar? <a href="https://minipage.pro/modelos" style={{color:'#EC4899',fontWeight:600,textDecoration:'none'}}>Veja os melhores modelos</a>.</p>
          <p style={{fontSize:'12px',color:'#B8AAB8',marginTop:'10px'}}>Comece no plano grátis. Planos pagos a partir de R$ 39,90/mês. Sem fidelidade.</p>
        </div>
      </section>
      {/* TUDO CONECTADO */}
      <section className="tudo-conectado-section" style={{padding:'90px 24px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{maxWidth:'620px',margin:'0 auto 56px'}}>
          <h2 style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Tudo conectado.<br/>Em um só lugar.</h2>
          <p style={{fontSize:'15px',color:'#B8AAB8',lineHeight:1.6}}>WhatsApp, Instagram, TikTok, catálogo, agenda e muito mais — tudo reunido numa única página profissional.</p>
        </div>

        <div className="tudo-conectado-orbita">
          <svg className="tudo-conectado-linhas" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(ang=>{
              const rad=(ang*Math.PI)/180
              const x2=(50+38*Math.cos(rad)).toFixed(3)
              const y2=(50+38*Math.sin(rad)).toFixed(3)
              return <line key={ang} x1="50" y1="50" x2={x2} y2={y2} stroke="#D946EF" strokeOpacity="0.5" strokeWidth="0.4" strokeLinecap="round"/>
            })}
          </svg>

          <div className="tudo-conectado-central">
            <img src="/minipage-pro-icon.png" alt="MiniPage Pro" width={60} height={60} style={{borderRadius:'15px',objectFit:'contain'}}/>
            <p style={{fontSize:'10px',fontWeight:600,color:'#B8AAB8',marginTop:'9px',letterSpacing:'.01em'}}>minipage.pro/seunome</p>
          </div>

          {[
            {nome:'WhatsApp',cor:'#22C55E',svg:<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 22h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26C2.167 6.658 6.601 2 12.05 2c2.64 0 5.122 1.03 6.988 2.898A9.825 9.825 0 0121.93 11.9c-.003 5.45-4.437 9.884-9.885 9.884"/>},
            {nome:'Instagram',cor:'#EC4899',svg:<><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="#EC4899" strokeWidth="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#EC4899" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.1"/></>},
            {nome:'TikTok',cor:'#F8F4F7',svg:<path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/>},
            {nome:'YouTube',cor:'#FF0000',svg:<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/>},
            {nome:'Spotify',cor:'#1DB954',svg:<><circle cx="12" cy="12" r="10.5"/><path d="M7 9.5c3-.8 7-.5 9.5 1M7.2 13c2.5-.6 5.8-.4 7.8.8M7.5 16c2-.5 4.5-.3 6 .6" stroke="#08060A" strokeWidth="1.4" fill="none" strokeLinecap="round"/></>},
            {nome:'Facebook',cor:'#1877F2',svg:<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/>},
            {nome:'LinkedIn',cor:'#0A66C2',svg:<><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 9v8M7 6.2v.1M11 17V9m0 3c0-2 1.5-3 3-3s3 1 3 3v5" stroke="#08060A" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>},
            {nome:'Apple Music',cor:'#FA243C',svg:<><rect x="2" y="2" width="20" height="20" rx="6"/><path d="M15.5 7v7.2a2.6 2.6 0 1 1-1.5-2.36V9.3L10 10.4v5a2.6 2.6 0 1 1-1.5-2.36V8.2z" fill="#08060A"/></>},
            {nome:'Deezer',cor:'#FF6B00',svg:<><rect x="2" y="14" width="3.2" height="4" rx=".6"/><rect x="6.4" y="11.5" width="3.2" height="6.5" rx=".6"/><rect x="10.8" y="9" width="3.2" height="9" rx=".6"/><rect x="15.2" y="6.5" width="3.2" height="11.5" rx=".6"/><rect x="19.6" y="4" width="3.2" height="14" rx=".6"/></>},
            {nome:'YouTube Music',cor:'#FF0000',svg:<><circle cx="12" cy="12" r="10.5"/><circle cx="12" cy="12" r="6.2" fill="#08060A"/><circle cx="12" cy="12" r="2.2"/><path d="M10.5 9.3v5.4l4.6-2.7z" fill="#FF0000"/></>},
            {nome:'Shopee',cor:'#EE4D2D',svg:<path d="M12 2C9.5 2 7.5 4 7.5 6.5V8H5.5a1 1 0 0 0-1 .9L3.5 20.5a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5L19.5 8.9a1 1 0 0 0-1-.9h-2V6.5C16.5 4 14.5 2 12 2zm0 2c1.4 0 2.5 1.1 2.5 2.5V8h-5V6.5C9.5 5.1 10.6 4 12 4z"/>},
            {nome:'Mercado Livre',cor:'#FFE600',svg:<><circle cx="12" cy="12" r="10.5"/><path d="M7 14.5c1 1 3 1.5 5 1.5s4-.5 5-1.5M9 10c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5" stroke="#08060A" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>},
          ].map((p,i)=>{
            const ang=(i*30-90)*Math.PI/180
            const x=(50+38*Math.cos(ang)).toFixed(3)
            const y=(50+38*Math.sin(ang)).toFixed(3)
            return (
              <div key={p.nome} className="tudo-conectado-pill" style={{left:`${x}%`,top:`${y}%`}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={p.cor}>{p.svg}</svg>
                <span>{p.nome}</span>
              </div>
            )
          })}
        </div>
      </section>
      {/* CHAMADA PARA MODELOS REAIS */}
      <section style={{padding:'60px 24px',textAlign:'center'}}>
        <div style={{maxWidth:'560px',margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(20px,3.5vw,28px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Você cria sua MiniPage em poucos cliques</h2>
          <p style={{fontSize:'14px',color:'#B8AAB8',lineHeight:1.65,marginBottom:'28px'}}>Escolha um modelo, personalize sua página, adicione seus links e publique seu endereço profissional para divulgar nas redes sociais.</p>
          <a href="https://minipage.pro/modelos" className="btn-p" style={{height:'56px',padding:'0 36px',fontSize:'15px',boxShadow:'0 16px 40px rgba(236,72,153,.34),0 0 40px rgba(139,92,246,.20)'}}>Ver modelos de MiniPage</a>
        </div>
      </section>
      {/* PLANO */}
      <section id="plano" style={{padding:'80px 24px',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.09),transparent 65%)'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'48px'}}>
            <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'12px'}}>Escolha o plano ideal para sua presença profissional</h2>
            <p style={{fontSize:'15px',color:'#B8AAB8',lineHeight:1.6,maxWidth:'560px',margin:'0 auto'}}>Comece com uma MiniPage para organizar seus links ou escolha um plano com loja, agenda e gestão para vender e atender melhor.</p>
          </div>

          <div style={{display:'flex',justifyContent:'center',marginBottom:'24px'}}>
            <div style={{display:'inline-flex',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',borderRadius:'999px',padding:'4px'}}>
              <button type="button" onClick={()=>setBillingSelecionado('mensal')} style={{background:billingSelecionado==='mensal'?G:'transparent',color:billingSelecionado==='mensal'?'#fff':'#B8AAB8',border:'none',borderRadius:'999px',padding:'8px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Mensal</button>
              <button type="button" onClick={()=>setBillingSelecionado('anual')} style={{background:billingSelecionado==='anual'?G:'transparent',color:billingSelecionado==='anual'?'#fff':'#B8AAB8',border:'none',borderRadius:'999px',padding:'8px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                Anual
                <span style={{background:'rgba(34,197,94,.20)',color:'#22C55E',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'999px'}}>-17%</span>
              </button>
            </div>
          </div>
          <style>{`
            .planos-scroll::-webkit-scrollbar{display:none}
            /* Desktop com espaco suficiente: os 5 cards cabem inteiros numa grade fluida,
               sem scroll horizontal nenhum. !important e necessario pra sobrescrever os
               estilos inline (base mobile) so a partir deste breakpoint. */
            @media(min-width:900px){
              .planos-scroll{display:grid !important;grid-template-columns:repeat(5,minmax(0,1fr)) !important;overflow-x:visible !important;}
              .plano-card{flex:none !important;min-width:0 !important;width:auto !important;}
            }
          `}</style>
          <div className="planos-scroll" style={{display:'flex',flexWrap:'nowrap',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollSnapType:'x proximity',gap:'18px',alignItems:'stretch',paddingTop:'20px',paddingBottom:'8px',scrollbarWidth:'none'}}>

            {/* PLANO FREE */}
            <div className="plano-card" style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.10),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'30px 22px',position:'relative' as const,flex:'0 0 250px',minWidth:'250px',scrollSnapAlign:'start'}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <h3 style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>{obterNomePlano('free')}</h3>
                <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'16px',minHeight:'50px'}}>Ideal para começar sua presença online com links básicos.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'34px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ {fPreco('free', 'mensal').inteiro}</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>/mês</span>
                </div>
              </div>
              <div style={{marginBottom:'22px'}}>
                {inclusosFree.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'11px'}}>
                    <span style={{color:'#22C55E',fontSize:'13px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'12px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro?plano=free" className="btn-s" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                Começar grátis
              </Link>
            </div>

            {/* PLANO MINIPAGE */}
            <div className="plano-card" style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.10),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'30px 22px',position:'relative' as const,flex:'0 0 250px',minWidth:'250px',scrollSnapAlign:'start'}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <h3 style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>{obterNomePlano('minipage')}</h3>
                <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'16px',minHeight:'50px'}}>Página profissional com links, destaques, vídeos e agenda/eventos.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'34px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ {fPreco('minipage', billingSelecionado).inteiro}</span>
                  <span style={{fontSize:'16px',fontWeight:700,color:'#F8F4F7'}}>,{fPreco('minipage', billingSelecionado).decimal}</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>{billingSelecionado==='anual'?'/ano':'/mês'}</span>
                </div>
              </div>
              <div style={{marginBottom:'22px'}}>
                {inclusosMiniPage.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'11px'}}>
                    <span style={{color:'#22C55E',fontSize:'13px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'12px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href={`/aceite-plano?plano=minipage&billing=${billingSelecionado}`} className="btn-p" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                Começar com a MiniPage
              </Link>
            </div>

            {/* PLANO LOJA */}
            <div className="plano-card" style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.10),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'30px 22px',position:'relative' as const,flex:'0 0 250px',minWidth:'250px',scrollSnapAlign:'start'}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <h3 style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>{obterNomePlano('loja')}</h3>
                <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'16px',minHeight:'50px'}}>Vitrine para produtos, achadinhos, músicas, cursos, divulgações e vendas.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'34px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ {fPreco('loja', billingSelecionado).inteiro}</span>
                  <span style={{fontSize:'16px',fontWeight:700,color:'#F8F4F7'}}>,{fPreco('loja', billingSelecionado).decimal}</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>{billingSelecionado==='anual'?'/ano':'/mês'}</span>
                </div>
              </div>
              <div style={{marginBottom:'22px'}}>
                {inclusosLoja.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'11px'}}>
                    <span style={{color:'#22C55E',fontSize:'13px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'12px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href={`/aceite-plano?plano=loja&billing=${billingSelecionado}`} className="btn-p" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                Quero o MiniPage Loja
              </Link>
            </div>

            {/* PLANO PRO (interno: essencial) */}
            <div className="plano-card" style={{background:'radial-gradient(ellipse at top,rgba(236,72,153,.16),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid rgba(236,72,153,.50)',borderRadius:'22px',padding:'30px 22px',boxShadow:'0 0 64px rgba(236,72,153,.14)',position:'relative' as const,flex:'0 0 250px',minWidth:'250px',scrollSnapAlign:'start'}}>
              <div style={{position:'absolute' as const,top:'-13px',left:'50%',transform:'translateX(-50%)',background:G,borderRadius:'999px',padding:'4px 18px',fontSize:'11px',fontWeight:700,color:'#fff',whiteSpace:'nowrap' as const}}>Mais escolhido</div>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <h3 style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>{obterNomePlano('essencial')}</h3>
                <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'16px',minHeight:'50px'}}>MiniPage completa com agenda, clientes e gestão.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'34px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ {fPreco('essencial', billingSelecionado).inteiro}</span>
                  <span style={{fontSize:'16px',fontWeight:700,color:'#F8F4F7'}}>,{fPreco('essencial', billingSelecionado).decimal}</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>{billingSelecionado==='anual'?'/ano':'/mês'}</span>
                </div>
              </div>
              <div style={{marginBottom:'22px'}}>
                {inclusosProfissional.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'11px'}}>
                    <span style={{color:'#22C55E',fontSize:'13px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'12px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href={`/aceite-plano?plano=essencial&billing=${billingSelecionado}`} className="btn-p" style={{width:'100%',justifyContent:'center',height:'auto',minHeight:'46px',padding:'12px 14px',fontSize:'13px',whiteSpace:'normal',lineHeight:1.3,textAlign:'center' as const}}>
                Começar com o {obterNomePlano('essencial')}
              </Link>
            </div>

            {/* PLANO EQUIPE (interno: equipe) */}
            <div className="plano-card" style={{background:'radial-gradient(ellipse at top,rgba(139,92,246,.16),transparent 55%),rgba(24,16,27,.97)',border:'1.5px solid #2A1A2F',borderRadius:'22px',padding:'30px 22px',position:'relative' as const,flex:'0 0 250px',minWidth:'250px',scrollSnapAlign:'start'}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <h3 style={{fontSize:'17px',fontWeight:800,color:'#F8F4F7',marginBottom:'6px'}}>{obterNomePlano('equipe')}</h3>
                <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,marginBottom:'16px',minHeight:'50px'}}>Para negócios com equipe, agenda compartilhada e controle.</p>
                <div style={{marginBottom:'8px'}}>
                  <span style={{fontSize:'34px',fontWeight:900,color:'#F8F4F7',letterSpacing:'-0.03em'}}>R$ {fPreco('equipe', billingSelecionado).inteiro}</span>
                  <span style={{fontSize:'16px',fontWeight:700,color:'#F8F4F7'}}>,{fPreco('equipe', billingSelecionado).decimal}</span>
                  <span style={{fontSize:'14px',color:'#B8AAB8'}}>{billingSelecionado==='anual'?'/ano':'/mês'}</span>
                </div>
              </div>
              <div style={{marginBottom:'22px'}}>
                {inclusosEquipe.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'11px'}}>
                    <span style={{color:'#22C55E',fontSize:'13px',flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{fontSize:'12px',color:'#B8AAB8'}}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href={`/aceite-plano?plano=equipe&billing=${billingSelecionado}`} className="btn-p" style={{width:'100%',justifyContent:'center',height:'46px',fontSize:'13px'}}>
                Quero o {obterNomePlano('equipe')}
              </Link>
            </div>

          </div>

          <p style={{textAlign:'center',fontSize:'13px',color:'#B8AAB8',marginTop:'32px'}}>{billingSelecionado==='anual' ? 'Planos anuais com cobrança única e renovação anual. MiniPage Pro é uma solução ClienteMarcado.' : 'Planos pagos com cobrança mensal recorrente. MiniPage Pro é uma solução ClienteMarcado.'}</p>
        </div>
      </section>
      {/* CTA FINAL */}
      <section style={{padding:'80px 24px',textAlign:'center',background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,.10),transparent 60%)'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:'16px',lineHeight:1.2}}>
            Pronto para transformar sua bio em uma MiniPage profissional?
          </h2>
          <p style={{fontSize:'15px',color:'#B8AAB8',marginBottom:'36px',lineHeight:1.7}}>
            Crie uma página completa para divulgar seus links, vídeos, publicidades, produtos, serviços e agenda.
          </p>
          <div className="cta-btns" style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/aceite-plano?plano=minipage" className="btn-p">Criar minha MiniPage</Link>
            <Link href="/login" className="btn-s">Já tenho conta</Link>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginTop:'20px'}}>Comece no plano grátis. Planos pagos a partir de R$ 39,90/mês. Sem fidelidade.</p>
        </div>
      </section>
      <footer style={{borderTop:'1px solid #2A1A2F',padding:'32px 24px',textAlign:'center'}}>
        <p style={{fontSize:'13px',color:'#B8AAB8'}}>© 2026 ClienteMarcado. MiniPage Pro é uma solução ClienteMarcado.</p>
        <p style={{fontSize:'11px',color:'#475569',marginTop:'4px'}}>CNPJ: 31.671.616/0001-18</p>
        <a href='https://instagram.com/clientemarcado' target='_blank' rel='noreferrer' style={{fontSize:'15px',color:'#E1306C',textDecoration:'none',marginTop:'16px',marginBottom:'60px',display:'inline-flex',alignItems:'center',gap:'6px',fontWeight:700}}><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#E1306C' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='2' width='20' height='20' rx='5' ry='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'/></svg>@clientemarcado</a>
      </footer>
      <AssistenteComercial checkoutUrl={CHECKOUT_URL} />
    </div>
  )
}
