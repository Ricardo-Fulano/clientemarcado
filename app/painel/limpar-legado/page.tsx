'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Item = { id: string; ativo?: boolean; tipo?: string; titulo?: string; nome?: string; url?: string; imagem_url?: string; [key: string]: unknown }
type Grupo = { tabela: string; titulo: string; registros: Item[]; erro: string | null }
type Snapshot = { userId: string; createdAt: string; groups: Record<string, Item[]>; perfil: Record<string, unknown> | null; changed: Record<string, string[]>; bannerChanged: boolean }

// Somente conteúdo editorial da própria conta: NUNCA envolve pagamentos, indicação, assinatura,
// agenda de clientes, cadastro de usuários ou integrações com tokens.
const FONTES = [
  { tabela: 'pagina_destaques', titulo: 'Destaques antigos' },
  { tabela: 'pagina_videos', titulo: 'Vídeos antigos' },
  { tabela: 'pagina_cards', titulo: 'Cartões e imagens' },
  { tabela: 'pagina_catalogo_itens', titulo: 'Produtos de demonstração' },
  { tabela: 'pagina_catalogos', titulo: 'Seções de catálogo' },
  { tabela: 'pagina_albuns', titulo: 'Álbuns antigos' },
  { tabela: 'pagina_eventos', titulo: 'Eventos antigos' },
] as const
const BACKUP_KEY = 'minipage_reset_legado_v1'
const CSS = { panel: { padding: 20, border: '1px solid #44364E', borderRadius: 16, background: '#191420', marginTop: 15 } as const,
  button: { padding: '12px 16px', border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 750 } as const }
function texto(x: unknown) { return typeof x === 'string' ? x : '' }
function itemDescricao(i: Item) { return [i.titulo,i.nome,i.url].map(texto).filter(Boolean).join(' • ') || `Item ${i.id.slice(0,8)}` }
function chave(uid: string) { return BACKUP_KEY + ':' + uid }

