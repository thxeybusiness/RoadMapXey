import { prisma } from "@/lib/prisma";
import { hasUnlimitedAccess } from "@/lib/grades";
import { tierFromPriceId, type Tier } from "@/lib/plans";
import type { Plan } from "@/types";

// Limites du plan gratuit — l'accès premium est TOUJOURS vérifié côté
// serveur (ici), jamais uniquement côté client.
export const FREE_LIMITS = {
  maxRoadmaps: 1,
  maxItemsPerRoadmap: 10,
} as const;

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, subscription: true },
  });

  // Grades à accès illimité (fondateur, VIP…), indépendamment de tout abonnement.
  if (hasUnlimitedAccess(user?.email)) return "premium";

  const subscription = user?.subscription;
  if (
    subscription &&
    subscription.plan === "premium" &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date())
  ) {
    return "premium";
  }
  return "free";
}

export async function isPremium(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "premium";
}

// Niveau de forfait pour l'AFFICHAGE (Gratuit / Pro / Business / Premium).
// Basé sur l'abonnement Stripe uniquement — les comptes à grade affichent
// leur badge de grade séparément.
export async function getBillingTier(userId: string): Promise<Tier> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const active =
    sub &&
    sub.plan === "premium" &&
    (sub.status === "active" || sub.status === "trialing") &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());
  if (!active) return "free";
  return tierFromPriceId(sub!.stripePriceId) ?? "premium";
}
