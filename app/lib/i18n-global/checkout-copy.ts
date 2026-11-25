const idiomas = ["pt-BR", "en-US", "es-ES", "fr-FR", "de-DE", "it-IT"]
const textos = [
 [
  "Brasil · BRL",
  "Brazil · BRL",
  "Brasil · BRL",
  "Brésil · BRL",
  "Brasilien · BRL",
  "Brasile · BRL"
 ],
 [
  "Internacional · USD",
  "International · USD",
  "Internacional · USD",
  "International · USD",
  "International · USD",
  "Internazionale · USD"
 ],
 [
  "Brasil: escolha seu plano e continue para o pagamento recorrente em reais. Os métodos disponíveis serão confirmados no checkout.",
  "Brazil: choose your plan and continue to recurring payment in BRL. Available methods are confirmed at checkout.",
  "Brasil: elige tu plan y continúa al pago recurrente en BRL. Los métodos disponibles se confirman al pagar.",
  "Brésil : choisissez votre formule et continuez vers le paiement récurrent en BRL. Les moyens disponibles seront confirmés au paiement.",
  "Brasilien: Wähle deinen Tarif und fahre zur wiederkehrenden Zahlung in BRL fort. Die verfügbaren Zahlungsarten werden dort bestätigt.",
  "Brasile: scegli il piano e continua al pagamento ricorrente in BRL. I metodi disponibili saranno confermati al checkout."
 ],
 [
  "Internacional: assinatura em USD, onde disponível. Informe seu endereço real no pagamento.",
  "International: USD subscription where available. Enter your actual billing address at checkout.",
  "Internacional: suscripción en USD donde esté disponible. Indica tu dirección real al pagar.",
  "International : abonnement en USD si disponible. Indiquez votre adresse réelle au paiement.",
  "International: USD-Abo, sofern verfügbar. Gib deine tatsächliche Rechnungsadresse an.",
  "Internazionale: abbonamento in USD ove disponibile. Inserisci il vero indirizzo di fatturazione."
 ],
 [
  "Cobrança mensal",
  "Monthly billing",
  "Facturación mensual",
  "Facturation mensuelle",
  "Monatliche Abrechnung",
  "Fatturazione mensile"
 ],
 [
  "Cobrança anual",
  "Yearly billing",
  "Facturación anual",
  "Facturation annuelle",
  "Jährliche Abrechnung",
  "Fatturazione annuale"
 ],
 [
  "Indisponível",
  "Unavailable",
  "No disponible",
  "Indisponible",
  "Nicht verfügbar",
  "Non disponibile"
 ],
 [
  "Entre na sua conta antes de contratar.",
  "Sign in before subscribing.",
  "Inicia sesión antes de suscribirte.",
  "Connectez-vous avant de vous abonner.",
  "Melde dich vor dem Abschluss an.",
  "Accedi prima di abbonarti."
 ],
 [
  "Seu perfil ainda não está pronto.",
  "Your profile is not ready yet.",
  "Tu perfil aún no está listo.",
  "Votre profil n’est pas encore prêt.",
  "Dein Profil ist noch nicht bereit.",
  "Il tuo profilo non è ancora pronto."
 ],
 [
  "Esta conta já possui plano pago ou vínculo financeiro. Para evitar cobrança duplicada, consulte Meu Plano ou o suporte.",
  "This account already has a paid plan or billing relationship. To avoid duplicate charges, visit My Plan or support.",
  "Esta cuenta ya tiene un plan de pago o vínculo de facturación. Consulta Mi plan o soporte para evitar duplicados.",
  "Ce compte a déjà une formule payante ou un lien de facturation. Consultez Ma formule ou le support pour éviter un doublon.",
  "Dieses Konto hat bereits einen kostenpflichtigen Tarif oder eine Zahlungsverbindung. Prüfe Mein Tarif oder den Support, um Doppelzahlungen zu vermeiden.",
  "Questo account ha già un piano a pagamento o un rapporto di fatturazione. Consulta Il mio piano o il supporto per evitare duplicati."
 ],
 [
  "Não foi possível consultar os planos.",
  "Could not load plans.",
  "No se pudieron consultar los planes.",
  "Impossible de consulter les formules.",
  "Tarife konnten nicht geladen werden.",
  "Impossibile consultare i piani."
 ],
 [
  "Sua sessão expirou. Faça login novamente.",
  "Your session expired. Sign in again.",
  "Tu sesión caducó. Inicia sesión de nuevo.",
  "Votre session a expiré. Reconnectez-vous.",
  "Deine Sitzung ist abgelaufen. Melde dich erneut an.",
  "Sessione scaduta. Accedi di nuovo."
 ],
 [
  "Sua tentativa exige conferência antes de abrir outro pagamento. Nenhuma nova cobrança deve ser iniciada; procure o suporte.",
  "Your previous attempt needs review. Do not start another payment; contact support.",
  "Tu intento anterior requiere revisión. No inicies otro pago; contacta con soporte.",
  "Votre tentative précédente doit être vérifiée. Ne lancez pas un autre paiement ; contactez le support.",
  "Dein vorheriger Versuch muss geprüft werden. Starte keine weitere Zahlung; kontaktiere den Support.",
  "Il tentativo precedente richiede verifica. Non avviare un altro pagamento; contatta il supporto."
 ],
 [
  "As contratações internacionais ainda não foram abertas ao público.",
  "International subscriptions are not yet open to the public.",
  "Las suscripciones internacionales aún no están abiertas al público.",
  "Les abonnements internationaux ne sont pas encore ouverts au public.",
  "Internationale Abos sind noch nicht öffentlich verfügbar.",
  "Gli abbonamenti internazionali non sono ancora aperti al pubblico."
 ],
 [
  "Existe uma tentativa anterior que precisa ser verificada antes de tentar novamente.",
  "A previous attempt must be reviewed before retrying.",
  "Hay un intento anterior que debe revisarse antes de reintentar.",
  "Une tentative précédente doit être vérifiée avant de réessayer.",
  "Ein vorheriger Versuch muss vor einem erneuten Versuch geprüft werden.",
  "Un tentativo precedente deve essere verificato prima di riprovare."
 ],
 [
  "Não foi possível confirmar a situação da tentativa anterior. Procure o suporte.",
  "Could not verify the previous attempt. Contact support.",
  "No se pudo verificar el intento anterior. Contacta con soporte.",
  "Impossible de vérifier la tentative précédente. Contactez le support.",
  "Der vorherige Versuch konnte nicht geprüft werden. Kontaktiere den Support.",
  "Impossibile verificare il tentativo precedente. Contatta il supporto."
 ],
 [
  "Esta conta já possui um vínculo financeiro. Consulte Meu Plano.",
  "This account already has a billing relationship. Visit My Plan.",
  "Esta cuenta ya tiene un vínculo de facturación. Consulta Mi plan.",
  "Ce compte a déjà un lien de facturation. Consultez Ma formule.",
  "Dieses Konto hat bereits eine Zahlungsverbindung. Prüfe Mein Tarif.",
  "Questo account ha già un rapporto di fatturazione. Consulta Il mio piano."
 ],
 [
  "Para contratar em reais, selecione Brasil no checkout.",
  "To subscribe in BRL, select Brazil at checkout.",
  "Para suscribirte en BRL, selecciona Brasil al pagar.",
  "Pour souscrire en BRL, sélectionnez Brésil lors du paiement.",
  "Für Abos in BRL wähle Brasilien beim Bezahlen.",
  "Per abbonarti in BRL, seleziona Brasile al checkout."
 ],
 [
  "O preço não foi confirmado na Stripe. Nenhuma nova cobrança foi iniciada.",
  "The price could not be verified. No new charge was initiated.",
  "No se pudo verificar el precio. No se inició ningún cargo nuevo.",
  "Le prix n’a pas pu être vérifié. Aucun nouveau débit n’a été lancé.",
  "Der Preis konnte nicht bestätigt werden. Keine neue Abbuchung wurde gestartet.",
  "Prezzo non verificato. Nessun nuovo addebito avviato."
 ],
 [
  "Não foi possível abrir o checkout com segurança.",
  "Could not safely open checkout.",
  "No se pudo abrir el pago de forma segura.",
  "Impossible d’ouvrir le paiement en toute sécurité.",
  "Checkout konnte nicht sicher geöffnet werden.",
  "Impossibile aprire il pagamento in sicurezza."
 ],
 [
  "Falha ao abrir o checkout.",
  "Could not open checkout.",
  "No se pudo abrir el pago.",
  "Impossible d’ouvrir le paiement.",
  "Checkout konnte nicht geöffnet werden.",
  "Impossibile aprire il pagamento."
 ],
 [
  "← Voltar à minha MiniPage salva",
  "← Back to my saved MiniPage",
  "← Volver a mi MiniPage guardada",
  "← Retour à ma MiniPage enregistrée",
  "← Zurück zu meiner gespeicherten MiniPage",
  "← Torna alla MiniPage salvata"
 ],
 [
  "Escolha seu plano MiniPage Pro",
  "Choose your MiniPage Pro plan",
  "Elige tu plan MiniPage Pro",
  "Choisissez votre formule MiniPage Pro",
  "Wähle deinen MiniPage Pro Tarif",
  "Scegli il tuo piano MiniPage Pro"
 ],
 [
  "Confirme sua assinatura",
  "Confirm your subscription",
  "Confirma tu suscripción",
  "Confirmez votre abonnement",
  "Bestätige dein Abo",
  "Conferma il tuo abbonamento"
 ],
 [
  "Confirme sua assinatura",
  "Confirm your subscription",
  "Confirma tu suscripción",
  "Confirmez votre abonnement",
  "Bestätige dein Abo",
  "Conferma il tuo abbonamento"
 ],
 [
  "Sua MiniPage está salva. Escolha a modalidade e o plano; a assinatura só será ativada depois da confirmação do pagamento.",
  "Your MiniPage is saved. Your subscription activates only after payment confirmation.",
  "Tu MiniPage está guardada. La suscripción se activa solo tras confirmar el pago.",
  "Votre MiniPage est enregistrée. L’abonnement sera activé après confirmation du paiement.",
  "Deine MiniPage ist gespeichert. Das Abo wird erst nach bestätigter Zahlung aktiviert.",
  "La MiniPage è salvata. L’abbonamento si attiva solo dopo la conferma del pagamento."
 ],
 [
  "Como deseja contratar?",
  "How would you like to subscribe?",
  "¿Cómo deseas suscribirte?",
  "Comment souhaitez-vous vous abonner ?",
  "Wie möchtest du abonnieren?",
  "Come vuoi abbonarti?"
 ],
 [
  "🇧🇷 Brasil · R$",
  "🇧🇷 Brazil · R$",
  "🇧🇷 Brasil · R$",
  "🇧🇷 Brésil · R$",
  "🇧🇷 Brasilien · R$",
  "🇧🇷 Brasile · R$"
 ],
 [
  "🌍 Internacional · US$",
  "🌍 International · US$",
  "🌍 Internacional · US$",
  "🌍 International · US$",
  "🌍 International · US$",
  "🌍 Internazionale · US$"
 ],
 [
  "Os planos brasileiros são cobrados em reais pela EBANX, assim que a integração estiver disponível.",
  "Brazilian plans use BRL once payments are available.",
  "Los planes brasileños se cobran en BRL cuando esté disponible el pago.",
  "Les formules brésiliennes sont en BRL dès disponibilité du paiement.",
  "Brasilianische Tarife werden in BRL abgerechnet, sobald verfügbar.",
  "I piani brasiliani sono in BRL quando il pagamento sarà disponibile."
 ],
 [
  "Um único preço internacional em dólares. Você informará o país e o endereço verdadeiro de faturamento diretamente na Stripe. A Stripe não altera o preço em US$ conforme o país.",
  "One international USD price. Enter your actual billing country and address at checkout.",
  "Un precio internacional en USD. Indica tu país y dirección real de facturación al pagar.",
  "Un tarif international en USD. Indiquez votre pays et adresse réelle de facturation au paiement.",
  "Ein internationaler USD-Preis. Gib dein tatsächliches Rechnungsland und deine Adresse an.",
  "Un prezzo internazionale in USD. Inserisci il paese e l’indirizzo reali di fatturazione al pagamento."
 ],
 [
  "Cobrança",
  "Billing",
  "Facturación",
  "Facturation",
  "Abrechnung",
  "Fatturazione"
 ],
 [
  "Mensal",
  "Monthly",
  "Mensual",
  "Mensuel",
  "Monatlich",
  "Mensile"
 ],
 [
  "Anual",
  "Yearly",
  "Anual",
  "Annuel",
  "Jährlich",
  "Annuale"
 ],
 [
  "Você voltou sem concluir o pagamento. Seu plano não foi ativado; pode escolher novamente. A tentativa anterior será verificada antes de abrir outra sessão.",
  "Payment was not completed. Your plan was not activated. The previous attempt will be checked before another session opens.",
  "El pago no se completó. Tu plan no se activó. Se verificará el intento anterior antes de abrir otra sesión.",
  "Paiement non terminé. Votre formule n’a pas été activée. La tentative précédente sera vérifiée avant une nouvelle session.",
  "Zahlung nicht abgeschlossen. Dein Tarif wurde nicht aktiviert. Der vorherige Versuch wird vor einer neuen Sitzung geprüft.",
  "Pagamento non completato. Il piano non è attivo. Il tentativo precedente sarà verificato prima di una nuova sessione."
 ],
 [
  "Plano escolhido anteriormente",
  "Selected plan",
  "Plan elegido",
  "Formule choisie",
  "Gewählter Tarif",
  "Piano scelto"
 ],
 [
  "Consultando...",
  "Loading…",
  "Cargando…",
  "Chargement…",
  "Wird geladen…",
  "Caricamento…"
 ],
 [
  "Cobrança mensal",
  "Monthly billing",
  "Facturación mensual",
  "Facturation mensuelle",
  "Monatliche Abrechnung",
  "Fatturazione mensile"
 ],
 [
  "Cobrança anual",
  "Yearly billing",
  "Facturación anual",
  "Facturation annuelle",
  "Jährliche Abrechnung",
  "Fatturazione annuale"
 ],
 [
  "EBANX em implantação",
  "EBANX pending",
  "EBANX pendiente",
  "EBANX en attente",
  "EBANX ausstehend",
  "EBANX in preparazione"
 ],
 [
  "Abrindo Stripe...",
  "Opening checkout…",
  "Abriendo pago…",
  "Ouverture du paiement…",
  "Checkout wird geöffnet…",
  "Apertura pagamento…"
 ],
 [
  "Assinar",
  "Subscribe",
  "Suscribirse",
  "S’abonner",
  "Abonnieren",
  "Abbonati"
 ],
 [
  "A contratação internacional ainda está restrita nesta conta ou configuração. Os valores podem ser consultados, mas nenhuma cobrança será iniciada.",
  "International subscriptions are restricted for this account or configuration. No charge will be initiated.",
  "La suscripción internacional está restringida para esta cuenta o configuración. No se iniciará ningún cobro.",
  "Abonnement international restreint pour ce compte ou cette configuration. Aucun débit ne sera lancé.",
  "Internationale Abos sind für dieses Konto oder diese Konfiguration eingeschränkt. Keine Abbuchung wird gestartet.",
  "Abbonamento internazionale limitato per questo account o configurazione. Nessun addebito sarà avviato."
 ],
 [
  "Acesso Free permanece disponível para sua MiniPage salva. Contas com assinatura ou vínculo financeiro existente não podem gerar uma segunda assinatura neste fluxo.",
  "Free remains available. Accounts with an existing subscription or billing relationship cannot create a second subscription here.",
  "Free sigue disponible. Las cuentas con suscripción o vínculo de facturación no pueden crear otra suscripción aquí.",
  "Free reste disponible. Les comptes déjà liés à une facturation ne peuvent pas créer un deuxième abonnement ici.",
  "Free bleibt verfügbar. Konten mit bestehendem Abo oder Zahlungsverbindung können hier kein zweites Abo erstellen.",
  "Free resta disponibile. Gli account con abbonamento o rapporto di fatturazione non possono crearne un secondo qui."
 ],
 [
  "Continuar usando meu plano atual",
  "Keep my current plan",
  "Mantener mi plan actual",
  "Garder ma formule actuelle",
  "Aktuellen Tarif behalten",
  "Mantieni il piano attuale"
 ],
 [
  "Links, vídeo, destaques, Spotify e presença profissional.",
  "Links, videos, highlights, Spotify and professional presence.",
  "Enlaces, vídeos, destacados, Spotify y presencia profesional.",
  "Liens, vidéos, contenus à la une, Spotify et présence professionnelle.",
  "Links, Videos, Highlights, Spotify und professioneller Auftritt.",
  "Link, video, contenuti in evidenza, Spotify e presenza professionale."
 ],
 [
  "Tudo do MiniPage, com agendamentos e serviços.",
  "Everything in MiniPage, plus bookings and services.",
  "Todo MiniPage, más reservas y servicios.",
  "Tout MiniPage, plus rendez-vous et services.",
  "Alles aus MiniPage, plus Termine und Leistungen.",
  "Tutto MiniPage, più appuntamenti e servizi."
 ],
 [
  "Tudo do Agenda, com catálogo e links para vendas externas.",
  "Everything in Agenda, plus catalog and external sales links.",
  "Todo Agenda, más catálogo y enlaces de venta externos.",
  "Tout Agenda, plus catalogue et liens de vente externes.",
  "Alles aus Agenda, plus Katalog und externe Verkaufslinks.",
  "Tutto Agenda, più catalogo e link di vendita esterni."
 ],
 [
  "Tudo do Loja, com gestão de clientes, financeiro e relatórios.",
  "Everything in Store, plus customer management, finances and reports.",
  "Todo Tienda, más gestión de clientes, finanzas e informes.",
  "Tout Boutique, plus gestion clients, finances et rapports.",
  "Alles aus Shop, plus Kundenverwaltung, Finanzen und Berichte.",
  "Tutto Store, più gestione clienti, finanze e report."
 ],
 [
  "Links, vídeo, destaques, Spotify e presença profissional.",
  "Links, videos, highlights, Spotify and professional presence.",
  "Enlaces, vídeos, destacados, Spotify y presencia profesional.",
  "Liens, vidéos, contenus à la une, Spotify et présence professionnelle.",
  "Links, Videos, Highlights, Spotify und professioneller Auftritt.",
  "Link, video, contenuti in evidenza, Spotify e presenza professionale."
 ],
 [
  "Tudo do MiniPage, com agendamentos e serviços.",
  "Everything in MiniPage, plus bookings and services.",
  "Todo MiniPage, más reservas y servicios.",
  "Tout MiniPage, plus rendez-vous et services.",
  "Alles aus MiniPage, plus Termine und Leistungen.",
  "Tutto MiniPage, più appuntamenti e servizi."
 ],
 [
  "Tudo do Agenda, com catálogo e links para vendas externas.",
  "Everything in Agenda, plus catalog and external sales links.",
  "Todo Agenda, más catálogo y enlaces de venta externos.",
  "Tout Agenda, plus catalogue et liens de vente externes.",
  "Alles aus Agenda, plus Katalog und externe Verkaufslinks.",
  "Tutto Agenda, più catalogo e link di vendita esterni."
 ],
 [
  "Tudo do Loja, com gestão de clientes, financeiro e relatórios.",
  "Everything in Store, plus customer management, finances and reports.",
  "Todo Tienda, más gestión de clientes, finanzas e informes.",
  "Tout Boutique, plus gestion clients, finances et rapports.",
  "Alles aus Shop, plus Kundenverwaltung, Finanzen und Berichte.",
  "Tutto Store, più gestione clienti, finanze e report."
 ],
 [
  "Pagamento brasileiro pela EBANX ainda não habilitado. Sua MiniPage foi salva no Free, sem cobrança.",
  "EBANX payments in Brazil are not yet available. Your page is saved on Free, with no charge.",
  "Los pagos en Brasil aún no están disponibles. Tu MiniPage se guardó en Free, sin cobro.",
  "Les paiements au Brésil ne sont pas disponibles. Votre MiniPage est enregistrée avec Free, sans frais.",
  "Zahlungen in Brasilien sind noch nicht verfügbar. Deine MiniPage ist kostenlos gespeichert.",
  "Pagamenti in Brasile non disponibili. La MiniPage è salvata con Free, senza costi."
 ],
 [
  "Continuar no Free — sem cobrança",
  "Continue with Free — no charge",
  "Continuar con Free — sin cobro",
  "Continuer avec Free — sans frais",
  "Mit Free fortfahren — kostenlos",
  "Continua con Free — senza costi"
 ],
 [
  "← Voltar aos planos",
  "← Back to plans",
  "← Volver a planes",
  "← Retour aux formules",
  "← Zurück zu Tarifen",
  "← Torna ai piani"
 ],
 [
  "Sua página foi salva. Conclua o pagamento para ativar o plano escolhido. Até a confirmação, o Free permanece ativo.",
  "Your page is saved. Complete payment to activate your selected plan. Free remains active until confirmation.",
  "Tu página está guardada. Completa el pago para activar el plan. Free sigue activo hasta la confirmación.",
  "Votre page est enregistrée. Finalisez le paiement pour activer la formule. Free reste actif jusque-là.",
  "Deine Seite ist gespeichert. Schließe die Zahlung ab, um den Tarif zu aktivieren. Free bleibt bis dahin aktiv.",
  "La pagina è salvata. Completa il pagamento per attivare il piano. Free resta attivo fino alla conferma."
 ],
 [
  "Continuar para pagamento seguro",
  "Continue to secure checkout",
  "Continuar al pago seguro",
  "Continuer vers le paiement sécurisé",
  "Weiter zur sicheren Zahlung",
  "Continua al pagamento sicuro"
 ],
 [
  "Sua MiniPage foi salva no plano Free, sem cobrança.",
  "Your MiniPage is saved on Free, with no charge.",
  "Tu MiniPage se guardó en Free, sin cobro.",
  "Votre MiniPage est enregistrée avec Free, sans frais.",
  "Deine MiniPage ist kostenlos gespeichert.",
  "La MiniPage è salvata con Free, senza costi."
 ],
 [
  "Continuar com o Free — sem cobrança",
  "Continue with Free — no charge",
  "Continuar con Free — sin cobro",
  "Continuer avec Free — sans frais",
  "Mit Free fortfahren — kostenlos",
  "Continua con Free — senza costi"
 ],
 [
  "Esta conta ja possui um plano. A contratacao de outro plano deve ser tratada em Meu Plano para evitar cobranças duplicadas.",
  "This account already has a plan. Manage changes under My Plan to prevent duplicate billing.",
  "Esta cuenta ya tiene un plan. Gestiona cambios en Mi plan para evitar cobros duplicados.",
  "Ce compte a déjà une formule. Gérez les changements dans Ma formule pour éviter les doublons.",
  "Dieses Konto hat bereits einen Tarif. Änderungen unter Mein Tarif verwalten, um Doppelzahlungen zu vermeiden.",
  "Questo account ha già un piano. Gestisci le modifiche in Il mio piano per evitare addebiti doppi."
 ],
 [
  "Ir para Meu Plano",
  "Go to My Plan",
  "Ir a Mi plan",
  "Accéder à Ma formule",
  "Zu Mein Tarif",
  "Vai a Il mio piano"
 ],
 [
  "← Retornar aos planos",
  "← Back to plans",
  "← Volver a planes",
  "← Retour aux formules",
  "← Zurück zu Tarifen",
  "← Torna ai piani"
 ],
 [
  "Assinatura recorrente: o valor indicado é cobrado a cada período selecionado até o cancelamento. Consulte as condições antes de assinar.",
  "Recurring subscription: the displayed amount is charged each selected billing period until cancellation. Review the terms before subscribing.",
  "Suscripción recurrente: se cobra el importe indicado en cada período hasta la cancelación. Consulta las condiciones antes de suscribirte.",
  "Abonnement récurrent : le montant indiqué est facturé à chaque période jusqu’à résiliation. Consultez les conditions avant de vous abonner.",
  "Wiederkehrendes Abo: Der angezeigte Betrag wird bis zur Kündigung je Abrechnungszeitraum berechnet. Prüfe vor dem Abschluss die Bedingungen.",
  "Abbonamento ricorrente: l’importo indicato viene addebitato a ogni periodo fino alla disdetta. Consulta le condizioni prima di abbonarti."
 ],
 [
  "Termos de uso",
  "Terms of use",
  "Términos de uso",
  "Conditions d’utilisation",
  "Nutzungsbedingungen",
  "Termini di utilizzo"
 ],
 [
  "Privacidade",
  "Privacy",
  "Privacidad",
  "Confidentialité",
  "Datenschutz",
  "Privacy"
 ],
 [
  "Reembolso",
  "Refund policy",
  "Reembolsos",
  "Remboursements",
  "Erstattungen",
  "Rimborsi"
 ],
 [
  "Loja",
  "Store",
  "Tienda",
  "Boutique",
  "Shop",
  "Negozio"
 ],
 [
  "Envie uma imagem JPG, PNG ou WEBP.",
  "Upload a JPG, PNG or WEBP image.",
  "Sube una imagen JPG, PNG o WEBP.",
  "Importez une image JPG, PNG ou WEBP.",
  "Lade ein JPG-, PNG- oder WEBP-Bild hoch.",
  "Carica un’immagine JPG, PNG o WEBP."
 ],
 [
  "A imagem deve ter no máximo 5MB.",
  "Image must be at most 5 MB.",
  "La imagen debe tener un máximo de 5 MB.",
  "L’image ne doit pas dépasser 5 Mo.",
  "Das Bild darf höchstens 5 MB groß sein.",
  "L’immagine deve essere al massimo di 5 MB."
 ],
 [
  "Nome e link são obrigatórios.",
  "Name and link are required.",
  "El nombre y el enlace son obligatorios.",
  "Le nom et le lien sont obligatoires.",
  "Name und Link sind erforderlich.",
  "Nome e link sono obbligatori."
 ],
 [
  "Aguarde a verificação do endereço ou escolha outra opção.",
  "Wait for the address check or choose another option.",
  "Espera la verificación de la dirección o elige otra opción.",
  "Attendez la vérification de l’adresse ou choisissez une autre option.",
  "Warte auf die Adressprüfung oder wähle eine andere Option.",
  "Attendi la verifica dell’indirizzo o scegli un’altra opzione."
 ],
 [
  "Assinaturas existentes são preservadas; mudanças devem ser tratadas pelo suporte.",
  "Existing subscriptions are preserved; contact support to make changes.",
  "Las suscripciones existentes se conservan; contacta con soporte para cambios.",
  "Les abonnements existants sont conservés ; contactez le support pour les modifier.",
  "Bestehende Abos bleiben erhalten; wende dich für Änderungen an den Support.",
  "Gli abbonamenti esistenti restano invariati; contatta il supporto per modifiche."
 ],
 [
  "A contratação do plano escolhido depende da confirmação do pagamento.",
  "Your selected plan requires payment confirmation.",
  "El plan elegido requiere confirmación del pago.",
  "La formule choisie nécessite la confirmation du paiement.",
  "Der gewählte Tarif erfordert eine Zahlungsbestätigung.",
  "Il piano scelto richiede la conferma del pagamento."
 ]
]
export function textoCheckout(idioma: string, indice: number): string {
 return textos[indice][Math.max(0, idiomas.indexOf(idioma))]
}
