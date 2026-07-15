import { prisma } from "@/lib/prisma";

// Limitation de débit adossée à la base (fiable en serverless) : compte les
// tentatives récentes pour une clé sur une fenêtre glissante.

export async function tooManyAttempts(
  identifier: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMs);
    const count = await prisma.loginAttempt.count({
      where: { identifier, createdAt: { gte: since } },
    });
    return count >= max;
  } catch {
    // En cas d'erreur BDD, on n'empêche pas la connexion (fail-open contrôlé).
    return false;
  }
}

export async function recordAttempt(identifier: string): Promise<void> {
  try {
    await prisma.loginAttempt.create({ data: { identifier } });
    // Nettoyage opportuniste des vieilles lignes (1 fois sur ~20).
    if (Math.random() < 0.05) {
      await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
    }
  } catch {
    // best-effort
  }
}
