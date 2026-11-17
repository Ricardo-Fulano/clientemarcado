import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Reembolso e Cancelamento | MiniPage Pro',
  description: 'Entenda os direitos de arrependimento, reembolso e cancelamento das assinaturas MiniPage Pro.',
}

const sectionStyle = { marginTop: 26 } as const
const headingStyle = { fontSize: 19, fontWeight: 700, marginBottom: 10 } as const
const paraStyle = { color: '#d3cbd7', lineHeight: 1.8, marginTop: 9 } as const

export default function PoliticaDeReembolso() {
  return (
    <main style={{ minHeight: '100vh', background: '#0e0915', color: '#f9f5fc', padding: '42px 20px', fontFamily: 'Arial, sans-serif' }}>
      <article style={{ maxWidth: 800, margin: '0 auto', background: '#1a1021', border: '1px solid #463049', borderRadius: 20, padding: 'clamp(22px, 5vw, 48px)' }}>
        <Link href="/" style={{ color: '#e8a5fb', textDecoration: 'none', fontWeight: 700 }}>← MiniPage Pro</Link>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', marginTop: 24, marginBottom: 14 }}>Política de Reembolso e Cancelamento</h1>
        <p style={paraStyle}>Esta política explica as condições de cancelamento, desistência e reembolso das assinaturas de acesso ao software MiniPage Pro, operado pela pessoa jurídica inscrita no CNPJ 31.671.616/0001-18.</p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>1. Assinaturas e ciclos de cobrança</h2>
          <p style={paraStyle}>A MiniPage Pro oferece um plano gratuito e planos pagos mensais ou anuais. O preço, a periodicidade, os recursos incluídos e as eventuais condições de teste gratuito são informados antes da contratação. As assinaturas recorrentes poderão ser renovadas automaticamente, conforme as condições aceitas na contratação.</p>
        </section>
        <section style={sectionStyle}>
          <h2 style={headingStyle}>2. Direito de arrependimento</h2>
          <p style={paraStyle}>Consumidores no Brasil podem exercer o direito de arrependimento nas contratações realizadas pela internet no prazo legal de 7 (sete) dias, nos termos do art. 49 do Código de Defesa do Consumidor, com restituição dos valores pagos conforme a lei. Para consumidores de outros países, também se aplicam os prazos e direitos obrigatórios previstos na legislação local e na política do vendedor responsável pela transação.</p>
          <p style={paraStyle}>Nada nesta política limita direitos legais de consumidores, inclusive em casos de serviço não disponibilizado adequadamente, defeitos ou cobrança indevida.</p>
        </section>
        <section style={sectionStyle}>
          <h2 style={headingStyle}>3. Como solicitar um reembolso</h2>
          <p style={paraStyle}>Para compras processadas pela Paddle, a Paddle atua como revendedora responsável pela transação (Merchant of Record). Você pode solicitar reembolso pelo link de suporte ou gerenciamento presente no comprovante enviado após a compra, ou diretamente em <a href="https://paddle.net" style={{ color: '#e8a5fb' }}>paddle.net</a>. Aplicam-se também a <a href="https://www.paddle.com/legal/refund-policy" style={{ color: '#e8a5fb' }}>Política de Reembolso da Paddle</a> e os direitos legais obrigatórios.</p>
          <p style={paraStyle}>Para cobranças realizadas por outros processadores anteriormente utilizados pela MiniPage Pro, ou se precisar de ajuda para localizar a transação, entre em contato com nosso <a href="https://wa.me/5511941059063" style={{ color: '#e8a5fb' }}>suporte pelo WhatsApp</a>. Não é necessário compartilhar senhas, dados completos de cartão ou outras credenciais para solicitar atendimento.</p>
        </section>
        <section style={sectionStyle}>
          <h2 style={headingStyle}>4. Cancelamento e renovação</h2>
          <p style={paraStyle}>Você pode solicitar o cancelamento da renovação da assinatura a qualquer momento. Para assinaturas cobradas pela Paddle, utilize a opção de gerenciamento no e-mail da compra ou em <a href="https://paddle.net" style={{ color: '#e8a5fb' }}>paddle.net</a>. O cancelamento da renovação normalmente mantém o acesso até o término do período já pago, sem novas cobranças recorrentes, ressalvados reembolsos, direitos legais e outras condições expressamente informadas na contratação.</p>
          <p style={paraStyle}>A simples solicitação de cancelamento da renovação não significa automaticamente reembolso proporcional do período contratado. Pedidos de reembolso são analisados conforme os direitos legais, o processador da compra e as condições aplicáveis.</p>
        </section>
        <section style={sectionStyle}>
          <h2 style={headingStyle}>5. Cobranças indevidas, indisponibilidade e problemas técnicos</h2>
          <p style={paraStyle}>Em caso de duplicidade de cobrança, transação não reconhecida, falha relevante de disponibilização ou divergência entre o serviço oferecido e o contratado, entre em contato com o suporte ou com a Paddle, conforme o responsável pela transação. Cada situação será analisada, respeitados os direitos previstos na legislação aplicável.</p>
        </section>
        <section style={sectionStyle}>
          <h2 style={headingStyle}>6. Prazo e forma de restituição</h2>
          <p style={paraStyle}>Reembolsos aprovados pela Paddle normalmente retornam ao método original de pagamento, quando possível, de acordo com a política e os prazos de processamento da Paddle, sem prejuízo dos prazos e direitos obrigatórios previstos na lei.</p>
        </section>
        <section style={sectionStyle}>
          <h2 style={headingStyle}>7. Contato e documentos relacionados</h2>
          <p style={paraStyle}>Suporte MiniPage Pro: <a href="https://wa.me/5511941059063" style={{ color: '#e8a5fb' }}>WhatsApp +55 11 94105-9063</a>.</p>
          <p style={paraStyle}><Link href="/contrato-de-adesao" style={{ color: '#e8a5fb' }}>Contrato de Adesão</Link> · <Link href="/politica-de-privacidade" style={{ color: '#e8a5fb' }}>Política de Privacidade</Link> · <Link href="/precos" style={{ color: '#e8a5fb' }}>Planos e preços</Link></p>
        </section>
        <p style={{ ...paraStyle, fontSize: 13, marginTop: 34 }}>Última atualização: 15 de novembro de 2026. Esta política pode ser revisada para refletir alterações operacionais ou legais, respeitados os direitos e contratos aplicáveis.</p>
      </article>
    </main>
  )
}
