"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createItemAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COLORS = [
  { value: "violet", swatch: "bg-violet-400" },
  { value: "blue", swatch: "bg-blue-400" },
  { value: "emerald", swatch: "bg-emerald-400" },
  { value: "amber", swatch: "bg-amber-400" },
  { value: "rose", swatch: "bg-rose-400" },
  { value: "cyan", swatch: "bg-cyan-400" },
];

// Barre d'ajout minimaliste : tout tient sur une ligne.
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
    <form
      ref={formRef}
      action={onSubmit}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="roadmapId" value={roadmapId} />
      <input type="hidden" name="color" value={color} />
      <Input
        name="title"
        placeholder="Nouvelle étape…"
        aria-label="Titre"
        required
        className="h-9 min-w-40 flex-1"
      />
      <Input
        name="track"
        placeholder="Couloir"
        aria-label="Couloir"
        list="tracks"
        className="h-9 w-32"
      />
      <Input
        name="startMonth"
        type="month"
        aria-label="Mois de début"
        title="Mois de début"
        className="h-9 w-36 text-zinc-500"
      />
      <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
        →
      </span>
      <Input
        name="endMonth"
        type="month"
        aria-label="Mois de fin"
        title="Mois de fin"
        className="h-9 w-36 text-zinc-500"
      />
      <div className="flex items-center gap-1.5 px-1">
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={`Couleur ${c.value}`}
            onClick={() => setColor(c.value)}
            className={cn(
              "h-4 w-4 rounded-full transition-transform",
              c.swatch,
              color === c.value
                ? "scale-125 ring-2 ring-zinc-900 ring-offset-1 dark:ring-zinc-100 dark:ring-offset-zinc-950"
                : "hover:scale-110"
            )}
          />
        ))}
      </div>
      <Button type="submit" size="sm" disabled={pending} className="h-9">
        <Plus className="h-4 w-4" />
        {pending ? "Ajout…" : "Ajouter"}
      </Button>
      {error && <p className="w-full px-1 text-sm text-red-600">{error}</p>}
    </form>
  );
}
