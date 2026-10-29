'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { obterLimiteModelosCor, obterLimiteLinksRapidos, permiteDestaques, podeUsarCatalogo } from '../../lib/planos'
import { TEMAS_MINIPAGE } from '../../lib/temasMiniPage'
import ThemePreviewCard from '../../components/ThemePreviewCard'
import { PLATAFORMAS_LINK, labelPlataforma, placeholderPlataforma, normalizarInstagram, normalizarFacebook } from '../../lib/plataformasLinks'

// IMPORTANTE: "Pular por agora" foi removido (Parte 2A) - a unica forma de liberar o painel
// agora e concluir o onboarding de verdade. O nome da chave abaixo continua o mesmo por
// seguranca (evita invalidar contas que ja testaram/concluiram o onboarding antes desta
// mudanca), mas o SIGNIFICADO mudou: agora ela so e gravada quando o onboarding e
// REALMENTE concluido (nunca mais por um atalho de "pular").
function chaveOnboarding(userId: string) {
  return `minipage_onboarding_visto_${userId}`
}

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// D2: respostas da rota de aplicacao do modelo que NAO sao falha tecnica (a recusa e esperada ou nao se resolve tentando de novo):
// o onboarding conclui normalmente, sem modelo. Qualquer outra resposta (rede, 5xx, erro inesperado) oferece "Tentar de novo".
const RECUSAS_ESPERADAS_MODELO = [
  'TEMPLATE_INDISPONIVEL', 'TEMPLATE_NAO_ENCONTRADO', 'PLANO_INCOMPATIVEL', 'STATUS_NAO_ATIVO', 'CONTA_JA_TEM_CONTEUDO',
  'CONTA_ANTERIOR_AO_MODELO', 'MODELO_VAZIO', 'MODULO_NAO_SUPORTADO', 'USUARIO_E_A_PROPRIA_FONTE', 'PERFIL_NAO_ENCONTRADO',
]

function montarLinkWhatsapp(valor: string) {
  const v = (valor || '').trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const somenteDigitos = v.replace(/\D/g, '')
  const temLetra = /[a-zA-Z]/.test(v)
  if (temLetra) return `https://wa.me/${v.replace('@', '').trim()}`
  if (somenteDigitos) return `https://wa.me/${somenteDigitos.startsWith('55') ? somenteDigitos : `55${somenteDigitos}`}`
  return v
}

type LinkForm = { id: string; tipo: string; titulo: string; url: string; descricao: string }

