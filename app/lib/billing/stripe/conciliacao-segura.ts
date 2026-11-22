/** BLOCO 2: avaliador PURO; não lê banco, não escreve banco, não concede acesso. */
export type TipoStripe = 'checkout.session.completed' | 'checkout.session.async_payment_succeeded' |
 'checkout.session.async_payment_failed' | 'invoice.paid' | 'invoice.payment_failed' |
 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted' |
 'charge.refunded' | 'charge.dispute.created'
export type DecisaoStripe = 'registrar'|'aguardar_pagamento'|'revisar'|'ignorar'
export type EventoStripeMinimo={id?:unknown;type?:unknown;livemode?:unknown;data?:{object?:{id?:unknown;payment_status?:unknown;status?:unknown;subscription?:unknown;metadata?:unknown}}}
const relevantes = new Set<TipoStripe>([
 'checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed',
 'invoice.paid','invoice.payment_failed','customer.subscription.created',
 'customer.subscription.updated','customer.subscription.deleted','charge.refunded','charge.dispute.created'
])
export type AvaliacaoEvento={decisao:DecisaoStripe;codigo:string;eventId:string|null;tipo:string|null;liberarAcesso:false}
/** Não confundir checkout concluído com fatura paga. Nunca liberar Premium a partir desta rotina. */
export function avaliarEventoStripe(evento:EventoStripeMinimo):AvaliacaoEvento {
 const id=typeof evento?.id==='string' ? evento.id:null
 const tipo=typeof evento?.type==='string' ? evento.type:null
 const r=(decisao:DecisaoStripe,codigo:string):AvaliacaoEvento=>({decisao,codigo,eventId:id,tipo,liberarAcesso:false})
 if(evento?.livemode!==true||!id||!/^evt_[A-Za-z0-9]+$/.test(id)||!tipo)return r('ignorar','EVENTO_NAO_LIVE_OU_INVALIDO')
 if(!relevantes.has(tipo as TipoStripe))return r('ignorar','TIPO_NAO_RELEVANTE')
 const obj=evento.data?.object
 if(!obj||typeof obj.id!=='string'||obj.id.length<5)return r('revisar','OBJETO_AUSENTE')
 if(tipo==='checkout.session.completed'){
   return obj.payment_status==='paid'?r('registrar','CHECKOUT_PAGO_REQUER_CONCILIACAO'):r('aguardar_pagamento','CHECKOUT_NAO_COMPROVA_PAGAMENTO')
 }
 if(tipo==='checkout.session.async_payment_succeeded'||tipo==='invoice.paid')return r('registrar','PAGAMENTO_NOTIFICADO_REQUER_CONFIRMACAO_STRIPE')
 if(tipo==='checkout.session.async_payment_failed'||tipo==='invoice.payment_failed')return r('registrar','FALHA_FINANCEIRA_SEM_DOWNGRADE_IMEDIATO')
 if(tipo==='customer.subscription.created'||tipo==='customer.subscription.updated')return r('registrar','ASSINATURA_MUDOU_EXIGE_CONSULTA_ATUAL')
 if(tipo==='customer.subscription.deleted')return r('registrar','CANCELAMENTO_EXIGE_VERIFICAR_PERIODO')
 if(tipo==='charge.refunded'||tipo==='charge.dispute.created')return r('revisar','ESTORNO_OU_DISPUTA_REQUER_POLITICA')
 return r('ignorar','TIPO_NAO_RELEVANTE')
}

export type Comprovantes={
 tentativaVinculadaAoUsuario:boolean;contaStripeCorreta:boolean;assinaturaVinculadaATentativa:boolean;
 assinaturaAtualAtiva:boolean;faturaConfirmadaNaStripe:boolean;faturaDaMesmaAssinatura:boolean;
 precoIgualAoAprovado:boolean;moedaEValorConferem:boolean;periodoValido:boolean;
 ausenciaDeOutroGatewayAtivo:boolean;semDisputaOuEstornoPendente:boolean;
}
export type Prontidao={prontoParaRevisaoDeAtivacao:boolean;pendencias:string[];ativacaoAutomatica:false}
/** Lista as provas exigidas antes de implementar futura ativação transacional e idempotente. */
export function avaliarComprovantes(c:Comprovantes):Prontidao{
 const required:[keyof Comprovantes,string][]=[
  ['tentativaVinculadaAoUsuario','TENTATIVA_SEM_TITULARIDADE'],
  ['contaStripeCorreta','CONTA_STRIPE_DIVERGENTE'],
  ['assinaturaVinculadaATentativa','ASSINATURA_SEM_VINCULO'],
  ['assinaturaAtualAtiva','ASSINATURA_NAO_ATIVA'],
  ['faturaConfirmadaNaStripe','FATURA_NAO_CONFIRMADA'],
  ['faturaDaMesmaAssinatura','FATURA_DA_ASSINATURA_ERRADA'],
  ['precoIgualAoAprovado','PRECO_NAO_APROVADO'],
  ['moedaEValorConferem','MOEDA_OU_VALOR_DIVERGENTE'],
  ['periodoValido','PERIODO_INVALIDO'],
  ['ausenciaDeOutroGatewayAtivo','OUTRO_GATEWAY_ATIVO'],
  ['semDisputaOuEstornoPendente','DISPUTA_OU_ESTORNO_PENDENTE']
 ]
 const pendencias=required.filter(([k])=>c[k]!==true).map(([,e])=>e)
 return {prontoParaRevisaoDeAtivacao:pendencias.length===0,pendencias,ativacaoAutomatica:false}
}
