'use client'
import Link from 'next/link'

const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

const SECOES = [
  { t: '1. Quem somos e quem é responsável', c: 'A MiniPage Pro é uma plataforma de páginas profissionais, divulgação digital e recursos de gestão, operada pela pessoa jurídica inscrita no CNPJ 31.671.616/0001-18. Para assuntos relacionados a esta política e ao tratamento de dados pessoais sob nossa responsabilidade, utilize o canal de suporte informado nesta página.' },
  { t: '2. Dados que podem ser tratados', c: 'Conforme o uso dos recursos, podem ser tratados dados de cadastro e contato (como nome, e-mail e telefone), identificação do perfil ou negócio, conteúdo publicado pelo usuário, dados de assinatura e cobrança, registros de acesso e informações de uso, visualizações e cliques. Usuários que utilizem agenda, catálogo, contatos ou outros recursos poderão inserir dados de terceiros sob sua responsabilidade.' },
  { t: '3. Para que utilizamos os dados', c: 'Os dados são utilizados, conforme necessário, para criar e autenticar contas, disponibilizar páginas e funcionalidades contratadas, atender solicitações, operacionalizar assinaturas e pagamentos, prevenir abusos e fraudes, manter a segurança, cumprir obrigações legais e apresentar métricas de desempenho. Comunicações promocionais, quando realizadas, devem respeitar a legislação e as preferências aplicáveis.' },
  { t: '4. Bases legais', c: 'O tratamento pode se apoiar, conforme a finalidade concreta, na execução de contrato ou de procedimentos preliminares, no cumprimento de obrigação legal ou regulatória, no exercício regular de direitos, no legítimo interesse quando cabível e, nas hipóteses exigidas, no consentimento do titular. O consentimento não é presumido como base para todas as operações.' },
  { t: '5. Dados publicados nas MiniPages', c: 'As informações que o usuário decide publicar em sua MiniPage, como nome público, imagem, links, vídeos, produtos e contatos, podem ser acessadas pelos visitantes da página. O usuário deve possuir autorização ou outra base legal adequada para disponibilizar informações pessoais de terceiros e deve evitar publicar informações sensíveis sem necessidade e fundamento apropriado.' },
  { t: '6. Dados de clientes e terceiros', c: 'Quando o titular de uma MiniPage cadastra dados de seus próprios clientes, contatos ou agendamentos, cabe a ele definir as finalidades e garantir a legitimidade dessa coleta e uso, conforme o contexto. A operadora da MiniPage Pro poderá atuar no tratamento técnico desses dados para disponibilizar o serviço, observados os papéis e as responsabilidades previstos na LGPD.' },
  { t: '7. Compartilhamento e fornecedores', c: 'Os dados necessários à operação podem ser tratados por fornecedores de infraestrutura, hospedagem, autenticação, banco de dados, processamento de pagamentos e suporte, conforme o serviço utilizado. A plataforma utiliza serviços como Supabase, Vercel e Asaas em suas operações. Links para WhatsApp e outros sites ou serviços externos seguem também as políticas dos respectivos terceiros. O compartilhamento deve limitar-se ao necessário para cada finalidade e às hipóteses legalmente permitidas.' },
  { t: '8. Assinaturas e pagamentos', c: 'Para contratar e manter planos pagos, dados de identificação, assinatura, situação de pagamento e informações necessárias à cobrança podem ser utilizados pela MiniPage Pro e pelo processador de pagamentos Asaas. A política não altera preços, contratos em vigor, recorrências, obrigações ou fluxos de pagamento. Os dados efetivamente solicitados pelo prestador de pagamentos dependem do meio de pagamento escolhido.' },
  { t: '9. Cookies, armazenamento e métricas', c: 'A plataforma pode utilizar cookies, armazenamento local e mecanismos técnicos equivalentes para autenticação, manutenção de sessão, preferências, funcionamento da experiência e mensuração de acessos e interações. Eventuais ferramentas adicionais de análise ou publicidade, quando habilitadas, devem ser descritas de acordo com sua configuração efetiva e com as regras de transparência e consentimento aplicáveis.' },
  { t: '10. Conservação e exclusão', c: 'Os dados são conservados pelo período necessário às finalidades informadas, à prestação do serviço e ao cumprimento de obrigações legais, fiscais, contratuais ou de segurança, quando aplicáveis. Pedidos de exclusão serão analisados considerando os direitos do titular e as hipóteses legais de conservação. O encerramento da conta não implica necessariamente a exclusão imediata de todos os registros exigidos por lei.' },
  { t: '11. Segurança', c: 'São adotadas medidas técnicas e administrativas compatíveis com os riscos do tratamento para proteger dados pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida. Nenhuma operação digital é isenta de riscos; o usuário também deve proteger suas credenciais e comunicar situações suspeitas ao suporte.' },
  { t: '12. Direitos dos titulares', c: 'Nos termos da LGPD, o titular pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informações sobre compartilhamento, oposição a tratamento irregular e revogação de consentimento. Alguns pedidos dependem de requisitos legais e da identificação do controlador responsável pelos dados.' },
  { t: '13. Solicitações e contato', c: 'Para dúvidas sobre privacidade e solicitações relativas aos seus dados pessoais tratados pela MiniPage Pro, entre em contato pelo WhatsApp de suporte: +55 11 94105-9063 (https://wa.me/5511941059063). Podemos solicitar informações suficientes para verificar a identidade do requerente, evitando a divulgação de dados a terceiros. Quando os dados tiverem sido cadastrados por outro usuário da plataforma, a solicitação poderá precisar ser direcionada também a esse responsável.' },
  { t: '14. Transferências internacionais e alterações', c: 'Dependendo da infraestrutura e da localização dos prestadores utilizados, o tratamento poderá envolver operações fora do Brasil, observadas as regras legais aplicáveis. Esta política pode ser atualizada para refletir mudanças de funcionalidades, fornecedores e exigências legais. A versão vigente será disponibilizada nesta página, com comunicação adicional quando necessária.' },
]

