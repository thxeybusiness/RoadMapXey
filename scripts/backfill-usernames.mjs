// Attribue un nom d'utilisateur aux comptes qui n'en ont pas encore.
// Exécuté automatiquement au déploiement (après prisma db push).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(source) {
  const base = source
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return base.length >= 3 ? base : (base + "user").slice(0, 20);
}

async function uniqueUsername(base) {
  const root = slugify(base);
  for (let i = 0; i < 1000; i++) {
    const candidate = i === 0 ? root : `${root}${i}`.slice(0, 20);
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${root}${Date.now().toString(36)}`.slice(0, 20);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, name: true, email: true },
  });
  for (const u of users) {
    const username = await uniqueUsername(u.name || u.email.split("@")[0]);
    await prisma.user.update({ where: { id: u.id }, data: { username } });
    console.log(`[backfill] ${u.email} → @${username}`);
  }
  console.log(`[backfill] ${users.length} pseudo(s) attribué(s)`);

  // La feuille de calcul (type « test2 ») a été retirée : on bascule les
  // roadmaps historiques de ce type vers le tableau classique.
  const migrated = await prisma.roadmap.updateMany({
    where: { type: "test2" },
    data: { type: "board" },
  });
  if (migrated.count > 0) {
    console.log(`[backfill] ${migrated.count} feuille(s) de calcul → tableau`);
  }
}

main()
  .catch((e) => {
    console.error("[backfill] échec", e);
    process.exitCode = 0; // ne bloque pas le build
  })
  .finally(() => prisma.$disconnect());
