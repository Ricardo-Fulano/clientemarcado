// Ajudantes de WhatsApp (celular brasileiro) - funcoes PURAS, sem rede nem banco. Usados em tres lugares, para nunca divergirem:
//   - formulario de cadastro (navegador): mascara visual e validacao;
//   - registrarConta (servidor): validacao e normalizacao antes de gravar;
//   - rota e tela de clientes (admin): revalidacao e montagem do link wa.me.
//
// FORMATO SALVO (auth.users.raw_user_meta_data.whatsapp): so digitos, com DDI = 55 + DDD + 9 digitos (13 caracteres),
// ex.: 5511999999999. A mascara "(11) 99999-9999" e SO visual e nunca e o valor salvo.
//
// Por que decidir pelo TAMANHO e nao por startsWith('55'): o DDD 55 existe (RS). "(55) 99999-9999" vira "55999999999"
// (11 digitos) e comecaria com 55 mesmo sem DDI. Pelo tamanho: 11 digitos = numero nacional (acrescenta 55);
// 13 digitos comecando com 55 = ja tem DDI. Qualquer outro tamanho e invalido.

export const TEXTO_FINALIDADE_WHATSAPP = 'Usamos seu WhatsApp apenas para suporte e dúvidas sobre sua assinatura.'

// Celular brasileiro completo: 55 + DDD (2 digitos, 11..99) + 9 + 8 digitos.
const REGEX_CELULAR_BR = /^55[1-9][1-9]9\d{8}$/
// So digitos e a pontuacao comum de telefone; qualquer letra ou outro simbolo invalida a entrada.
const REGEX_ENTRADA_PERMITIDA = /^[\d\s()+.\-]*$/

export function somenteDigitos(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\D/g, '') : ''
}

// Devolve '55' + DDD + celular (13 digitos) ou null se a entrada nao for um celular brasileiro valido.
// Aceita "(11) 99999-9999", "11999999999", "+55 11 99999-9999", "011 99999-9999".
export function normalizarWhatsappBR(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 40 || !REGEX_ENTRADA_PERMITIDA.test(v)) return null
  let d = somenteDigitos(v)
  if (d.length === 12 && d.startsWith('0')) d = d.slice(1)   // zero antes do DDD: "011 9..."
  const completo = d.length === 11 ? '55' + d : (d.length === 13 && d.startsWith('55') ? d : '')
  return REGEX_CELULAR_BR.test(completo) ? completo : null
}

export function whatsappValido(v: unknown): boolean {
  return normalizarWhatsappBR(v) !== null
}

// Mascara VISUAL enquanto a pessoa digita: (11) 99999-9999. Nunca e o valor salvo.
export function aplicarMascaraWhatsapp(v: string): string {
  let d = somenteDigitos(v)
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2)   // colou "+55 11 99999-9999"
  d = d.slice(0, 11)
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length > 0) return `(${d}`
  return ''
}

// Para exibir no admin: "(11) 99999-9999", ou '' se o valor salvo nao for um celular valido.
export function formatarWhatsappExibicao(v: unknown): string {
  const n = normalizarWhatsappBR(v)
  if (!n) return ''
  const d = n.slice(2)
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Primeiro nome para a saudacao: "MARIA SILVA" -> "Maria". Aceita so letras (com acento), apostrofo e hifen.
export function primeiroNome(v: unknown): string {
  if (typeof v !== 'string') return ''
  const t = v.trim().split(/\s+/)[0] || ''
  const limpo = t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'’-]/g, '').replace(/^['’-]+|['’-]+$/g, '').slice(0, 30)
  if (!limpo) return ''
  return limpo.charAt(0).toLocaleUpperCase('pt-BR') + limpo.slice(1).toLocaleLowerCase('pt-BR')
}

// Mensagem de recuperacao (so para status aguardando_pagamento). Vem PREENCHIDA no link; o envio e sempre manual.
export function mensagemRecuperacaoPagamento(nome: unknown): string {
  const n = primeiroNome(nome)
  return `Olá${n ? `, ${n}` : ''}! Aqui é da MiniPage Pro. Vi que você iniciou sua assinatura, mas o pagamento ainda não foi concluído. Ficou alguma dúvida ou posso te ajudar em alguma etapa?`
}

// https://wa.me/<numero>[?text=<mensagem>]. Nunca devolve link se o numero nao for um celular valido.
export function montarLinkWhatsapp(numero: unknown, texto?: string): string | null {
  const n = normalizarWhatsappBR(numero)
  if (!n) return null
  return texto ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : `https://wa.me/${n}`
}

// Link do botao "WhatsApp" de um cliente na lista do admin: mensagem pronta SOMENTE para aguardando_pagamento;
// para qualquer outro status a conversa abre sem texto.
export function linkWhatsappCliente(c: { whatsapp?: unknown; status_acesso?: unknown; nome_contato?: unknown }): string | null {
  const texto = c.status_acesso === 'aguardando_pagamento' ? mensagemRecuperacaoPagamento(c.nome_contato) : undefined
  return montarLinkWhatsapp(c.whatsapp, texto)
}
