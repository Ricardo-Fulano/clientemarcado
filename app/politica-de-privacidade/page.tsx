'use client'
import Link from 'next/link'

const hoje = '13 de novembro de 2026'

const SECOES = [
  { t: '1. Quem somos e quem é responsável', c: 'A MiniPage Pro é uma plataforma de páginas profissionais, divulgação digital e recursos de gestão, operada pela pessoa jurídica inscrita no CNPJ 31.671.616/0001-18. Para assuntos relacionados a esta política e ao tratamento de dados pessoais sob nossa responsabilidade, utilize o canal de suporte informado nesta página.' },
  { t: '2. Dados que podem ser tratados', c: 'Conforme os recursos utilizados, podemos tratar dados de cadastro e contato (como nome, e-mail e telefone), identificação de perfil ou negócio, conteúdos publicados, dados de assinatura e cobrança e informações necessárias ao suporte. Em MiniPages, podem ser registrados acessos e interações, incluindo tipo de evento, item e URL relacionados, origem, página de referência (referer), informações técnicas do navegador (user agent), hash de endereço IP e metadados do evento. Na captação de leads, podem ser registrados e-mail, MiniPage, origem, item de interesse, informações técnicas do navegador e registro da manifestação apresentada no formulário. Usuários podem inserir dados de clientes e terceiros nos recursos que utilizam.' },
  { t: '3. Para que utilizamos os dados', c: 'Utilizamos dados, conforme a finalidade aplicável, para criar e autenticar contas, disponibilizar MiniPages e funcionalidades, registrar solicitações de visitantes, fornecer contatos aos responsáveis pelas respectivas MiniPages, atender ao suporte, operacionalizar assinaturas e pagamentos, prevenir abusos e fraudes, proteger o serviço, cumprir obrigações legais e apresentar métricas internas de acesso e interação. Comunicações promocionais pelos responsáveis das MiniPages constituem finalidade distinta e devem observar as informações prestadas ao visitante e a base legal aplicável.' },
  { t: '4. Bases legais', c: 'O tratamento pode se apoiar, conforme a finalidade concreta, na execução de contrato ou de procedimentos preliminares, no cumprimento de obrigação legal ou regulatória, no exercício regular de direitos, no legítimo interesse quando cabível e, nas hipóteses exigidas, no consentimento do titular. O consentimento não é presumido como base para todas as operações.' },
  { t: '5. Dados publicados nas MiniPages', c: 'As informações que o usuário decide publicar em sua MiniPage, como nome público, imagem, links, vídeos, produtos e contatos, podem ser acessadas pelos visitantes da página. O usuário deve possuir autorização ou outra base legal adequada para disponibilizar informações pessoais de terceiros e deve evitar publicar informações sensíveis sem necessidade e fundamento apropriado.' },
  { t: '6. Dados de clientes e terceiros', c: 'Quando o titular de uma MiniPage cadastra dados de seus próprios clientes, contatos ou agendamentos, cabe a ele definir as finalidades e garantir a legitimidade dessa coleta e uso, conforme o contexto. A operadora da MiniPage Pro poderá atuar no tratamento técnico desses dados para disponibilizar o serviço, observados os papéis e as responsabilidades previstos na LGPD.' },
  { t: '7. Compartilhamento e fornecedores', c: 'Conforme o recurso utilizado, dados necessários à operação podem ser tratados por prestadores de hospedagem e infraestrutura (como Vercel), autenticação e banco de dados (como Supabase), processamento de pagamentos (como Asaas) e envio de e-mails transacionais e convites (como Resend). MiniPages cujos responsáveis configuram Meta Pixel ou Google Analytics 4 (GA4) podem transmitir eventos a Meta ou Google após a aceitação do rastreamento opcional pelo visitante, observadas as limitações descritas nesta política. Links para WhatsApp, plataformas de vídeo e outros sites externos estão sujeitos também às políticas desses terceiros. O compartilhamento depende da finalidade, do recurso efetivamente utilizado e das hipóteses legalmente permitidas.' },
  { t: '8. Assinaturas e pagamentos', c: 'Para contratar e manter planos pagos, dados de identificação, assinatura, situação de pagamento e informações necessárias à cobrança podem ser utilizados pela MiniPage Pro e pelo processador de pagamentos Asaas. A política não altera preços, contratos em vigor, recorrências, obrigações ou fluxos de pagamento. Os dados efetivamente solicitados pelo prestador de pagamentos dependem do meio de pagamento escolhido.' },
  { t: '9. Cookies, armazenamento e métricas', c: 'A plataforma utiliza mecanismos técnicos, como cookies e armazenamento local do navegador, para autenticação, sessão, preferências e funcionamento de recursos. Também registra eventos internos de acesso e interação das MiniPages, inclusive dados técnicos descritos na seção 2; essas métricas internas não se confundem com o consentimento para ferramentas externas. Quando uma MiniPage possui identificadores válidos de Meta Pixel ou GA4, é apresentado um aviso para aceitar ou recusar essas ferramentas; a escolha fica registrada no armazenamento local separadamente por MiniPage. Pela implementação atual, a recusa impede o carregamento inicial dessas ferramentas por esse componente. O funcionamento e a eventual revisão posterior dessa escolha estão sujeitos aos controles disponibilizados na página e às solicitações feitas pelo canal de privacidade.' },
  { t: '10. Conservação e exclusão', c: 'Os dados são conservados segundo a finalidade do tratamento e as necessidades operacionais, contratuais, legais, fiscais e de segurança aplicáveis. Os períodos podem variar conforme a categoria de dados e a obrigação correspondente; esta política não afirma que todos os registros sejam eliminados automaticamente ao encerrar uma conta. Solicitações de acesso, correção, eliminação ou outras medidas serão avaliadas conforme a LGPD, considerando os direitos do titular, as responsabilidades do controlador e as hipóteses legais de conservação. Para informações sobre dados específicos, utilize o canal indicado na seção 13.' },
  { t: '11. Segurança', c: 'São adotadas medidas técnicas e administrativas compatíveis com os riscos do tratamento para proteger dados pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida. Nenhuma operação digital é isenta de riscos; o usuário também deve proteger suas credenciais e comunicar situações suspeitas ao suporte.' },
  { t: '12. Direitos dos titulares', c: 'Nos termos da LGPD, o titular pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informações sobre compartilhamento, oposição a tratamento irregular e revogação de consentimento. Alguns pedidos dependem de requisitos legais e da identificação do controlador responsável pelos dados.' },
  { t: '13. Solicitações e contato', c: 'Para dúvidas sobre privacidade e solicitações relativas aos seus dados pessoais tratados pela MiniPage Pro, entre em contato pelo WhatsApp de suporte: +55 11 94105-9063 (https://wa.me/5511941059063). Podemos solicitar informações suficientes para verificar a identidade do requerente, evitando a divulgação de dados a terceiros. Quando os dados tiverem sido cadastrados por outro usuário da plataforma, a solicitação poderá precisar ser direcionada também a esse responsável.' },
  { t: '14. Transferências internacionais e alterações', c: 'O uso de fornecedores de infraestrutura, autenticação, hospedagem, e-mail, pagamentos e ferramentas opcionais de análise pode envolver tratamento ou acesso a dados fora do Brasil, conforme os serviços efetivamente utilizados e seus locais de processamento. Quando houver transferência internacional de dados pessoais, devem ser observados os mecanismos e requisitos legais aplicáveis. Esta política pode ser atualizada para refletir alterações de funcionalidades, fornecedores e exigências legais; mudanças relevantes serão comunicadas quando necessário.' },
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
            <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Última atualização: {hoje} · Versão v1.1</p>
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
