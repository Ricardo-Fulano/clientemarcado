import {NextResponse} from 'next/server'
import {stripeLiveReadiness} from '../../../../lib/billing/stripe/live-readiness'
export const runtime='nodejs'
export const dynamic='force-dynamic'
/** Only aggregate readiness flags; never exposes secrets, IDs, or customer data. */
export function GET(){
 const state=stripeLiveReadiness()
 return NextResponse.json({catalogo:'v1_aprovado',configuracaoCompleta:state.ready,
   processamentoConfigurado:state.flagsConfigured&&state.secretsConfigured,
   prontoParaCobrar:state.ready,
   observacao:'Requer homologação operacional e verificação de país/cobrança, além das flags.'},
   {headers:{'Cache-Control':'no-store'}})
}
