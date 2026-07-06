import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserPlan, isPremium } from "@/lib/subscription";
import { gradeOf, GRADE_LABEL } from "@/lib/grades";
import { getTeam } from "@/server/team";
import { GradeBadge } from "@/components/grade-badge";
import { TeamSection } from "@/components/team-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { DeleteAccountButton } from "@/components/delete-account-button";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { userId, tenantId } = await requireUser();

  const [user, plan, team, canInvite] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, tenant: true },
    }),
    getUserPlan(userId),
    getTeam(tenantId),
    isPremium(userId),
  ]);
  if (!user) return null;
  const grade = gradeOf(user.email);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        {grade && <GradeBadge grade={grade} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-zinc-500">Nom :</span> {user.name ?? "—"}
          </p>
          {grade && (
            <p>
              <span className="text-zinc-500">Grade :</span>{" "}
              <span className="font-semibold">
                {GRADE_LABEL[grade]} — accès illimité
              </span>
            </p>
          )}
          <p>
            <span className="text-zinc-500">Email :</span> {user.email}
          </p>
          <p>
            <span className="text-zinc-500">Espace :</span> {user.tenant.name}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Facturation
            {grade ? (
              <GradeBadge grade={grade} />
            ) : (
              <Badge variant={plan === "premium" ? "default" : "secondary"}>
                {plan === "premium" ? "Premium" : "Gratuit"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {grade
              ? `Compte ${GRADE_LABEL[grade]} : accès illimité à toutes les fonctionnalités, sans abonnement.`
              : plan === "premium"
                ? "Gérez votre abonnement, votre moyen de paiement et vos factures — ou annulez à tout moment."
                : "Vous êtes sur le plan gratuit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grade ? (
            <p className="text-sm text-zinc-500">
              Aucune facturation — vous disposez d&apos;un accès {GRADE_LABEL[grade]}.
            </p>
          ) : user.subscription ? (
            <BillingPortalButton />
          ) : (
            <Button asChild>
              <Link href="/pricing">Passer en Premium</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {team && (
        <TeamSection
          teamName={team.name}
          members={team.users}
          invitations={team.invitations.map((i) => ({ id: i.id, email: i.email }))}
          currentUserId={userId}
          canInvite={canInvite}
        />
      )}

      <Card className="border-red-300 dark:border-red-900">
        <CardHeader>
          <CardTitle>Zone dangereuse</CardTitle>
          <CardDescription>
            RGPD : supprimez votre compte et l&apos;intégralité de vos données.
            L&apos;abonnement en cours est annulé automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
