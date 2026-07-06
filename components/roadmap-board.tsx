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

const LABEL_WIDTH = 170;
const MONTH_MIN_WIDTH = 120;

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

  const tracks = [...groups.keys()].filter((t) => t !== UNPLANNED).sort();
  const unplanned = groups.get(UNPLANNED) ?? [];

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div style={{ minWidth: LABEL_WIDTH + months.length * MONTH_MIN_WIDTH }}>
          {/* En-tête : mois */}
          <div className="grid border-b border-zinc-200 dark:border-zinc-800" style={gridTemplate(months.length)}>
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Couloir
            </div>
            {months.map((m, i) => (
              <div
                key={m}
                className={cn(
                  "border-l border-zinc-100 px-3 py-3 text-center text-sm font-medium dark:border-zinc-800/60",
                  m === today
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    : "text-zinc-500"
                )}
              >
                {monthLabel(m, i === 0 || m.endsWith("-01"))}
              </div>
            ))}
          </div>

          {/* Couloirs */}
          {tracks.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-zinc-400">
              Planifiez votre premier item avec le formulaire ci-dessous — il
              apparaîtra ici sous forme de barre colorée.
            </p>
          ) : (
            tracks.map((track) => {
              const trackItems = groups.get(track)!;
              return (
                <div
                  key={track}
                  className="grid items-center gap-y-1.5 border-b border-zinc-100 py-2.5 last:border-b-0 dark:border-zinc-800/60"
                  style={gridTemplate(months.length)}
                >
                  {/* Guides verticaux des mois */}
                  {months.map((m, i) => (
                    <div
                      key={`guide-${m}`}
                      aria-hidden
                      className={cn(
                        "pointer-events-none h-full border-l border-zinc-100 dark:border-zinc-800/60",
                        m === today && "bg-violet-50/60 dark:bg-violet-950/20"
                      )}
                      style={{
                        gridColumn: i + 2,
                        gridRow: `1 / span ${trackItems.length}`,
                      }}
                    />
                  ))}
                  {/* Label du couloir */}
                  <div
                    className="px-4 text-sm font-semibold"
                    style={{ gridColumn: 1, gridRow: `1 / span ${trackItems.length}` }}
                  >
                    {track}
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

      {/* Items sans date */}
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
