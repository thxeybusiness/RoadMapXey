"use client";

import { useRef, useState, useTransition } from "react";
import { createItemAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ItemForm({ roadmapId }: { roadmapId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createItemAction(formData);
      if (!result.ok) setError(result.error);
      else formRef.current?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un item</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={onSubmit} className="space-y-4">
          <input type="hidden" name="roadmapId" value={roadmapId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-title">Titre</Label>
              <Input id="item-title" name="title" placeholder="Intégration Slack" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-quarter">Trimestre (optionnel)</Label>
              <Input id="item-quarter" name="quarter" placeholder="Q3 2026" pattern="Q[1-4] \d{4}" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">Description (optionnel)</Label>
            <Input id="item-description" name="description" placeholder="Détails…" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Ajout…" : "Ajouter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
