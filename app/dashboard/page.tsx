import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserPlan, FREE_LIMITS } from "@/lib/subscription";
import { isFounderEmail } from "@/lib/founders";
import { FounderBadge } from "@/components/founder-badge";
import { listRoadmaps } from "@/server/roadmaps";
import { RoadmapForm } from "@/components/roadmap-form";
import { DeleteRoadmapButton } from "@/components/delete-roadmap-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  // Vérification serveur systématique — le proxy n'est qu'une garde UX.
  const { userId, tenantId, name, email } = await requireUser();
  const [plan, roadmaps, params] = await Promise.all([
    getUserPlan(userId),
    listRoadmaps(tenantId),
    searchParams,
  ]);
  const founder = isFounderEmail(email);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      {params.success === "true" && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          Paiement réussi 🎉 Votre compte passe en Premium dès que Stripe
          confirme le paiement (quelques secondes).
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bonjour {name || "👋"}</h1>
          <p className="text-zinc-500">Vos roadmaps produit</p>
        </div>
        {founder ? (
          <FounderBadge />
        ) : (
          <Badge variant={plan === "premium" ? "default" : "secondary"}>
            {plan === "premium" ? "Premium" : "Gratuit"}
          </Badge>
        )}
      </div>

      {!founder && plan === "free" && roadmaps.length >= FREE_LIMITS.maxRoadmaps && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <span>
            Limite du plan gratuit atteinte ({FREE_LIMITS.maxRoadmaps} roadmap).
          </span>
          <Button asChild size="sm">
            <Link href="/pricing">Passer en Premium</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {roadmaps.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucune roadmap pour l&apos;instant</CardTitle>
                <CardDescription>
                  Créez votre première roadmap avec le formulaire ci-contre.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            roadmaps.map((roadmap) => (
              <Card key={roadmap.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/dashboard/${roadmap.id}`} className="min-w-0">
                      <CardTitle className="hover:underline">
                        {roadmap.title}
                      </CardTitle>
                      <CardDescription className="mt-1.5">
                        {roadmap.description || "Sans description"} ·{" "}
                        {roadmap._count.items} étape(s)
                      </CardDescription>
                    </Link>
                    <DeleteRoadmapButton roadmapId={roadmap.id} />
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
        <RoadmapForm />
      </div>
    </div>
  );
}
