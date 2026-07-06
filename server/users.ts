import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendWelcomeEmail } from "@/lib/email";
import type { SignupInput } from "@/lib/validations";

// Inscription : crée le Tenant + le User en DB (callback direct,
// pas besoin de webhook puisqu'on gère l'inscription nous-mêmes).
export async function registerUser(input: SignupInput) {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Un compte existe déjà avec cet email");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      passwordHash,
      tenant: { create: { name: `Espace de ${input.name}` } },
    },
  });

  await sendWelcomeEmail(email, input.name);
  return user;
}

// RGPD : suppression complète du compte et des données.
// Annule d'abord l'abonnement Stripe pour ne pas facturer un compte supprimé.
export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) return;

  if (user.subscription?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
    } catch (error) {
      // L'abonnement peut déjà être annulé côté Stripe — on log et on continue.
      console.error("[deleteAccount] annulation Stripe échouée", error);
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  // Si le tenant n'a plus d'utilisateurs, on supprime aussi ses données
  // (roadmaps incluses, via cascade).
  const remaining = await prisma.user.count({ where: { tenantId: user.tenantId } });
  if (remaining === 0) {
    await prisma.tenant.delete({ where: { id: user.tenantId } });
  }
}
