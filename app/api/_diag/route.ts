// Endpoint de diagnostic TEMPORAIRE — ne révèle jamais les valeurs secrètes,
// seulement leur présence, leur préfixe (public) et leur longueur. À supprimer
// une fois la configuration Stripe validée.
export const dynamic = "force-dynamic";

export async function GET() {
  const s = process.env.STRIPE_SECRET_KEY;
  const w = process.env.STRIPE_WEBHOOK_SECRET;
  return Response.json({
    hasSecret: !!s,
    secretPrefix: s ? s.slice(0, 8) : null, // "sk_test_" — non secret
    secretLen: s ? s.length : 0,
    hasWebhook: !!w,
    webhookPrefix: w ? w.slice(0, 6) : null, // "whsec_" — non secret
    webhookLen: w ? w.length : 0,
    proPrice: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO ?? "(fallback code)",
    marker: "diag-v1",
  });
}
