// Endpoint de diagnostic TEMPORAIRE (bascule Live) — ne révèle jamais les
// valeurs secrètes, seulement leur présence/préfixe et les métadonnées
// publiques des prix. À supprimer une fois le mode Live validé.
import { stripe } from "@/lib/stripe";
import { PRICE_IDS } from "@/lib/plans";

export const dynamic = "force-dynamic";

async function checkPrice(id: string) {
  try {
    const p = await stripe.prices.retrieve(id);
    return {
      ok: true,
      amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval ?? null,
      livemode: p.livemode,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function GET() {
  const s = process.env.STRIPE_SECRET_KEY;
  const w = process.env.STRIPE_WEBHOOK_SECRET;
  const [pro, business] = await Promise.all([
    checkPrice(PRICE_IDS.pro),
    checkPrice(PRICE_IDS.business),
  ]);
  return Response.json({
    hasSecret: !!s,
    secretPrefix: s ? s.slice(0, 8) : null, // "sk_live_" attendu en Live
    hasWebhook: !!w,
    webhookPrefix: w ? w.slice(0, 6) : null,
    priceCheck: { pro, business },
    marker: "diag-live",
  });
}