export default function LimparLegado() {
  const [uid,setUid] = useState('')
  const [grupos,setGrupos] = useState<Grupo[]>([])
  const [perfil,setPerfil] = useState<Record<string, unknown> | null>(null)
  const [status,setStatus] = useState('Lendo os dados da sua conta...')
  const [busy,setBusy] = useState(false)
  const [banner,setBanner] = useState(true)
  const [snapshot,setSnapshot] = useState<Snapshot|null>(null)

  async function carregar() {
    setStatus('Buscando os conteúdos ativos. Nenhuma alteração foi realizada.')
    const { data: { user },error } = await supabase.auth.getUser()
    if (error || !user) { setStatus('É necessário estar autenticado.');return }
    setUid(user.id)
    const r = await supabase.from('perfis').select('*').eq('user_id',user.id).maybeSingle()
    if (r.error || !r.data) { setStatus('Não foi possível identificar o perfil com segurança.');return }
    setPerfil(r.data as Record<string,unknown>)
    const results:Grupo[]=[]
    for (const f of FONTES) {
      const q=await supabase.from(f.tabela).select('*').eq('user_id',user.id).eq('ativo',true).limit(500)
      results.push({ ...f, registros:Array.isArray(q.data)?q.data as Item[]:[], erro:q.error?.message||null })
    }
    setGrupos(results)
    const anterior=localStorage.getItem(chave(user.id))
    if(anterior){try {setSnapshot(JSON.parse(anterior) as Snapshot)}catch{}}
    setStatus(results.some(g=>g.erro)?'Algumas consultas falharam: o reset está bloqueado até todas responderem.':'Pronto. Confira os registros abaixo antes de confirmar.')
  }
  useEffect(()=>{void carregar()},[])
  const erro=grupos.length!==FONTES.length||grupos.some(g=>g.erro)
  const n=grupos.reduce((s,g)=>s+g.registros.length,0)
  const bannerAtivo=Boolean(perfil && ['capa_url','imagem_capa','banner_url','banner_video_url'].some(k=>Boolean(perfil[k])))

  async function resetar() {
    if(busy||!uid||erro||!perfil)return
    const confirma=window.confirm(`Preparar uma página limpa para esta conta?\n\n${n} itens editoriais serão DESATIVADOS, não apagados.\n${banner&&bannerAtivo?'A imagem de capa/banner será desvinculada.\n':''}Links sociais, Spotify, dados de clientes, pagamentos e assinaturas serão preservados.\n\nUm backup recuperável será salvo neste navegador antes de alterar.\n\nDeseja continuar?`)
    if(!confirma)return
    setBusy(true)
    const backup:Snapshot={userId:uid,createdAt:new Date().toISOString(),groups:Object.fromEntries(grupos.map(g=>[g.tabela,g.registros])),perfil:{ ...perfil },changed:{},bannerChanged:false}
    // O backup e gravado primeiro. Falha de armazenamento = nenhuma alteração.
    try{localStorage.setItem(chave(uid),JSON.stringify(backup))}catch{setStatus('Não foi possível criar o backup local. Nenhuma alteração realizada.');setBusy(false);return}
    setSnapshot(backup)
    let falhas=0
    for(const grupo of grupos){
      const ids=grupo.registros.map(r=>r.id).filter(Boolean)
      if(!ids.length)continue
      const {data,error:updateError}=await supabase.from(grupo.tabela).update({ativo:false}).eq('user_id',uid).in('id',ids).select('id')
      if(updateError || !Array.isArray(data)||data.length!==ids.length){falhas++;setStatus(`Falha na tabela ${grupo.tabela}: ${updateError?.message||'confirmação incompleta'}. Outras alterações podem ter ocorrido.`)}
      if(Array.isArray(data)){backup.changed[grupo.tabela]=data.map((r:{id:string})=>r.id);localStorage.setItem(chave(uid),JSON.stringify(backup))}
    }
    if(banner&&bannerAtivo){
      const patch:Record<string,null>={}
      for(const k of ['capa_url','imagem_capa','banner_url','banner_video_url']) if(Object.prototype.hasOwnProperty.call(perfil,k)) patch[k]=null
      if(Object.keys(patch).length){
        const {data,error:updateError}=await supabase.from('perfis').update(patch).eq('user_id',uid).select('user_id')
        if(updateError||!Array.isArray(data)||data.length!==1){falhas++;setStatus('Falhou a remoção do banner. Os itens já desativados permanecem recuperáveis.')}
        else {backup.bannerChanged=true;localStorage.setItem(chave(uid),JSON.stringify(backup))}
      }
    }
    setSnapshot({...backup});setBusy(false)
    await carregar()
    setStatus(falhas?`Operação parcial (${falhas} falha(s)). Use Restaurar para desfazer ou verifique as permissões.`:'Conteúdo editorial antigo desativado. Links sociais e Spotify foram preservados. Recarregue a página pública.')
  }

  async function restaurar(){
    if(busy||!uid||!snapshot||snapshot.userId!==uid)return
    if(!window.confirm('Restaurar os conteúdos que foram desativados por esta ferramenta?'))return
    setBusy(true)
    let errors=0
    for(const [table,ids] of Object.entries(snapshot.changed)){
      if(!FONTES.some(f=>f.tabela===table)||!ids.length)continue
      const r=await supabase.from(table).update({ativo:true}).eq('user_id',uid).in('id',ids).select('id')
      if(r.error||!Array.isArray(r.data)||r.data.length!==ids.length)errors++
    }
    if(snapshot.bannerChanged&&snapshot.perfil){
      const patch:Record<string,unknown>={}
      for(const k of ['capa_url','imagem_capa','banner_url','banner_video_url']) if(Object.prototype.hasOwnProperty.call(snapshot.perfil,k)) patch[k]=snapshot.perfil[k]??null
      if(Object.keys(patch).length){const r=await supabase.from('perfis').update(patch).eq('user_id',uid).select('user_id');if(r.error||!r.data?.length)errors++}
    }
    if(!errors){localStorage.removeItem(chave(uid));setSnapshot(null)}
    setBusy(false);await carregar()
    setStatus(errors?`Restauracao parcial (${errors} falha(s)); o backup continua disponível.`:'Restaurado. Atualize a página pública.')
  }

  return <main style={{background:'#0B0A10',color:'#F8F4FF',minHeight:'100vh',padding:'30px 16px 80px',fontFamily:'system-ui'}}><div style={{maxWidth:920,margin:'auto'}}>
    <Link href="/painel" style={{color:'#C9FA45'}}>← Voltar ao painel</Link>
    <h1 style={{fontSize:30,margin:'22px 0 8px'}}>Preparar minha MiniPage limpa</h1>
    <p style={{color:'#CFC4DA',lineHeight:1.6}}>Esta ação retira da exibição os antigos conteúdos editoriais da <strong>sua conta</strong>, incluindo exemplos de banner, destaques, catálogos e vídeos. Não apaga registros; preserva links sociais, player Spotify, assinaturas e clientes.</p>
    <div style={CSS.panel}><strong>Conteúdos encontrados: {n}</strong><p>{status}</p>
      <p style={{color:'#CFC4DA',fontSize:13}}>Banner atual: {bannerAtivo?'Sim':'Não identificado'}</p>
      <label style={{display:'block',margin:'14px 0'}}><input type="checkbox" checked={banner} onChange={e=>setBanner(e.target.checked)}/> Remover capa/banner antigo do perfil (reversível)</label>
      <label style={{display:'block',margin:'14px 0',opacity:.8}}><input type="checkbox" checked={true} disabled onChange={()=>{}}/> Preservar links sociais e Spotify (obrigatório)</label>
      <button disabled={busy||erro||!uid||(!n&&!bannerAtivo)} onClick={()=>void resetar()} style={{...CSS.button,background:'#C9FA45',color:'#121612',opacity:(busy||erro)?0.5:1}}>{busy?'Processando...':'Preparar página limpa agora'}</button>
      {snapshot?.userId===uid&&<button disabled={busy} onClick={()=>void restaurar()} style={{...CSS.button,background:'#33283F',color:'white',marginLeft:10}}>Restaurar conteúdo anterior</button>}
    </div>
    <div style={CSS.panel}><h2 style={{fontSize:20}}>Conferência antes de alterar</h2>{grupos.map(g=><section key={g.tabela} style={{borderTop:'1px solid #51455A',padding:'12px 0'}}><strong>{g.titulo}: {g.registros.length}</strong>{g.erro?<p style={{color:'#FFB1B1'}}>Erro: {g.erro}</p>:<ul>{g.registros.slice(0,15).map(r=><li key={r.id} style={{marginTop:5,fontSize:13,color:'#CFC4DA'}}>{itemDescricao(r)}</li>)}</ul>}{g.registros.length>15?<p style={{fontSize:12}}>E mais {g.registros.length-15} registros.</p>:null}</section>)}</div>
    <p style={{fontSize:13,color:'#CFC4DA'}}>O backup desta operação fica no navegador utilizado. Para máxima segurança, mantenha seu backup do banco Supabase antes de realizar alterações em dados reais. Nada é publicado automaticamente.</p>
  </div></main>
}
