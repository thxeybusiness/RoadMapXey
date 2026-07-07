// Tarifs Stripe et niveaux de forfait, partagés entre la page Forfaits,
// le webhook et l'affichage. Les IDs par défaut (mode Test) sont surchargés
// par les variables d'environnement si définies (bascule Live facile).

export const PRICE_IDS = {
  // Tarifs Live (production). Surchargeables par variable d'environnement.
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "price_1TqIHeRwEaCwXVSNTqsOwlIG",
  business:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS ||
    "price_1TqIIDRwEaCwXVSNkzdwZW7I",
} as const;

export type Tier = "free" | "pro" | "business" | "premium";

// « premium » = abonnement actif dont on ne reconnaît pas le tarif (repli).
export const TIER_LABEL: Record<Tier, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
  premium: "Premium",
};

// Résout le niveau à partir d'un priceId Stripe (null si non reconnu).
export function tierFromPriceId(priceId?: string | null): "pro" | "business" | null {
  if (!priceId) return null;
  if (priceId === PRICE_IDS.business) return "business";
  if (priceId === PRICE_IDS.pro) return "pro";
  return null;
}
