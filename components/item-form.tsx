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

// Saisie clavier assistée : n'accepte que les chiffres et insère les « / ».
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  return parts.filter(Boolean).join("/");
}

// "JJ/MM/AAAA" → "AAAA-MM-JJ" (ISO). Renvoie null si vide, undefined si invalide.
function toISO(value: string): string | null | undefined {
  const v = value.trim();
  if (!v) return null;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${yyyy}-${mm}-${dd}`;
}

// Barre d'ajout minimaliste : tout tient sur une ligne.
export function ItemForm({ roadmapId }: { roadmapId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState("violet");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);

    const startISO = toISO(start);
    const endISO = toISO(end);
    if (startISO === undefined || endISO === undefined) {
      setError("Date invalide — format attendu JJ/MM/AAAA");
      return;
    }
    formData.set("startDate", startISO ?? "");
    formData.set("endDate", endISO ?? "");

    startTransition(async () => {
      const result = await createItemAction(formData);
      if (!result.ok) setError(result.error);
      else {
        formRef.current?.reset();
        setStart("");
        setEnd("");
      }
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
        name="startText"
        inputMode="numeric"
        autoComplete="off"
        placeholder="JJ/MM/AAAA"
        aria-label="Date de début"
        title="Date de début"
        value={start}
        onChange={(e) => setStart(formatDateInput(e.target.value))}
        className="h-9 w-36"
      />
      <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
        →
      </span>
      <Input
        name="endText"
        inputMode="numeric"
        autoComplete="off"
        placeholder="JJ/MM/AAAA"
        aria-label="Date de fin"
        title="Date de fin"
        value={end}
        onChange={(e) => setEnd(formatDateInput(e.target.value))}
        className="h-9 w-36"
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
