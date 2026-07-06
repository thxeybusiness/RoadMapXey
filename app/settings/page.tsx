import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/subscription";
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
  const { userId } = await requireUser();

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, tenant: true },
    }),
    getUserPlan(userId),
  ]);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-zinc-500">Nom :</span> {user.name ?? "—"}
          </p>
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
            <Badge variant={plan === "premium" ? "default" : "secondary"}>
              {plan === "premium" ? "Premium" : "Gratuit"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {plan === "premium"
              ? "Gérez votre abonnement, votre moyen de paiement et vos factures — ou annulez à tout moment."
              : "Vous êtes sur le plan gratuit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.subscription ? (
            <BillingPortalButton />
          ) : (
            <Button asChild>
              <Link href="/pricing">Passer en Premium</Link>
            </Button>
          )}
        </CardContent>
      </Card>

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
