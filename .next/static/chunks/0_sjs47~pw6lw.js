(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,89954,e=>{"use strict";var o=e.i(43476),n=e.i(71645),i=e.i(76277);e.s(["default",0,function(){let[e,t]=(0,n.useState)(""),[a,r]=(0,n.useState)(""),[s,l]=(0,n.useState)(!1),[d,c]=(0,n.useState)(!1),[p,x]=(0,n.useState)(""),[g,h]=(0,n.useState)(!1),[m,u]=(0,n.useState)("");async function b(){c(!0),x("");let{error:o}=await i.supabase.auth.signInWithPassword({email:e,password:a});o?x("E-mail ou senha incorretos."):window.location.href="/painel",c(!1)}async function f(){if(!e)return void u("Digite seu e-mail acima primeiro.");h(!0),u("");let{error:o}=await i.supabase.auth.resetPasswordForEmail(e,{redirectTo:window.location.origin+"/painel"});h(!1),o?u("Erro ao enviar. Tente novamente."):u("Link enviado! Verifique seu e-mail.")}let w=`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #08080A; }

    .pg {
      min-height: 100vh;
      background: #08080A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px 40px;
    }

    .wrap {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Logo ── */
    .logo-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
      text-decoration: none;
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

    /* ── Headline ── */
    .headline { text-align: center; margin-bottom: 24px; }
    .headline h1 {
      font-size: 22px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .headline p { font-size: 14px; color: #6B7280; line-height: 1.5; }

    /* ── Card ── */
    .card {
      width: 100%;
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
    }
    @media (min-width: 480px) { .card { padding: 32px 28px; } }

    /* ── Campos ── */
    .campos { display: flex; flex-direction: column; gap: 14px; margin-bottom: 8px; }
    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 7px;
    }
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

    .senha-wrap { position: relative; }
    .senha-wrap .input { padding-right: 48px; }
    .olho {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #4B5563;
      display: flex; align-items: center; padding: 4px;
      -webkit-tap-highlight-color: transparent;
    }
    .olho:hover { color: #9CA3AF; }

    /* ── Esqueci senha ── */
    .esqueci-row {
      display: flex; justify-content: flex-end;
      margin-top: 6px; margin-bottom: 18px;
    }
    .btn-esqueci {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: 12px; color: #4B5563;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: color 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-esqueci:hover { color: #3B82F6; }
    .btn-esqueci:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Mensagens ── */
    .msg-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #EF4444; margin-bottom: 14px; text-align: center; }
    .msg-ok  { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #22C55E; margin-bottom: 14px; text-align: center; }
    .msg-info { font-size: 12px; color: #6B7280; text-align: center; margin-bottom: 14px; }

    /* ── Bot\xe3o ── */
    .btn-entrar {
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
      margin-bottom: 16px;
    }
    .btn-entrar:hover   { background: #2563EB; box-shadow: 0 4px 28px rgba(59,130,246,0.5); }
    .btn-entrar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Link cadastro ── */
    .link-cadastro { text-align: center; font-size: 13px; color: #4B5563; }
    .link-cadastro a { color: #3B82F6; font-weight: 600; text-decoration: none; }
    .link-cadastro a:hover { text-decoration: underline; }
  `;return(0,o.jsxs)("div",{className:"pg",children:[(0,o.jsx)("style",{children:w}),(0,o.jsxs)("div",{className:"wrap",children:[(0,o.jsxs)("a",{href:"/",className:"logo-row",children:[(0,o.jsx)("div",{className:"logo-icone",children:(0,o.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"#fff",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,o.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,o.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,o.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}),(0,o.jsx)("span",{className:"logo-texto",children:"ClienteMarcado"})]}),(0,o.jsxs)("div",{className:"headline",children:[(0,o.jsx)("h1",{children:"Entrar no ClienteMarcado"}),(0,o.jsx)("p",{children:"Acesse seu painel e acompanhe seus agendamentos."})]}),(0,o.jsxs)("div",{className:"card",children:[(0,o.jsxs)("div",{className:"campos",children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"E-mail"}),(0,o.jsx)("input",{type:"email",placeholder:"joao@email.com",value:e,onChange:e=>t(e.target.value),className:"input"})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"label",children:"Senha"}),(0,o.jsxs)("div",{className:"senha-wrap",children:[(0,o.jsx)("input",{type:s?"text":"password",placeholder:"Sua senha",value:a,onChange:e=>r(e.target.value),className:"input"}),(0,o.jsx)("button",{className:"olho",type:"button",onClick:()=>l(!s),children:s?(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),(0,o.jsx)("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}):(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),(0,o.jsx)("circle",{cx:"12",cy:"12",r:"3"})]})})]})]})]}),(0,o.jsx)("div",{className:"esqueci-row",children:(0,o.jsx)("button",{className:"btn-esqueci",onClick:f,disabled:g,type:"button",children:g?"Enviando...":"Esqueci minha senha"})}),p&&(0,o.jsx)("div",{className:"msg-err",children:p}),m&&(0,o.jsx)("div",{className:m.startsWith("Erro")?"msg-err":m.startsWith("Digite")?"msg-info":"msg-ok",children:m}),(0,o.jsx)("button",{onClick:b,disabled:d,className:"btn-entrar",children:d?"Entrando...":(0,o.jsxs)(o.Fragment,{children:["Entrar",(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),(0,o.jsx)("polyline",{points:"12 5 19 12 12 19"})]})]})}),(0,o.jsxs)("p",{className:"link-cadastro",children:["Não tem conta?"," ",(0,o.jsx)("a",{href:"/cadastro",children:"Criar conta grátis"})]})]})]})]})}])}]);