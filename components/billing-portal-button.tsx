"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Ouvre le portail client Stripe (annulation, factures, moyen de paiement).
export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Erreur inconnue");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Ouverture…" : "Gérer mon abonnement"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
