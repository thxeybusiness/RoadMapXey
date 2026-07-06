import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Garde serveur : à utiliser dans chaque page/action protégée.
// Le proxy.ts fait la redirection rapide, mais la vraie vérification
// de session se fait toujours ici, côté serveur.
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
}
