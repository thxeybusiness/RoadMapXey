// Noms d'utilisateur : 3–20 caractères, minuscules, chiffres, tiret bas.
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_REGEX.test(value);
}

// Base d'un pseudo à partir d'un nom ou d'un email (sans accents, nettoyé).
export function slugifyUsername(source: string): string {
  const base = source
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  if (base.length >= 3) return base;
  return (base + "user").slice(0, 20);
}
