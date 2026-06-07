'use client'
import { useState } from 'react'
import Link from 'next/link'

const CLAUSULAS = [
  { t: '1. Contratante', c: 'Pessoa fisica ou juridica que realiza o cadastro e utiliza a plataforma ClienteMarcado.' },
  { t: '2. Contratada', c: 'ClienteMarcado, plataforma digital de gestao para pequenos negocios.' },
  { t: '3. Objeto', c: 'Disponibilizacao de acesso a plataforma ClienteMarcado para gestao de agenda, clientes, servicos, profissionais, orcamentos, cobrancas, pagamentos, relatorios e pagina publica de agendamento.' },
  { t: '4. Plano', c: 'Plano ClienteMarcado no valor de R$ 79,90/mes, com 7 dias gratis, sem fidelidade.' },
  { t: '5. Teste gratis', c: 'O contratante podera utilizar a plataforma por 7 dias gratuitamente. Apos esse periodo, podera ocorrer cobranca da assinatura mensal, caso o cancelamento nao seja realizado.' },
  { t: '6. Pagamento', c: 'O pagamento da assinatura sera feito conforme a forma de pagamento escolhida no momento da contratacao.' },
  { t: '7. Cancelamento', c: 'O contratante podera cancelar a assinatura quando desejar, respeitando as regras apresentadas no fluxo de contratacao.' },
  { t: '8. Uso da plataforma', c: 'O contratante deve utilizar a plataforma de forma licita, correta e responsavel, mantendo seus dados atualizados.' },
  { t: '9. Dados cadastrados', c: 'O contratante e responsavel pelos dados dos clientes, pacientes, profissionais, servicos, valores, horarios, orcamentos e pagamentos inseridos no sistema.' },
  { t: '10. Limitacao de responsabilidade', c: 'O ClienteMarcado e uma ferramenta de organizacao e gestao. A plataforma nao substitui consultoria contabil, juridica, fiscal, odontologica, medica ou financeira.' },
  { t: '11. Suporte', c: 'O suporte sera fornecido conforme os canais disponiveis pela plataforma.' },
  { t: '12. Aceite eletronico', c: 'O aceite eletronico por checkbox, botao de confirmacao ou continuidade no cadastro tera validade como manifestacao de concordancia com este contrato.' },
  { t: '13. Atualizacoes', c: 'O ClienteMarcado podera atualizar este contrato, funcionalidades e condicoes da plataforma.' },
  { t: '14. Foro', c: 'As partes elegem o foro competente conforme a legislacao aplicavel, salvo disposicao legal em contrario.' },
]

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
.pg{min-height:100vh;background:radial-gradient(circle at 15% 20%,rgba(124,58,237,.16),transparent 32%),radial-gradient(circle at 85% 15%,rgba(59,130,246,.13),transparent 30%),#050B16;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:0 16px 64px}
.wrap{max-width:700px;margin:0 auto;width:100%}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:24px 0 32px}
.logo-row{display:flex;align-items:center;gap:10px;text-decoration:none}
.logo-ic{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(124,58,237,.5);flex-shrink:0}
.logo-txt{font-size:15px;font-weight:800;color:#F8FAFC;letter-spacing:-0.02em}
.btn-v{background:rgba(15,23,42,.88);color:#94A3B8;border:1px solid rgba(148,163,184,.18);border-radius:10px;height:36px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;text-decoration:none;white-space:nowrap;cursor:pointer;font-family:inherit}
.card{background:radial-gradient(circle at top left,rgba(59,130,246,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:22px;padding:28px;margin-bottom:16px;box-shadow:0 16px 48px rgba(0,0,0,.35)}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.contrato-scroll{max-height:360px;overflow-y:auto;background:rgba(2,6,23,.45);border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:20px;scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.2) transparent}
.contrato-scroll::-webkit-scrollbar{width:4px}
.contrato-scroll::-webkit-scrollbar-thumb{background:rgba(148,163,184,.2);border-radius:4px}
.clausula{padding:12px 0;border-bottom:1px solid rgba(148,163,184,.08)}
.clausula:last-child{border-bottom:none}
.chk-row{display:flex;align-items:flex-start;gap:12px;padding:14px;background:rgba(59,130,246,.05);border:1px solid rgba(59,130,246,.14);border-radius:12px;cursor:pointer;margin-bottom:10px;transition:border-color .15s}
.chk-row:hover{border-color:rgba(59,130,246,.28)}
.chk-box{width:20px;height:20px;border-radius:6px;border:2px solid rgba(148,163,184,.30);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all .15s}
.chk-box.on{background:#3B82F6;border-color:#3B82F6}
.btn-p{width:100%;background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:none;border-radius:14px;padding:16px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 12px 28px rgba(59,130,246,.25);transition:all .18s;margin-bottom:12px}
.btn-p:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 16px 34px rgba(124,58,237,.28)}
.btn-p:disabled{opacity:.45;cursor:not-allowed;transform:none}
.msg-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#F87171;margin-bottom:14px;text-align:center}
.links-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.links-row a{font-size:12px;color:#475569;text-decoration:none;transition:color .15s}
.links-row a:hover{color:#7C3AED}
@media(max-width:480px){.card{padding:20px 16px;border-radius:18px}.hdr{padding:18px 0 24px}}
`

export default function AceitePlano() {
  const [c1, setC1] = useState(false)
  const [c2, setC2] = useState(false)
  const [c3, setC3] = useState(false)
  const [erro, setErro] = useState('')

  const tudo = c1 && c2 && c3

  function handleConfirmar() {
    if (!tudo) { setErro('Para continuar, aceite todos os termos do plano.'); return }
    setErro('')
    try {
      localStorage.setItem('clienteMarcadoAceitePlano', 'true')
      localStorage.setItem('clienteMarcadoAceiteData', new Date().toISOString())
      localStorage.setItem('clienteMarcadoAceiteVersao', '1.0')
    } catch (_) {}
    window.location.href = '/cadastro'
  }

  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">

        {/* Header */}
        <div className="hdr">
          <a href="/" className="logo-row">
            <div className="logo-ic">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="logo-txt">ClienteMarcado</span>
          </a>
          <a href="/" className="btn-v">← Voltar</a>
        </div>

        {/* Intro */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '8px' }}>Antes de começar</h1>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>Revise o plano, leia o contrato e confirme seu aceite para ativar seu teste grátis.</p>
        </div>

        {/* Card do plano */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>Plano ClienteMarcado</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.28)', color: '#4ADE80' }}>7 dias grátis</span>
                <span className="badge" style={{ background: 'rgba(148,163,184,.10)', border: '1px solid rgba(148,163,184,.18)', color: '#94A3B8' }}>Sem fidelidade</span>
                <span className="badge" style={{ background: 'rgba(148,163,184,.10)', border: '1px solid rgba(148,163,184,.18)', color: '#94A3B8' }}>Cancele quando quiser</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#60A5FA', letterSpacing: '-0.02em', lineHeight: 1 }}>R$ 79,90</p>
              <p style={{ fontSize: '12px', color: '#64748B' }}>/mês após o teste</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(148,163,184,.10)', paddingTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {['Agenda e agendamento online', 'Clientes e profissionais', 'Orcamentos e cobrancas', 'Pagamentos e relatorios', 'Pagina publica de agendamento', 'Suporte por WhatsApp'].map(i => (
              <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: '#94A3B8' }}>
                <span style={{ color: '#4ADE80', flexShrink: 0 }}>✓</span>{i}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)', borderRadius: '10px', fontSize: '12px', color: '#FCD34D', lineHeight: 1.6 }}>
            ⚠ Voce podera testar gratuitamente por 7 dias. Apos esse periodo, podera ser cobrado R$ 79,90/mes, caso nao cancele antes.
          </div>
        </div>

        {/* Card do contrato */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>Contrato de Adesao</p>
            <p style={{ fontSize: '12px', color: '#64748B' }}>Leia os principais termos antes de continuar. · Versao 1.0</p>
          </div>
          <div className="contrato-scroll">
            {CLAUSULAS.map(c => (
              <div key={c.t} className="clausula">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>{c.t}</p>
                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.7 }}>{c.c}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card de aceite */}
        <div className="card">
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '16px' }}>Confirmacao de aceite</p>

          <div className="chk-row" onClick={() => { setC1(!c1); setErro('') }}>
            <div className={'chk-box' + (c1 ? ' on' : '')}>
              {c1 && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>Li e aceito o <Link href="/contrato-de-adesao" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#7C3AED', fontWeight: 600 }}>Contrato de Adesao</Link> do ClienteMarcado.</p>
          </div>

          <div className="chk-row" onClick={() => { setC2(!c2); setErro('') }}>
            <div className={'chk-box' + (c2 ? ' on' : '')}>
              {c2 && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>Li e aceito os <Link href="/termos-de-uso" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#7C3AED', fontWeight: 600 }}>Termos de Uso</Link> e a <Link href="/politica-de-privacidade" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#7C3AED', fontWeight: 600 }}>Politica de Privacidade</Link>.</p>
          </div>

          <div className="chk-row" onClick={() => { setC3(!c3); setErro('') }}>
            <div className={'chk-box' + (c3 ? ' on' : '')}>
              {c3 && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>Estou ciente de que o plano possui 7 dias gratis e, apos esse periodo, poderei ser cobrado R$ 79,90/mes, caso nao cancele antes.</p>
          </div>

          {erro && <div className="msg-err">{erro}</div>}

          <button onClick={handleConfirmar} disabled={!tudo} className="btn-p">
            Aceitar contrato e continuar →
          </button>

          <div className="links-row">
            <a href="/">← Voltar</a>
            <span style={{ color: '#1E293B' }}>·</span>
            <Link href="/termos-de-uso" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none' }}>Termos de Uso</Link>
            <span style={{ color: '#1E293B' }}>·</span>
            <Link href="/politica-de-privacidade" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none' }}>Politica de Privacidade</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
