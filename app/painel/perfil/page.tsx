'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const AV='linear-gradient(135deg,rgba(236,72,153,.95),rgba(139,92,246,.95))'

const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const INTERVALOS=['15 min','30 min','45 min','1 hora']
const ANTECEDENCIAS=['Sem restrição','1 hora antes','2 horas antes','4 horas antes','1 dia antes']

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

const TEMAS=[
  {id:'modelo1',nome:'Modelo 1',desc:'Rosa vibrante, moderno e marcante.',p:'#FF4FA3',s:'#D946EF'},
  {id:'modelo2',nome:'Modelo 2',desc:'Rosa blush claro, moderno e delicado.',p:'#FF4FA3',s:'#D946EF'},
  {id:'modelo3',nome:'Modelo 3',desc:'Preto e dourado, visual luxuoso e de alto padrão.',p:'#D4AF37',s:'#9C7A2F'},
  {id:'modelo4',nome:'Modelo 4',desc:'Lilás e roxo, delicado, moderno e sofisticado.',p:'#A78BFA',s:'#7C3AED'},
  {id:'modelo5',nome:'Modelo 5',desc:'Nude e champagne, visual natural e acolhedor.',p:'#D6A77A',s:'#A47148'},
  {id:'modelo6',nome:'Modelo 6',desc:'Champagne claro, elegante e sofisticado.',p:'#B8875A',s:'#D6A77A'},
]

const TEMA_CORES: Record<string, {primary:string;secondary:string;accent:string;border:string;bg:string;text:string;btnText:string}> = {
  modelo1: {primary:'#FF4FA3',secondary:'#D946EF',accent:'#EC4899',border:'rgba(255,79,163,.38)', bg:'rgba(255,79,163,.10)', text:'#FF8FC4', btnText:'#fff'},
  modelo2: {primary:'#FF4FA3',secondary:'#D946EF',accent:'#EC4899',border:'rgba(255,79,163,.38)', bg:'rgba(255,79,163,.10)', text:'#FF8FC4', btnText:'#fff'},
  modelo3: {primary:'#D4AF37',secondary:'#9C7A2F',accent:'#F0D98A',border:'rgba(212,175,55,.38)', bg:'rgba(212,175,55,.10)', text:'#F0D98A', btnText:'#1A140A'},
  modelo4: {primary:'#A78BFA',secondary:'#7C3AED',accent:'#C084FC',border:'rgba(167,139,250,.38)',bg:'rgba(167,139,250,.10)',text:'#C4B5FD', btnText:'#fff'},
  modelo5: {primary:'#D6A77A',secondary:'#A47148',accent:'#E8C39E',border:'rgba(214,167,122,.38)',bg:'rgba(214,167,122,.10)',text:'#E8C39E', btnText:'#2A1810'},
  modelo6: {primary:'#B8875A',secondary:'#D6A77A',accent:'#E8C39E',border:'rgba(184,135,90,.38)', bg:'rgba(184,135,90,.10)', text:'#E8C39E', btnText:'#fff'},
}

