import { prisma } from "@/lib/prisma";
import { isValidUsername, slugifyUsername } from "@/lib/username";

// Génère un pseudo unique à partir d'une base (ajoute un suffixe si pris).
export async function generateUniqueUsername(base: string): Promise<string> {
  const root = slugifyUsername(base);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = attempt === 0 ? root : `${root}${attempt}`.slice(0, 20);
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${root}${Date.now().toString(36)}`.slice(0, 20);
}

// Assigne un pseudo si le compte n'en a pas encore (comptes existants).
export async function ensureUsername(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true, email: true },
  });
  if (!user) return null;
  if (user.username) return user.username;

  const username = await generateUniqueUsername(user.name || user.email.split("@")[0]);
  await prisma.user.update({ where: { id: userId }, data: { username } });
  return username;
}

// Change le pseudo choisi par l'utilisateur (validé + unique).
export async function setUsername(userId: string, raw: string) {
  const username = raw.trim().toLowerCase();
  if (!isValidUsername(username)) {
    throw new Error(
      "3 à 20 caractères : lettres minuscules, chiffres et tiret bas uniquement"
    );
  }
  const taken = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) throw new Error("Ce nom d'utilisateur est déjà pris");

  await prisma.user.update({ where: { id: userId }, data: { username } });
  return username;
}
