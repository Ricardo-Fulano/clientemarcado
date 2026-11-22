'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { ehPlanoFree } from '../lib/planos'

type PerfilResumo = {
  user_id?: string | null
  nome_negocio?: string | null
  foto_perfil_url?: string | null
  pagina_descricao_curta?: string | null
  descricao?: string | null
  public_theme?: string | null
  tema_publico?: string | null
  tema_cor?: string | null
  slug?: string | null
  plano_tipo?: string | null
}

type Etapa = { id: string; titulo: string; href: string; pontos: number; concluida: boolean }

const preenchido = (valor: unknown): boolean => typeof valor === 'string' && valor.trim().length > 0

/**
 * Indicador de CONFIGURACAO da MiniPage, nao de pagamento, publicacao efetiva ou engajamento.
 * Usa somente o perfil autenticado ja carregado pelo painel e uma consulta de contagem,
 * sob as politicas RLS existentes. Nao escreve no banco nem altera os planos.
 */
export default function CompletarMiniPageCard({ perfil }: { perfil: PerfilResumo | null }) {
  const [contagem, setContagem] = useState<{ uid: string; valor: number } | null>(null)
  const [falhou, setFalhou] = useState(false)
  const [revisao, setRevisao] = useState(0)

  useEffect(() => {
    let valido = true
    const uid = perfil?.user_id
    if (!uid) return
    setContagem(null)
    setFalhou(false)
    ;(async () => {
      try {
        const { count, error } = await supabase
          .from('pagina_links')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('ativo', true)
          .not('url', 'is', null)
          .neq('url', '')
        if (!valido) return
        if (error || count === null) {
          setFalhou(true)
          return
        }
        setContagem({ uid, valor: count })
      } catch {
        if (valido) setFalhou(true)
      }
    })()
    return () => { valido = false }
  }, [perfil?.user_id, revisao])

  if (!perfil?.user_id) return null

  const linksAtivos = contagem?.uid === perfil.user_id ? contagem.valor : null

  if (linksAtivos === null) {
    return (
      <section aria-label="Progresso da MiniPage" className="crd" style={{padding:'18px 20px',marginBottom:'20px'}}>
        <p style={{color:'#F8F4F7',fontSize:'14px',fontWeight:700,marginBottom:'5px'}}>Complete sua MiniPage</p>
        {falhou ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
            <p style={{fontSize:'12px',color:'#B8AAB8'}}>Não foi possível conferir os links agora. Nenhuma informação foi alterada.</p>
            <button type="button" onClick={() => setRevisao(x => x + 1)} style={{cursor:'pointer',border:'1px solid #59405D',background:'#231829',color:'#F8F4F7',padding:'8px 12px',borderRadius:'9px'}}>Tentar novamente</button>
          </div>
        ) : <p style={{fontSize:'12px',color:'#B8AAB8'}}>Conferindo as informações salvas...</p>}
      </section>
    )
  }

  const etapas: Etapa[] = [
    {id:'foto',titulo:'Adicionar sua foto de perfil',href:'/painel/perfil/aparencia',pontos:20,concluida:preenchido(perfil.foto_perfil_url)},
    {id:'bio',titulo:'Escrever sua biografia',href:'/painel/perfil/aparencia',pontos:20,concluida:preenchido(perfil.pagina_descricao_curta)||preenchido(perfil.descricao)},
    {id:'links',titulo:'Adicionar pelo menos um link ativo',href:'/painel/perfil/links',pontos:25,concluida:linksAtivos > 0},
    {id:'tema',titulo:'Escolher um tema de cores',href:'/painel/perfil/aparencia',pontos:15,concluida:preenchido(perfil.public_theme)||preenchido(perfil.tema_publico)||preenchido(perfil.tema_cor)},
    {id:'endereco',titulo:'Definir o endereço da MiniPage',href:'/painel/perfil',pontos:20,concluida:preenchido(perfil.slug)},
  ]
  const percentual = etapas.reduce((soma, etapa) => soma + (etapa.concluida ? etapa.pontos : 0), 0)
  const concluidas = etapas.filter(etapa => etapa.concluida).length
  const proxima = etapas.find(etapa => !etapa.concluida)

  return (
    <section aria-label="Progresso de configuração da MiniPage" className="crd" style={{padding:'20px',marginBottom:'20px',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:'18px',flexWrap:'wrap',marginBottom:'14px'}}>
        <div style={{height:'92px',width:'92px',flexShrink:0,position:'relative'}} role="img" aria-label={`${percentual}% do perfil configurado`}>
          <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#3A2A40" strokeWidth="9" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#C9FA45" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${percentual * 2.513274} 251.3274`} transform="rotate(-90 50 50)" />
            <text x="50" y="56" textAnchor="middle" fontSize="23" fill="#F8F4F7" fontWeight="800">{percentual}%</text>
          </svg>
        </div>
        <div style={{flex:'1 1 210px'}}>
          <p style={{fontSize:'11px',color:'#C9FA45',fontWeight:800,letterSpacing:'.05em',textTransform:'uppercase',marginBottom:'5px'}}>Sua MiniPage ganhando vida</p>
          <h2 style={{fontSize:'18px',fontWeight:800,color:'#F8F4F7',marginBottom:'5px'}}>{percentual === 100 ? 'Perfil completo!' : 'Complete sua MiniPage'}</h2>
          <p style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5}}>{concluidas} de {etapas.length} itens concluídos. {percentual === 100 ? 'Sua configuração básica está pronta.' : 'Continue de onde parou. Os itens são verificados automaticamente.'}</p>
        </div>
      </div>
      <div style={{height:'7px',borderRadius:'999px',background:'#322337',overflow:'hidden',marginBottom:'15px'}}>
        <div style={{width:`${percentual}%`,height:'100%',background:'#C9FA45',borderRadius:'999px',transition:'width .3s ease'}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'8px'}}>
        {etapas.map(etapa => (
          <Link key={etapa.id} href={etapa.href} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',minHeight:'43px',borderRadius:'11px',border:`1px solid ${etapa.concluida ? 'rgba(201,250,69,.20)' : '#3E2D44'}`,background:etapa.concluida ? 'rgba(201,250,69,.06)' : 'rgba(21,12,25,.5)',textDecoration:'none'}}>
            <span aria-hidden="true" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'21px',width:'21px',borderRadius:'50%',flexShrink:0,background:etapa.concluida?'#C9FA45':'#34263A',color:etapa.concluida?'#171C0D':'#B8AAB8',fontSize:'12px',fontWeight:800}}>{etapa.concluida?'✓':'·'}</span>
            <span style={{fontSize:'12px',fontWeight:etapa.concluida?500:700,color:etapa.concluida?'#C8BBC9':'#F8F4F7',lineHeight:1.4}}>{etapa.titulo}</span>
            <span aria-hidden="true" style={{marginLeft:'auto',fontSize:'13px',color:'#B8AAB8'}}>›</span>
          </Link>
        ))}
      </div>
      {proxima ? (
        <div style={{display:'flex',alignItems:'center',gap:'12px',justifyContent:'space-between',flexWrap:'wrap',marginTop:'15px'}}>
          <p style={{color:'#B8AAB8',fontSize:'12px'}}>Próximo passo: <strong style={{color:'#F8F4F7'}}>{proxima.titulo}</strong></p>
          <Link href={proxima.href} style={{display:'inline-block',padding:'10px 14px',borderRadius:'10px',background:'#C9FA45',color:'#161A0D',fontSize:'12px',fontWeight:800,textDecoration:'none'}}>Completar agora</Link>
        </div>
      ) : (
        <div style={{marginTop:'15px',fontSize:'12px',lineHeight:1.6,color:'#D6CDDA'}}>
          Sua MiniPage tem os elementos essenciais. Você pode continuar aprimorando seus conteúdos quando quiser.
          {ehPlanoFree(perfil.plano_tipo) && <span> <Link href="/painel/plano" style={{fontWeight:700,color:'#C9FA45',textDecoration:'underline'}}>Conheça os recursos Premium</Link> — sua conclusão de 100% não depende de pagar.</span>}
        </div>
      )}
      <p style={{marginTop:'12px',fontSize:'10px',color:'#998C9B',lineHeight:1.5}}>Este indicador mede a configuração do perfil; não confirma publicação, pagamento ou acessibilidade da página pública.</p>
    </section>
  )
}
