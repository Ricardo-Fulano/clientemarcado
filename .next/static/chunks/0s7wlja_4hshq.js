(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95057,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});var a={formatUrl:function(){return n},formatWithValidation:function(){return c},urlObjectKeys:function(){return l}};for(var o in a)Object.defineProperty(t,o,{enumerable:!0,get:a[o]});let i=e.r(90809)._(e.r(98183)),s=/https?|ftp|gopher|file/;function n(e){let{auth:r,hostname:t}=e,a=e.protocol||"",o=e.pathname||"",n=e.hash||"",l=e.query||"",c=!1;r=r?encodeURIComponent(r).replace(/%3A/i,":")+"@":"",e.host?c=r+e.host:t&&(c=r+(~t.indexOf(":")?`[${t}]`:t),e.port&&(c+=":"+e.port)),l&&"object"==typeof l&&(l=String(i.urlQueryToSearchParams(l)));let d=e.search||l&&`?${l}`||"";return a&&!a.endsWith(":")&&(a+=":"),e.slashes||(!a||s.test(a))&&!1!==c?(c="//"+(c||""),o&&"/"!==o[0]&&(o="/"+o)):c||(c=""),n&&"#"!==n[0]&&(n="#"+n),d&&"?"!==d[0]&&(d="?"+d),o=o.replace(/[?#]/g,encodeURIComponent),d=d.replace("#","%23"),`${a}${c}${o}${d}${n}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function c(e){return n(e)}},18581,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"useMergedRef",{enumerable:!0,get:function(){return o}});let a=e.r(71645);function o(e,r){let t=(0,a.useRef)(null),o=(0,a.useRef)(null);return(0,a.useCallback)(a=>{if(null===a){let e=t.current;e&&(t.current=null,e());let r=o.current;r&&(o.current=null,r())}else e&&(t.current=i(e,a)),r&&(o.current=i(r,a))},[e,r])}function i(e,r){if("function"!=typeof e)return e.current=r,()=>{e.current=null};{let t=e(r);return"function"==typeof t?t:()=>e(null)}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),r.exports=t.default)},73668,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"isLocalURL",{enumerable:!0,get:function(){return i}});let a=e.r(18967),o=e.r(52817);function i(e){if(!(0,a.isAbsoluteUrl)(e))return!0;try{let r=(0,a.getLocationOrigin)(),t=new URL(e,r);return t.origin===r&&(0,o.hasBasePath)(t.pathname)}catch(e){return!1}}},84508,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"errorOnce",{enumerable:!0,get:function(){return a}});let a=e=>{}},22016,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});var a={default:function(){return h},useLinkStatus:function(){return v}};for(var o in a)Object.defineProperty(t,o,{enumerable:!0,get:a[o]});let i=e.r(90809),s=e.r(43476),n=i._(e.r(71645)),l=e.r(95057),c=e.r(8372),d=e.r(18581),p=e.r(18967),u=e.r(5550);e.r(33525);let m=e.r(88540),g=e.r(91949),x=e.r(73668),f=e.r(9396);function h(r){var t,a;let o,i,h,[v,y]=(0,n.useOptimistic)(g.IDLE_LINK_STATUS),j=(0,n.useRef)(null),{href:w,as:N,children:k,prefetch:F=null,passHref:S,replace:C,shallow:_,scroll:B,onClick:z,onMouseEnter:A,onTouchStart:D,legacyBehavior:E=!1,onNavigate:M,transitionTypes:R,ref:T,unstable_dynamicOnHover:I,...P}=r;o=k,E&&("string"==typeof o||"number"==typeof o)&&(o=(0,s.jsx)("a",{children:o}));let O=n.default.useContext(c.AppRouterContext),U=!1!==F,L=!1!==F?null===(a=F)||"auto"===a?f.FetchStrategy.PPR:f.FetchStrategy.Full:f.FetchStrategy.PPR,$="string"==typeof(t=N||w)?t:(0,l.formatUrl)(t);if(E){if(o?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});i=n.default.Children.only(o)}let V=E?i&&"object"==typeof i&&i.ref:T,q=n.default.useCallback(e=>(null!==O&&(j.current=(0,g.mountLinkInstance)(e,$,O,L,U,y)),()=>{j.current&&((0,g.unmountLinkForCurrentNavigation)(j.current),j.current=null),(0,g.unmountPrefetchableInstance)(e)}),[U,$,O,L,y]),W={ref:(0,d.useMergedRef)(q,V),onClick(r){E||"function"!=typeof z||z(r),E&&i.props&&"function"==typeof i.props.onClick&&i.props.onClick(r),!O||r.defaultPrevented||function(r,t,a,o,i,s,l){if("u">typeof window){let c,{nodeName:d}=r.currentTarget;if("A"===d.toUpperCase()&&((c=r.currentTarget.getAttribute("target"))&&"_self"!==c||r.metaKey||r.ctrlKey||r.shiftKey||r.altKey||r.nativeEvent&&2===r.nativeEvent.which)||r.currentTarget.hasAttribute("download"))return;if(!(0,x.isLocalURL)(t)){o&&(r.preventDefault(),location.replace(t));return}if(r.preventDefault(),s){let e=!1;if(s({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:p}=e.r(99781);n.default.startTransition(()=>{p(t,o?"replace":"push",!1===i?m.ScrollBehavior.NoScroll:m.ScrollBehavior.Default,a.current,l)})}}(r,$,j,C,B,M,R)},onMouseEnter(e){E||"function"!=typeof A||A(e),E&&i.props&&"function"==typeof i.props.onMouseEnter&&i.props.onMouseEnter(e),O&&U&&(0,g.onNavigationIntent)(e.currentTarget,!0===I)},onTouchStart:function(e){E||"function"!=typeof D||D(e),E&&i.props&&"function"==typeof i.props.onTouchStart&&i.props.onTouchStart(e),O&&U&&(0,g.onNavigationIntent)(e.currentTarget,!0===I)}};return(0,p.isAbsoluteUrl)($)?W.href=$:E&&!S&&("a"!==i.type||"href"in i.props)||(W.href=(0,u.addBasePath)($)),h=E?n.default.cloneElement(i,W):(0,s.jsx)("a",{...P,...W,children:o}),(0,s.jsx)(b.Provider,{value:v,children:h})}e.r(84508);let b=(0,n.createContext)(g.IDLE_LINK_STATUS),v=()=>(0,n.useContext)(b);("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),r.exports=t.default)},96661,e=>{"use strict";e.s(["mergeClasses",0,(...e)=>e.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim()])},71987,88973,e=>{"use strict";e.s(["default",0,{xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}],71987),e.s(["hasA11yProp",0,e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0;return!1}],88973)},5014,e=>{"use strict";var r=e.i(71645),t=e.i(71987),a=e.i(88973),o=e.i(96661);let i=(0,r.createContext)({}),s=(0,r.forwardRef)(({color:e,size:s,strokeWidth:n,absoluteStrokeWidth:l,className:c="",children:d,iconNode:p,...u},m)=>{let{size:g=24,strokeWidth:x=2,absoluteStrokeWidth:f=!1,color:h="currentColor",className:b=""}=(0,r.useContext)(i)??{},v=l??f?24*Number(n??x)/Number(s??g):n??x;return(0,r.createElement)("svg",{ref:m,...t.default,width:s??g??t.default.width,height:s??g??t.default.height,stroke:e??h,strokeWidth:v,className:(0,o.mergeClasses)("lucide",b,c),...!d&&!(0,a.hasA11yProp)(u)&&{"aria-hidden":"true"},...u},[...p.map(([e,t])=>(0,r.createElement)(e,t)),...Array.isArray(d)?d:[d]])});e.s(["default",0,s],5014)},56420,e=>{"use strict";var r=e.i(71645),t=e.i(96661);let a=e=>{let r=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase());return r.charAt(0).toUpperCase()+r.slice(1)};var o=e.i(5014);e.s(["default",0,(e,i)=>{let s=(0,r.forwardRef)(({className:s,...n},l)=>(0,r.createElement)(o.default,{ref:l,iconNode:i,className:(0,t.mergeClasses)(`lucide-${a(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,s),...n}));return s.displayName=a(e),s}],56420)},18566,(e,r,t)=>{r.exports=e.r(76562)},66936,e=>{"use strict";var r=e.i(43476),t=e.i(71645),a=e.i(76277),o=e.i(18566),i=e.i(22016),s=e.i(56420);let n=(0,s.default)("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]),l=(0,s.default)("clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]),c=(0,s.default)("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]);e.s(["default",0,function(){let e=(0,o.useParams)(),s=(0,o.useSearchParams)(),d=e.slug,[p,u]=(0,t.useState)(null),[m,g]=(0,t.useState)([]),[x,f]=(0,t.useState)([]),[h,b]=(0,t.useState)(1),[v,y]=(0,t.useState)(""),[j,w]=(0,t.useState)(""),[N,k]=(0,t.useState)(""),[F,S]=(0,t.useState)(""),[C,_]=(0,t.useState)(""),[B,z]=(0,t.useState)(""),[A,D]=(0,t.useState)(!1),[E,M]=(0,t.useState)(""),[R,T]=(0,t.useState)(!1),[I,P]=(0,t.useState)(new Date),[O,U]=(0,t.useState)([]),[L,$]=(0,t.useState)(!1);async function V(){$(!0),S("");let e=m.find(e=>e.id===v),r=e?.duracao_minutos||30,t=p?.intervalo_agenda||30,o=p?.hora_abertura||"08:00",i=p?.hora_fechamento||"18:00",{data:s}=await a.supabase.from("bloqueios").select("*").eq("user_id",p.user_id).eq("data",N),n=(s||[]).filter(e=>!e.profissional_id||e.profissional_id===j),{data:l}=await a.supabase.from("agendamentos").select("data_hora, servico_id").eq("profissional_id",j).gte("data_hora",N+"T00:00:00").lte("data_hora",N+"T23:59:59").neq("status","cancelado"),[c,d]=o.split(":").map(Number),[u,g]=i.split(":").map(Number),x=60*c+d,f=60*u+g,h=[];for(let e of l||[]){let r=new Date(e.data_hora),t=60*r.getHours()+r.getMinutes(),a=m.find(r=>r.id===e.servico_id)?.duracao_minutos||30;h.push({inicio:t,fim:t+a})}let b=[];for(let e=x;e+r<=f;e+=t)if(!h.some(t=>e<t.fim&&e+r>t.inicio)){let r=Math.floor(e/60).toString().padStart(2,"0"),t=(e%60).toString().padStart(2,"0");b.push(r+":"+t)}let y=new Date,w=p?.antecedencia_minima||0;U(b.filter(e=>{if((new Date(N+"T"+e+":00").getTime()-y.getTime())/6e4<w)return!1;let[t,a]=e.split(":").map(Number),o=60*t+a;return!n.some(e=>{let[t,a]=e.hora_inicio.split(":").map(Number),[i,s]=e.hora_fim.split(":").map(Number);return o<60*i+s&&o+r>60*t+a})})),$(!1)}async function q(){if(M(""),!C)return void M("Informe seu nome.");if(!B||B.replace(/\D/g,"").length<10)return void M("Informe seu WhatsApp com DDD.");T(!0);let{error:e}=await a.supabase.from("agendamentos").insert({user_id:p.user_id,servico_id:v,profissional_id:j,data_hora:N+"T"+F+":00",cliente_nome:C,cliente_telefone:B});T(!1),e?M("Erro ao agendar. Tente novamente."):D(!0)}(0,t.useEffect)(()=>{!async function(){let{data:e}=await a.supabase.from("perfis").select("*").eq("slug",d).single();u(e);let{data:r}=await a.supabase.from("servicos").select("*").eq("user_id",e.user_id);g(r||[]);let{data:t}=await a.supabase.from("profissionais").select("*").eq("user_id",e.user_id);f(t||[]);let o=s.get("servico");o&&r&&r.find(e=>e.id===o)&&(y(o),b(2))}()},[d]),(0,t.useEffect)(()=>{N&&j&&v&&V()},[N,j,v]);let W=m.find(e=>e.id===v),K=x.find(e=>e.id===j),H=new Date().toISOString().split("T")[0],Y=p?.whatsapp?"https://wa.me/55"+p.whatsapp.replace(/\D/g,"")+"?text="+encodeURIComponent("Olá! Acabei de agendar um horário pelo link e gostaria de confirmar."):null,Q=new Date;Q.setHours(0,0,0,0);let Z=new Date(I.getFullYear(),I.getMonth()+1,0).getDate(),G=new Date(I.getFullYear(),I.getMonth(),1).getDay(),X=p?.dias_funcionamento||[1,2,3,4,5,6];function J(e){let[r,t,a]=e.split("-");return a+"/"+t+"/"+r}let ee=O.filter(e=>12>parseInt(e)),er=O.filter(e=>parseInt(e)>=12&&18>parseInt(e)),et=O.filter(e=>parseInt(e)>=18),ea=["Serviço","Profissional","Data e hora","Seus dados"],eo=`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .page {
      min-height: 100vh;
      background: #08080A;
      color: #F5F5F7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* ── Header ── */
    .header {
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 13px 16px;
      display: flex;
      align-items: center;
      background: rgba(9,9,11,0.96);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-back {
      color: #6B7280;
      text-decoration: none;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 48px;
    }
    .header-title {
      flex: 1;
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      color: #F1F5F9;
    }
    .header-spacer { min-width: 48px; }

    /* ── Container ── */
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px 16px 48px;
    }
    @media (min-width: 720px) {
      .container { max-width: 820px; padding: 28px 24px 64px; }
    }
    .container-wide {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px 16px 48px;
    }
    @media (min-width: 720px) {
      .container-wide { max-width: 1000px; padding: 28px 24px 64px; }
    }

    /* ── Steps ── */
    .steps-wrap { margin-bottom: 24px; }
    @media (min-width: 720px) { .steps-wrap { margin-bottom: 32px; } }
    .steps-track {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .step-dot.done   { background: #3B82F6; color: #fff; border: none; }
    .step-dot.active { background: #3B82F6; color: #fff; border: none; }
    .step-dot.idle   { background: rgba(255,255,255,0.05); color: #4B5563; border: 1px solid rgba(255,255,255,0.08); }
    .step-line {
      flex: 1;
      height: 1px;
      margin: 0 5px;
      transition: background 0.2s ease;
    }
    .step-labels {
      display: flex;
      justify-content: space-between;
    }
    .step-label {
      font-size: 9px;
      letter-spacing: 0.02em;
    }
    @media (min-width: 720px) {
      .step-dot { width: 30px; height: 30px; font-size: 12px; }
      .step-label { font-size: 10px; }
    }

    /* ── Section heading ── */
    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #F1F5F9;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .section-sub {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 20px;
    }
    @media (min-width: 720px) {
      .section-title { font-size: 22px; }
      .section-sub { margin-bottom: 24px; }
    }

    /* ── Card base ── */
    .card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
    }

    /* ── Servi\xe7o cards ── */
    .servico-list { display: flex; flex-direction: column; gap: 10px; }
    .servico-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      position: relative;
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .servico-card:hover, .servico-card:active {
      border-color: rgba(59,130,246,0.45);
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    }
    .servico-card.sel {
      border-color: #3B82F6;
      box-shadow: 0 0 0 1px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.12);
      background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(10,12,16,0.97) 100%);
    }
    .servico-accent {
      position: absolute; top: 0; left: 0; bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, rgba(59,130,246,0.8), transparent);
    }
    .servico-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 18px;
    }
    .servico-nome { font-weight: 700; font-size: 15px; color: #F1F5F9; margin-bottom: 3px; }
    .servico-desc { font-size: 12px; color: #9CA3AF; margin-bottom: 4px; line-height: 1.4; }
    .servico-meta { font-size: 13px; color: #6B7280; }
    .servico-preco { color: #22C55E; font-weight: 700; }
    .servico-arrow { font-size: 20px; color: #3B82F6; flex-shrink: 0; }

    /* ── Profissional cards ── */
    .prof-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    @media (min-width: 480px) {
      .prof-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 720px) {
      .prof-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    }
    .prof-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 20px 12px;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .prof-card:hover, .prof-card:active {
      border-color: rgba(59,130,246,0.45);
    }
    .prof-card.sel {
      border-color: #3B82F6;
      box-shadow: 0 0 0 1px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.12);
      background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(10,12,16,0.97) 100%);
    }
    .prof-avatar-img {
      width: 64px; height: 64px; border-radius: 999px; object-fit: cover;
    }
    .prof-avatar-letra {
      width: 64px; height: 64px; border-radius: 999px;
      background: rgba(59,130,246,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #3B82F6;
    }
    .prof-nome { font-size: 13px; font-weight: 700; color: #F1F5F9; margin-bottom: 2px; }
    .prof-cargo { font-size: 12px; color: #6B7280; }

    /* ── Resumo strip (etapa 3) ── */
    .resumo-strip {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    @media (min-width: 720px) {
      .resumo-strip {
        grid-template-columns: repeat(4, 1fr);
        padding: 16px 20px;
        margin-bottom: 18px;
      }
    }
    .resumo-item {
      padding: 6px 0;
    }
    .resumo-item:not(:last-child) {
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    @media (min-width: 720px) {
      .resumo-item { padding: 0; }
      .resumo-item:not(:last-child) {
        border-bottom: none;
        border-right: 1px solid rgba(255,255,255,0.06);
        padding-right: 16px;
        margin-right: 0;
      }
      .resumo-item:not(:first-child) { padding-left: 16px; }
    }
    .resumo-label {
      font-size: 9px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.07em;
      color: #4B5563; margin-bottom: 3px;
    }
    .resumo-valor {
      font-size: 13px; font-weight: 700;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ── Etapa3 grid ── */
    .etapa3-cols {
      display: flex; flex-direction: column; gap: 12px;
      margin-bottom: 14px;
    }
    @media (min-width: 720px) {
      .etapa3-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: start;
      }
    }

    /* ── Calend\xe1rio ── */
    .cal-wrap {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 16px;
    }
    .cal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .cal-nav {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 7px 14px;
      color: #9CA3AF;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-mes {
      font-weight: 700; font-size: 13px;
      text-transform: capitalize; color: #F1F5F9;
    }
    .cal-dow {
      display: grid; grid-template-columns: repeat(7, 1fr);
      gap: 2px; margin-bottom: 6px;
    }
    .cal-dow-label {
      text-align: center; font-size: 10px;
      font-weight: 700; color: #374151; padding: 3px 0;
    }
    .cal-days {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
    }
    .dia {
      padding: 9px 2px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: default;
      border: 1px solid transparent;
      text-align: center;
      background: transparent;
      color: #2D3748;
      transition: all 0.15s ease;
      -webkit-tap-highlight-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .dia.disp {
      color: #CBD5E0; background: rgba(255,255,255,0.04);
      cursor: pointer; font-weight: 600;
    }
    .dia.disp:hover, .dia.disp:active {
      background: rgba(59,130,246,0.14);
      color: #F1F5F9;
      border-color: rgba(59,130,246,0.2);
    }
    .dia.hoje { border-color: rgba(59,130,246,0.5); color: #3B82F6; font-weight: 700; }
    .dia.sel  {
      background: #3B82F6 !important; color: #fff !important;
      border-color: #3B82F6 !important; font-weight: 700;
      box-shadow: 0 2px 8px rgba(59,130,246,0.35);
    }

    /* ── Hor\xe1rios ── */
    .horarios-wrap {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 16px;
      min-height: 180px;
    }
    .horarios-data-label {
      font-size: 12px; font-weight: 600; color: #9CA3AF;
      margin-bottom: 12px;
      text-transform: capitalize;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .periodo-label-row {
      display: flex; align-items: center; gap: 5px; margin-bottom: 8px;
    }
    .periodo-label {
      font-size: 10px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.09em;
    }
    .horarios-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
      margin-bottom: 14px;
    }
    @media (min-width: 400px) {
      .horarios-grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (min-width: 720px) {
      .horarios-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); }
    }
    .h-btn {
      padding: 11px 4px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.08);
      text-align: center;
      background: linear-gradient(180deg, rgba(22,28,40,0.98) 0%, rgba(12,15,22,0.98) 100%);
      color: #D1D5DB;
      transition: all 0.15s ease;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    .h-btn:hover, .h-btn:active {
      border-color: rgba(59,130,246,0.5);
      color: #F1F5F9;
      background: rgba(59,130,246,0.07);
    }
    .h-btn.sel {
      background: #3B82F6; border-color: #3B82F6;
      color: #fff; box-shadow: 0 0 0 2px rgba(59,130,246,0.25);
    }
    .horarios-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 140px; gap: 8px;
    }
    .horarios-placeholder {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 160px; gap: 10px;
    }

    /* ── Nav buttons ── */
    .nav-row { display: flex; gap: 10px; }
    .btn-voltar {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 14px;
      font-size: 14px; font-weight: 600;
      color: #6B7280; cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-voltar:hover { background: rgba(255,255,255,0.07); color: #9CA3AF; }
    .btn-continuar {
      flex: 2;
      border: none; border-radius: 12px;
      padding: 14px;
      font-size: 15px; font-weight: 700;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-continuar.on  { background: #3B82F6; color: #fff; box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
    .btn-continuar.off { background: rgba(59,130,246,0.12); color: #374151; cursor: not-allowed; }
    .btn-confirmar {
      flex: 2; background: #3B82F6; border: none;
      border-radius: 12px; padding: 14px;
      font-size: 15px; font-weight: 700; color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-link-voltar {
      font-size: 13px; color: #6B7280; background: none; border: none;
      cursor: pointer; padding: 4px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* ── Inputs ── */
    .input-field {
      width: 100%;
      background: rgba(18,22,30,0.97);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 14px 16px;
      color: #F1F5F9;
      font-size: 16px; /* 16px prevents iOS zoom */
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .input-field:focus {
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input-field::placeholder { color: #4B5563; }
    .input-label {
      font-size: 11px; font-weight: 600; color: #9CA3AF;
      text-transform: uppercase; letter-spacing: 0.08em;
      display: block; margin-bottom: 8px;
    }

    /* ── Resumo card (etapa 4) ── */
    .resumo-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; padding: 18px 20px; margin-bottom: 22px;
    }
    .resumo-card-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #4B5563; margin-bottom: 14px;
    }
    .resumo-row {
      display: flex; justify-content: space-between; align-items: center;
    }
    .resumo-row-label { font-size: 13px; color: #6B7280; }
    .resumo-row-valor { font-size: 13px; font-weight: 700; }
    .resumo-divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 10px 0; }

    /* ── Sucesso ── */
    .sucesso-wrap {
      min-height: 100vh; background: #08080A;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .sucesso-inner { max-width: 440px; width: 100%; text-align: center; }
    .sucesso-icon {
      width: 68px; height: 68px; border-radius: 50%;
      background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 22px; font-size: 30px;
    }
    .sucesso-title { font-size: 22px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 8px; }
    .sucesso-sub { font-size: 14px; color: #6B7280; margin-bottom: 26px; line-height: 1.6; }
    .sucesso-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-wpp {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: #25D366; color: #fff; font-weight: 700;
      padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px;
    }
    .btn-ics {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: rgba(255,255,255,0.05); color: #F1F5F9; font-weight: 600;
      padding: 14px 28px; border-radius: 12px; font-size: 14px;
      border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .btn-inicio {
      display: inline-block; text-align: center;
      background: #3B82F6; color: #fff; font-weight: 700;
      padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px;
    }

    .erro-msg { font-size: 13px; color: #EF4444; margin-top: 10px; }
  `;if(A)return(0,r.jsxs)("div",{className:"sucesso-wrap",children:[(0,r.jsx)("style",{children:eo}),(0,r.jsxs)("div",{className:"sucesso-inner",children:[(0,r.jsx)("div",{className:"sucesso-icon",children:"✅"}),(0,r.jsx)("h1",{className:"sucesso-title",children:"Agendamento confirmado!"}),(0,r.jsxs)("p",{className:"sucesso-sub",children:["Obrigado, ",(0,r.jsx)("strong",{style:{color:"#F1F5F9"},children:C}),"! Seu agendamento foi recebido."]}),(0,r.jsxs)("div",{className:"resumo-card",children:[(0,r.jsx)("p",{className:"resumo-card-title",children:"Resumo"}),[{label:"Serviço",valor:W?.nome,cor:"#F1F5F9"},{label:"Profissional",valor:K?.nome,cor:"#F1F5F9"},{label:"Data",valor:J(N),cor:"#F1F5F9"},{label:"Horário",valor:F,cor:"#3B82F6"},{label:"Valor",valor:"R$ "+W?.preco,cor:"#22C55E"}].map((e,t,a)=>(0,r.jsxs)("div",{children:[(0,r.jsxs)("div",{className:"resumo-row",children:[(0,r.jsx)("span",{className:"resumo-row-label",children:e.label}),(0,r.jsx)("span",{className:"resumo-row-valor",style:{color:e.cor},children:e.valor})]}),t<a.length-1&&(0,r.jsx)("hr",{className:"resumo-divider"})]},e.label))]}),(0,r.jsxs)("div",{className:"sucesso-actions",children:[Y&&(0,r.jsxs)("a",{href:Y,target:"_blank",rel:"noopener noreferrer",className:"btn-wpp",children:[(0,r.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:(0,r.jsx)("path",{d:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"})}),"Falar com o estabelecimento"]}),(0,r.jsx)("button",{onClick:function(){let e=new Date(N+"T"+F+":00"),r=new Date(e.getTime()+6e4*(W?.duracao_minutos||30)),t=e=>e.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z",a=new Blob([["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT","DTSTART:"+t(e),"DTEND:"+t(r),"SUMMARY:"+(W?.nome||"")+" - "+(p?.nome_negocio||""),"DESCRIPTION:Profissional: "+(K?.nome||""),"END:VEVENT","END:VCALENDAR"].join("\r\n")],{type:"text/calendar"}),o=URL.createObjectURL(a),i=document.createElement("a");i.href=o,i.download="agendamento.ics",i.click(),URL.revokeObjectURL(o)},className:"btn-ics",children:"📅 Adicionar à agenda do celular"}),(0,r.jsx)(i.default,{href:"/"+d,className:"btn-inicio",children:"Voltar ao início"})]})]})]});let ei=()=>(0,r.jsxs)("div",{className:"steps-wrap",children:[(0,r.jsx)("div",{className:"steps-track",children:[1,2,3,4].map(e=>(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",flex:e<4?1:"none"},children:[(0,r.jsx)("div",{className:`step-dot ${h>e?"done":h===e?"active":"idle"}`,children:h>e?"✓":e}),e<4&&(0,r.jsx)("div",{className:"step-line",style:{background:h>e?"#3B82F6":"rgba(255,255,255,0.07)"}})]},e))}),(0,r.jsx)("div",{className:"step-labels",children:ea.map((e,t)=>(0,r.jsx)("span",{className:"step-label",style:{fontWeight:h===t+1?700:500,color:h===t+1?"#3B82F6":"#4B5563",flex:t<3?1:"none",textAlign:0===t?"left":3===t?"right":"center"},children:e},e))})]});return(0,r.jsxs)("main",{className:"page",children:[(0,r.jsx)("style",{children:eo}),(0,r.jsxs)("div",{className:"header",children:[(0,r.jsx)(i.default,{href:"/"+d,className:"header-back",children:"← Voltar"}),(0,r.jsx)("p",{className:"header-title",children:p?.nome_negocio}),(0,r.jsx)("div",{className:"header-spacer"})]}),1===h&&(0,r.jsxs)("div",{className:"container",children:[(0,r.jsx)(ei,{}),(0,r.jsx)("h2",{className:"section-title",children:"Escolha o serviço"}),(0,r.jsx)("p",{className:"section-sub",children:"Selecione o serviço desejado"}),(0,r.jsx)("div",{className:"servico-list",children:m.map(e=>(0,r.jsxs)("button",{onClick:()=>{y(e.id),b(2)},className:"servico-card"+(v===e.id?" sel":""),children:[(0,r.jsx)("div",{className:"servico-accent"}),(0,r.jsx)("div",{className:"servico-icon",children:"✂️"}),(0,r.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,r.jsx)("p",{className:"servico-nome",children:e.nome}),e.descricao?(0,r.jsx)("p",{className:"servico-desc",children:e.descricao}):(0,r.jsx)("p",{className:"servico-desc",style:{color:"#4B5563"},children:"Atendimento com horário marcado"}),(0,r.jsxs)("p",{className:"servico-meta",children:[e.duracao_minutos?e.duracao_minutos+" min":"",e.duracao_minutos&&e.preco?" · ":"",e.preco?(0,r.jsxs)("span",{className:"servico-preco",children:["R$ ",e.preco]}):null]})]}),(0,r.jsx)("span",{className:"servico-arrow",children:"›"})]},e.id))})]}),2===h&&(0,r.jsxs)("div",{className:"container",children:[(0,r.jsx)(ei,{}),(0,r.jsx)("h2",{className:"section-title",children:"Escolha o profissional"}),(0,r.jsx)("p",{className:"section-sub",children:"Com quem deseja ser atendido?"}),(0,r.jsx)("div",{className:"prof-grid",children:x.map(e=>(0,r.jsxs)("button",{onClick:()=>{w(e.id),b(3)},className:"prof-card"+(j===e.id?" sel":""),children:[e.foto_url?(0,r.jsx)("img",{src:e.foto_url,alt:e.nome,className:"prof-avatar-img",style:{border:j===e.id?"2px solid #3B82F6":"2px solid rgba(255,255,255,0.1)"}}):(0,r.jsx)("div",{className:"prof-avatar-letra",style:{border:j===e.id?"2px solid #3B82F6":"2px solid rgba(59,130,246,0.2)"},children:e.nome.charAt(0).toUpperCase()}),(0,r.jsxs)("div",{children:[(0,r.jsx)("p",{className:"prof-nome",children:e.nome}),(0,r.jsx)("p",{className:"prof-cargo",children:e.cargo||"Profissional"})]})]},e.id))}),(0,r.jsx)("button",{onClick:()=>b(1),className:"btn-link-voltar",children:"← Voltar"})]}),3===h&&(0,r.jsxs)("div",{className:"container-wide",children:[(0,r.jsx)(ei,{}),(0,r.jsx)("h2",{className:"section-title",children:"Data e horário"}),(0,r.jsx)("p",{className:"section-sub",children:"Escolha quando quer ser atendido"}),(0,r.jsx)("div",{className:"resumo-strip",children:[{label:"Serviço",valor:W?.nome,cor:"#F1F5F9"},{label:"Profissional",valor:K?.nome,cor:"#F1F5F9"},{label:"Duração",valor:(W?.duracao_minutos||30)+" min",cor:"#F1F5F9"},{label:"Valor",valor:"R$ "+W?.preco,cor:"#22C55E"}].map(e=>(0,r.jsxs)("div",{className:"resumo-item",children:[(0,r.jsx)("p",{className:"resumo-label",children:e.label}),(0,r.jsx)("p",{className:"resumo-valor",style:{color:e.cor},children:e.valor})]},e.label))}),(0,r.jsxs)("div",{className:"etapa3-cols",children:[(0,r.jsxs)("div",{className:"cal-wrap",children:[(0,r.jsxs)("div",{className:"cal-header",children:[(0,r.jsx)("button",{className:"cal-nav",onClick:()=>P(new Date(I.getFullYear(),I.getMonth()-1,1)),children:"‹"}),(0,r.jsx)("p",{className:"cal-mes",children:I.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}),(0,r.jsx)("button",{className:"cal-nav",onClick:()=>P(new Date(I.getFullYear(),I.getMonth()+1,1)),children:"›"})]}),(0,r.jsx)("div",{className:"cal-dow",children:["D","S","T","Q","Q","S","S"].map((e,t)=>(0,r.jsx)("div",{className:"cal-dow-label",children:e},t))}),(0,r.jsxs)("div",{className:"cal-days",children:[Array.from({length:G}).map((e,t)=>(0,r.jsx)("div",{},"e"+t)),Array.from({length:Z}).map((e,t)=>{let a,o=t+1,i=I.getFullYear()+"-"+String(I.getMonth()+1).padStart(2,"0")+"-"+String(o).padStart(2,"0"),s=(a=new Date(I.getFullYear(),I.getMonth(),o))>=Q&&X.includes(a.getDay()),n=N===i,l=i===H,c="dia";return n?c+=" sel":s&&l?c+=" disp hoje":s&&(c+=" disp"),(0,r.jsx)("button",{disabled:!s,onClick:()=>s&&k(i),className:c,children:o},o)})]})]}),(0,r.jsxs)("div",{className:"horarios-wrap",children:[!N&&(0,r.jsxs)("div",{className:"horarios-placeholder",children:[(0,r.jsx)("span",{style:{fontSize:"30px",opacity:.25},children:"📅"}),(0,r.jsxs)("p",{style:{fontSize:"13px",color:"#4B5563",textAlign:"center",lineHeight:1.5},children:["Selecione uma data",(0,r.jsx)("br",{}),"para ver os horários"]})]}),N&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("p",{className:"horarios-data-label",children:function(e){let[r,t,a]=e.split("-");return new Date(parseInt(r),parseInt(t)-1,parseInt(a)).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}(N)}),L&&(0,r.jsx)("div",{className:"horarios-empty",children:(0,r.jsx)("p",{style:{fontSize:"13px",color:"#6B7280"},children:"Buscando horários..."})}),!L&&0===O.length&&(0,r.jsxs)("div",{className:"horarios-empty",children:[(0,r.jsx)("span",{style:{fontSize:"26px",opacity:.3},children:"😔"}),(0,r.jsxs)("p",{style:{fontSize:"13px",color:"#6B7280",textAlign:"center"},children:["Nenhum horário disponível",(0,r.jsx)("br",{}),"nesta data."]})]}),!L&&O.length>0&&(0,r.jsx)("div",{children:[{label:"Manhã",icon:(0,r.jsx)(n,{size:11,color:"#9CA3AF"}),lista:ee},{label:"Tarde",icon:(0,r.jsx)(l,{size:11,color:"#9CA3AF"}),lista:er},{label:"Noite",icon:(0,r.jsx)(c,{size:11,color:"#9CA3AF"}),lista:et}].filter(e=>e.lista.length>0).map(e=>(0,r.jsxs)("div",{style:{marginBottom:"14px"},children:[(0,r.jsxs)("div",{className:"periodo-label-row",children:[e.icon,(0,r.jsx)("span",{className:"periodo-label",children:e.label})]}),(0,r.jsx)("div",{className:"horarios-grid",children:e.lista.map(e=>(0,r.jsx)("button",{onClick:()=>S(e),className:"h-btn"+(F===e?" sel":""),children:e},e))})]},e.label))})]})]})]}),(0,r.jsxs)("div",{className:"nav-row",children:[(0,r.jsx)("button",{onClick:()=>b(2),className:"btn-voltar",children:"← Voltar"}),(0,r.jsx)("button",{onClick:()=>{N&&F?(M(""),b(4)):M("Selecione data e horário.")},disabled:!N||!F,className:"btn-continuar "+(N&&F?"on":"off"),children:"Continuar →"})]}),E&&(0,r.jsx)("p",{className:"erro-msg",children:E})]}),4===h&&(0,r.jsxs)("div",{className:"container",children:[(0,r.jsx)(ei,{}),(0,r.jsx)("h2",{className:"section-title",children:"Seus dados"}),(0,r.jsx)("p",{className:"section-sub",children:"Para finalizar o agendamento"}),(0,r.jsxs)("div",{className:"resumo-card",children:[(0,r.jsx)("p",{className:"resumo-card-title",children:"Resumo"}),[{label:"Serviço",valor:W?.nome,cor:"#F1F5F9"},{label:"Profissional",valor:K?.nome,cor:"#F1F5F9"},{label:"Data",valor:J(N),cor:"#F1F5F9"},{label:"Horário",valor:F,cor:"#3B82F6"},{label:"Valor",valor:"R$ "+W?.preco,cor:"#22C55E"}].map((e,t,a)=>(0,r.jsxs)("div",{children:[(0,r.jsxs)("div",{className:"resumo-row",children:[(0,r.jsx)("span",{className:"resumo-row-label",children:e.label}),(0,r.jsx)("span",{className:"resumo-row-valor",style:{color:e.cor},children:e.valor})]}),t<a.length-1&&(0,r.jsx)("hr",{className:"resumo-divider"})]},e.label))]}),(0,r.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"22px"},children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"input-label",children:"Seu nome *"}),(0,r.jsx)("input",{type:"text",placeholder:"Ex: Maria Silva",value:C,onChange:e=>_(e.target.value),className:"input-field"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"input-label",children:"WhatsApp *"}),(0,r.jsx)("input",{type:"tel",placeholder:"(11) 99999-9999",value:B,onChange:e=>{let r;return z((r=e.target.value.replace(/\D/g,"").slice(0,11)).length>10?"("+r.slice(0,2)+") "+r.slice(2,7)+"-"+r.slice(7):r.length>6?"("+r.slice(0,2)+") "+r.slice(2,6)+"-"+r.slice(6):r.length>2?"("+r.slice(0,2)+") "+r.slice(2):r.length>0?"("+r:"")},className:"input-field"}),(0,r.jsx)("p",{style:{fontSize:"12px",color:"#374151",marginTop:"6px"},children:"Usado apenas para contato sobre seu agendamento."})]})]}),E&&(0,r.jsx)("p",{className:"erro-msg",style:{marginBottom:"12px"},children:E}),(0,r.jsxs)("div",{className:"nav-row",children:[(0,r.jsx)("button",{onClick:()=>b(3),className:"btn-voltar",children:"← Voltar"}),(0,r.jsx)("button",{onClick:q,disabled:R,className:"btn-confirmar",style:{opacity:R?.7:1},children:R?"Confirmando...":"Confirmar agendamento"})]})]})]})}],66936)}]);