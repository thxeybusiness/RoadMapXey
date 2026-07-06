import Stripe from "stripe";

// Client Stripe côté serveur uniquement — la clé secrète ne doit
// jamais être importée dans un composant client.
// Initialisation PARESSEUSE : sur Vercel, les variables « Sensitive »
// sont vides pendant le build (next build évalue les modules des routes
// API) et ne sont lisibles qu'au runtime. On ne construit donc le client
// qu'au premier appel, avec un repli `||` qui attrape aussi la chaîne vide.
let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      typescript: true,
    });
  }
  return client;
}

// Proxy conservant l'API `stripe.xxx` existante sans instancier au build.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const value = getStripe()[prop as keyof Stripe];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
