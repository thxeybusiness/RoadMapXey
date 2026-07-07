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

    // Changement de forfait : si un abonnement est déjà actif, on le MODIFIE
    // au lieu d'en créer un second. Stripe facture immédiatement la
    // différence au prorata du temps restant (et crédite en cas de downgrade).
    if (
      existing?.stripeSubscriptionId &&
      (existing.status === "active" || existing.status === "trialing")
    ) {
      const subscription = await stripe.subscriptions.retrieve(
        existing.stripeSubscriptionId
      );
      const item = subscription.items.data[0];
      if (!item) throw new Error("Abonnement Stripe sans article");

      if (item.price.id === parsed.data.priceId) {
        return Response.json(
          { error: "Vous êtes déjà sur ce forfait" },
          { status: 400 }
        );
      }

      await stripe.subscriptions.update(subscription.id, {
        items: [{ id: item.id, price: parsed.data.priceId }],
        proration_behavior: "always_invoice",
        payment_behavior: "error_if_incomplete",
      });

      return Response.json({ upgraded: true });
    }

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
