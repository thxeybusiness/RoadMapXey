import { createHash } from "crypto";

// URL publique de l'app : NEXT_PUBLIC_URL si définie, sinon le domaine de
// production fourni automatiquement par Vercel, sinon localhost (dev).
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

// Secret de session : AUTH_SECRET si définie (recommandé), sinon un secret
// stable dérivé de DATABASE_URL — jamais commité, propre à chaque
// environnement, et avec assez d'entropie (mot de passe DB aléatoire).
// Si les identifiants DB changent, les sessions sont simplement invalidées.
export function getAuthSecret(): string | undefined {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.DATABASE_URL) {
    return createHash("sha256")
      .update(`roadmapxey-auth:${process.env.DATABASE_URL}`)
      .digest("base64");
  }
  return undefined;
}
