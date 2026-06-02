module.exports=[80357,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(78530),e=a.i(50944),f=a.i(38246),g=a.i(64831);let h=(0,g.default)("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]),i=(0,g.default)("clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]),j=(0,g.default)("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]);a.s(["default",0,function(){let a=(0,e.useParams)(),g=(0,e.useSearchParams)(),k=a.slug,[l,m]=(0,c.useState)(null),[n,o]=(0,c.useState)([]),[p,q]=(0,c.useState)([]),[r,s]=(0,c.useState)(1),[t,u]=(0,c.useState)(""),[v,w]=(0,c.useState)(""),[x,y]=(0,c.useState)(""),[z,A]=(0,c.useState)(""),[B,C]=(0,c.useState)(""),[D,E]=(0,c.useState)(""),[F,G]=(0,c.useState)(!1),[H,I]=(0,c.useState)(""),[J,K]=(0,c.useState)(!1),[L,M]=(0,c.useState)(new Date),[N,O]=(0,c.useState)([]),[P,Q]=(0,c.useState)(!1);async function R(){Q(!0),A("");let a=n.find(a=>a.id===t),b=a?.duracao_minutos||30,c=l?.intervalo_agenda||30,e=l?.hora_abertura||"08:00",f=l?.hora_fechamento||"18:00",{data:g}=await d.supabase.from("bloqueios").select("*").eq("user_id",l.user_id).eq("data",x),h=(g||[]).filter(a=>!a.profissional_id||a.profissional_id===v),{data:i}=await d.supabase.from("agendamentos").select("data_hora, servico_id").eq("profissional_id",v).gte("data_hora",x+"T00:00:00").lte("data_hora",x+"T23:59:59").neq("status","cancelado"),[j,k]=e.split(":").map(Number),[m,o]=f.split(":").map(Number),p=60*j+k,q=60*m+o,r=[];for(let a of i||[]){let b=new Date(a.data_hora),c=60*b.getHours()+b.getMinutes(),d=n.find(b=>b.id===a.servico_id)?.duracao_minutos||30;r.push({inicio:c,fim:c+d})}let s=[];for(let a=p;a+b<=q;a+=c)if(!r.some(c=>a<c.fim&&a+b>c.inicio)){let b=Math.floor(a/60).toString().padStart(2,"0"),c=(a%60).toString().padStart(2,"0");s.push(b+":"+c)}let u=new Date,w=l?.antecedencia_minima||0;O(s.filter(a=>{if((new Date(x+"T"+a+":00").getTime()-u.getTime())/6e4<w)return!1;let[c,d]=a.split(":").map(Number),e=60*c+d;return!h.some(a=>{let[c,d]=a.hora_inicio.split(":").map(Number),[f,g]=a.hora_fim.split(":").map(Number);return e<60*f+g&&e+b>60*c+d})})),Q(!1)}async function S(){if(I(""),!B)return void I("Informe seu nome.");if(!D||D.replace(/\D/g,"").length<10)return void I("Informe seu WhatsApp com DDD.");K(!0);let{error:a}=await d.supabase.from("agendamentos").insert({user_id:l.user_id,servico_id:t,profissional_id:v,data_hora:x+"T"+z+":00",cliente_nome:B,cliente_telefone:D});K(!1),a?I("Erro ao agendar. Tente novamente."):G(!0)}(0,c.useEffect)(()=>{!async function(){let{data:a}=await d.supabase.from("perfis").select("*").eq("slug",k).single();m(a);let{data:b}=await d.supabase.from("servicos").select("*").eq("user_id",a.user_id);o(b||[]);let{data:c}=await d.supabase.from("profissionais").select("*").eq("user_id",a.user_id);q(c||[]);let e=g.get("servico");e&&b&&b.find(a=>a.id===e)&&(u(e),s(2))}()},[k]),(0,c.useEffect)(()=>{x&&v&&t&&R()},[x,v,t]);let T=n.find(a=>a.id===t),U=p.find(a=>a.id===v),V=new Date().toISOString().split("T")[0],W=l?.whatsapp?"https://wa.me/55"+l.whatsapp.replace(/\D/g,"")+"?text="+encodeURIComponent("Olá! Acabei de agendar um horário pelo link e gostaria de confirmar."):null,X=new Date;X.setHours(0,0,0,0);let Y=new Date(L.getFullYear(),L.getMonth()+1,0).getDate(),Z=new Date(L.getFullYear(),L.getMonth(),1).getDay(),$=l?.dias_funcionamento||[1,2,3,4,5,6];function _(a){let[b,c,d]=a.split("-");return d+"/"+c+"/"+b}let aa=N.filter(a=>12>parseInt(a)),ab=N.filter(a=>parseInt(a)>=12&&18>parseInt(a)),ac=N.filter(a=>parseInt(a)>=18),ad=["Serviço","Profissional","Data e hora","Seus dados"],ae=`
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
  `;if(F)return(0,b.jsxs)("div",{className:"sucesso-wrap",children:[(0,b.jsx)("style",{children:ae}),(0,b.jsxs)("div",{className:"sucesso-inner",children:[(0,b.jsx)("div",{className:"sucesso-icon",children:"✅"}),(0,b.jsx)("h1",{className:"sucesso-title",children:"Agendamento confirmado!"}),(0,b.jsxs)("p",{className:"sucesso-sub",children:["Obrigado, ",(0,b.jsx)("strong",{style:{color:"#F1F5F9"},children:B}),"! Seu agendamento foi recebido."]}),(0,b.jsxs)("div",{className:"resumo-card",children:[(0,b.jsx)("p",{className:"resumo-card-title",children:"Resumo"}),[{label:"Serviço",valor:T?.nome,cor:"#F1F5F9"},{label:"Profissional",valor:U?.nome,cor:"#F1F5F9"},{label:"Data",valor:_(x),cor:"#F1F5F9"},{label:"Horário",valor:z,cor:"#3B82F6"},{label:"Valor",valor:"R$ "+T?.preco,cor:"#22C55E"}].map((a,c,d)=>(0,b.jsxs)("div",{children:[(0,b.jsxs)("div",{className:"resumo-row",children:[(0,b.jsx)("span",{className:"resumo-row-label",children:a.label}),(0,b.jsx)("span",{className:"resumo-row-valor",style:{color:a.cor},children:a.valor})]}),c<d.length-1&&(0,b.jsx)("hr",{className:"resumo-divider"})]},a.label))]}),(0,b.jsxs)("div",{className:"sucesso-actions",children:[W&&(0,b.jsxs)("a",{href:W,target:"_blank",rel:"noopener noreferrer",className:"btn-wpp",children:[(0,b.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:(0,b.jsx)("path",{d:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"})}),"Falar com o estabelecimento"]}),(0,b.jsx)("button",{onClick:function(){let a=new Date(x+"T"+z+":00"),b=new Date(a.getTime()+6e4*(T?.duracao_minutos||30)),c=a=>a.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z",d=new Blob([["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT","DTSTART:"+c(a),"DTEND:"+c(b),"SUMMARY:"+(T?.nome||"")+" - "+(l?.nome_negocio||""),"DESCRIPTION:Profissional: "+(U?.nome||""),"END:VEVENT","END:VCALENDAR"].join("\r\n")],{type:"text/calendar"}),e=URL.createObjectURL(d),f=document.createElement("a");f.href=e,f.download="agendamento.ics",f.click(),URL.revokeObjectURL(e)},className:"btn-ics",children:"📅 Adicionar à agenda do celular"}),(0,b.jsx)(f.default,{href:"/"+k,className:"btn-inicio",children:"Voltar ao início"})]})]})]});let af=()=>(0,b.jsxs)("div",{className:"steps-wrap",children:[(0,b.jsx)("div",{className:"steps-track",children:[1,2,3,4].map(a=>(0,b.jsxs)("div",{style:{display:"flex",alignItems:"center",flex:a<4?1:"none"},children:[(0,b.jsx)("div",{className:`step-dot ${r>a?"done":r===a?"active":"idle"}`,children:r>a?"✓":a}),a<4&&(0,b.jsx)("div",{className:"step-line",style:{background:r>a?"#3B82F6":"rgba(255,255,255,0.07)"}})]},a))}),(0,b.jsx)("div",{className:"step-labels",children:ad.map((a,c)=>(0,b.jsx)("span",{className:"step-label",style:{fontWeight:r===c+1?700:500,color:r===c+1?"#3B82F6":"#4B5563",flex:c<3?1:"none",textAlign:0===c?"left":3===c?"right":"center"},children:a},a))})]});return(0,b.jsxs)("main",{className:"page",children:[(0,b.jsx)("style",{children:ae}),(0,b.jsxs)("div",{className:"header",children:[(0,b.jsx)(f.default,{href:"/"+k,className:"header-back",children:"← Voltar"}),(0,b.jsx)("p",{className:"header-title",children:l?.nome_negocio}),(0,b.jsx)("div",{className:"header-spacer"})]}),1===r&&(0,b.jsxs)("div",{className:"container",children:[(0,b.jsx)(af,{}),(0,b.jsx)("h2",{className:"section-title",children:"Escolha o serviço"}),(0,b.jsx)("p",{className:"section-sub",children:"Selecione o serviço desejado"}),(0,b.jsx)("div",{className:"servico-list",children:n.map(a=>(0,b.jsxs)("button",{onClick:()=>{u(a.id),s(2)},className:"servico-card"+(t===a.id?" sel":""),children:[(0,b.jsx)("div",{className:"servico-accent"}),(0,b.jsx)("div",{className:"servico-icon",children:"✂️"}),(0,b.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,b.jsx)("p",{className:"servico-nome",children:a.nome}),a.descricao?(0,b.jsx)("p",{className:"servico-desc",children:a.descricao}):(0,b.jsx)("p",{className:"servico-desc",style:{color:"#4B5563"},children:"Atendimento com horário marcado"}),(0,b.jsxs)("p",{className:"servico-meta",children:[a.duracao_minutos?a.duracao_minutos+" min":"",a.duracao_minutos&&a.preco?" · ":"",a.preco?(0,b.jsxs)("span",{className:"servico-preco",children:["R$ ",a.preco]}):null]})]}),(0,b.jsx)("span",{className:"servico-arrow",children:"›"})]},a.id))})]}),2===r&&(0,b.jsxs)("div",{className:"container",children:[(0,b.jsx)(af,{}),(0,b.jsx)("h2",{className:"section-title",children:"Escolha o profissional"}),(0,b.jsx)("p",{className:"section-sub",children:"Com quem deseja ser atendido?"}),(0,b.jsx)("div",{className:"prof-grid",children:p.map(a=>(0,b.jsxs)("button",{onClick:()=>{w(a.id),s(3)},className:"prof-card"+(v===a.id?" sel":""),children:[a.foto_url?(0,b.jsx)("img",{src:a.foto_url,alt:a.nome,className:"prof-avatar-img",style:{border:v===a.id?"2px solid #3B82F6":"2px solid rgba(255,255,255,0.1)"}}):(0,b.jsx)("div",{className:"prof-avatar-letra",style:{border:v===a.id?"2px solid #3B82F6":"2px solid rgba(59,130,246,0.2)"},children:a.nome.charAt(0).toUpperCase()}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"prof-nome",children:a.nome}),(0,b.jsx)("p",{className:"prof-cargo",children:a.cargo||"Profissional"})]})]},a.id))}),(0,b.jsx)("button",{onClick:()=>s(1),className:"btn-link-voltar",children:"← Voltar"})]}),3===r&&(0,b.jsxs)("div",{className:"container-wide",children:[(0,b.jsx)(af,{}),(0,b.jsx)("h2",{className:"section-title",children:"Data e horário"}),(0,b.jsx)("p",{className:"section-sub",children:"Escolha quando quer ser atendido"}),(0,b.jsx)("div",{className:"resumo-strip",children:[{label:"Serviço",valor:T?.nome,cor:"#F1F5F9"},{label:"Profissional",valor:U?.nome,cor:"#F1F5F9"},{label:"Duração",valor:(T?.duracao_minutos||30)+" min",cor:"#F1F5F9"},{label:"Valor",valor:"R$ "+T?.preco,cor:"#22C55E"}].map(a=>(0,b.jsxs)("div",{className:"resumo-item",children:[(0,b.jsx)("p",{className:"resumo-label",children:a.label}),(0,b.jsx)("p",{className:"resumo-valor",style:{color:a.cor},children:a.valor})]},a.label))}),(0,b.jsxs)("div",{className:"etapa3-cols",children:[(0,b.jsxs)("div",{className:"cal-wrap",children:[(0,b.jsxs)("div",{className:"cal-header",children:[(0,b.jsx)("button",{className:"cal-nav",onClick:()=>M(new Date(L.getFullYear(),L.getMonth()-1,1)),children:"‹"}),(0,b.jsx)("p",{className:"cal-mes",children:L.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}),(0,b.jsx)("button",{className:"cal-nav",onClick:()=>M(new Date(L.getFullYear(),L.getMonth()+1,1)),children:"›"})]}),(0,b.jsx)("div",{className:"cal-dow",children:["D","S","T","Q","Q","S","S"].map((a,c)=>(0,b.jsx)("div",{className:"cal-dow-label",children:a},c))}),(0,b.jsxs)("div",{className:"cal-days",children:[Array.from({length:Z}).map((a,c)=>(0,b.jsx)("div",{},"e"+c)),Array.from({length:Y}).map((a,c)=>{let d,e=c+1,f=L.getFullYear()+"-"+String(L.getMonth()+1).padStart(2,"0")+"-"+String(e).padStart(2,"0"),g=(d=new Date(L.getFullYear(),L.getMonth(),e))>=X&&$.includes(d.getDay()),h=x===f,i=f===V,j="dia";return h?j+=" sel":g&&i?j+=" disp hoje":g&&(j+=" disp"),(0,b.jsx)("button",{disabled:!g,onClick:()=>g&&y(f),className:j,children:e},e)})]})]}),(0,b.jsxs)("div",{className:"horarios-wrap",children:[!x&&(0,b.jsxs)("div",{className:"horarios-placeholder",children:[(0,b.jsx)("span",{style:{fontSize:"30px",opacity:.25},children:"📅"}),(0,b.jsxs)("p",{style:{fontSize:"13px",color:"#4B5563",textAlign:"center",lineHeight:1.5},children:["Selecione uma data",(0,b.jsx)("br",{}),"para ver os horários"]})]}),x&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("p",{className:"horarios-data-label",children:function(a){let[b,c,d]=a.split("-");return new Date(parseInt(b),parseInt(c)-1,parseInt(d)).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}(x)}),P&&(0,b.jsx)("div",{className:"horarios-empty",children:(0,b.jsx)("p",{style:{fontSize:"13px",color:"#6B7280"},children:"Buscando horários..."})}),!P&&0===N.length&&(0,b.jsxs)("div",{className:"horarios-empty",children:[(0,b.jsx)("span",{style:{fontSize:"26px",opacity:.3},children:"😔"}),(0,b.jsxs)("p",{style:{fontSize:"13px",color:"#6B7280",textAlign:"center"},children:["Nenhum horário disponível",(0,b.jsx)("br",{}),"nesta data."]})]}),!P&&N.length>0&&(0,b.jsx)("div",{children:[{label:"Manhã",icon:(0,b.jsx)(h,{size:11,color:"#9CA3AF"}),lista:aa},{label:"Tarde",icon:(0,b.jsx)(i,{size:11,color:"#9CA3AF"}),lista:ab},{label:"Noite",icon:(0,b.jsx)(j,{size:11,color:"#9CA3AF"}),lista:ac}].filter(a=>a.lista.length>0).map(a=>(0,b.jsxs)("div",{style:{marginBottom:"14px"},children:[(0,b.jsxs)("div",{className:"periodo-label-row",children:[a.icon,(0,b.jsx)("span",{className:"periodo-label",children:a.label})]}),(0,b.jsx)("div",{className:"horarios-grid",children:a.lista.map(a=>(0,b.jsx)("button",{onClick:()=>A(a),className:"h-btn"+(z===a?" sel":""),children:a},a))})]},a.label))})]})]})]}),(0,b.jsxs)("div",{className:"nav-row",children:[(0,b.jsx)("button",{onClick:()=>s(2),className:"btn-voltar",children:"← Voltar"}),(0,b.jsx)("button",{onClick:()=>{x&&z?(I(""),s(4)):I("Selecione data e horário.")},disabled:!x||!z,className:"btn-continuar "+(x&&z?"on":"off"),children:"Continuar →"})]}),H&&(0,b.jsx)("p",{className:"erro-msg",children:H})]}),4===r&&(0,b.jsxs)("div",{className:"container",children:[(0,b.jsx)(af,{}),(0,b.jsx)("h2",{className:"section-title",children:"Seus dados"}),(0,b.jsx)("p",{className:"section-sub",children:"Para finalizar o agendamento"}),(0,b.jsxs)("div",{className:"resumo-card",children:[(0,b.jsx)("p",{className:"resumo-card-title",children:"Resumo"}),[{label:"Serviço",valor:T?.nome,cor:"#F1F5F9"},{label:"Profissional",valor:U?.nome,cor:"#F1F5F9"},{label:"Data",valor:_(x),cor:"#F1F5F9"},{label:"Horário",valor:z,cor:"#3B82F6"},{label:"Valor",valor:"R$ "+T?.preco,cor:"#22C55E"}].map((a,c,d)=>(0,b.jsxs)("div",{children:[(0,b.jsxs)("div",{className:"resumo-row",children:[(0,b.jsx)("span",{className:"resumo-row-label",children:a.label}),(0,b.jsx)("span",{className:"resumo-row-valor",style:{color:a.cor},children:a.valor})]}),c<d.length-1&&(0,b.jsx)("hr",{className:"resumo-divider"})]},a.label))]}),(0,b.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"22px"},children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"input-label",children:"Seu nome *"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Maria Silva",value:B,onChange:a=>C(a.target.value),className:"input-field"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"input-label",children:"WhatsApp *"}),(0,b.jsx)("input",{type:"tel",placeholder:"(11) 99999-9999",value:D,onChange:a=>{let b;return E((b=a.target.value.replace(/\D/g,"").slice(0,11)).length>10?"("+b.slice(0,2)+") "+b.slice(2,7)+"-"+b.slice(7):b.length>6?"("+b.slice(0,2)+") "+b.slice(2,6)+"-"+b.slice(6):b.length>2?"("+b.slice(0,2)+") "+b.slice(2):b.length>0?"("+b:"")},className:"input-field"}),(0,b.jsx)("p",{style:{fontSize:"12px",color:"#374151",marginTop:"6px"},children:"Usado apenas para contato sobre seu agendamento."})]})]}),H&&(0,b.jsx)("p",{className:"erro-msg",style:{marginBottom:"12px"},children:H}),(0,b.jsxs)("div",{className:"nav-row",children:[(0,b.jsx)("button",{onClick:()=>s(3),className:"btn-voltar",children:"← Voltar"}),(0,b.jsx)("button",{onClick:S,disabled:J,className:"btn-confirmar",style:{opacity:J?.7:1},children:J?"Confirmando...":"Confirmar agendamento"})]})]})]})}],80357)}];

//# sourceMappingURL=app_%5Bslug%5D_agendar_page_tsx_06zdy_m._.js.map