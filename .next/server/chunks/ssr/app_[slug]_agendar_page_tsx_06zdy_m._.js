module.exports=[80357,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(78530),e=a.i(50944),f=a.i(38246),g=a.i(64831);let h=(0,g.default)("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);var i=a.i(8311);let j=(0,g.default)("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]),k=(0,g.default)("scissors",[["circle",{cx:"6",cy:"6",r:"3",key:"1lh9wr"}],["path",{d:"M8.12 8.12 12 12",key:"1alkpv"}],["path",{d:"M20 4 8.12 15.88",key:"xgtan2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["path",{d:"M14.8 14.8 20 20",key:"ptml3r"}]]);var l=a.i(86708),m=a.i(41544),n=a.i(19796);let o=(0,g.default)("calendar-check",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"m9 16 2 2 4-4",key:"19s6y9"}]]),p=(0,g.default)("file-text",[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]),q=(0,g.default)("heart-pulse",[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}],["path",{d:"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",key:"auskq0"}]]),r=(0,g.default)("shield-plus",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M9 12h6",key:"1c52cq"}],["path",{d:"M12 9v6",key:"199k2o"}]]),s=(0,g.default)("stethoscope",[["path",{d:"M11 2v2",key:"1539x4"}],["path",{d:"M5 2v2",key:"1yf1q8"}],["path",{d:"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1",key:"rb5t3r"}],["path",{d:"M8 15a6 6 0 0 0 12 0v-3",key:"x18d4x"}],["circle",{cx:"20",cy:"10",r:"2",key:"ts1r5v"}]]);a.s(["default",0,function(){let a=(0,e.useParams)(),g=(0,e.useSearchParams)(),t=a.slug,[u,v]=(0,c.useState)(null),[w,x]=(0,c.useState)([]),[y,z]=(0,c.useState)([]),[A,B]=(0,c.useState)(1),[C,D]=(0,c.useState)(""),[E,F]=(0,c.useState)(""),[G,H]=(0,c.useState)(""),[I,J]=(0,c.useState)(""),[K,L]=(0,c.useState)(""),[M,N]=(0,c.useState)(""),[O,P]=(0,c.useState)(!1),[Q,R]=(0,c.useState)(""),[S,T]=(0,c.useState)(!1),[U,V]=(0,c.useState)(new Date),[W,X]=(0,c.useState)([]),[Y,Z]=(0,c.useState)(!1);async function $(){Z(!0),J("");let a=w.find(a=>a.id===C),b=a?.duracao_minutos||30,c=u?.intervalo_agenda||30,e=u?.hora_abertura||"08:00",f=u?.hora_fechamento||"18:00",{data:g}=await d.supabase.from("bloqueios").select("*").eq("user_id",u.user_id).eq("data",G),h=(g||[]).filter(a=>!a.profissional_id||a.profissional_id===E),{data:i}=await d.supabase.from("agendamentos").select("data_hora, servico_id").eq("profissional_id",E).gte("data_hora",G+"T00:00:00").lte("data_hora",G+"T23:59:59").neq("status","cancelado"),[j,k]=e.split(":").map(Number),[l,m]=f.split(":").map(Number),n=60*j+k,o=60*l+m,p=[];for(let a of i||[]){let b=new Date(a.data_hora),c=60*b.getHours()+b.getMinutes(),d=w.find(b=>b.id===a.servico_id)?.duracao_minutos||30;p.push({inicio:c,fim:c+d})}let q=[];for(let a=n;a+b<=o;a+=c)if(!p.some(c=>a<c.fim&&a+b>c.inicio)){let b=Math.floor(a/60).toString().padStart(2,"0"),c=(a%60).toString().padStart(2,"0");q.push(b+":"+c)}let r=new Date,s=u?.antecedencia_minima||0;X(q.filter(a=>{if((new Date(G+"T"+a+":00").getTime()-r.getTime())/6e4<s)return!1;let[c,d]=a.split(":").map(Number),e=60*c+d;return!h.some(a=>{let[c,d]=a.hora_inicio.split(":").map(Number),[f,g]=a.hora_fim.split(":").map(Number);return e<60*f+g&&e+b>60*c+d})})),Z(!1)}async function _(){if(R(""),!K)return void R("Informe seu nome.");if(!M||M.replace(/\D/g,"").length<10)return void R("Informe seu WhatsApp com DDD.");T(!0);let{error:a}=await d.supabase.from("agendamentos").insert({user_id:u.user_id,servico_id:C,profissional_id:E,data_hora:G+"T"+I+":00",cliente_nome:K,cliente_telefone:M});T(!1),a?R("Erro ao agendar. Tente novamente."):P(!0)}(0,c.useEffect)(()=>{!async function(){let{data:a}=await d.supabase.from("perfis").select("*").eq("slug",t).single();v(a);let{data:b}=await d.supabase.from("servicos").select("*").eq("user_id",a.user_id);x(b||[]);let{data:c}=await d.supabase.from("profissionais").select("*").eq("user_id",a.user_id);z(c||[]);let e=g.get("servico");e&&b&&b.find(a=>a.id===e)&&(D(e),B(2))}()},[t]),(0,c.useEffect)(()=>{G&&E&&C&&$()},[G,E,C]);let aa="linear-gradient(135deg,#3B82F6,#7C3AED)";u?.cor_tema;let ab=w.find(a=>a.id===C),ac=y.find(a=>a.id===E),ad=new Date().toISOString().split("T")[0],ae=u?.whatsapp?"https://wa.me/55"+u.whatsapp.replace(/\D/g,"")+"?text="+encodeURIComponent("Olá! Acabei de agendar um horário pelo link e gostaria de confirmar."):null,af=new Date;af.setHours(0,0,0,0);let ag=new Date(U.getFullYear(),U.getMonth()+1,0).getDate(),ah=new Date(U.getFullYear(),U.getMonth(),1).getDay(),ai=u?.dias_funcionamento||[1,2,3,4,5,6];function aj(a){let[b,c,d]=a.split("-");return d+"/"+c+"/"+b}let ak=W.filter(a=>12>parseInt(a)),al=W.filter(a=>parseInt(a)>=12&&18>parseInt(a)),am=W.filter(a=>parseInt(a)>=18),an=["Atendimento","Profissional","Data e hora","Seus dados"],ao=`
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{overflow-x:hidden;width:100%;max-width:100%}
    .page{min-height:100vh;background:radial-gradient(ellipse at top,rgba(124,58,237,.10),transparent 50%),linear-gradient(180deg,#060C18 0%,#050B16 100%);color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .header{border-bottom:1px solid rgba(148,163,184,.10);padding:14px 20px;display:flex;align-items:center;background:rgba(5,11,22,.97);backdrop-filter:blur(20px);position:sticky;top:0;z-index:10}
    .header-back{color:#64748B;text-decoration:none;font-size:14px;display:flex;align-items:center;gap:4px;min-width:60px;font-weight:500;transition:color .15s}
    .header-back:hover{color:#94A3B8}
    .header-title{flex:1;text-align:center;font-size:15px;font-weight:800;color:#F8FAFC;letter-spacing:-0.01em}
    .header-spacer{min-width:60px}
    .container{max-width:680px;margin:0 auto;padding:24px 16px 60px}
    .container-wide{max-width:980px;margin:0 auto;padding:24px 16px 60px}
    @media(min-width:768px){.container{padding:40px 32px 100px;max-width:720px}.container-wide{padding:40px 32px 100px;max-width:1040px}}
    .steps-wrap{margin-bottom:28px}
    .steps-track{display:flex;align-items:center;margin-bottom:10px}
    .step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .2s}
    .step-dot.done{background:${aa};color:#fff;box-shadow:0 0 16px rgba(124,58,237,.35)}
    .step-dot.active{background:${aa};color:#fff;box-shadow:0 0 20px rgba(59,130,246,.40)}
    .step-dot.idle{background:rgba(15,23,42,.88);color:#475569;border:1px solid rgba(148,163,184,.12)}
    .step-line{flex:1;height:2px;margin:0 6px;border-radius:1px;transition:background .2s}
    .step-labels{display:flex;justify-content:space-between}
    .step-label{font-size:10px;letter-spacing:.02em}
    .section-title{font-size:22px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:6px}
    .section-sub{font-size:14px;color:#64748B;margin-bottom:24px;line-height:1.5}
    .servico-list{display:flex;flex-direction:column;gap:10px}
    .servico-card{display:flex;align-items:center;gap:16px;background:radial-gradient(circle at top left,rgba(59,130,246,.05),transparent 55%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.12);border-radius:16px;padding:18px 16px 18px 20px;cursor:pointer;text-align:left;width:100%;position:relative;overflow:hidden;transition:all .18s;-webkit-tap-highlight-color:transparent}
    .servico-card:hover{border-color:rgba(59,130,246,.45);box-shadow:0 8px 32px rgba(0,0,0,.28),0 0 0 1px rgba(59,130,246,.12);transform:translateY(-1px)}
    .servico-card.sel{border-color:rgba(59,130,246,.65);box-shadow:0 0 0 1px rgba(59,130,246,.22),0 10px 36px rgba(59,130,246,.14);background:radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 55%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))}
    .servico-accent{position:absolute;top:0;left:0;bottom:0;width:3px;background:${aa};border-radius:0 2px 2px 0}
    .servico-icon{width:46px;height:46px;border-radius:13px;background:rgba(59,130,246,.10);border:1px solid rgba(59,130,246,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .servico-nome{font-weight:700;font-size:15px;color:#F8FAFC;margin-bottom:3px;line-height:1.3}
    .servico-desc{font-size:12px;color:#64748B;margin-bottom:7px;line-height:1.5}
    .servico-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:#64748B}
    .servico-meta-sep{width:3px;height:3px;border-radius:50%;background:#334155;flex-shrink:0}
    .servico-preco{color:#22C55E;font-weight:700;font-size:13px}
    .servico-dur{display:flex;align-items:center;gap:3px;color:#64748B}
    .servico-arrow{width:28px;height:28px;border-radius:8px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#3B82F6;font-size:16px;transition:all .15s}
    .servico-card:hover .servico-arrow{background:rgba(59,130,246,.16);border-color:rgba(59,130,246,.30)}
    .prof-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
    @media(min-width:480px){.prof-grid{grid-template-columns:repeat(3,1fr)}}
    @media(min-width:768px){.prof-grid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}}
    .prof-card{display:flex;flex-direction:column;align-items:center;gap:12px;background:radial-gradient(circle at top,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:24px 16px;cursor:pointer;text-align:center;transition:all .18s;-webkit-tap-highlight-color:transparent}
    .prof-card:hover{border-color:rgba(59,130,246,.40);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.25)}
    .prof-card.sel{border-color:rgba(59,130,246,.70);box-shadow:0 0 0 1px rgba(59,130,246,.25),0 8px 32px rgba(59,130,246,.15);background:radial-gradient(circle at top,rgba(59,130,246,.12),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))}
    .prof-avatar-img{width:72px;height:72px;border-radius:50%;object-fit:cover}
    .prof-avatar-letra{width:72px;height:72px;border-radius:50%;background:rgba(59,130,246,.12);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#3B82F6}
    .prof-nome{font-size:14px;font-weight:700;color:#F8FAFC;margin-bottom:3px}
    .prof-cargo{font-size:12px;color:#64748B}
    .resumo-strip{display:grid;grid-template-columns:repeat(2,1fr);background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:16px 20px;margin-bottom:18px;gap:12px}
    @media(min-width:768px){.resumo-strip{grid-template-columns:repeat(4,1fr)}}
    .resumo-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin-bottom:4px}
    .resumo-valor{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .etapa3-cols{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}
    @media(min-width:768px){.etapa3-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}}
    .cal-wrap{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:20px}
    .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .cal-nav{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:10px;padding:8px 16px;color:#94A3B8;cursor:pointer;font-size:16px;line-height:1;transition:all .15s;-webkit-tap-highlight-color:transparent}
    .cal-nav:hover{border-color:rgba(59,130,246,.35);color:#F8FAFC}
    .cal-mes{font-weight:700;font-size:14px;text-transform:capitalize;color:#F8FAFC}
    .cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:8px}
    .cal-dow-label{text-align:center;font-size:11px;font-weight:700;color:#334155;padding:4px 0}
    .cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
    .dia{padding:10px 2px;border-radius:10px;font-size:13px;font-weight:500;cursor:default;border:1px solid transparent;text-align:center;background:transparent;color:#1E293B;transition:all .15s;-webkit-tap-highlight-color:transparent;font-family:inherit}
    .dia.disp{color:#CBD5E1;background:rgba(255,255,255,.04);cursor:pointer;font-weight:600}
    .dia.disp:hover{background:rgba(59,130,246,.14);color:#F8FAFC;border-color:rgba(59,130,246,.25)}
    .dia.hoje{border-color:rgba(59,130,246,.50);color:#3B82F6;font-weight:700}
    .dia.sel{background:${aa}!important;color:#fff!important;border-color:transparent!important;font-weight:700;box-shadow:0 4px 12px rgba(59,130,246,.35)}
    .horarios-wrap{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:20px;min-height:200px}
    .horarios-data-label{font-size:13px;font-weight:600;color:#94A3B8;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(148,163,184,.08);text-transform:capitalize}
    .periodo-label-row{display:flex;align-items:center;gap:5px;margin-bottom:8px}
    .periodo-label{font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.09em}
    .horarios-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
    @media(min-width:400px){.horarios-grid{grid-template-columns:repeat(4,1fr)}}
    .h-btn{padding:12px 4px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.12);text-align:center;background:rgba(15,23,42,.88);color:#CBD5E1;transition:all .15s;width:100%;font-family:inherit;-webkit-tap-highlight-color:transparent}
    .h-btn:hover{border-color:rgba(59,130,246,.45);color:#F8FAFC;background:rgba(59,130,246,.08)}
    .h-btn.sel{background:${aa};border-color:transparent;color:#fff;box-shadow:0 0 0 2px rgba(59,130,246,.30)}
    .nav-row{display:flex;gap:10px}
    .btn-voltar{flex:1;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:14px;padding:14px;font-size:14px;font-weight:600;color:#64748B;cursor:pointer;transition:all .15s;font-family:inherit;-webkit-tap-highlight-color:transparent}
    .btn-voltar:hover{border-color:rgba(148,163,184,.25);color:#94A3B8}
    .btn-continuar{flex:2;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;-webkit-tap-highlight-color:transparent}
    .btn-continuar.on{background:${aa};color:#fff;box-shadow:0 8px 24px rgba(59,130,246,.30)}
    .btn-continuar.off{background:rgba(59,130,246,.08);color:#334155;cursor:not-allowed}
    .btn-confirmar{flex:2;background:${aa};border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(59,130,246,.30);font-family:inherit;transition:opacity .15s;-webkit-tap-highlight-color:transparent}
    .btn-link-voltar{font-size:13px;color:#64748B;background:none;border:none;cursor:pointer;padding:4px 0;font-family:inherit;transition:color .15s}
    .btn-link-voltar:hover{color:#94A3B8}
    .input-field{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.15);border-radius:14px;padding:14px 16px;color:#F8FAFC;font-size:16px;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;font-family:inherit}
    .input-field:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
    .input-field::placeholder{color:#334155}
    .input-label{font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:8px}
    .resumo-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:18px;padding:20px 22px;margin-bottom:24px}
    .resumo-card-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:#475569;margin-bottom:16px}
    .resumo-row{display:flex;justify-content:space-between;align-items:center}
    .resumo-row-label{font-size:13px;color:#64748B}
    .resumo-row-valor{font-size:13px;font-weight:700}
    .resumo-divider{border:none;border-top:1px solid rgba(148,163,184,.07);margin:10px 0}
    .sucesso-wrap{min-height:100vh;background:radial-gradient(ellipse at top,rgba(124,58,237,.12),transparent 50%),linear-gradient(180deg,#060C18,#050B16);display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit}
    .sucesso-inner{max-width:460px;width:100%;text-align:center}
    .sucesso-icon{width:72px;height:72px;border-radius:50%;background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px}
    .sucesso-title{font-size:24px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:8px}
    .sucesso-sub{font-size:14px;color:#64748B;margin-bottom:28px;line-height:1.7}
    .sucesso-actions{display:flex;flex-direction:column;gap:10px}
    .btn-wpp{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;font-weight:700;padding:14px 28px;border-radius:14px;text-decoration:none;font-size:14px;transition:opacity .15s}
    .btn-ics{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:rgba(15,23,42,.88);color:#CBD5E1;font-weight:600;padding:14px 28px;border-radius:14px;font-size:14px;border:1px solid rgba(148,163,184,.15);cursor:pointer;font-family:inherit}
    .btn-pdf{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(59,130,246,.12));color:#818CF8;font-weight:700;padding:14px 28px;border-radius:14px;font-size:14px;border:1px solid rgba(99,102,241,.28);cursor:pointer;font-family:inherit;transition:all .18s}
    .btn-pdf:hover{background:linear-gradient(135deg,rgba(99,102,241,.28),rgba(59,130,246,.20));border-color:rgba(99,102,241,.45)}
    .btn-inicio{display:inline-flex;align-items:center;justify-content:center;background:${aa};color:#fff;font-weight:700;padding:14px 28px;border-radius:14px;text-decoration:none;font-size:14px;box-shadow:0 8px 24px rgba(59,130,246,.25)}
    .erro-msg{font-size:13px;color:#EF4444;margin-top:10px}
    .horarios-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:140px;gap:8px}
    .horarios-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px;gap:10px}
  `,[ap,aq]=(0,c.useState)(!1);if(O)return(0,b.jsxs)("div",{className:"sucesso-wrap",children:[(0,b.jsx)("style",{children:ao}),(0,b.jsxs)("div",{className:"sucesso-inner",children:[(0,b.jsx)("div",{className:"sucesso-icon",children:"✅"}),(0,b.jsx)("h1",{className:"sucesso-title",children:"Agendamento confirmado!"}),(0,b.jsx)("p",{className:"sucesso-sub",children:K?(0,b.jsxs)(b.Fragment,{children:["Obrigado, ",(0,b.jsx)("strong",{style:{color:"#F8FAFC"},children:K}),"! Seu horário foi registrado com sucesso."]}):(0,b.jsx)(b.Fragment,{children:"Seu horário foi registrado com sucesso."})}),(0,b.jsxs)("div",{className:"resumo-card",children:[(0,b.jsx)("p",{className:"resumo-card-title",children:"Resumo do agendamento"}),[{label:"Atendimento",valor:ab?.nome,cor:"#F8FAFC"},{label:"Profissional",valor:ac?.nome,cor:"#F8FAFC"},{label:"Data",valor:aj(G),cor:"#F8FAFC"},{label:"Horário",valor:I,cor:"#60A5FA"},{label:"Valor",valor:"R$ "+ab?.preco,cor:"#22C55E"}].map((a,c,d)=>(0,b.jsxs)("div",{children:[(0,b.jsxs)("div",{className:"resumo-row",children:[(0,b.jsx)("span",{className:"resumo-row-label",children:a.label}),(0,b.jsx)("span",{className:"resumo-row-valor",style:{color:a.cor},children:a.valor})]}),c<d.length-1&&(0,b.jsx)("hr",{className:"resumo-divider"})]},a.label))]}),(0,b.jsxs)("div",{className:"sucesso-actions",children:[ae&&(0,b.jsxs)("a",{href:ae,target:"_blank",rel:"noopener noreferrer",className:"btn-wpp",children:[(0,b.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:(0,b.jsx)("path",{d:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"})}),"Falar com o estabelecimento"]}),(0,b.jsx)("button",{onClick:function(){let a=["Agendamento confirmado!","","Nome: "+K,"Serviço: "+(ab?.nome||""),"Profissional: "+(ac?.nome||""),"Data: "+aj(G),"Horário: "+I,ab?.preco?"Valor: R$ "+ab.preco:"","",u?.nome_negocio||"",u?.endereco?u.endereco:"","","Agendamento feito pelo ClienteMarcado."].filter(Boolean).join("\n");navigator.clipboard.writeText(a).then(()=>{aq(!0),setTimeout(()=>aq(!1),2500)}).catch(()=>{try{let b=document.createElement("textarea");b.value=a,b.style.position="fixed",b.style.opacity="0",document.body.appendChild(b),b.select(),document.execCommand("copy"),document.body.removeChild(b),aq(!0),setTimeout(()=>aq(!1),2500)}catch(a){console.error("Erro ao copiar:",a)}})},className:"btn-ics",style:{background:ap?"rgba(34,197,94,.12)":void 0,borderColor:ap?"rgba(34,197,94,.30)":void 0,color:ap?"#22C55E":void 0},children:ap?"✓ Confirmação copiada!":"📋 Copiar confirmação"}),(0,b.jsx)("button",{onClick:function(){let a=K||"cliente",b=aj(G),c=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}),d=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),e=new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),f=u?.nome_negocio||"Estabelecimento",g=u?.endereco||"",h=(u?.whatsapp||"").replace(/\D/g,""),i=h?`(${h.slice(0,2)}) ${h.slice(2,7)}-${h.slice(7)}`:"",j=ab?.nome||"",k=ac?.nome||"",l=ab?.preco,m=l?"R$ "+Number(l).toLocaleString("pt-BR",{minimumFractionDigits:2}):"";a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");let n=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Comprovante de Agendamento - ${f}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#fff;color:#1E293B;font-size:14px;line-height:1.5}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{max-width:800px;margin:0 auto;padding:0}
  .hdr{background:linear-gradient(135deg,#1E3A5F 0%,#2D1B69 100%);padding:32px 40px;position:relative;overflow:hidden}
  .hdr::after{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.05)}
  .hdr::before{content:'';position:absolute;bottom:-40px;left:40px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04)}
  .hdr-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
  .hdr-left h1{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;margin-bottom:3px}
  .hdr-left .doc-type{font-size:13px;color:rgba(255,255,255,.65);font-weight:500;margin-bottom:12px}
  .hdr-right{text-align:right;flex-shrink:0}
  .hdr-right .doc-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .hdr-right .doc-date{font-size:14px;font-weight:700;color:#fff}
  .hdr-right .doc-time{font-size:11px;color:rgba(255,255,255,.5);margin-top:2px}
  .status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em;margin-top:10px;background:rgba(34,197,94,.18);color:#4ADE80;border:1px solid rgba(34,197,94,.35)}
  .status-dot{width:6px;height:6px;border-radius:50%;background:#4ADE80;flex-shrink:0}
  .body{padding:0 40px 40px}
  .section{margin-top:28px}
  .section-title{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #E2E8F0}
  .highlight-box{background:linear-gradient(135deg,#EFF6FF,#F5F3FF);border:1.5px solid #BFDBFE;border-radius:14px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}
  .hl-label{font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .hl-value{font-size:22px;font-weight:900;color:#1E293B;letter-spacing:-0.02em}
  .hl-sub{font-size:12px;color:#6366F1;margin-top:3px;font-weight:600}
  .valor-label{font-size:10px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;text-align:right}
  .valor-value{font-size:22px;font-weight:900;color:#15803D;text-align:right}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden}
  .info-cell{padding:14px 18px;border-bottom:1px solid #F1F5F9}
  .info-cell:nth-last-child(-n+2){border-bottom:none}
  .info-cell:nth-child(odd){border-right:1px solid #F1F5F9}
  .info-label{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .info-value{font-size:14px;font-weight:700;color:#1E293B}
  .info-value.purple{color:#6366F1}
  .info-value.blue{color:#1D4ED8}
  .info-value.green{color:#15803D}
  .estab-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 20px}
  .estab-nome{font-size:15px;font-weight:800;color:#1E293B;margin-bottom:10px}
  .estab-row{font-size:12px;color:#475569;margin-bottom:5px;display:flex;align-items:flex-start;gap:6px}
  .obs-box{background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px}
  .obs-text{font-size:12px;color:#92400E;line-height:1.6}
  .footer{margin-top:32px;padding:16px 40px;background:#F8FAFC;border-top:1.5px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center}
  .footer-brand{font-size:12px;font-weight:700;color:#6366F1}
  .footer-right{font-size:11px;color:#94A3B8;text-align:right}
  @media print{
    body{margin:0}
    .page{max-width:100%}
    @page{margin:10mm;size:A4}
  }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-inner">
      <div class="hdr-left">
        <h1>${f}</h1>
        <div class="doc-type">Comprovante de agendamento</div>
        <span class="status-badge"><span class="status-dot"></span>Agendamento confirmado</span>
      </div>
      <div class="hdr-right">
        <div class="doc-label">Emitido em</div>
        <div class="doc-date">${c}</div>
        <div class="doc-time">${d}</div>
      </div>
    </div>
  </div>

  <div class="body">

    <div class="section">
      <div class="section-title">Data e hor\u00e1rio do atendimento</div>
      <div class="highlight-box">
        <div>
          <div class="hl-label">Data e hor\u00e1rio</div>
          <div class="hl-value">${b} \u00b7 ${I}</div>
          <div class="hl-sub">${j}</div>
        </div>
        ${m?`<div><div class="valor-label">Valor</div><div class="valor-value">${m}</div></div>`:""}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informa\u00e7\u00f5es do agendamento</div>
      <div class="info-grid">
        <div class="info-cell">
          <div class="info-label">Cliente</div>
          <div class="info-value">${a}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">WhatsApp</div>
          <div class="info-value">${M||"—"}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Servi\u00e7o</div>
          <div class="info-value purple">${j}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Profissional</div>
          <div class="info-value">${k||"—"}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Data</div>
          <div class="info-value blue">${b}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Hor\u00e1rio</div>
          <div class="info-value blue">${I}</div>
        </div>
        ${m?`<div class="info-cell" style="grid-column:1/-1">
          <div class="info-label">Valor do servi\u00e7o</div>
          <div class="info-value green">${m}</div>
        </div>`:""}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Estabelecimento</div>
      <div class="estab-box">
        <div class="estab-nome">${f}</div>
        ${g?`<div class="estab-row"><span>\ud83d\udccd</span><span>${g}</span></div>`:""}
        ${i?`<div class="estab-row"><span>\ud83d\udcf1</span><span>${i}</span></div>`:""}
      </div>
    </div>

    <div class="section">
      <div class="obs-box">
        <div class="obs-text">\u2139\ufe0f Em caso de d\u00favidas ou necessidade de remarcar\u00e7\u00e3o, entre em contato com o estabelecimento com anteced\u00eancia.</div>
      </div>
    </div>

    <div class="section" style="margin-top:36px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
        <div>
          <div style="border-top:1.5px solid #CBD5E1;padding-top:8px">
            <div style="font-size:11px;color:#94A3B8">${f}</div>
            <div style="font-size:10px;color:#CBD5E1;margin-top:2px">Assinatura / Carimbo</div>
          </div>
        </div>
        <div>
          <div style="border-top:1.5px solid #CBD5E1;padding-top:8px">
            <div style="font-size:11px;color:#94A3B8">${a}</div>
            <div style="font-size:10px;color:#CBD5E1;margin-top:2px">Assinatura do cliente</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="footer-brand">ClienteMarcado \u00b7 Gerado em ${e}</div>
    <div class="footer-right">Documento n\u00e3o possui validade jur\u00eddica sem assinatura</div>
  </div>
</div>
</body>
</html>`,o=document.createElement("iframe");o.style.position="fixed",o.style.right="0",o.style.bottom="0",o.style.width="0",o.style.height="0",o.style.border="0",o.style.opacity="0",document.body.appendChild(o);let p=o.contentDocument||o.contentWindow?.document;p?(p.open(),p.write(n),p.close(),setTimeout(()=>{o.contentWindow?.focus(),o.contentWindow?.print(),setTimeout(()=>{document.body.contains(o)&&document.body.removeChild(o)},2e3)},600)):document.body.removeChild(o)},className:"btn-pdf",children:"📄 Baixar comprovante"}),(0,b.jsx)(f.default,{href:"/"+t,className:"btn-inicio",children:"Voltar ao início"})]})]})]});let ar=()=>(0,b.jsxs)("div",{className:"steps-wrap",children:[(0,b.jsx)("div",{className:"steps-track",children:[1,2,3,4].map(a=>(0,b.jsxs)("div",{style:{display:"flex",alignItems:"center",flex:a<4?1:"none"},children:[(0,b.jsx)("div",{className:`step-dot ${A>a?"done":A===a?"active":"idle"}`,children:A>a?"✓":a}),a<4&&(0,b.jsx)("div",{className:"step-line",style:{background:A>a?"linear-gradient(90deg,#3B82F6,#7C3AED)":"rgba(148,163,184,.10)"}})]},a))}),(0,b.jsx)("div",{className:"step-labels",children:an.map((a,c)=>(0,b.jsx)("span",{className:"step-label",style:{fontWeight:A===c+1?700:500,color:A===c+1?"#60A5FA":"#334155",flex:c<3?1:"none",textAlign:0===c?"left":3===c?"right":"center"},children:a},a))})]});return(0,b.jsxs)("main",{className:"page",children:[(0,b.jsx)("style",{children:ao}),(0,b.jsxs)("div",{className:"header",children:[(0,b.jsx)(f.default,{href:"/"+t,className:"header-back",children:"← Voltar"}),(0,b.jsx)("p",{className:"header-title",children:u?.nome_negocio}),(0,b.jsx)("div",{className:"header-spacer"})]}),1===A&&(0,b.jsxs)("div",{className:"container",children:[(0,b.jsx)(ar,{}),(0,b.jsx)("h2",{className:"section-title",children:"Selecione o atendimento"}),(0,b.jsx)("p",{className:"section-sub",children:"Escolha um serviço, procedimento ou consulta para continuar."}),(0,b.jsx)("div",{className:"servico-list",children:w.map(a=>{let c;return(0,b.jsxs)("button",{onClick:()=>{D(a.id),B(2)},className:"servico-card"+(C===a.id?" sel":""),children:[(0,b.jsx)("div",{className:"servico-accent"}),(0,b.jsx)("div",{className:"servico-icon",style:{color:"#60A5FA"},children:(c=[a.nome,a.categoria||"",a.descricao||""].join(" ").toLowerCase(),/corte|barba|cabelo|barbearia|cabeleirei|platina|mecha|progressiva|alisam|relaxam/.test(c)?(0,b.jsx)(k,{size:20}):/colora|escova|hidrataç|hidratac|mechas|luzes|reflexo|tinta/.test(c)?(0,b.jsx)(l.Sparkles,{size:20}):/retorno|reavalia|acompan|revisão|revisao|follow/.test(c)?(0,b.jsx)(o,{size:20}):/avalia|consul|diagnos|triagem|primeira.*vez|anamese|anamnese/.test(c)?(0,b.jsx)(n.ClipboardCheck,{size:20}):/orçamento|orcamento|proposta|plano.*trat|plano.*paga/.test(c)?(0,b.jsx)(p,{size:20}):/limpeza|clarea|branquea|peeling|esfoliação|esfoliacao|profilax/.test(c)?(0,b.jsx)(l.Sparkles,{size:20}):/restaur|obtura|canal|endodon|cirur|extração|extracao|implant|enxerto/.test(c)?(0,b.jsx)(r,{size:20}):/prótese|protese|reabilit|coroa|faceta|lente|inlay|onlay/.test(c)?(0,b.jsx)(s,{size:20}):/estet|facial|botox|harmoniz|preench|massag|drenag|corporal|sobrancelha|depilaç|depilac/.test(c)?(0,b.jsx)(q,{size:20}):/odonto|dent|bucal|oral/.test(c)?(0,b.jsx)(m.ClipboardList,{size:20}):(0,b.jsx)(o,{size:20}))}),(0,b.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,b.jsx)("p",{className:"servico-nome",children:a.nome}),(0,b.jsx)("p",{className:"servico-desc",children:a.descricao||"Selecione para ver profissionais e horários disponíveis"}),(0,b.jsxs)("div",{className:"servico-meta",children:[a.duracao_minutos&&(0,b.jsxs)("span",{className:"servico-dur",children:[(0,b.jsxs)("svg",{width:"11",height:"11",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,b.jsx)("polyline",{points:"12 6 12 12 16 14"})]}),a.duracao_minutos," min"]}),a.duracao_minutos&&a.preco&&(0,b.jsx)("span",{className:"servico-meta-sep"}),a.preco&&(0,b.jsxs)("span",{className:"servico-preco",children:["R$ ",a.preco]})]})]}),(0,b.jsx)("div",{className:"servico-arrow",children:"›"})]},a.id)})})]}),2===A&&(0,b.jsxs)("div",{className:"container",children:[(0,b.jsx)(ar,{}),(0,b.jsx)("h2",{className:"section-title",children:"Escolha o profissional"}),(0,b.jsx)("p",{className:"section-sub",children:"Com quem deseja ser atendido?"}),(0,b.jsx)("div",{className:"prof-grid",children:y.map(a=>(0,b.jsxs)("button",{onClick:()=>{F(a.id),B(3)},className:"prof-card"+(E===a.id?" sel":""),children:[a.foto_url?(0,b.jsx)("img",{src:a.foto_url,alt:a.nome,className:"prof-avatar-img",style:{border:E===a.id?"2px solid #3B82F6":"2px solid rgba(148,163,184,.12)"}}):(0,b.jsx)("div",{className:"prof-avatar-letra",style:{border:E===a.id?"2px solid #3B82F6":"2px solid rgba(59,130,246,.15)"},children:a.nome.charAt(0).toUpperCase()}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"prof-nome",children:a.nome}),(0,b.jsx)("p",{className:"prof-cargo",children:a.cargo||"Profissional"})]})]},a.id))}),(0,b.jsx)("button",{onClick:()=>B(1),className:"btn-link-voltar",children:"← Voltar"})]}),3===A&&(0,b.jsxs)("div",{className:"container-wide",children:[(0,b.jsx)(ar,{}),(0,b.jsx)("h2",{className:"section-title",children:"Data e horário"}),(0,b.jsx)("p",{className:"section-sub",children:"Escolha o melhor horário disponível"}),(0,b.jsx)("div",{className:"resumo-strip",children:[{label:"Atendimento",valor:ab?.nome,cor:"#F8FAFC"},{label:"Profissional",valor:ac?.nome,cor:"#F8FAFC"},{label:"Duração",valor:(ab?.duracao_minutos||30)+" min",cor:"#F8FAFC"},{label:"Valor",valor:"R$ "+ab?.preco,cor:"#22C55E"}].map(a=>(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"resumo-label",children:a.label}),(0,b.jsx)("p",{className:"resumo-valor",style:{color:a.cor},children:a.valor})]},a.label))}),(0,b.jsxs)("div",{className:"etapa3-cols",children:[(0,b.jsxs)("div",{className:"cal-wrap",children:[(0,b.jsxs)("div",{className:"cal-header",children:[(0,b.jsx)("button",{className:"cal-nav",onClick:()=>V(new Date(U.getFullYear(),U.getMonth()-1,1)),children:"‹"}),(0,b.jsx)("p",{className:"cal-mes",children:U.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}),(0,b.jsx)("button",{className:"cal-nav",onClick:()=>V(new Date(U.getFullYear(),U.getMonth()+1,1)),children:"›"})]}),(0,b.jsx)("div",{className:"cal-dow",children:["D","S","T","Q","Q","S","S"].map((a,c)=>(0,b.jsx)("div",{className:"cal-dow-label",children:a},c))}),(0,b.jsxs)("div",{className:"cal-days",children:[Array.from({length:ah}).map((a,c)=>(0,b.jsx)("div",{},"e"+c)),Array.from({length:ag}).map((a,c)=>{let d,e=c+1,f=U.getFullYear()+"-"+String(U.getMonth()+1).padStart(2,"0")+"-"+String(e).padStart(2,"0"),g=(d=new Date(U.getFullYear(),U.getMonth(),e))>=af&&ai.includes(d.getDay()),h=G===f,i=f===ad,j="dia";return h?j+=" sel":g&&i?j+=" disp hoje":g&&(j+=" disp"),(0,b.jsx)("button",{disabled:!g,onClick:()=>g&&H(f),className:j,children:e},e)})]})]}),(0,b.jsxs)("div",{className:"horarios-wrap",children:[!G&&(0,b.jsxs)("div",{className:"horarios-placeholder",children:[(0,b.jsx)("span",{style:{fontSize:"32px",opacity:.2},children:"📅"}),(0,b.jsxs)("p",{style:{fontSize:"13px",color:"#334155",textAlign:"center",lineHeight:1.6},children:["Selecione uma data",(0,b.jsx)("br",{}),"para ver os horários"]})]}),G&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("p",{className:"horarios-data-label",children:function(a){let[b,c,d]=a.split("-");return new Date(parseInt(b),parseInt(c)-1,parseInt(d)).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}(G)}),Y&&(0,b.jsx)("div",{className:"horarios-empty",children:(0,b.jsx)("p",{style:{fontSize:"13px",color:"#64748B"},children:"Buscando horários..."})}),!Y&&0===W.length&&(0,b.jsxs)("div",{className:"horarios-empty",children:[(0,b.jsx)("span",{style:{fontSize:"28px",opacity:.3},children:"😔"}),(0,b.jsxs)("p",{style:{fontSize:"13px",color:"#64748B",textAlign:"center",lineHeight:1.6},children:["Nenhum horário disponível",(0,b.jsx)("br",{}),"nesta data."]})]}),!Y&&W.length>0&&(0,b.jsx)("div",{children:[{label:"Manhã",icon:(0,b.jsx)(h,{size:11,color:"#475569"}),lista:ak},{label:"Tarde",icon:(0,b.jsx)(i.Clock,{size:11,color:"#475569"}),lista:al},{label:"Noite",icon:(0,b.jsx)(j,{size:11,color:"#475569"}),lista:am}].filter(a=>a.lista.length>0).map(a=>(0,b.jsxs)("div",{style:{marginBottom:"16px"},children:[(0,b.jsxs)("div",{className:"periodo-label-row",children:[a.icon,(0,b.jsx)("span",{className:"periodo-label",children:a.label})]}),(0,b.jsx)("div",{className:"horarios-grid",children:a.lista.map(a=>(0,b.jsx)("button",{onClick:()=>J(a),className:"h-btn"+(I===a?" sel":""),children:a},a))})]},a.label))})]})]})]}),(0,b.jsxs)("div",{className:"nav-row",children:[(0,b.jsx)("button",{onClick:()=>B(2),className:"btn-voltar",children:"← Voltar"}),(0,b.jsx)("button",{onClick:()=>{G&&I?(R(""),B(4)):R("Selecione data e horário.")},disabled:!G||!I,className:"btn-continuar "+(G&&I?"on":"off"),children:"Continuar →"})]}),Q&&(0,b.jsx)("p",{className:"erro-msg",children:Q})]}),4===A&&(0,b.jsxs)("div",{className:"container",children:[(0,b.jsx)(ar,{}),(0,b.jsx)("h2",{className:"section-title",children:"Seus dados"}),(0,b.jsx)("p",{className:"section-sub",children:"Finalize seu agendamento preenchendo seus dados"}),(0,b.jsxs)("div",{className:"resumo-card",children:[(0,b.jsx)("p",{className:"resumo-card-title",children:"Resumo do agendamento"}),[{label:"Atendimento",valor:ab?.nome,cor:"#F8FAFC"},{label:"Profissional",valor:ac?.nome,cor:"#F8FAFC"},{label:"Data",valor:aj(G),cor:"#F8FAFC"},{label:"Horário",valor:I,cor:"#60A5FA"},{label:"Valor",valor:"R$ "+ab?.preco,cor:"#22C55E"}].map((a,c,d)=>(0,b.jsxs)("div",{children:[(0,b.jsxs)("div",{className:"resumo-row",children:[(0,b.jsx)("span",{className:"resumo-row-label",children:a.label}),(0,b.jsx)("span",{className:"resumo-row-valor",style:{color:a.cor},children:a.valor})]}),c<d.length-1&&(0,b.jsx)("hr",{className:"resumo-divider"})]},a.label))]}),(0,b.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"18px",marginBottom:"24px"},children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"input-label",children:"Seu nome *"}),(0,b.jsx)("input",{type:"text",placeholder:"Ex: Maria Silva",value:K,onChange:a=>L(a.target.value),className:"input-field"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"input-label",children:"WhatsApp *"}),(0,b.jsx)("input",{type:"tel",placeholder:"(11) 99999-9999",value:M,onChange:a=>{let b;return N((b=a.target.value.replace(/\D/g,"").slice(0,11)).length>10?"("+b.slice(0,2)+") "+b.slice(2,7)+"-"+b.slice(7):b.length>6?"("+b.slice(0,2)+") "+b.slice(2,6)+"-"+b.slice(6):b.length>2?"("+b.slice(0,2)+") "+b.slice(2):b.length>0?"("+b:"")},className:"input-field"}),(0,b.jsx)("p",{style:{fontSize:"12px",color:"#475569",marginTop:"6px"},children:"Usado apenas para contato sobre seu agendamento."}),(0,b.jsx)("p",{style:{fontSize:"12px",color:"#334155",marginTop:"12px",textAlign:"center",lineHeight:1.6},children:"🔒 Seus dados serão usados apenas para confirmar este agendamento."})]})]}),Q&&(0,b.jsx)("p",{className:"erro-msg",style:{marginBottom:"12px"},children:Q}),(0,b.jsxs)("div",{className:"nav-row",children:[(0,b.jsx)("button",{onClick:()=>B(3),className:"btn-voltar",children:"← Voltar"}),(0,b.jsx)("button",{onClick:_,disabled:S,className:"btn-confirmar",style:{opacity:S?.7:1},children:S?"Confirmando...":"✓ Confirmar agendamento"})]})]})]})}],80357)}];

//# sourceMappingURL=app_%5Bslug%5D_agendar_page_tsx_06zdy_m._.js.map