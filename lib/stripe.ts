import Stripe from "stripe";

// Client Stripe côté serveur uniquement — la clé secrète ne doit
// jamais être importée dans un composant client.
// (Les clés STRIPE_* sont lues au runtime depuis les variables Vercel.)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
});
