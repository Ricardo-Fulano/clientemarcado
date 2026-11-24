/** Indicador complementar, NAO comprova residencia fiscal ou nacionalidade.
 * Na Vercel, x-vercel-ip-country e fornecido pela infraestrutura da plataforma.
 * Falha fechada em producao: se o pais nao estiver disponivel, exige revisao.
 */
export type GeoDecision='match'|'mismatch'|'unknown'
export function verificarPaisIp(paisPretendido:unknown,paisDaVercel:unknown):GeoDecision{
 const normalizar=(v:unknown)=>typeof v==='string'?v.trim().toUpperCase():''
 const preco=normalizar(paisPretendido),ip=normalizar(paisDaVercel)
 if(!/^[A-Z]{2}$/.test(preco)||!/^[A-Z]{2}$/.test(ip))return 'unknown'
 return preco===ip?'match':'mismatch'
}
