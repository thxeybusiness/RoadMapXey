"use client";

import { useRef, useState, useTransition } from "react";
import { createRoadmapAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoadmapForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createRoadmapAction(formData);
      if (!result.ok) setError(result.error);
      else formRef.current?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle roadmap</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" placeholder="Roadmap produit 2026" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Les grands chantiers de l'année…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Création…" : "Créer la roadmap"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
