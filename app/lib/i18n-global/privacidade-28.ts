import type { Idioma } from './idiomas'

export type PoliticaPrivacidade = { titulo:string; intro:string; atualizacao:string; versao:string; voltar:string; termos:string; contrato:string; cadastro:string; contato:string; revogar:string; politicaGoogle:string; secoes: {t:string;c:string}[] }

export const PRIVACIDADE_28: Record<Idioma, PoliticaPrivacidade> = {
  "pt-BR": {
    "titulo": "Política de Privacidade",
    "intro": "Esta Política explica o tratamento de dados pessoais na MiniPage Pro, inclusive no Login com Google, as finalidades, os fornecedores e os direitos previstos na LGPD.",
    "atualizacao": "Última atualização",
    "versao": "Versão",
    "voltar": "Voltar",
    "termos": "Termos de uso",
    "contrato": "Contrato de Adesão",
    "cadastro": "Criar conta grátis",
    "contato": "Solicitações de privacidade",
    "revogar": "Gerenciar conexões da Conta Google",
    "politicaGoogle": "Política de Dados do Usuário das APIs do Google",
    "secoes": [
      {
        "t": "1. Quem somos e quem é responsável",
        "c": "A MiniPage Pro é uma plataforma de páginas profissionais, divulgação digital e recursos de gestão, operada pela pessoa jurídica inscrita no CNPJ 31.671.616/0001-18. Para assuntos relacionados a esta política e ao tratamento de dados pessoais sob nossa responsabilidade, utilize o canal de suporte informado nesta página."
      },
      {
        "t": "2. Dados que podem ser tratados",
        "c": "Conforme os recursos utilizados, podemos tratar dados de cadastro e contato (como nome, e-mail e telefone), identificação de perfil ou negócio, conteúdos publicados, dados de assinatura e cobrança e informações necessárias ao suporte. Em MiniPages, podem ser registrados acessos e interações, incluindo tipo de evento, item e URL relacionados, origem, página de referência (referer), informações técnicas do navegador (user agent), hash de endereço IP e metadados do evento. Na captação de leads, podem ser registrados e-mail, MiniPage, origem, item de interesse, informações técnicas do navegador e registro da manifestação apresentada no formulário. Usuários podem inserir dados de clientes e terceiros nos recursos que utilizam."
      },
      {
        "t": "3. Para que utilizamos os dados",
        "c": "Utilizamos dados, conforme a finalidade aplicável, para criar e autenticar contas, disponibilizar MiniPages e funcionalidades, registrar solicitações de visitantes, fornecer contatos aos responsáveis pelas respectivas MiniPages, atender ao suporte, operacionalizar assinaturas e pagamentos, prevenir abusos e fraudes, proteger o serviço, cumprir obrigações legais e apresentar métricas internas de acesso e interação. Comunicações promocionais pelos responsáveis das MiniPages constituem finalidade distinta e devem observar as informações prestadas ao visitante e a base legal aplicável."
      },
      {
        "t": "4. Bases legais",
        "c": "O tratamento pode se apoiar, conforme a finalidade concreta, na execução de contrato ou de procedimentos preliminares, no cumprimento de obrigação legal ou regulatória, no exercício regular de direitos, no legítimo interesse quando cabível e, nas hipóteses exigidas, no consentimento do titular. O consentimento não é presumido como base para todas as operações."
      },
      {
        "t": "5. Dados publicados nas MiniPages",
        "c": "As informações que o usuário decide publicar em sua MiniPage, como nome público, imagem, links, vídeos, produtos e contatos, podem ser acessadas pelos visitantes da página. O usuário deve possuir autorização ou outra base legal adequada para disponibilizar informações pessoais de terceiros e deve evitar publicar informações sensíveis sem necessidade e fundamento apropriado."
      },
      {
        "t": "6. Dados de clientes e terceiros",
        "c": "Quando o titular de uma MiniPage cadastra dados de seus próprios clientes, contatos ou agendamentos, cabe a ele definir as finalidades e garantir a legitimidade dessa coleta e uso, conforme o contexto. A operadora da MiniPage Pro poderá atuar no tratamento técnico desses dados para disponibilizar o serviço, observados os papéis e as responsabilidades previstos na LGPD."
      },
      {
        "t": "7. Compartilhamento e fornecedores",
        "c": "Conforme o recurso utilizado, dados necessários à operação podem ser tratados por prestadores de hospedagem e infraestrutura (como Vercel), autenticação e banco de dados (como Supabase), processamento de pagamentos (como Asaas e Stripe) e envio de e-mails transacionais e convites (como Resend). MiniPages cujos responsáveis configuram Meta Pixel ou Google Analytics 4 (GA4) podem transmitir eventos a Meta ou Google após a aceitação do rastreamento opcional pelo visitante, observadas as limitações descritas nesta política. Links para WhatsApp, plataformas de vídeo e outros sites externos estão sujeitos também às políticas desses terceiros. O compartilhamento depende da finalidade, do recurso efetivamente utilizado e das hipóteses legalmente permitidas."
      },
      {
        "t": "8. Assinaturas e pagamentos",
        "c": "Para contratar e manter planos pagos, dados de identificação, assinatura, situação de pagamento e informações necessárias à cobrança podem ser utilizados pela MiniPage Pro e pelo processador de pagamentos aplicável (Asaas no Brasil ou Stripe no fluxo internacional, conforme disponibilidade). A política não altera preços, contratos em vigor, recorrências, obrigações ou fluxos de pagamento. Os dados efetivamente solicitados pelo prestador de pagamentos dependem do meio de pagamento escolhido."
      },
      {
        "t": "9. Cookies, armazenamento e métricas",
        "c": "A plataforma utiliza mecanismos técnicos, como cookies e armazenamento local do navegador, para autenticação, sessão, preferências e funcionamento de recursos. Também registra eventos internos de acesso e interação das MiniPages, inclusive dados técnicos descritos na seção 2; essas métricas internas não se confundem com o consentimento para ferramentas externas. Quando uma MiniPage possui identificadores válidos de Meta Pixel ou GA4, é apresentado um aviso para aceitar ou recusar essas ferramentas; a escolha fica registrada no armazenamento local separadamente por MiniPage. Pela implementação atual, a recusa impede o carregamento inicial dessas ferramentas por esse componente. O funcionamento e a eventual revisão posterior dessa escolha estão sujeitos aos controles disponibilizados na página e às solicitações feitas pelo canal de privacidade."
      },
      {
        "t": "10. Conservação e exclusão",
        "c": "Os dados são conservados segundo a finalidade do tratamento e as necessidades operacionais, contratuais, legais, fiscais e de segurança aplicáveis. Os períodos podem variar conforme a categoria de dados e a obrigação correspondente; esta política não afirma que todos os registros sejam eliminados automaticamente ao encerrar uma conta. Solicitações de acesso, correção, eliminação ou outras medidas serão avaliadas conforme a LGPD, considerando os direitos do titular, as responsabilidades do controlador e as hipóteses legais de conservação. Para informações sobre dados específicos, utilize o canal indicado na seção 13."
      },
      {
        "t": "11. Segurança",
        "c": "São adotadas medidas técnicas e administrativas compatíveis com os riscos do tratamento para proteger dados pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida. Nenhuma operação digital é isenta de riscos; o usuário também deve proteger suas credenciais e comunicar situações suspeitas ao suporte."
      },
      {
        "t": "12. Direitos dos titulares",
        "c": "Nos termos da LGPD, o titular pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informações sobre compartilhamento, oposição a tratamento irregular e revogação de consentimento. Alguns pedidos dependem de requisitos legais e da identificação do controlador responsável pelos dados."
      },
      {
        "t": "13. Solicitações e contato",
        "c": "Para dúvidas sobre privacidade e solicitações relativas aos seus dados pessoais tratados pela MiniPage Pro, entre em contato pelo WhatsApp de suporte: +55 11 94105-9063 (https://wa.me/5511941059063). Podemos solicitar informações suficientes para verificar a identidade do requerente, evitando a divulgação de dados a terceiros. Quando os dados tiverem sido cadastrados por outro usuário da plataforma, a solicitação poderá precisar ser direcionada também a esse responsável."
      },
      {
        "t": "14. Transferências internacionais e alterações",
        "c": "O uso de fornecedores de infraestrutura, autenticação, hospedagem, e-mail, pagamentos e ferramentas opcionais de análise pode envolver tratamento ou acesso a dados fora do Brasil, conforme os serviços efetivamente utilizados e seus locais de processamento. Quando houver transferência internacional de dados pessoais, devem ser observados os mecanismos e requisitos legais aplicáveis. Esta política pode ser atualizada para refletir alterações de funcionalidades, fornecedores e exigências legais; mudanças relevantes serão comunicadas quando necessário."
      },
      {
        "t": "15. Login com Google: dados acessados e finalidade",
        "c": "Ao escolher Continuar com Google, a MiniPage Pro solicita apenas os escopos openid, email e profile para autenticação. O Google pode fornecer o identificador único da conta, e-mail, confirmação do e-mail, nome e foto do perfil, além de metadados de identidade e tokens necessários à sessão. Usamos esses dados para identificar o titular, criar ou acessar sua conta, proteger o vínculo de identidades e manter a sessão. A senha do Google não é recebida pela MiniPage Pro. Esse login não solicita acesso ao Gmail, Google Drive, contatos, calendário nem ao conteúdo privado da conta Google. A importação de conteúdo público do YouTube é um recurso separado, não uma autorização de acesso a esses dados privados."
      },
      {
        "t": "16. Login com Google: armazenamento, proteção e compartilhamento",
        "c": "A identidade e os metadados de autenticação podem ficar no Supabase Auth e no banco de dados; a sessão pode ser mantida no navegador. O acesso ao banco e aos registros de elegibilidade é limitado por controles técnicos e permissões. Se você informar um cupom, seu e-mail e o registro da indicação podem ser usados para atribuir a indicação e administrar comissões. Dados de identificação necessários ao serviço podem ser tratados por prestadores de infraestrutura e autenticação e, quando você solicitar outros recursos, pelos prestadores necessários à sua execução. Não vendemos dados recebidos do Google nem os usamos para publicidade personalizada, perfis publicitários ou rastreamento entre serviços. O uso e a transferência de dados do Google devem respeitar a Google API Services User Data Policy, inclusive os requisitos de uso limitado aplicáveis."
      },
      {
        "t": "17. Login com Google: revogação, conservação e exclusão",
        "c": "Você pode revogar o acesso da MiniPage Pro nas conexões de terceiros da sua Conta Google. Revogar a autorização não exclui automaticamente sua conta MiniPage Pro nem os dados já armazenados. Para solicitar exclusão dos dados do Google mantidos pela MiniPage Pro ou encerramento da conta, envie a solicitação a minipagepro@gmail.com ou ao WhatsApp de suporte da seção 13. Após verificar a identidade, avaliaremos e atenderemos a solicitação conforme a legislação aplicável, eliminando ou anonimizando dados que não precisem ser conservados; registros necessários a obrigações legais, fiscais, contratuais, segurança ou exercício de direitos podem ser mantidos enquanto houver fundamento legítimo. Se o Google for sua única forma de acesso, procure o suporte antes de revogar a conexão para evitar perder o acesso."
      }
    ]
  },
  "en-US": {
    "titulo": "Privacy Policy",
    "intro": "This policy explains how MiniPage Pro processes personal data, including Google Sign-In, its purposes, service providers and rights under Brazil’s General Data Protection Law (LGPD).",
    "atualizacao": "Last updated",
    "versao": "Version",
    "voltar": "Back",
    "termos": "Terms of use",
    "contrato": "Subscription agreement",
    "cadastro": "Create a free account",
    "contato": "Privacy requests",
    "revogar": "Manage Google Account connections",
    "politicaGoogle": "Google API Services User Data Policy",
    "secoes": [
      {
        "t": "1. Who we are and who is responsible",
        "c": "MiniPage Pro is a platform for professional pages, digital promotion and management tools operated by the legal entity registered in Brazil under CNPJ 31.671.616/0001-18. For matters relating to this policy and personal data under our responsibility, use the support channel on this page."
      },
      {
        "t": "2. Data we may process",
        "c": "Depending on the features used, we may process registration and contact details (name, email, telephone), profile or business identification, published content, subscription and billing data and support information. MiniPages may record visits and interactions, including event type, related item and URL, source, referrer, browser user agent, IP address hash and event metadata. Lead capture may record email, MiniPage, source, item of interest, browser information and the choice or statement shown on the form. Users may enter customer and third-party data in the features they use."
      },
      {
        "t": "3. Purposes",
        "c": "We use data as appropriate to create and authenticate accounts, provide MiniPages and features, record visitor requests, provide contacts to the respective page owners, offer support, operate subscriptions and payments, prevent abuse and fraud, protect the service, meet legal obligations and provide internal visit and interaction metrics. Promotional communications by page owners are a separate purpose and must respect the information given to visitors and the applicable legal basis."
      },
      {
        "t": "4. Legal bases",
        "c": "Depending on the purpose, processing may rely on performance of a contract or pre-contractual steps, legal or regulatory obligations, exercise of rights, legitimate interests where appropriate and consent where required. Consent is not assumed to be the basis for every operation."
      },
      {
        "t": "5. Data published on MiniPages",
        "c": "Information users choose to publish, such as public names, images, links, videos, products and contacts, may be accessed by visitors. Users must have authorization or another appropriate legal basis to publish third-party personal data and avoid publishing sensitive information without a proper need and basis."
      },
      {
        "t": "6. Customer and third-party data",
        "c": "When a MiniPage owner records their own customer, contact or booking data, they determine the purposes and ensure lawful collection and use as appropriate. MiniPage Pro may perform technical processing to provide the service, subject to roles and responsibilities under the LGPD."
      },
      {
        "t": "7. Sharing and providers",
        "c": "Depending on the feature, necessary data may be processed by hosting and infrastructure providers (such as Vercel), authentication and database providers (such as Supabase), payment processors (such as Asaas and Stripe) and transactional email and invitation providers (such as Resend). MiniPages configured with Meta Pixel or Google Analytics 4 (GA4) may transmit events to Meta or Google after visitors accept optional tracking, subject to this policy. Links to WhatsApp, video platforms and other external sites are also subject to those providers’ policies. Sharing depends on the purpose, feature actually used and permitted legal grounds."
      },
      {
        "t": "8. Subscriptions and payments",
        "c": "To purchase and maintain paid plans, identification, subscription, payment status and billing information may be used by MiniPage Pro and the applicable payment processor (Asaas in Brazil or Stripe for international checkout, subject to availability). This policy does not change prices, existing contracts, recurring payments, obligations or payment flows. Information requested by processors depends on the selected payment method."
      },
      {
        "t": "9. Cookies, storage and metrics",
        "c": "We use technical mechanisms such as cookies and browser local storage for authentication, sessions, preferences and feature operation. We also record internal MiniPage access and interaction events, including the technical information in section 2; these metrics are separate from consent to external tools. Where valid Meta Pixel or GA4 identifiers are configured, visitors can accept or decline these tools; the choice is stored locally for each MiniPage. Under the current implementation, declining prevents their initial loading by that component. Operation and later review of this choice are subject to page controls and privacy requests."
      },
      {
        "t": "10. Retention and deletion",
        "c": "Data is retained according to processing purposes and applicable operational, contractual, legal, tax and security needs. Periods vary by category and obligation; closing an account does not automatically delete every record. Requests for access, correction, deletion or other measures are assessed under the LGPD, considering individual rights, controller responsibilities and lawful retention. For specific information use section 13."
      },
      {
        "t": "11. Security",
        "c": "Technical and administrative safeguards appropriate to processing risks are adopted to protect personal data against unauthorized access, loss, alteration and disclosure. No digital operation is risk-free; users must protect their credentials and report suspicious activity to support."
      },
      {
        "t": "12. Individual rights",
        "c": "Under the LGPD, where applicable, individuals may request confirmation of processing, access, correction, anonymization, blocking or deletion, portability, information about sharing, objection to unlawful processing and withdrawal of consent. Some requests depend on legal requirements and identification of the responsible controller."
      },
      {
        "t": "13. Requests and contact",
        "c": "For privacy questions and requests concerning data processed by MiniPage Pro, contact support on WhatsApp: +55 11 94105-9063 (https://wa.me/5511941059063). We may request sufficient information to verify identity and prevent disclosure to third parties. Where data was entered by another platform user, requests may also need to be addressed to that person."
      },
      {
        "t": "14. International transfers and changes",
        "c": "Infrastructure, authentication, hosting, email, payment and optional analytics providers may process or access data outside Brazil, depending on the services and processing locations. Applicable legal safeguards and requirements must be observed for international transfers. This policy may be updated to reflect changes in features, providers and legal requirements; significant changes will be communicated where necessary."
      },
      {
        "t": "15. Google Sign-In: data accessed and purposes",
        "c": "When you choose Continue with Google, MiniPage Pro requests only the openid, email and profile scopes for authentication. Google may provide a unique account identifier, email address, email verification status, name and profile photo, as well as identity metadata and tokens needed for the session. We use these data to identify you, create or access your account, protect identity linking and maintain your session. MiniPage Pro does not receive your Google password. This sign-in does not request access to Gmail, Google Drive, contacts, calendar or private Google Account content. Public YouTube content import is a separate feature and does not authorize access to those private data."
      },
      {
        "t": "16. Google Sign-In: storage, security and sharing",
        "c": "Authentication identity and metadata may be stored in Supabase Auth and the database; the session may be stored in your browser. Technical controls and permissions restrict access to the database and eligibility records. If you enter a referral code, your email and referral record may be used to attribute referrals and administer commissions. Identification data necessary for the service may be processed by infrastructure and authentication providers and, when you request other features, by the providers needed to deliver them. We do not sell data received from Google or use it for personalized advertising, advertising profiles or cross-service tracking. Use and transfer of Google data must comply with the Google API Services User Data Policy, including applicable Limited Use requirements."
      },
      {
        "t": "17. Google Sign-In: revocation, retention and deletion",
        "c": "You may revoke MiniPage Pro access in your Google Account third-party connections. Revocation does not automatically delete your MiniPage Pro account or previously stored data. To request deletion of Google data held by MiniPage Pro or account closure, contact minipagepro@gmail.com or the support WhatsApp in section 13. After verifying identity, we assess and fulfill requests under applicable law, deleting or anonymizing data that no longer needs to be retained; records required for legal, tax, contractual, security or rights-related purposes may be retained while a lawful basis exists. If Google is your only sign-in method, contact support before revoking access to avoid losing access to your account."
      }
    ]
  },
  "es-ES": {
    "titulo": "Política de privacidad",
    "intro": "Esta política explica el tratamiento de datos personales en MiniPage Pro, incluido el acceso con Google, sus fines, proveedores y los derechos previstos en la Ley General de Protección de Datos de Brasil (LGPD).",
    "atualizacao": "Última actualización",
    "versao": "Versión",
    "voltar": "Volver",
    "termos": "Términos de uso",
    "contrato": "Contrato de adhesión",
    "cadastro": "Crear cuenta gratis",
    "contato": "Solicitudes de privacidad",
    "revogar": "Gestionar conexiones de la cuenta de Google",
    "politicaGoogle": "Política de datos de usuario de los servicios de API de Google",
    "secoes": [
      {
        "t": "1. Quiénes somos y responsable",
        "c": "MiniPage Pro es una plataforma de páginas profesionales, difusión digital y herramientas de gestión, operada por la persona jurídica inscrita en Brasil con CNPJ 31.671.616/0001-18. Para cuestiones sobre esta política y datos bajo nuestra responsabilidad, utilice el canal de soporte indicado en esta página."
      },
      {
        "t": "2. Datos que podemos tratar",
        "c": "Según las funciones utilizadas, podemos tratar datos de registro y contacto (nombre, correo electrónico, teléfono), identificación del perfil o negocio, contenido publicado, suscripciones, facturación y soporte. Las MiniPages pueden registrar accesos e interacciones, incluidos tipo de evento, elemento y URL asociados, origen, página de referencia, agente de usuario del navegador, hash de IP y metadatos. La captación de contactos puede registrar correo, MiniPage, origen, elemento de interés, datos técnicos del navegador y la manifestación indicada en el formulario. Los usuarios pueden introducir datos de clientes y terceros."
      },
      {
        "t": "3. Finalidades",
        "c": "Utilizamos datos según corresponda para crear y autenticar cuentas, proporcionar MiniPages y funciones, registrar solicitudes de visitantes, facilitar contactos a los responsables de las páginas, ofrecer soporte, gestionar suscripciones y pagos, prevenir abusos y fraudes, proteger el servicio, cumplir obligaciones legales y ofrecer métricas internas. Las comunicaciones promocionales de los responsables tienen una finalidad distinta y deben respetar la información facilitada y la base jurídica aplicable."
      },
      {
        "t": "4. Bases jurídicas",
        "c": "Según la finalidad, el tratamiento puede basarse en la ejecución de un contrato o medidas precontractuales, obligaciones legales o reglamentarias, ejercicio de derechos, interés legítimo cuando proceda y consentimiento cuando se exija. No se presume el consentimiento para todas las operaciones."
      },
      {
        "t": "5. Datos publicados",
        "c": "Los datos que el usuario decide publicar en su MiniPage, como nombre público, imágenes, enlaces, vídeos, productos y contactos, pueden ser accesibles a los visitantes. El usuario debe tener autorización u otra base jurídica adecuada para publicar datos de terceros y evitar datos sensibles sin necesidad y fundamento apropiados."
      },
      {
        "t": "6. Datos de clientes y terceros",
        "c": "Cuando un titular registra datos de sus clientes, contactos o citas, le corresponde definir los fines y garantizar la legitimidad de la recogida y el uso según el contexto. MiniPage Pro podrá realizar el tratamiento técnico necesario para prestar el servicio, respetando las funciones y responsabilidades previstas en la LGPD."
      },
      {
        "t": "7. Intercambio y proveedores",
        "c": "Según la función, los datos necesarios pueden ser tratados por proveedores de alojamiento e infraestructura (como Vercel), autenticación y base de datos (como Supabase), pagos (como Asaas y Stripe), y correos transaccionales e invitaciones (como Resend). Las MiniPages con Meta Pixel o Google Analytics 4 (GA4) pueden transmitir eventos a Meta o Google tras aceptar el visitante el seguimiento opcional, conforme a esta política. Los enlaces a WhatsApp, plataformas de vídeo y otros sitios externos se rigen también por sus políticas. El intercambio depende del fin, la función utilizada y los supuestos legales permitidos."
      },
      {
        "t": "8. Suscripciones y pagos",
        "c": "Para contratar y mantener planes de pago, MiniPage Pro y el procesador aplicable (Asaas en Brasil o Stripe para pagos internacionales, según disponibilidad) pueden utilizar identificación, suscripción, estado de pago y datos de facturación. Esta política no modifica precios, contratos vigentes, recurrencias, obligaciones ni flujos de pago. Los datos requeridos dependen del medio elegido."
      },
      {
        "t": "9. Cookies, almacenamiento y métricas",
        "c": "Usamos cookies y almacenamiento local para autenticación, sesión, preferencias y funcionamiento. Registramos eventos internos de acceso e interacción, incluidos los datos técnicos de la sección 2; estas métricas no equivalen al consentimiento para herramientas externas. Cuando existen identificadores válidos de Meta Pixel o GA4, el visitante puede aceptar o rechazar estas herramientas y la elección se guarda localmente por MiniPage. Según la implementación actual, el rechazo impide su carga inicial por ese componente. El funcionamiento y la revisión posterior dependen de los controles de la página y de solicitudes de privacidad."
      },
      {
        "t": "10. Conservación y eliminación",
        "c": "Los datos se conservan según la finalidad y las necesidades operativas, contractuales, legales, fiscales y de seguridad. Los plazos varían según categoría y obligación; cerrar una cuenta no elimina automáticamente todos los registros. Las solicitudes de acceso, corrección, eliminación u otras medidas se evalúan conforme a la LGPD y a los derechos, responsabilidades y supuestos legales de conservación. Consulte la sección 13."
      },
      {
        "t": "11. Seguridad",
        "c": "Se adoptan medidas técnicas y administrativas adecuadas a los riesgos para proteger los datos contra acceso no autorizado, pérdida, alteración o divulgación. Ninguna operación digital está exenta de riesgos; el usuario debe proteger sus credenciales y comunicar situaciones sospechosas."
      },
      {
        "t": "12. Derechos de los interesados",
        "c": "Según la LGPD, cuando proceda se puede solicitar confirmación del tratamiento, acceso, rectificación, anonimización, bloqueo o eliminación, portabilidad, información sobre intercambio, oposición a tratamiento irregular y retirada del consentimiento. Algunas solicitudes dependen de requisitos legales y de identificar al responsable."
      },
      {
        "t": "13. Solicitudes y contacto",
        "c": "Para cuestiones de privacidad o solicitudes sobre datos tratados por MiniPage Pro, contacte con el soporte por WhatsApp: +55 11 94105-9063 (https://wa.me/5511941059063). Podemos solicitar información suficiente para verificar la identidad y evitar divulgar datos a terceros. Si los datos fueron introducidos por otro usuario, la solicitud también puede dirigirse a ese responsable."
      },
      {
        "t": "14. Transferencias internacionales y cambios",
        "c": "Los proveedores de infraestructura, autenticación, alojamiento, correo, pagos y análisis opcionales pueden tratar o acceder a datos fuera de Brasil según los servicios y lugares de tratamiento. Las transferencias deben respetar los mecanismos y requisitos legales aplicables. Esta política puede actualizarse por cambios de funciones, proveedores y exigencias legales; se comunicarán los cambios relevantes cuando sea necesario."
      },
      {
        "t": "15. Acceso con Google: datos y finalidad",
        "c": "Al elegir Continuar con Google, MiniPage Pro solicita únicamente los permisos openid, email y profile para autenticación. Google puede proporcionar el identificador único de la cuenta, correo electrónico, confirmación del correo, nombre y foto de perfil, así como metadatos de identidad y tokens necesarios para la sesión. Los usamos para identificar al titular, crear o acceder a su cuenta, proteger la vinculación de identidades y mantener la sesión. MiniPage Pro no recibe la contraseña de Google. Este acceso no solicita Gmail, Google Drive, contactos, calendario ni contenido privado de la cuenta. La importación de contenido público de YouTube es una función independiente que no autoriza el acceso a esos datos privados."
      },
      {
        "t": "16. Acceso con Google: almacenamiento, protección e intercambio",
        "c": "La identidad y los metadatos de autenticación pueden almacenarse en Supabase Auth y en la base de datos; la sesión puede mantenerse en el navegador. Los controles técnicos y permisos limitan el acceso a la base y a los registros de elegibilidad. Si indica un cupón, su correo y registro de referencia pueden utilizarse para atribuir la referencia y gestionar comisiones. Los datos de identificación necesarios pueden ser tratados por proveedores de infraestructura y autenticación y, al solicitar otras funciones, por los proveedores necesarios para prestarlas. No vendemos datos recibidos de Google ni los usamos para publicidad personalizada, perfiles publicitarios o seguimiento entre servicios. El uso y la transferencia deben cumplir la política de datos de usuario de los servicios de API de Google, incluidos los requisitos de uso limitado aplicables."
      },
      {
        "t": "17. Acceso con Google: revocación, conservación y eliminación",
        "c": "Puede revocar el acceso de MiniPage Pro desde las conexiones de terceros de su cuenta de Google. La revocación no elimina automáticamente su cuenta MiniPage Pro ni los datos ya almacenados. Para solicitar la eliminación de los datos de Google conservados por MiniPage Pro o el cierre de la cuenta, escriba a minipagepro@gmail.com o al WhatsApp de soporte de la sección 13. Tras verificar su identidad, atenderemos la solicitud conforme a la ley, eliminando o anonimizando los datos innecesarios; los registros exigidos por obligaciones legales, fiscales, contractuales, de seguridad o ejercicio de derechos podrán conservarse mientras exista fundamento legítimo. Si Google es su único método de acceso, contacte con soporte antes de revocarlo."
      }
    ]
  },
  "fr-FR": {
    "titulo": "Politique de confidentialité",
    "intro": "Cette politique explique le traitement des données personnelles dans MiniPage Pro, y compris la connexion avec Google, ses finalités, ses prestataires et les droits prévus par la loi brésilienne de protection des données (LGPD).",
    "atualizacao": "Dernière mise à jour",
    "versao": "Version",
    "voltar": "Retour",
    "termos": "Conditions d’utilisation",
    "contrato": "Contrat d’adhésion",
    "cadastro": "Créer un compte gratuit",
    "contato": "Demandes de confidentialité",
    "revogar": "Gérer les connexions du compte Google",
    "politicaGoogle": "Règles relatives aux données utilisateur des services API Google",
    "secoes": [
      {
        "t": "1. Qui sommes-nous et qui est responsable ?",
        "c": "MiniPage Pro est une plateforme de pages professionnelles, de promotion numérique et d’outils de gestion, exploitée par la personne morale enregistrée au Brésil sous le CNPJ 31.671.616/0001-18. Pour toute question sur cette politique et les données relevant de notre responsabilité, utilisez le canal d’assistance indiqué sur cette page."
      },
      {
        "t": "2. Données susceptibles d’être traitées",
        "c": "Selon les fonctionnalités utilisées, nous pouvons traiter les données d’inscription et de contact (nom, e-mail, téléphone), l’identification du profil ou de l’activité, les contenus publiés, les données d’abonnement, de facturation et d’assistance. Les MiniPages peuvent enregistrer les visites et interactions, notamment le type d’événement, l’élément et l’URL associés, la source, la page de référence, l’agent utilisateur du navigateur, le hachage de l’adresse IP et les métadonnées. La collecte de prospects peut enregistrer l’e-mail, la MiniPage, la source, l’élément d’intérêt, les informations techniques du navigateur et la manifestation indiquée dans le formulaire. Les utilisateurs peuvent saisir des données de clients et de tiers."
      },
      {
        "t": "3. Finalités",
        "c": "Nous utilisons les données selon les besoins pour créer et authentifier des comptes, fournir les MiniPages et leurs fonctionnalités, enregistrer les demandes des visiteurs, fournir les contacts aux responsables des pages, assurer l’assistance, gérer les abonnements et paiements, prévenir les abus et la fraude, protéger le service, respecter les obligations légales et fournir des statistiques internes de visites et d’interactions. Les communications promotionnelles des responsables des pages constituent une finalité distincte et doivent respecter les informations fournies et la base juridique applicable."
      },
      {
        "t": "4. Bases juridiques",
        "c": "Selon la finalité, le traitement peut reposer sur l’exécution d’un contrat ou de mesures précontractuelles, une obligation légale ou réglementaire, l’exercice de droits, l’intérêt légitime le cas échéant et le consentement lorsqu’il est requis. Le consentement n’est pas présumé pour toutes les opérations."
      },
      {
        "t": "5. Données publiées sur les MiniPages",
        "c": "Les informations que l’utilisateur choisit de publier, telles que le nom public, l’image, les liens, les vidéos, les produits et les contacts, peuvent être accessibles aux visiteurs. L’utilisateur doit disposer d’une autorisation ou d’une autre base juridique appropriée pour publier les données de tiers et éviter les données sensibles sans nécessité et fondement appropriés."
      },
      {
        "t": "6. Données de clients et de tiers",
        "c": "Lorsqu’un titulaire enregistre les données de ses clients, contacts ou rendez-vous, il lui appartient de définir les finalités et d’assurer la licéité de la collecte et de l’utilisation. MiniPage Pro peut réaliser le traitement technique nécessaire au service, selon les rôles et responsabilités prévus par la LGPD."
      },
      {
        "t": "7. Partage et prestataires",
        "c": "Selon la fonctionnalité, les données nécessaires peuvent être traitées par des prestataires d’hébergement et d’infrastructure (comme Vercel), d’authentification et de bases de données (comme Supabase), de paiement (comme Asaas et Stripe) et d’e-mails transactionnels et invitations (comme Resend). Les MiniPages configurées avec Meta Pixel ou Google Analytics 4 (GA4) peuvent transmettre des événements à Meta ou Google après acceptation du suivi facultatif par le visiteur, dans les limites de cette politique. Les liens WhatsApp, plateformes vidéo et autres sites externes sont aussi soumis à leurs propres politiques. Le partage dépend de la finalité, de la fonctionnalité utilisée et des motifs légaux autorisés."
      },
      {
        "t": "8. Abonnements et paiements",
        "c": "Pour souscrire et conserver une offre payante, MiniPage Pro et le prestataire applicable (Asaas au Brésil ou Stripe pour le paiement international, selon disponibilité) peuvent utiliser les données d’identification, d’abonnement, de statut de paiement et de facturation. Cette politique ne modifie ni les prix, ni les contrats en vigueur, ni les paiements récurrents, ni les obligations ou les flux de paiement. Les données demandées varient selon le moyen choisi."
      },
      {
        "t": "9. Cookies, stockage et statistiques",
        "c": "Nous utilisons des cookies et le stockage local du navigateur pour l’authentification, la session, les préférences et les fonctionnalités. Nous enregistrons aussi des événements internes, dont les données techniques de la section 2 ; ces statistiques ne se confondent pas avec le consentement aux outils externes. En présence d’identifiants valides Meta Pixel ou GA4, le visiteur peut accepter ou refuser ces outils et son choix est enregistré localement par MiniPage. Dans l’implémentation actuelle, le refus empêche leur chargement initial par ce composant. Leur fonctionnement et la révision du choix dépendent des contrôles disponibles et des demandes de confidentialité."
      },
      {
        "t": "10. Conservation et suppression",
        "c": "Les données sont conservées selon la finalité et les besoins opérationnels, contractuels, légaux, fiscaux et de sécurité. Les durées varient selon la catégorie et l’obligation ; fermer un compte n’efface pas automatiquement tous les enregistrements. Les demandes d’accès, de correction, de suppression ou d’autres mesures sont évaluées conformément à la LGPD, aux droits, aux responsabilités du responsable du traitement et aux motifs légaux de conservation. Voir la section 13."
      },
      {
        "t": "11. Sécurité",
        "c": "Des mesures techniques et administratives adaptées aux risques protègent les données contre l’accès non autorisé, la perte, la modification ou la divulgation. Aucune opération numérique n’est sans risque ; l’utilisateur doit protéger ses identifiants et signaler les situations suspectes."
      },
      {
        "t": "12. Droits des personnes",
        "c": "Selon la LGPD et le cas échéant, la personne peut demander la confirmation du traitement, l’accès, la correction, l’anonymisation, le blocage ou la suppression, la portabilité, des informations sur le partage, s’opposer à un traitement irrégulier et retirer son consentement. Certaines demandes dépendent des conditions légales et de l’identification du responsable."
      },
      {
        "t": "13. Demandes et contact",
        "c": "Pour toute question ou demande de confidentialité concernant les données traitées par MiniPage Pro, contactez l’assistance WhatsApp : +55 11 94105-9063 (https://wa.me/5511941059063). Nous pouvons demander des éléments suffisants pour vérifier votre identité et éviter une divulgation à des tiers. Si les données ont été saisies par un autre utilisateur, la demande peut aussi devoir lui être adressée."
      },
      {
        "t": "14. Transferts internationaux et modifications",
        "c": "Les prestataires d’infrastructure, d’authentification, d’hébergement, d’e-mail, de paiement et d’analyse facultative peuvent traiter des données ou y accéder hors du Brésil, selon les services et lieux de traitement. Les transferts doivent respecter les mécanismes et exigences juridiques applicables. Cette politique peut évoluer selon les fonctionnalités, les prestataires et la loi ; les modifications importantes seront communiquées si nécessaire."
      },
      {
        "t": "15. Connexion avec Google : données et finalités",
        "c": "Lorsque vous choisissez Continuer avec Google, MiniPage Pro demande uniquement les autorisations openid, email et profile pour l’authentification. Google peut fournir l’identifiant unique du compte, l’adresse e-mail, son statut de vérification, le nom et la photo de profil, ainsi que des métadonnées d’identité et les jetons nécessaires à la session. Ces données servent à vous identifier, créer ou accéder à votre compte, sécuriser la liaison des identités et maintenir la session. MiniPage Pro ne reçoit pas votre mot de passe Google. Cette connexion ne demande pas l’accès à Gmail, Google Drive, aux contacts, à l’agenda ni au contenu privé du compte Google. L’importation de contenu public YouTube est une fonction distincte qui n’autorise pas l’accès à ces données privées."
      },
      {
        "t": "16. Connexion avec Google : stockage, protection et partage",
        "c": "L’identité et les métadonnées d’authentification peuvent être conservées dans Supabase Auth et la base de données ; la session peut être conservée dans le navigateur. Des contrôles techniques et permissions limitent l’accès à la base et aux registres d’éligibilité. Si vous indiquez un code de parrainage, votre e-mail et le registre de parrainage peuvent servir à attribuer le parrainage et gérer les commissions. Les données nécessaires à l’identification peuvent être traitées par les prestataires d’infrastructure et d’authentification et, lorsque vous demandez d’autres fonctionnalités, par les prestataires nécessaires à leur exécution. Nous ne vendons pas les données reçues de Google et ne les utilisons pas pour la publicité personnalisée, le profilage publicitaire ni le suivi entre services. L’utilisation et le transfert respectent les règles relatives aux données utilisateur des services API Google, notamment les exigences d’utilisation limitée applicables."
      },
      {
        "t": "17. Connexion avec Google : révocation, conservation et suppression",
        "c": "Vous pouvez révoquer l’accès de MiniPage Pro dans les connexions tierces de votre compte Google. La révocation ne supprime pas automatiquement le compte MiniPage Pro ni les données conservées. Pour demander la suppression des données Google détenues par MiniPage Pro ou la fermeture de votre compte, contactez minipagepro@gmail.com ou le WhatsApp de la section 13. Après vérification de l’identité, nous traiterons la demande conformément à la loi et supprimerons ou anonymiserons les données dont la conservation n’est plus nécessaire ; les données nécessaires à des obligations légales, fiscales, contractuelles, de sécurité ou à l’exercice de droits peuvent être conservées tant qu’un fondement licite existe. Si Google est votre seul moyen de connexion, contactez l’assistance avant de révoquer l’accès."
      }
    ]
  },
  "de-DE": {
    "titulo": "Datenschutzerklärung",
    "intro": "Diese Erklärung beschreibt die Verarbeitung personenbezogener Daten bei MiniPage Pro einschließlich der Anmeldung mit Google, Zwecke, Dienstleister und Rechte nach dem brasilianischen Datenschutzgesetz (LGPD).",
    "atualizacao": "Zuletzt aktualisiert",
    "versao": "Version",
    "voltar": "Zurück",
    "termos": "Nutzungsbedingungen",
    "contrato": "Nutzungsvertrag",
    "cadastro": "Kostenloses Konto erstellen",
    "contato": "Datenschutzanfragen",
    "revogar": "Google-Kontoverbindungen verwalten",
    "politicaGoogle": "Google API Services User Data Policy",
    "secoes": [
      {
        "t": "1. Wer wir sind und wer verantwortlich ist",
        "c": "MiniPage Pro ist eine Plattform für professionelle Seiten, digitale Werbung und Verwaltungsfunktionen, betrieben von der in Brasilien unter CNPJ 31.671.616/0001-18 registrierten juristischen Person. Für Fragen zu dieser Erklärung und personenbezogenen Daten in unserer Verantwortung nutzen Sie den auf dieser Seite genannten Supportkanal."
      },
      {
        "t": "2. Verarbeitete Daten",
        "c": "Je nach genutzten Funktionen können wir Registrierungs- und Kontaktdaten (Name, E-Mail, Telefon), Profil- oder Unternehmensdaten, veröffentlichte Inhalte, Abonnement-, Abrechnungs- und Supportdaten verarbeiten. MiniPages können Zugriffe und Interaktionen aufzeichnen, darunter Ereignistyp, zugehöriges Element und URL, Herkunft, Referrer, Browser-User-Agent, Hash der IP-Adresse und Ereignismetadaten. Bei der Lead-Erfassung können E-Mail, MiniPage, Herkunft, Interessengegenstand, technische Browserdaten und die im Formular abgegebene Erklärung erfasst werden. Nutzer können Kunden- und Drittdaten in die Funktionen eingeben."
      },
      {
        "t": "3. Verarbeitungszwecke",
        "c": "Daten werden je nach Zweck zur Erstellung und Authentifizierung von Konten, Bereitstellung von MiniPages und Funktionen, Erfassung von Besucheranfragen, Weitergabe von Kontakten an die jeweiligen Seitenverantwortlichen, Unterstützung, Abwicklung von Abonnements und Zahlungen, Verhinderung von Missbrauch und Betrug, zum Schutz des Dienstes, zur Erfüllung gesetzlicher Pflichten und für interne Zugriffs- und Interaktionsstatistiken genutzt. Werbliche Mitteilungen durch Seitenverantwortliche verfolgen einen gesonderten Zweck und müssen die erteilten Informationen und die geltende Rechtsgrundlage beachten."
      },
      {
        "t": "4. Rechtsgrundlagen",
        "c": "Je nach Zweck kann die Verarbeitung auf Vertragserfüllung oder vorvertraglichen Maßnahmen, gesetzlichen oder regulatorischen Pflichten, Rechtsausübung, gegebenenfalls berechtigten Interessen und, soweit erforderlich, Einwilligung beruhen. Eine Einwilligung wird nicht für alle Vorgänge vorausgesetzt."
      },
      {
        "t": "5. Auf MiniPages veröffentlichte Daten",
        "c": "Informationen, die Nutzer veröffentlichen, wie öffentlicher Name, Bilder, Links, Videos, Produkte und Kontakte, können von Besuchern eingesehen werden. Nutzer müssen für die Veröffentlichung personenbezogener Daten Dritter über eine Erlaubnis oder andere geeignete Rechtsgrundlage verfügen und sensible Daten ohne angemessene Notwendigkeit und Grundlage vermeiden."
      },
      {
        "t": "6. Kunden- und Drittdaten",
        "c": "Wenn Seiteninhaber Daten ihrer eigenen Kunden, Kontakte oder Termine erfassen, bestimmen sie die Zwecke und gewährleisten die Rechtmäßigkeit der Erhebung und Nutzung. MiniPage Pro kann die zur Bereitstellung erforderliche technische Verarbeitung übernehmen, entsprechend den Rollen und Verantwortlichkeiten nach der LGPD."
      },
      {
        "t": "7. Weitergabe und Dienstleister",
        "c": "Je nach Funktion können erforderliche Daten von Hosting- und Infrastrukturanbietern (z. B. Vercel), Authentifizierungs- und Datenbankanbietern (z. B. Supabase), Zahlungsdienstleistern (z. B. Asaas und Stripe) und Anbietern transaktionaler E-Mails und Einladungen (z. B. Resend) verarbeitet werden. MiniPages mit Meta Pixel oder Google Analytics 4 (GA4) können Ereignisse nach Zustimmung zum optionalen Tracking an Meta oder Google übertragen, im Rahmen dieser Erklärung. Links zu WhatsApp, Videoplattformen und anderen externen Websites unterliegen auch deren Richtlinien. Die Weitergabe hängt vom Zweck, der tatsächlich genutzten Funktion und den zulässigen Rechtsgrundlagen ab."
      },
      {
        "t": "8. Abonnements und Zahlungen",
        "c": "Für kostenpflichtige Tarife können MiniPage Pro und der jeweilige Zahlungsdienstleister (Asaas in Brasilien oder Stripe für internationale Zahlungen, je nach Verfügbarkeit) Identifikations-, Abonnement-, Zahlungsstatus- und Abrechnungsdaten nutzen. Diese Erklärung ändert keine Preise, bestehenden Verträge, wiederkehrenden Zahlungen, Pflichten oder Zahlungsabläufe. Die angeforderten Daten hängen von der gewählten Zahlungsmethode ab."
      },
      {
        "t": "9. Cookies, Speicherung und Statistiken",
        "c": "Wir nutzen Cookies und lokalen Browserspeicher für Authentifizierung, Sitzungen, Einstellungen und Funktionen. Interne Zugriffs- und Interaktionsereignisse einschließlich der technischen Daten aus Abschnitt 2 werden ebenfalls erfasst; diese Statistiken sind von der Einwilligung in externe Tools getrennt. Bei gültigen Meta-Pixel- oder GA4-Kennungen können Besucher diese Tools annehmen oder ablehnen; die Wahl wird pro MiniPage lokal gespeichert. Bei der aktuellen Implementierung verhindert eine Ablehnung das erstmalige Laden durch diese Komponente. Betrieb und spätere Änderung richten sich nach verfügbaren Seitenkontrollen und Datenschutzanfragen."
      },
      {
        "t": "10. Aufbewahrung und Löschung",
        "c": "Daten werden gemäß dem Verarbeitungszweck und den betrieblichen, vertraglichen, gesetzlichen, steuerlichen und sicherheitsbezogenen Anforderungen aufbewahrt. Fristen variieren je nach Kategorie und Pflicht; die Kontoschließung löscht nicht automatisch alle Einträge. Anfragen zu Auskunft, Berichtigung, Löschung oder anderen Maßnahmen werden gemäß der LGPD unter Berücksichtigung der Rechte, Verantwortlichkeiten und rechtmäßigen Aufbewahrungsgründe geprüft. Siehe Abschnitt 13."
      },
      {
        "t": "11. Sicherheit",
        "c": "Risikogerechte technische und organisatorische Maßnahmen schützen Daten vor unbefugtem Zugriff, Verlust, Änderung und Offenlegung. Keine digitale Tätigkeit ist risikofrei; Nutzer müssen ihre Zugangsdaten schützen und verdächtige Situationen melden."
      },
      {
        "t": "12. Rechte betroffener Personen",
        "c": "Nach der LGPD können Betroffene, soweit anwendbar, die Bestätigung der Verarbeitung, Auskunft, Berichtigung, Anonymisierung, Sperrung oder Löschung, Datenübertragbarkeit, Informationen zur Weitergabe, Widerspruch gegen rechtswidrige Verarbeitung und Widerruf der Einwilligung verlangen. Manche Anfragen hängen von gesetzlichen Voraussetzungen und der Identifizierung des Verantwortlichen ab."
      },
      {
        "t": "13. Anfragen und Kontakt",
        "c": "Bei Datenschutzfragen oder Anfragen zu von MiniPage Pro verarbeiteten Daten kontaktieren Sie den WhatsApp-Support: +55 11 94105-9063 (https://wa.me/5511941059063). Wir können ausreichende Angaben zur Identitätsprüfung anfordern, um eine Offenlegung an Dritte zu verhindern. Wurden Daten von anderen Nutzern eingegeben, muss sich die Anfrage gegebenenfalls auch an diese Verantwortlichen richten."
      },
      {
        "t": "14. Internationale Übermittlungen und Änderungen",
        "c": "Infrastruktur-, Authentifizierungs-, Hosting-, E-Mail-, Zahlungs- und optionale Analysedienstleister können je nach Dienst und Verarbeitungsort Daten außerhalb Brasiliens verarbeiten oder darauf zugreifen. Internationale Übermittlungen müssen die geltenden rechtlichen Mechanismen und Anforderungen beachten. Änderungen von Funktionen, Anbietern und gesetzlichen Vorgaben können Aktualisierungen erfordern; wesentliche Änderungen werden bei Bedarf mitgeteilt."
      },
      {
        "t": "15. Anmeldung mit Google: Daten und Zwecke",
        "c": "Wenn Sie Mit Google fortfahren wählen, fordert MiniPage Pro ausschließlich die Berechtigungen openid, email und profile zur Authentifizierung an. Google kann eine eindeutige Kontokennung, E-Mail-Adresse, Bestätigungsstatus der E-Mail, Namen, Profilfoto sowie Identitätsmetadaten und erforderliche Sitzungstokens bereitstellen. Diese Daten dienen zur Identifizierung, Kontoerstellung oder Anmeldung, Absicherung von Identitätsverknüpfungen und Aufrechterhaltung der Sitzung. MiniPage Pro erhält Ihr Google-Passwort nicht. Diese Anmeldung fordert keinen Zugriff auf Gmail, Google Drive, Kontakte, Kalender oder private Google-Kontoinhalte. Der Import öffentlicher YouTube-Inhalte ist eine gesonderte Funktion und berechtigt nicht zum Zugriff auf diese privaten Daten."
      },
      {
        "t": "16. Anmeldung mit Google: Speicherung, Schutz und Weitergabe",
        "c": "Identitäts- und Authentifizierungsmetadaten können in Supabase Auth und der Datenbank gespeichert werden; die Sitzung kann im Browser gespeichert werden. Technische Kontrollen und Berechtigungen beschränken den Zugriff auf Datenbank und Berechtigungsregister. Geben Sie einen Empfehlungscode an, können Ihre E-Mail und der Empfehlungseintrag zur Zuordnung und Provisionsverwaltung genutzt werden. Für den Dienst erforderliche Identifikationsdaten können von Infrastruktur- und Authentifizierungsdienstleistern und bei angeforderten weiteren Funktionen von den dafür benötigten Dienstleistern verarbeitet werden. Wir verkaufen von Google erhaltene Daten nicht und nutzen sie nicht für personalisierte Werbung, Werbeprofile oder dienstübergreifendes Tracking. Nutzung und Weitergabe müssen der Google API Services User Data Policy einschließlich geltender Limited-Use-Anforderungen entsprechen."
      },
      {
        "t": "17. Anmeldung mit Google: Widerruf, Aufbewahrung und Löschung",
        "c": "Sie können MiniPage Pro den Zugriff in den Drittanbieterverbindungen Ihres Google-Kontos entziehen. Der Widerruf löscht nicht automatisch Ihr MiniPage-Pro-Konto oder gespeicherte Daten. Zur Löschung der von MiniPage Pro gespeicherten Google-Daten oder zur Kontoschließung wenden Sie sich an minipagepro@gmail.com oder den WhatsApp-Support in Abschnitt 13. Nach Identitätsprüfung bearbeiten wir den Antrag nach geltendem Recht und löschen oder anonymisieren nicht mehr benötigte Daten; gesetzlich, steuerlich, vertraglich oder zur Sicherheit und Rechtsausübung erforderliche Einträge können bei rechtmäßiger Grundlage aufbewahrt werden. Ist Google Ihre einzige Anmeldemethode, kontaktieren Sie vor dem Widerruf den Support."
      }
    ]
  },
  "it-IT": {
    "titulo": "Informativa sulla privacy",
    "intro": "Questa informativa descrive il trattamento dei dati personali su MiniPage Pro, incluso l’accesso con Google, le finalità, i fornitori e i diritti previsti dalla legge brasiliana sulla protezione dei dati (LGPD).",
    "atualizacao": "Ultimo aggiornamento",
    "versao": "Versione",
    "voltar": "Indietro",
    "termos": "Termini di utilizzo",
    "contrato": "Contratto di adesione",
    "cadastro": "Crea un account gratuito",
    "contato": "Richieste sulla privacy",
    "revogar": "Gestisci le connessioni dell’account Google",
    "politicaGoogle": "Norme sui dati degli utenti dei servizi API di Google",
    "secoes": [
      {
        "t": "1. Chi siamo e chi è responsabile",
        "c": "MiniPage Pro è una piattaforma di pagine professionali, promozione digitale e strumenti di gestione, gestita dalla persona giuridica registrata in Brasile con CNPJ 31.671.616/0001-18. Per domande su questa informativa e sui dati sotto la nostra responsabilità, utilizza il canale di assistenza indicato nella pagina."
      },
      {
        "t": "2. Dati che possiamo trattare",
        "c": "A seconda delle funzioni utilizzate, possiamo trattare dati di registrazione e contatto (nome, e-mail, telefono), identificazione del profilo o dell’attività, contenuti pubblicati, abbonamenti, fatturazione e informazioni di assistenza. Le MiniPage possono registrare accessi e interazioni, inclusi tipo di evento, elemento e URL associati, origine, pagina di provenienza, user agent del browser, hash dell’indirizzo IP e metadati. La raccolta di contatti può registrare e-mail, MiniPage, origine, elemento di interesse, informazioni tecniche del browser e manifestazione espressa nel modulo. Gli utenti possono inserire dati di clienti e terzi."
      },
      {
        "t": "3. Finalità",
        "c": "Utilizziamo i dati secondo necessità per creare e autenticare account, fornire MiniPage e funzionalità, registrare richieste dei visitatori, fornire contatti ai responsabili delle pagine, offrire assistenza, gestire abbonamenti e pagamenti, prevenire abusi e frodi, proteggere il servizio, adempiere obblighi legali e fornire metriche interne di accesso e interazione. Le comunicazioni promozionali dei responsabili delle pagine sono una finalità distinta e devono rispettare le informazioni fornite e la base giuridica applicabile."
      },
      {
        "t": "4. Basi giuridiche",
        "c": "Secondo la finalità, il trattamento può basarsi sull’esecuzione del contratto o misure precontrattuali, obblighi legali o normativi, esercizio di diritti, interesse legittimo ove appropriato e consenso quando richiesto. Il consenso non è presunto per tutte le operazioni."
      },
      {
        "t": "5. Dati pubblicati sulle MiniPage",
        "c": "Le informazioni che l’utente decide di pubblicare, come nome pubblico, immagini, link, video, prodotti e contatti, possono essere accessibili ai visitatori. L’utente deve disporre di autorizzazione o altra base giuridica idonea per pubblicare dati personali di terzi ed evitare dati sensibili senza necessità e fondamento adeguati."
      },
      {
        "t": "6. Dati di clienti e terzi",
        "c": "Quando il titolare registra dati di clienti, contatti o appuntamenti propri, spetta a lui definire le finalità e garantire la liceità della raccolta e dell’uso. MiniPage Pro può svolgere il trattamento tecnico necessario per fornire il servizio secondo ruoli e responsabilità previsti dalla LGPD."
      },
      {
        "t": "7. Condivisione e fornitori",
        "c": "Secondo la funzione, i dati necessari possono essere trattati da fornitori di hosting e infrastruttura (come Vercel), autenticazione e database (come Supabase), pagamenti (come Asaas e Stripe) e e-mail transazionali e inviti (come Resend). Le MiniPage con Meta Pixel o Google Analytics 4 (GA4) possono trasmettere eventi a Meta o Google dopo l’accettazione del tracciamento facoltativo da parte del visitatore, nei limiti di questa informativa. Link a WhatsApp, piattaforme video e altri siti esterni sono soggetti anche alle relative politiche. La condivisione dipende da finalità, funzione utilizzata e presupposti legali consentiti."
      },
      {
        "t": "8. Abbonamenti e pagamenti",
        "c": "Per sottoscrivere e mantenere piani a pagamento, MiniPage Pro e il gestore applicabile (Asaas in Brasile o Stripe per pagamenti internazionali, secondo disponibilità) possono utilizzare identificazione, abbonamento, stato dei pagamenti e informazioni di fatturazione. Questa informativa non modifica prezzi, contratti in vigore, ricorrenze, obblighi o flussi di pagamento. I dati richiesti dipendono dal metodo scelto."
      },
      {
        "t": "9. Cookie, archiviazione e metriche",
        "c": "Utilizziamo cookie e memoria locale del browser per autenticazione, sessione, preferenze e funzionamento. Registriamo eventi interni di accesso e interazione, inclusi i dati tecnici della sezione 2; tali metriche sono distinte dal consenso agli strumenti esterni. In presenza di identificatori Meta Pixel o GA4 validi, il visitatore può accettare o rifiutare tali strumenti e la scelta viene conservata localmente per ogni MiniPage. Nell’implementazione attuale, il rifiuto impedisce il caricamento iniziale tramite quel componente. Il funzionamento e le successive modifiche dipendono dai controlli della pagina e dalle richieste di privacy."
      },
      {
        "t": "10. Conservazione e cancellazione",
        "c": "I dati sono conservati secondo finalità e necessità operative, contrattuali, legali, fiscali e di sicurezza. I periodi variano per categoria e obbligo; la chiusura dell’account non elimina automaticamente tutti i registri. Le richieste di accesso, rettifica, cancellazione o altre misure sono valutate secondo la LGPD, considerando i diritti, le responsabilità e i presupposti legali di conservazione. Vedi sezione 13."
      },
      {
        "t": "11. Sicurezza",
        "c": "Adottiamo misure tecniche e amministrative adeguate ai rischi per proteggere i dati da accessi non autorizzati, perdita, alterazione o divulgazione. Nessuna operazione digitale è priva di rischi; l’utente deve proteggere le credenziali e segnalare situazioni sospette all’assistenza."
      },
      {
        "t": "12. Diritti degli interessati",
        "c": "Secondo la LGPD, ove applicabile, l’interessato può chiedere conferma del trattamento, accesso, rettifica, anonimizzazione, blocco o cancellazione, portabilità, informazioni sulla condivisione, opposizione al trattamento irregolare e revoca del consenso. Alcune richieste dipendono da requisiti di legge e dall’identificazione del responsabile del trattamento."
      },
      {
        "t": "13. Richieste e contatti",
        "c": "Per domande o richieste relative ai dati trattati da MiniPage Pro, contatta l’assistenza WhatsApp: +55 11 94105-9063 (https://wa.me/5511941059063). Possiamo chiedere informazioni sufficienti per verificare l’identità ed evitare divulgazioni a terzi. Se i dati sono stati inseriti da un altro utente, la richiesta può dover essere rivolta anche a tale responsabile."
      },
      {
        "t": "14. Trasferimenti internazionali e modifiche",
        "c": "I fornitori di infrastruttura, autenticazione, hosting, e-mail, pagamenti e analisi facoltativa possono trattare o accedere a dati fuori dal Brasile secondo i servizi e i luoghi di trattamento. I trasferimenti devono rispettare i meccanismi e requisiti legali applicabili. L’informativa può essere aggiornata per variazioni di funzionalità, fornitori o legge; le modifiche rilevanti saranno comunicate ove necessario."
      },
      {
        "t": "15. Accesso con Google: dati e finalità",
        "c": "Quando scegli Continua con Google, MiniPage Pro richiede solo gli ambiti openid, email e profile per autenticarsi. Google può fornire l’identificatore univoco dell’account, indirizzo e-mail, stato di verifica dell’e-mail, nome e foto del profilo, oltre a metadati di identità e token necessari alla sessione. Li utilizziamo per identificarti, creare o accedere al tuo account, proteggere il collegamento delle identità e mantenere la sessione. MiniPage Pro non riceve la tua password Google. Questo accesso non richiede Gmail, Google Drive, contatti, calendario o contenuti privati dell’account Google. L’importazione di contenuti pubblici YouTube è una funzione separata che non autorizza l’accesso a questi dati privati."
      },
      {
        "t": "16. Accesso con Google: archiviazione, protezione e condivisione",
        "c": "Identità e metadati di autenticazione possono essere conservati in Supabase Auth e nel database; la sessione può essere mantenuta nel browser. Controlli tecnici e permessi limitano l’accesso al database e ai registri di idoneità. Se inserisci un codice di invito, e-mail e registro della segnalazione possono essere usati per attribuire l’invito e gestire commissioni. I dati di identificazione necessari possono essere trattati dai fornitori di infrastruttura e autenticazione e, quando richiedi altre funzioni, dai fornitori necessari alla loro esecuzione. Non vendiamo dati ricevuti da Google e non li utilizziamo per pubblicità personalizzata, profili pubblicitari o tracciamento tra servizi. Uso e trasferimento devono rispettare le norme sui dati degli utenti dei servizi API di Google, inclusi i requisiti di utilizzo limitato applicabili."
      },
      {
        "t": "17. Accesso con Google: revoca, conservazione e cancellazione",
        "c": "Puoi revocare l’accesso di MiniPage Pro dalle connessioni di terze parti dell’account Google. La revoca non elimina automaticamente l’account MiniPage Pro né i dati già conservati. Per chiedere la cancellazione dei dati Google conservati da MiniPage Pro o la chiusura dell’account, contatta minipagepro@gmail.com o il WhatsApp della sezione 13. Dopo la verifica dell’identità, gestiremo la richiesta secondo la legge, cancellando o anonimizzando dati non più necessari; i registri richiesti da obblighi legali, fiscali, contrattuali, sicurezza o esercizio di diritti possono essere mantenuti finché sussiste una base legittima. Se Google è il tuo unico metodo di accesso, contatta l’assistenza prima di revocarlo."
      }
    ]
  }
}
