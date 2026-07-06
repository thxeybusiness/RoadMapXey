import { prisma } from "@/lib/prisma";
import type { Plan } from "@/types";

// Limites du plan gratuit — l'accès premium est TOUJOURS vérifié côté
// serveur (ici), jamais uniquement côté client.
export const FREE_LIMITS = {
  maxRoadmaps: 1,
  maxItemsPerRoadmap: 10,
} as const;

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

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
