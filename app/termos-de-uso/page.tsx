'use client'
import Link from 'next/link'

const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

const SECOES = [
  { t: '1. Sobre o ClienteMarcado', c: 'O ClienteMarcado é uma plataforma digital de gestão para pequenos negócios, incluindo barbearias, salões, estéticas, consultórios simples, clínicas e odontologia básica.' },
  { t: '2. Plano contratado', c: 'O plano inicial da plataforma é o Plano ClienteMarcado, no valor de R$ 79,90 por mês, com 7 dias grátis, sem fidelidade e com possibilidade de cancelamento quando o cliente desejar.' },
  { t: '3. Período gratuito', c: 'O usuário poderá testar a plataforma gratuitamente por 7 dias. Após esse período, a assinatura poderá ser cobrada, caso o cancelamento não seja realizado antes do fim do período gratuito.' },
  { t: '4. Funcionalidades incluídas', c: 'A plataforma poderá incluir agenda, clientes, serviços, profissionais, página pública de agendamento, orçamentos, cobranças, pagamentos, relatórios, lembretes, confirmações e outras funcionalidades de gestão.' },
  { t: '5. Responsabilidades do usuário', c: 'O usuário é responsável pelas informações cadastradas, pelos dados de seus clientes, pelos valores informados, pelos serviços cadastrados, pelos horários configurados e pelo uso correto da plataforma.' },
  { t: '6. Responsabilidades do ClienteMarcado', c: 'O ClienteMarcado se compromete a oferecer uma plataforma funcional, organizada e segura, podendo realizar melhorias, ajustes e atualizações sempre que necessário.' },
  { t: '7. Uso do WhatsApp', c: 'O ClienteMarcado poderá facilitar o envio de mensagens via WhatsApp, mas não se responsabiliza por bloqueios, limitações, indisponibilidades ou alterações de regras feitas pelo WhatsApp ou por terceiros.' },
  { t: '8. Orçamentos, cobranças e pagamentos', c: 'A plataforma poderá permitir a criação de orçamentos, cobranças e registro de pagamentos. O ClienteMarcado organiza as informações, mas não substitui nota fiscal, recibo contábil ou documento fiscal oficial.' },
  { t: '9. Dados e privacidade', c: 'O tratamento de dados pessoais seguirá a Política de Privacidade da plataforma.' },
  { t: '10. Cancelamento', c: 'O usuário poderá solicitar cancelamento conforme as condições exibidas no momento da contratação. Após o cancelamento, o acesso poderá ser limitado ou encerrado.' },
  { t: '11. Suspensão de acesso', c: 'O acesso poderá ser suspenso em caso de inadimplência, uso indevido, tentativa de fraude, violação dos termos ou comportamento que prejudique a plataforma.' },
  { t: '12. Atualizações', c: 'O ClienteMarcado poderá alterar funcionalidades, telas, recursos e condições da plataforma para melhorar o serviço.' },
  { t: '13. Aceite eletrônico', c: 'Ao marcar a opção de aceite e continuar o cadastro ou assinatura, o usuário declara que leu, entendeu e concorda com estes Termos de Uso.' },
  { t: '14. Disposições finais', c: 'Estes termos poderão ser atualizados periodicamente. A versão vigente ficará disponível na própria plataforma.' },
]

export default function TermosDeUso() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#050B16 0%,#07111F 50%,#050B16 100%)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', padding: '32px 16px 64px' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .wrap{max-width:780px;margin:0 auto;width:100%}
        .card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:20px;padding:40px 36px}
        .secao{padding:18px 0;border-bottom:1px solid rgba(148,163,184,.10)}
        .secao:last-child{border-bottom:none}
        .btn-v{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:42px;padding:0 20px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;text-decoration:none;cursor:pointer;white-space:nowrap}
        .btn-p{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:42px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;text-decoration:none;white-space:nowrap}
        @media(max-width:600px){
          .card{padding:24px 18px;border-radius:16px}
          .topo-btns{flex-direction:column!important;gap:10px!important}
          .topo-btns a{width:100%!important;justify-content:center!important}
        }
      `}</style>

      <div className="wrap">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#3B82F6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
        </div>

        <div className="card">
          {/* Header */}
          <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,130,246,.14)', border: '1px solid rgba(59,130,246,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>📄</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '8px' }}>Termos de Uso</h1>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>Estes Termos de Uso regulam o acesso e a utilização da plataforma ClienteMarcado, sistema digital destinado à gestão de agenda, clientes, serviços, profissionais, orçamentos, cobranças, pagamentos e organização de atendimentos para pequenos negócios.</p>
          </div>

          {/* Seções */}
          {SECOES.map(s => (
            <div key={s.t} className="secao">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>{s.t}</p>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.7 }}>{s.c}</p>
            </div>
          ))}

          {/* Rodapé */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(148,163,184,.10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: '#475569' }}>Última atualização: {hoje} · Versão v1.0</p>
            <Link href="/politica-de-privacidade" style={{ fontSize: '12px', color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>Ver Política de Privacidade →</Link>
          </div>
        </div>

        {/* Botões de navegação */}
        <div className="topo-btns" style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-v">← Voltar</Link>
          <Link href="/politica-de-privacidade" className="btn-v">Política de Privacidade</Link>
          <Link href="/contrato-de-adesao" className="btn-v">Contrato de Adesão</Link>
          <Link href="/cadastro" className="btn-p">Começar 7 dias grátis →</Link>
        </div>
      </div>
    </div>
  )
}
