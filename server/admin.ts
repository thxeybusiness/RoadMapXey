import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { gradeOf } from "@/lib/grades";

// Actions d'administration réservées au compte Fondateur. La vérification
// du grade est faite ICI (côté serveur), jamais uniquement dans l'UI.

// Repasse un compte en gratuit : annule son abonnement Stripe s'il y en a un
// et remet son enregistrement d'abonnement sur « free ». Idempotent.
export async function resetAccountToFree(
  callerEmail: string,
  targetEmail: string
): Promise<{ email: string; hadSubscription: boolean }> {
  if (gradeOf(callerEmail) !== "founder") {
    throw new Error("Action réservée au compte Fondateur");
  }

  const email = targetEmail.trim().toLowerCase();
  if (!email) throw new Error("Email requis");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });
  if (!user) throw new Error("Aucun compte avec cet email");

  const sub = user.subscription;
  if (sub?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (error) {
      // L'abonnement peut déjà être annulé côté Stripe — on log et on continue.
      console.error("[admin.resetAccountToFree] annulation Stripe", error);
    }
  }

  if (sub) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: "canceled", plan: "free", stripeSubscriptionId: null },
    });
  }

  return { email, hadSubscription: !!sub };
}
