"use client";

import { useMemo, useState } from "react";
import type { RoadmapItem } from "@prisma/client";
import {
  buildBuckets,
  isPlanned,
  itemStart,
  placeItem,
  SCALE_COL_WIDTH,
  SCALES,
  type Scale,
} from "@/lib/board";
import { ItemBar } from "@/components/item-bar";
import { cn } from "@/lib/utils";

export function RoadmapBoard({ items }: { items: RoadmapItem[] }) {
  const [scale, setScale] = useState<Scale>("month");

  const buckets = useMemo(() => buildBuckets(items, scale), [items, scale]);
  const colWidth = SCALE_COL_WIDTH[scale];

  // Étapes planifiées (avec date) triées par date de début, puis non datées.
  const planned = useMemo(
    () =>
      items
        .filter(isPlanned)
        .sort(
          (a, b) =>
            (itemStart(a)?.getTime() ?? 0) - (itemStart(b)?.getTime() ?? 0) ||
            a.position - b.position
        ),
    [items]
  );
  const unplanned = useMemo(() => items.filter((i) => !isPlanned(i)), [items]);
  const todayIdx = buckets.findIndex((b) => b.isNow);

  const gridTemplate = {
    gridTemplateColumns: `repeat(${buckets.length}, minmax(${colWidth}px, 1fr))`,
  };

  return (
    <div className="space-y-4">
      {/* Sélecteur d'échelle */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
          {SCALES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setScale(s.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                scale === s.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="hidden text-xs text-zinc-400 sm:block">
          Cliquez sur la pastille de statut d&apos;une étape pour la faire
          avancer, ou survolez-la pour la supprimer.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative" style={{ minWidth: buckets.length * colWidth }}>
          {/* Ligne verticale « aujourd'hui » */}
          {todayIdx >= 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 top-12 z-20 w-px bg-violet-400/70 dark:bg-violet-500/60"
              style={{ left: `calc(100% * ${todayIdx} / ${buckets.length})` }}
            >
              <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-violet-500 ring-2 ring-white dark:ring-zinc-950" />
            </div>
          )}

          {/* En-tête : colonnes de temps */}
          <div
            className="grid border-b border-zinc-200 dark:border-zinc-800"
            style={gridTemplate}
          >
            {buckets.map((b) => (
              <div
                key={b.key}
                className={cn(
                  "border-l border-zinc-100 px-1 py-2 text-center first:border-l-0 dark:border-zinc-800/60",
                  b.isWeekend && "bg-zinc-50 dark:bg-zinc-900/40",
                  b.isNow
                    ? "font-semibold text-violet-600 dark:text-violet-300"
                    : "text-zinc-500"
                )}
              >
                {b.subLabel && (
                  <div className="text-[10px] uppercase tracking-wide text-zinc-400">
                    {b.subLabel}
                  </div>
                )}
                <div className="text-sm font-medium leading-tight">{b.label}</div>
              </div>
            ))}
          </div>

          {/* Corps : une ligne par étape planifiée */}
          {planned.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-400">
              Planifiez votre première étape avec la barre ci-dessous — elle
              apparaîtra ici sous forme de pastille colorée sur la timeline.
            </p>
          ) : (
            <div className="grid gap-y-1.5 py-3" style={gridTemplate}>
              {/* Guides verticaux */}
              {buckets.map((b, i) => (
                <div
                  key={`guide-${b.key}`}
                  aria-hidden
                  className={cn(
                    "pointer-events-none border-l border-zinc-100 first:border-l-0 dark:border-zinc-800/60",
                    b.isWeekend && "bg-zinc-50/70 dark:bg-zinc-900/30"
                  )}
                  style={{ gridColumn: i + 1, gridRow: `1 / span ${planned.length}` }}
                />
              ))}
              {/* Barres */}
              {planned.map((item, row) => {
                const placement = placeItem(item, buckets);
                if (!placement) return null;
                return (
                  <div
                    key={item.id}
                    className="px-1"
                    style={{
                      gridColumn: `${placement.startIdx + 1} / ${placement.endIdx + 2}`,
                      gridRow: row + 1,
                    }}
                  >
                    <ItemBar item={item} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Étapes sans date */}
      {unplanned.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            À planifier
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplanned.map((item) => (
              <ItemBar key={item.id} item={item} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
