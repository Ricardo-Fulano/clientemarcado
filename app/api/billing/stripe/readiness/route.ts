import {NextResponse} from 'next/server'
export const runtime='nodejs'
export const dynamic='force-dynamic'
/** Segurança: relata estado técnico de preparação, não segredos, IDs ou dados de clientes. */
export function GET(){
 return NextResponse.json({
  catalogo:'v1_aprovado',
  conciliacao:'politica_preparada_sem_processamento',
  checkout:'desativado_por_este_bloco',
  acessoPremium:'nao_ativado_por_este_bloco',
  webhook:'ingestao_existente_nao_modificada',
  prontoParaCobrar:false,
 },{headers:{'Cache-Control':'no-store'}})
}
