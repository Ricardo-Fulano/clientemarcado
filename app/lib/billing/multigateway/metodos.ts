import type { MetodoCandidato, MetodoGlobal, ProvedorGlobal } from './esquema'

const detalhes: Readonly<Record<MetodoGlobal, Omit<MetodoCandidato, 'metodo'>>> = {
  pix_automatico: { nome:'Pix Automático', recorrente:true, ressalva:'Exige autorização do cliente em instituição financeira participante.' },
  cartao_recorrente: { nome:'Cartão com renovação', recorrente:true, ressalva:'Exige captura de autorização e contrato recorrente habilitado.' },
  google_pay: { nome:'Google Pay', recorrente:true, exigeDispositivoCompativel:true, ressalva:'Carteira de cartão; suporte em Checkout de assinaturas depende do dispositivo e provedor.' },
  apple_pay: { nome:'Apple Pay', recorrente:true, exigeDispositivoCompativel:true, ressalva:'Carteira de cartão; suporte em Checkout de assinaturas depende do dispositivo e provedor.' },
  paypal_assinaturas: { nome:'PayPal Assinaturas', recorrente:true, ressalva:'Reservado para futura integração com assinatura recorrente aprovada. Não ativado por padrão.' },
  upi_autopay: { nome:'UPI AutoPay', recorrente:true, ressalva:'Requer mandato autorizado na Índia e aprovação EBANX.' },
  nequi_recorrente: { nome:'Nequi Recorrente', recorrente:true },
  capitec_recorrente: { nome:'Capitec Pay Recorrente', recorrente:true },
  opay_recorrente: { nome:'OPay Recorrente', recorrente:true },
  yape_recorrente: { nome:'Yape Recorrente', recorrente:true },
  maya_recorrente: { nome:'Maya Recorrente', recorrente:true },
  zalopay_recorrente: { nome:'ZaloPay Recorrente', recorrente:true },
  ovo_recorrente: { nome:'OVO Recorrente', recorrente:true },
  dana_recorrente: { nome:'DANA Recorrente', recorrente:true },
  nupay_recorrente: { nome:'NuPay Recorrente', recorrente:true },
  sepa_recorrente: { nome:'SEPA Direct Debit', recorrente:true, ressalva:'Exige mandato SEPA e contrato Stripe habilitado.' },
  ach_recorrente: { nome:'ACH Direct Debit', recorrente:true, ressalva:'Exige mandato ACH válido nos EUA.' },
  pad_canada: { nome:'Débito Pré-autorizado PAD/ACSS', recorrente:true, ressalva:'Exige mandato bancário canadense.' },
  bacs_recorrente: { nome:'Bacs Direct Debit', recorrente:true, ressalva:'Exige mandato bancário no Reino Unido.' },
}

/** Candidaturas tecnicas documentadas; disponibilidade comercial NUNCA presumida. */
const metodosEBANXPorPais: Readonly<Record<string, readonly MetodoGlobal[]>> = {
  BR:['pix_automatico','nupay_recorrente','cartao_recorrente'],
  IN:['upi_autopay','cartao_recorrente'],
  CO:['nequi_recorrente','cartao_recorrente'],
  ZA:['capitec_recorrente','cartao_recorrente'],
  NG:['opay_recorrente','cartao_recorrente'],
  PE:['yape_recorrente','cartao_recorrente'],
  PH:['maya_recorrente'], VN:['zalopay_recorrente'],
  ID:['ovo_recorrente','dana_recorrente'],
  AR:['cartao_recorrente'], CL:['cartao_recorrente'], CR:['cartao_recorrente'], DO:['cartao_recorrente'],
  EC:['cartao_recorrente'], GT:['cartao_recorrente'], MX:['cartao_recorrente'], PA:['cartao_recorrente'],
  PY:['cartao_recorrente'], TR:['cartao_recorrente'], UY:['cartao_recorrente'],
  // Bolivia, Egito, Quenia e Tailandia: recorrencia local nao confirmada na fonte consultada.
  // SPEI MX, PromptPay TH, M-PESA KE, Pix QR e UPI comum sao pagamentos pontuais, nao mandatos.
}

export function metodosCandidatos(provedor: ProvedorGlobal, pais: string): readonly MetodoCandidato[] {
  const baseStripe: readonly MetodoGlobal[] = ['cartao_recorrente','google_pay','apple_pay']
  const extrasStripe: readonly MetodoGlobal[] = pais==='US' ? ['ach_recorrente']
    : pais==='CA' ? ['pad_canada']
    : pais==='GB' ? ['bacs_recorrente']
    : ['FR','DE','IT','ES','PT','NL','BE','IE','AT','FI','LU','LT','LV','EE','GR','CY','SK','SI','MT','HR','BG'].includes(pais)
      ? ['sepa_recorrente'] : []
  const ids: readonly MetodoGlobal[] = provedor==='stripe'
    ? [...baseStripe,...extrasStripe]
    : (metodosEBANXPorPais[pais] || [])
  return ids.map(metodo=>({ metodo, ...detalhes[metodo] }))
}
