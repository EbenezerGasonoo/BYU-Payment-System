/**
 * West Africa Lightweight i18n Translation Dictionary
 * Languages: English (en) & French (fr)
 */

export const translations = {
  en: {
    welcome: "Akwaaba / Welcome to Pathway Pay",
    subtitle: "Instant Virtual USD Cards for BYU Pathway Students across West Africa",
    requestCard: "Request Virtual Card",
    trackStatus: "Track Payment Status",
    myDashboard: "Student Dashboard",
    register: "Register Account",
    byuId: "BYU Student ID",
    email: "Pathway Email",
    phone: "Mobile Phone",
    country: "Country",
    currency: "Currency",
    usdAmount: "USD Amount",
    processingFee: "Processing Fee (5%)",
    totalPayable: "Total Payable",
    selectPaymentMethod: "Select Payment Gateway",
    momoHubtel: "Mobile Money (Ghana Hubtel)",
    paystack: "Paystack (Multi-Country Cards, MoMo, Bank Transfer)",
    flutterwave: "Flutterwave (West Africa Multi-Currency)",
    wave: "Wave Mobile Money (Francophone Africa)",
    cardDetails: "Virtual Card Details",
    cardNumber: "Card Number",
    expiry: "Expires",
    cvv: "CVV",
    cardholder: "Cardholder Name",
    copyCard: "Copy Card Details",
    cardCopied: "Card details copied to clipboard!",
    freezeCard: "Freeze Card",
    unfreezeCard: "Unfreeze Card",
    cardStatusActive: "ACTIVE",
    cardStatusFrozen: "FROZEN",
    payNow: "Proceed to Payment",
    calculatingRates: "Fetching real-time exchange rates...",
    liveRate: "Live Exchange Rate",
    verifiedStudent: "Verified Student",
    adminPortal: "Admin Portal",
    chatSupport: "Live Chat Support"
  },
  fr: {
    welcome: "Bienvenue sur Pathway Pay",
    subtitle: "Cartes USD Virtuelles Instantanées pour les Étudiants BYU Pathway en Afrique de l'Ouest",
    requestCard: "Demander une Carte Virtuelle",
    trackStatus: "Suivre le Statut du Paiement",
    myDashboard: "Tableau de Bord Étudiant",
    register: "Créer un Compte",
    byuId: "Identifiant Étudiant BYU",
    email: "Email Pathway",
    phone: "Téléphone Mobile",
    country: "Pays",
    currency: "Devise",
    usdAmount: "Montant USD",
    processingFee: "Frais de Traitement (5%)",
    totalPayable: "Total à Payer",
    selectPaymentMethod: "Sélectionnez le Mode de Paiement",
    momoHubtel: "Mobile Money (Ghana Hubtel)",
    paystack: "Paystack (Cartes, MoMo, Virement - Multi-Pays)",
    flutterwave: "Flutterwave (Afrique de l'Ouest Multi-Devises)",
    wave: "Wave Mobile Money (Afrique Francophone)",
    cardDetails: "Détails de la Carte Virtuelle",
    cardNumber: "Numéro de Carte",
    expiry: "Expiration",
    cvv: "CVV",
    cardholder: "Nom du Titulaire",
    copyCard: "Copier les Détails",
    cardCopied: "Détails de la carte copié dans le presse-papiers!",
    freezeCard: "Geler la Carte",
    unfreezeCard: "Dégeler la Carte",
    cardStatusActive: "ACTIVE",
    cardStatusFrozen: "GELÉE",
    payNow: "Procéder au Paiement",
    calculatingRates: "Calcul des taux de change en temps réel...",
    liveRate: "Taux de Change en Direct",
    verifiedStudent: "Étudiant Vérifié",
    adminPortal: "Portail Admin",
    chatSupport: "Assistance en Direct"
  }
};

export function getTranslation(lang = 'en', key) {
  const dictionary = translations[lang] || translations.en;
  return dictionary[key] || translations.en[key] || key;
}
