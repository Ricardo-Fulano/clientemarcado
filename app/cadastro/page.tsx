'use client'
import SeletorIdiomaGlobal from '../components/SeletorIdiomaGlobal'
import BotaoGoogle from '../components/BotaoGoogle'
import { auth27Copy } from '../lib/i18n-global/auth-27'
import { googleCobrancaCopy } from '../lib/i18n-global/google-cobranca'
import { useIdiomaGlobal } from '../components/IdiomaProviderGlobal'
import { traduzirLanding } from '../lib/i18n-global/landing'
import { textoInterface } from '../lib/i18n-global/telas-core'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { ehPlanoFree, normalizarBillingCycle } from '../lib/planos'
import { planoEstaNaOferta } from '../lib/comercial/planos-ofertados'
import { ehEmailJaCadastrado } from '../lib/auth-erros'
import { normalizarTelefoneCadastro } from '../lib/telefone-cadastro-global'

const TEXTOS_GLOBAIS = {
  "pt-BR": {
    "subtitulo": "Crie sua MiniPage em poucos passos.",
    "card": "Comece com seus dados básicos. Você poderá personalizar depois.",
    "endereco": "Seu endereço escolhido",
    "slugAviso": "A disponibilidade definitiva será verificada ao criar sua página.",
    "telefone": "Telefone / WhatsApp (com código do país)",
    "telefoneAjuda": "Inclua + e o código do país. Ex.: +55 11 99999 9999, +1 415 555 0123, +595 981 123456. Usaremos apenas para suporte e contato sobre a assinatura.",
    "telefoneErro": "Informe um telefone com código internacional, começando por +."
  },
  "en-US": {
    "subtitulo": "Create your MiniPage in a few steps.",
    "card": "Start with the essentials. You can customize it later.",
    "endereco": "Your chosen address",
    "slugAviso": "Final availability will be checked when your page is created.",
    "telefone": "Phone / WhatsApp (country code)",
    "telefoneAjuda": "Include + and your country code. E.g. +1 415 555 0123, +55 11 99999 9999. Used for subscription support and contact only.",
    "telefoneErro": "Enter a phone number with international country code, starting with +."
  },
  "es-ES": {
    "subtitulo": "Crea tu MiniPage en pocos pasos.",
    "card": "Empieza con lo esencial. Podrás personalizarla después.",
    "endereco": "Tu dirección elegida",
    "slugAviso": "La disponibilidad definitiva se comprobará al crear tu página.",
    "telefone": "Teléfono / WhatsApp (código de país)",
    "telefoneAjuda": "Incluye + y el código de país. Ej.: +34 612 345 678, +595 981 123456. Solo para soporte y contacto sobre tu suscripción.",
    "telefoneErro": "Introduce un teléfono con código internacional, empezando por +."
  },
  "fr-FR": {
    "subtitulo": "Créez votre MiniPage en quelques étapes.",
    "card": "Commencez par l’essentiel. Personnalisez-la ensuite.",
    "endereco": "Votre adresse choisie",
    "slugAviso": "La disponibilité sera vérifiée lors de la création de la page.",
    "telefone": "Téléphone / WhatsApp (indicatif du pays)",
    "telefoneAjuda": "Indiquez + et votre indicatif. Ex. : +33 6 12 34 56 78. Utilisé uniquement pour le support et le suivi de l’abonnement.",
    "telefoneErro": "Saisissez un numéro international commençant par +."
  },
  "de-DE": {
    "subtitulo": "Erstelle deine MiniPage in wenigen Schritten.",
    "card": "Beginne mit den Grundlagen. Später kannst du alles anpassen.",
    "endereco": "Deine gewählte Adresse",
    "slugAviso": "Die Verfügbarkeit wird beim Erstellen deiner Seite endgültig geprüft.",
    "telefone": "Telefon / WhatsApp (Ländervorwahl)",
    "telefoneAjuda": "Gib + und die Ländervorwahl ein, z. B. +49 151 23456789. Nur für Support und Kontakt zum Abonnement.",
    "telefoneErro": "Gib eine internationale Telefonnummer ein, die mit + beginnt."
  },
  "it-IT": {
    "subtitulo": "Crea la tua MiniPage in pochi passaggi.",
    "card": "Inizia dalle informazioni essenziali. Potrai personalizzarla dopo.",
    "endereco": "Il tuo indirizzo scelto",
    "slugAviso": "La disponibilità definitiva verrà verificata durante la creazione.",
    "telefone": "Telefono / WhatsApp (prefisso internazionale)",
    "telefoneAjuda": "Inserisci + e il prefisso nazionale, ad es. +39 312 345 6789. Solo per assistenza e contatti relativi all’abbonamento.",
    "telefoneErro": "Inserisci un numero internazionale che inizi con +."
  }
} as const

