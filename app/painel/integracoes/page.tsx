'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'
import { ehMetaPixelIdValido, ehGa4IdValido, normalizarMetaPixelId, normalizarGa4Id } from '../../lib/pixelsPublicos'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}}
`

type Chave = 'meta_pixel_id' | 'ga4_measurement_id'

const MSG_INVALIDO: Record<Chave, string> = {
  meta_pixel_id: 'Pixel ID inválido. Use somente números (10 a 20 dígitos), sem espaços nem código.',
  ga4_measurement_id: 'Measurement ID inválido. Use o formato G-XXXXXXXXXX (letras maiúsculas e números).',
}

export default function Integracoes() {
  const [userId, setUserId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvo, setSalvo] = useState<Record<Chave, string | null>>({ meta_pixel_id: null, ga4_measurement_id: null })
  const [campo, setCampo] = useState<Record<Chave, string>>({ meta_pixel_id: '', ga4_measurement_id: '' })
  const [ocupado, setOcupado] = useState<Chave | null>(null)
  const [msg, setMsg] = useState<{ chave: Chave; ok: boolean; texto: string } | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data } = await supabase.from('perfis').select('meta_pixel_id, ga4_measurement_id').eq('user_id', user.id).maybeSingle()
    const meta = data?.meta_pixel_id || null
    const ga = data?.ga4_measurement_id || null
    setSalvo({ meta_pixel_id: meta, ga4_measurement_id: ga })
    setCampo({ meta_pixel_id: meta || '', ga4_measurement_id: ga || '' })
    setCarregando(false)
  }

  // Grava SO a coluna escolhida, SO na linha do usuario logado, e confere que 1 linha foi mesmo atualizada
  // (a RLS pode bloquear sem devolver erro). O banco ainda tem CHECK de formato: nada alem de ID valido entra.
  async function gravar(chave: Chave, valor: string | null) {
    setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (user.id !== userId) { setMsg({ chave, ok: false, texto: 'A sessão mudou. Recarregue a página antes de salvar.' }); return }
    setOcupado(chave)
    const { data, error } = await supabase.from('perfis').update({ [chave]: valor }).eq('user_id', userId).select('user_id')
    setOcupado(null)
    if (error) {
      const formato = (error as any).code === '23514' || /check constraint/i.test(error.message || '')
      setMsg({ chave, ok: false, texto: formato ? MSG_INVALIDO[chave] : 'Não foi possível salvar. Tente novamente em instantes.' })
      return
    }
    if (!data || data.length !== 1) { setMsg({ chave, ok: false, texto: 'Não foi possível salvar. Tente novamente em instantes.' }); return }
    setSalvo(prev => ({ ...prev, [chave]: valor }))
    setCampo(prev => ({ ...prev, [chave]: valor || '' }))
    setMsg({ chave, ok: true, texto: valor ? 'ID salvo.' : 'Integração removida.' })
  }

  function salvar(chave: Chave) {
    const valor = chave === 'meta_pixel_id' ? normalizarMetaPixelId(campo[chave]) : normalizarGa4Id(campo[chave])
    const valido = chave === 'meta_pixel_id' ? ehMetaPixelIdValido(valor) : ehGa4IdValido(valor)
    if (!valido) { setMsg({ chave, ok: false, texto: MSG_INVALIDO[chave] }); return }
    gravar(chave, valor)
  }

  if (carregando) return (<div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}><p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p></div>)

  const blocos: { chave: Chave; titulo: string; rotulo: string; exemplo: string; ajuda: string }[] = [
    { chave: 'meta_pixel_id', titulo: 'Meta Pixel', rotulo: 'Pixel ID', exemplo: '123456789012345', ajuda: 'No Gerenciador de Eventos da Meta, abra a sua fonte de dados (Pixel) e copie o número do ID.' },
    { chave: 'ga4_measurement_id', titulo: 'Google Analytics 4', rotulo: 'Measurement ID', exemplo: 'G-XXXXXXXXXX', ajuda: 'No Google Analytics: Admin → Fluxos de dados → seu fluxo da Web. O ID começa com G-.' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Integrações" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '8px' }}>Integrações e rastreamento</p>
          <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '18px' }}>Conecte o Meta Pixel e o Google Analytics à sua MiniPage para medir os acessos e as ações dos visitantes.</p>

          <div className="crd" style={{ padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.6 }}>
              Quando você conecta uma ferramenta, a sua MiniPage mostra um aviso aos visitantes e <strong style={{ color: '#F8F4F7' }}>só envia dados a ela depois que o visitante aceitar</strong>. Quem recusa não é rastreado. Você é responsável por informar seus visitantes e manter sua política de privacidade atualizada.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {blocos.map(b => {
              const conectado = !!salvo[b.chave]
              const m = msg && msg.chave === b.chave ? msg : null
              return (
                <div key={b.chave} className="crd" style={{ padding: '18px' }} data-bloco={b.chave}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>{b.titulo}</p>
                    <span data-status style={{ fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '3px 10px', color: conectado ? '#22C55E' : '#B8AAB8', background: conectado ? 'rgba(34,197,94,.14)' : 'rgba(184,170,184,.12)', border: '1px solid ' + (conectado ? 'rgba(34,197,94,.3)' : '#2A1A2F') }}>{conectado ? 'Conectado' : 'Não configurado'}</span>
                  </div>
                  <label className="lbl" htmlFor={'in-' + b.chave}>{b.rotulo}</label>
                  <input id={'in-' + b.chave} className="inp" value={campo[b.chave]} onChange={e => setCampo(prev => ({ ...prev, [b.chave]: e.target.value }))} placeholder={'Ex: ' + b.exemplo} autoComplete="off" spellCheck={false} maxLength={40} />
                  <p style={{ fontSize: '11px', color: '#8B7D8B', marginTop: '6px', lineHeight: 1.5 }}>{b.ajuda}</p>
                  {conectado && <p style={{ fontSize: '11px', color: '#8B7D8B', marginTop: '4px', lineHeight: 1.5 }}>ID salvo. Os eventos aparecem {b.chave === 'meta_pixel_id' ? 'no Gerenciador de Eventos' : 'em Relatórios → Tempo real'} em alguns minutos, depois que um visitante aceitar o aviso.</p>}
                  {m && <p role={m.ok ? 'status' : 'alert'} style={{ fontSize: '12px', fontWeight: 600, marginTop: '10px', color: m.ok ? '#22C55E' : '#EF4444' }}>{m.texto}</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => salvar(b.chave)} disabled={ocupado !== null} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 700, cursor: ocupado ? 'default' : 'pointer', fontFamily: 'inherit', opacity: ocupado ? .7 : 1 }}>{ocupado === b.chave ? 'Salvando...' : 'Salvar'}</button>
                    {conectado && <button type="button" onClick={() => gravar(b.chave, null)} disabled={ocupado !== null} style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: ocupado ? 'default' : 'pointer', fontFamily: 'inherit' }}>Remover</button>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="crd" style={{ padding: '16px 18px', marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '8px' }}>O que é enviado</p>
            <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.7 }}>
              Visualização da página e cliques em links, WhatsApp, produtos, destaques, vídeos e redes sociais, além de leads capturados (sem enviar o e-mail do visitante). Compras feitas em outras plataformas ainda não são medidas por esta integração.
            </p>
          </div>
        </div></div>
      </div>
    </div>
  )
}
