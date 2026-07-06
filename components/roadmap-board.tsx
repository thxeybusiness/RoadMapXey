"use client";

import { useMemo, useState } from "react";
import type { RoadmapItem } from "@prisma/client";
import {
  buildBuckets,
  groupByTrack,
  placeItem,
  SCALE_COL_WIDTH,
  SCALES,
  UNPLANNED,
  type Scale,
} from "@/lib/board";
import { ItemBar } from "@/components/item-bar";
import { cn } from "@/lib/utils";

const LABEL_WIDTH = 190;

const TRACK_ACCENTS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
];

export function RoadmapBoard({ items }: { items: RoadmapItem[] }) {
  const [scale, setScale] = useState<Scale>("month");

  const buckets = useMemo(() => buildBuckets(items, scale), [items, scale]);
  const groups = useMemo(() => groupByTrack(items), [items]);
  const colWidth = SCALE_COL_WIDTH[scale];

  const tracks = [...groups.keys()].filter((t) => t !== UNPLANNED).sort();
  const unplanned = groups.get(UNPLANNED) ?? [];
  const todayIdx = buckets.findIndex((b) => b.isNow);

  const gridTemplate = {
    gridTemplateColumns: `${LABEL_WIDTH}px repeat(${buckets.length}, minmax(${colWidth}px, 1fr))`,
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
        <div
          className="relative"
          style={{ minWidth: LABEL_WIDTH + buckets.length * colWidth }}
        >
          {/* Ligne verticale « aujourd'hui » */}
          {todayIdx >= 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 top-12 z-20 w-px bg-violet-400/70 dark:bg-violet-500/60"
              style={{
                left: `calc(${LABEL_WIDTH}px + (100% - ${LABEL_WIDTH}px) * ${todayIdx} / ${buckets.length})`,
              }}
            >
              <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-violet-500 ring-2 ring-white dark:ring-zinc-950" />
            </div>
          )}

          {/* En-tête : colonnes de temps */}
          <div
            className="grid border-b border-zinc-200 dark:border-zinc-800"
            style={gridTemplate}
          >
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Couloir
            </div>
            {buckets.map((b) => (
              <div
                key={b.key}
                className={cn(
                  "border-l border-zinc-100 px-1 py-2 text-center dark:border-zinc-800/60",
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

          {/* Couloirs */}
          {tracks.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-400">
              Planifiez votre première étape avec la barre ci-dessous — elle
              apparaîtra ici sous forme de pastille colorée sur la timeline.
            </p>
          ) : (
            tracks.map((track, trackIdx) => {
              const trackItems = groups.get(track)!;
              const accent = TRACK_ACCENTS[trackIdx % TRACK_ACCENTS.length];
              return (
                <div
                  key={track}
                  className="grid items-center gap-y-2 border-b border-zinc-100 py-3 last:border-b-0 odd:bg-zinc-50/40 dark:border-zinc-800/60 dark:odd:bg-zinc-900/30"
                  style={gridTemplate}
                >
                  {buckets.map((b, i) => (
                    <div
                      key={`guide-${b.key}`}
                      aria-hidden
                      className={cn(
                        "pointer-events-none h-full border-l border-zinc-100 dark:border-zinc-800/60",
                        b.isWeekend && "bg-zinc-50/70 dark:bg-zinc-900/30"
                      )}
                      style={{ gridColumn: i + 2, gridRow: `1 / span ${trackItems.length}` }}
                    />
                  ))}
                  <div
                    className="flex items-center gap-2.5 px-5"
                    style={{ gridColumn: 1, gridRow: `1 / span ${trackItems.length}` }}
                  >
                    <span className={cn("h-6 w-1.5 shrink-0 rounded-full", accent)} />
                    <span className="text-sm font-semibold">{track}</span>
                  </div>
                  {trackItems.map((item, row) => {
                    const placement = placeItem(item, buckets);
                    if (!placement) return null;
                    return (
                      <div
                        key={item.id}
                        className="px-1"
                        style={{
                          gridColumn: `${placement.startIdx + 2} / ${placement.endIdx + 3}`,
                          gridRow: row + 1,
                        }}
                      >
                        <ItemBar item={item} />
                      </div>
                    );
                  })}
                </div>
              );
            })
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
