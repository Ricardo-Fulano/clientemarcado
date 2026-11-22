/** Mercado comprador segundo EBANX API Operability (24 pay-in markets, novembro/2026).
 * A presença do pais nesta lista NAO confirma onboarding comercial, recorrencia ou empresa vendedora.
 * https://docs.ebanx.com/docs/get-started/api-operability
 */
export const PAISES_EBANX = Object.freeze([
  'AR','BO','BR','CL','CO','CR','DO','EC','EG','GT','IN','ID','KE','MX','NG','PA','PY','PE','ZA','TH','TR','UY','PH','VN',
]) as readonly string[]
export const CONJUNTO_EBANX: ReadonlySet<string> = new Set(PAISES_EBANX)
/** Referencia do nosso modelo comercial: BRL, EUR e USD.
 * Não presume que EBANX possa processar USD/EUR em todos os mercados locais.
 */
export const PAISES_EURO = new Set([
  'AT','BE','BG','HR','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT','NL','PT','SK','SI','ES',
])
export function moedaReferencia(pais: string): 'BRL' | 'EUR' | 'USD' {
  if (pais === 'BR') return 'BRL'
  if (PAISES_EURO.has(pais)) return 'EUR'
  return 'USD'
}
/** Para EBANX, moeda local documentada; contrato deve permitir precificacao e conversao antes de cobrar. */
export const MOEDAS_LOCAIS_EBANX: Readonly<Record<string, string>> = {
  AR:'ARS', BO:'BOB', BR:'BRL', CL:'CLP', CO:'COP', CR:'CRC', DO:'DOP', EC:'USD', EG:'EGP', GT:'GTQ', IN:'INR', ID:'IDR', KE:'KES', MX:'MXN', NG:'NGN', PA:'USD', PY:'PYG', PE:'PEN', ZA:'ZAR', TH:'THB', TR:'TRY', UY:'UYU', PH:'PHP', VN:'VND',
}
