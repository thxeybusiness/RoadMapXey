"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/server/actions";
import { Button } from "@/components/ui/button";

// RGPD : suppression du compte et de toutes les données associées.
export function DeleteAccountButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "Supprimer définitivement votre compte ? Toutes vos données (roadmaps, abonnement) seront effacées. Cette action est irréversible."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={handleClick} disabled={pending}>
        {pending ? "Suppression…" : "Supprimer mon compte et mes données"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
