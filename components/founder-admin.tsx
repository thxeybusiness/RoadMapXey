"use client";

import { useRef, useState, useTransition } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { resetAccountToFreeAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Réservé au compte Fondateur (aussi vérifié côté serveur). Outil de gestion
// des comptes de test : repasse un compte en gratuit.
export function FounderAdmin() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const r = await resetAccountToFreeAction(formData);
      if (!r.ok) setError(r.error);
      else {
        setDone(r.data?.message ?? "Fait.");
        formRef.current?.reset();
      }
    });
  }

  return (
    <Card className="border-amber-300 dark:border-amber-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" /> Zone Fondateur
        </CardTitle>
        <CardDescription>
          Repasse un compte en gratuit (annule son abonnement Stripe). Pratique
          pour réinitialiser tes comptes de test.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={submit} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label htmlFor="reset-email" className="text-xs text-zinc-500">
              Email du compte à repasser en gratuit
            </label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              placeholder="compte@exemple.com"
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            Repasser en gratuit
          </Button>
        </form>
        {done && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> {done}
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
