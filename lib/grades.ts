// Grades à accès illimité (contournent les limites du plan gratuit et sont
// traités comme premium côté serveur). Chaque grade a sa liste d'emails :
// pour en attribuer un à un nouveau compte, ajouter simplement son email.

export type Grade = "founder" | "vip";

const GRADE_EMAILS: Record<Grade, Set<string>> = {
  founder: new Set(["thxeybusiness@gmail.com"]),
  // VIP : accès illimité, attribuable à plusieurs comptes.
  vip: new Set(["shanalucas.pro@gmail.com"]),
};

// Ordre de priorité si un email figure dans plusieurs grades.
const GRADE_PRIORITY: Grade[] = ["founder", "vip"];

export const GRADE_LABEL: Record<Grade, string> = {
  founder: "Fondateur",
  vip: "VIP",
};

export function gradeOf(email?: string | null): Grade | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  for (const grade of GRADE_PRIORITY) {
    if (GRADE_EMAILS[grade].has(normalized)) return grade;
  }
  return null;
}

export function hasUnlimitedAccess(email?: string | null): boolean {
  return gradeOf(email) !== null;
}
