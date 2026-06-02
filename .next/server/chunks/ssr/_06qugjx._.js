module.exports=[46058,(a,b,c)=>{"use strict";function d(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(d=function(a){return a?c:b})(a)}c._=function(a,b){if(!b&&a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=d(b);if(c&&c.has(a))return c.get(a);var e={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(e,g,h):e[g]=a[g]}return e.default=a,c&&c.set(a,e),e}},88644,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"InvariantError",{enumerable:!0,get:function(){return d}});class d extends Error{constructor(a,b){super(`Invariant: ${a.endsWith(".")?a:a+"."} This is a bug in Next.js.`,b),this.name="InvariantError"}}},39118,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={DEFAULT_SEGMENT_KEY:function(){return l},NOT_FOUND_SEGMENT_KEY:function(){return m},PAGE_SEGMENT_KEY:function(){return k},addSearchParamsIfPageSegment:function(){return i},computeSelectedLayoutSegment:function(){return j},getSegmentValue:function(){return f},getSelectedLayoutSegmentPath:function(){return function a(b,c,d=!0,e=[]){let g;if(d)g=b[1][c];else{let a=b[1];g=a.children??Object.values(a)[0]}if(!g)return e;let h=f(g[0]);return!h||h.startsWith(k)?e:(e.push(h),a(g,c,!1,e))}},isGroupSegment:function(){return g},isParallelRouteSegment:function(){return h}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});function f(a){return Array.isArray(a)?a[1]:a}function g(a){return"("===a[0]&&a.endsWith(")")}function h(a){return a.startsWith("@")&&"@children"!==a}function i(a,b){if(a.includes(k)){let a=JSON.stringify(b);return"{}"!==a?k+"?"+a:k}return a}function j(a,b){if(!a||0===a.length)return null;let c="children"===b?a[0]:a[a.length-1];return c===l?null:c}let k="__PAGE__",l="__DEFAULT__",m="/_not-found"},54427,(a,b,c)=>{"use strict";function d(){let a,b,c=new Promise((c,d)=>{a=c,b=d});return{resolve:a,reject:b,promise:c}}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"createPromiseWithResolvers",{enumerable:!0,get:function(){return d}})},94622,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(78530),e=a.i(38246);a.s(["default",0,function(){let[a,f]=(0,c.useState)(""),[g,h]=(0,c.useState)([]),[i,j]=(0,c.useState)([]),[k,l]=(0,c.useState)(""),[m,n]=(0,c.useState)(""),[o,p]=(0,c.useState)(""),[q,r]=(0,c.useState)(""),[s,t]=(0,c.useState)(""),[u,v]=(0,c.useState)(""),[w,x]=(0,c.useState)(""),[y,z]=(0,c.useState)(""),[A,B]=(0,c.useState)(!1),[C,D]=(0,c.useState)(""),[E,F]=(0,c.useState)(!1),G=0===g.length,H="__outro__"===o;function I(a){let b=a.replace(/\D/g,"");return b?(parseInt(b,10)/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):""}async function J(){D("");let b=function(){if(G)return m.trim();let a=g.find(a=>a.id===k);return a?a.nome:""}();if(!b)return void D(G?"Informe o nome do profissional.":"Selecione um profissional.");if(H&&!q.trim())return void D("Descreva o serviÃ§o realizado.");F(!0);let{error:c}=await d.supabase.from("atendimentos").insert({user_id:a,profissional_nome_livre:b,cliente_nome:s.trim()||null,cliente_telefone:u||null,servico_livre:function(){if(H)return q.trim();let a=i.find(a=>a.id===o);return a?a.nome:""}()||null,valor:function(){if(!w)return null;let a=parseFloat(w.replace(/\./g,"").replace(",","."));return isNaN(a)?null:a}(),observacao:y.trim()||null});F(!1),c?D("Erro ao registrar. Tente novamente."):(B(!0),l(""),n(""),p(""),r(""),t(""),v(""),x(""),z(""),setTimeout(()=>B(!1),4e3))}(0,c.useEffect)(()=>{!async function(){let{data:{user:a}}=await d.supabase.auth.getUser();if(!a){window.location.href="/login";return}f(a.id);let{data:b}=await d.supabase.from("profissionais").select("id, nome").eq("user_id",a.id).order("nome");h(b||[]);let{data:c}=await d.supabase.from("servicos").select("id, nome, preco").eq("user_id",a.id).order("nome");j(c||[])}()},[]),(0,c.useEffect)(()=>{if(!H&&o){let a=i.find(a=>a.id===o);a?.preco?x(I(String(a.preco))):x("")}H&&x("")},[o]);let K=`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .pg {
      min-height: 100vh;
      background: #08080A;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* NAV */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96);
      backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 10;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; text-decoration: none; letter-spacing: -0.02em; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    /* BODY */
    .body { max-width: 560px; margin: 0 auto; padding: 28px 16px 56px; }
    @media (min-width: 640px) { .body { padding: 36px 24px 64px; } }

    /* HEADING */
    .heading { margin-bottom: 24px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 480px) { .heading h1 { font-size: 22px; } }
    .heading p { font-size: 14px; color: #6B7280; }

    /* SUCESSO */
    .msg-ok {
      background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
      border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;
      text-align: center; font-size: 14px; font-weight: 600; color: #22C55E;
    }

    /* CARD */
    .card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 18px;
      padding: 22px 18px;
      display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @media (min-width: 480px) { .card { padding: 28px 24px; } }

    /* SECTION DIVIDER */
    .section-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: #374151; margin-bottom: 12px;
      padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .section-group { display: flex; flex-direction: column; gap: 14px; }

    /* FIELD */
    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 7px;
    }
    .input, .select, .textarea {
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
    .input:focus, .select:focus, .textarea:focus {
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder, .textarea::placeholder { color: #374151; }
    .select { cursor: pointer; }
    .select option { background: #0F1117; color: #F1F5F9; }
    .textarea { resize: none; }

    /* Valor field \xe2€” prefix */
    .valor-wrap { position: relative; }
    .valor-prefix {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      font-size: 14px; color: #6B7280; font-weight: 600; pointer-events: none;
    }
    .valor-wrap .input { padding-left: 36px; }

    /* Outro servi\xc3\xa7o reveal */
    .outro-reveal {
      margin-top: 10px;
      padding: 14px;
      background: rgba(59,130,246,0.04);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 10px;
    }
    .outro-reveal .label { color: #6B7280; }

    /* Erro */
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; }

    /* Bot\xc3\xa3o */
    .btn-registrar {
      width: 100%;
      background: #3B82F6; color: #fff;
      border: none; border-radius: 12px;
      padding: 15px;
      font-size: 15px; font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: background 0.15s, opacity 0.15s;
      font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-registrar:hover { background: #2563EB; }
    .btn-registrar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Divider */
    .divider { height: 1px; background: rgba(255,255,255,0.05); }
  `;return(0,b.jsxs)("div",{className:"pg",children:[(0,b.jsx)("style",{children:K}),(0,b.jsxs)("nav",{className:"nav",children:[(0,b.jsx)("span",{className:"nav-logo",children:"ClienteMarcado"}),(0,b.jsx)(e.default,{href:"/painel",className:"nav-back",children:"â† Voltar ao painel"})]}),(0,b.jsxs)("div",{className:"body",children:[(0,b.jsxs)("div",{className:"heading",children:[(0,b.jsx)("h1",{children:"Registrar atendimento"}),(0,b.jsx)("p",{children:"Registre atendimentos presenciais feitos na hora."})]}),A&&(0,b.jsx)("div",{className:"msg-ok",children:"âœ… Atendimento registrado com sucesso!"}),(0,b.jsxs)("div",{className:"card",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"section-label",children:"Profissional"}),(0,b.jsx)("div",{className:"section-group",children:G?(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Nome do profissional *"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Antonio, JoÃ£o...",value:m,onChange:a=>n(a.target.value),className:"input"})]}):(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Profissional *"}),(0,b.jsxs)("select",{value:k,onChange:a=>l(a.target.value),className:"select",children:[(0,b.jsx)("option",{value:"",children:"Selecione o profissional..."}),g.map(a=>(0,b.jsx)("option",{value:a.id,children:a.nome},a.id))]})]})})]}),(0,b.jsx)("div",{className:"divider"}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"section-label",children:"ServiÃ§o"}),(0,b.jsx)("div",{className:"section-group",children:(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"ServiÃ§o realizado (opcional)"}),(0,b.jsxs)("select",{value:o,onChange:a=>p(a.target.value),className:"select",children:[(0,b.jsx)("option",{value:"",children:"Selecione o serviÃ§o..."}),i.map(a=>(0,b.jsxs)("option",{value:a.id,children:[a.nome,a.preco?` \xe2€” R$ ${parseFloat(a.preco).toLocaleString("pt-BR",{minimumFractionDigits:2})}`:""]},a.id)),(0,b.jsx)("option",{value:"__outro__",children:"âœï¸ Outro serviÃ§o"})]}),H&&(0,b.jsxs)("div",{className:"outro-reveal",children:[(0,b.jsx)("label",{className:"label",children:"Descreva o serviÃ§o realizado *"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: ajuste rÃ¡pido, retoque, venda de produto...",value:q,onChange:a=>r(a.target.value),className:"input"})]})]})})]}),(0,b.jsx)("div",{className:"divider"}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"section-label",children:"Cliente"}),(0,b.jsxs)("div",{className:"section-group",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Nome do cliente (opcional)"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Carlos Silva",value:s,onChange:a=>t(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Telefone (opcional)"}),(0,b.jsx)("input",{type:"tel",placeholder:"(11) 99999-9999",value:u,onChange:a=>{let b;return v((b=a.target.value.replace(/\D/g,"").slice(0,11)).length>10?`(${b.slice(0,2)}) ${b.slice(2,7)}-${b.slice(7)}`:b.length>6?`(${b.slice(0,2)}) ${b.slice(2,6)}-${b.slice(6)}`:b.length>2?`(${b.slice(0,2)}) ${b.slice(2)}`:b.length>0?`(${b}`:"")},className:"input"})]})]})]}),(0,b.jsx)("div",{className:"divider"}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"section-label",children:"Pagamento"}),(0,b.jsx)("div",{className:"section-group",children:(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Valor cobrado"}),(0,b.jsxs)("div",{className:"valor-wrap",children:[(0,b.jsx)("span",{className:"valor-prefix",children:"R$"}),(0,b.jsx)("input",{type:"text",inputMode:"numeric",placeholder:"0,00",value:w,onChange:function(a){x(I(a.target.value.replace(/\D/g,"")||"0"))},className:"input"})]}),o&&!H&&i.find(a=>a.id===o)?.preco&&(0,b.jsx)("p",{style:{fontSize:"11px",color:"#4B5563",marginTop:"6px"},children:"Valor do serviÃ§o preenchido automaticamente. Edite se necessÃ¡rio."})]})})]}),(0,b.jsx)("div",{className:"divider"}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"ObservaÃ§Ã£o (opcional)"}),(0,b.jsx)("textarea",{rows:3,placeholder:"Ex: cliente pediu acabamento na navalha, pagou em dinheiro ou quer retorno em 15 dias",value:y,onChange:a=>z(a.target.value),className:"textarea"})]}),C&&(0,b.jsx)("p",{className:"msg-err",children:C}),(0,b.jsx)("button",{onClick:J,disabled:E,className:"btn-registrar",children:E?"Registrando...":"Registrar atendimento"})]})]})]})}])}];

//# sourceMappingURL=_06qugjx._.js.map