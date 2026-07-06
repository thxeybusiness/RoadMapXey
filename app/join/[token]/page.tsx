import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getInvitationByToken } from "@/server/team";
import { JoinButton } from "@/components/join-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Rejoindre une équipe" };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation || invitation.acceptedAt) {
    return (
      <div className="flex justify-center px-4 py-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>
              Ce lien d&apos;invitation est expiré ou a déjà été utilisé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = await auth();
  // Pas connecté → login/inscription en revenant ensuite sur ce lien.
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/join/${token}`);
  }

  return (
    <div className="flex justify-center px-4 py-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Users className="h-6 w-6" />
          </span>
          <CardTitle className="mt-2">
            Rejoindre {invitation.tenant.name}
          </CardTitle>
          <CardDescription>
            Vous allez rejoindre cet espace d&apos;équipe et partager toutes ses
            roadmaps. Votre espace personnel actuel sera remplacé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinButton token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
