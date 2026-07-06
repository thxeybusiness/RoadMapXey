"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Lance une session Stripe Checkout. Redirige vers /login si non connecté.
export function CheckoutButton({
  priceId,
  children,
}: {
  priceId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
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
      if (!res.ok || !data.url) throw new Error(data.error ?? "Erreur inconnue");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <Button className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? "Redirection…" : children}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
