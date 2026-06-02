(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,70462,e=>{"use strict";var o=e.i(43476),i=e.i(71645),n=e.i(76277);let s=["Barbearia","Salão de cabeleireiro","Clínica estética","Clínica odontológica","Clínica médica","Petshop","Outro"],a=[{icon:(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,o.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,o.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,o.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),titulo:"Página de agendamento pronta",desc:"Seu negócio online em minutos, com sua cara e seu horário."},{icon:(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,o.jsx)("polyline",{points:"12 6 12 12 16 14"})]}),titulo:"Agenda organizada",desc:"Receba agendamentos, evite conflitos e nunca mais perca horários."},{icon:(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("line",{x1:"18",y1:"20",x2:"18",y2:"10"}),(0,o.jsx)("line",{x1:"12",y1:"20",x2:"12",y2:"4"}),(0,o.jsx)("line",{x1:"6",y1:"20",x2:"6",y2:"14"})]}),titulo:"Painel simples para acompanhar",desc:"Veja agendamentos, clientes e resultados de forma clara e prática."}],t=()=>(0,o.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"#fff",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,o.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,o.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,o.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),r=()=>(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),(0,o.jsx)("circle",{cx:"12",cy:"12",r:"3"})]}),l=()=>(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),(0,o.jsx)("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]});e.s(["default",0,function(){let[e,d]=(0,i.useState)(""),[c,x]=(0,i.useState)(""),[p,g]=(0,i.useState)(""),[h,m]=(0,i.useState)(""),[u,b]=(0,i.useState)(""),[f,j]=(0,i.useState)(!1),[k,y]=(0,i.useState)(!1),[v,w]=(0,i.useState)("");async function N(){y(!0),w("");let{error:o}=await n.supabase.auth.signUp({email:h,password:u,options:{data:{nome_negocio:e,tipo_negocio:c,nome_usuario:p}}});o?w("Erro: "+o.message):w("Conta criada! Verifique seu e-mail para confirmar."),y(!1)}let F=`
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
  `;return(0,o.jsxs)("div",{className:"pg",children:[(0,o.jsx)("style",{children:F}),(0,o.jsxs)("div",{className:"pg-body",children:[(0,o.jsxs)("div",{className:"col-esquerda",children:[(0,o.jsxs)("div",{className:"desk-logo-row",children:[(0,o.jsx)("div",{className:"desk-logo-icone",children:(0,o.jsx)(t,{})}),(0,o.jsx)("span",{className:"desk-logo-texto",children:"ClienteMarcado"})]}),(0,o.jsxs)("div",{children:[(0,o.jsxs)("h1",{className:"desk-hero-titulo",children:["Crie sua conta no",(0,o.jsx)("br",{}),(0,o.jsx)("span",{children:"ClienteMarcado"})]}),(0,o.jsxs)("p",{className:"desk-hero-sub",children:["Seu cliente agenda sozinho.",(0,o.jsx)("br",{}),"Você controla tudo pelo painel."]})]}),(0,o.jsx)("div",{className:"desk-beneficios",children:a.map(e=>(0,o.jsxs)("div",{className:"desk-beneficio",children:[(0,o.jsx)("div",{className:"desk-beneficio-icone",children:e.icon}),(0,o.jsxs)("div",{children:[(0,o.jsx)("p",{className:"desk-beneficio-titulo",children:e.titulo}),(0,o.jsx)("p",{className:"desk-beneficio-desc",children:e.desc})]})]},e.titulo))})]}),(0,o.jsxs)("div",{className:"logo-bloco",children:[(0,o.jsx)("div",{className:"logo-icone",children:(0,o.jsx)(t,{})}),(0,o.jsx)("span",{className:"logo-texto",children:"ClienteMarcado"})]}),(0,o.jsxs)("div",{className:"headline-bloco",children:[(0,o.jsx)("h1",{className:"headline-titulo",children:"Crie sua conta grátis"}),(0,o.jsx)("p",{className:"headline-sub",children:"Configure sua página de agendamento em poucos minutos."})]}),(0,o.jsx)("div",{className:"form-bloco",children:(0,o.jsxs)("div",{className:"card",children:[(0,o.jsx)("p",{className:"card-titulo",children:"Criar conta grátis"}),(0,o.jsx)("p",{className:"card-sub",children:"É rápido, fácil e sem compromisso."}),(0,o.jsxs)("div",{className:"campos",children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"Tipo de negócio"}),(0,o.jsxs)("select",{value:c,onChange:e=>x(e.target.value),className:"input",children:[(0,o.jsx)("option",{value:"",children:"Selecione o tipo..."}),s.map(e=>(0,o.jsx)("option",{value:e,children:e},e))]}),(0,o.jsx)("p",{className:"hint",children:"Isso ajuda a preparar sua página de agendamento."})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"Nome do negócio"}),(0,o.jsx)("input",{type:"text",placeholder:"Ex: Barbearia do João",value:e,onChange:e=>d(e.target.value),className:"input"})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"Seu nome"}),(0,o.jsx)("input",{type:"text",placeholder:"Ex: João Silva",value:p,onChange:e=>g(e.target.value),className:"input"})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"E-mail"}),(0,o.jsx)("input",{type:"email",placeholder:"joao@email.com",value:h,onChange:e=>m(e.target.value),className:"input"})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"Senha"}),(0,o.jsxs)("div",{className:"senha-wrap",children:[(0,o.jsx)("input",{type:f?"text":"password",placeholder:"Mínimo 6 caracteres",value:u,onChange:e=>b(e.target.value),className:"input"}),(0,o.jsx)("button",{className:"olho",type:"button",onClick:()=>j(!f),children:f?(0,o.jsx)(l,{}):(0,o.jsx)(r,{})})]})]})]}),v&&(0,o.jsx)("div",{className:v.startsWith("Erro")?"msg-err":"msg-ok",children:v}),(0,o.jsx)("button",{onClick:N,disabled:k,className:"btn-criar",children:k?"Criando conta...":(0,o.jsxs)(o.Fragment,{children:["Criar minha conta",(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),(0,o.jsx)("polyline",{points:"12 5 19 12 12 19"})]})]})}),(0,o.jsxs)("p",{className:"link-login",children:["Já tem conta? ",(0,o.jsx)("a",{href:"/login",children:"Entrar"})]})]})}),(0,o.jsx)("div",{className:"beneficios-mobile",children:a.map(e=>(0,o.jsxs)("div",{className:"beneficio-mobile-item",children:[(0,o.jsx)("div",{className:"beneficio-mobile-icone",children:e.icon}),(0,o.jsx)("span",{className:"beneficio-mobile-titulo",children:e.titulo})]},e.titulo))})]}),(0,o.jsxs)("div",{className:"footer",children:[(0,o.jsxs)("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"#374151",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),(0,o.jsx)("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),"Seus dados estão protegidos com segurança de nível empresarial."]})]})}])}]);