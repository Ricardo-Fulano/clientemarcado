'use client'
import Link from 'next/link'

const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

const CLAUSULAS = [
  { t: '1. Contratante', c: 'Pessoa física ou jurídica que realiza o cadastro e utiliza a plataforma ClienteMarcado.' },
  { t: '2. Contratada', c: 'ClienteMarcado, plataforma digital de gestão para pequenos negócios.' },
  { t: '3. Objeto', c: 'Disponibilização de acesso à plataforma ClienteMarcado para gestão de agenda, clientes, serviços, profissionais, orçamentos, cobranças, pagamentos, relatórios e página pública de agendamento.' },
  { t: '4. Plano', c: 'Plano ClienteMarcado no valor de R$ 79,90/mês, com 7 dias grátis, sem fidelidade.' },
  { t: '5. Teste grátis', c: 'O contratante poderá utilizar a plataforma por 7 dias gratuitamente. Após esse período, poderá ocorrer cobrança da assinatura mensal, caso o cancelamento não seja realizado.' },
  { t: '6. Pagamento', c: 'O pagamento da assinatura será feito conforme a forma de pagamento escolhida no momento da contratação.' },
  { t: '7. Cancelamento', c: 'O contratante poderá cancelar a assinatura quando desejar, respeitando as regras apresentadas no fluxo de contratação.' },
  { t: '8. Uso da plataforma', c: 'O contratante deve utilizar a plataforma de forma lícita, correta e responsável, mantendo seus dados atualizados.' },
  { t: '9. Dados cadastrados', c: 'O contratante é responsável pelos dados dos clientes, pacientes, profissionais, serviços, valores, horários, orçamentos e pagamentos inseridos no sistema.' },
  { t: '10. Limitação de responsabilidade', c: 'O ClienteMarcado é uma ferramenta de organização e gestão. A plataforma não substitui consultoria contábil, jurídica, fiscal, odontológica, médica ou financeira.' },
  { t: '11. Suporte', c: 'O suporte será fornecido conforme os canais disponíveis pela plataforma.' },
  { t: '12. Aceite eletrônico', c: 'O aceite eletrônico por checkbox, botão de confirmação ou continuidade no cadastro terá validade como manifestação de concordância com este contrato.' },
  { t: '13. Atualizações', c: 'O ClienteMarcado poderá atualizar este contrato, funcionalidades e condições da plataforma.' },
  { t: '14. Foro', c: 'As partes elegem o foro competente conforme a legislação aplicável, salvo disposição legal em contrário.' },
]

export default function ContratoDeAdesao() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#050B16 0%,#07111F 50%,#050B16 100%)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', padding: '32px 16px 64px' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .wrap{max-width:780px;margin:0 auto;width:100%}
        .card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:20px;padding:40px 36px}
        .clausula{padding:18px 0;border-bottom:1px solid rgba(148,163,184,.10)}
        .clausula:last-child{border-bottom:none}
        .btn-v{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:42px;padding:0 20px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;text-decoration:none;white-space:nowrap}
        .btn-p{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:42px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;text-decoration:none;white-space:nowrap}
        @media(max-width:600px){
          .card{padding:24px 18px;border-radius:16px}
          .nav-btns{flex-direction:column!important;gap:10px!important}
          .nav-btns a{width:100%!important;justify-content:center!important}
        }
      `}</style>

      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#3B82F6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
        </div>

        <div className="card">
          <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124,58,237,.14)', border: '1px solid rgba(124,58,237,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>📋</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '8px' }}>Contrato de Adesão</h1>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>Contrato de Adesão ao Plano ClienteMarcado entre o contratante e a plataforma ClienteMarcado.</p>
          </div>

          {CLAUSULAS.map(c => (
            <div key={c.t} className="clausula">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>{c.t}</p>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.7 }}>{c.c}</p>
            </div>
          ))}

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(148,163,184,.10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: '#475569' }}>Última atualização: {hoje} · Versão v1.0</p>
          </div>
        </div>

        <div className="nav-btns" style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-v">← Voltar</Link>
          <Link href="/termos-de-uso" className="btn-v">Termos de Uso</Link>
          <Link href="/politica-de-privacidade" className="btn-v">Política de Privacidade</Link>
          <Link href="/cadastro" className="btn-p">Começar 7 dias grátis →</Link>
        </div>
      </div>
    </div>
  )
}