export default function CriarMiniPage() {
  const [carregando, setCarregando] = useState(true)
  const [userId, setUserId] = useState('')
  const [planoTipo, setPlanoTipo] = useState('free')
  const [slugOriginal, setSlugOriginal] = useState('')
  // O indice da etapa atual dentro da lista dinamica calculada a partir do plano (ver
  // etapasAtivas abaixo) - nao mais um numero fixo de 1 a 4, ja que o numero de etapas
  // varia por plano.
  const [etapaIndex, setEtapaIndex] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [concluido, setConcluido] = useState(false)
  const [resumoFinal, setResumoFinal] = useState<string[]>([])

  // D2: modelo automatico (produtos-vendas). So existe quando o SERVIDOR diz que esta conta e elegivel (conta nova, plano e status
  // compativeis, modelo ligado). Free e contas antigas recebem lista vazia e o onboarding fica EXATAMENTE como sempre foi.
  const [modeloAuto, setModeloAuto] = useState<{ id: string; tema_sugerido: string | null } | null>(null)
  const [temaTocado, setTemaTocado] = useState(false)
  const [aplicandoModelo, setAplicandoModelo] = useState(false)
  const [erroModelo, setErroModelo] = useState(false)
  const [modeloAplicado, setModeloAplicado] = useState(false)
  const etapaIndexRef = useRef(0)

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('')
  const [bio, setBio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')

  const [temaEscolhido, setTemaEscolhido] = useState('modelo1')

  const [links, setLinks] = useState<LinkForm[]>([])

  // Destaque (Parte 2A) - guarda o id do destaque ja criado NESTA sessao de onboarding,
  // pra evitar duplicar caso o cliente volte e avance de novo (nesse caso faz UPDATE em vez
  // de INSERT). Nao cria nada no banco so por preencher os campos - so no salvamento final.
  const [destaqueId, setDestaqueId] = useState<string | null>(null)
  const [destaqueTitulo, setDestaqueTitulo] = useState('')
  const [destaqueDescricao, setDestaqueDescricao] = useState('')
  const [destaqueUrl, setDestaqueUrl] = useState('')
  const [destaqueImagemUrl, setDestaqueImagemUrl] = useState('')

  // Etapas adaptativas por plano - uma unica lista + filtro, sem criar 5 componentes
  // separados. Free nao ve Destaque (permiteDestaques ja e a mesma regra usada no resto do
  // sistema pra liberar esse modulo). Declarado aqui, antes de qualquer funcao que precise
  // ler etapaAtual/etapasAtivas (avancar etapa, useEffect de finalizacao, etc).
  const etapasAtivas: Array<'identidade' | 'visual' | 'links' | 'destaque' | 'finalizar'> = [
    'identidade', 'visual',
    // D2: com modelo automatico a etapa de links some (o modelo ja traz links de exemplo e a funcao do banco recusa conta que ja tem links).
    ...(modeloAuto ? ([] as Array<'links'>) : (['links'] as Array<'links'>)),
    // Etapa de Destaque DESATIVADA por enquanto: destaques criados sem secao_id (decisao
    // tomada por seguranca, ja que nao encontramos onde uma secao e criada com garantia) nao
    // apareciam na pagina publica. Fica pronta pra reativar quando isso for resolvido -
    // basta trocar a linha abaixo de volta para: ...(permiteDestaques(planoTipo) ? ['destaque' as const] : []),
    ...([] as Array<'destaque'>),
    'finalizar',
  ]
  const etapaAtual = etapasAtivas[etapaIndex]
  etapaIndexRef.current = etapaIndex

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).maybeSingle()
      if (p) {
        setPlanoTipo(p.plano_tipo || 'free')
        setNome(p.nome_negocio || '')
        setSlug(p.slug || '')
        setSlugOriginal(p.slug || '')
        setFotoPerfilUrl(p.foto_perfil_url || '')
        setBio(p.pagina_descricao_curta || p.descricao || '')
        setWhatsapp(p.whatsapp || '')
        setInstagram(p.instagram || '')
        setTemaEscolhido(p.public_theme || p.tema_publico || 'modelo1')
      }
      setCarregando(false)
      carregarModelo()
    }
    // D2: pergunta ao SERVIDOR se esta conta deve receber o modelo. Qualquer falha = sem modelo (o onboarding segue como sempre).
    // A resposta so vale enquanto o cliente ainda esta na identidade ou no visual: depois disso a etapa de links ja pode ter sido usada.
    async function carregarModelo() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const res = await fetch('/api/onboarding/templates', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
        if (!res.ok) return
        const corpo = await res.json().catch(() => null)
        const t = corpo && Array.isArray(corpo.templates) ? corpo.templates[0] : null
        if (!t || typeof t.id !== 'string') return
        if (etapaIndexRef.current > 1) return
        setModeloAuto({ id: t.id, tema_sugerido: typeof t.tema_sugerido === 'string' ? t.tema_sugerido : null })
      } catch { /* sem modelo */ }
    }
    carregar()
  }, [])

  // D2: o tema sugerido pelo modelo vem PRE-SELECIONADO, mas a escolha e do cliente: so vale se ele ainda nao escolheu nenhum
  // e se o plano permite esse tema.
  useEffect(() => {
    const sugerido = modeloAuto?.tema_sugerido
    if (!sugerido || temaTocado) return
    const limite = obterLimiteModelosCor(planoTipo)
    const permitidos = TEMAS_MINIPAGE.slice(0, limite === Infinity ? TEMAS_MINIPAGE.length : limite)
    if (permitidos.some(m => m.id === sugerido)) setTemaEscolhido(sugerido)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeloAuto])

  function marcarVistoEIr(destino: string) {
    try { localStorage.setItem(chaveOnboarding(userId), '1') } catch (e) {}
    window.location.href = destino
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setMsg('Envie uma imagem JPG, PNG ou WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('A imagem deve ter no máximo 5MB.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `perfis/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    setFotoPerfilUrl(data.publicUrl)
    setMsg('')
  }

  async function uploadImagemDestaque(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setMsg('Envie uma imagem JPG, PNG ou WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('A imagem deve ter no máximo 5MB.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `destaques/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    setDestaqueImagemUrl(data.publicUrl)
    setMsg('')
  }

  function avancarEtapa1() {
    if (!nome.trim() || !slug.trim()) { setMsg('Nome e link são obrigatórios.'); return }
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  function avancarEtapa2() {
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  const limiteLinks = obterLimiteLinksRapidos(planoTipo)
  const atingiuLimiteLinks = links.length >= limiteLinks

  function adicionarLink() {
    if (atingiuLimiteLinks) return
    setLinks(prev => [...prev, { id: 'novo-' + Date.now(), tipo: 'whatsapp', titulo: '', url: '', descricao: '' }])
  }
  function removerLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
  }
  function editarLink(id: string, campo: keyof LinkForm, valor: string) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l))
  }

  function avancarEtapa3() {
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  function avancarDestaque() {
    setMsg('')
    setEtapaIndex(i => i + 1)
  }

  useEffect(() => {
    if (etapaAtual !== 'finalizar' || carregando) return
    finalizarOnboarding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaIndex])

  async function finalizarOnboarding() {
    setSalvando(true)
    setMsg('')
    const slugFmt = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    if (slugFmt !== slugOriginal) {
      const { data: existente } = await supabase.from('perfis_publicos').select('user_id').eq('slug', slugFmt).maybeSingle()
      if (existente && existente.user_id !== userId) {
        setMsg('Esse link já está em uso. Escolha outro.')
        setSalvando(false)
        setEtapaIndex(0)
        return
      }
    }

    const { error } = await supabase.from('perfis').update({
      nome_negocio: nome.trim(),
      slug: slugFmt,
      foto_perfil_url: fotoPerfilUrl || null,
      pagina_descricao_curta: bio.trim() || null,
      whatsapp: whatsapp.replace(/\D/g, '') || null,
      instagram: instagram.trim() || null,
      public_theme: temaEscolhido,
    }).eq('user_id', userId)

    if (error) { setMsg('Erro ao salvar: ' + error.message); setSalvando(false); setEtapaIndex(0); return }

    const linksValidos = links.filter(l => l.titulo.trim() && l.url.trim())
    let linksSalvos = 0
    for (let i = 0; i < linksValidos.length; i++) {
      const l = linksValidos[i]
      let urlFinal = l.url.trim()
      if (l.tipo === 'whatsapp') urlFinal = montarLinkWhatsapp(l.url)
      else if (l.tipo === 'email') urlFinal = `mailto:${l.url.trim()}`
      else if (l.tipo === 'instagram') urlFinal = normalizarInstagram(l.url)
      else if (l.tipo === 'facebook') urlFinal = normalizarFacebook(l.url)
      const { error: erroLink } = await supabase.from('pagina_links').insert({
        user_id: userId, tipo: l.tipo, titulo: l.titulo.trim(), descricao: l.descricao.trim() || null, url: urlFinal, ativo: true, ordem: i,
      })
      if (!erroLink) linksSalvos++
    }

    // Destaque: so salva se o titulo foi preenchido (nunca cria destaque vazio/ficticio). Se
    // o cliente ja tinha confirmado um destaque nesta MESMA sessao de onboarding (voltou e
    // avancou de novo), atualiza o registro existente em vez de inserir outro.
    let destaqueSalvo = false
    if (destaqueTitulo.trim()) {
      const payloadDestaque = {
        user_id: userId,
        titulo: destaqueTitulo.trim(),
        descricao: destaqueDescricao.trim() || null,
        texto_botao: 'Ver mais',
        url: destaqueUrl.trim() || null,
        imagem_url: destaqueImagemUrl || null,
        ativo: true,
        ordem: 0,
      }
      if (destaqueId) {
        const { error: erroUpdate } = await supabase.from('pagina_destaques').update(payloadDestaque).eq('id', destaqueId).eq('user_id', userId)
        destaqueSalvo = !erroUpdate
      } else {
        const { data: novoDestaque, error: erroInsert } = await supabase.from('pagina_destaques').insert(payloadDestaque).select().single()
        if (!erroInsert && novoDestaque) { setDestaqueId(novoDestaque.id); destaqueSalvo = true }
      }
    }

    // D2: modelo automatico. So quando o servidor disse que a conta e elegivel E o cliente nao digitou conteudo proprio (a funcao do banco
    // recusa conta que ja tem conteudo). Recusa esperada segue em silencio; falha tecnica oferece "Tentar de novo" ou "Continuar sem o modelo".
    let aplicouModelo = false
    if (modeloAuto && linksValidos.length === 0 && !destaqueTitulo.trim()) {
      setAplicandoModelo(true)
      const r = await aplicarModeloAutomatico(modeloAuto.id)
      setAplicandoModelo(false)
      if (r === 'falha') {
        setSlug(slugFmt)
        setSlugOriginal(slugFmt)
        setSalvando(false)
        setErroModelo(true)
        return
      }
      aplicouModelo = r === 'aplicado'
    }
    concluirOnboarding(slugFmt, linksSalvos, destaqueSalvo, aplicouModelo)
  }

  // So marca o onboarding como visto quando ele REALMENTE conclui (nunca na falha tecnica do modelo: se o cliente sair, reabre e tenta de novo).
  function concluirOnboarding(slugFmt: string, linksSalvos: number, destaqueSalvo: boolean, aplicouModelo: boolean) {
    setSlug(slugFmt)
    setSlugOriginal(slugFmt)
    try { localStorage.setItem(chaveOnboarding(userId), '1') } catch { /* localStorage indisponivel */ }

    const resumo = ['Perfil', 'Visual']
    if (aplicouModelo) resumo.push('Modelo de exemplo')
    if (linksSalvos > 0) resumo.push(`${linksSalvos} link${linksSalvos > 1 ? 's' : ''}`)
    if (destaqueSalvo) resumo.push('1 destaque')
    setResumoFinal(resumo)
    setModeloAplicado(aplicouModelo)
    setErroModelo(false)
    setSalvando(false)
    setConcluido(true)
  }

  async function aplicarModeloAutomatico(templateId: string): Promise<'aplicado' | 'recusado' | 'falha'> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return 'falha'
      const res = await fetch('/api/onboarding/aplicar-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ template_id: templateId }),
      })
      const corpo = await res.json().catch(() => null)
      if (res.ok && corpo && corpo.ok === true) return 'aplicado'
      if (corpo && typeof corpo.codigo === 'string' && RECUSAS_ESPERADAS_MODELO.includes(corpo.codigo)) return 'recusado'
      return 'falha'
    } catch {
      return 'falha'
    }
  }

  async function tentarModeloDeNovo() {
    if (!modeloAuto) return
    setSalvando(true)
    setErroModelo(false)
    setAplicandoModelo(true)
    const r = await aplicarModeloAutomatico(modeloAuto.id)
    setAplicandoModelo(false)
    if (r === 'falha') { setSalvando(false); setErroModelo(true); return }
    concluirOnboarding(slug, 0, false, r === 'aplicado')
  }

  function continuarSemModelo() {
    concluirOnboarding(slug, 0, false, false)
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p>
      </div>
    )
  }

  const limiteTemas = obterLimiteModelosCor(planoTipo)
  const temasVisiveis = TEMAS_MINIPAGE.slice(0, limiteTemas === Infinity ? TEMAS_MINIPAGE.length : limiteTemas)

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left,rgba(139,92,246,.14),transparent 32%),linear-gradient(180deg,#120A14,#08060A)', fontFamily: 'system-ui', padding: '24px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {etapasAtivas.map((_, n) => (
            <div key={n} style={{ flex: 1, height: '4px', borderRadius: '999px', background: n <= etapaIndex ? G : 'rgba(255,255,255,.10)' }} />
          ))}
        </div>

        {etapaAtual === 'identidade' && (
          <div className="crd" style={{ background: 'rgba(24,16,27,.72)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>Vamos criar sua MiniPage</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '24px' }}>Adicione as informações principais para começar.</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                {fotoPerfilUrl ? (
                  <img src={fotoPerfilUrl} alt="Foto de perfil" style={{ width: '88px', height: '88px', borderRadius: '999px', objectFit: 'cover', border: '3px solid #8B5CF6' }} />
                ) : (
                  <div style={{ width: '88px', height: '88px', borderRadius: '999px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', textAlign: 'center', padding: '8px' }}>
                    Adicionar foto
                  </div>
                )}
                <input type="file" accept="image/*" onChange={uploadFoto} style={{ display: 'none' }} />
              </label>
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Nome exibido</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Estúdio Bella" style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Link da sua página</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
              <span style={{ padding: '0 0 0 14px', fontSize: '13px', color: '#8B8594', whiteSpace: 'nowrap' }}>minipage.pro/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="seunome" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 14px 12px 2px', fontSize: '14px', color: '#F8F4F7', fontFamily: 'inherit' }} />
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Bio curta</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Uma frase sobre você ou seu negócio" rows={2} style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit', resize: 'none' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>WhatsApp (opcional)</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Instagram (opcional)</label>
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@seuusuario" style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', fontFamily: 'inherit' }} />
              </div>
            </div>

            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <button onClick={avancarEtapa1} style={{ width: '100%', height: '48px', background: G, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Continuar
            </button>
          </div>
        )}

        {etapaAtual === 'visual' && (
          <div className="crd" style={{ background: 'rgba(24,16,27,.72)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>Escolha um estilo</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '20px' }}>Você pode trocar isso quando quiser em Aparência.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '12px', marginBottom: '24px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {temasVisiveis.map(m => (
                <ThemePreviewCard key={m.id} tema={m} selecionado={temaEscolhido === m.id} onClick={() => { setTemaTocado(true); setTemaEscolhido(m.id) }} />
              ))}
            </div>

            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapaIndex(i => i - 1)} style={{ flexShrink: 0, height: '48px', padding: '0 18px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Voltar
              </button>
              <button onClick={avancarEtapa2} style={{ flex: 1, height: '48px', background: G, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'links' && (
          <div className="crd" style={{ background: 'rgba(24,16,27,.72)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>Adicione seus links</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '20px' }}>WhatsApp, Instagram, site... adicione quantos quiser, dentro do limite do seu plano. Isso é opcional.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {links.map(l => (
                <div key={l.id} style={{ background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select value={l.tipo} onChange={e => editarLink(l.id, 'tipo', e.target.value)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '8px', padding: '8px 10px', fontSize: '12.5px', color: '#F8F4F7', fontFamily: 'inherit' }}>
                      {PLATAFORMAS_LINK.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <button onClick={() => removerLink(l.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
                  </div>
                  <input value={l.titulo} onChange={e => editarLink(l.id, 'titulo', e.target.value)} placeholder="Título (ex: Fale comigo)" style={{ width: '100%', background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#F8F4F7', marginBottom: '8px', fontFamily: 'inherit' }} />
                  <input value={l.url} onChange={e => editarLink(l.id, 'url', e.target.value)} placeholder={placeholderPlataforma(l.tipo)} style={{ width: '100%', background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#F8F4F7', fontFamily: 'inherit' }} />
                </div>
              ))}
            </div>

            <button onClick={adicionarLink} disabled={atingiuLimiteLinks} style={{ width: '100%', height: '42px', background: 'rgba(139,92,246,.10)', border: '1px dashed rgba(139,92,246,.35)', borderRadius: '10px', color: atingiuLimiteLinks ? '#6B5C6E' : '#C4B5FD', fontSize: '13px', fontWeight: 600, cursor: atingiuLimiteLinks ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
              + Adicionar link
            </button>
            {atingiuLimiteLinks && <p style={{ fontSize: '12px', color: '#FCD34D', marginBottom: '10px' }}>Você atingiu o limite do seu plano.</p>}

            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapaIndex(i => i - 1)} style={{ flexShrink: 0, height: '48px', padding: '0 18px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Voltar
              </button>
              <button onClick={avancarEtapa3} style={{ flex: 1, height: '48px', background: G, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'destaque' && (
          <div className="crd" style={{ background: 'rgba(24,16,27,.72)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '28px 24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>Adicione seu primeiro destaque</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '20px' }}>Use destaques para apresentar ofertas, lançamentos, serviços ou conteúdos importantes. Isso é opcional.</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
              <label style={{ cursor: 'pointer' }}>
                {destaqueImagemUrl ? (
                  <img src={destaqueImagemUrl} alt="Imagem do destaque" style={{ width: '100%', maxWidth: '220px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #2A1A2F' }} />
                ) : (
                  <div style={{ width: '220px', height: '120px', borderRadius: '12px', border: '1px dashed #2A1A2F', background: 'rgba(8,6,10,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', color: '#8B8594' }}>
                    Adicionar imagem (opcional)
                  </div>
                )}
                <input type="file" accept="image/*" onChange={uploadImagemDestaque} style={{ display: 'none' }} />
              </label>
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Título</label>
            <input value={destaqueTitulo} onChange={e => setDestaqueTitulo(e.target.value)} placeholder="Ex: Promoção de lançamento" style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Descrição (opcional)</label>
            <textarea value={destaqueDescricao} onChange={e => setDestaqueDescricao(e.target.value)} placeholder="Conte mais sobre esse destaque" rows={2} style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '16px', fontFamily: 'inherit', resize: 'none' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B8AAB8', marginBottom: '6px' }}>Link (opcional)</label>
            <input value={destaqueUrl} onChange={e => setDestaqueUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: 'rgba(8,6,10,.6)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#F8F4F7', marginBottom: '24px', fontFamily: 'inherit' }} />

            {msg && <p style={{ fontSize: '12.5px', color: '#F87171', marginBottom: '14px' }}>{msg}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapaIndex(i => i - 1)} style={{ flexShrink: 0, height: '48px', padding: '0 18px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Voltar
              </button>
              <button onClick={avancarDestaque} style={{ flex: 1, height: '48px', background: G, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'finalizar' && (
          <div className="crd" style={{ background: 'rgba(24,16,27,.72)', border: '1px solid #2A1A2F', borderRadius: '20px', padding: '36px 24px', textAlign: 'center' }}>
            {salvando ? (
              <p style={{ fontSize: '14px', color: '#B8AAB8' }}>{aplicandoModelo ? 'Montando sua MiniPage com o modelo de exemplo...' : 'Salvando sua MiniPage...'}</p>
            ) : erroModelo ? (
              <>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '8px' }}>Sua MiniPage foi criada.</p>
                <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '22px' }}>Não conseguimos carregar o modelo de exemplo agora. Você pode tentar de novo ou continuar sem o modelo.</p>
                <button onClick={tentarModeloDeNovo} style={{ width: '100%', height: '48px', background: G, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
                  Tentar de novo
                </button>
                <button onClick={continuarSemModelo} style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Continuar sem o modelo
                </button>
              </>
            ) : !concluido ? (
              <>
                {msg && <p style={{ fontSize: '13px', color: '#F87171', marginBottom: '20px' }}>{msg}</p>}
                <button onClick={() => setEtapaIndex(i => i - 1)} style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Voltar
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '56px', height: '56px', borderRadius: '999px', background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '26px' }}>
                  ✓
                </div>
                {modeloAplicado ? (
                  <>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Sua MiniPage está pronta.</h1>
                    <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '14px' }}>Agora personalize os exemplos com suas informações. Você pode editar, ocultar ou excluir qualquer item.</p>
                    {!podeUsarCatalogo(planoTipo) && (
                      <p style={{ fontSize: '12.5px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '14px' }}>O catálogo deste modelo está disponível a partir do plano Loja.</p>
                    )}
                  </>
                ) : (
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Sua MiniPage está pronta!</h1>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginBottom: '24px' }}>
                  {resumoFinal.map(r => (
                    <p key={r} style={{ fontSize: '12.5px', color: '#B8AAB8' }}>✓ {r}</p>
                  ))}
                </div>

                <a href={`https://minipage.pro/${slug}`} target="_blank" rel="noopener noreferrer" onClick={() => marcarVistoEIr(`https://minipage.pro/${slug}`)} style={{ display: 'block', width: '100%', height: '48px', lineHeight: '48px', background: G, color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                  Ver minha MiniPage
                </a>
                <button onClick={() => marcarVistoEIr('/painel/perfil')} style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,.06)', color: '#F8F4F7', border: '1px solid #2A1A2F', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Continuar personalizando
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
