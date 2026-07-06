import type { RoadmapItem } from "@prisma/client";

// Helpers de la vue timeline (façon Whimsical) : colonnes par mois,
// couloirs par track, barres colorées qui s'étendent sur plusieurs mois.

export const TRACK_DEFAULT = "Général";
export const UNPLANNED = "__unplanned__";

const MONTH_LABELS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function monthLabel(month: string, withYear: boolean): string {
  const [y, m] = month.split("-").map(Number);
  return withYear ? `${MONTH_LABELS[m - 1]} ${y}` : MONTH_LABELS[m - 1];
}

// Colonnes de la timeline : du mois le plus tôt au plus tard des items
// (bornées à 18), ou 6 mois à partir d'aujourd'hui si rien n'est planifié.
export function buildMonths(items: RoadmapItem[]): string[] {
  const planned = items.filter((i) => i.startMonth);
  let start = currentMonth();
  let end = addMonths(start, 5);

  if (planned.length > 0) {
    const starts = planned.map((i) => i.startMonth!).sort();
    const ends = planned.map((i) => i.endMonth ?? i.startMonth!).sort();
    start = starts[0];
    end = ends[ends.length - 1] > start ? ends[ends.length - 1] : start;
  }

  const months: string[] = [];
  for (let m = start; m <= end && months.length < 18; m = addMonths(m, 1)) {
    months.push(m);
  }
  // Minimum 4 colonnes pour que le tableau respire.
  while (months.length < 4) months.push(addMonths(months[months.length - 1], 1));
  return months;
}

// Regroupe les items par couloir ; les items sans dates vont dans UNPLANNED.
export function groupByTrack(items: RoadmapItem[]): Map<string, RoadmapItem[]> {
  const groups = new Map<string, RoadmapItem[]>();
  for (const item of items) {
    const key = !item.startMonth
      ? UNPLANNED
      : item.track?.trim() || TRACK_DEFAULT;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}
