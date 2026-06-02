(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95057,(e,a,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r={formatUrl:function(){return s},formatWithValidation:function(){return c},urlObjectKeys:function(){return l}};for(var o in r)Object.defineProperty(t,o,{enumerable:!0,get:r[o]});let n=e.r(90809)._(e.r(98183)),i=/https?|ftp|gopher|file/;function s(e){let{auth:a,hostname:t}=e,r=e.protocol||"",o=e.pathname||"",s=e.hash||"",l=e.query||"",c=!1;a=a?encodeURIComponent(a).replace(/%3A/i,":")+"@":"",e.host?c=a+e.host:t&&(c=a+(~t.indexOf(":")?`[${t}]`:t),e.port&&(c+=":"+e.port)),l&&"object"==typeof l&&(l=String(n.urlQueryToSearchParams(l)));let d=e.search||l&&`?${l}`||"";return r&&!r.endsWith(":")&&(r+=":"),e.slashes||(!r||i.test(r))&&!1!==c?(c="//"+(c||""),o&&"/"!==o[0]&&(o="/"+o)):c||(c=""),s&&"#"!==s[0]&&(s="#"+s),d&&"?"!==d[0]&&(d="?"+d),o=o.replace(/[?#]/g,encodeURIComponent),d=d.replace("#","%23"),`${r}${c}${o}${d}${s}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function c(e){return s(e)}},18581,(e,a,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"useMergedRef",{enumerable:!0,get:function(){return o}});let r=e.r(71645);function o(e,a){let t=(0,r.useRef)(null),o=(0,r.useRef)(null);return(0,r.useCallback)(r=>{if(null===r){let e=t.current;e&&(t.current=null,e());let a=o.current;a&&(o.current=null,a())}else e&&(t.current=n(e,r)),a&&(o.current=n(a,r))},[e,a])}function n(e,a){if("function"!=typeof e)return e.current=a,()=>{e.current=null};{let t=e(a);return"function"==typeof t?t:()=>e(null)}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),a.exports=t.default)},73668,(e,a,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"isLocalURL",{enumerable:!0,get:function(){return n}});let r=e.r(18967),o=e.r(52817);function n(e){if(!(0,r.isAbsoluteUrl)(e))return!0;try{let a=(0,r.getLocationOrigin)(),t=new URL(e,a);return t.origin===a&&(0,o.hasBasePath)(t.pathname)}catch(e){return!1}}},84508,(e,a,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"errorOnce",{enumerable:!0,get:function(){return r}});let r=e=>{}},22016,(e,a,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r={default:function(){return m},useLinkStatus:function(){return v}};for(var o in r)Object.defineProperty(t,o,{enumerable:!0,get:r[o]});let n=e.r(90809),i=e.r(43476),s=n._(e.r(71645)),l=e.r(95057),c=e.r(8372),d=e.r(18581),p=e.r(18967),u=e.r(5550);e.r(33525);let h=e.r(88540),g=e.r(91949),f=e.r(73668),x=e.r(9396);function m(a){var t,r;let o,n,m,[v,j]=(0,s.useOptimistic)(g.IDLE_LINK_STATUS),y=(0,s.useRef)(null),{href:k,as:N,children:w,prefetch:S=null,passHref:C,replace:_,shallow:F,scroll:z,onClick:B,onMouseEnter:E,onTouchStart:P,legacyBehavior:A=!1,onNavigate:D,transitionTypes:R,ref:T,unstable_dynamicOnHover:O,...M}=a;o=w,A&&("string"==typeof o||"number"==typeof o)&&(o=(0,i.jsx)("a",{children:o}));let $=s.default.useContext(c.AppRouterContext),U=!1!==S,I=!1!==S?null===(r=S)||"auto"===r?x.FetchStrategy.PPR:x.FetchStrategy.Full:x.FetchStrategy.PPR,L="string"==typeof(t=N||k)?t:(0,l.formatUrl)(t);if(A){if(o?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});n=s.default.Children.only(o)}let q=A?n&&"object"==typeof n&&n.ref:T,W=s.default.useCallback(e=>(null!==$&&(y.current=(0,g.mountLinkInstance)(e,L,$,I,U,j)),()=>{y.current&&((0,g.unmountLinkForCurrentNavigation)(y.current),y.current=null),(0,g.unmountPrefetchableInstance)(e)}),[U,L,$,I,j]),K={ref:(0,d.useMergedRef)(W,q),onClick(a){A||"function"!=typeof B||B(a),A&&n.props&&"function"==typeof n.props.onClick&&n.props.onClick(a),!$||a.defaultPrevented||function(a,t,r,o,n,i,l){if("u">typeof window){let c,{nodeName:d}=a.currentTarget;if("A"===d.toUpperCase()&&((c=a.currentTarget.getAttribute("target"))&&"_self"!==c||a.metaKey||a.ctrlKey||a.shiftKey||a.altKey||a.nativeEvent&&2===a.nativeEvent.which)||a.currentTarget.hasAttribute("download"))return;if(!(0,f.isLocalURL)(t)){o&&(a.preventDefault(),location.replace(t));return}if(a.preventDefault(),i){let e=!1;if(i({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:p}=e.r(99781);s.default.startTransition(()=>{p(t,o?"replace":"push",!1===n?h.ScrollBehavior.NoScroll:h.ScrollBehavior.Default,r.current,l)})}}(a,L,y,_,z,D,R)},onMouseEnter(e){A||"function"!=typeof E||E(e),A&&n.props&&"function"==typeof n.props.onMouseEnter&&n.props.onMouseEnter(e),$&&U&&(0,g.onNavigationIntent)(e.currentTarget,!0===O)},onTouchStart:function(e){A||"function"!=typeof P||P(e),A&&n.props&&"function"==typeof n.props.onTouchStart&&n.props.onTouchStart(e),$&&U&&(0,g.onNavigationIntent)(e.currentTarget,!0===O)}};return(0,p.isAbsoluteUrl)(L)?K.href=L:A&&!C&&("a"!==n.type||"href"in n.props)||(K.href=(0,u.addBasePath)(L)),m=A?s.default.cloneElement(n,K):(0,i.jsx)("a",{...M,...K,children:o}),(0,i.jsx)(b.Provider,{value:v,children:m})}e.r(84508);let b=(0,s.createContext)(g.IDLE_LINK_STATUS),v=()=>(0,s.useContext)(b);("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),a.exports=t.default)},67672,e=>{"use strict";var a=e.i(43476),t=e.i(71645),r=e.i(76277),o=e.i(22016);let n=[{key:"domingo",label:"Domingo",num:0},{key:"segunda",label:"Segunda-feira",num:1},{key:"terca",label:"Ter�a-feira",num:2},{key:"quarta",label:"Quarta-feira",num:3},{key:"quinta",label:"Quinta-feira",num:4},{key:"sexta",label:"Sexta-feira",num:5},{key:"sabado",label:"S�bado",num:6}],i={domingo:{ativo:!1,abertura:"",fechamento:""},segunda:{ativo:!0,abertura:"08:00",fechamento:"18:00"},terca:{ativo:!0,abertura:"08:00",fechamento:"18:00"},quarta:{ativo:!0,abertura:"08:00",fechamento:"18:00"},quinta:{ativo:!0,abertura:"08:00",fechamento:"18:00"},sexta:{ativo:!0,abertura:"08:00",fechamento:"18:00"},sabado:{ativo:!0,abertura:"08:00",fechamento:"12:00"}};function s(e){let a=e.replace(/\D/g,"").slice(0,11);return a.length>10?`(${a.slice(0,2)}) ${a.slice(2,7)}-${a.slice(7)}`:a.length>6?`(${a.slice(0,2)}) ${a.slice(2,6)}-${a.slice(6)}`:a.length>2?`(${a.slice(0,2)}) ${a.slice(2)}`:a.length>0?`(${a}`:""}e.s(["default",0,function(){let[e,l]=(0,t.useState)(""),[c,d]=(0,t.useState)(""),[p,u]=(0,t.useState)(""),[h,g]=(0,t.useState)(""),[f,x]=(0,t.useState)(""),[m,b]=(0,t.useState)(30),[v,j]=(0,t.useState)("08:00"),[y,k]=(0,t.useState)("18:00"),[N,w]=(0,t.useState)([1,2,3,4,5,6]),[S,C]=(0,t.useState)(0),[_,F]=(0,t.useState)(""),[z,B]=(0,t.useState)(""),[E,P]=(0,t.useState)(""),[A,D]=(0,t.useState)(i),[R,T]=(0,t.useState)(!1),[O,M]=(0,t.useState)(!1),[$,U]=(0,t.useState)(""),[I,L]=(0,t.useState)(""),[q,W]=(0,t.useState)(!1),[K,Q]=(0,t.useState)(!1),[G,J]=(0,t.useState)(""),H=(0,t.useRef)(null);async function V(){let{data:{user:e}}=await r.supabase.auth.getUser();if(!e){window.location.href="/login";return}J(e.id);let{data:a}=await r.supabase.from("perfis").select("*").eq("user_id",e.id).single();a&&(l(a.nome_negocio||""),d(a.slug||""),u(s(a.whatsapp||"")),g(a.endereco||""),x(a.banner_url||""),b(a.intervalo_agenda||30),j(a.hora_abertura||"08:00"),k(a.hora_fechamento||"18:00"),w(a.dias_funcionamento||[1,2,3,4,5,6]),C(a.antecedencia_minima||0),F(a.instagram||""),B(a.cidade_estado||""),P(a.descricao_curta||a.descricao||""),D(function(e){let a={};for(let t of Object.keys(e)){let r=e[t];!r.ativo||r.abertura&&r.fechamento?a[t]=r:a[t]={...r,abertura:r.abertura||"08:00",fechamento:r.fechamento||"18:00"}}return a}(a.horarios_funcionamento||i)),W(!0))}function X(e){return e.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g,"").trim().replace(/\s+/g,"-")}async function Y(e){if(L(""),!["image/jpeg","image/png","image/webp"].includes(e.type))return void L("JPG, PNG ou WEBP, m�x. 5 MB.");if(e.size>5242880)return void L("Imagem muito grande. M�x. 5 MB.");M(!0);let a=e.name.split(".").pop(),t=G+"/banner-"+Date.now()+"."+a,{error:o}=await r.supabase.storage.from("business-banners").upload(t,e,{upsert:!0});if(o){L("Erro ao enviar imagem."),M(!1);return}let{data:n}=r.supabase.storage.from("business-banners").getPublicUrl(t);x(n.publicUrl),M(!1)}function Z(e,a,t){D(r=>{let o=r[e]||{ativo:!1,abertura:"",fechamento:""};return"ativo"===a&&!0===t?{...r,[e]:{ativo:!0,abertura:o.abertura||"08:00",fechamento:o.fechamento||"18:00"}}:{...r,[e]:{...o,[a]:t}}})}async function ee(){if(!e||!c)return void U("Nome e link s�o obrigat�rios.");for(let e of n){let a=A[e.key];if(a.ativo){if(!a.abertura||!a.fechamento)return void U(`Preencha os hor�rios de ${e.label}.`);if(a.abertura>=a.fechamento)return void U(`Hor�rio inv�lido em ${e.label}: fechamento deve ser ap�s abertura.`)}}T(!0);let{data:{user:a}}=await r.supabase.auth.getUser(),t={nome_negocio:e,slug:c,whatsapp:p.replace(/\D/g,""),endereco:h,banner_url:f,intervalo_agenda:m,hora_abertura:v,hora_fechamento:y,dias_funcionamento:N,antecedencia_minima:S,instagram:_.replace("@","").trim()||null,cidade_estado:z.trim()||null,descricao_curta:E.trim()||null,descricao:E.trim()||null,horarios_funcionamento:A};if(q){let{error:e}=await r.supabase.from("perfis").update(t).eq("user_id",a?.id);U(e?"Erro ao salvar.":"Perfil atualizado!")}else{let{error:e}=await r.supabase.from("perfis").insert({user_id:a?.id,...t});e?U(e.message.includes("slug")?"Esse link j� est� em uso.":"Erro ao salvar."):(U("Perfil criado!"),W(!0))}T(!1),setTimeout(()=>U(""),4e3)}(0,t.useEffect)(()=>{V()},[]);let ea=`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg {
      min-height: 100vh; background: #08080A; color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96); backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 20;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    .body { max-width: 680px; margin: 0 auto; padding: 24px 16px 56px; }
    @media (min-width: 640px) { .body { padding: 32px 24px 64px; } }

    .heading { margin-bottom: 24px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 480px) { .heading h1 { font-size: 23px; } }
    .heading p { font-size: 14px; color: #6B7280; }

    /* Link card */
    .link-card {
      background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
      border-radius: 16px; padding: 18px 20px; margin-bottom: 20px;
    }
    .link-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #3B82F6; margin-bottom: 6px; }
    .link-url { font-size: 13px; color: #9CA3AF; margin-bottom: 14px; word-break: break-all; }
    .link-btns { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-link { flex: 1; min-width: 80px; border: none; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; -webkit-tap-highlight-color: transparent; }
    .btn-link:hover { opacity: 0.85; }

    /* Card se��es */
    .section-card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09); border-radius: 18px;
      padding: 22px 18px; margin-bottom: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @media (min-width: 480px) { .section-card { padding: 26px 24px; } }
    .section-titulo {
      font-size: 14px; font-weight: 700; color: #F1F5F9;
      margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
    }
    .section-sub { font-size: 12px; color: #6B7280; margin-bottom: 20px; line-height: 1.5; }
    .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0 20px; }

    /* Fields */
    .fields { display: flex; flex-direction: column; gap: 16px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 380px) { .row-2 { grid-template-columns: 1fr; } }

    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px;
    }
    .input, .select, .textarea {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 12px 16px; color: #F1F5F9; font-size: 15px; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit; -webkit-appearance: none;
    }
    .input:focus, .select:focus, .textarea:focus {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder, .textarea::placeholder { color: #374151; }
    .select { cursor: pointer; }
    .select option { background: #0F1117; color: #F1F5F9; }
    .textarea { resize: none; }
    .field-hint { font-size: 11px; color: #374151; margin-top: 5px; }
    .char-count { font-size: 11px; color: #374151; text-align: right; margin-top: 4px; }

    /* Slug wrapper */
    .slug-wrap {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 12px 16px;
      transition: border-color 0.15s;
    }
    .slug-wrap:focus-within {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .slug-prefix { font-size: 11px; color: #4B5563; white-space: nowrap; margin-right: 4px; }
    .slug-input {
      background: transparent; border: none; outline: none;
      color: #F1F5F9; font-size: 13px; flex: 1; font-family: inherit;
    }

    /* Dias semana chips */
    .dias-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .dia-chip {
      padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid; transition: all 0.15s;
      font-family: inherit; -webkit-tap-highlight-color: transparent;
    }
    .dia-chip.on  { background: #3B82F6; color: #fff; border-color: #3B82F6; }
    .dia-chip.off { background: rgba(255,255,255,0.04); color: #6B7280; border-color: rgba(255,255,255,0.08); }

    /* Hor�rios por dia */
    .dia-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .dia-row:last-child { border-bottom: none; }
    .dia-toggle {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-width: 140px;
    }
    .toggle-btn {
      width: 36px; height: 20px; border-radius: 999px; border: none; cursor: pointer;
      position: relative; transition: background 0.2s; flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .toggle-btn::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%; background: #fff;
      transition: transform 0.2s;
    }
    .toggle-btn.on  { background: #3B82F6; }
    .toggle-btn.on::after { transform: translateX(16px); }
    .toggle-btn.off { background: rgba(255,255,255,0.15); }
    .dia-nome { font-size: 13px; font-weight: 600; color: #D1D5DB; min-width: 90px; }
    .dia-fechado { font-size: 12px; color: #374151; }
    .dia-horarios { display: flex; align-items: center; gap: 8px; flex: 1; }
    .dia-horario-input {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 7px 10px; color: #F1F5F9;
      font-size: 13px; outline: none; width: 90px;
      transition: border-color 0.15s; font-family: inherit;
    }
    .dia-horario-input:focus { border-color: rgba(59,130,246,0.5); }
    .dia-horario-input:disabled { opacity: 0.3; cursor: not-allowed; }
    .dia-sep { font-size: 12px; color: #374151; }

    /* Banner */
    .banner-drop {
      border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px;
      padding: 32px 24px; text-align: center; cursor: pointer;
      background: rgba(255,255,255,0.02); transition: border-color 0.15s;
    }
    .banner-drop:hover { border-color: rgba(59,130,246,0.3); }

    /* Mensagem */
    .msg-ok  { font-size: 13px; color: #22C55E; padding: 10px 14px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; text-align: center; }
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; text-align: center; }

    /* Bot�o salvar */
    .btn-salvar {
      width: 100%; background: #3B82F6; color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: background 0.15s, opacity 0.15s; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-salvar:hover { background: #2563EB; }
    .btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }
  `;return(0,a.jsxs)("div",{className:"pg",children:[(0,a.jsx)("style",{children:ea}),(0,a.jsxs)("nav",{className:"nav",children:[(0,a.jsx)("span",{className:"nav-logo",children:"ClienteMarcado"}),(0,a.jsx)(o.default,{href:"/painel",className:"nav-back",children:"? Voltar ao painel"})]}),(0,a.jsxs)("div",{className:"body",children:[(0,a.jsxs)("div",{className:"heading",children:[(0,a.jsx)("h1",{children:"Perfil do neg�cio"}),(0,a.jsx)("p",{children:"Configure como seu neg�cio aparece para os clientes."})]}),q&&(0,a.jsxs)("div",{className:"link-card",children:[(0,a.jsx)("p",{className:"link-label",children:"Seu link de agendamento"}),(0,a.jsxs)("p",{className:"link-url",children:["https://clientemarcado.vercel.app/",c]}),(0,a.jsxs)("div",{className:"link-btns",children:[(0,a.jsx)("button",{className:"btn-link",onClick:function(){navigator.clipboard.writeText("https://clientemarcado.vercel.app/"+c),Q(!0),setTimeout(()=>Q(!1),2e3)},style:{background:"#3B82F6",color:"#fff"},children:K?"? Copiado!":"Copiar link"}),(0,a.jsx)("button",{className:"btn-link",onClick:function(){let e="https://clientemarcado.vercel.app/"+c;window.open("https://wa.me/?text="+encodeURIComponent("Agende seu hor�rio pelo link: "+e),"_blank")},style:{background:"#16A34A",color:"#fff"},children:"WhatsApp"}),(0,a.jsx)("a",{href:"/"+c,target:"_blank",style:{flex:1,minWidth:"80px",textAlign:"center",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"9px 12px",fontSize:"13px",fontWeight:"600",color:"#9CA3AF",textDecoration:"none",display:"inline-block"},children:"Ver p�gina"})]})]}),(0,a.jsxs)("div",{className:"section-card",children:[(0,a.jsx)("p",{className:"section-titulo",children:"?? Informa��es do neg�cio"}),(0,a.jsx)("p",{className:"section-sub",children:"Dados principais que identificam seu neg�cio."}),(0,a.jsxs)("div",{className:"fields",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Nome do neg�cio *"}),(0,a.jsx)("input",{type:"text",placeholder:"Ex: Barbearia do Jo�o, Cl�nica Sa�de & Bem-Estar",value:e,onChange:e=>{l(e.target.value),q||d(X(e.target.value))},className:"input"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Link personalizado *"}),(0,a.jsxs)("div",{className:"slug-wrap",children:[(0,a.jsx)("span",{className:"slug-prefix",children:"clientemarcado.vercel.app/"}),(0,a.jsx)("input",{type:"text",placeholder:"meu-negocio",value:c,onChange:e=>d(X(e.target.value)),className:"slug-input"})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Endere�o (opcional)"}),(0,a.jsx)("input",{type:"text",placeholder:"Ex: Rua das Flores, 123 - S�o Paulo",value:h,onChange:e=>g(e.target.value),className:"input"})]})]})]}),(0,a.jsxs)("div",{className:"section-card",children:[(0,a.jsx)("p",{className:"section-titulo",children:"?? Dados p�blicos do neg�cio"}),(0,a.jsx)("p",{className:"section-sub",children:"Informa��es que aparecem na sua p�gina de agendamento."}),(0,a.jsxs)("div",{className:"fields",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"WhatsApp do neg�cio"}),(0,a.jsx)("input",{type:"tel",placeholder:"Ex: (11) 99999-9999",value:p,onChange:e=>u(s(e.target.value)),className:"input"}),(0,a.jsx)("p",{className:"field-hint",children:"Esse n�mero ser� usado no bot�o de WhatsApp da sua p�gina p�blica."})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Instagram"}),(0,a.jsx)("input",{type:"text",placeholder:"Ex: @seunegocio",value:_,onChange:e=>F(e.target.value),className:"input"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Cidade / Estado"}),(0,a.jsx)("input",{type:"text",placeholder:"Ex: S�o Paulo - SP",value:z,onChange:e=>B(e.target.value),className:"input"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Descri��o curta do neg�cio"}),(0,a.jsx)("textarea",{rows:3,placeholder:"Ex: Atendimento com hor�rio marcado, ambiente confort�vel e profissionais especializados.",value:E,onChange:e=>{e.target.value.length<=180&&P(e.target.value)},className:"textarea"}),(0,a.jsxs)("p",{className:"char-count",children:[E.length,"/180"]})]})]})]}),(0,a.jsxs)("div",{className:"section-card",children:[(0,a.jsx)("p",{className:"section-titulo",children:"?? Funcionamento do neg�cio"}),(0,a.jsx)("p",{className:"section-sub",children:"Defina os dias e hor�rios em que seus clientes podem agendar."}),(0,a.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,a.jsx)("label",{className:"label",children:"Dias ativos (sele��o r�pida)"}),(0,a.jsx)("div",{className:"dias-chips",children:["Dom","Seg","Ter","Qua","Qui","Sex","S�b"].map((e,t)=>(0,a.jsx)("button",{className:`dia-chip ${N.includes(t)?"on":"off"}`,onClick:()=>{w(e=>e.includes(t)?e.filter(e=>e!==t):[...e,t].sort())},children:e},t))})]}),(0,a.jsx)("div",{className:"divider"}),(0,a.jsx)("label",{className:"label",style:{marginBottom:"12px",display:"block"},children:"Hor�rios por dia"}),n.map(e=>{let t=A[e.key]||{ativo:!1,abertura:"",fechamento:""};return(0,a.jsxs)("div",{className:"dia-row",children:[(0,a.jsxs)("div",{className:"dia-toggle",children:[(0,a.jsx)("button",{className:`toggle-btn ${t.ativo?"on":"off"}`,onClick:()=>Z(e.key,"ativo",!t.ativo)}),(0,a.jsx)("span",{className:"dia-nome",children:e.label})]}),t.ativo?(0,a.jsxs)("div",{className:"dia-horarios",children:[(0,a.jsx)("input",{type:"time",value:t.abertura,onChange:a=>Z(e.key,"abertura",a.target.value),className:"dia-horario-input"}),(0,a.jsx)("span",{className:"dia-sep",children:"at�"}),(0,a.jsx)("input",{type:"time",value:t.fechamento,onChange:a=>Z(e.key,"fechamento",a.target.value),className:"dia-horario-input"})]}):(0,a.jsx)("span",{className:"dia-fechado",children:"Fechado"})]},e.key)})]}),(0,a.jsxs)("div",{className:"section-card",children:[(0,a.jsx)("p",{className:"section-titulo",children:"?? Configura��es da agenda"}),(0,a.jsx)("p",{className:"section-sub",children:"Controle como o agendamento p�blico funciona."}),(0,a.jsxs)("div",{className:"fields",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Intervalo entre hor�rios"}),(0,a.jsxs)("select",{value:m,onChange:e=>b(Number(e.target.value)),className:"select",children:[(0,a.jsx)("option",{value:10,children:"10 minutos"}),(0,a.jsx)("option",{value:15,children:"15 minutos"}),(0,a.jsx)("option",{value:20,children:"20 minutos"}),(0,a.jsx)("option",{value:30,children:"30 minutos"}),(0,a.jsx)("option",{value:45,children:"45 minutos"}),(0,a.jsx)("option",{value:60,children:"60 minutos"})]})]}),(0,a.jsxs)("div",{className:"row-2",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Abertura geral"}),(0,a.jsx)("input",{type:"time",value:v,onChange:e=>j(e.target.value),className:"input"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Fechamento geral"}),(0,a.jsx)("input",{type:"time",value:y,onChange:e=>k(e.target.value),className:"input"})]})]}),(0,a.jsx)("p",{className:"field-hint",children:"Esses hor�rios s�o usados como padr�o quando um dia n�o tiver hor�rio espec�fico configurado acima."}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"label",children:"Anteced�ncia m�nima para agendamento"}),(0,a.jsxs)("select",{value:S,onChange:e=>C(Number(e.target.value)),className:"select",children:[(0,a.jsx)("option",{value:0,children:"Sem restri��o"}),(0,a.jsx)("option",{value:30,children:"30 minutos antes"}),(0,a.jsx)("option",{value:60,children:"1 hora antes"}),(0,a.jsx)("option",{value:120,children:"2 horas antes"}),(0,a.jsx)("option",{value:240,children:"4 horas antes"}),(0,a.jsx)("option",{value:720,children:"12 horas antes"}),(0,a.jsx)("option",{value:1440,children:"24 horas antes"})]}),(0,a.jsx)("p",{className:"field-hint",children:"Clientes n�o poder�o agendar dentro desse prazo."})]})]})]}),(0,a.jsxs)("div",{className:"section-card",children:[(0,a.jsx)("p",{className:"section-titulo",children:"??? Imagem de capa"}),(0,a.jsx)("p",{className:"section-sub",children:"Aparece no topo da sua p�gina de agendamento. Use uma imagem horizontal (16:9)."}),(0,a.jsx)("input",{ref:H,type:"file",accept:"image/jpeg,image/png,image/webp",style:{display:"none"},onChange:e=>{e.target.files?.[0]&&Y(e.target.files[0])}}),f?(0,a.jsxs)("div",{style:{borderRadius:"14px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",position:"relative"},children:[(0,a.jsx)("img",{src:f,alt:"Banner",style:{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}),(0,a.jsxs)("div",{style:{position:"absolute",top:"10px",right:"10px",display:"flex",gap:"8px"},children:[(0,a.jsx)("button",{onClick:()=>H.current?.click(),style:{background:"rgba(0,0,0,0.7)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",cursor:"pointer"},children:"Trocar"}),(0,a.jsx)("button",{onClick:()=>x(""),style:{background:"rgba(239,68,68,0.8)",color:"#fff",border:"none",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",cursor:"pointer"},children:"Remover"})]})]}):(0,a.jsxs)("div",{className:"banner-drop",onClick:()=>H.current?.click(),children:[(0,a.jsx)("div",{style:{fontSize:"28px",marginBottom:"10px"},children:"???"}),(0,a.jsx)("p",{style:{fontWeight:"600",fontSize:"13px",color:"#D1D5DB",marginBottom:"4px"},children:O?"Enviando...":"Clique para enviar uma imagem"}),(0,a.jsx)("p",{style:{fontSize:"11px",color:"#4B5563"},children:"16:9 � JPG, PNG ou WEBP � M�x. 5 MB"})]}),I&&(0,a.jsx)("p",{style:{fontSize:"12px",color:"#EF4444",marginTop:"8px"},children:I})]}),$&&(0,a.jsx)("div",{className:$.includes("Erro")||$.includes("obrigat�rio")||$.includes("inv�lido")||$.includes("uso")?"msg-err":"msg-ok",style:{marginBottom:"14px"},children:$}),(0,a.jsx)("button",{className:"btn-salvar",onClick:ee,disabled:R||O,children:R?"Salvando...":"Salvar perfil"})]})]})}])}]);