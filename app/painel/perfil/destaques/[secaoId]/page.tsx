'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, UploadCloud } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import BloqueioPorPlano from '@/app/components/BloqueioPorPlano'
import { permiteDestaques } from '../../../../lib/planos'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

export default function GerenciarDestaques(){
  const params = useParams()
  const secaoId = String(params?.secaoId || '')
  const [secao,setSecao] = useState<any>(null)
  const [userId,setUserId]=useState('')
  const [planoTipo,setPlanoTipo]=useState('essencial')
  const [formato,setFormato]=useState<'vertical'|'horizontal'>('vertical')
  const [salvandoFormato,setSalvandoFormato]=useState(false)
  const [destaques,setDestaques]=useState<any[]>([])
  const [carregando,setCarregando]=useState(true)
  const [msg,setMsg]=useState('')
  const [salvandoId,setSalvandoId]=useState('')
  const [gerandoPreviaId,setGerandoPreviaId]=useState('')
  const [uploadingId,setUploadingId]=useState('')
  const imgRef=useRef<HTMLInputElement>(null)
  const [galeriasDestaque,setGaleriasDestaque]=useState<Record<string,any[]>>({}) // destaque_id -> [{id,imagem_url,ordem,is_capa}]
  const [enviandoGaleriaId,setEnviandoGaleriaId]=useState('')
  const galeriaFileRefs=useRef<Record<string,HTMLInputElement|null>>({})

  useEffect(()=>{ if(secaoId) load() },[secaoId])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [{data},{data:perfil},{data:secaoData}]=await Promise.all([
      supabase.from('pagina_destaques').select('*').eq('secao_id',secaoId).eq('user_id',user.id).order('ordem'),
      supabase.from('perfis').select('plano_tipo, destaques_formato').eq('user_id',user.id).maybeSingle(),
      supabase.from('pagina_destaques_secoes').select('*').eq('id',secaoId).eq('user_id',user.id).maybeSingle(),
    ])
    if(perfil?.plano_tipo) setPlanoTipo(perfil.plano_tipo)
    setFormato(perfil?.destaques_formato==='horizontal'?'horizontal':'vertical')
    setSecao(secaoData||null)
    setDestaques(data||[])
    // Busca a galeria de TODOS os destaques dessa secao de uma vez (evita 1 consulta por
    // destaque) - mesmo padrao ja usado no Catalogo.
    if(data&&data.length>0){
      const {data:imgs}=await supabase.from('destaque_imagens').select('*').in('destaque_id',data.map((d:any)=>d.id)).eq('user_id',user.id).order('ordem')
      const agrupado:Record<string,any[]>={}
      ;(imgs||[]).forEach((img:any)=>{
        if(!agrupado[img.destaque_id])agrupado[img.destaque_id]=[]
        agrupado[img.destaque_id].push(img)
      })
      setGaleriasDestaque(agrupado)
    }
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  async function alterarFormato(novoFormato:'vertical'|'horizontal'){
    if(!(await validarSessao()))return
    setFormato(novoFormato) // atualiza a UI na hora, sem esperar o salvamento
    setSalvandoFormato(true)
    const {error}=await supabase.from('perfis').update({destaques_formato:novoFormato}).eq('user_id',userId)
    if(error)setMsg('Erro ao salvar o formato de exibição.')
    setSalvandoFormato(false)
  }

  function novoDestaque(){
    setDestaques(prev=>[{id:'novo-'+Date.now(),user_id:userId,secao_id:secaoId,titulo:'',descricao:'',texto_botao:'Ver mais',url:'',imagem_url:'',ativo:true,ordem:prev.length,preco:'',preco_anterior:'',preco_exibicao:'nao_mostrar',preco_texto_personalizado:'',selo_tipo:'',selo_texto:'',_novo:true},...prev])
  }
  function editarDestaque(id:string,campo:string,valor:any){
    setDestaques(prev=>prev.map(d=>d.id===id?{...d,[campo]:valor}:d))
  }
  function normalizarLinkDestaque(valor:string):string{
    const v=(valor||'').trim()
    if(!v)return ''
    const soDigitos=v.replace(/\D/g,'')
    const pareceTelefone=/^[\d\s()+-]+$/.test(v)&&soDigitos.length>=10&&soDigitos.length<=13
    if(pareceTelefone){
      const comDDI=soDigitos.length<=11?'55'+soDigitos:soDigitos
      return `https://wa.me/${comDDI}`
    }
    let u=v
    const markdown=u.match(/\[([^\]]*)\]\(([^)]+)\)/)
    if(markdown){u=(markdown[2]||markdown[1]||'').trim()}
    else{u=u.replace(/^\[+|\]+$/g,'').trim()}
    if(!u)return ''
    if(!/^https?:\/\//i.test(u)){u='https://'+u.replace(/^\/+/,'')}
    return u
  }
  // Galeria efetiva de um destaque: se ja tem linhas reais em destaque_imagens, usa elas.
  // Senao, "sintetiza" uma entrada unica a partir da imagem_url de sempre (destaque antigo,
  // nunca editado na galeria nova) - assim a tela sempre tem algo consistente pra mostrar,
  // sem precisar de nenhuma migracao de dados. Mesmo padrao ja usado no Catalogo.
  function galeriaEfetivaDestaque(d:any):any[]{
    const real=galeriasDestaque[d.id]
    if(real&&real.length>0)return real
    if(d.imagem_url)return [{id:'legado',imagem_url:d.imagem_url,ordem:0,is_capa:true,_legado:true}]
    return []
  }

  async function adicionarImagemGaleriaDestaque(d:any,e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessao()))return
    if(d.id.startsWith('novo-')){setMsg('Envie a imagem principal primeiro - o destaque precisa ter um ID antes da galeria.');return}
    const galeriaAtual=galeriaEfetivaDestaque(d)
    if(galeriaAtual.length>=8){setMsg('Cada destaque pode ter no máximo 8 imagens.');return}
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}
    setEnviandoGaleriaId(d.id)
    const ext=file.name.split('.').pop()?.toLowerCase()||'jpg'
    const path=`destaques/${userId}-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setEnviandoGaleriaId('');return}
    const {data:pub}=supabase.storage.from('fotos').getPublicUrl(path)

    // Se a galeria ainda era "legado" (so a imagem_url antiga, sem linha real na tabela
    // nova), materializa ela como a primeira linha real antes de inserir a nova.
    const eraLegado=galeriaAtual.length===1&&galeriaAtual[0]._legado
    if(eraLegado){
      const {data:capaReal,error:erroCapa}=await supabase.from('destaque_imagens').insert({
        destaque_id:d.id,user_id:userId,imagem_url:galeriaAtual[0].imagem_url,ordem:0,is_capa:true,
      }).select().single()
      if(erroCapa){setMsg('Erro ao preparar a galeria: '+erroCapa.message);setEnviandoGaleriaId('');return}
      const {data:novaImg,error:erroNova}=await supabase.from('destaque_imagens').insert({
        destaque_id:d.id,user_id:userId,imagem_url:pub.publicUrl,ordem:1,is_capa:false,
      }).select().single()
      if(erroNova){setMsg('Erro ao salvar imagem: '+erroNova.message);setEnviandoGaleriaId('');return}
      setGaleriasDestaque(prev=>({...prev,[d.id]:[capaReal,novaImg]}))
    } else {
      const proximaOrdem=galeriaAtual.length>0?Math.max(...galeriaAtual.map(g=>g.ordem))+1:0
      const {data:novaImg,error:erroNova}=await supabase.from('destaque_imagens').insert({
        destaque_id:d.id,user_id:userId,imagem_url:pub.publicUrl,ordem:proximaOrdem,is_capa:galeriaAtual.length===0,
      }).select().single()
      if(erroNova){setMsg('Erro ao salvar imagem: '+erroNova.message);setEnviandoGaleriaId('');return}
      setGaleriasDestaque(prev=>({...prev,[d.id]:[...(prev[d.id]||[]),novaImg]}))
      if(galeriaAtual.length===0){
        await supabase.from('pagina_destaques').update({imagem_url:pub.publicUrl}).eq('id',d.id).eq('user_id',userId)
        editarDestaque(d.id,'imagem_url',pub.publicUrl)
      }
    }
    setEnviandoGaleriaId('')
    if(galeriaFileRefs.current[d.id])galeriaFileRefs.current[d.id]!.value=''
  }

  async function removerImagemGaleriaDestaque(d:any,imagem:any){
    if(!(await validarSessao()))return
    if(imagem._legado){
      await supabase.from('pagina_destaques').update({imagem_url:null}).eq('id',d.id).eq('user_id',userId)
      editarDestaque(d.id,'imagem_url','')
      return
    }
    const {error}=await supabase.from('destaque_imagens').delete().eq('id',imagem.id).eq('user_id',userId)
    if(error){setMsg('Erro ao remover: '+error.message);return}
    const restantes=(galeriasDestaque[d.id]||[]).filter(g=>g.id!==imagem.id)
    if(imagem.is_capa&&restantes.length>0){
      const novaCapa=restantes[0]
      await supabase.from('destaque_imagens').update({is_capa:true}).eq('id',novaCapa.id).eq('user_id',userId)
      await supabase.from('pagina_destaques').update({imagem_url:novaCapa.imagem_url}).eq('id',d.id).eq('user_id',userId)
      editarDestaque(d.id,'imagem_url',novaCapa.imagem_url)
      setGaleriasDestaque(prev=>({...prev,[d.id]:restantes.map(g=>g.id===novaCapa.id?{...g,is_capa:true}:g)}))
    } else if(imagem.is_capa){
      await supabase.from('pagina_destaques').update({imagem_url:null}).eq('id',d.id).eq('user_id',userId)
      editarDestaque(d.id,'imagem_url','')
      setGaleriasDestaque(prev=>({...prev,[d.id]:restantes}))
    } else {
      setGaleriasDestaque(prev=>({...prev,[d.id]:restantes}))
    }
  }

  async function definirComoCapaDestaque(d:any,imagem:any){
    if(!(await validarSessao()))return
    if(imagem._legado||imagem.is_capa)return
    const atual=galeriasDestaque[d.id]||[]
    await Promise.all([
      supabase.from('destaque_imagens').update({is_capa:false}).eq('destaque_id',d.id).eq('user_id',userId),
      supabase.from('destaque_imagens').update({is_capa:true}).eq('id',imagem.id).eq('user_id',userId),
    ])
    await supabase.from('pagina_destaques').update({imagem_url:imagem.imagem_url}).eq('id',d.id).eq('user_id',userId)
    editarDestaque(d.id,'imagem_url',imagem.imagem_url)
    setGaleriasDestaque(prev=>({...prev,[d.id]:atual.map(g=>({...g,is_capa:g.id===imagem.id}))}))
  }

  async function moverImagemGaleriaDestaque(d:any,imagem:any,direcao:'up'|'down'){
    const lista=[...(galeriasDestaque[d.id]||[])].sort((a,b)=>a.ordem-b.ordem)
    const idx=lista.findIndex(g=>g.id===imagem.id)
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=lista.length)return
    const a=lista[idx],b=lista[novoIdx]
    ;[a.ordem,b.ordem]=[b.ordem,a.ordem]
    setGaleriasDestaque(prev=>({...prev,[d.id]:lista}))
    await Promise.all([
      supabase.from('destaque_imagens').update({ordem:a.ordem}).eq('id',a.id).eq('user_id',userId),
      supabase.from('destaque_imagens').update({ordem:b.ordem}).eq('id',b.id).eq('user_id',userId),
    ])
  }

  // Reutiliza a MESMA API ja usada no Catalogo (/api/catalogo/preview-link) - nao duplica
  // logica de deteccao de plataforma/fallback Shopee, so aplica o resultado nos campos do
  // destaque. Trabalha 100% em estado local - nunca obriga salvar o destaque antes, mesmo
  // que ele ainda seja novo (id "novo-...").
  async function gerarPreviaDestaque(d:any){
    if(!d.url?.trim()){setMsg('Cole um link no campo "Link (URL)" antes de gerar a prévia.');return}
    setGerandoPreviaId(d.id)
    try{
      const res=await fetch('/api/catalogo/preview-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:d.url.trim()})})
      const dados=await res.json()
      if(!dados.success){
        setMsg(dados.message||'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.')
        // Mesmo com a previa falhando, aproveita o fallback de titulo pela URL (ja trata
        // Shopee de forma especial no backend) - so preenche se o titulo estiver vazio.
        if(dados.titulo_fallback){
          setDestaques(prev=>prev.map(x=>x.id===d.id&&!x.titulo?.trim()?{...x,titulo:dados.titulo_fallback}:x))
        }
        setGerandoPreviaId('')
        setTimeout(()=>setMsg(''),6000)
        return
      }
      // Mesma regra de seguranca do Catalogo: so preenche campos VAZIOS, nunca sobrescreve
      // o que o usuario ja digitou/enviou manualmente.
      const imagemJaExistia=!!d.imagem_url
      setDestaques(prev=>prev.map(x=>{
        if(x.id!==d.id)return x
        return {
          ...x,
          titulo: x.titulo?.trim() ? x.titulo : (dados.titulo || x.titulo),
          descricao: x.descricao?.trim() ? x.descricao : (dados.descricao || x.descricao),
          imagem_url: x.imagem_url ? x.imagem_url : (dados.imagem_url || x.imagem_url),
        }
      }))

      // Se vieram imagens extras da previa E o destaque nao tinha imagem manual antes,
      // tenta adicionar essas extras na galeria de verdade - mesma logica ja aplicada e
      // testada no Catalogo, agora que Destaques tambem tem tabela propria de galeria
      // (destaque_imagens).
      if(!imagemJaExistia&&dados.imagem_url&&Array.isArray(dados.imagens_extras)&&dados.imagens_extras.length>0){
        let destaqueId=d.id
        if(destaqueId.startsWith('novo-')){
          const novoId=await salvarRascunhoSeNecessario(destaqueId,dados.imagem_url)
          if(novoId)destaqueId=novoId
        }
        if(!destaqueId.startsWith('novo-')){
          const galeriaAtual=galeriaEfetivaDestaque({id:destaqueId,imagem_url:dados.imagem_url})
          const jaTem=new Set(galeriaAtual.map((g:any)=>g.imagem_url))
          const extrasParaAdicionar=dados.imagens_extras.filter((u:string)=>!jaTem.has(u)).slice(0,8-galeriaAtual.length)
          if(extrasParaAdicionar.length>0){
            let ordemAtual=galeriaAtual.length>0?Math.max(...galeriaAtual.map((g:any)=>g.ordem))+1:1
            const inseridas:any[]=[]
            for(const urlExtra of extrasParaAdicionar){
              const {data:nova}=await supabase.from('destaque_imagens').insert({destaque_id:destaqueId,user_id:userId,imagem_url:urlExtra,ordem:ordemAtual,is_capa:false}).select().single()
              if(nova)inseridas.push(nova)
              ordemAtual++
            }
            if(inseridas.length>0){
              setGaleriasDestaque(prev=>({...prev,[destaqueId]:[...(prev[destaqueId]||[]),...inseridas]}))
            }
          }
        }
      }

      setMsg(dados.message||'Prévia encontrada. Revise os dados antes de salvar.')
    }catch{
      setMsg('Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.')
    }
    setGerandoPreviaId('')
    setTimeout(()=>setMsg(''),5000)
  }

  async function salvarDestaque(d:any){
    if(!(await validarSessao()))return
    if(!d.titulo?.trim()){setMsg('Dê um título para o destaque.');return}
    setSalvandoId(d.id)
    const payload={user_id:userId,secao_id:secaoId,titulo:d.titulo.trim(),descricao:d.descricao?.trim()||null,texto_botao:d.texto_botao?.trim()||'Ver mais',url:normalizarLinkDestaque(d.url)||null,imagem_url:d.imagem_url?.trim()||null,ativo:!!d.ativo,ordem:d.ordem||0,
      preco: d.preco_exibicao==='mostrar'&&d.preco!==''&&d.preco!==null&&d.preco!==undefined ? parseFloat(String(d.preco).replace(',','.'))||null : null,
      preco_anterior: d.preco_exibicao==='mostrar'&&d.preco_anterior!==''&&d.preco_anterior!==null&&d.preco_anterior!==undefined ? parseFloat(String(d.preco_anterior).replace(',','.'))||null : null,
      preco_exibicao: d.preco_exibicao||'nao_mostrar',
      preco_texto_personalizado: d.preco_exibicao==='texto_personalizado' ? (d.preco_texto_personalizado?.trim()||null) : null,
      selo_tipo: d.selo_tipo||null,
      selo_texto: d.selo_tipo==='outros' ? (d.selo_texto?.trim().slice(0,20)||null) : null,
    }
    if(d._novo){
      const {data,error}=await supabase.from('pagina_destaques').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar destaque: '+error.message)}
      else{setDestaques(prev=>prev.map(x=>x.id===d.id?data:x));setMsg('Destaque salvo!')}
    } else {
      const {error}=await supabase.from('pagina_destaques').update(payload).eq('id',d.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar destaque: '+error.message)}
      else{setMsg('Destaque salvo!')}
    }
    setSalvandoId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirDestaque(id:string){
    if(!(await validarSessao()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_destaques').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setDestaques(prev=>prev.filter(d=>d.id!==id))
  }
  // Move o item na lista e reatribui a ordem sequencial de todos, persistindo no banco
  // (so os itens ja salvos - itens "novo-" ainda nem existem la).
  async function mover(id:string,direcao:'up'|'down'){
    const idx=destaques.findIndex(d=>d.id===id)
    if(idx<0)return
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=destaques.length)return
    const copia=[...destaques]
    ;[copia[idx],copia[novoIdx]]=[copia[novoIdx],copia[idx]]
    const comOrdem=copia.map((item,i)=>({...item,ordem:i}))
    setDestaques(comOrdem)
    for(const item of comOrdem){
      if(!item.id.startsWith('novo-')){
        await supabase.from('pagina_destaques').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
      }
    }
  }
  function abrirUpload(id:string){setUploadingId(id);imgRef.current?.click()}
  async function uploadImagem(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];const id=uploadingId
    if(!file||!id)return
    if(!(await validarSessao()))return
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}
    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`destaques/${userId}-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setUploadingId('');if(imgRef.current)imgRef.current.value='';return}
    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    editarDestaque(id,'imagem_url',data.publicUrl)
    // Se o destaque ainda nao existe no banco (ID temporario "novo-..."), salva um
    // RASCUNHO minimo automaticamente assim que a imagem principal for definida - mesmo
    // padrao ja aplicado e validado no Catalogo, adaptado aos campos dos Destaques.
    if(id.startsWith('novo-')){
      await salvarRascunhoSeNecessario(id,data.publicUrl)
    } else {
      setMsg('Imagem enviada! Clique em "Salvar" no destaque pra confirmar.')
      setTimeout(()=>setMsg(''),3500)
    }
    setUploadingId('')
    if(imgRef.current)imgRef.current.value=''
  }

  // Insere um rascunho minimo no banco (sem exigir titulo, que so e obrigatorio no "Salvar
  // destaque" de verdade) - existe so pra dar um ID real ao destaque logo apos a imagem
  // principal ser definida. Preserva todos os campos ja preenchidos localmente (titulo,
  // descricao, link, preco, selo etc) - mesma logica de conversao ja usada em salvarDestaque.
  async function salvarRascunhoSeNecessario(idTemporario:string,imagemUrl:string):Promise<string|null>{
    const destaqueAtual=destaques.find(x=>x.id===idTemporario)
    if(!destaqueAtual||!destaqueAtual._novo)return null
    const payload={
      user_id:userId,secao_id:secaoId,
      titulo:destaqueAtual.titulo?.trim()||'',
      descricao:destaqueAtual.descricao?.trim()||null,
      texto_botao:destaqueAtual.texto_botao?.trim()||'Ver mais',
      url:normalizarLinkDestaque(destaqueAtual.url)||null,
      imagem_url:imagemUrl,
      ativo:false, // rascunho comeca inativo - so fica visivel na pagina publica apos "Salvar destaque" de verdade
      ordem:destaqueAtual.ordem||0,
      preco: destaqueAtual.preco_exibicao==='mostrar'&&destaqueAtual.preco!==''&&destaqueAtual.preco!==null&&destaqueAtual.preco!==undefined ? parseFloat(String(destaqueAtual.preco).replace(',','.'))||null : null,
      preco_anterior: destaqueAtual.preco_exibicao==='mostrar'&&destaqueAtual.preco_anterior!==''&&destaqueAtual.preco_anterior!==null&&destaqueAtual.preco_anterior!==undefined ? parseFloat(String(destaqueAtual.preco_anterior).replace(',','.'))||null : null,
      preco_exibicao: destaqueAtual.preco_exibicao||'nao_mostrar',
      preco_texto_personalizado: destaqueAtual.preco_exibicao==='texto_personalizado' ? (destaqueAtual.preco_texto_personalizado?.trim()||null) : null,
      selo_tipo: destaqueAtual.selo_tipo||null,
      selo_texto: destaqueAtual.selo_tipo==='outros' ? (destaqueAtual.selo_texto?.trim().slice(0,20)||null) : null,
    }
    const {data,error}=await supabase.from('pagina_destaques').insert(payload).select().single()
    if(error){setMsg('Erro ao preparar o destaque: '+error.message);return null}
    // Substitui o ID temporario pelo real, preservando tudo que ja estava preenchido
    // localmente. _novo precisa virar false aqui: o destaque ja existe de verdade no banco
    // agora, entao o proximo "Salvar destaque" precisa fazer UPDATE, nunca outro INSERT
    // (senao duplicaria).
    // IMPORTANTE: preserva x.ativo (a escolha visual do usuario, sempre true por padrao
    // pra destaque novo) em vez de aceitar o "ativo:false" que vem de "data" - o rascunho
    // no banco fica inativo de proposito (pra nao vazar item incompleto), mas isso NUNCA
    // deve sobrescrever o status visual que o usuario ve na tela. Sem essa correcao, o
    // destaque virava "Oculto" sozinho so por ter enviado uma imagem, e o proximo "Salvar"
    // acabava persistindo esse ativo:false por engano.
    setDestaques(prev=>prev.map(x=>x.id===idTemporario?{...x,...data,ativo:x.ativo,_novo:false}:x))
    setMsg('Imagem enviada! Destaque criado automaticamente - continue preenchendo e clique em "Salvar" quando terminar.')
    setTimeout(()=>setMsg(''),4500)
    return data.id as string
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Destaques"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">
        <BloqueioPorPlano permitido={permiteDestaques(planoTipo)} titulo="Destaques disponível a partir do plano MiniPage" descricao="O plano Free é uma amostra limitada da MiniPage Pro. Faça upgrade para usar Destaques na sua página.">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil/destaques" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para seções de destaques</Link>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
            <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>{secao?.titulo||'Destaques'}</p>
            <button type="button" onClick={novoDestaque} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Novo destaque</button>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'20px'}}>Cards grandes como &quot;Curso Presencial&quot;, &quot;Mentoria VIP&quot; ou &quot;Produtos Indicados&quot;. Use as setas para mudar a ordem de exibição.</p>

          <div className="crd" style={{padding:'16px 18px',marginBottom:'24px'}}>
            <p style={{fontSize:'13px',fontWeight:700,color:'#F8F4F7',marginBottom:'10px'}}>Formato dos destaques</p>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button type="button" onClick={()=>alterarFormato('vertical')} disabled={salvandoFormato} style={{background:formato==='vertical'?G:'rgba(24,16,27,.9)',color:formato==='vertical'?'#fff':'#B8AAB8',border:formato==='vertical'?'1px solid rgba(255,255,255,.12)':'1px solid #2A1A2F',borderRadius:'10px',padding:'9px 16px',fontSize:'13px',fontWeight:600,cursor:salvandoFormato?'wait':'pointer',fontFamily:'inherit'}}>Vertical</button>
              <button type="button" onClick={()=>alterarFormato('horizontal')} disabled={salvandoFormato} style={{background:formato==='horizontal'?G:'rgba(24,16,27,.9)',color:formato==='horizontal'?'#fff':'#B8AAB8',border:formato==='horizontal'?'1px solid rgba(255,255,255,.12)':'1px solid #2A1A2F',borderRadius:'10px',padding:'9px 16px',fontSize:'13px',fontWeight:600,cursor:salvandoFormato?'wait':'pointer',fontFamily:'inherit'}}>Carrossel no celular</button>
            </div>
            <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'8px'}}>Vertical mostra os destaques em blocos grandes, um abaixo do outro. Carrossel no celular aplica a rolagem lateral apenas no celular, deixando a página mais compacta no mobile. No desktop, os destaques continuam em blocos grandes.</p>
          </div>

          {destaques.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum destaque cadastrado ainda.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {destaques.map((d,i)=>(
              <div key={d.id} className="crd" style={{padding:'16px',display:'flex',gap:'12px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0,paddingTop:'2px'}}>
                  <button type="button" onClick={()=>mover(d.id,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                  <button type="button" onClick={()=>mover(d.id,'down')} disabled={i===destaques.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===destaques.length-1?'#4A3F4E':'#B8AAB8',cursor:i===destaques.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Título</label><input className="inp" autoFocus={!!d._novo} value={d.titulo||''} onChange={e=>editarDestaque(d.id,'titulo',e.target.value)} placeholder="Ex: Curso Presencial"/></div>
                    <div><label className="lbl">Texto do botão</label><input className="inp" value={d.texto_botao||''} onChange={e=>editarDestaque(d.id,'texto_botao',e.target.value)} placeholder="Ex: Saiba mais"/></div>
                  </div>
                  <div style={{marginBottom:'10px'}}>
                    <label className="lbl">Descrição</label>
                    <textarea className="inp" value={d.descricao||''} onChange={e=>editarDestaque(d.id,'descricao',e.target.value)} placeholder="Ex: Aprenda técnicas profissionais na prática" rows={2}/>
                    <p style={{fontSize:'10px',color:'#B8AAB8',marginTop:'6px'}}>Aparece resumida (2 linhas) no card da página, e por completo quando o visitante clica pra expandir. Pode escrever mais detalhes aqui sem se preocupar com o tamanho.</p>
                  </div>
                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">Link (URL)</label>
                    <input className="inp" value={d.url||''} onChange={e=>editarDestaque(d.id,'url',e.target.value)} placeholder="https://..."/>
                    <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px',marginBottom:'8px'}}>Cole o link do produto, vídeo, música, página, Instagram ou WhatsApp. A MiniPage tenta reconhecer automaticamente o destino.</p>
                    <button type="button" onClick={()=>gerarPreviaDestaque(d)} disabled={gerandoPreviaId===d.id} style={{background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.28)',color:'#C4B5FD',borderRadius:'8px',padding:'7px 14px',fontSize:'12px',fontWeight:700,cursor:gerandoPreviaId===d.id?'wait':'pointer',fontFamily:'inherit',opacity:gerandoPreviaId===d.id?.7:1}}>{gerandoPreviaId===d.id?'Buscando prévia...':'Gerar prévia pelo link'}</button>
                    <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'8px'}}>A MiniPage tenta preencher título, imagem e informações automaticamente. Algumas plataformas, como Instagram, Shopee ou páginas protegidas, podem não liberar prévia do link. Se isso acontecer, preencha manualmente a imagem, o título e a descrição.</p>
                  </div>

                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">Preço (opcional)</label>
                    <select className="inp" style={{cursor:'pointer',marginBottom:'8px'}} value={d.preco_exibicao||'nao_mostrar'} onChange={e=>editarDestaque(d.id,'preco_exibicao',e.target.value)}>
                      <option value="nao_mostrar">Não mostrar preço</option>
                      <option value="mostrar">Mostrar valor (R$)</option>
                      <option value="texto_personalizado">Texto personalizado</option>
                    </select>
                    {d.preco_exibicao==='mostrar'&&(
                      <div className="fg2">
                        <div><label className="lbl">Preço atual</label><input className="inp" value={d.preco||''} onChange={e=>editarDestaque(d.id,'preco',e.target.value)} placeholder="Ex: 19,90"/></div>
                        <div><label className="lbl">Preço anterior (opcional)</label><input className="inp" value={d.preco_anterior||''} onChange={e=>editarDestaque(d.id,'preco_anterior',e.target.value)} placeholder="Ex: 29,90"/></div>
                      </div>
                    )}
                    {d.preco_exibicao==='texto_personalizado'&&(
                      <input className="inp" value={d.preco_texto_personalizado||''} onChange={e=>editarDestaque(d.id,'preco_texto_personalizado',e.target.value)} placeholder="Ex: A partir de R$99, Sob consulta"/>
                    )}
                  </div>

                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">Selo / etiqueta (opcional)</label>
                    <select className="inp" style={{cursor:'pointer'}} value={d.selo_tipo||''} onChange={e=>editarDestaque(d.id,'selo_tipo',e.target.value)}>
                      <option value="">Sem selo</option>
                      <option value="oferta">Oferta</option>
                      <option value="novo">Novo</option>
                      <option value="destaque">Destaque</option>
                      <option value="promocao">Promoção</option>
                      <option value="patrocinado">Patrocinado</option>
                      <option value="lancamento">Lançamento</option>
                      <option value="outros">Outros (personalizado)</option>
                    </select>
                    {d.selo_tipo==='outros'&&(
                      <input className="inp" style={{marginTop:'8px'}} value={d.selo_texto||''} onChange={e=>editarDestaque(d.id,'selo_texto',e.target.value)} placeholder="Ex: Edição limitada" maxLength={20}/>
                    )}
                  </div>
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
                        <button type="button" onClick={()=>abrirUpload(d.id)} disabled={uploadingId===d.id} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{uploadingId===d.id?'Enviando...':(d.imagem_url?'Trocar imagem':'Enviar imagem')}</button>
                        {d.imagem_url&&<button type="button" onClick={()=>editarDestaque(d.id,'imagem_url','')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>}
                      </div>
                    </div>
                  </div>

                  {d.imagem_url&&(
                    <div style={{marginBottom:'12px'}}>
                      <label className="lbl">Galeria de imagens do destaque</label>
                      <p style={{fontSize:'11px',color:'#B8AAB8',marginBottom:'8px'}}>A imagem marcada como capa aparece no card fechado. As outras imagens aparecem na galeria quando o visitante abre o destaque. Você pode adicionar até 8 imagens.</p>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
                        {galeriaEfetivaDestaque(d).sort((a:any,b:any)=>a.ordem-b.ordem).map((img:any,idx:number,arr:any[])=>(
                          <div key={img.id} style={{width:'76px',flexShrink:0}}>
                            <div style={{position:'relative',width:'76px',height:'76px',borderRadius:'10px',overflow:'hidden',border:img.is_capa?'2px solid #EC4899':'1px solid #2A1A2F'}}>
                              <img src={img.imagem_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              {img.is_capa&&<span style={{position:'absolute',top:'2px',left:'2px',background:'#EC4899',color:'#fff',fontSize:'8px',fontWeight:700,borderRadius:'4px',padding:'1px 4px'}}>Capa</span>}
                            </div>
                            <div style={{display:'flex',gap:'2px',marginTop:'4px',justifyContent:'center'}}>
                              <button type="button" onClick={()=>moverImagemGaleriaDestaque(d,img,'up')} disabled={idx===0||img._legado} title="Mover pra esquerda" style={{width:'20px',height:'20px',borderRadius:'5px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:idx===0||img._legado?'#4A3F4E':'#B8AAB8',cursor:idx===0||img._legado?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px'}}>←</button>
                              <button type="button" onClick={()=>moverImagemGaleriaDestaque(d,img,'down')} disabled={idx===arr.length-1||img._legado} title="Mover pra direita" style={{width:'20px',height:'20px',borderRadius:'5px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:idx===arr.length-1||img._legado?'#4A3F4E':'#B8AAB8',cursor:idx===arr.length-1||img._legado?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px'}}>→</button>
                            </div>
                            {!img.is_capa&&(
                              <button type="button" onClick={()=>definirComoCapaDestaque(d,img)} style={{width:'100%',marginTop:'3px',background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.28)',color:'#C4B5FD',borderRadius:'6px',padding:'3px',fontSize:'9px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Definir capa</button>
                            )}
                            <button type="button" onClick={()=>removerImagemGaleriaDestaque(d,img)} style={{width:'100%',marginTop:'3px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'6px',padding:'3px',fontSize:'9px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={()=>galeriaFileRefs.current[d.id]?.click()} disabled={enviandoGaleriaId===d.id||galeriaEfetivaDestaque(d).length>=8} style={{background:'rgba(24,16,27,.9)',border:'1px dashed #2A1A2F',color:galeriaEfetivaDestaque(d).length>=8?'#4A3F4E':'#B8AAB8',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:galeriaEfetivaDestaque(d).length>=8?'not-allowed':'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'5px'}}><UploadCloud size={13}/> {enviandoGaleriaId===d.id?'Enviando...':galeriaEfetivaDestaque(d).length>=8?'Limite de 8 imagens atingido':'Adicionar imagens'}</button>
                      <input ref={el=>{galeriaFileRefs.current[d.id]=el}} type="file" accept="image/*" onChange={e=>adicionarImagemGaleriaDestaque(d,e)} style={{display:'none'}}/>
                    </div>
                  )}

                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarDestaque(d.id,'ativo',!d.ativo)} style={{background:d.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(d.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:d.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{d.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirDestaque(d.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarDestaque(d)} disabled={salvandoId===d.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoId===d.id?.7:1}}>{salvandoId===d.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <input ref={imgRef} type="file" accept="image/*" onChange={uploadImagem} style={{display:'none'}}/>

        </BloqueioPorPlano>
        </div></div>
      </div>
    </div>
  )
}