const BENEFICIOS = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    titulo: 'signup.benefit1',
    desc: 'signup.benefit1desc',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    titulo: 'signup.benefit2',
    desc: 'signup.benefit2desc',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    titulo: 'signup.benefit3',
    desc: 'signup.benefit3desc',
  },
]
const CalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
export default function Cadastro() {
  const { t, idioma } = useIdiomaGlobal()
  const tr = (chave: string) => textoInterface(idioma, chave)
  const textoGlobal = TEXTOS_GLOBAIS[idioma]
  const textosConsentimento: Record<string, { inicio: string; fim: string; aviso: string }> = {
    'pt-BR': { inicio: 'Li e aceito os', fim: 'da MiniPage Pro.', aviso: 'Sem cartão para começar. Seu nome e telefone poderão ser adicionados depois.' },
    'en-US': { inicio: 'I have read and agree to the', fim: 'of MiniPage Pro.', aviso: 'No card required. You can add your name and private phone later.' },
    'es-ES': { inicio: 'He leído y acepto los', fim: 'de MiniPage Pro.', aviso: 'Sin tarjeta. Podrás añadir tu nombre y teléfono privado después.' },
    'fr-FR': { inicio: 'J’ai lu et j’accepte les', fim: 'de MiniPage Pro.', aviso: 'Sans carte bancaire. Ajoutez votre nom et votre téléphone privé plus tard.' },
    'de-DE': { inicio: 'Ich habe die', fim: 'von MiniPage Pro gelesen und akzeptiert.', aviso: 'Keine Karte nötig. Name und private Telefonnummer kannst du später hinzufügen.' },
    'it-IT': { inicio: 'Ho letto e accetto i', fim: 'di MiniPage Pro.', aviso: 'Nessuna carta richiesta. Puoi aggiungere nome e telefono privato dopo.' },
  }
  const consentimento = textosConsentimento[idioma] || textosConsentimento['pt-BR']
  const [cupom, setCupom] = useState('')
  const [cupomStatus, setCupomStatus] = useState<'idle'|'ok'|'erro'>('idle')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [emailChallenge,setEmailChallenge]=useState<{id:string;email:string}|null>(null)
  const [codigoEmail,setCodigoEmail]=useState('')
  const [enviandoCodigo,setEnviandoCodigo]=useState(false)
  const emailCopy=auth27Copy(idioma)
  const challengeAtual=emailChallenge?.email===email.trim().toLowerCase()?emailChallenge:null
  async function enviarCodigoEmail(){
    if(enviandoCodigo||loading)return
    const alvo=email.trim().toLowerCase()
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(alvo)){setMensagem(emailCopy.email);return}
    setEnviandoCodigo(true);setMensagem('')
    try{
      const r=await fetch('/api/cadastro/verificar-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:alvo,idioma,website:site})})
      const d=await r.json()
      if(!r.ok||typeof d.challengeId!=='string')throw Error('EMAIL')
      setEmailChallenge({id:d.challengeId,email:alvo});setCodigoEmail('');setMensagem(emailCopy.sent)
    }catch{setMensagem(emailCopy.error)}finally{setEnviandoCodigo(false)}
  }
  const [senha, setSenha] = useState('')
  const [whatsapp, setWhatsapp] = useState('') // numero internacional completo, com +DDI
  const [whatsappTocado, setWhatsappTocado] = useState(false)
  const [mostrarCupom, setMostrarCupom] = useState(true)
  const [slugDesejado, setSlugDesejado] = useState('')
  useEffect(() => {
    try {
      const oferta = new URLSearchParams(window.location.search)
      const interesse = oferta.get('interesse'), ciclo = oferta.get('cycle'), mercado = oferta.get('market')
      if (oferta.get('plano') === 'free' && interesse && ['minipage','agenda','loja','essencial'].includes(interesse) && (ciclo==='mensal'||ciclo==='anual') && (mercado==='BR'||mercado==='INTL')) {
        sessionStorage.setItem('mp_landing_intent',JSON.stringify({plano:interesse,ciclo,pais:mercado==='BR'?'BR':'US',criado:Date.now()}))
      } else { sessionStorage.removeItem('mp_landing_intent') }
      const parametro = new URLSearchParams(window.location.search).get('slug') || sessionStorage.getItem('mp_slug_desejado') || ''
      const valido = parametro.trim().toLowerCase()
      if (/^[a-z0-9][a-z0-9-]{2,31}$/.test(valido)) {
        setSlugDesejado(valido)
        sessionStorage.setItem('mp_slug_desejado', valido)
      }
    } catch { /* sem armazenamento: cadastro segue normalmente */ }
  }, [])
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aceitou, setAceitou] = useState(false)
  const [mensagem, setMensagem] = useState('')
  // Tela pós-cadastro (confirmação de e-mail) e reenvio
  const [fase, setFase] = useState<'form' | 'confirmar'>('form')
  const [emailCadastrado, setEmailCadastrado] = useState('')
  const [duplicado, setDuplicado] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenvioMsg, setReenvioMsg] = useState('')
  // OAuth: a configuracao de provedores, callback e provisionamento e feita no Supabase.
  // A UI nao afirma que uma conta foi criada antes de o provedor confirmar.
  const [oauthLoading,setOauthLoading] = useState<'google'|'apple'|null>(null)
  const oauthLabels: Record<string, {or:string,google:string,apple:string,failed:string}> = {
    'pt-BR':{or:'ou continue com',google:'Continuar com Google',apple:'Continuar com Apple',failed:'Não foi possível conectar. Verifique a configuração do provedor.'},
    'en-US':{or:'or continue with',google:'Continue with Google',apple:'Continue with Apple',failed:'Could not connect. Check provider configuration.'},
    'es-ES':{or:'o continúa con',google:'Continuar con Google',apple:'Continuar con Apple',failed:'No fue posible conectar. Revisa la configuración.'},
    'fr-FR':{or:'ou continuer avec',google:'Continuer avec Google',apple:'Continuer avec Apple',failed:'Connexion impossible. Vérifiez la configuration.'},
    'de-DE':{or:'oder weiter mit',google:'Mit Google fortfahren',apple:'Mit Apple fortfahren',failed:'Verbindung fehlgeschlagen. Konfiguration prüfen.'},
    'it-IT':{or:'oppure continua con',google:'Continua con Google',apple:'Continua con Apple',failed:'Connessione non riuscita. Verifica la configurazione.'},
  }
  const googleEnabled = process.env.NEXT_PUBLIC_MP_GOOGLE_OAUTH_ENABLED === 'true' && process.env.NEXT_PUBLIC_MP_GOOGLE_AUTH_READY === 'true'
  const appleEnabled = process.env.NEXT_PUBLIC_MP_APPLE_OAUTH_ENABLED === 'true'
  const oauthText = oauthLabels[idioma] || oauthLabels['pt-BR']
  async function iniciarOAuth(provider: 'google'|'apple') {
    if (provider === 'google' ? !googleEnabled : !appleEnabled) return
    if (!aceitou) {setMensagem(googleCobrancaCopy(idioma)[4]);document.getElementById('aceite')?.focus();return}
    setOauthLoading(provider); setMensagem('')
    try {
      const codigo=cupom.trim().toUpperCase()
      if(codigo){const r=await fetch('/api/publico/validar-cupom?cupom='+encodeURIComponent(codigo));if(!r.ok||!(await r.json())?.valido){setMensagem(googleCobrancaCopy(idioma)[16]);setOauthLoading(null);return}}
      sessionStorage.setItem('mp25_google_flow',JSON.stringify({kind:'signup',accepted:true,cupom:codigo,at:Date.now()}))
      const {error} = await supabase.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}/auth/concluir-social`,...(provider==='google'?{scopes:'openid email profile',queryParams:{prompt:'select_account'}}:{})}})
      if(error) {setMensagem(oauthText.failed);setOauthLoading(null)}
    } catch {setMensagem(oauthText.failed);setOauthLoading(null)}
  }
  // Campo-isca (honeypot): invisivel para pessoas, bots costumam preencher. Se vier preenchido,
  // o cadastro e descartado em silencio.
  const [site, setSite] = useState('')
  async function validarCupom(c: string) {
    if (!c) { setCupomStatus('idle'); return }
    try {
      const res = await fetch(`/api/publico/validar-cupom?cupom=${encodeURIComponent(c)}`)
      const dados = await res.json()
      setCupomStatus(dados?.valido ? 'ok' : 'erro')
    } catch {
      setCupomStatus('erro')
    }
  }
  // Monta o link de confirmacao sempre com o dominio real (nunca localhost em producao).
  // O fallback antigo apontava pra um subdominio vercel.app desatualizado; agora usa a var
  // ja documentada do projeto (NEXT_PUBLIC_SITE_URL), com o dominio oficial como ultimo recurso.
  function montarRedirectTo() {
    if (typeof window !== 'undefined') return `${window.location.origin}/pos-confirmacao`
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br'}/pos-confirmacao`
  }
  // Mensagens amigaveis pro cadastro (nunca mostra erro tecnico cru pro usuario)
  function erroCadastroAmigavel(msg: string) {
    const m = (msg || '').toLowerCase()
    if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
      return 'Esse e-mail já possui um cadastro. Verifique sua caixa de entrada ou tente reenviar o e-mail de confirmação.'
    }
    if (m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')) {
      return 'Por segurança, aguarde alguns minutos antes de tentar novamente.'
    }
    if (m.includes('invalid') && m.includes('email')) {
      return 'Confira se o e-mail foi digitado corretamente.'
    }
    if (m.includes('password') && (m.includes('short') || m.includes('6 char'))) {
      return 'A senha precisa ter no mínimo 6 caracteres.'
    }
    return 'Não conseguimos concluir seu cadastro agora. Tente novamente ou fale com nosso suporte.'
  }
  // Mensagens amigaveis pro reenvio de confirmacao
  function erroReenvioAmigavel(msg: string) {
    const m = (msg || '').toLowerCase()
    if (m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')) {
      return 'Por segurança, aguarde alguns minutos antes de tentar reenviar novamente.'
    }
    if (m.includes('invalid') && m.includes('email')) {
      return 'Confira se o e-mail foi digitado corretamente.'
    }
    return 'Não conseguimos reenviar agora. Entre em contato com o suporte do MiniPage Pro.'
  }
  // Cupom vindo da URL (?cupom=) ou guardado ao abrir o contrato. Roda UMA vez, ao abrir a
  // pagina. So preenche o campo se o cupom for VALIDO (um valor guardado invalido - por
  // exemplo digitado pela metade num teste antigo - e apagado em vez de reaparecer), e
  // nunca sobrescreve o que a pessoa ja digitou.
  useEffect(() => {
    const urlCupom = new URLSearchParams(window.location.search).get('cupom')
    const saved = localStorage.getItem('cm_cupom')
    const cupomFinal = (urlCupom || saved || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!cupomFinal) return
    ;(async () => {
      try {
        const res = await fetch(`/api/publico/validar-cupom?cupom=${encodeURIComponent(cupomFinal)}`)
        const dados = await res.json()
        if (dados?.valido) { setCupom(prev => prev || cupomFinal); setCupomStatus('ok') }
        else if (urlCupom) { setCupom(prev => prev || cupomFinal); setCupomStatus('erro') }
        else localStorage.removeItem('cm_cupom')
      } catch { /* sem rede: a pessoa pode digitar o cupom normalmente */ }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Calcula o plano da mesma forma que handleCadastro() calcula na hora de enviar - usado
  // so pra decidir o billing_cycle de exibicao aqui no JSX. CPF/CNPJ nao e mais coletado
  // nesta tela - passa a ser pedido em /pos-confirmacao, so no momento de planos pagos.
  const planoParaExibicao = typeof window !== 'undefined'
    ? (() => {
        const valor = new URLSearchParams(window.location.search).get('plano') ||
          (localStorage.getItem('clienteMarcadoAceitePlano') === 'true' ? localStorage.getItem('cm_plano') : null) || 'free'
        return planoEstaNaOferta(valor) ? valor : 'free'
      })()
    : 'free'
  // Mesmo padrao ja usado pro plano: le da URL (?billing=anual) OU do localStorage
  // (cm_billing, salvo pelo aceite-plano), sempre normalizado - Free nunca usa isso de
  // verdade (billing_cycle fica null pra Free, decidido no backend em criar-perfil).
  const billingCycleParaExibicao = typeof window !== 'undefined'
    ? normalizarBillingCycle(new URLSearchParams(window.location.search).get('billing') || localStorage.getItem('cm_billing'))
    : 'mensal'
  async function handleCadastro() {
    if (site) { setLoading(true); return }
    const jaAceitou = typeof window !== 'undefined' && localStorage.getItem('clienteMarcadoAceitePlano') === 'true'
    if (!aceitou && !jaAceitou) {
      setMensagem('Para criar sua conta, aceite primeiro o contrato do plano.')
      return
    }
    // Pago mantem telefone necessario ao fluxo de cobranca atual; Free solicita depois.
    const whatsappNormalizado = whatsapp ? normalizarTelefoneCadastro(whatsapp) : null
    if (!ehPlanoFree(planoParaExibicao) && !whatsappNormalizado) {
      setWhatsappTocado(true)
      setMensagem('Erro: ' + textoGlobal.telefoneErro)
      return
    }
    if (aceitou && typeof window !== 'undefined') {
      localStorage.setItem('clienteMarcadoAceitePlano', 'true')
    }
    // Le o plano tanto da URL (?plano=X - usado pelo fluxo novo do Free, que vai direto pro
    // cadastro sem passar por /aceite-plano) quanto do localStorage (fluxo de planos pagos,
    // que passa por /aceite-plano antes) - a URL tem prioridade quando presente.
    const planoDaUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('plano') : null
    const planoSalvo = planoDaUrl || (typeof window !== 'undefined' && localStorage.getItem('clienteMarcadoAceitePlano') === 'true' ? localStorage.getItem('cm_plano') : null) || 'free'
    if (!planoEstaNaOferta(planoSalvo)) {
      setMensagem('Este plano nao esta mais disponivel para novas assinaturas. Escolha uma das cinco opcoes na pagina de precos.')
      return
    }
    const planoTipo = planoSalvo
    if(!challengeAtual){await enviarCodigoEmail();return}
    if(!/^\d{6}$/.test(codigoEmail)){setMensagem(emailCopy.invalid);return}
    setLoading(true)
    setMensagem('')
    // O cadastro e feito PELO SERVIDOR (/api/cadastro/registrar): ele cria a conta ja
    // confirmada (sem e-mail de confirmacao), cria o perfil, grava o cupom e devolve a sessao.
    // Plano, ciclo de cobranca e cupom seguem vindo da URL/localStorage como antes.
    try {
      // Cupom preenchido precisa ser valido: antes, um cupom errado era ignorado em silencio
      // e o parceiro perdia a indicacao sem ninguem perceber. Agora a pessoa e avisada.
      const cupomDigitado = cupom && cupom.trim() ? cupom.trim() : ''
      if (cupomDigitado && cupomStatus !== 'ok') {
        let valido = true
        try {
          const rc = await fetch(`/api/publico/validar-cupom?cupom=${encodeURIComponent(cupomDigitado)}`)
          const dc = await rc.json()
          valido = !!dc?.valido
          setCupomStatus(valido ? 'ok' : 'erro')
        } catch { /* sem rede para validar: segue, o servidor confere de novo */ }
        if (!valido) {
          setMensagem(`O cupom "${cupomDigitado}" não foi encontrado. Corrija o código ou apague o campo para continuar sem cupom.`)
          setLoading(false)
          return
        }
      }
      const res = await fetch('/api/cadastro/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeUsuario, email, senha, termos: true, plano_tipo: planoTipo, billing_cycle: billingCycleParaExibicao, cupom: cupom && cupom.trim() ? cupom.trim() : null, whatsapp: whatsappNormalizado ? '+' + whatsappNormalizado : null, website: site, challengeId:challengeAtual.id,codigoEmail }),
      })
      const dados = await res.json().catch(() => ({}))

      // E-mail ja cadastrado: mostra a tela com "Entrar" e "Esqueci minha senha".
      if (res.status === 409 && dados.codigo === 'JA_TEM_CONTA') {
        setEmailCadastrado(email)
        setDuplicado(true)
        setFase('confirmar')
        setLoading(false)
        return
      }
      if (!res.ok) {
        if(dados.codigo==='EMAIL_CODIGO_INVALIDO'){setMensagem(emailCopy.invalid);setLoading(false);return}
        setMensagem(dados.error || 'Não conseguimos concluir seu cadastro agora. Tente novamente ou fale com nosso suporte.')
        setLoading(false)
        return
      }

      // Login automatico: assume a sessao devolvida; se nao vier, entra com a senha.
      // /pos-confirmacao decide o destino: Free -> painel/onboarding; plano pago -> checkout.
      try { localStorage.removeItem('cm_cupom') } catch { /* ignora */ }
      if (dados.session?.access_token && dados.session?.refresh_token) {
        const { error: erroSessao } = await supabase.auth.setSession({ access_token: dados.session.access_token, refresh_token: dados.session.refresh_token })
        if (!erroSessao) { window.location.href = '/pos-confirmacao?novo=1'; return }
      }
      const { error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (!erroLogin) { window.location.href = '/pos-confirmacao?novo=1'; return }
      // Conta criada, mas o login automatico nao funcionou: manda para o login.
      window.location.href = '/login'
    } catch {
      setMensagem('Não conseguimos concluir seu cadastro agora. Tente novamente ou fale com nosso suporte.')
      setLoading(false)
    }
  }

  async function esqueciSenhaDuplicado() {
    if (!emailCadastrado) return
    setReenviando(true)
    setReenvioMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(emailCadastrado, { redirectTo: window.location.origin + '/redefinir-senha' })
    if (error) setReenvioMsg('Não conseguimos enviar agora. Tente novamente em instantes.')
    else setReenvioMsg('Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha. Confira também spam e promoções.')
    setReenviando(false)
  }
  async function reenviarConfirmacao() {
    if (!emailCadastrado) return
    setReenviando(true)
    setReenvioMsg('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailCadastrado,
      options: { emailRedirectTo: montarRedirectTo() }
    })
    if (error) {
      // Nunca loga dado sensivel (senha nunca aparece aqui); so a mensagem de erro do Supabase
      console.warn('Erro ao reenviar confirmacao:', error.message)
      setReenvioMsg(erroReenvioAmigavel(error.message))
    } else {
      setReenvioMsg('E-mail reenviado! Verifique sua caixa de entrada e spam.')
    }
    setReenviando(false)
  }
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0B0A10; }
    .pg { min-height: 100vh; background: radial-gradient(circle at 70% 15%,rgba(149,82,245,.15),transparent 44%),#0B0A10;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex; flex-direction: column; }
    .col-esquerda { display: none; }
    .pg-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 32px 16px 40px; gap: 0; }
    .logo-bloco { width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 24px; }
    .logo-icone { width: 34px; height: 34px; border-radius: 10px; background: #8B5CF6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-texto { font-size: 18px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; }
    .headline-bloco { width: 100%; max-width: 480px; text-align: center; margin-bottom: 24px; }
    .headline-titulo { font-size: 24px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.2; }
    .headline-sub { font-size: 14px; color: #B8AAB8; line-height: 1.55; }
    .form-bloco { width: 100%; max-width: 480px; margin-bottom: 20px; }
    .beneficios-mobile { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 8px; }
    .beneficio-mobile-item { display: flex; align-items: center; gap: 12px; padding: 13px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 11px; }
    .beneficio-mobile-icone { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.15); display: flex; align-items: center; justify-content: center; color: #8B5CF6; }
    .beneficio-mobile-titulo { font-size: 13px; font-weight: 600; color: #B8AAB8; }
    @media (min-width: 900px) {
      .col-esquerda { display: flex; flex-direction: column; gap: 36px; flex: 1; }
      .logo-bloco { display: none; }
      .headline-bloco { display: none; }
      .beneficios-mobile { display: none; }
      .pg-body { flex-direction: row; align-items: center; justify-content: center; padding: 48px 48px; gap: 64px; }
      .form-bloco { flex: 1; max-width: 480px; margin-bottom: 0; }
      .pg-body > .col-esquerda, .pg-body > .form-bloco { max-width: 480px; }
    }
    .desk-logo-row { display: flex; align-items: center; gap: 10px; }
    .desk-logo-icone { width: 36px; height: 36px; border-radius: 10px; background: #8B5CF6; display: flex; align-items: center; justify-content: center; }
    .desk-logo-texto { font-size: 18px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; }
    .desk-hero-titulo { font-size: 38px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 14px; }
    .desk-hero-titulo span { color: #C9FA45; }
    .desk-hero-sub { font-size: 16px; color: #B8AAB8; line-height: 1.6; }
    .desk-beneficios { display: flex; flex-direction: column; gap: 14px; }
    .desk-beneficio { display: flex; align-items: flex-start; gap: 14px; background: #191520; border: 1px solid #35293D; border-radius: 12px; padding: 16px 18px; }
    .desk-beneficio-icone { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; color: #8B5CF6; }
    .desk-beneficio-titulo { font-size: 14px; font-weight: 700; color: #F8F4F7; margin-bottom: 3px; }
    .desk-beneficio-desc { font-size: 13px; color: #B8AAB8; line-height: 1.45; }
    .card { background: linear-gradient(155deg,#21182D,#15111B 70%); border: 1px solid #493854; border-radius: 24px; padding: 24px 20px; box-shadow: 0 18px 60px rgba(0,0,0,0.35); }
    @media (min-width: 900px) { .card { padding: 36px 32px; } }
    .card-titulo { font-size: 19px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; margin-bottom: 3px; }
    .card-sub { font-size: 13px; color: #B8AAB8; margin-bottom: 22px; }
    .campos { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .label { display: block; font-size: 11px; font-weight: 600; color: #B8AAB8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; }
    .hint { font-size: 11px; color: #B8AAB8; margin-top: 5px; }
    .input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 16px; color: #F8F4F7; font-size: 16px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-appearance: none; }
    .input:focus { border-color: rgba(201,250,69,0.7); box-shadow:0 0 0 3px rgba(201,250,69,.10); }
    .input::placeholder { color: #B8AAB8; }
    .senha-wrap { position: relative; }
    .senha-wrap .input { padding-right: 48px; }
    .olho { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #B8AAB8; display: flex; align-items: center; padding: 4px; -webkit-tap-highlight-color: transparent; }
    .olho:hover { color: #B8AAB8; }
    .btn-criar { width: 100%; background: #C9FA45; color: #151809; font-size: 15px; font-weight: 700; padding: 15px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(149,82,245,0.15); transition: background 0.15s, box-shadow 0.15s, opacity 0.15s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; margin-bottom: 14px; }
    .btn-criar:hover { background:#D7FF70; box-shadow:0 6px 24px rgba(201,250,69,.18); }
    .btn-criar:disabled { opacity: 0.6; cursor: not-allowed; }
    .link-login { text-align: center; font-size: 13px; color: #B8AAB8; }
    .link-login a { color: #8B5CF6; font-weight: 600; text-decoration: none; }
    .link-login a:hover { text-decoration: underline; }
    .msg-ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #22C55E; margin-bottom: 14px; text-align: center; }
    .msg-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #EF4444; margin-bottom: 14px; text-align: center; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #B8AAB8; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .confirmar-icone { width: 56px; height: 56px; border-radius: 16px; background: rgba(34,197,94,0.10); border: 1px solid rgba(34,197,94,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
    .confirmar-email { font-weight: 700; color: #F8F4F7; word-break: break-all; }
    .btn-secundario { width: 100%; background: rgba(255,255,255,0.04); color: #F8F4F7; font-size: 14px; font-weight: 600; padding: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s, opacity 0.15s; font-family: inherit; -webkit-tap-highlight-color: transparent; text-decoration: none; }
    .btn-secundario:hover { background: rgba(255,255,255,0.07); }
    .btn-secundario:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-whatsapp { width: 100%; background: rgba(34,197,94,0.1); color: #22C55E; font-size: 14px; font-weight: 600; padding: 13px; border: 1px solid rgba(34,197,94,0.25); border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; font-family: inherit; transition: background 0.15s; -webkit-tap-highlight-color: transparent; }
    .btn-whatsapp:hover { background: rgba(34,197,94,0.16); }
    .confirmar-botoes { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
  `
  const camposCadastro = (
            <div className="campos">
              {!ehPlanoFree(planoParaExibicao) && <div>
                <label className="label">{tr('signup.yourName')}</label>
                <input type="text" placeholder="Ex: Ana Carolina" value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)} className="input" />
              </div>}
              <div>
                <label className="label">{t('account.email')}</label>
                <input type="email" placeholder="ana@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input" />
              </div>
              {!ehPlanoFree(planoParaExibicao) && (<>
              <div>
                <label className="label" htmlFor="cadastro-telefone-global">{textoGlobal.telefone}</label>
                <input id="cadastro-telefone-global" type="tel" inputMode="tel" autoComplete="tel" placeholder="+55 11 99999 9999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} onBlur={() => setWhatsappTocado(true)} className="input" aria-invalid={whatsappTocado && !normalizarTelefoneCadastro(whatsapp)} aria-describedby="cadastro-telefone-ajuda" />
                {whatsappTocado && !normalizarTelefoneCadastro(whatsapp) && (
                  <p role="alert" style={{fontSize:'11px',color:'#FF9A9A',marginTop:'5px'}}>{textoGlobal.telefoneErro}</p>
                )}
                <p id="cadastro-telefone-ajuda" style={{fontSize:'11px',color:'#B9B0C9',marginTop:'5px'}}>{textoGlobal.telefoneAjuda}</p>
              </div>
              </>)}
              <div>
                <label className="label">{t('account.password')}</label>
                <div className="senha-wrap">
                  <input type={mostrarSenha ? 'text' : 'password'} placeholder={tr('signup.passwordMin')} value={senha} onChange={e => setSenha(e.target.value)} className="input" />
                  <button className="olho" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>
                    {mostrarSenha ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
  )
  return (
    <div className="pg">
      <style>{css}</style>
      <div style={{position:"fixed",top:10,right:12,zIndex:70,background:"#1a1020",padding:6,borderRadius:8}}><SeletorIdiomaGlobal compacto /></div>
      <div className="pg-body">
        <div className="col-esquerda">
          <div className="desk-logo-row">
            <img src="/brand/minipage-icone.svg" alt="MiniPage Pro" width={36} height={36} style={{borderRadius:'10px',objectFit:'contain',flexShrink:0}}/>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1.15}}>
              <span className="desk-logo-texto">MiniPage <span style={{color:"#C9FA45"}}>Pro</span></span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#B8AAB8',letterSpacing:'.02em'}}>MiniPage <span style={{color:"#C9FA45"}}>Pro</span></span>
            </div>
          </div>
          <div>
            <h1 className="desk-hero-titulo">
              {tr('signup.hero')}<br />{idioma === 'pt-BR' ? 'com a' : idioma === 'en-US' ? 'with' : idioma === 'es-ES' ? 'con' : idioma === 'fr-FR' ? 'avec' : idioma === 'de-DE' ? 'mit' : 'con'} <span>MiniPage <span style={{color:"#C9FA45"}}>Pro</span></span>
            </h1>
            <p className="desk-hero-sub">
              {tr('signup.heroSub1')}<br />
              {tr('signup.heroSub2')}
            </p>
          </div>
          <div className="desk-beneficios">
            {BENEFICIOS.map(b => (
              <div key={tr(b.titulo)} className="desk-beneficio">
                <div className="desk-beneficio-icone">{b.icon}</div>
                <div>
                  <p className="desk-beneficio-titulo">{tr(b.titulo)}</p>
                  <p className="desk-beneficio-desc">{tr(b.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="logo-bloco">
          <img src="/brand/minipage-icone.svg" alt="MiniPage Pro" width={34} height={34} style={{borderRadius:'10px',objectFit:'contain',flexShrink:0}}/>
          <span className="logo-texto">MiniPage <span style={{color:"#C9FA45"}}>Pro</span></span>
        </div>
        <div className="headline-bloco">
          <h1 className="headline-titulo">{ehPlanoFree(planoParaExibicao) ? t('plans.free') + ' — ' + t('nav.signup') : t('nav.signup')}</h1>
          <p className="headline-sub">{textoGlobal.subtitulo}</p>
        </div>
        <div className="form-bloco">
          <div className="card">
            {fase === 'form' ? (
            <>
            <p className="card-titulo">{ehPlanoFree(planoParaExibicao) ? tr('login.free') : tr('signup.create')}</p>
            <p className="card-sub">{textoGlobal.card}</p>
            {ehPlanoFree(planoParaExibicao) && <p style={{fontSize:"12px",color:"#C9FA45",marginBottom:"12px"}}>{consentimento.aviso}</p>}
            {slugDesejado && <p role="status" style={{padding:'11px 13px',border:'1px solid #55426A',borderRadius:'10px',background:'#21182D',color:'#F5F2FF',fontSize:'13px',marginBottom:'13px',overflowWrap:'anywhere'}}>{textoGlobal.endereco}: <strong style={{color:'#C9FA45'}}>minipage.pro/{slugDesejado}</strong><br/><span style={{fontSize:'11px',color:'#B9B0C9'}}>{textoGlobal.slugAviso}</span></p>}
            {(!ehPlanoFree(planoParaExibicao)||!googleEnabled)&&camposCadastro}
            {mensagem && (
              <div className={mensagem.startsWith('Erro') ? 'msg-err' : 'msg-ok'}>
                {mensagem}
              </div>
            )}
            {(cupom && cupomStatus === 'ok') || mostrarCupom ? (
              <div>
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'7px'}}>{tr('signup.coupon')}</label>
              <input type="text" placeholder="Ex: ANNA10" value={cupom}
                onChange={e => { setCupom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')); setCupomStatus('idle') }}
                onBlur={() => validarCupom(cupom)}
                style={{width:'100%',background:'rgba(24,16,27,.92)',border:`1.5px solid ${cupomStatus==='ok'?'rgba(34,197,94,.5)':cupomStatus==='erro'?'rgba(239,68,68,.4)':'rgba(42,26,47,.18)'}`,borderRadius:'14px',padding:'13px 16px',color:'#F8F4F7',fontSize:'15px',outline:'none',fontFamily:'inherit',transition:'border-color .2s',boxSizing:'border-box' as const}} />
              {cupomStatus==='ok'&&<p style={{fontSize:'11px',color:'#22C55E',marginTop:'5px'}}>{traduzirLanding(idioma, "✓ Cupom de indicação aplicado com sucesso.")}</p>}
              {cupomStatus==='erro'&&<p style={{fontSize:'11px',color:'#EF4444',marginTop:'5px'}}>{traduzirLanding(idioma, "Cupom não encontrado. Você pode continuar sem cupom.")}</p>}
              {cupomStatus==='idle'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'5px'}}>{traduzirLanding(idioma, "Se recebeu um cupom de um parceiro, informe aqui. Campo opcional.")}</p>}
            </div>
              </div>
            ) : (
              <button type="button" onClick={() => setMostrarCupom(true)} style={{display:'block',background:'transparent',border:0,color:'#D5CBE2',textDecoration:'underline',marginBottom:'13px',cursor:'pointer',fontSize:'12px'}}>{tr('signup.coupon')} +</button>
            )}
            <div style={{marginBottom:'14px',display:'flex',alignItems:'flex-start',gap:'10px'}}><input type="checkbox" id="aceite" checked={aceitou} onChange={e=>setAceitou(e.target.checked)} style={{marginTop:'2px',accentColor:'#8B5CF6',width:'15px',height:'15px',flexShrink:0,cursor:'pointer'}} /><label htmlFor="aceite" style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,cursor:'pointer'}}>{consentimento.inicio} <a href="/contrato-de-adesao" target="_blank" rel="noreferrer" onClick={()=>{if(cupom&&typeof window!=='undefined')localStorage.setItem('cm_cupom',cupom)}} style={{color:'#8B5CF6',textDecoration:'none',fontWeight:600}}>{idioma === 'en-US' ? 'terms of use and agreement' : idioma === 'es-ES' ? 'términos de uso y acuerdo' : idioma === 'fr-FR' ? 'conditions d’utilisation et contrat' : idioma === 'de-DE' ? 'Nutzungsbedingungen und Vereinbarung' : idioma === 'it-IT' ? 'termini di utilizzo e contratto' : 'termos de uso e contrato de adesão'}</a> {consentimento.fim}</label></div>
            {ehPlanoFree(planoParaExibicao)&&googleEnabled&&<BotaoGoogle busy={oauthLoading==='google'} disabled={loading||!!oauthLoading} onClick={()=>iniciarOAuth('google')}/>}
            {ehPlanoFree(planoParaExibicao)&&googleEnabled&&camposCadastro}
            <div style={{margin:'12px 0'}}>
              {challengeAtual&&<><label htmlFor="mp27-code" style={{display:'block',fontSize:12,marginBottom:6}}>{emailCopy.code}</label><input id="mp27-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigoEmail} onChange={e=>setCodigoEmail(e.target.value.replace(/[^0-9]/g,''))} style={{width:'100%',padding:12,border:'1px solid #655778',borderRadius:10,background:'#21182D',color:'#fff',boxSizing:'border-box'}}/><p style={{fontSize:12,marginTop:6,color:'#C5BCD1'}}>{emailCopy.sent}</p></>}
              <button type="button" disabled={enviandoCodigo||loading||!!oauthLoading} onClick={()=>void enviarCodigoEmail()} style={{marginTop:8,background:'transparent',color:'#C9FA45',border:'1px solid #655778',borderRadius:10,padding:10,width:'100%',cursor:'pointer'}}>{enviandoCodigo?'…':challengeAtual?emailCopy.resend:emailCopy.send}</button>
            </div>
            <input type="text" name="website" value={site} onChange={e => setSite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />
            <button onClick={handleCadastro} disabled={loading||enviandoCodigo||!!oauthLoading} className="btn-criar">
              {loading ? tr('signup.creating') : (
                <>
                  {tr('signup.createMine')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
            {ehPlanoFree(planoParaExibicao) && appleEnabled && <div style={{margin:'16px 0',textAlign:'center'}}>
              <div style={{color:'#B9B0C9',fontSize:12,marginBottom:12}}>{oauthText.or}</div>
              <div style={{display:'grid',gap:9}}>

                {appleEnabled && <button type="button" disabled={!!oauthLoading||loading} onClick={()=>iniciarOAuth('apple')} style={{background:'#201928',color:'#F9F6FD',border:'1px solid #55465D',padding:13,borderRadius:12,fontWeight:650,cursor:'pointer'}}>{oauthLoading==='apple'?'…':oauthText.apple}</button>}
              </div>
            </div>}
            <p className="link-login">
              {tr('signup.hasAccount')} <Link href="/login">{t('nav.login')}</Link>
            </p>
            </>
            ) : (
            <>
              {duplicado ? (
              <>
                <div className="confirmar-icone">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="card-titulo" style={{textAlign:'center'}}>{tr('signup.alreadyEmail')}</p>
                <p className="card-sub" style={{textAlign:'center'}}>{tr('signup.enterToContinue')}</p>
                <p className="confirmar-email" style={{textAlign:'center',marginBottom:'18px'}}>{emailCadastrado}</p>
                {reenvioMsg && (
                  <div className={reenvioMsg.startsWith('Não') ? 'msg-err' : 'msg-ok'}>{reenvioMsg}</div>
                )}
                <div className="confirmar-botoes">
                  <Link href="/login" className="btn-criar" style={{textAlign:'center',textDecoration:'none'}}>{t('nav.login')}</Link>
                  <button type="button" onClick={esqueciSenhaDuplicado} disabled={reenviando} className="btn-secundario">
                    {reenviando ? tr('login.sending') : tr('login.forgot')}
                  </button>
                  <button type="button" className="btn-secundario" onClick={() => { setFase('form'); setMensagem(''); setDuplicado(false); setReenvioMsg('') }}>
                    {tr('signup.wrongEmail')}
                  </button>
                </div>
              </>
              ) : (
              <>
              <div className="confirmar-icone">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <p className="card-titulo" style={{textAlign:'center'}}>
                {duplicado ? tr('signup.alreadyEmail') : tr('signup.success')}
              </p>
              <p className="card-sub" style={{textAlign:'center'}}>
                {duplicado
                  ? tr('signup.confirmEmailAgain')
                  : tr('signup.confirmEmail')}
              </p>
              <p className="confirmar-email" style={{textAlign:'center',marginBottom:'18px'}}>{emailCadastrado}</p>
              <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.6,textAlign:'center',marginBottom:'6px'}}>
                {tr('signup.checkInbox')}
              </p>
              <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.6,textAlign:'center',marginBottom:'18px'}}>
                {tr('signup.searchEmail')} <strong style={{color:'#F8F4F7'}}>MiniPage Pro</strong> {tr('signup.or')} <strong style={{color:'#F8F4F7'}}>noreply</strong>.
              </p>
              {reenvioMsg && (
                <div className={reenvioMsg.startsWith('Não') || reenvioMsg.startsWith('Por segurança') || reenvioMsg.startsWith('Confira') ? 'msg-err' : 'msg-ok'}>
                  {reenvioMsg}
                </div>
              )}
              <div className="confirmar-botoes">
                <button onClick={reenviarConfirmacao} disabled={reenviando} className="btn-criar">
                  {reenviando ? tr('signup.resending') : tr('signup.resend')}
                </button>
                <Link href="/login" className="btn-secundario">{tr('signup.toLogin')}</Link>
                <button type="button" className="btn-secundario" onClick={() => { setFase('form'); setMensagem(''); setDuplicado(false) }}>
                  {tr('signup.wrongEmail')}
                </button>
                <a
                  href={`https://wa.me/5511941059063?text=${encodeURIComponent('Olá! Fiz meu cadastro no MiniPage Pro, mas não recebi o e-mail de confirmação.')}`}
                  target="_blank" rel="noreferrer" className="btn-whatsapp"
                >
                  {tr('signup.support')}
                </a>
              </div>
              </>
              )}
            </>
            )}
          </div>
        </div>
        <div className="beneficios-mobile">
          {BENEFICIOS.map(b => (
            <div key={tr(b.titulo)} className="beneficio-mobile-item">
              <div className="beneficio-mobile-icone">{b.icon}</div>
              <span className="beneficio-mobile-titulo">{tr(b.titulo)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B8AAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        {tr('signup.secure')}
      </div>
    </div>
  )
}
