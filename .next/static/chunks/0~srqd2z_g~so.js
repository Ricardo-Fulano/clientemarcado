(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={formatUrl:function(){return l},formatWithValidation:function(){return c},urlObjectKeys:function(){return s}};for(var o in a)Object.defineProperty(r,o,{enumerable:!0,get:a[o]});let n=e.r(90809)._(e.r(98183)),i=/https?|ftp|gopher|file/;function l(e){let{auth:t,hostname:r}=e,a=e.protocol||"",o=e.pathname||"",l=e.hash||"",s=e.query||"",c=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?c=t+e.host:r&&(c=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(c+=":"+e.port)),s&&"object"==typeof s&&(s=String(n.urlQueryToSearchParams(s)));let d=e.search||s&&`?${s}`||"";return a&&!a.endsWith(":")&&(a+=":"),e.slashes||(!a||i.test(a))&&!1!==c?(c="//"+(c||""),o&&"/"!==o[0]&&(o="/"+o)):c||(c=""),l&&"#"!==l[0]&&(l="#"+l),d&&"?"!==d[0]&&(d="?"+d),o=o.replace(/[?#]/g,encodeURIComponent),d=d.replace("#","%23"),`${a}${c}${o}${d}${l}`}let s=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function c(e){return l(e)}},18581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return o}});let a=e.r(71645);function o(e,t){let r=(0,a.useRef)(null),o=(0,a.useRef)(null);return(0,a.useCallback)(a=>{if(null===a){let e=r.current;e&&(r.current=null,e());let t=o.current;t&&(o.current=null,t())}else e&&(r.current=n(e,a)),t&&(o.current=n(t,a))},[e,t])}function n(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},73668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return n}});let a=e.r(18967),o=e.r(52817);function n(e){if(!(0,a.isAbsoluteUrl)(e))return!0;try{let t=(0,a.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,o.hasBasePath)(r.pathname)}catch(e){return!1}}},84508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return a}});let a=e=>{}},22016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={default:function(){return m},useLinkStatus:function(){return v}};for(var o in a)Object.defineProperty(r,o,{enumerable:!0,get:a[o]});let n=e.r(90809),i=e.r(43476),l=n._(e.r(71645)),s=e.r(95057),c=e.r(8372),d=e.r(18581),u=e.r(18967),p=e.r(5550);e.r(33525);let f=e.r(88540),h=e.r(91949),x=e.r(73668),g=e.r(9396);function m(t){var r,a;let o,n,m,[v,j]=(0,l.useOptimistic)(h.IDLE_LINK_STATUS),y=(0,l.useRef)(null),{href:N,as:S,children:_,prefetch:w=null,passHref:C,replace:k,shallow:E,scroll:F,onClick:O,onMouseEnter:R,onTouchStart:P,legacyBehavior:T=!1,onNavigate:D,transitionTypes:B,ref:z,unstable_dynamicOnHover:$,...A}=t;o=_,T&&("string"==typeof o||"number"==typeof o)&&(o=(0,i.jsx)("a",{children:o}));let I=l.default.useContext(c.AppRouterContext),M=!1!==w,L=!1!==w?null===(a=w)||"auto"===a?g.FetchStrategy.PPR:g.FetchStrategy.Full:g.FetchStrategy.PPR,U="string"==typeof(r=S||N)?r:(0,s.formatUrl)(r);if(T){if(o?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});n=l.default.Children.only(o)}let K=T?n&&"object"==typeof n&&n.ref:z,V=l.default.useCallback(e=>(null!==I&&(y.current=(0,h.mountLinkInstance)(e,U,I,L,M,j)),()=>{y.current&&((0,h.unmountLinkForCurrentNavigation)(y.current),y.current=null),(0,h.unmountPrefetchableInstance)(e)}),[M,U,I,L,j]),q={ref:(0,d.useMergedRef)(V,K),onClick(t){T||"function"!=typeof O||O(t),T&&n.props&&"function"==typeof n.props.onClick&&n.props.onClick(t),!I||t.defaultPrevented||function(t,r,a,o,n,i,s){if("u">typeof window){let c,{nodeName:d}=t.currentTarget;if("A"===d.toUpperCase()&&((c=t.currentTarget.getAttribute("target"))&&"_self"!==c||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,x.isLocalURL)(r)){o&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),i){let e=!1;if(i({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:u}=e.r(99781);l.default.startTransition(()=>{u(r,o?"replace":"push",!1===n?f.ScrollBehavior.NoScroll:f.ScrollBehavior.Default,a.current,s)})}}(t,U,y,k,F,D,B)},onMouseEnter(e){T||"function"!=typeof R||R(e),T&&n.props&&"function"==typeof n.props.onMouseEnter&&n.props.onMouseEnter(e),I&&M&&(0,h.onNavigationIntent)(e.currentTarget,!0===$)},onTouchStart:function(e){T||"function"!=typeof P||P(e),T&&n.props&&"function"==typeof n.props.onTouchStart&&n.props.onTouchStart(e),I&&M&&(0,h.onNavigationIntent)(e.currentTarget,!0===$)}};return(0,u.isAbsoluteUrl)(U)?q.href=U:T&&!C&&("a"!==n.type||"href"in n.props)||(q.href=(0,p.addBasePath)(U)),m=T?l.default.cloneElement(n,q):(0,i.jsx)("a",{...A,...q,children:o}),(0,i.jsx)(b.Provider,{value:v,children:m})}e.r(84508);let b=(0,l.createContext)(h.IDLE_LINK_STATUS),v=()=>(0,l.useContext)(b);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},37750,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(76277),o=e.i(22016);e.s(["default",0,function(){let[e,n]=(0,r.useState)(""),[i,l]=(0,r.useState)([]),[s,c]=(0,r.useState)([]),[d,u]=(0,r.useState)(""),[p,f]=(0,r.useState)(""),[h,x]=(0,r.useState)(""),[g,m]=(0,r.useState)(""),[b,v]=(0,r.useState)(""),[j,y]=(0,r.useState)(""),[N,S]=(0,r.useState)(""),[_,w]=(0,r.useState)(""),[C,k]=(0,r.useState)(!1),[E,F]=(0,r.useState)(""),[O,R]=(0,r.useState)(!1),P=0===i.length,T="__outro__"===h;function D(e){let t=e.replace(/\D/g,"");return t?(parseInt(t,10)/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):""}async function B(){F("");let t=function(){if(P)return p.trim();let e=i.find(e=>e.id===d);return e?e.nome:""}();if(!t)return void F(P?"Informe o nome do profissional.":"Selecione um profissional.");if(T&&!g.trim())return void F("Descreva o serviÃ§o realizado.");R(!0);let{error:r}=await a.supabase.from("atendimentos").insert({user_id:e,profissional_nome_livre:t,cliente_nome:b.trim()||null,cliente_telefone:j||null,servico_livre:function(){if(T)return g.trim();let e=s.find(e=>e.id===h);return e?e.nome:""}()||null,valor:function(){if(!N)return null;let e=parseFloat(N.replace(/\./g,"").replace(",","."));return isNaN(e)?null:e}(),observacao:_.trim()||null});R(!1),r?F("Erro ao registrar. Tente novamente."):(k(!0),u(""),f(""),x(""),m(""),v(""),y(""),S(""),w(""),setTimeout(()=>k(!1),4e3))}(0,r.useEffect)(()=>{!async function(){let{data:{user:e}}=await a.supabase.auth.getUser();if(!e){window.location.href="/login";return}n(e.id);let{data:t}=await a.supabase.from("profissionais").select("id, nome").eq("user_id",e.id).order("nome");l(t||[]);let{data:r}=await a.supabase.from("servicos").select("id, nome, preco").eq("user_id",e.id).order("nome");c(r||[])}()},[]),(0,r.useEffect)(()=>{if(!T&&h){let e=s.find(e=>e.id===h);e?.preco?S(D(String(e.preco))):S("")}T&&S("")},[h]);let z=`
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
  `;return(0,t.jsxs)("div",{className:"pg",children:[(0,t.jsx)("style",{children:z}),(0,t.jsxs)("nav",{className:"nav",children:[(0,t.jsx)("span",{className:"nav-logo",children:"ClienteMarcado"}),(0,t.jsx)(o.default,{href:"/painel",className:"nav-back",children:"â† Voltar ao painel"})]}),(0,t.jsxs)("div",{className:"body",children:[(0,t.jsxs)("div",{className:"heading",children:[(0,t.jsx)("h1",{children:"Registrar atendimento"}),(0,t.jsx)("p",{children:"Registre atendimentos presenciais feitos na hora."})]}),C&&(0,t.jsx)("div",{className:"msg-ok",children:"âœ… Atendimento registrado com sucesso!"}),(0,t.jsxs)("div",{className:"card",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"section-label",children:"Profissional"}),(0,t.jsx)("div",{className:"section-group",children:P?(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"Nome do profissional *"}),(0,t.jsx)("input",{type:"text",placeholder:"Ex: Antonio, JoÃ£o...",value:p,onChange:e=>f(e.target.value),className:"input"})]}):(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"Profissional *"}),(0,t.jsxs)("select",{value:d,onChange:e=>u(e.target.value),className:"select",children:[(0,t.jsx)("option",{value:"",children:"Selecione o profissional..."}),i.map(e=>(0,t.jsx)("option",{value:e.id,children:e.nome},e.id))]})]})})]}),(0,t.jsx)("div",{className:"divider"}),(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"section-label",children:"ServiÃ§o"}),(0,t.jsx)("div",{className:"section-group",children:(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"ServiÃ§o realizado (opcional)"}),(0,t.jsxs)("select",{value:h,onChange:e=>x(e.target.value),className:"select",children:[(0,t.jsx)("option",{value:"",children:"Selecione o serviÃ§o..."}),s.map(e=>(0,t.jsxs)("option",{value:e.id,children:[e.nome,e.preco?` \xe2€” R$ ${parseFloat(e.preco).toLocaleString("pt-BR",{minimumFractionDigits:2})}`:""]},e.id)),(0,t.jsx)("option",{value:"__outro__",children:"âœï¸ Outro serviÃ§o"})]}),T&&(0,t.jsxs)("div",{className:"outro-reveal",children:[(0,t.jsx)("label",{className:"label",children:"Descreva o serviÃ§o realizado *"}),(0,t.jsx)("input",{type:"text",placeholder:"Ex: ajuste rÃ¡pido, retoque, venda de produto...",value:g,onChange:e=>m(e.target.value),className:"input"})]})]})})]}),(0,t.jsx)("div",{className:"divider"}),(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"section-label",children:"Cliente"}),(0,t.jsxs)("div",{className:"section-group",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"Nome do cliente (opcional)"}),(0,t.jsx)("input",{type:"text",placeholder:"Ex: Carlos Silva",value:b,onChange:e=>v(e.target.value),className:"input"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"Telefone (opcional)"}),(0,t.jsx)("input",{type:"tel",placeholder:"(11) 99999-9999",value:j,onChange:e=>{let t;return y((t=e.target.value.replace(/\D/g,"").slice(0,11)).length>10?`(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`:t.length>6?`(${t.slice(0,2)}) ${t.slice(2,6)}-${t.slice(6)}`:t.length>2?`(${t.slice(0,2)}) ${t.slice(2)}`:t.length>0?`(${t}`:"")},className:"input"})]})]})]}),(0,t.jsx)("div",{className:"divider"}),(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"section-label",children:"Pagamento"}),(0,t.jsx)("div",{className:"section-group",children:(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"Valor cobrado"}),(0,t.jsxs)("div",{className:"valor-wrap",children:[(0,t.jsx)("span",{className:"valor-prefix",children:"R$"}),(0,t.jsx)("input",{type:"text",inputMode:"numeric",placeholder:"0,00",value:N,onChange:function(e){S(D(e.target.value.replace(/\D/g,"")||"0"))},className:"input"})]}),h&&!T&&s.find(e=>e.id===h)?.preco&&(0,t.jsx)("p",{style:{fontSize:"11px",color:"#4B5563",marginTop:"6px"},children:"Valor do serviÃ§o preenchido automaticamente. Edite se necessÃ¡rio."})]})})]}),(0,t.jsx)("div",{className:"divider"}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"label",children:"ObservaÃ§Ã£o (opcional)"}),(0,t.jsx)("textarea",{rows:3,placeholder:"Ex: cliente pediu acabamento na navalha, pagou em dinheiro ou quer retorno em 15 dias",value:_,onChange:e=>w(e.target.value),className:"textarea"})]}),E&&(0,t.jsx)("p",{className:"msg-err",children:E}),(0,t.jsx)("button",{onClick:B,disabled:O,className:"btn-registrar",children:O?"Registrando...":"Registrar atendimento"})]})]})]})}])}]);