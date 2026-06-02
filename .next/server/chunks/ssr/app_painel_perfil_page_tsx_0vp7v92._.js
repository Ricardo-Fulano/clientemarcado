module.exports=[84271,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(78530),e=a.i(38246);let f=[{key:"domingo",label:"Domingo",num:0},{key:"segunda",label:"Segunda-feira",num:1},{key:"terca",label:"Ter�a-feira",num:2},{key:"quarta",label:"Quarta-feira",num:3},{key:"quinta",label:"Quinta-feira",num:4},{key:"sexta",label:"Sexta-feira",num:5},{key:"sabado",label:"S�bado",num:6}],g={domingo:{ativo:!1,abertura:"",fechamento:""},segunda:{ativo:!0,abertura:"08:00",fechamento:"18:00"},terca:{ativo:!0,abertura:"08:00",fechamento:"18:00"},quarta:{ativo:!0,abertura:"08:00",fechamento:"18:00"},quinta:{ativo:!0,abertura:"08:00",fechamento:"18:00"},sexta:{ativo:!0,abertura:"08:00",fechamento:"18:00"},sabado:{ativo:!0,abertura:"08:00",fechamento:"12:00"}};function h(a){let b=a.replace(/\D/g,"").slice(0,11);return b.length>10?`(${b.slice(0,2)}) ${b.slice(2,7)}-${b.slice(7)}`:b.length>6?`(${b.slice(0,2)}) ${b.slice(2,6)}-${b.slice(6)}`:b.length>2?`(${b.slice(0,2)}) ${b.slice(2)}`:b.length>0?`(${b}`:""}a.s(["default",0,function(){let[a,i]=(0,c.useState)(""),[j,k]=(0,c.useState)(""),[l,m]=(0,c.useState)(""),[n,o]=(0,c.useState)(""),[p,q]=(0,c.useState)(""),[r,s]=(0,c.useState)(30),[t,u]=(0,c.useState)("08:00"),[v,w]=(0,c.useState)("18:00"),[x,y]=(0,c.useState)([1,2,3,4,5,6]),[z,A]=(0,c.useState)(0),[B,C]=(0,c.useState)(""),[D,E]=(0,c.useState)(""),[F,G]=(0,c.useState)(""),[H,I]=(0,c.useState)(g),[J,K]=(0,c.useState)(!1),[L,M]=(0,c.useState)(!1),[N,O]=(0,c.useState)(""),[P,Q]=(0,c.useState)(""),[R,S]=(0,c.useState)(!1),[T,U]=(0,c.useState)(!1),[V,W]=(0,c.useState)(""),X=(0,c.useRef)(null);async function Y(){let{data:{user:a}}=await d.supabase.auth.getUser();if(!a){window.location.href="/login";return}W(a.id);let{data:b}=await d.supabase.from("perfis").select("*").eq("user_id",a.id).single();b&&(i(b.nome_negocio||""),k(b.slug||""),m(h(b.whatsapp||"")),o(b.endereco||""),q(b.banner_url||""),s(b.intervalo_agenda||30),u(b.hora_abertura||"08:00"),w(b.hora_fechamento||"18:00"),y(b.dias_funcionamento||[1,2,3,4,5,6]),A(b.antecedencia_minima||0),C(b.instagram||""),E(b.cidade_estado||""),G(b.descricao_curta||b.descricao||""),I(function(a){let b={};for(let c of Object.keys(a)){let d=a[c];!d.ativo||d.abertura&&d.fechamento?b[c]=d:b[c]={...d,abertura:d.abertura||"08:00",fechamento:d.fechamento||"18:00"}}return b}(b.horarios_funcionamento||g)),S(!0))}function Z(a){return a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g,"").trim().replace(/\s+/g,"-")}async function $(a){if(Q(""),!["image/jpeg","image/png","image/webp"].includes(a.type))return void Q("JPG, PNG ou WEBP, m�x. 5 MB.");if(a.size>5242880)return void Q("Imagem muito grande. M�x. 5 MB.");M(!0);let b=a.name.split(".").pop(),c=V+"/banner-"+Date.now()+"."+b,{error:e}=await d.supabase.storage.from("business-banners").upload(c,a,{upsert:!0});if(e){Q("Erro ao enviar imagem."),M(!1);return}let{data:f}=d.supabase.storage.from("business-banners").getPublicUrl(c);q(f.publicUrl),M(!1)}function _(a,b,c){I(d=>{let e=d[a]||{ativo:!1,abertura:"",fechamento:""};return"ativo"===b&&!0===c?{...d,[a]:{ativo:!0,abertura:e.abertura||"08:00",fechamento:e.fechamento||"18:00"}}:{...d,[a]:{...e,[b]:c}}})}async function aa(){if(!a||!j)return void O("Nome e link s�o obrigat�rios.");for(let a of f){let b=H[a.key];if(b.ativo){if(!b.abertura||!b.fechamento)return void O(`Preencha os hor�rios de ${a.label}.`);if(b.abertura>=b.fechamento)return void O(`Hor�rio inv�lido em ${a.label}: fechamento deve ser ap�s abertura.`)}}K(!0);let{data:{user:b}}=await d.supabase.auth.getUser(),c={nome_negocio:a,slug:j,whatsapp:l.replace(/\D/g,""),endereco:n,banner_url:p,intervalo_agenda:r,hora_abertura:t,hora_fechamento:v,dias_funcionamento:x,antecedencia_minima:z,instagram:B.replace("@","").trim()||null,cidade_estado:D.trim()||null,descricao_curta:F.trim()||null,descricao:F.trim()||null,horarios_funcionamento:H};if(R){let{error:a}=await d.supabase.from("perfis").update(c).eq("user_id",b?.id);O(a?"Erro ao salvar.":"Perfil atualizado!")}else{let{error:a}=await d.supabase.from("perfis").insert({user_id:b?.id,...c});a?O(a.message.includes("slug")?"Esse link j� est� em uso.":"Erro ao salvar."):(O("Perfil criado!"),S(!0))}K(!1),setTimeout(()=>O(""),4e3)}(0,c.useEffect)(()=>{Y()},[]);let ab=`
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
  `;return(0,b.jsxs)("div",{className:"pg",children:[(0,b.jsx)("style",{children:ab}),(0,b.jsxs)("nav",{className:"nav",children:[(0,b.jsx)("span",{className:"nav-logo",children:"ClienteMarcado"}),(0,b.jsx)(e.default,{href:"/painel",className:"nav-back",children:"? Voltar ao painel"})]}),(0,b.jsxs)("div",{className:"body",children:[(0,b.jsxs)("div",{className:"heading",children:[(0,b.jsx)("h1",{children:"Perfil do neg�cio"}),(0,b.jsx)("p",{children:"Configure como seu neg�cio aparece para os clientes."})]}),R&&(0,b.jsxs)("div",{className:"link-card",children:[(0,b.jsx)("p",{className:"link-label",children:"Seu link de agendamento"}),(0,b.jsxs)("p",{className:"link-url",children:["https://clientemarcado.vercel.app/",j]}),(0,b.jsxs)("div",{className:"link-btns",children:[(0,b.jsx)("button",{className:"btn-link",onClick:function(){navigator.clipboard.writeText("https://clientemarcado.vercel.app/"+j),U(!0),setTimeout(()=>U(!1),2e3)},style:{background:"#3B82F6",color:"#fff"},children:T?"? Copiado!":"Copiar link"}),(0,b.jsx)("button",{className:"btn-link",onClick:function(){let a="https://clientemarcado.vercel.app/"+j;window.open("https://wa.me/?text="+encodeURIComponent("Agende seu hor�rio pelo link: "+a),"_blank")},style:{background:"#16A34A",color:"#fff"},children:"WhatsApp"}),(0,b.jsx)("a",{href:"/"+j,target:"_blank",style:{flex:1,minWidth:"80px",textAlign:"center",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"9px 12px",fontSize:"13px",fontWeight:"600",color:"#9CA3AF",textDecoration:"none",display:"inline-block"},children:"Ver p�gina"})]})]}),(0,b.jsxs)("div",{className:"section-card",children:[(0,b.jsx)("p",{className:"section-titulo",children:"?? Informa��es do neg�cio"}),(0,b.jsx)("p",{className:"section-sub",children:"Dados principais que identificam seu neg�cio."}),(0,b.jsxs)("div",{className:"fields",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Nome do neg�cio *"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Barbearia do Jo�o, Cl�nica Sa�de & Bem-Estar",value:a,onChange:a=>{i(a.target.value),R||k(Z(a.target.value))},className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Link personalizado *"}),(0,b.jsxs)("div",{className:"slug-wrap",children:[(0,b.jsx)("span",{className:"slug-prefix",children:"clientemarcado.vercel.app/"}),(0,b.jsx)("input",{type:"text",placeholder:"meu-negocio",value:j,onChange:a=>k(Z(a.target.value)),className:"slug-input"})]})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Endere�o (opcional)"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Rua das Flores, 123 - S�o Paulo",value:n,onChange:a=>o(a.target.value),className:"input"})]})]})]}),(0,b.jsxs)("div",{className:"section-card",children:[(0,b.jsx)("p",{className:"section-titulo",children:"?? Dados p�blicos do neg�cio"}),(0,b.jsx)("p",{className:"section-sub",children:"Informa��es que aparecem na sua p�gina de agendamento."}),(0,b.jsxs)("div",{className:"fields",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"WhatsApp do neg�cio"}),(0,b.jsx)("input",{type:"tel",placeholder:"Ex: (11) 99999-9999",value:l,onChange:a=>m(h(a.target.value)),className:"input"}),(0,b.jsx)("p",{className:"field-hint",children:"Esse n�mero ser� usado no bot�o de WhatsApp da sua p�gina p�blica."})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Instagram"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: @seunegocio",value:B,onChange:a=>C(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Cidade / Estado"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: S�o Paulo - SP",value:D,onChange:a=>E(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Descri��o curta do neg�cio"}),(0,b.jsx)("textarea",{rows:3,placeholder:"Ex: Atendimento com hor�rio marcado, ambiente confort�vel e profissionais especializados.",value:F,onChange:a=>{a.target.value.length<=180&&G(a.target.value)},className:"textarea"}),(0,b.jsxs)("p",{className:"char-count",children:[F.length,"/180"]})]})]})]}),(0,b.jsxs)("div",{className:"section-card",children:[(0,b.jsx)("p",{className:"section-titulo",children:"?? Funcionamento do neg�cio"}),(0,b.jsx)("p",{className:"section-sub",children:"Defina os dias e hor�rios em que seus clientes podem agendar."}),(0,b.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,b.jsx)("label",{className:"label",children:"Dias ativos (sele��o r�pida)"}),(0,b.jsx)("div",{className:"dias-chips",children:["Dom","Seg","Ter","Qua","Qui","Sex","S�b"].map((a,c)=>(0,b.jsx)("button",{className:`dia-chip ${x.includes(c)?"on":"off"}`,onClick:()=>{y(a=>a.includes(c)?a.filter(a=>a!==c):[...a,c].sort())},children:a},c))})]}),(0,b.jsx)("div",{className:"divider"}),(0,b.jsx)("label",{className:"label",style:{marginBottom:"12px",display:"block"},children:"Hor�rios por dia"}),f.map(a=>{let c=H[a.key]||{ativo:!1,abertura:"",fechamento:""};return(0,b.jsxs)("div",{className:"dia-row",children:[(0,b.jsxs)("div",{className:"dia-toggle",children:[(0,b.jsx)("button",{className:`toggle-btn ${c.ativo?"on":"off"}`,onClick:()=>_(a.key,"ativo",!c.ativo)}),(0,b.jsx)("span",{className:"dia-nome",children:a.label})]}),c.ativo?(0,b.jsxs)("div",{className:"dia-horarios",children:[(0,b.jsx)("input",{type:"time",value:c.abertura,onChange:b=>_(a.key,"abertura",b.target.value),className:"dia-horario-input"}),(0,b.jsx)("span",{className:"dia-sep",children:"at�"}),(0,b.jsx)("input",{type:"time",value:c.fechamento,onChange:b=>_(a.key,"fechamento",b.target.value),className:"dia-horario-input"})]}):(0,b.jsx)("span",{className:"dia-fechado",children:"Fechado"})]},a.key)})]}),(0,b.jsxs)("div",{className:"section-card",children:[(0,b.jsx)("p",{className:"section-titulo",children:"?? Configura��es da agenda"}),(0,b.jsx)("p",{className:"section-sub",children:"Controle como o agendamento p�blico funciona."}),(0,b.jsxs)("div",{className:"fields",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Intervalo entre hor�rios"}),(0,b.jsxs)("select",{value:r,onChange:a=>s(Number(a.target.value)),className:"select",children:[(0,b.jsx)("option",{value:10,children:"10 minutos"}),(0,b.jsx)("option",{value:15,children:"15 minutos"}),(0,b.jsx)("option",{value:20,children:"20 minutos"}),(0,b.jsx)("option",{value:30,children:"30 minutos"}),(0,b.jsx)("option",{value:45,children:"45 minutos"}),(0,b.jsx)("option",{value:60,children:"60 minutos"})]})]}),(0,b.jsxs)("div",{className:"row-2",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Abertura geral"}),(0,b.jsx)("input",{type:"time",value:t,onChange:a=>u(a.target.value),className:"input"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Fechamento geral"}),(0,b.jsx)("input",{type:"time",value:v,onChange:a=>w(a.target.value),className:"input"})]})]}),(0,b.jsx)("p",{className:"field-hint",children:"Esses hor�rios s�o usados como padr�o quando um dia n�o tiver hor�rio espec�fico configurado acima."}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"label",children:"Anteced�ncia m�nima para agendamento"}),(0,b.jsxs)("select",{value:z,onChange:a=>A(Number(a.target.value)),className:"select",children:[(0,b.jsx)("option",{value:0,children:"Sem restri��o"}),(0,b.jsx)("option",{value:30,children:"30 minutos antes"}),(0,b.jsx)("option",{value:60,children:"1 hora antes"}),(0,b.jsx)("option",{value:120,children:"2 horas antes"}),(0,b.jsx)("option",{value:240,children:"4 horas antes"}),(0,b.jsx)("option",{value:720,children:"12 horas antes"}),(0,b.jsx)("option",{value:1440,children:"24 horas antes"})]}),(0,b.jsx)("p",{className:"field-hint",children:"Clientes n�o poder�o agendar dentro desse prazo."})]})]})]}),(0,b.jsxs)("div",{className:"section-card",children:[(0,b.jsx)("p",{className:"section-titulo",children:"??? Imagem de capa"}),(0,b.jsx)("p",{className:"section-sub",children:"Aparece no topo da sua p�gina de agendamento. Use uma imagem horizontal (16:9)."}),(0,b.jsx)("input",{ref:X,type:"file",accept:"image/jpeg,image/png,image/webp",style:{display:"none"},onChange:a=>{a.target.files?.[0]&&$(a.target.files[0])}}),p?(0,b.jsxs)("div",{style:{borderRadius:"14px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",position:"relative"},children:[(0,b.jsx)("img",{src:p,alt:"Banner",style:{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}),(0,b.jsxs)("div",{style:{position:"absolute",top:"10px",right:"10px",display:"flex",gap:"8px"},children:[(0,b.jsx)("button",{onClick:()=>X.current?.click(),style:{background:"rgba(0,0,0,0.7)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",cursor:"pointer"},children:"Trocar"}),(0,b.jsx)("button",{onClick:()=>q(""),style:{background:"rgba(239,68,68,0.8)",color:"#fff",border:"none",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",cursor:"pointer"},children:"Remover"})]})]}):(0,b.jsxs)("div",{className:"banner-drop",onClick:()=>X.current?.click(),children:[(0,b.jsx)("div",{style:{fontSize:"28px",marginBottom:"10px"},children:"???"}),(0,b.jsx)("p",{style:{fontWeight:"600",fontSize:"13px",color:"#D1D5DB",marginBottom:"4px"},children:L?"Enviando...":"Clique para enviar uma imagem"}),(0,b.jsx)("p",{style:{fontSize:"11px",color:"#4B5563"},children:"16:9 � JPG, PNG ou WEBP � M�x. 5 MB"})]}),P&&(0,b.jsx)("p",{style:{fontSize:"12px",color:"#EF4444",marginTop:"8px"},children:P})]}),N&&(0,b.jsx)("div",{className:N.includes("Erro")||N.includes("obrigat�rio")||N.includes("inv�lido")||N.includes("uso")?"msg-err":"msg-ok",style:{marginBottom:"14px"},children:N}),(0,b.jsx)("button",{className:"btn-salvar",onClick:aa,disabled:J||L,children:J?"Salvando...":"Salvar perfil"})]})]})}])}];

//# sourceMappingURL=app_painel_perfil_page_tsx_0vp7v92._.js.map