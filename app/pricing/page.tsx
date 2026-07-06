import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/checkout-button";
import { FREE_LIMITS } from "@/lib/subscription";

export const metadata: Metadata = { title: "Tarifs" };

export default function PricingPage() {
  // Le priceId vient du dashboard Stripe, exposé via une variable d'env
  // publique — jamais de montant codé en dur.
  const premiumPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM;

  return (
    <div className="mx-auto max-w-4xl px-4 py-24">
      <h1 className="text-center text-4xl font-bold">Tarifs simples</h1>
      <p className="mt-4 text-center text-zinc-500">
        Démarrez gratuitement, passez en Premium quand votre équipe grandit.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gratuit</CardTitle>
            <CardDescription>Pour découvrir RoadMapXey</CardDescription>
            <p className="text-4xl font-bold">
              0 € <span className="text-base font-normal text-zinc-500">/mois</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              `${FREE_LIMITS.maxRoadmaps} roadmap`,
              `${FREE_LIMITS.maxItemsPerRoadmap} items par roadmap`,
              "Statuts et trimestres",
            ].map((line) => (
              <p key={line} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> {line}
              </p>
            ))}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">Commencer gratuitement</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-zinc-900 dark:border-zinc-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Premium</CardTitle>
              <Badge>Populaire</Badge>
            </div>
            <CardDescription>Pour les équipes qui shippent</CardDescription>
            <p className="text-4xl font-bold">
              9 € <span className="text-base font-normal text-zinc-500">/mois</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              "Roadmaps illimitées",
              "Items illimités",
              "Support prioritaire",
              "Annulable à tout moment",
            ].map((line) => (
              <p key={line} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> {line}
              </p>
            ))}
          </CardContent>
          <CardFooter>
            {premiumPriceId ? (
              <CheckoutButton priceId={premiumPriceId}>
                Passer en Premium
              </CheckoutButton>
            ) : (
              <Button className="w-full" disabled>
                Bientôt disponible
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
