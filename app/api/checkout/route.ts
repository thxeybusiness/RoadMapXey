import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";
import { getBaseUrl } from "@/lib/env";

// Crée une session Stripe Checkout pour l'utilisateur connecté.
// Le priceId vient du dashboard Stripe (jamais de montant en dur ici).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "priceId invalide" }, { status: 400 });
  }

  try {
    // Réutilise le customer Stripe existant si l'utilisateur en a déjà un.
    const existing = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: parsed.data.priceId, quantity: 1 }],
      success_url: `${getBaseUrl()}/dashboard?success=true`,
      cancel_url: `${getBaseUrl()}/pricing`,
      client_reference_id: session.user.id,
      customer: existing?.stripeCustomerId || undefined,
      customer_email: existing ? undefined : session.user.email ?? undefined,
    });

    return Response.json({ url: checkout.url });
  } catch (error) {
    console.error("[checkout]", error);
    return Response.json(
      { error: "Impossible de créer la session de paiement" },
      { status: 500 }
    );
  }
}
