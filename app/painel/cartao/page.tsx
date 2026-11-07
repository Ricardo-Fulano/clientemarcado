'use client'
// Painel > Meu cartao. Disponivel em TODOS os planos (nenhuma checagem de plano de proposito). Dados: so slug, nome e foto do proprio perfil.
// Origem do botao "Abrir meu cartao": localhost em desenvolvimento (somente hosts exatos localhost/127.0.0.1, ver origemLocal) e o dominio publico em producao.
// QR Code, "Copiar link" e o passo a passo para o celular usam SEMPRE o endereco publico canonico (um celular nao alcanca o seu localhost).
import { useEffect, useState, useSyncExternalStore } from 'react'
import PainelSidebar from '@/app/components/PainelSidebar'
import { supabase } from '../../lib/supabase'
import { caminhoQr } from '../../lib/qr'
import { HOST_CANONICO, resolverOrigemCartao, urlCartao, urlQr } from '../../lib/cartao'
import { baixarQrPng, copiar } from '../../lib/cartao-cliente'

interface Perfil { slug: string; nome_negocio: string | null; foto_perfil_url: string | null }

const subscribeNoop = () => () => {}
const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

function QrBox({ texto, rotulo, largura }: { texto: string; rotulo: string; largura: string }) {
  const { d, tamanho } = caminhoQr(texto)
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '10px', width: largura, aspectRatio: '1', flexShrink: 0 }}>
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} role="img" aria-label={rotulo} shapeRendering="crispEdges" style={{ display: 'block', width: '100%', height: '100%' }}>
        <rect width={tamanho} height={tamanho} fill="#ffffff" />
        <path d={d} fill="#000000" />
      </svg>
    </div>
  )
}

