"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lance une souscription Stripe. Pour un changement de forfait (isChange),
// affiche d'abord une confirmation avec le montant exact au prorata avant
// tout débit — évite les paiements involontaires.
export function CheckoutButton({
  priceId,
  children,
  isChange = false,
  monthlyLabel,
}: {
  priceId: string;
  children: React.ReactNode;
  isChange?: boolean;
  monthlyLabel?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ amountDue: number; currency: string } | null>(
    null
  );

  function fmt(cents: number, currency: string) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  }

  // Souscription directe (première fois) → Stripe Checkout.
  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (res.status === 401) {
        router.push("/signup");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      if (data.upgraded) {
        window.location.href = "/dashboard?success=true";
        return;
      }
      if (!data.url) throw new Error("Erreur inconnue");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  // Changement de forfait : on récupère d'abord le montant au prorata.
  async function requestPreview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (res.status === 401) {
        router.push("/signup");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      if (data.needsCheckout) {
        await startCheckout();
        return;
      }
      setConfirm({ amountDue: data.amountDue, currency: data.currency });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  // Confirmation reçue → on applique réellement le changement (débit prorata).
  async function confirmChange() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      window.location.href = "/dashboard?success=true";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  // Panneau de confirmation avec le montant exact.
  if (confirm) {
    const pay = confirm.amountDue > 0;
    return (
      <div className="w-full space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-zinc-700 dark:text-zinc-200">
          {pay ? (
            <>
              Vous serez débité de{" "}
              <strong>{fmt(confirm.amountDue, confirm.currency)}</strong>{" "}
              maintenant (au prorata du temps restant)
              {monthlyLabel ? <>, puis <strong>{monthlyLabel}/mois</strong></> : null}.
            </>
          ) : (
            <>
              Aucun débit immédiat — un crédit sera appliqué à vos prochaines
              factures{monthlyLabel ? <>, puis <strong>{monthlyLabel}/mois</strong></> : null}.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={confirmChange}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConfirm(null);
              setError(null);
            }}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <Button
        className="w-full"
        onClick={isChange ? requestPreview : startCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Un instant…
          </>
        ) : (
          children
        )}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
