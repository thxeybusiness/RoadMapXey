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
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Forfaits" };

export default function PricingPage() {
  // Les priceId viennent du dashboard Stripe, exposés via des variables
  // d'env publiques — jamais de montant codé en dur.
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
  const businessPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS;

  const plans = [
    {
      name: "Gratuit",
      price: "0 €",
      description: "Pour découvrir RoadMap Business",
      features: [
        `${FREE_LIMITS.maxRoadmaps} roadmap`,
        `${FREE_LIMITS.maxItemsPerRoadmap} étapes par roadmap`,
        "Vue Tableau (timeline jour → année)",
        "Planning journalier 30 min",
      ],
      cta: (
        <Button asChild variant="outline" className="w-full">
          <Link href="/signup">Commencer gratuitement</Link>
        </Button>
      ),
      highlighted: false,
    },
    {
      name: "Pro",
      price: "9 €",
      description: "Pour les créateurs qui shippent",
      features: [
        "Roadmaps illimitées",
        "Étapes illimitées",
        "Les 3 formats : Tableau, Canvas & Feuille de calcul",
        "Planning journalier 30 min",
        "Support par email",
      ],
      cta: proPriceId ? (
        <CheckoutButton priceId={proPriceId}>Passer en Pro</CheckoutButton>
      ) : (
        <Button variant="primary" className="w-full" disabled>
          Bientôt disponible
        </Button>
      ),
      highlighted: true,
    },
    {
      name: "Business",
      price: "24 €",
      description: "Pour les équipes qui pilotent ensemble",
      features: [
        "Tout le forfait Pro",
        "Espaces d'équipe partagés",
        "Rôles & grades personnalisés",
        "Export CSV & image",
        "Support prioritaire",
      ],
      cta: businessPriceId ? (
        <CheckoutButton priceId={businessPriceId}>
          Passer en Business
        </CheckoutButton>
      ) : (
        <Button className="w-full" disabled>
          Bientôt disponible
        </Button>
      ),
      highlighted: false,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <h1 className="text-center text-4xl font-bold">Nos forfaits</h1>
      <p className="mt-4 text-center text-zinc-500">
        Démarrez gratuitement, montez en gamme quand votre activité grandit.
        Sans engagement, annulable à tout moment.
      </p>

      <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex h-full flex-col",
              plan.highlighted &&
                "border-emerald-500 shadow-md ring-1 ring-emerald-500 dark:border-emerald-500"
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.highlighted && <Badge>Populaire</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-2 text-4xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-zinc-500">/mois</span>
              </p>
            </CardHeader>
            <CardContent className="flex-1 space-y-2.5 text-sm">
              {plan.features.map((line) => (
                <p key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {line}
                </p>
              ))}
            </CardContent>
            <CardFooter>{plan.cta}</CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
