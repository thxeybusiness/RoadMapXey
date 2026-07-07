import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { FREE_LIMITS } from "@/lib/subscription";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Forfaits" };

// Identifiants de prix Stripe (mode Test). Ce ne sont pas des secrets
// (ils transitent de toute façon côté client). Une variable d'environnement
// du même nom, si définie, a la priorité — pratique pour basculer en Live.
const DEFAULT_PRICE_PRO = "price_1TqMgzRwEaCwXVSNikizTrGB"; // 4 €/mois
const DEFAULT_PRICE_BUSINESS = "price_1TqMhCRwEaCwXVSN2VRudGYI"; // 9 €/mois

// Prix actuellement souscrit par l'utilisateur connecté (null sinon).
async function getCurrentPriceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!sub?.stripeSubscriptionId || sub.status !== "active") return null;
  try {
    const s = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    return s.items.data[0]?.price.id ?? null;
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const proPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO ?? DEFAULT_PRICE_PRO;
  const businessPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS ?? DEFAULT_PRICE_BUSINESS;
  const currentPriceId = await getCurrentPriceId();
  const hasSub = currentPriceId !== null;

  // CTA d'un forfait payant selon la situation : déjà souscrit, changement
  // au prorata, ou première souscription.
  function paidCta(priceId: string, label: string, monthlyLabel: string) {
    if (currentPriceId === priceId) {
      return (
        <Button variant="outline" className="w-full" disabled>
          <BadgeCheck className="h-4 w-4" /> Votre forfait actuel
        </Button>
      );
    }
    return (
      <CheckoutButton
        priceId={priceId}
        isChange={hasSub}
        monthlyLabel={monthlyLabel}
      >
        {hasSub ? "Changer pour ce forfait" : label}
      </CheckoutButton>
    );
  }

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
      bar: "from-emerald-300 to-teal-400",
      check: "text-emerald-600",
      cta: (
        <Button asChild variant="outline" className="w-full">
          <Link href="/signup">Commencer gratuitement</Link>
        </Button>
      ),
      highlighted: false,
    },
    {
      name: "Pro",
      price: "4 €",
      description: "Pour les créateurs qui shippent",
      features: [
        "Roadmaps illimitées",
        "Étapes illimitées",
        "Les 2 formats : Tableau & Canvas",
        "Planning journalier 30 min",
        "Support par email",
      ],
      bar: "from-emerald-400 to-teal-500",
      check: "text-emerald-600",
      cta: paidCta(proPriceId, "Passer en Pro", "4 €"),
      highlighted: true,
    },
    {
      name: "Business",
      price: "9 €",
      description: "Pour les équipes qui pilotent ensemble",
      features: [
        "Tout le forfait Pro",
        "Espaces d'équipe partagés",
        "Rôles & grades personnalisés",
        "Export CSV & image",
        "Support prioritaire",
      ],
      bar: "from-emerald-600 to-green-800",
      check: "text-emerald-700",
      cta: paidCta(businessPriceId, "Passer en Business", "9 €"),
      highlighted: false,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="rb-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-14 text-center text-white shadow-lg shadow-emerald-600/25 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <Sparkles className="rb-float absolute left-12 top-8 h-20 w-20" />
          <Sparkles
            className="rb-float absolute bottom-6 right-16 h-14 w-14"
            style={{ animationDelay: "1.3s" }}
          />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-inset ring-white/25 backdrop-blur">
            <Sparkles className="h-4 w-4" /> Sans engagement
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Nos forfaits
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-50/90">
            Démarrez gratuitement, montez en gamme quand votre activité grandit.
            Annulable à tout moment.
          </p>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────────────────── */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            style={{ animationDelay: `${i * 90}ms` }}
            className={`rb-reveal group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:bg-zinc-950 ${
              plan.highlighted
                ? "border-emerald-500 ring-2 ring-emerald-500 lg:-translate-y-3 lg:hover:-translate-y-4"
                : "border-emerald-100 dark:border-emerald-950/60"
            }`}
          >
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${plan.bar} origin-left transition-transform duration-300 group-hover:scale-y-[1.6]`}
            />
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">
                  {plan.name}
                </h2>
                {plan.highlighted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" /> Populaire
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {plan.description}
              </p>
              <p className="pt-4 text-4xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-zinc-500">
                  /mois
                </span>
              </p>

              <div className="mt-5 flex-1 space-y-2.5 text-sm">
                {plan.features.map((line) => (
                  <p key={line} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.check}`} />
                    {line}
                  </p>
                ))}
              </div>

              <div className="mt-6">{plan.cta}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-zinc-500">
        Sans engagement · Annulable à tout moment · Paiement sécurisé Stripe ·
        Changement de forfait facturé au prorata (vous ne payez que la
        différence)
      </p>
    </div>
  );
}
