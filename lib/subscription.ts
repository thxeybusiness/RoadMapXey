import { prisma } from "@/lib/prisma";
import { hasUnlimitedAccess } from "@/lib/grades";
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
