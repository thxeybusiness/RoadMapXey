import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";

// Aperçu d'un changement de forfait : calcule le montant exact facturé
// immédiatement au prorata, SANS rien modifier. Sert à afficher une
// confirmation avant tout débit.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "priceId invalide" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  // Pas d'abonnement actif : première souscription → passage par Checkout,
  // pas d'aperçu de prorata.
  if (
    !sub?.stripeSubscriptionId ||
    (sub.status !== "active" && sub.status !== "trialing")
  ) {
    return Response.json({ needsCheckout: true });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      sub.stripeSubscriptionId
    );
    const item = subscription.items.data[0];
    if (!item) throw new Error("Abonnement sans article");

    if (item.price.id === parsed.data.priceId) {
      return Response.json(
        { error: "Vous êtes déjà sur ce forfait" },
        { status: 400 }
      );
    }

    const preview = await stripe.invoices.createPreview({
      customer: sub.stripeCustomerId,
      subscription: subscription.id,
      subscription_details: {
        items: [{ id: item.id, price: parsed.data.priceId }],
        proration_behavior: "always_invoice",
      },
    });

    return Response.json({
      amountDue: preview.amount_due, // en centimes, à débiter maintenant
      currency: preview.currency,
    });
  } catch (error) {
    console.error("[checkout/preview]", error);
    return Response.json(
      { error: "Impossible de calculer le montant" },
      { status: 500 }
    );
  }
}
