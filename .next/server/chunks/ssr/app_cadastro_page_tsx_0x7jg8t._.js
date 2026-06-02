module.exports=[86758,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(78530);let e=["Barbearia","Salão de cabeleireiro","Clínica estética","Clínica odontológica","Clínica médica","Petshop","Outro"],f=[{icon:(0,b.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,b.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,b.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,b.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),titulo:"Página de agendamento pronta",desc:"Seu negócio online em minutos, com sua cara e seu horário."},{icon:(0,b.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,b.jsx)("polyline",{points:"12 6 12 12 16 14"})]}),titulo:"Agenda organizada",desc:"Receba agendamentos, evite conflitos e nunca mais perca horários."},{icon:(0,b.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("line",{x1:"18",y1:"20",x2:"18",y2:"10"}),(0,b.jsx)("line",{x1:"12",y1:"20",x2:"12",y2:"4"}),(0,b.jsx)("line",{x1:"6",y1:"20",x2:"6",y2:"14"})]}),titulo:"Painel simples para acompanhar",desc:"Veja agendamentos, clientes e resultados de forma clara e prática."}],g=()=>(0,b.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"#fff",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,b.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,b.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,b.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),h=()=>(0,b.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),(0,b.jsx)("circle",{cx:"12",cy:"12",r:"3"})]}),i=()=>(0,b.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),(0,b.jsx)("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]});a.s(["default",0,function(){let[a,j]=(0,c.useState)(""),[k,l]=(0,c.useState)(""),[m,n]=(0,c.useState)(""),[o,p]=(0,c.useState)(""),[q,r]=(0,c.useState)(""),[s,t]=(0,c.useState)(!1),[u,v]=(0,c.useState)(!1),[w,x]=(0,c.useState)("");async function y(){v(!0),x("");let{error:b}=await d.supabase.auth.signUp({email:o,password:q,options:{data:{nome_negocio:a,tipo_negocio:k,nome_usuario:m}}});b?x("Erro: "+b.message):x("Conta criada! Verifique seu e-mail para confirmar."),v(!1)}let z=`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: #08080A; }

    .pg {
      min-height: 100vh;
      background: #08080A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* ══════════════════════════════
       BASE = MOBILE  (coluna \xfanica)
    ══════════════════════════════ */

    /* Esconde lado esquerdo (desktop only) */
    .col-esquerda { display: none; }

    .pg-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px 40px;
      gap: 0;
    }

    /* ── Logo mobile ── */
    .logo-bloco {
      width: 100%;
      max-width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .logo-icone {
      width: 34px; height: 34px; border-radius: 10px;
      background: #3B82F6;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-texto {
      font-size: 18px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.02em;
    }

    /* ── Headline mobile ── */
    .headline-bloco {
      width: 100%;
      max-width: 480px;
      text-align: center;
      margin-bottom: 24px;
    }
    .headline-titulo {
      font-size: 24px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.02em;
      margin-bottom: 8px; line-height: 1.2;
    }
    .headline-sub {
      font-size: 14px; color: #6B7280; line-height: 1.55;
    }

    /* ── Formul\xe1rio mobile ── */
    .form-bloco {
      width: 100%;
      max-width: 480px;
      margin-bottom: 20px;
    }

    /* ── Benef\xedcios mobile (abaixo do form) ── */
    .beneficios-mobile {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .beneficio-mobile-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 15px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 11px;
    }
    .beneficio-mobile-icone {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.15);
      display: flex; align-items: center; justify-content: center;
      color: #3B82F6;
    }
    .beneficio-mobile-titulo {
      font-size: 13px; font-weight: 600; color: #D1D5DB;
    }

    /* ══════════════════════════════
       DESKTOP (≥ 900px) — 2 colunas
    ══════════════════════════════ */
    @media (min-width: 900px) {

      /* Ativa coluna esquerda */
      .col-esquerda {
        display: flex;
        flex-direction: column;
        gap: 36px;
        flex: 1;
      }

      /* Esconde os blocos mobile avulsos */
      .logo-bloco      { display: none; }
      .headline-bloco  { display: none; }
      .beneficios-mobile { display: none; }

      /* Layout em linha */
      .pg-body {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 48px 48px;
        gap: 64px;
      }

      /* Coluna direita (formul\xe1rio) */
      .form-bloco {
        flex: 1;
        max-width: 480px;
        margin-bottom: 0;
      }

      /* Limita largura total do par */
      .pg-body > .col-esquerda,
      .pg-body > .form-bloco {
        max-width: 480px;
      }
    }

    /* ── Desktop: logo esquerda ── */
    .desk-logo-row {
      display: flex; align-items: center; gap: 10px;
    }
    .desk-logo-icone {
      width: 36px; height: 36px; border-radius: 10px;
      background: #3B82F6;
      display: flex; align-items: center; justify-content: center;
    }
    .desk-logo-texto {
      font-size: 18px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.02em;
    }
    .desk-hero-titulo {
      font-size: 38px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.03em;
      line-height: 1.15; margin-bottom: 14px;
    }
    .desk-hero-titulo span { color: #3B82F6; }
    .desk-hero-sub { font-size: 16px; color: #6B7280; line-height: 1.6; }

    .desk-beneficios { display: flex; flex-direction: column; gap: 14px; }
    .desk-beneficio {
      display: flex; align-items: flex-start; gap: 14px;
      background: linear-gradient(180deg, rgba(18,22,30,0.92) 0%, rgba(10,12,16,0.92) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 16px 18px;
    }
    .desk-beneficio-icone {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      background: rgba(59,130,246,0.12);
      border: 1px solid rgba(59,130,246,0.2);
      display: flex; align-items: center; justify-content: center;
      color: #3B82F6;
    }
    .desk-beneficio-titulo { font-size: 14px; font-weight: 700; color: #F1F5F9; margin-bottom: 3px; }
    .desk-beneficio-desc   { font-size: 13px; color: #6B7280; line-height: 1.45; }

    /* ── Card formul\xe1rio ── */
    .card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 20px;
      padding: 24px 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
    }
    @media (min-width: 900px) {
      .card { padding: 36px 32px; }
    }

    .card-titulo { font-size: 19px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 3px; }
    .card-sub    { font-size: 13px; color: #6B7280; margin-bottom: 22px; }

    /* ── Campos ── */
    .campos { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 7px;
    }
    .hint { font-size: 11px; color: #374151; margin-top: 5px; }

    .input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 14px 16px;
      color: #F1F5F9;
      font-size: 16px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-appearance: none;
    }
    .input:focus {
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder { color: #374151; }
    .input option { background: #0F1117; color: #F1F5F9; }

    .senha-wrap { position: relative; }
    .senha-wrap .input { padding-right: 48px; }
    .olho {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #4B5563;
      display: flex; align-items: center; padding: 4px;
      -webkit-tap-highlight-color: transparent;
    }
    .olho:hover { color: #9CA3AF; }

    /* ── Bot\xe3o ── */
    .btn-criar {
      width: 100%;
      background: #3B82F6; color: #fff;
      font-size: 15px; font-weight: 700;
      padding: 15px;
      border: none; border-radius: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 20px rgba(59,130,246,0.35);
      transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-tap-highlight-color: transparent;
      margin-bottom: 14px;
    }
    .btn-criar:hover   { background: #2563EB; box-shadow: 0 4px 28px rgba(59,130,246,0.5); }
    .btn-criar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Link login ── */
    .link-login { text-align: center; font-size: 13px; color: #4B5563; }
    .link-login a { color: #3B82F6; font-weight: 600; text-decoration: none; }
    .link-login a:hover { text-decoration: underline; }

    /* ── Mensagens ── */
    .msg-ok  { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #22C55E; margin-bottom: 14px; text-align: center; }
    .msg-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #EF4444; margin-bottom: 14px; text-align: center; }

    /* ── Footer ── */
    .footer {
      text-align: center; padding: 16px;
      font-size: 12px; color: #374151;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
  `;return(0,b.jsxs)("div",{className:"pg",children:[(0,b.jsx)("style",{children:z}),(0,b.jsxs)("div",{className:"pg-body",children:[(0,b.jsxs)("div",{className:"col-esquerda",children:[(0,b.jsxs)("div",{className:"desk-logo-row",children:[(0,b.jsx)("div",{className:"desk-logo-icone",children:(0,b.jsx)(g,{})}),(0,b.jsx)("span",{className:"desk-logo-texto",children:"ClienteMarcado"})]}),(0,b.jsxs)("div",{children:[(0,b.jsxs)("h1",{className:"desk-hero-titulo",children:["Crie sua conta no",(0,b.jsx)("br",{}),(0,b.jsx)("span",{children:"ClienteMarcado"})]}),(0,b.jsxs)("p",{className:"desk-hero-sub",children:["Seu cliente agenda sozinho.",(0,b.jsx)("br",{}),"Você controla tudo pelo painel."]})]}),(0,b.jsx)("div",{className:"desk-beneficios",children:f.map(a=>(0,b.jsxs)("div",{className:"desk-beneficio",children:[(0,b.jsx)("div",{className:"desk-beneficio-icone",children:a.icon}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"desk-beneficio-titulo",children:a.titulo}),(0,b.jsx)("p",{className:"desk-beneficio-desc",children:a.desc})]})]},a.titulo))})]}),(0,b.jsxs)("div",{className:"logo-bloco",children:[(0,b.jsx)("div",{className:"logo-icone",children:(0,b.jsx)(g,{})}),(0,b.jsx)("span",{className:"logo-texto",children:"ClienteMarcado"})]}),(0,b.jsxs)("div",{className:"headline-bloco",children:[(0,b.jsx)("h1",{className:"headline-titulo",children:"Crie sua conta grátis"}),(0,b.jsx)("p",{className:"headline-sub",children:"Configure sua página de agendamento em poucos minutos."})]}),(0,b.jsx)("div",{className:"form-bloco",children:(0,b.jsxs)("div",{className:"card",children:[(0,b.jsx)("p",{className:"card-titulo",children:"Criar conta grátis"}),(0,b.jsx)("p",{className:"card-sub",children:"É rápido, fácil e sem compromisso."}),(0,b.jsxs)("div",{className:"campos",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Tipo de negócio"}),(0,b.jsxs)("select",{value:k,onChange:a=>l(a.target.value),className:"input",children:[(0,b.jsx)("option",{value:"",children:"Selecione o tipo..."}),e.map(a=>(0,b.jsx)("option",{value:a,children:a},a))]}),(0,b.jsx)("p",{className:"hint",children:"Isso ajuda a preparar sua página de agendamento."})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Nome do negócio"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Barbearia do João",value:a,onChange:a=>j(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Seu nome"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: João Silva",value:m,onChange:a=>n(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"E-mail"}),(0,b.jsx)("input",{type:"email",placeholder:"joao@email.com",value:o,onChange:a=>p(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Senha"}),(0,b.jsxs)("div",{className:"senha-wrap",children:[(0,b.jsx)("input",{type:s?"text":"password",placeholder:"Mínimo 6 caracteres",value:q,onChange:a=>r(a.target.value),className:"input"}),(0,b.jsx)("button",{className:"olho",type:"button",onClick:()=>t(!s),children:s?(0,b.jsx)(i,{}):(0,b.jsx)(h,{})})]})]})]}),w&&(0,b.jsx)("div",{className:w.startsWith("Erro")?"msg-err":"msg-ok",children:w}),(0,b.jsx)("button",{onClick:y,disabled:u,className:"btn-criar",children:u?"Criando conta...":(0,b.jsxs)(b.Fragment,{children:["Criar minha conta",(0,b.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),(0,b.jsx)("polyline",{points:"12 5 19 12 12 19"})]})]})}),(0,b.jsxs)("p",{className:"link-login",children:["Já tem conta? ",(0,b.jsx)("a",{href:"/login",children:"Entrar"})]})]})}),(0,b.jsx)("div",{className:"beneficios-mobile",children:f.map(a=>(0,b.jsxs)("div",{className:"beneficio-mobile-item",children:[(0,b.jsx)("div",{className:"beneficio-mobile-icone",children:a.icon}),(0,b.jsx)("span",{className:"beneficio-mobile-titulo",children:a.titulo})]},a.titulo))})]}),(0,b.jsxs)("div",{className:"footer",children:[(0,b.jsxs)("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"#374151",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),(0,b.jsx)("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),"Seus dados estão protegidos com segurança de nível empresarial."]})]})}])}];

//# sourceMappingURL=app_cadastro_page_tsx_0x7jg8t._.js.map