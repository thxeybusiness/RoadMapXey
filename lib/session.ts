import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Garde serveur : à utiliser dans chaque page/action protégée.
// Le proxy.ts fait la redirection rapide, mais la vraie vérification
// de session se fait toujours ici, côté serveur.
// Le tenantId est relu en base : rejoindre/quitter une équipe prend
// effet immédiatement, sans devoir se reconnecter.
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, email: true, name: true },
  });
  if (!user) redirect("/login");

  return {
    userId: session.user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name ?? "",
  };
}
