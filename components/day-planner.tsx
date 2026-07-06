"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import type { DayBlock } from "@prisma/client";
import { createDayBlockAction, deleteDayBlockAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SLOT_PX = 26; // hauteur d'un créneau de 30 min
const COLORS = [
  { value: "violet", swatch: "bg-violet-400" },
  { value: "blue", swatch: "bg-blue-400" },
  { value: "emerald", swatch: "bg-emerald-400" },
  { value: "amber", swatch: "bg-amber-400" },
  { value: "rose", swatch: "bg-rose-400" },
  { value: "cyan", swatch: "bg-cyan-400" },
];

const BLOCK_COLORS: Record<string, string> = {
  violet: "bg-violet-100 border-violet-300 text-violet-950",
  blue: "bg-blue-100 border-blue-300 text-blue-950",
  emerald: "bg-emerald-100 border-emerald-300 text-emerald-950",
  amber: "bg-amber-100 border-amber-300 text-amber-950",
  rose: "bg-rose-100 border-rose-300 text-rose-950",
  cyan: "bg-cyan-100 border-cyan-300 text-cyan-950",
};

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function fmtMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Options de 30 min : de `from` à `to` inclus.
function timeOptions(from: number, to: number) {
  const out: { value: number; label: string }[] = [];
  for (let m = from; m <= to; m += 30) out.push({ value: m, label: fmtMinutes(m) });
  return out;
}

export function DayPlanner({
  date,
  dayKey,
  roadmapId,
  blocks,
  onClose,
}: {
  date: Date;
  dayKey: string; // "2026-07-06"
  roadmapId: string;
  blocks: DayBlock[];
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState("violet");
  const [start, setStart] = useState(540); // 09:00
  const [end, setEnd] = useState(600); // 10:00
  const [pending, startTransition] = useTransition();

  const dayBlocks = useMemo(
    () =>
      blocks
        .filter((b) => b.day === dayKey)
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [blocks, dayKey]
  );

  const hours = Array.from({ length: 24 }, (_, h) => h);
  const title = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  function onSubmit(formData: FormData) {
    setError(null);
    if (end <= start) {
      setError("L'heure de fin doit être après l'heure de début");
      return;
    }
    formData.set("startMinutes", String(start));
    formData.set("endMinutes", String(end));
    startTransition(async () => {
      const result = await createDayBlockAction(formData);
      if (!result.ok) setError(result.error);
      else formRef.current?.reset();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div>
            <h2 className="font-semibold capitalize">{title}</h2>
            <p className="text-xs text-zinc-400">
              Planning de la journée (créneaux de 30 min) — indépendant de la
              timeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grille horaire */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="relative" style={{ height: 48 * SLOT_PX }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 flex"
                style={{ top: h * 2 * SLOT_PX, height: 2 * SLOT_PX }}
              >
                <span className="w-12 shrink-0 text-xs text-zinc-400">
                  {String(h).padStart(2, "0")}:00
                </span>
                <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800">
                  <div
                    className="border-t border-dashed border-zinc-100 dark:border-zinc-800/50"
                    style={{ marginTop: SLOT_PX - 1 }}
                  />
                </div>
              </div>
            ))}
            {/* Blocs */}
            <div className="absolute inset-y-0 left-12 right-0">
              {dayBlocks.map((b) => (
                <DayBlockPill key={b.id} block={b} roadmapId={roadmapId} />
              ))}
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <form
          ref={formRef}
          action={onSubmit}
          className="space-y-3 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800"
        >
          <input type="hidden" name="roadmapId" value={roadmapId} />
          <input type="hidden" name="day" value={dayKey} />
          <input type="hidden" name="color" value={color} />
          <Input name="title" placeholder="Nouvelle étape de la journée…" required className="h-9" />
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Heure de début"
              className="h-9 rounded-md border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700"
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
            >
              {timeOptions(0, 1410).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="text-zinc-400">→</span>
            <select
              aria-label="Heure de fin"
              className="h-9 rounded-md border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700"
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
            >
              {timeOptions(30, 1440).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
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
            <Button type="submit" size="sm" disabled={pending} className="ml-auto h-9">
              <Plus className="h-4 w-4" />
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}

function DayBlockPill({ block, roadmapId }: { block: DayBlock; roadmapId: string }) {
  const [pending, startTransition] = useTransition();
  const top = (block.startMinutes / 30) * SLOT_PX;
  const height = ((block.endMinutes - block.startMinutes) / 30) * SLOT_PX;

  return (
    <div
      className={cn(
        "group absolute inset-x-1 flex items-start justify-between gap-1 overflow-hidden rounded-lg border px-2 py-0.5 shadow-sm",
        BLOCK_COLORS[block.color] ?? BLOCK_COLORS.violet
      )}
      style={{ top, height: Math.max(height - 2, SLOT_PX - 2) }}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{block.title}</p>
        <p className="text-[10px] opacity-70">
          {fmtMinutes(block.startMinutes)} – {fmtMinutes(block.endMinutes)}
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        aria-label="Supprimer"
        className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-white/60 group-hover:opacity-100"
        onClick={() =>
          startTransition(async () => {
            await deleteDayBlockAction(block.id, roadmapId);
          })
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
