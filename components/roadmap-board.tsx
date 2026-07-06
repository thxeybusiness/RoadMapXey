"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RoadmapItem } from "@prisma/client";
import {
  buildBuckets,
  dateCoord,
  isPlanned,
  itemSpanPercent,
  itemStart,
  overlapsWindow,
  periodLabel,
  SCALE_COL_WIDTH,
  SCALES,
  shiftAnchor,
  type Scale,
} from "@/lib/board";
import { ItemBar } from "@/components/item-bar";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 38; // px, une ligne par étape

const MONTH_FULL = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function RoadmapBoard({ items }: { items: RoadmapItem[] }) {
  // Démarre sur 3 années (année précédente – courante – suivante).
  const [scale, setScale] = useState<Scale>("year");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const buckets = useMemo(() => buildBuckets(scale, anchor), [scale, anchor]);
  const colWidth = SCALE_COL_WIDTH[scale];
  const n = buckets.length;

  // Étapes visibles dans la fenêtre courante, triées par date de début.
  const planned = useMemo(
    () =>
      items
        .filter(isPlanned)
        .filter((i) => overlapsWindow(i, buckets))
        .sort(
          (a, b) =>
            (itemStart(a)?.getTime() ?? 0) - (itemStart(b)?.getTime() ?? 0) ||
            a.position - b.position
        ),
    [items, buckets]
  );
  const hiddenCount =
    items.filter(isPlanned).length -
    items.filter(isPlanned).filter((i) => overlapsWindow(i, buckets)).length;
  const unplanned = useMemo(() => items.filter((i) => !isPlanned(i)), [items]);

  const todayPct = useMemo(() => {
    const now = new Date();
    if (now < buckets[0].start || now >= buckets[n - 1].end) return null;
    return (dateCoord(now, buckets) / n) * 100;
  }, [buckets, n]);

  const gridTemplate = {
    gridTemplateColumns: `repeat(${n}, minmax(${colWidth}px, 1fr))`,
  };
  const bodyHeight = Math.max(planned.length, 1) * ROW_HEIGHT;

  // Drill-down : cliquer une année → ses mois ; un mois → ses jours.
  function drillInto(bucketStart: Date) {
    if (scale === "year") {
      setScale("month");
      setAnchor(new Date(bucketStart.getFullYear(), 0, 1));
    } else if (scale === "month") {
      setScale("day");
      setAnchor(bucketStart);
    }
  }
  const drillable = scale === "year" || scale === "month";

  function zoomOut() {
    if (scale === "day" || scale === "week") setScale("month");
    else if (scale === "month") setScale("year");
  }

  return (
    <div className="space-y-4">
      {/* Barre de navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(shiftAnchor(scale, anchor, -1))}
            aria-label="Période précédente"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Menu déroulant de navigation rapide */}
          <PeriodPicker scale={scale} anchor={anchor} onPick={setAnchor} onZoomOut={zoomOut} />

          <button
            type="button"
            onClick={() => setAnchor(shiftAnchor(scale, anchor, 1))}
            aria-label="Période suivante"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Aujourd&apos;hui
          </button>
        </div>

        {/* Sélecteur d'échelle (zoom) */}
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
      </div>

      {hiddenCount > 0 && (
        <p className="text-xs text-zinc-400">
          {hiddenCount} étape(s) hors de la période affichée — naviguez avec les
          flèches ou changez d&apos;échelle.
        </p>
      )}

      <div className="max-h-[75vh] overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative" style={{ minWidth: n * colWidth }}>
          {/* Ligne « aujourd'hui » proportionnelle */}
          {todayPct !== null && (
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 top-14 z-20 w-px bg-violet-500/70"
              style={{ left: `${todayPct}%` }}
            >
              <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-violet-500 ring-2 ring-white dark:ring-zinc-950" />
            </div>
          )}

          {/* En-tête des colonnes (sticky en haut) */}
          <div
            className="sticky top-0 z-30 grid border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            style={gridTemplate}
          >
            {buckets.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => drillable && drillInto(b.start)}
                disabled={!drillable}
                className={cn(
                  "border-l border-zinc-200 px-1 py-2 text-center first:border-l-0 dark:border-zinc-800",
                  b.isWeekend && "bg-zinc-100/70 dark:bg-zinc-900/50",
                  drillable && "cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/30",
                  b.isNow
                    ? "font-semibold text-violet-600 dark:text-violet-300"
                    : "text-zinc-500"
                )}
              >
                {b.subLabel && (
                  <div className="text-[10px] tracking-wide text-zinc-400">
                    {b.subLabel}
                  </div>
                )}
                <div className="text-sm font-medium leading-tight">{b.label}</div>
              </button>
            ))}
          </div>

          {/* Corps */}
          {planned.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-400">
              Aucune étape sur cette période. Ajoutez-en une ci-dessous, ou
              naviguez avec les flèches.
            </p>
          ) : (
            <div className="relative" style={{ height: bodyHeight }}>
              {/* Guides verticaux + week-ends */}
              {buckets.map((b, i) => (
                <div
                  key={`guide-${b.key}`}
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 top-0",
                    i > 0 && "border-l border-zinc-100 dark:border-zinc-800/70",
                    b.isWeekend && "bg-zinc-50 dark:bg-zinc-900/30"
                  )}
                  style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}
                />
              ))}
              {/* Séparateurs de lignes */}
              {planned.slice(1).map((item, i) => (
                <div
                  key={`sep-${item.id}`}
                  aria-hidden
                  className="absolute inset-x-0 border-t border-zinc-100/70 dark:border-zinc-800/40"
                  style={{ top: (i + 1) * ROW_HEIGHT }}
                />
              ))}
              {/* Barres proportionnelles */}
              {planned.map((item, row) => {
                const span = itemSpanPercent(item, buckets);
                if (!span) return null;
                return (
                  <div
                    key={item.id}
                    className="absolute flex items-center"
                    style={{
                      left: `${span.leftPct}%`,
                      width: `${span.widthPct}%`,
                      minWidth: 24,
                      top: row * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      paddingRight: 4,
                    }}
                  >
                    <ItemBar item={item} fill />
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
              <ItemBar key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Menu déroulant de navigation : mois (vues jour/semaine), année (vue mois),
// ou libellé cliquable pour dézoomer (vue année).
function PeriodPicker({
  scale,
  anchor,
  onPick,
  onZoomOut,
}: {
  scale: Scale;
  anchor: Date;
  onPick: (d: Date) => void;
  onZoomOut: () => void;
}) {
  const selectClass =
    "h-9 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800";

  if (scale === "day" || scale === "week") {
    return (
      <select
        aria-label="Choisir le mois"
        className={selectClass}
        value={anchor.getMonth()}
        onChange={(e) =>
          onPick(new Date(anchor.getFullYear(), Number(e.target.value), 1))
        }
      >
        {MONTH_FULL.map((m, i) => (
          <option key={m} value={i}>
            {m} {anchor.getFullYear()}
          </option>
        ))}
      </select>
    );
  }

  if (scale === "month") {
    const year = anchor.getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
    return (
      <select
        aria-label="Choisir l'année"
        className={selectClass}
        value={year}
        onChange={(e) => onPick(new Date(Number(e.target.value), 0, 1))}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    );
  }

  // Vue année : libellé de la plage (non déroulant).
  return (
    <button type="button" onClick={onZoomOut} className={selectClass}>
      {periodLabel(scale, anchor)}
    </button>
  );
}