/** Miniatura visual do cartao (somente ilustrativa; nao clicavel). */
function Previa({ nome, foto }: { nome: string; foto: string | null }) {
  const bt: React.CSSProperties = { height: '30px', borderRadius: '9px', border: '1px solid #2A1A2F', background: 'rgba(24,16,27,.95)', color: '#F8F4F7', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  return (
    <div aria-hidden="true" style={{ width: '200px', borderRadius: '26px', border: '2px solid #2A1A2F', background: 'radial-gradient(circle at 15% 0%,rgba(139,92,246,.30),transparent 45%),linear-gradient(160deg,#08060A,#150B18)', padding: '18px 14px 16px', textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,.45)', flexShrink: 0 }}>
      <div style={{ width: '58px', height: '58px', borderRadius: '50%', padding: '2px', background: G, margin: '0 auto 8px' }}>
        {foto ? <img src={foto} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#18101B' }} /> : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#18101B', color: '#F8F4F7', fontWeight: 800, fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(nome.trim()[0] || 'M').toUpperCase()}</div>}
      </div>
      <p style={{ fontSize: '13px', fontWeight: 800, color: '#F8F4F7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</p>
      <p style={{ fontSize: '10px', color: '#B8AAB8', margin: '2px 0 10px' }}>Seu cartão de visitas digital</p>
      <div style={{ ...bt, background: G, border: 'none', marginBottom: '6px' }}>Mostrar meu QR Code</div>
      <div style={{ ...bt, marginBottom: '6px' }}>Compartilhar MiniPage</div>
      <div style={{ display: 'flex', gap: '6px' }}><div style={{ ...bt, flex: 1 }}>Ver MiniPage</div><div style={{ ...bt, flex: 1 }}>Painel</div></div>
    </div>
  )
}

export default function MeuCartaoPage() {
  const [carregando, setCarregando] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [aviso, setAviso] = useState('')
  const [instalarAberto, setInstalarAberto] = useState(false)
  const origemCartao = useSyncExternalStore(subscribeNoop, () => resolverOrigemCartao(window.location), () => HOST_CANONICO)

  useEffect(() => {
    let ativo = true
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!ativo) return
      if (error || !data.user) { window.location.assign('/login'); return }
      const { data: p } = await supabase.from('perfis').select('slug, nome_negocio, foto_perfil_url').eq('user_id', data.user.id).maybeSingle()
      if (!ativo) return
      setPerfil(p && p.slug ? (p as Perfil) : null)
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [])

  const mostrar = (m: string) => { setAviso(m); setTimeout(() => setAviso(''), 2600) }
  const cartaoPublico = perfil ? urlCartao(HOST_CANONICO, perfil.slug) : ''
  const cartaoAbrir = perfil ? urlCartao(origemCartao, perfil.slug) : ''

  async function copiarCartao() { mostrar((await copiar(cartaoPublico)) ? 'Link do cartão copiado!' : 'Não foi possível copiar.') }
  async function baixarQr() {
    if (!perfil) return
    const { d, tamanho } = caminhoQr(urlQr(perfil.slug))
    mostrar((await baixarQrPng(d, tamanho, `qrcode-${perfil.slug.replace(/[^A-Za-z0-9._-]/g, '-')}.png`)) ? 'QR Code salvo!' : 'Não foi possível salvar a imagem.')
  }

  const btn: React.CSSProperties = { minHeight: '48px', borderRadius: '12px', padding: '0 18px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(24,16,27,.9)', color: '#F8F4F7', border: '1px solid #2A1A2F', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
  const btnP: React.CSSProperties = { ...btn, background: G, border: 'none', color: '#fff' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 55%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}` }} />
      <PainelSidebar tituloMobile="Meu cartão" />
      <div className="psb-main">
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px 80px' }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '6px' }}>Meu cartão digital</p>
          <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '22px', maxWidth: '560px' }}>Leve sua MiniPage no celular e compartilhe seus contatos em segundos.</p>
          {aviso && <div className="crd" role="status" style={{ padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#34D399' }}>{aviso}</div>}

          {carregando ? (
            <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando...</p>
          ) : !perfil ? (
            <div className="crd" style={{ padding: '28px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '6px' }}>Cartão indisponível nesta conta</p>
              <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6 }}>O cartão digital pertence à conta que criou a MiniPage. Se você acabou de criar a sua, conclua o cadastro da página para gerar o cartão.</p>
            </div>
          ) : (
            <div className="crd" style={{ padding: '24px', display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
              <Previa nome={perfil.nome_negocio || 'Sua MiniPage'} foto={perfil.foto_perfil_url} />
              <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
                <a href={cartaoAbrir} target="_blank" rel="noopener noreferrer" style={btnP}>Abrir meu cartão</a>
                <button type="button" style={btn} onClick={() => setInstalarAberto(true)}>Adicionar à tela inicial</button>
                <button type="button" style={btn} onClick={copiarCartao}>Copiar link do cartão</button>
                <button type="button" style={btn} onClick={baixarQr}>Baixar QR Code</button>
                <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.5, marginTop: '2px' }}>O QR Code leva direto para a sua MiniPage. Disponível em todos os planos.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {instalarAberto && perfil && (
        <div onClick={() => setInstalarAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.66)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="inst-t" onClick={(e) => e.stopPropagation()} className="crd" style={{ width: '100%', maxWidth: '440px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <p id="inst-t" style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>Adicionar à tela inicial</p>
            <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '14px' }}>Faça isso no seu celular, com o cartão aberto:</p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
              <QrBox texto={`${cartaoPublico}?instalar=1`} rotulo="QR Code para abrir o cartão no celular" largura="140px" />
              <ol style={{ flex: '1 1 180px', margin: '0 0 0 18px', fontSize: '13px', color: '#E6DCE6', lineHeight: 1.7 }}>
                <li>Aponte a câmera do celular para este QR Code.</li>
                <li>No cartão, siga o passo a passo que aparece.</li>
              </ol>
            </div>
            <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '14px' }}>
              <strong style={{ color: '#F8F4F7' }}>Android:</strong> toque em Instalar. <strong style={{ color: '#F8F4F7' }}>iPhone:</strong> use o botão Compartilhar do Safari e escolha Adicionar à Tela de Início, com o cartão aberto.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href={`${cartaoAbrir}?instalar=1`} target="_blank" rel="noopener noreferrer" style={{ ...btnP, flex: '1 1 150px' }}>Estou no celular</a>
              <button type="button" style={{ ...btn, flex: '1 1 100px' }} onClick={() => setInstalarAberto(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
