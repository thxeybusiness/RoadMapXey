// Comptes fondateurs : accès illimité à toutes les fonctionnalités et
// grade « Fondateur » affiché. Identifiés par email (insensible à la casse).
export const FOUNDER_EMAILS = new Set<string>(["thxeybusiness@gmail.com"]);

export function isFounderEmail(email?: string | null): boolean {
  return !!email && FOUNDER_EMAILS.has(email.trim().toLowerCase());
}