const BANNERS_PRONTOS=Array.from({length:14},(_,i)=>`/banners/beauty/banner-${String(i+1).padStart(2,'0')}.webp`)

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
  const [destaquesAberto, setDestaquesAberto] = useState(true)
  const [linksAberto, setLinksAberto] = useState(false)
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
  const imgRef=useRef<HTMLInputElement>(null)

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

  const [diasAtivos,setDiasAtivos]=useState([false,true,true,true,true,true,true])
  const [horarios,setHorarios]=useState(DIAS.map(()=>({abertura:'08:00',fechamento:'18:00'})))
  const [intervalo,setIntervalo]=useState('30 min')
  const [abertura,setAbertura]=useState('08:00')
  const [fechamento,setFechamento]=useState('18:00')
  const [antecedencia,setAntecedencia]=useState('Sem restrição')
  const [publicTheme,setPublicTheme]=useState('modelo2')

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
  const [videosAberto,setVideosAberto]=useState(false)
  const [salvandoDestaqueId,setSalvandoDestaqueId]=useState('')
  const [salvandoLinkId,setSalvandoLinkId]=useState('')
  const [salvandoVideoId,setSalvandoVideoId]=useState('')
  const [uploadingVideoId,setUploadingVideoId]=useState('')
  const videoImgRef=useRef<HTMLInputElement>(null)
  const [uploadingDestaqueId,setUploadingDestaqueId]=useState('')
  const destaqueImgRef=useRef<HTMLInputElement>(null)
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
    setDestaquesAberto(true)
    setLinksAberto(false)
    setVideosAberto(false)
    setSalvandoDestaqueId('')
    setSalvandoLinkId('')
    setSalvandoVideoId('')
    setUploadingVideoId('')
    setUploadingDestaqueId('')
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
      setMostrarServicos(p.pagina_mostrar_servicos!==false)
      setMostrarEquipe(p.pagina_mostrar_equipe!==false)
      setMostrarPorQueAgendar(p.pagina_mostrar_por_que_agendar!==false)
      setMostrarContato(p.pagina_mostrar_contato!==false)

    const [{data:dst},{data:lnk},{data:vid}]=await Promise.all([
      supabase.from('pagina_destaques').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('pagina_links').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('pagina_videos').select('*').eq('user_id',user.id).order('ordem'),
    ])
    if(dst) setDestaques(dst)
    if(lnk) setLinks(lnk)
    if(vid) setVideos(vid)
  }

  // Cria um perfil novo e limpo pro usuario logado (usado no botao "Criar meu perfil",
  // quando o usuario ainda nao tem nenhum perfil vinculado ao seu user_id)
  async function criarPerfilNovo(){
    if(!userId)return
    const slugBase='negocio'+userId.replace(/-/g,'').slice(0,8)
    const {error}=await supabase.from('perfis').insert({user_id:userId,slug:slugBase})
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

  async function restaurarCapa() {
    if(!(await validarSessaoAtual()))return
    const {data:{user}}=await supabase.auth.getUser();if(!user)return
    await supabase.from('perfis').update({capa_url:null}).eq('user_id',user.id)
    setCapUrl('')
    setMsg('Imagem padrão restaurada!')
    setTimeout(()=>setMsg(''),3000)
  }
  // ✅ CORRIGIDO: uploadCapa com validações, contentType e salvamento no perfil
  async function uploadCapa(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessaoAtual()))return

    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){
      setMsg('Envie uma imagem JPG, PNG ou WEBP.')
      return
    }
    if(file.size>5*1024*1024){
      setMsg('A imagem deve ter no máximo 5MB.')
      return
    }

    const {data:userData}=await supabase.auth.getUser()
    if(!userData?.user){
      setMsg('Sua sessão expirou. Faça login novamente.')
      return
    }

    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`capas/${userId}-${Date.now()}.${ext}`

    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{
      upsert:true,
      contentType:file.type,
      cacheControl:'3600',
    })

    if(uploadError){
      console.error('Erro no upload:',uploadError)
      setMsg('Erro no upload: '+uploadError.message)
      return
    }

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    const imageUrl=data.publicUrl
    setCapUrl(imageUrl)

    // ✅ Salva a URL da capa direto no perfil após o upload
    const {error:updateError}=await supabase.from('perfis').update({capa_url:imageUrl}).eq('user_id',userId)
    if(updateError){
      console.error('Erro ao salvar capa no perfil:',updateError)
      setMsg('Imagem enviada, mas erro ao salvar no perfil: '+updateError.message)
      return
    }

    setMsg('Imagem de capa salva com sucesso!')
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

  function abrirUploadDestaque(id:string){
    setUploadingDestaqueId(id)
    destaqueImgRef.current?.click()
  }
  async function uploadImagemDestaque(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];const id=uploadingDestaqueId
    if(!file||!id)return
    if(!(await validarSessaoAtual()))return
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}

    const {data:userData}=await supabase.auth.getUser()
    if(!userData?.user){setMsg('Sua sessão expirou. Faça login novamente.');return}

    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`destaques/${userId}-${Date.now()}.${ext}`

    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setUploadingDestaqueId('');if(destaqueImgRef.current)destaqueImgRef.current.value='';return}

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    editarDestaque(id,'imagem_url',data.publicUrl)
    setMsg('Imagem enviada! Clique em "Salvar" no destaque pra confirmar.')
    setTimeout(()=>setMsg(''),3500)
    setUploadingDestaqueId('')
    if(destaqueImgRef.current)destaqueImgRef.current.value=''
  }

  // ---------- DESTAQUES ----------
  function novoDestaque(){
    setDestaques(prev=>[{id:'novo-'+Date.now(),user_id:userId,titulo:'',descricao:'',texto_botao:'Ver mais',url:'',imagem_url:'',ativo:true,ordem:prev.length,_novo:true},...prev])
  }
  function editarDestaque(id:string,campo:string,valor:any){
    setDestaques(prev=>prev.map(d=>d.id===id?{...d,[campo]:valor}:d))
  }
  // Se o texto digitado parecer um numero de telefone (so digitos/espaco/traco/parenteses),
  // converte automaticamente pra link do WhatsApp. Senao, aplica a mesma normalizacao
  // de URL ja usada nos videos (markdown-safe, adiciona https:// se faltar).
  function normalizarLinkDestaque(valor:string):string{
    const v=(valor||'').trim()
    if(!v)return ''
    const soDigitos=v.replace(/\D/g,'')
    const pareceTelefone=/^[\d\s()+-]+$/.test(v)&&soDigitos.length>=10&&soDigitos.length<=13
    if(pareceTelefone){
      const comDDI=soDigitos.length<=11?'55'+soDigitos:soDigitos
      return `https://wa.me/${comDDI}`
    }
    return normalizarUrl(v)
  }
  async function salvarDestaque(d:any){
    if(!(await validarSessaoAtual()))return
    if(!d.titulo?.trim()){setMsg('Dê um título para o destaque.');return}
    setSalvandoDestaqueId(d.id)
    const payload={user_id:userId,titulo:d.titulo.trim(),descricao:d.descricao?.trim()||null,texto_botao:d.texto_botao?.trim()||'Ver mais',url:normalizarLinkDestaque(d.url)||null,imagem_url:d.imagem_url?.trim()||null,ativo:!!d.ativo,ordem:d.ordem||0}
    if(d._novo){
      const {data,error}=await supabase.from('pagina_destaques').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar destaque: '+error.message)}
      else{setDestaques(prev=>prev.map(x=>x.id===d.id?data:x));setMsg('Destaque salvo!')}
    } else {
      const {error}=await supabase.from('pagina_destaques').update(payload).eq('id',d.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar destaque: '+error.message)}
      else{setMsg('Destaque salvo!')}
    }
    setSalvandoDestaqueId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirDestaque(id:string){
    if(!(await validarSessaoAtual()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_destaques').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setDestaques(prev=>prev.filter(d=>d.id!==id))
  }

  // ---------- LINKS RÁPIDOS ----------
  function novoLink(){
    setLinks(prev=>[{id:'novo-'+Date.now(),user_id:userId,tipo:'whatsapp',titulo:'',descricao:'',url:'',ativo:true,ordem:prev.length,_novo:true},...prev])
  }
  function editarLink(id:string,campo:string,valor:any){
    setLinks(prev=>prev.map(l=>l.id===id?{...l,[campo]:valor}:l))
  }
  // Monta o link final do WhatsApp a partir do que a pessoa digitou:
  // - já é um link (começa com http) -> usa como está
  // - só tem dígitos (número, com ou sem DDI) -> monta wa.me/55DDDNUMERO
  // - tem letras (nome de usuário, com ou sem @) -> monta wa.me/usuario
  function montarLinkWhatsapp(valor:string){
    const v=(valor||'').trim()
    if(!v)return ''
    if(v.startsWith('http://')||v.startsWith('https://'))return v
    const somenteDigitos=v.replace(/\D/g,'')
    const temLetra=/[a-zA-Z]/.test(v)
    if(temLetra){
      const usuario=v.replace('@','').trim()
      return `https://wa.me/${usuario}`
    }
    if(somenteDigitos){
      const numero=somenteDigitos.startsWith('55')?somenteDigitos:`55${somenteDigitos}`
      return `https://wa.me/${numero}`
    }
    return v
  }
  async function salvarLink(l:any){
    if(!(await validarSessaoAtual()))return
    if(!l.titulo?.trim()||!l.url?.trim()){setMsg('Preencha título e link.');return}
    setSalvandoLinkId(l.id)
    const urlFinal=l.tipo==='whatsapp'?montarLinkWhatsapp(l.url):l.url.trim()
    const payload={user_id:userId,tipo:l.tipo||'outro',titulo:l.titulo.trim(),descricao:l.descricao?.trim()||null,url:urlFinal,ativo:!!l.ativo,ordem:l.ordem||0}
    if(l._novo){
      const {data,error}=await supabase.from('pagina_links').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar link: '+error.message)}
      else{setLinks(prev=>prev.map(x=>x.id===l.id?data:x));setMsg('Link salvo!')}
    } else {
      const {error}=await supabase.from('pagina_links').update(payload).eq('id',l.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar link: '+error.message)}
      else{setMsg('Link salvo!')}
    }
    setSalvandoLinkId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirLink(id:string){
    if(!(await validarSessaoAtual()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_links').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setLinks(prev=>prev.filter(l=>l.id!==id))
  }

  // ---------- VIDEOS DA PAGINA ----------
  // Normaliza links colados de qualquer jeito (markdown, sem protocolo, com colchetes)
  // antes de validar/salvar. Isso evita bloquear links claramente validos so por detalhe
  // de formatacao — o mesmo link, extraido corretamente, ja passa na validacao normal.
  function normalizarUrl(valor:string):string{
    let v=(valor||'').trim()
    if(!v)return ''
    // Formato markdown: [texto](url) -> extrai so a url de dentro dos parenteses
    const markdown=v.match(/\[([^\]]*)\]\(([^)]+)\)/)
    if(markdown){
      v=(markdown[2]||markdown[1]||'').trim()
    } else {
      // Só colchetes sobrando (ex: [https://...]) -> remove
      v=v.replace(/^\[+|\]+$/g,'').trim()
    }
    if(!v)return ''
    // Sem protocolo (com ou sem www.) -> adiciona https:// automaticamente
    if(!/^https?:\/\//i.test(v)){
      v='https://'+v.replace(/^\/+/,'')
    }
    return v
  }
  function detectarVideo(url:string){
    const u=(url||'').toLowerCase()
    if(u.includes('youtube.com/shorts/'))return {plataforma:'youtube',formato:'9:16'}
    if(u.includes('youtu.be/')||u.includes('youtube.com'))return {plataforma:'youtube',formato:'16:9'}
    if(u.includes('instagram.com/reel'))return {plataforma:'instagram',formato:'9:16'}
    if(u.includes('instagram.com/p/'))return {plataforma:'instagram',formato:'1:1'}
    if(u.includes('instagram.com'))return {plataforma:'instagram',formato:'9:16'}
    if(u.includes('tiktok.com'))return {plataforma:'tiktok',formato:'9:16'}
    if(u.includes('vimeo.com'))return {plataforma:'vimeo',formato:'16:9'}
    return {plataforma:'outro',formato:'16:9'}
  }
  function formatoLabel(formato:string){
    if(formato==='9:16')return 'Formato detectado: vídeo vertical'
    if(formato==='1:1')return 'Formato detectado: vídeo quadrado'
    if(formato==='4:3'||formato==='16:9')return 'Formato detectado: vídeo horizontal'
    return 'Formato detectado automaticamente. Se a prévia não ficar boa, ajuste em Configurações avançadas.'
  }
  function thumbYoutube(url:string){
    const m=(url||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/)
    return m?`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`:''
  }
  function labelPlaceholderPainel(v:{plataforma?:string;formato?:string}){
    if(v.plataforma==='instagram')return v.formato==='1:1'?'Post do Instagram':'Reels do Instagram'
    if(v.plataforma==='tiktok')return 'Vídeo do TikTok'
    if(v.plataforma==='vimeo')return 'Vídeo'
    return 'Conteúdo em vídeo'
  }
  const FORMATO_RATIO_PAINEL:Record<string,string>={'16:9':'16/9','9:16':'9/16','4:3':'4/3','1:1':'1/1'}
  function novoVideo(){
    setVideos(prev=>[{id:'novo-'+Date.now(),user_id:userId,titulo:'',descricao:'',url_video:'',plataforma:'youtube',thumbnail_url:'',formato:'16:9',link_destino:'',texto_cta:'',texto_botao_video:'Assistir vídeo',ordem:prev.length,ativo:true,_novo:true},...prev])
  }
  function editarVideo(id:string,campo:string,valor:any){
    setVideos(prev=>prev.map(v=>{
      if(v.id!==id)return v
      const atualizado={...v,[campo]:valor}
      // Ao colar/editar o link, detecta plataforma E formato automaticamente.
      // O formato so precisa ser trocado manualmente em "Configuracoes avancadas", se a previa nao ficar boa.
      if(campo==='url_video'){
        const det=detectarVideo(valor)
        atualizado.plataforma=det.plataforma
        atualizado.formato=det.formato
      }
      return atualizado
    }))
  }
  async function salvarVideo(v:any){
    if(!(await validarSessaoAtual()))return
    if(!v.titulo?.trim()){setMsg('Dê um título para o vídeo.');return}
    const urlVideoNorm=normalizarUrl(v.url_video)
    const linkDestinoNorm=normalizarUrl(v.link_destino)
    if(!urlVideoNorm||!/^https?:\/\//i.test(urlVideoNorm)){setMsg('Informe um link de vídeo válido.');return}
    if(v.link_destino?.trim()&&(!linkDestinoNorm||!/^https?:\/\//i.test(linkDestinoNorm))){setMsg('Informe um link de destino válido.');return}
    setSalvandoVideoId(v.id)
    const payload={
      user_id:userId,
      titulo:v.titulo.trim(),
      descricao:v.descricao?.trim()||null,
      url_video:urlVideoNorm,
      plataforma:v.plataforma||detectarVideo(urlVideoNorm).plataforma,
      thumbnail_url:v.thumbnail_url?.trim()||null,
      formato:v.formato||'16:9',
      link_destino:linkDestinoNorm||null,
      texto_cta:linkDestinoNorm?(v.texto_cta?.trim()||'Saiba mais'):null,
      texto_botao_video:v.texto_botao_video?.trim()||'Assistir vídeo',
      ordem:v.ordem||0,
      ativo:!!v.ativo,
    }
    if(v._novo){
      const {data,error}=await supabase.from('pagina_videos').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar vídeo: '+error.message)}
      else{setVideos(prev=>prev.map(x=>x.id===v.id?data:x));setMsg('Vídeo salvo!')}
    } else {
      const {error}=await supabase.from('pagina_videos').update(payload).eq('id',v.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar vídeo: '+error.message)}
      else{setMsg('Vídeo salvo!')}
    }
    setSalvandoVideoId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirVideo(id:string){
    if(!(await validarSessaoAtual()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_videos').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setVideos(prev=>prev.filter(v=>v.id!==id))
  }
  async function uploadCapaVideo(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];const id=uploadingVideoId
    if(!file||!id)return
    if(!(await validarSessaoAtual()))return
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}

    const {data:userData}=await supabase.auth.getUser()
    if(!userData?.user){setMsg('Sua sessão expirou. Faça login novamente.');return}

    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`videos/${userId}-${Date.now()}.${ext}`

    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setUploadingVideoId('');if(videoImgRef.current)videoImgRef.current.value='';return}

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    editarVideo(id,'thumbnail_url',data.publicUrl)
    setMsg('Capa enviada! Clique em "Salvar" no vídeo pra confirmar.')
    setTimeout(()=>setMsg(''),3500)
    setUploadingVideoId('')
    if(videoImgRef.current)videoImgRef.current.value=''
  }

  // ---------- ACESSO DA CONTA (Caminho B) ----------
  function emailValido(e:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}

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


  function toggleDia(i:number){setDiasAtivos(prev=>prev.map((v,j)=>j===i?!v:v))}
  function setHor(i:number,campo:'abertura'|'fechamento',val:string){setHorarios(prev=>prev.map((h,j)=>j===i?{...h,[campo]:val}:h))}
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
              <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Seu link de agendamento</p>
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
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Informações do negócio</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Dados principais que identificam seu negócio.</p>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Nome do negócio *</label>
              <input className="inp" type="text" placeholder="Ex: Nome do seu negócio" value={nome} onChange={e=>setNome(e.target.value)}/>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Link personalizado *</label>
              <div style={{display:'flex',alignItems:'center',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',overflow:'hidden',transition:'border-color .2s'}} onFocusCapture={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.55)')} onBlurCapture={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                <span style={{padding:'0 12px',fontSize:'12px',color:'#B8AAB8',whiteSpace:'nowrap',borderRight:'1px solid #2A1A2F',height:'48px',display:'flex',alignItems:'center',background:'rgba(255,255,255,.03)',flexShrink:0}}>clientemarcado.vercel.app/</span>
                <input type="text" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))} placeholder="seu-negocio" style={{flex:1,background:'transparent',border:'none',outline:'none',padding:'0 14px',height:'48px',fontSize:'14px',color:'#F8F4F7',fontFamily:'inherit'}}/>
              </div>
            </div>
            <div>
              <label className="lbl">Endereço (opcional)</label>
              <input className="inp" type="text" placeholder="Ex: Rua Principal, 123 - São Paulo" value={end} onChange={e=>setEnd(e.target.value)}/>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Dados públicos do negócio</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Informações que aparecem na sua página de agendamento.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">WhatsApp do negócio</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e=>setWpp(e.target.value)}/></div>
              <div><label className="lbl">Instagram</label><input className="inp" type="text" placeholder="@seunegocio" value={insta} onChange={e=>setInsta(e.target.value)}/></div>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Cidade / Estado</label>
              <input className="inp" type="text" placeholder="Ex: São Paulo - SP" value={cidade} onChange={e=>setCidade(e.target.value)}/>
            </div>
            <div>
              <label className="lbl">Descrição curta do negócio</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value.slice(0,180))} placeholder="Ex: Atendimento com horário marcado, ambiente confortável e profissionais especializados." style={{width:'100%',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',padding:'12px 14px',fontSize:'14px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',resize:'none',height:'90px',lineHeight:1.5,boxSizing:'border-box',transition:'border-color .2s'}} onFocus={e=>(e.target.style.borderColor='rgba(236,72,153,.55)')} onBlur={e=>(e.target.style.borderColor='#2A1A2F')}/>
              <p style={{fontSize:'11px',color:'#B8AAB8',textAlign:'right',marginTop:'4px'}}>{desc.length}/180</p>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Funcionamento do negócio</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Defina os dias e horários em que seus clientes podem agendar.</p>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'18px'}}>
              {DIAS.map((d,i)=>(
                <button key={d} onClick={()=>toggleDia(i)} className={`dia-btn${diasAtivos[i]?' on':''}`}>{d}</button>
              ))}
            </div>
            {DIAS.map((d,i)=>{
              if(!diasAtivos[i])return null
              return(
                <div key={d} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px',padding:'12px 14px',background:'rgba(255,255,255,.03)',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)',flexWrap:'wrap'}}>
                  <span style={{fontSize:'12px',fontWeight:700,color:'#C4B5FD',width:'32px',flexShrink:0}}>{d}</span>
                  <input type="time" value={horarios[i]?.abertura||'08:00'} onChange={e=>setHor(i,'abertura',e.target.value)} style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                  <span style={{fontSize:'12px',color:'#B8AAB8'}}>até</span>
                  <input type="time" value={horarios[i]?.fechamento||'18:00'} onChange={e=>setHor(i,'fechamento',e.target.value)} style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                </div>
              )
            })}
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Configurações da agenda</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Controle como o agendamento público funciona.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">Intervalo entre horários</label><select className="inp" style={{cursor:'pointer'}} value={intervalo} onChange={e=>setIntervalo(e.target.value)}>{INTERVALOS.map(v=><option key={v}>{v}</option>)}</select></div>
              <div><label className="lbl">Antecedência mínima</label><select className="inp" style={{cursor:'pointer'}} value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}>{ANTECEDENCIAS.map(v=><option key={v}>{v}</option>)}</select></div>
            </div>
            <div className="fg2">
              <div><label className="lbl">Abertura geral</label><input className="inp" type="time" value={abertura} onChange={e=>setAbertura(e.target.value)}/></div>
              <div><label className="lbl">Fechamento geral</label><input className="inp" type="time" value={fechamento} onChange={e=>setFechamento(e.target.value)}/></div>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Aparência da página pública</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Personalize a página que seus clientes acessam para agendar.</p>

            <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'8px'}}>Imagem de capa</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'12px'}}>Aparece no topo da sua página de agendamento. Use uma imagem horizontal (16:9).</p>
            {capUrl?(
              <div style={{position:'relative',borderRadius:'14px',overflow:'hidden',marginBottom:'16px',border:'1px solid #2A1A2F'}}>
                <img src={capUrl} alt="Capa" style={{width:'100%',height:'200px',objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'6px'}}>
                  <button onClick={()=>imgRef.current?.click()} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Trocar</button>
                  <button onClick={()=>setCapUrl('')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                </div>
              </div>
            ):(
              <div onClick={()=>imgRef.current?.click()} style={{border:'2px dashed #2A1A2F',borderRadius:'14px',padding:'32px',textAlign:'center',cursor:'pointer',marginBottom:'16px',transition:'border-color .18s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.40)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                <p style={{fontSize:'14px',color:'#B8AAB8',marginBottom:'4px'}}>Clique para adicionar imagem de capa</p>
                <p style={{fontSize:'12px',color:'#B8AAB8'}}>Recomendado: 1200x400px, formato JPG ou PNG</p>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" onChange={uploadCapa} style={{display:'none'}}/>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Escolha um banner pronto</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Selecione uma imagem pronta para combinar com o estilo do seu negócio.</p>
              <div className="banner-grid">
                {BANNERS_PRONTOS.map(b=>(
                  <button key={b} type="button" onClick={()=>setCapUrl(b)} className={`banner-thumb${capUrl===b?' sel':''}`}>
                    <img src={b} alt="Banner pronto" loading="lazy"/>
                    {capUrl===b&&<span className="banner-sel-badge">Selecionado</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Enquadramento no celular</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Ajuste como a imagem de capa aparece no celular. Útil quando o banner fica muito distante ou corta uma parte importante.</p>
              <div className="fg2">
                <div>
                  <label className="lbl">Posição no celular</label>
                  <select className="inp" style={{cursor:'pointer'}} value={bannerMobilePosicao} onChange={e=>setBannerMobilePosicao(e.target.value)}>
                    <option value="padrao">Padrão</option>
                    <option value="centro">Centro</option>
                    <option value="topo">Topo</option>
                    <option value="esquerda">Esquerda</option>
                    <option value="direita">Direita</option>
                    <option value="inferior">Inferior</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Zoom no celular</label>
                  <select className="inp" style={{cursor:'pointer'}} value={bannerMobileZoom} onChange={e=>setBannerMobileZoom(e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Cor de destaque</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Escolha uma cor pronta para combinar com o estilo do seu negócio. Afeta apenas a página pública.</p>
              <div className="temas-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
                {TEMAS.map(t=>(
                  <button key={t.id} onClick={()=>setPublicTheme(t.id)} className={`tema-card${publicTheme===t.id?' on':''}`}
                    style={publicTheme===t.id?{borderColor:t.p,background:`${t.p}1A`,boxShadow:`0 0 18px ${t.p}30`}:undefined}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <div style={{display:'flex',gap:'4px'}}>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.p,flexShrink:0}}/>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.s,flexShrink:0}}/>
                      </div>
                      {publicTheme===t.id&&<span style={{fontSize:'10px',fontWeight:700,color:t.p,background:`${t.p}24`,borderRadius:'6px',padding:'2px 7px',marginLeft:'auto'}}>Ativo</span>}
                    </div>
                    <p style={{fontSize:'12px',fontWeight:700,color:publicTheme===t.id?'#F8F4F7':'#B8AAB8',marginBottom:'3px'}}>{t.nome}</p>
                    <p style={{fontSize:'11px',color:'#B8AAB8',lineHeight:1.4}}>{t.desc}</p>
                  </button>
                ))}
              </div>
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

          <div className="crd">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:destaquesAberto?'4px':'0',flexWrap:'wrap',gap:'10px'}}>
              <button type="button" onClick={()=>setDestaquesAberto(v=>!v)} style={{display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',flex:1,minWidth:'200px',textAlign:'left'}}>
                {destaquesAberto?<ChevronUp size={18} color="#B8AAB8"/>:<ChevronDown size={18} color="#B8AAB8"/>}
                <span>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7'}}>Destaques da página</p>
                  {!destaquesAberto && <p style={{fontSize:'12px',color:'#B8AAB8',marginTop:'2px'}}>{destaques.length} destaque{destaques.length!==1?'s':''} cadastrado{destaques.length!==1?'s':''}</p>}
                </span>
              </button>
              <button type="button" onClick={()=>{novoDestaque();setDestaquesAberto(true)}} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>+ Novo destaque</button>
            </div>
            {destaquesAberto && (
            <>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px',marginTop:'14px'}}>Cards grandes como &quot;Curso Presencial&quot;, &quot;Mentoria VIP&quot; ou &quot;Produtos Indicados&quot;.</p>

            {destaques.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum destaque cadastrado ainda.</p>}

            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {destaques.map(d=>(
                <div key={d.id} style={{border:'1px solid #2A1A2F',borderRadius:'14px',padding:'16px'}}>
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Título</label><input className="inp" autoFocus={!!d._novo} value={d.titulo||''} onChange={e=>editarDestaque(d.id,'titulo',e.target.value)} placeholder="Ex: Curso Presencial"/></div>
                    <div><label className="lbl">Texto do botão</label><input className="inp" value={d.texto_botao||''} onChange={e=>editarDestaque(d.id,'texto_botao',e.target.value)} placeholder="Ex: Saiba mais"/></div>
                  </div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição</label><input className="inp" value={d.descricao||''} onChange={e=>editarDestaque(d.id,'descricao',e.target.value)} placeholder="Ex: Aprenda técnicas profissionais na prática"/></div>
                  <div style={{marginBottom:'12px'}}><label className="lbl">Link (URL)</label><input className="inp" value={d.url||''} onChange={e=>editarDestaque(d.id,'url',e.target.value)} placeholder="https://..."/></div>
                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">Imagem de fundo do card</label>
                    <p style={{fontSize:'11px',color:'#B8AAB8',marginBottom:'8px'}}>Recomendado: 800x600px (proporção 4:3). Imagem horizontal funciona melhor.</p>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                      {d.imagem_url?(
                        <img src={d.imagem_url} alt="Imagem do destaque" style={{width:'88px',height:'66px',borderRadius:'10px',objectFit:'cover',border:'1px solid #2A1A2F',flexShrink:0}}/>
                      ):(
                        <div style={{width:'88px',height:'66px',borderRadius:'10px',background:'rgba(24,16,27,.72)',border:'1px dashed #2A1A2F',flexShrink:0}}/>
                      )}
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        <button type="button" onClick={()=>abrirUploadDestaque(d.id)} disabled={uploadingDestaqueId===d.id} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{uploadingDestaqueId===d.id?'Enviando...':(d.imagem_url?'Trocar imagem':'Enviar imagem')}</button>
                        {d.imagem_url&&<button type="button" onClick={()=>editarDestaque(d.id,'imagem_url','')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarDestaque(d.id,'ativo',!d.ativo)} style={{background:d.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(d.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:d.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{d.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirDestaque(d.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarDestaque(d)} disabled={salvandoDestaqueId===d.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoDestaqueId===d.id?.7:1}}>{salvandoDestaqueId===d.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
            <input ref={destaqueImgRef} type="file" accept="image/*" onChange={uploadImagemDestaque} style={{display:'none'}}/>
          </div>

          <div className="crd">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:linksAberto?'4px':'0',flexWrap:'wrap',gap:'10px'}}>
              <button type="button" onClick={()=>setLinksAberto(v=>!v)} style={{display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',flex:1,minWidth:'200px',textAlign:'left'}}>
                {linksAberto?<ChevronUp size={18} color="#B8AAB8"/>:<ChevronDown size={18} color="#B8AAB8"/>}
                <span>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7'}}>Links rápidos</p>
                  {!linksAberto && <p style={{fontSize:'12px',color:'#B8AAB8',marginTop:'2px'}}>{links.length} link{links.length!==1?'s':''} cadastrado{links.length!==1?'s':''}</p>}
                </span>
              </button>
              <button type="button" onClick={()=>{novoLink();setLinksAberto(true)}} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>+ Novo link</button>
            </div>
            {linksAberto && (
            <>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px',marginTop:'14px'}}>TikTok, YouTube, Shopee, site, grupo VIP e outros links da sua bio.</p>

            {links.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum link cadastrado ainda.</p>}

            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {links.map(l=>(
                <div key={l.id} style={{border:'1px solid #2A1A2F',borderRadius:'14px',padding:'16px'}}>
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div>
                      <label className="lbl">Tipo</label>
                      <select className="inp" style={{cursor:'pointer'}} value={l.tipo||'outro'} onChange={e=>editarLink(l.id,'tipo',e.target.value)}>
                        {['whatsapp','instagram','tiktok','youtube','shopee','mercadolivre','site','curso','mentoria','endereco','outro'].map(t=><option key={t} value={t}>{t==='endereco'?'Endereço':t}</option>)}
                      </select>
                    </div>
                    <div><label className="lbl">Título</label><input className="inp" autoFocus={!!l._novo} value={l.titulo||''} onChange={e=>editarLink(l.id,'titulo',e.target.value)} placeholder="Ex: TikTok"/></div>
                  </div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição (opcional)</label><input className="inp" value={l.descricao||''} onChange={e=>editarLink(l.id,'descricao',e.target.value)} placeholder="Ex: @studiobellaeducadora"/></div>
                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">{l.tipo==='whatsapp'?'Número (com DDD) ou @usuário do WhatsApp':l.tipo==='endereco'?'Endereço para abrir no Google Maps':'Link (URL)'}</label>
                    <input className="inp" value={l.url||''} onChange={e=>editarLink(l.id,'url',e.target.value)} placeholder={l.tipo==='whatsapp'?'(11) 99999-9999 ou @studiobella':l.tipo==='endereco'?'Ex: Avenida Atlântica, 156 - São Paulo, SP':'https://...'}/>
                    {l.tipo==='whatsapp'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Pode digitar só o número com DDD (sem link pronto) ou seu @usuário do WhatsApp, se você já tiver criado um. O link completo é montado sozinho ao salvar.</p>}
                    {l.tipo==='endereco'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Digite o endereço completo. O ClienteMarcado abrirá esse local no Google Maps. Também aceita um link do Google Maps já pronto, se preferir colar um.</p>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarLink(l.id,'ativo',!l.ativo)} style={{background:l.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(l.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:l.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{l.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirLink(l.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarLink(l)} disabled={salvandoLinkId===l.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoLinkId===l.id?.7:1}}>{salvandoLinkId===l.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>

          <div className="crd">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:videosAberto?'4px':'0',flexWrap:'wrap',gap:'10px'}}>
              <button type="button" onClick={()=>setVideosAberto(v=>!v)} style={{display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',flex:1,minWidth:'200px',textAlign:'left'}}>
                {videosAberto?<ChevronUp size={18} color="#B8AAB8"/>:<ChevronDown size={18} color="#B8AAB8"/>}
                <span>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7'}}>Vídeos da página</p>
                  {!videosAberto && <p style={{fontSize:'12px',color:'#B8AAB8',marginTop:'2px'}}>{videos.length} vídeo{videos.length!==1?'s':''} cadastrado{videos.length!==1?'s':''}</p>}
                </span>
              </button>
              <button type="button" onClick={()=>{novoVideo();setVideosAberto(true)}} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>+ Novo vídeo</button>
            </div>
            {videosAberto && (
            <>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'6px',marginTop:'14px'}}>Cole o link de um vídeo do YouTube, Instagram, TikTok ou outra plataforma. O ClienteMarcado detecta automaticamente o formato ideal para exibir na sua página.</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Se o vídeo divulgar um curso, mentoria ou produto, adicione também um link de destino para direcionar a cliente.</p>

            {videos.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum vídeo cadastrado ainda. Adicione vídeos para destacar conteúdos, cursos, mentorias ou produtos na sua página.</p>}

            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {videos.map(v=>(
                <div key={v.id} style={{border:'1px solid rgba(229,72,184,.18)',borderRadius:'14px',padding:'16px'}}>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Título</label><input className="inp" autoFocus={!!v._novo} value={v.titulo||''} onChange={e=>editarVideo(v.id,'titulo',e.target.value)} placeholder="Ex: Lançamento da Mentoria Nail Designer"/></div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição (opcional)</label><input className="inp" value={v.descricao||''} onChange={e=>editarVideo(v.id,'descricao',e.target.value)} placeholder="Ex: Veja como funciona a mentoria para profissionais da beleza."/></div>
                  <div style={{marginBottom:'6px'}}>
                    <label className="lbl">Link do vídeo</label>
                    <input className="inp" value={v.url_video||''} onChange={e=>editarVideo(v.id,'url_video',e.target.value)} placeholder="https://youtube.com/... ou Reels/TikTok"/>
                    {v.url_video && <p style={{fontSize:'11px',color:'#22C55E',marginTop:'6px'}}>✓ {formatoLabel(v.formato)}</p>}
                    {!v.url_video && <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Cole o link do YouTube, Reels, TikTok, Vimeo etc. O formato ideal é detectado automaticamente.</p>}
                  </div>
                  {v.url_video && (
                    <div style={{marginBottom:'14px'}}>
                      <p className="lbl" style={{marginBottom:'8px'}}>Prévia</p>
                      <div style={{width: v.formato==='9:16'?'140px':v.formato==='1:1'?'170px':'240px', aspectRatio: FORMATO_RATIO_PAINEL[v.formato||'16:9'], borderRadius:'12px', overflow:'hidden', position:'relative', background:G, border:'1px solid rgba(229,72,184,.28)'}}>
                        {(v.thumbnail_url||thumbYoutube(v.url_video)) ? (
                          <img src={v.thumbnail_url||thumbYoutube(v.url_video)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'6px',padding:'8px',textAlign:'center'}}>
                            <div style={{width:'32px',height:'32px',borderRadius:'999px',background:'rgba(255,255,255,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'#fff'}}>▶</div>
                            <span style={{fontSize:'10px',color:'#fff',fontWeight:700}}>{labelPlaceholderPainel(v)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Texto do botão de assistir</label><input className="inp" value={v.texto_botao_video||''} onChange={e=>editarVideo(v.id,'texto_botao_video',e.target.value)} placeholder="Assistir vídeo"/></div>
                    <div>
                      <label className="lbl">Capa do vídeo (opcional)</label>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        {v.thumbnail_url && <img src={v.thumbnail_url} alt="" style={{width:'36px',height:'36px',borderRadius:'8px',objectFit:'cover',flexShrink:0,border:'1px solid #2A1A2F'}}/>}
                        <button type="button" onClick={()=>{setUploadingVideoId(v.id);videoImgRef.current?.click()}} style={{background:'rgba(24,16,27,.92)',border:'1px solid rgba(229,72,184,.28)',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',fontWeight:600,color:'#F8F4F7',cursor:'pointer',fontFamily:'inherit',flex:1}}>
                          {uploadingVideoId===v.id?'Enviando...':v.thumbnail_url?'Trocar capa':'Enviar capa'}
                        </button>
                      </div>
                      <p style={{fontSize:'10px',color:'#B8AAB8',marginTop:'6px'}}>Para vídeos do Instagram e TikTok, envie uma capa personalizada para deixar sua página mais bonita. Vídeos do YouTube usam capa automática quando disponível.</p>
                    </div>
                  </div>
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Link de destino (comercial, opcional)</label><input className="inp" value={v.link_destino||''} onChange={e=>editarVideo(v.id,'link_destino',e.target.value)} placeholder="Ex: link da mentoria, curso ou WhatsApp"/></div>
                    {v.link_destino ? (
                      <div><label className="lbl">Texto do botão de destino (CTA)</label><input className="inp" value={v.texto_cta||''} onChange={e=>editarVideo(v.id,'texto_cta',e.target.value)} placeholder="Ex: Quero participar"/></div>
                    ) : <div/>}
                  </div>
                  <details style={{marginBottom:'12px'}}>
                    <summary style={{fontSize:'12px',fontWeight:700,color:'#B8AAB8',cursor:'pointer',userSelect:'none'}}>Configurações avançadas</summary>
                    <div className="fg2" style={{marginTop:'12px'}}>
                      <div>
                        <label className="lbl">Plataforma</label>
                        <select className="inp" style={{cursor:'pointer'}} value={v.plataforma||'outro'} onChange={e=>editarVideo(v.id,'plataforma',e.target.value)}>
                          {['youtube','instagram','tiktok','vimeo','outro'].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="lbl">Formato manual</label>
                        <select className="inp" style={{cursor:'pointer'}} value={v.formato||'16:9'} onChange={e=>editarVideo(v.id,'formato',e.target.value)}>
                          {['16:9','9:16','4:3','1:1'].map(f=><option key={f} value={f}>{f}</option>)}
                        </select>
                        <p style={{fontSize:'10px',color:'#B8AAB8',marginTop:'5px'}}>Use apenas se a prévia não ficar correta.</p>
                      </div>
                    </div>
                  </details>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarVideo(v.id,'ativo',!v.ativo)} style={{background:v.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(v.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:v.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{v.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirVideo(v.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarVideo(v)} disabled={salvandoVideoId===v.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoVideoId===v.id?.7:1}}>{salvandoVideoId===v.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
            <input ref={videoImgRef} type="file" accept="image/*" onChange={uploadCapaVideo} style={{display:'none'}}/>
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
