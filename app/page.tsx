import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ListChecks,
  Map,
  Network,
  Share2,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Cartes « avantages » — même DA que le dashboard : barre d'accent colorée,
// pastille d'icône, entrée en fondu échelonnée et élévation au survol.
const features = [
  {
    Icon: Zap,
    title: "Prêt en 2 minutes",
    description:
      "Inscrivez-vous, créez votre première roadmap, ajoutez vos étapes. C'est tout.",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    bar: "from-emerald-400 to-teal-500",
  },
  {
    Icon: ListChecks,
    title: "Roadmaps claires",
    description:
      "Une timeline lisible, du jour à l'année, avec des barres colorées. Sans usine à gaz.",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    bar: "from-sky-400 to-cyan-500",
  },
  {
    Icon: Share2,
    title: "Pensé pour l'équipe",
    description:
      "Un espace par équipe : tout le monde voit la même roadmap, toujours à jour.",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    bar: "from-amber-400 to-orange-500",
  },
];

// Les deux formats de roadmap, avec les couleurs de leur type dans l'app.
const types = [
  {
    Icon: Map,
    label: "Tableau",
    description:
      "Une timeline produit du jour à l'année : barres proportionnelles, statuts et planning journalier.",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
    bar: "from-orange-500 to-amber-600",
  },
  {
    Icon: Network,
    label: "Canvas",
    description:
      "Des blocs reliables avec objectifs cochables qui passent au vert une fois complétés.",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    bar: "from-violet-400 to-fuchsia-500",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="rb-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-16 text-center text-white shadow-lg shadow-emerald-600/25 sm:px-10 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.13]">
          <Map className="rb-float absolute left-10 top-8 h-28 w-28" />
          <Network
            className="rb-float absolute bottom-6 left-40 h-16 w-16"
            style={{ animationDelay: "1.2s" }}
          />
          <Table2
            className="rb-float absolute right-12 top-10 h-24 w-24"
            style={{ animationDelay: "0.6s" }}
          />
          <ListChecks
            className="rb-float absolute bottom-8 right-40 h-14 w-14"
            style={{ animationDelay: "1.8s" }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-inset ring-white/25 backdrop-blur">
            <Sparkles className="h-4 w-4" /> Roadmaps produit, simplement
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Votre roadmap produit, enfin lisible.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-emerald-50/90">
            RoadMap Business vous aide à planifier, prioriser et partager les
            chantiers de votre produit — sans tableur ni outil hors de prix.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              <Link href="/signup">
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/50 bg-transparent text-white hover:bg-white/15 dark:border-white/50 dark:hover:bg-white/15"
            >
              <Link href="/pricing">Voir les forfaits</Link>
            </Button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-sm text-emerald-50/80">
            <CheckCircle2 className="h-4 w-4" />
            Gratuit pour démarrer, sans carte bancaire
          </p>
        </div>
      </section>

      {/* ── Avantages ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tout ce qu&apos;il faut, rien de trop
          </h2>
          <p className="mt-2 text-zinc-500">
            La clarté d&apos;un outil pro, la simplicité d&apos;une feuille
            blanche.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="rb-reveal group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-emerald-950/60 dark:bg-zinc-950"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div
                className={`h-1.5 w-full bg-gradient-to-r ${f.bar} origin-left transition-transform duration-300 group-hover:scale-y-[1.6]`}
              />
              <div className="p-6">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${f.chip}`}
                >
                  <f.Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Les deux formats ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Deux formats, une seule clarté
          </h2>
          <p className="mt-2 text-zinc-500">
            Choisissez la vue qui colle à votre façon de penser.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {types.map((t, i) => (
            <div
              key={t.label}
              className="rb-reveal group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-emerald-950/60 dark:bg-zinc-950"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div
                className={`h-1.5 w-full bg-gradient-to-r ${t.bar} origin-left transition-transform duration-300 group-hover:scale-y-[1.6]`}
              />
              <div className="flex items-start gap-4 p-6">
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${t.chip}`}
                >
                  <t.Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {t.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {t.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="rb-gradient relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-6 py-14 text-center text-white shadow-lg shadow-emerald-700/25">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Prêt à clarifier votre roadmap&nbsp;?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-emerald-50/90">
          Créez votre espace en quelques secondes. Gratuit, sans carte bancaire.
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            <Link href="/signup">
              Créer mon espace gratuit <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
