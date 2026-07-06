import type { RoadmapItem } from "@prisma/client";
import {
  buildMonths,
  currentMonth,
  groupByTrack,
  monthLabel,
  UNPLANNED,
} from "@/lib/board";
import { ItemBar } from "@/components/item-bar";
import { cn } from "@/lib/utils";

// Timeline façon Whimsical : colonnes = mois, couloirs = tracks,
// barres colorées qui s'étendent du mois de début au mois de fin.

const LABEL_WIDTH = 190;
const MONTH_MIN_WIDTH = 120;

// Accent de couleur par couloir (pastille + filet à gauche).
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

function gridTemplate(monthCount: number) {
  return {
    gridTemplateColumns: `${LABEL_WIDTH}px repeat(${monthCount}, minmax(${MONTH_MIN_WIDTH}px, 1fr))`,
  };
}

function computePlacement(item: RoadmapItem, months: string[]) {
  const start = item.startMonth ?? months[0];
  let startIdx = months.indexOf(start);
  if (startIdx === -1) startIdx = 0;
  const end = item.endMonth ?? start;
  let endIdx = months.indexOf(end);
  if (endIdx === -1) endIdx = end > months[months.length - 1] ? months.length - 1 : startIdx;
  if (endIdx < startIdx) endIdx = startIdx;
  return { colStart: startIdx + 2, colEnd: endIdx + 3 };
}

export function RoadmapBoard({ items }: { items: RoadmapItem[] }) {
  const months = buildMonths(items);
  const groups = groupByTrack(items);
  const today = currentMonth();
  const todayIdx = months.indexOf(today);

  const tracks = [...groups.keys()].filter((t) => t !== UNPLANNED).sort();
  const unplanned = groups.get(UNPLANNED) ?? [];

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div
          className="relative"
          style={{ minWidth: LABEL_WIDTH + months.length * MONTH_MIN_WIDTH }}
        >
          {/* Ligne verticale « aujourd'hui » traversant tout le tableau */}
          {todayIdx >= 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 top-11 z-20 w-px bg-violet-400/70 dark:bg-violet-500/60"
              style={{
                left: `calc(${LABEL_WIDTH}px + (100% - ${LABEL_WIDTH}px) * ${todayIdx} / ${months.length})`,
              }}
            >
              <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-violet-500 ring-2 ring-white dark:ring-zinc-950" />
            </div>
          )}

          {/* En-tête : mois */}
          <div
            className="grid border-b border-zinc-200 dark:border-zinc-800"
            style={gridTemplate(months.length)}
          >
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Couloir
            </div>
            {months.map((m, i) => (
              <div
                key={m}
                className={cn(
                  "border-l border-zinc-100 px-3 py-3 text-center text-sm font-medium dark:border-zinc-800/60",
                  m === today
                    ? "font-semibold text-violet-600 dark:text-violet-300"
                    : "text-zinc-500"
                )}
              >
                {monthLabel(m, i === 0 || m.endsWith("-01"))}
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
                  style={gridTemplate(months.length)}
                >
                  {/* Guides verticaux des mois */}
                  {months.map((m, i) => (
                    <div
                      key={`guide-${m}`}
                      aria-hidden
                      className="pointer-events-none h-full border-l border-zinc-100 dark:border-zinc-800/60"
                      style={{
                        gridColumn: i + 2,
                        gridRow: `1 / span ${trackItems.length}`,
                      }}
                    />
                  ))}
                  {/* Label du couloir avec accent coloré */}
                  <div
                    className="flex items-center gap-2.5 px-5"
                    style={{ gridColumn: 1, gridRow: `1 / span ${trackItems.length}` }}
                  >
                    <span className={cn("h-6 w-1.5 shrink-0 rounded-full", accent)} />
                    <span className="text-sm font-semibold">{track}</span>
                  </div>
                  {/* Barres */}
                  {trackItems.map((item, row) => {
                    const { colStart, colEnd } = computePlacement(item, months);
                    return (
                      <div
                        key={item.id}
                        className="px-1"
                        style={{ gridColumn: `${colStart} / ${colEnd}`, gridRow: row + 1 }}
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
