import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Portail client Stripe : l'utilisateur peut y annuler son abonnement,
// changer de carte, télécharger ses factures.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!subscription) {
    return Response.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_URL}/settings`,
    });
    return Response.json({ url: portal.url });
  } catch (error) {
    console.error("[billing-portal]", error);
    return Response.json(
      { error: "Impossible d'ouvrir le portail de facturation" },
      { status: 500 }
    );
  }
}
