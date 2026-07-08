import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  ListChecks,
  Map,
  Network,
  Sparkles,
  StickyNote,
  Table2,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { getBillingTier, FREE_LIMITS } from "@/lib/subscription";
import { TIER_LABEL } from "@/lib/plans";
import { gradeOf, GRADE_LABEL } from "@/lib/grades";
import { GradeBadge } from "@/components/grade-badge";
import { listRoadmaps } from "@/server/roadmaps";
import { RoadmapForm } from "@/components/roadmap-form";
import { RoadmapCard } from "@/components/roadmap-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

// Catégories de roadmaps : chaque type a son en-tête coloré. Les types
// inconnus retombent sur « Tableau ».
const CATEGORIES = [
  {
    type: "board",
    label: "Tableau",
    Icon: Map,
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  },
  {
    type: "test",
    label: "Canvas",
    Icon: Network,
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  },
  {
    type: "note",
    label: "Note",
    Icon: StickyNote,
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
] as const;

function categoryOf(type: string): string {
  return CATEGORIES.some((c) => c.type === type) ? type : "board";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  // Vérification serveur systématique — le proxy n'est qu'une garde UX.
  const { userId, tenantId, name, email } = await requireUser();
  const [tier, roadmaps, params] = await Promise.all([
    getBillingTier(userId),
    listRoadmaps(tenantId),
    searchParams,
  ]);
  const grade = gradeOf(email);

  const totalItems = roadmaps.reduce((n, r) => n + r._count.items, 0);
  const boards = roadmaps.filter((r) => r.type === "board").length;
  const creative = roadmaps.filter((r) => r.type === "test").length;

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const atLimit =
    !grade && tier === "free" && roadmaps.length >= FREE_LIMITS.maxRoadmaps;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {params.success === "true" && (
        <div className="rb-pop flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          <Sparkles className="h-4 w-4" /> Paiement réussi&nbsp;! Votre compte
          passe en Premium dès la confirmation de Stripe.
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="rb-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-white shadow-lg shadow-emerald-600/25 sm:p-10">
        {/* Icônes décoratives flottantes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.13]">
          <Map className="rb-float absolute right-10 top-6 h-32 w-32" />
          <Network
            className="rb-float absolute bottom-2 right-48 h-20 w-20"
            style={{ animationDelay: "1.4s" }}
          />
          <Table2
            className="rb-float absolute right-80 top-12 h-14 w-14"
            style={{ animationDelay: "0.7s" }}
          />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm capitalize text-emerald-50/80">{today}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              Bonjour {name || "👋"}
            </h1>
            <p className="mt-2 max-w-md text-emerald-50/90">
              Vos roadmaps produit, réunies au même endroit. Créez, priorisez et
              avancez.
            </p>
          </div>
          {grade ? (
            <GradeBadge grade={grade} />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur">
              {tier === "free" ? (
                "Plan gratuit"
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> {TIER_LABEL[tier]}
                </>
              )}
            </span>
          )}
        </div>

        {grade && (
          <div className="relative mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-sm text-emerald-50 ring-1 ring-inset ring-white/20">
              Accès {GRADE_LABEL[grade]} — illimité
            </span>
          </div>
        )}
      </section>

      {/* ── Statistiques ─────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Roadmaps" value={roadmaps.length} Icon={FolderKanban} accent="emerald" index={0} />
        <StatCard label="Étapes planifiées" value={totalItems} Icon={ListChecks} accent="sky" index={1} />
        <StatCard label="Tableaux" value={boards} Icon={Map} accent="orange" index={2} />
        <StatCard label="Espaces créatifs" value={creative} Icon={Sparkles} accent="violet" index={3} />
      </section>

      {atLimit && (
        <div className="rb-reveal flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <span>
            Limite du plan gratuit atteinte ({FREE_LIMITS.maxRoadmaps} roadmap).
          </span>
          <Button asChild size="sm">
            <Link href="/pricing">Passer en Premium</Link>
          </Button>
        </div>
      )}

      {/* ── Roadmaps + formulaire ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Mes roadmaps
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Rangées par catégorie · {roadmaps.length} au total
            </p>
          </div>

          {roadmaps.length === 0 ? (
            <div className="rb-pop flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-6 py-16 text-center dark:border-emerald-950/60 dark:bg-zinc-950/40">
              <span className="rb-float inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                <FolderKanban className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                Aucune roadmap pour l&apos;instant
              </h3>
              <p className="mt-1 max-w-xs text-sm text-zinc-500">
                Lancez-vous&nbsp;: créez votre première roadmap avec le
                formulaire ci-contre.
              </p>
              <ArrowRight className="mt-4 hidden h-5 w-5 animate-pulse text-emerald-500 lg:block" />
            </div>
          ) : (
            <div className="grid items-start gap-4 sm:grid-cols-3">
              {(() => {
              let idx = 0;
              return CATEGORIES.map((cat) => {
                const list = roadmaps.filter(
                  (r) => (categoryOf(r.type)) === cat.type
                );
                if (list.length === 0) return null;
                return (
                  <section key={cat.type} className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${cat.chip}`}
                      >
                        <cat.Icon className="h-4 w-4" />
                      </span>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {cat.label}
                      </h3>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {list.length}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {list.map((roadmap) => (
                        <RoadmapCard
                          key={roadmap.id}
                          id={roadmap.id}
                          title={roadmap.title}
                          description={roadmap.description}
                          type={roadmap.type}
                          itemCount={roadmap._count.items}
                          index={idx++}
                        />
                      ))}
                    </div>
                  </section>
                );
              });
            })()}
            </div>
          )}
        </div>

        <div id="nouvelle" className="lg:sticky lg:top-24 lg:self-start">
          <RoadmapForm />
        </div>
      </div>
    </div>
  );
}
