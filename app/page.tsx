import Link from "next/link";
import { CheckCircle2, Map, Share2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Map,
    title: "Roadmaps claires",
    description:
      "Organisez vos chantiers par trimestre et par statut, sans usine à gaz.",
  },
  {
    icon: Zap,
    title: "Prêt en 2 minutes",
    description:
      "Inscrivez-vous, créez votre première roadmap, ajoutez vos items. C'est tout.",
  },
  {
    icon: Share2,
    title: "Pensé pour l'équipe",
    description:
      "Un espace par équipe : tout le monde voit la même roadmap, à jour.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Votre roadmap produit, enfin lisible.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
          RoadMapXey vous aide à planifier, prioriser et partager les chantiers
          de votre produit — sans tableur ni outil hors de prix.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Commencer gratuitement</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">Voir les tarifs</Link>
          </Button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1 text-sm text-zinc-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Gratuit pour démarrer, sans carte bancaire
        </p>
      </section>

      <section className="grid gap-6 pb-24 sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="h-8 w-8" />
              <CardTitle className="mt-2">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500">
              {feature.description}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