export default function Privacidade() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#08060A 0%,#120A14 50%,#08060A 100%)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', padding: '32px 16px 64px' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .wrap{max-width:780px;margin:0 auto;width:100%}
        .card{background:radial-gradient(circle at top left,rgba(139,92,246,.08),transparent 40%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid rgba(42,26,47,.16);border-radius:20px;padding:40px 36px}
        .secao{padding:18px 0;border-bottom:1px solid rgba(42,26,47,.10)}
        .secao:last-child{border-bottom:none}
        .btn-v{background:rgba(24,16,27,.88);color:#B8AAB8;border:1px solid rgba(42,26,47,.20);border-radius:12px;height:42px;padding:0 20px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;text-decoration:none;cursor:pointer;white-space:nowrap}
        .btn-p{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:42px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;text-decoration:none;white-space:nowrap}
        @media(max-width:600px){
          .card{padding:24px 18px;border-radius:16px}
          .topo-btns{flex-direction:column!important;gap:10px!important}
          .topo-btns a{width:100%!important;justify-content:center!important}
        }
      `}</style>

      <div className="wrap">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em' }}>MiniPage Pro</span>
        </div>

        <div className="card">
          {/* Header */}
          <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid rgba(42,26,47,.12)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(236,72,153,.14)', border: '1px solid rgba(236,72,153,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>📄</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.03em', marginBottom: '8px' }}>Política de Privacidade</h1>
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6 }}>Esta Política de Privacidade explica como dados pessoais podem ser tratados no uso da MiniPage Pro, as finalidades envolvidas, os prestadores utilizados e os direitos previstos na Lei Geral de Proteção de Dados Pessoais (LGPD).</p>
          </div>

          {/* Seções */}
          {SECOES.map(s => (
            <div key={s.t} className="secao">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#B8AAB8', marginBottom: '6px' }}>{s.t}</p>
              <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.7 }}>{s.c}</p>
            </div>
          ))}

          {/* Rodapé */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(42,26,47,.10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Última atualização: {hoje} · Versão v1.0</p>
            <Link href="/politica-de-privacidade" style={{ fontSize: '12px', color: '#8B5CF6', textDecoration: 'none', fontWeight: 600 }}>Ver Política de Privacidade →</Link>
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
