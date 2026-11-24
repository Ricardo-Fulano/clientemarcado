import type { Metadata } from 'next'
import LandingPublica from '../LandingPublica'
export const metadata: Metadata = {title:'Planos e Preços | MiniPage Pro',description:'Planos MiniPage Pro — Brasil e Internacional, mensal e anual.'}
export default function PrecosPage(){return <LandingPublica somentePrecos/>}
