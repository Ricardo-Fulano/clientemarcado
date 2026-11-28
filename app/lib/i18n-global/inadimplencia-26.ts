import type {Idioma} from './idiomas'
const copy={
 'pt-BR':['Sua MiniPage agora está no plano Free','Regularize o pagamento para recuperar automaticamente os recursos do seu plano. Seus conteúdos e personalizações estão preservados.','Regularize sua assinatura para evitar a mudança para o Free.'],
 'en-US':['Your MiniPage is now on the Free plan','Resolve your payment to automatically restore your plan features. Your content and customizations are preserved.','Resolve your subscription payment to avoid moving to Free.'],
 'es-ES':['Tu MiniPage ahora está en el plan Free','Regulariza el pago para recuperar automáticamente las funciones de tu plan. Conservamos tus contenidos y personalizaciones.','Regulariza tu suscripción para evitar el cambio a Free.'],
 'fr-FR':['Votre MiniPage est désormais sur l’offre Free','Régularisez le paiement pour retrouver automatiquement les fonctionnalités de votre offre. Vos contenus et personnalisations sont conservés.','Régularisez votre abonnement pour éviter le passage à Free.'],
 'de-DE':['Deine MiniPage nutzt jetzt den Free-Tarif','Begleiche die Zahlung, um deine Tarif-Funktionen automatisch wiederherzustellen. Deine Inhalte und Einstellungen bleiben erhalten.','Begleiche deine Abonnementzahlung, um den Wechsel zu Free zu vermeiden.'],
 'it-IT':['La tua MiniPage è ora sul piano Free','Regolarizza il pagamento per ripristinare automaticamente le funzioni del tuo piano. I contenuti e le personalizzazioni sono conservati.','Regolarizza l’abbonamento per evitare il passaggio al piano Free.'],
} as const
export const inadimplencia26Copy=(i:Idioma)=>copy[i]||copy['pt-BR']

const extra={
  "pt-BR": [
    "Regularizar assinatura existente",
    "Não foi possível conferir o seu plano.",
    "Tentar novamente",
    "Suporte"
  ],
  "en-US": [
    "Resolve existing subscription",
    "Could not verify your plan.",
    "Try again",
    "Support"
  ],
  "es-ES": [
    "Regularizar suscripción existente",
    "No se pudo verificar tu plan.",
    "Intentar de nuevo",
    "Soporte"
  ],
  "fr-FR": [
    "Régulariser l’abonnement existant",
    "Impossible de vérifier votre offre.",
    "Réessayer",
    "Assistance"
  ],
  "de-DE": [
    "Bestehendes Abonnement klären",
    "Dein Tarif konnte nicht geprüft werden.",
    "Erneut versuchen",
    "Support"
  ],
  "it-IT": [
    "Regolarizza abbonamento esistente",
    "Impossibile verificare il tuo piano.",
    "Riprova",
    "Assistenza"
  ]
} as const
export const inadimplencia26Extra=(i:Idioma)=>extra[i]||extra['pt-BR']
