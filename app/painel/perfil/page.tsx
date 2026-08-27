'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { Copy, Check, ExternalLink, ChevronDown, ChevronUp, UploadCloud, ArrowUp, ArrowDown } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const AV='linear-gradient(135deg,rgba(236,72,153,.95),rgba(139,92,246,.95))'

const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

const TEMA_CORES: Record<string, {primary:string;secondary:string;accent:string;border:string;bg:string;text:string;btnText:string}> = {
  modelo1: {primary:'#FF4FA3',secondary:'#D946EF',accent:'#EC4899',border:'rgba(255,79,163,.38)', bg:'rgba(255,79,163,.10)', text:'#FF8FC4', btnText:'#fff'},
  modelo2: {primary:'#EDEDF0',secondary:'#A1A1AA',accent:'#D4D4D8',border:'rgba(237,237,240,.30)', bg:'rgba(237,237,240,.10)', text:'#EDEDF0', btnText:'#0A0A0B'},
  modelo3: {primary:'#E8A672',secondary:'#B87D4E',accent:'#F0C29A',border:'rgba(232,166,114,.34)', bg:'rgba(232,166,114,.10)', text:'#F0C29A', btnText:'#1A0F06'},
  modelo4: {primary:'#D4AF37',secondary:'#9C7A2F',accent:'#F0D98A',border:'rgba(212,175,55,.38)', bg:'rgba(212,175,55,.10)', text:'#F0D98A', btnText:'#1A140A'},
  modelo5: {primary:'#C97B93',secondary:'#8B5D73',accent:'#DDA0B3',border:'rgba(201,123,147,.38)',bg:'rgba(201,123,147,.10)',text:'#DDA0B3', btnText:'#fff'},
  modelo6: {primary:'#5FA8A0',secondary:'#3D7871',accent:'#84C2BB',border:'rgba(95,168,160,.38)', bg:'rgba(95,168,160,.10)', text:'#84C2BB', btnText:'#fff'},
  modelo7: {primary:'#E83E8C',secondary:'#C23F6C',accent:'#F06BA8',border:'rgba(232,62,140,.38)', bg:'rgba(232,62,140,.10)', text:'#F06BA8', btnText:'#fff'},
  modelo8: {primary:'#C2185B',secondary:'#9D174D',accent:'#E83E8C',border:'rgba(194,24,91,.42)',bg:'rgba(194,24,91,.12)',text:'#E83E8C', btnText:'#fff'},
  modelo9: {primary:'#B69AF0',secondary:'#8B6FD9',accent:'#D4C2FF',border:'rgba(182,154,240,.38)',bg:'rgba(182,154,240,.10)',text:'#D4C2FF', btnText:'#fff'},
  modelo10:{primary:'#A67C52',secondary:'#7A5A3A',accent:'#C9A578',border:'rgba(166,124,82,.38)', bg:'rgba(166,124,82,.10)', text:'#C9A578', btnText:'#fff'},
  modelo11:{primary:'#D4A574',secondary:'#A67849',accent:'#E8C39E',border:'rgba(212,165,116,.38)',bg:'rgba(212,165,116,.10)',text:'#E8C39E', btnText:'#2A1408'},
  modelo12:{primary:'#3B82F6',secondary:'#2563EB',accent:'#60A5FA',border:'rgba(59,130,246,.38)',bg:'rgba(59,130,246,.10)',text:'#60A5FA', btnText:'#fff'},
  modelo13:{primary:'#FF1744',secondary:'#D6001C',accent:'#FF6B85',border:'rgba(255,23,68,.42)',bg:'rgba(255,23,68,.14)',text:'#FF6B85', btnText:'#fff'},
  modelo14:{primary:'#00FF85',secondary:'#00C46B',accent:'#6FFFB0',border:'rgba(0,255,133,.40)',bg:'rgba(0,255,133,.14)',text:'#6FFFB0', btnText:'#042A16'},
  modelo15:{primary:'#00BFFF',secondary:'#0096D6',accent:'#66D9FF',border:'rgba(0,191,255,.40)',bg:'rgba(0,191,255,.14)',text:'#66D9FF', btnText:'#02202E'},
  modelo16:{primary:'#FF2DAA',secondary:'#D6008C',accent:'#FF7ACB',border:'rgba(255,45,170,.42)',bg:'rgba(255,45,170,.14)',text:'#FF7ACB', btnText:'#fff'},
  modelo17:{primary:'#FF7A00',secondary:'#E86200',accent:'#FFB066',border:'rgba(255,122,0,.42)',bg:'rgba(255,122,0,.14)',text:'#FFB066', btnText:'#2E1400'},
  modelo18:{primary:'#FFD700',secondary:'#E6BE00',accent:'#FFEB80',border:'rgba(255,215,0,.40)',bg:'rgba(255,215,0,.14)',text:'#FFEB80', btnText:'#2E2600'},
}

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.banner-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
.banner-thumb{position:relative;border-radius:10px;overflow:hidden;border:1.5px solid #2A1A2F;cursor:pointer;aspect-ratio:16/9;background:#18101B;transition:all .18s;padding:0}
.banner-thumb:hover{border-color:rgba(236,72,153,.45);transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.35)}
.banner-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.banner-thumb.sel{border-color:#EC4899;box-shadow:0 0 0 2px rgba(236,72,153,.28),0 8px 20px rgba(236,72,153,.18)}
.banner-sel-badge{position:absolute;top:5px;right:5px;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:.02em;box-shadow:0 2px 8px rgba(236,72,153,.4)}
select option{background:#120A14;color:#F8F4F7}
.sb{width:220px;min-height:100vh;background:radial-gradient(circle at top left,rgba(139,92,246,.14),transparent 32%),linear-gradient(180deg,#070F1D,#08060A);border-right:1px solid #2A1A2F;display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid #2A1A2F;display:flex;align-items:center;gap:8px}
.sb-ic{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 22px rgba(236,72,153,.28)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#B8AAB8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(236,72,153,.10);color:#F8F4F7;border-color:rgba(236,72,153,.24)}
.nl.on{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;font-weight:700;box-shadow:0 0 26px rgba(236,72,153,.28),inset 0 1px 0 rgba(255,255,255,.10);border-color:rgba(255,255,255,.10)}
.sb-foot{padding:10px;border-top:1px solid #2A1A2F}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid #2A1A2F;position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#08060A);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid #2A1A2F}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.20),transparent 32%),radial-gradient(circle at top right,rgba(236,72,153,.14),transparent 28%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1060px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.08),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:24px;margin-bottom:16px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.inp{width:100%;background:rgba(24,16,27,.88);border:1.5px solid #2A1A2F;border-radius:12px;padding:0 14px;height:48px;font-size:14px;color:#F8F4F7;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(236,72,153,.55);box-shadow:0 0 0 3px rgba(236,72,153,.12)}
.lbl{font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dia-btn{border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:inherit;border:1.5px solid #2A1A2F;background:rgba(24,16,27,.72);color:#B8AAB8}
.dia-btn.on{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;border-color:transparent;box-shadow:0 0 14px rgba(236,72,153,.28)}
.tema-card{background:rgba(24,16,27,.72);border:1.5px solid #2A1A2F;border-radius:14px;padding:14px;cursor:pointer;transition:all .18s;text-align:left;font-family:inherit;width:100%}
.tema-card.on{border-color:rgba(139,92,246,.55);background:rgba(139,92,246,.10);box-shadow:0 0 18px rgba(139,92,246,.18)}
.btn-verpag:hover{border-color:rgba(236,72,153,.32)!important;color:#F8F4F7!important}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .fg2{grid-template-columns:1fr!important}
  .topo-r{flex-direction:column!important;gap:8px!important}
  .link-btns{flex-direction:column!important}
  .link-btns a,.link-btns button{width:100%!important;justify-content:center!important}
  .temas-grid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){.temas-grid{grid-template-columns:1fr!important}}
`

export default function Perfil(){
  const [userId,setUserId]=useState('')
  const [semPerfil,setSemPerfil]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [promoAtiva,setPromoAtiva]=useState(false)
  // A UI de "Promoção em destaque" foi substituída por Destaques + Links Rápidos.
  // Mantemos todo o estado/lógica (nada é apagado do banco), apenas ocultamos a seção antiga.
  const MOSTRAR_PROMOCAO_ANTIGA = false as boolean
  // Destaques comeca aberto (primeira coisa que a pessoa costuma preencher), Links comeca fechado
  // pra reduzir a sensacao de pagina infinita. Pode expandir/recolher a qualquer momento.
  const [promoTitulo,setPromoTitulo]=useState('')
  const [promoDesc,setPromoDesc]=useState('')
  const [promoPrecoAnt,setPromoPrecoAnt]=useState('')
  const [promoPrecoNovo,setPromoPrecoNovo]=useState('')
  const [promoBotao,setPromoBotao]=useState('Agendar promoção')
  const [promoObs,setPromoObs]=useState('')
  const [promoInicio,setPromoInicio]=useState('')
  const [promoFim,setPromoFim]=useState('')
  const [msg,setMsg]=useState('')
  const [copied,setCopied]=useState(false)

  const [nome,setNome]=useState('')
  const [slug,setSlug]=useState('')
  const [end,setEnd]=useState('')
  const [wpp,setWpp]=useState('')
  const [insta,setInsta]=useState('')
  const [cidade,setCidade]=useState('')
  const [desc,setDesc]=useState('')
  const [capUrl,setCapUrl]=useState('')
  const [bannerMobilePosicao,setBannerMobilePosicao]=useState('padrao')
  const [bannerMobileZoom,setBannerMobileZoom]=useState('normal')
  const [publicTheme,setPublicTheme]=useState('modelo2')

  const [diasAtivos,setDiasAtivos]=useState([false,true,true,true,true,true,true])
  const [horarios,setHorarios]=useState(DIAS.map(()=>({abertura:'08:00',fechamento:'18:00'})))
  const [intervalo,setIntervalo]=useState('30 min')
  const [abertura,setAbertura]=useState('08:00')
  const [fechamento,setFechamento]=useState('18:00')
  const [antecedencia,setAntecedencia]=useState('Sem restrição')

  const [fotoPerfilUrl,setFotoPerfilUrl]=useState('')
  const [descCurta,setDescCurta]=useState('')
  const [tituloBotaoAgenda,setTituloBotaoAgenda]=useState('')
  const [mostrarAgenda,setMostrarAgenda]=useState(true)
  const [mostrarServicos,setMostrarServicos]=useState(true)
  const [mostrarEquipe,setMostrarEquipe]=useState(true)
  const [mostrarPorQueAgendar,setMostrarPorQueAgendar]=useState(true)
  const [mostrarContato,setMostrarContato]=useState(true)
  const fotoRef=useRef<HTMLInputElement>(null)

  const [destaques,setDestaques]=useState<any[]>([])
  const [links,setLinks]=useState<any[]>([])
  const [videos,setVideos]=useState<any[]>([])
  const [eventos,setEventos]=useState<any[]>([])
  const [catalogoItens,setCatalogoItens]=useState<any[]>([])
  const ORDEM_PADRAO_SECOES=['destaques','links','agenda','catalogo','videos']
  const [ordemSecoes,setOrdemSecoes]=useState<string[]>(ORDEM_PADRAO_SECOES)
  // Acesso da conta (transferir e-mail de login / reenviar link de senha)
  const [emailAtual,setEmailAtual]=useState('')
  const [souProfissional,setSouProfissional]=useState(false)
  const [acessoAberto,setAcessoAberto]=useState(false)
  const [novoEmailAcesso,setNovoEmailAcesso]=useState('')
  const [transferindo,setTransferindo]=useState(false)
  const [transferMsg,setTransferMsg]=useState('')
  const [transferOk,setTransferOk]=useState(false)

  const tc = TEMA_CORES[publicTheme] ?? TEMA_CORES.modelo2

  // Guarda o ultimo user_id conhecido fora do state, pra comparar dentro do listener
  // sem sofrer de closure desatualizada (o listener e registrado uma vez so, no mount).
  const ultimoUserIdRef=useRef<string|null>(null)

  // Reset TOTAL do estado do perfil. Chamado sempre antes de um novo load() e sempre
  // que a sessao muda (troca de conta, logout/login em outra aba etc). Garante que
  // a tela nunca continue mostrando dados de uma sessao anterior.
  function resetPerfilState(){
    setUserId('')
    setSemPerfil(false)
    setEmailAtual('')
    setSouProfissional(false)
    setNome('')
    setSlug('')
    setEnd('')
    setWpp('')
    setInsta('')
    setCidade('')
    setDesc('')
    setCapUrl('')
    setBannerMobilePosicao('padrao')
    setBannerMobileZoom('normal')
    setDiasAtivos([false,true,true,true,true,true,true])
    setHorarios(DIAS.map(()=>({abertura:'08:00',fechamento:'18:00'})))
    setIntervalo('30 min')
    setAbertura('08:00')
    setFechamento('18:00')
    setAntecedencia('Sem restrição')
    setPublicTheme('modelo2')
    setPromoAtiva(false)
    setPromoTitulo('')
    setPromoDesc('')
    setPromoPrecoAnt('')
    setPromoPrecoNovo('')
    setPromoBotao('Agendar promoção')
    setPromoObs('')
    setPromoInicio('')
    setPromoFim('')
    setFotoPerfilUrl('')
    setDescCurta('')
    setTituloBotaoAgenda('')
    setMostrarAgenda(true)
    setMostrarServicos(true)
    setMostrarEquipe(true)
    setMostrarPorQueAgendar(true)
    setMostrarContato(true)
    setDestaques([])
    setLinks([])
    setVideos([])
    setNovoEmailAcesso('')
    setTransferMsg('')
    setTransferOk(false)
    setMsg('')
  }

  useEffect(()=>{
    load()
    // Detecta troca de sessao (login/logout em outra aba, token trocado, usuario mudou)
    // e reseta/recarrega tudo do zero pra nunca deixar dado antigo na tela.
    const {data:listener}=supabase.auth.onAuthStateChange((event,session)=>{
      const novoId=session?.user?.id||null
      if(event==='SIGNED_OUT'||!novoId){
        ultimoUserIdRef.current=null
        resetPerfilState()
        window.location.href='/login'
        return
      }
      if(novoId!==ultimoUserIdRef.current){
        // Sessao mudou de verdade (troca de conta) - reseta tudo e recarrega do zero
        ultimoUserIdRef.current=novoId
        resetPerfilState()
        load()
      }
      // Se for so TOKEN_REFRESHED do mesmo usuario, nao faz nada (evita recarregar
      // a pagina toda enquanto a pessoa esta digitando, por exemplo)
    })
    return ()=>{listener.subscription.unsubscribe()}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  async function load(){
    resetPerfilState()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){resetPerfilState();window.location.href='/login';return}
    ultimoUserIdRef.current=user.id
    setUserId(user.id)
    setEmailAtual(user.email||'')

    // Esconde "Acesso da conta" se quem esta logado for uma profissional com login individual (nao a dona do negocio)
    const {data:{session}}=await supabase.auth.getSession()
    if(session?.access_token){
      try{
        const res=await fetch('/api/equipe/meu-vinculo',{headers:{'Authorization':'Bearer '+session.access_token}})
        const vinculo=await res.json()
        if(res.ok && vinculo?.role==='profissional' && vinculo?.ativo) setSouProfissional(true)
      }catch(e){console.warn('Erro ao verificar vinculo de equipe:',e)}
    }

    const {data:p,error}=await supabase.from('perfis').select('*').eq('user_id',user.id).maybeSingle()
    if(error){console.error('Erro ao carregar perfil:',error)}

    if(!p){
      // Nenhum perfil pra esse user_id: NUNCA reaproveitar dado antigo, tela fica limpa/segura
      setSemPerfil(true)
      return
    }
    setSemPerfil(false)

    setNome(p.nome_negocio||'')
      setSlug(p.slug||'')
      setEnd(p.endereco||'')
      setWpp(p.whatsapp||'')
      setInsta(p.instagram||'')
      setCidade(p.cidade||p.cidade_estado||'')
      setDesc(p.descricao||'')
      setCapUrl(p.capa_url||p.imagem_capa||'')
      setBannerMobilePosicao(p.banner_mobile_position||'padrao')
      setBannerMobileZoom(p.banner_mobile_zoom||'normal')
      if(p.dias_ativos) setDiasAtivos(p.dias_ativos)
      if(p.horarios) setHorarios(p.horarios)
      if(p.intervalo||p.intervalo_agenda) setIntervalo(p.intervalo||p.intervalo_agenda||'30 min')
      if(p.abertura_geral) setAbertura(p.abertura_geral)
      if(p.fechamento_geral) setFechamento(p.fechamento_geral)
      if(p.antecedencia||p.antecedencia_minima) setAntecedencia(p.antecedencia||p.antecedencia_minima||'Sem restrição')
      if(p.public_theme||p.tema_publico||p.tema_cor) setPublicTheme(resolverTema(p.public_theme||p.tema_publico||p.tema_cor||'modelo2'))
      if(p.promocao_ativa!==undefined&&p.promocao_ativa!==null) setPromoAtiva(p.promocao_ativa)
      if(p.promocao_titulo) setPromoTitulo(p.promocao_titulo)
      if(p.promocao_descricao) setPromoDesc(p.promocao_descricao)
      if(p.promocao_preco_antigo) setPromoPrecoAnt(String(p.promocao_preco_antigo))
      if(p.promocao_preco_novo) setPromoPrecoNovo(String(p.promocao_preco_novo))
      if(p.promocao_botao_texto) setPromoBotao(p.promocao_botao_texto)
      if(p.promocao_observacao) setPromoObs(p.promocao_observacao)
      if(p.promocao_data_inicio) setPromoInicio(p.promocao_data_inicio)
      if(p.promocao_data_fim) setPromoFim(p.promocao_data_fim)

      // Campos novos da Página Profissional — fallback seguro se ainda não existirem no perfil
      setFotoPerfilUrl(p.foto_perfil_url||'')
      setDescCurta(p.pagina_descricao_curta||'')
      setTituloBotaoAgenda(p.pagina_titulo_botao_agenda||'')
      setMostrarAgenda(p.pagina_mostrar_agenda!==false)
      const ordemSalva=p.ordem_secoes_publicas
      const ordemValida=Array.isArray(ordemSalva)&&ordemSalva.length===ORDEM_PADRAO_SECOES.length&&ORDEM_PADRAO_SECOES.every(s=>ordemSalva.includes(s))
      setOrdemSecoes(ordemValida?ordemSalva:ORDEM_PADRAO_SECOES)
      setMostrarServicos(p.pagina_mostrar_servicos!==false)
      setMostrarEquipe(p.pagina_mostrar_equipe!==false)
      setMostrarPorQueAgendar(p.pagina_mostrar_por_que_agendar!==false)
      setMostrarContato(p.pagina_mostrar_contato!==false)

    const [{data:dst},{data:lnk},{data:vid},{data:evt},{data:cat}]=await Promise.all([
      supabase.from('pagina_destaques').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('pagina_links').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('pagina_videos').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('pagina_eventos').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('pagina_catalogo_itens').select('*').eq('user_id',user.id).order('ordem'),
    ])
    if(dst) setDestaques(dst)
    if(lnk) setLinks(lnk)
    if(vid) setVideos(vid)
    if(evt) setEventos(evt)
    if(cat) setCatalogoItens(cat)
  }

  // Cria um perfil novo e limpo pro usuario logado (usado no botao "Criar meu perfil",
  // quando o usuario ainda nao tem nenhum perfil vinculado ao seu user_id)
  async function criarPerfilNovo(){
    if(!userId)return
    // Confirma que a sessao ainda e a mesma antes de criar - nunca cria perfil pra
    // um user_id que nao seja o da sessao ativa agora.
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de continuar.');return}

    // Reconfere que ainda nao existe (evita duplicar se outra aba/tela ja criou nesse meio-tempo)
    const {data:jaExiste}=await supabase.from('perfis').select('id').eq('user_id',userId).maybeSingle()
    if(jaExiste){await load();return}

    const metadata:any=user.user_metadata||{}
    const nomeNegocio=metadata.nome_negocio||metadata.nome_usuario||'Meu negócio'
    const planoMeta=metadata.plano_tipo
    const planoTipo=planoMeta==='equipe'?'equipe':planoMeta==='minipage'?'minipage':'essencial'
    const slugBase='negocio'+userId.replace(/-/g,'').slice(0,8)

    const {error}=await supabase.from('perfis').insert({user_id:userId,nome_negocio:nomeNegocio,slug:slugBase,plano_tipo:planoTipo})
    if(error){setMsg('Erro ao criar perfil: '+error.message);return}
    await load()
  }

  // Confirma que a sessao REAL e ativa agora e a mesma que a tela esta mostrando,
  // antes de qualquer escrita no banco. Evita salvar/excluir dados da conta errada
  // se a sessao mudou por baixo da pagina (outra aba, logout/login etc).
  async function validarSessaoAtual(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){
      resetPerfilState()
      window.location.href='/login'
      return false
    }
    if(user.id!==userId){
      resetPerfilState()
      setMsg('A sessão mudou. Recarregue a página antes de salvar.')
      return false
    }
    return true
  }

  async function salvar(){
    if(!(await validarSessaoAtual()))return
    if(!nome.trim()||!slug.trim()){setMsg('Nome e link são obrigatórios.');return}
    setSalvando(true)
    const slugFmt=slug.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')

    const payloadSeguro:any={
      nome_negocio:nome.trim(),
      slug:slugFmt,
      public_theme:publicTheme,
    }
    if(end!==undefined) payloadSeguro.endereco=end.trim()||null
    if(wpp!==undefined) payloadSeguro.whatsapp=wpp.replace(/\D/g,'')||null
    if(insta!==undefined) payloadSeguro.instagram=insta.trim()||null
    if(cidade!==undefined) payloadSeguro.cidade=cidade.trim()||null
    if(desc!==undefined) payloadSeguro.descricao=desc.trim()||null
    if(capUrl!==undefined) payloadSeguro.capa_url=capUrl||null
    payloadSeguro.banner_mobile_position=bannerMobilePosicao
    payloadSeguro.banner_mobile_zoom=bannerMobileZoom

    payloadSeguro.foto_perfil_url=fotoPerfilUrl||null
    payloadSeguro.pagina_descricao_curta=descCurta.trim()||null
    payloadSeguro.pagina_titulo_botao_agenda=tituloBotaoAgenda.trim()||null
    payloadSeguro.pagina_mostrar_agenda=mostrarAgenda
    payloadSeguro.pagina_mostrar_servicos=mostrarServicos
    payloadSeguro.pagina_mostrar_equipe=mostrarEquipe
    payloadSeguro.pagina_mostrar_por_que_agendar=mostrarPorQueAgendar
    payloadSeguro.pagina_mostrar_contato=mostrarContato
    payloadSeguro.ordem_secoes_publicas=ordemSecoes

    payloadSeguro.promocao_ativa=promoAtiva
    payloadSeguro.promocao_titulo=promoTitulo.trim()||null
    payloadSeguro.promocao_descricao=promoDesc.trim()||null
    payloadSeguro.promocao_preco_antigo=promoPrecoAnt?parseFloat(promoPrecoAnt.replace(',','.'))||null:null
    payloadSeguro.promocao_preco_novo=promoPrecoNovo?parseFloat(promoPrecoNovo.replace(',','.'))||null:null
    payloadSeguro.promocao_botao_texto=promoBotao.trim()||'Agendar promoção'
    payloadSeguro.promocao_observacao=promoObs.trim()||null
    payloadSeguro.promocao_data_inicio=promoInicio||null
    payloadSeguro.promocao_data_fim=promoFim||null

    try{
      payloadSeguro.dias_ativos=diasAtivos
      payloadSeguro.horarios=horarios
      payloadSeguro.intervalo=intervalo
      payloadSeguro.abertura_geral=abertura
      payloadSeguro.fechamento_geral=fechamento
      payloadSeguro.antecedencia=antecedencia
    }catch(_){}

    console.log('PAYLOAD enviado:', payloadSeguro)

    // ✅ CORRIGIDO: também usando maybeSingle() aqui
    const {data:existente}=await supabase.from('perfis').select('id').eq('user_id',userId).maybeSingle()

    let saveError:any=null
    if(existente){
      const {error,data:upd}=await supabase.from('perfis').update(payloadSeguro).eq('user_id',userId).select()
      console.log('UPDATE resultado:', upd, 'erro:', error)
      saveError=error
    } else {
      const {error}=await supabase.from('perfis').insert({...payloadSeguro,user_id:userId})
      saveError=error
    }

    if(saveError){
      console.error('Erro ao salvar:', saveError)
      setMsg('Erro ao salvar: '+saveError.message)
      setSalvando(false)
      return
    }

    setSalvando(false)
    setMsg('Perfil salvo com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  async function uploadFotoPerfil(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessaoAtual()))return
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}

    const {data:userData}=await supabase.auth.getUser()
    if(!userData?.user){setMsg('Sua sessão expirou. Faça login novamente.');return}

    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`perfis/${userId}-${Date.now()}.${ext}`

    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);return}

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    setFotoPerfilUrl(data.publicUrl)

    const {error:updateError}=await supabase.from('perfis').update({foto_perfil_url:data.publicUrl}).eq('user_id',userId)
    if(updateError){setMsg('Foto enviada, mas erro ao salvar no perfil: '+updateError.message);return}

    setMsg('Foto de perfil salva com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  // ---------- ACESSO DA CONTA (Caminho B) ----------
  function emailValido(e:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
  function moverSecao(indice:number,direcao:'up'|'down'){
    const novoIndice=direcao==='up'?indice-1:indice+1
    if(novoIndice<0||novoIndice>=ordemSecoes.length)return
    setOrdemSecoes(prev=>{
      const copia=[...prev]
      ;[copia[indice],copia[novoIndice]]=[copia[novoIndice],copia[indice]]
      return copia
    })
  }

  // Caminho B: convite proprio, com token controlado por nos.
  // A pessoa cria a PROPRIA senha na pagina /convite/[token] - o admin atual nunca
  // ve nem define essa senha. So depois que ela aceita e que o perfil e transferido.
  async function transferirAcesso(){
    setTransferMsg('')
    setTransferOk(false)
    const novo=novoEmailAcesso.trim().toLowerCase()
    if(!novo){setTransferMsg('Informe um e-mail válido.');return}
    if(!emailValido(novo)){setTransferMsg('Informe um e-mail válido.');return}
    if(novo===(emailAtual||'').toLowerCase()){setTransferMsg('O novo e-mail precisa ser diferente do e-mail atual.');return}
    setTransferindo(true)
    const {data:{session}}=await supabase.auth.getSession()
    if(!session){setTransferMsg('Sua sessão expirou. Recarregue a página e tente de novo.');setTransferindo(false);return}
    const res=await fetch('/api/convite/criar',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({email_novo:novo}),
    })
    const data=await res.json().catch(()=>({}))
    setTransferindo(false)
    if(!res.ok){
      console.warn('Erro ao criar convite:',data.error)
      setTransferMsg(data.error||'Não foi possível enviar o convite. Verifique o e-mail e tente novamente.')
      return
    }
    setTransferOk(true)
    setNovoEmailAcesso('')
    setTransferMsg('Convite enviado! A pessoa vai receber um e-mail para criar a própria senha e assumir o acesso. Você não verá nem definirá essa senha em nenhum momento.')
  }



  function copiarLink(){navigator.clipboard.writeText(pubUrl);setCopied(true);setTimeout(()=>setCopied(false),2000)}

  const ini=(nome||'C').charAt(0).toUpperCase()
  // Link principal da página pública agora é o domínio curto minipage.pro/@slug
  // (clientemarcado.com.br/slug continua funcionando normalmente, só não é mais o link sugerido).
  // Link principal da página pública: https://minipage.pro/slug (sem @, padrão oficial mais simples).
  // /@slug continua funcionando por compatibilidade, mas deixou de ser o link divulgado.
  const pubUrl=`https://minipage.pro/${slug}`

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={nome} tituloMobile="Configurações"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          {semPerfil ? (
            <div className="crd" style={{textAlign:'center',padding:'48px 24px',maxWidth:'480px',margin:'40px auto'}}>
              <p style={{fontSize:'19px',fontWeight:800,color:'#F8F4F7',marginBottom:'10px'}}>Nenhum perfil encontrado para esta conta</p>
              <p style={{fontSize:'14px',color:'#B8AAB8',lineHeight:1.6,marginBottom:'24px'}}>Esta conta ainda não possui uma página profissional. Crie um novo perfil para começar.</p>
              <button type="button" onClick={criarPerfilNovo} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',padding:'13px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Criar meu perfil
              </button>
            </div>
          ) : (
          <>

          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.04em',marginBottom:'5px'}}>Perfil do negócio</h1>
              <p style={{fontSize:'13px',color:'#B8AAB8'}}>Configure como seu negócio aparece para os clientes.</p>
            </div>
            <Link href="/painel" prefetch={false} className="btn-verpag" style={{fontSize:'13px',color:'#B8AAB8',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',flexShrink:0,padding:'8px 12px',background:'rgba(24,16,27,.72)',border:'1px solid #2A1A2F',borderRadius:'8px'}}>← Voltar ao painel</Link>
          </div>

          {slug&&(
            <div className="crd" style={{border:'1.5px solid rgba(139,92,246,.24)',background:'radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 40%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))'}}>
              <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Seu link profissional</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Compartilhe este link para receber agendamentos online.</p>
              <div style={{background:'rgba(24,16,27,.72)',border:'1px solid #2A1A2F',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px',overflowX:'auto'}}>
                <span style={{fontSize:'13px',color:'#8B5CF6',fontFamily:'monospace',fontWeight:600,whiteSpace:'nowrap'}}>{pubUrl}</span>
              </div>
              <div className="link-btns" style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={copiarLink} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',height:'42px',padding:'0 18px',fontSize:'13px',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'6px',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 8px 24px rgba(236,72,153,.28)',whiteSpace:'nowrap'}}>
                  {copied?<Check size={14}/>:<Copy size={14}/>}{copied?'Copiado!':'Copiar link'}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent('Agende comigo: '+pubUrl)}`} target="_blank" rel="noreferrer" style={{background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.28)',color:'#22C55E',borderRadius:'10px',height:'42px',padding:'0 16px',fontSize:'13px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',whiteSpace:'nowrap'}}>WhatsApp</a>
                <a href={pubUrl} target="_blank" rel="noreferrer" className="btn-verpag" style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'10px',height:'42px',padding:'0 16px',fontSize:'13px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',whiteSpace:'nowrap'}}><ExternalLink size={14}/>Ver página</a>
              </div>
            </div>
          )}

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Informações da página</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Defina o nome, link e informações principais da sua MiniPage.</p>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Nome exibido na página *</label>
              <input className="inp" type="text" placeholder="Ex: Nome da sua página" value={nome} onChange={e=>setNome(e.target.value)}/>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Link personalizado *</label>
              <div style={{display:'flex',alignItems:'center',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',overflow:'hidden',transition:'border-color .2s'}} onFocusCapture={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.55)')} onBlurCapture={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                <span style={{padding:'0 12px',fontSize:'12px',color:'#B8AAB8',whiteSpace:'nowrap',borderRight:'1px solid #2A1A2F',height:'48px',display:'flex',alignItems:'center',background:'rgba(255,255,255,.03)',flexShrink:0}}>minipage.pro/</span>
                <input type="text" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))} placeholder="seunome" style={{flex:1,background:'transparent',border:'none',outline:'none',padding:'0 14px',height:'48px',fontSize:'14px',color:'#F8F4F7',fontFamily:'inherit'}}/>
              </div>
            </div>
            <div>
              <label className="lbl">Endereço (opcional)</label>
              <input className="inp" type="text" placeholder="Ex: Rua Principal, 123 - São Paulo" value={end} onChange={e=>setEnd(e.target.value)}/>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Informações públicas da MiniPage</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Esses dados aparecem para quem acessa sua página.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">WhatsApp de contato</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e=>setWpp(e.target.value)}/></div>
              <div><label className="lbl">Instagram</label><input className="inp" type="text" placeholder="@seunegocio" value={insta} onChange={e=>setInsta(e.target.value)}/></div>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Cidade / Estado</label>
              <input className="inp" type="text" placeholder="Ex: São Paulo - SP" value={cidade} onChange={e=>setCidade(e.target.value)}/>
            </div>
            <div>
              <label className="lbl">Bio da página</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value.slice(0,180))} placeholder="Ex: Atendimento com horário marcado, ambiente confortável e profissionais especializados." style={{width:'100%',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',padding:'12px 14px',fontSize:'14px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',resize:'none',height:'90px',lineHeight:1.5,boxSizing:'border-box',transition:'border-color .2s'}} onFocus={e=>(e.target.style.borderColor='rgba(236,72,153,.55)')} onBlur={e=>(e.target.style.borderColor='#2A1A2F')}/>
              <p style={{fontSize:'11px',color:'#B8AAB8',textAlign:'right',marginTop:'4px'}}>{desc.length}/180</p>
            </div>
          </div>

          <div className="crd">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Agenda e horários</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>Configure dias de atendimento, horários, intervalo entre horários e antecedência mínima.</p>
              </div>
              <Link href="/painel/perfil/agenda" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar agenda</Link>
            </div>
          </div>

          <div className="crd" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Aparência da MiniPage</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>Banner, foto, cores e visual da página pública.</p>
              </div>
              <Link href="/painel/perfil/aparencia" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar aparência</Link>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Página profissional</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Foto de perfil, descrição da bio e o que aparece na sua página pública.</p>

            <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Foto de perfil</p>
            <p style={{fontSize:'11px',color:'#B8AAB8',marginBottom:'10px'}}>Recomendado: imagem quadrada, 400x400px (proporção 1:1). Aparece em formato circular.</p>
            <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'18px'}}>
              {fotoPerfilUrl?(
                <img src={fotoPerfilUrl} alt="Foto de perfil" style={{width:'72px',height:'72px',borderRadius:'50%',objectFit:'cover',border:'1.5px solid #2A1A2F',flexShrink:0}}/>
              ):(
                <div style={{width:'72px',height:'72px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
              )}
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button type="button" onClick={()=>fotoRef.current?.click()} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{fotoPerfilUrl?'Trocar foto':'Adicionar foto'}</button>
                {fotoPerfilUrl&&<button type="button" onClick={()=>setFotoPerfilUrl('')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>}
              </div>
              <input ref={fotoRef} type="file" accept="image/*" onChange={uploadFotoPerfil} style={{display:'none'}}/>
            </div>

            <div style={{marginBottom:'18px'}}>
              <label className="lbl">Descrição curta da página (bio)</label>
              <textarea value={descCurta} onChange={e=>setDescCurta(e.target.value.slice(0,140))} placeholder="Ex: Nail designer • Mentora • Cursos presenciais e online" style={{width:'100%',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',padding:'12px 14px',fontSize:'14px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',resize:'none',height:'70px',lineHeight:1.5,boxSizing:'border-box'}}/>
              <p style={{fontSize:'11px',color:'#B8AAB8',textAlign:'right',marginTop:'4px'}}>{descCurta.length}/140</p>
            </div>

            <div style={{marginBottom:'18px'}}>
              <label className="lbl">Texto do botão de agendar (opcional)</label>
              <input className="inp" type="text" placeholder="Agendar agora" value={tituloBotaoAgenda} onChange={e=>setTituloBotaoAgenda(e.target.value)}/>
            </div>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>O que aparece na sua página</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Desative o que não usa. Sua página funciona bem com ou sem agenda.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {[
                  {lbl:'Botão de agendar / Agenda',val:mostrarAgenda,set:setMostrarAgenda},
                  {lbl:'Serviços',val:mostrarServicos,set:setMostrarServicos},
                  {lbl:'Equipe',val:mostrarEquipe,set:setMostrarEquipe},
                  {lbl:'Seção "Por que agendar aqui?"',val:mostrarPorQueAgendar,set:setMostrarPorQueAgendar},
                  {lbl:'Contato (WhatsApp/Instagram/endereço)',val:mostrarContato,set:setMostrarContato},
                ].map(({lbl,val,set})=>(
                  <div key={lbl} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'rgba(255,255,255,.03)',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)'}}>
                    <span style={{fontSize:'13px',color:'#F8F4F7'}}>{lbl}</span>
                    <button type="button" onClick={()=>set((v:boolean)=>!v)} style={{background:val?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(val?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'5px 12px',fontSize:11,fontWeight:700,color:val?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{val?'Exibindo':'Oculto'}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="crd" style={{padding:'20px'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Ordem da página pública</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'16px'}}>Altere a ordem em que as seções aparecem na sua MiniPage Pro.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {ordemSecoes.map((chave,i)=>{
                const rotulos:Record<string,string>={destaques:'Destaques da página',links:'Links rápidos',agenda:'Agenda / Eventos',catalogo:'Catálogo',videos:'Vídeos da página'}
                return (
                  <div key={chave} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 14px',background:'rgba(24,16,27,.72)',border:'1px solid #2A1A2F',borderRadius:'10px'}}>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#B8AAB8',width:'18px',flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:'13px',fontWeight:600,color:'#F8F4F7',flex:1}}>{rotulos[chave]||chave}</span>
                    <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                      <button type="button" onClick={()=>moverSecao(i,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                      <button type="button" onClick={()=>moverSecao(i,'down')} disabled={i===ordemSecoes.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===ordemSecoes.length-1?'#4A3F4E':'#B8AAB8',cursor:i===ordemSecoes.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="crd" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Destaques da página</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>{destaques.length} destaque{destaques.length!==1?'s':''} cadastrado{destaques.length!==1?'s':''}</p>
              </div>
              <Link href="/painel/perfil/destaques" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar destaques</Link>
            </div>
          </div>

          <div className="crd" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Links rápidos</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>{links.length} link{links.length!==1?'s':''} cadastrado{links.length!==1?'s':''}</p>
              </div>
              <Link href="/painel/perfil/links" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar links</Link>
            </div>
          </div>

          <div className="crd" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Agenda / Eventos</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>{eventos.length} evento{eventos.length!==1?'s':''} cadastrado{eventos.length!==1?'s':''}</p>
              </div>
              <Link href="/painel/perfil/eventos" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar eventos</Link>
            </div>
          </div>

          <div className="crd" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Vídeos da página</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>{videos.length} vídeo{videos.length!==1?'s':''} cadastrado{videos.length!==1?'s':''}</p>
              </div>
              <Link href="/painel/perfil/videos" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar vídeos</Link>
            </div>
          </div>


          <div className="crd" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>Catálogo</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>{catalogoItens.length} ite{catalogoItens.length!==1?'ns':'m'} cadastrado{catalogoItens.length!==1?'s':''}</p>
              </div>
              <Link href="/painel/perfil/catalogo" style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,textDecoration:'none',flexShrink:0}}>Gerenciar catálogo</Link>
            </div>
          </div>


          {MOSTRAR_PROMOCAO_ANTIGA && (
          <div style={{
            marginTop:32,
            background:`radial-gradient(circle at top right,${tc.bg},transparent 40%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(18,10,20,.99))`,
            border:`1px solid ${tc.border}`,
            borderRadius:20,
            padding:'24px 28px',
            transition:'border-color .3s, background .3s',
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap' as const,gap:10}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:800,color:'#F8F4F7',marginBottom:4}}>Promoção em destaque</h3>
                <p style={{fontSize:13,color:'#B8AAB8'}}>Cadastre uma oferta para aparecer na sua página pública.</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:999,background:promoAtiva?'rgba(34,197,94,.14)':'#2A1A2F',color:promoAtiva?'#22C55E':'#B8AAB8',border:'1px solid '+(promoAtiva?'rgba(34,197,94,.25)':'#2A1A2F')}}>
                  {promoAtiva?'Ativa na página pública':'Oculta'}
                </span>
                <button type="button" onClick={()=>setPromoAtiva(a=>!a)} style={{background:promoAtiva?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(promoAtiva?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:promoAtiva?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>
                  {promoAtiva?'Desativar':'Ativar promoção'}
                </button>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:20}}>
              {([
                {lbl:'Título da promoção',val:promoTitulo,set:setPromoTitulo,ph:'Ex: Corte + Barba Especial'},
                {lbl:'Descrição curta',val:promoDesc,set:setPromoDesc,ph:'Ex: Oferta válida por tempo limitado'},
                {lbl:'Preço antigo (R$)',val:promoPrecoAnt,set:setPromoPrecoAnt,ph:'Ex: 80'},
                {lbl:'Preço promocional (R$)',val:promoPrecoNovo,set:setPromoPrecoNovo,ph:'Ex: 59.90'},
                {lbl:'Texto do botão',val:promoBotao,set:setPromoBotao,ph:'Agendar promoção'},
                {lbl:'Observação',val:promoObs,set:setPromoObs,ph:'Ex: Válido até domingo'},
              ] as any[]).map(({lbl,val,set,ph}:any)=>(
                <div key={lbl}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>{lbl}</label>
                  <input type="text" value={val} onChange={(e:any)=>set(e.target.value)} placeholder={ph} style={{width:'100%',background:'rgba(24,16,27,.88)',border:`1px solid ${tc.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,transition:'border-color .2s'}}
                    onFocus={e=>(e.target.style.borderColor=tc.accent)}
                    onBlur={e=>(e.target.style.borderColor=tc.border)}
                  />
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>Data início</label>
                <input type="date" value={promoInicio} onChange={(e:any)=>setPromoInicio(e.target.value)} style={{width:'100%',background:'rgba(24,16,27,.88)',border:`1px solid ${tc.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,colorScheme:'dark' as const}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>Data fim</label>
                <input type="date" value={promoFim} onChange={(e:any)=>setPromoFim(e.target.value)} style={{width:'100%',background:'rgba(24,16,27,.88)',border:`1px solid ${tc.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,colorScheme:'dark' as const}}/>
              </div>
            </div>

            {promoAtiva&&promoTitulo&&(
              <div>
                <p style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:12}}>Prévia na página pública</p>
                <div style={{
                  background:`radial-gradient(circle at top right,${tc.bg.replace(',.10)',', .22)')},transparent 35%),linear-gradient(135deg,rgba(15,23,42,.98),rgba(17,24,39,.96))`,
                  border:`1px solid ${tc.border}`,
                  borderRadius:18,
                  padding:'20px 24px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between',
                  gap:20,
                  flexWrap:'wrap' as const,
                  transition:'all .3s',
                }}>
                  <div style={{flex:1,minWidth:200}}>
                    <p style={{fontSize:10,fontWeight:800,color:tc.accent,letterSpacing:'.12em',textTransform:'uppercase' as const,marginBottom:6}}>Oferta da semana</p>
                    <p style={{fontSize:20,fontWeight:900,color:'#F8F4F7',marginBottom:4}}>{promoTitulo}</p>
                    {promoDesc&&<p style={{fontSize:13,color:'#B8AAB8'}}>{promoDesc}</p>}
                    {promoObs&&<p style={{fontSize:12,color:'#B8AAB8',marginTop:6}}>{promoObs}</p>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:8}}>
                    {promoPrecoAnt&&<p style={{fontSize:12,color:'#B8AAB8',textDecoration:'line-through',margin:0}}>De R$ {promoPrecoAnt}</p>}
                    {promoPrecoNovo&&<p style={{fontSize:24,fontWeight:900,color:tc.accent,margin:0}}>R$ {promoPrecoNovo}</p>}
                    <div style={{
                      background:`linear-gradient(135deg,${tc.primary},${tc.accent},${tc.secondary})`,
                      color:tc.btnText,
                      borderRadius:10,
                      padding:'9px 20px',
                      fontSize:13,
                      fontWeight:800,
                      cursor:'pointer',
                      boxShadow:`0 4px 20px ${tc.border}`,
                      whiteSpace:'nowrap' as const,
                    }}>{promoBotao||'Agendar promoção'} →</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {!souProfissional && (
          <div className="crd">
            <button type="button" onClick={()=>setAcessoAberto(v=>!v)} style={{display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',width:'100%',textAlign:'left'}}>
              {acessoAberto?<ChevronUp size={18} color="#B8AAB8"/>:<ChevronDown size={18} color="#B8AAB8"/>}
              <span style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7'}}>Acesso da conta</span>
            </button>
            {acessoAberto && (
            <>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'20px',marginTop:'14px',lineHeight:1.6}}>Transfira esta página profissional para outro e-mail com segurança. O e-mail atual autoriza a transferência e o novo e-mail cria a própria senha de acesso.</p>

            <div style={{marginBottom:'14px'}}>
              <label className="lbl">E-mail atual</label>
              <input className="inp" value={emailAtual} disabled readOnly style={{opacity:.65,cursor:'not-allowed'}}/>
            </div>
            <div style={{marginBottom:'8px'}}>
              <label className="lbl">Novo e-mail de acesso</label>
              <input className="inp" type="email" value={novoEmailAcesso} onChange={e=>{setNovoEmailAcesso(e.target.value);setTransferMsg('')}} placeholder="influenciadora@email.com"/>
            </div>

            {transferMsg && <p style={{fontSize:'12px',marginBottom:'14px',color:transferOk?'#22C55E':'#EF4444'}}>{transferOk?'✓ ':''}{transferMsg}</p>}

            <button type="button" onClick={transferirAcesso} disabled={transferindo} style={{width:'100%',background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:700,cursor:transferindo?'not-allowed':'pointer',fontFamily:'inherit',opacity:transferindo?.7:1,marginBottom:'12px'}}>
              {transferindo?'Enviando...':'Enviar convite de transferência'}
            </button>
            <p style={{fontSize:'11px',color:'#B8AAB8',lineHeight:1.6}}>A pessoa recebe um link exclusivo por e-mail para criar a própria senha e assumir o acesso. Você não vê nem define essa senha em nenhum momento.</p>
            <p style={{fontSize:'11px',color:'#B8AAB8',lineHeight:1.6,marginTop:'6px'}}>O convite expira em 7 dias e só pode ser usado uma vez. Esta ação é enviada imediatamente e não depende do botão Salvar perfil.</p>
            </>
            )}
          </div>
          )}

          <button onClick={salvar} disabled={salvando} style={{width:'100%',marginTop:24,background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',height:'52px',fontSize:'15px',fontWeight:800,cursor:salvando?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:'0 12px 32px rgba(236,72,153,.30),0 0 28px rgba(139,92,246,.22)',opacity:salvando?.7:1,transition:'all .18s'}}>
            {salvando?'Salvando...':'Salvar perfil'}
          </button>

          </>
          )}

        </div></div>
      </div>
    </div>
  )
}
