// Endpoint de diagnostic TEMPORAIRE — ne révèle jamais les valeurs secrètes,
// seulement leur présence, leur préfixe (public) et leur longueur. À supprimer
// une fois la configuration Stripe validée.
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const PRICES = {
  pro: "price_1TqIHeRwEaCwXVSNTqsOwlIG",
  business: "price_1TqIIDRwEaCwXVSNkzdwZW7I",
};

async function checkPrice(id: string) {
  try {
    const p = await stripe.prices.retrieve(id);
    return {
      ok: true,
      active: p.active,
      amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval ?? null,
      livemode: p.livemode,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  const s = process.env.STRIPE_SECRET_KEY;
  const w = process.env.STRIPE_WEBHOOK_SECRET;
  const [pro, business] = await Promise.all([
    checkPrice(PRICES.pro),
    checkPrice(PRICES.business),
  ]);
  return Response.json({
    hasSecret: !!s,
    secretPrefix: s ? s.slice(0, 8) : null, // "sk_test_" — non secret
    hasWebhook: !!w,
    webhookPrefix: w ? w.slice(0, 6) : null, // "whsec_" — non secret
    priceCheck: { pro, business },
    marker: "diag-v2",
  });
}
