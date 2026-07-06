"use client";

import { useRef, useState, useTransition } from "react";
import { createItemAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = [
  { value: "violet", swatch: "bg-violet-400" },
  { value: "blue", swatch: "bg-blue-400" },
  { value: "emerald", swatch: "bg-emerald-400" },
  { value: "amber", swatch: "bg-amber-400" },
  { value: "rose", swatch: "bg-rose-400" },
  { value: "cyan", swatch: "bg-cyan-400" },
];

export function ItemForm({ roadmapId }: { roadmapId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState("violet");
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
        <CardTitle>Ajouter un item à la timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={onSubmit} className="space-y-4">
          <input type="hidden" name="roadmapId" value={roadmapId} />
          <input type="hidden" name="color" value={color} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-title">Titre</Label>
              <Input id="item-title" name="title" placeholder="Lancer la beta" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-track">Couloir</Label>
              <Input id="item-track" name="track" placeholder="Produit, Marketing…" list="tracks" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="item-start">Mois de début</Label>
              <Input id="item-start" name="startMonth" type="month" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-end">Mois de fin</Label>
              <Input id="item-end" name="endMonth" type="month" />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex h-10 items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-label={`Couleur ${c.value}`}
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform",
                      c.swatch,
                      color === c.value
                        ? "scale-125 ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-950"
                        : "hover:scale-110"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">Description (optionnel)</Label>
            <Input id="item-description" name="description" placeholder="Détails…" />
          </div>
          <p className="text-xs text-zinc-400">
            Sans mois de début, l&apos;item ira dans « À planifier ». Sans mois
            de fin, la barre dure un seul mois.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Ajout…" : "Ajouter à la roadmap"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
