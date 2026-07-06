import type { RoadmapItem } from "@prisma/client";

// Helpers de la timeline (façon Whimsical), multi-échelle :
// jour / semaine / mois / année. Les colonnes ("buckets") sont générées
// selon l'échelle choisie ; chaque barre s'étend du bucket de début au
// bucket de fin.

export type Scale = "day" | "week" | "month" | "year";

export const SCALES: { value: Scale; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

// Largeur mini d'une colonne selon l'échelle (px).
export const SCALE_COL_WIDTH: Record<Scale, number> = {
  day: 46,
  week: 68,
  month: 120,
  year: 130,
};

// Nombre max de colonnes pour éviter une grille démesurée.
const SCALE_MAX_COLS: Record<Scale, number> = {
  day: 92,
  week: 60,
  month: 36,
  year: 20,
};

const MONTH_ABBR = [
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

export type Bucket = {
  key: string;
  label: string;
  subLabel?: string;
  start: Date; // inclus
  end: Date; // exclu
  isNow: boolean;
  isWeekend?: boolean;
};

// ── Dates effectives (compat : startDate prioritaire, sinon startMonth) ──────

function monthStringToDate(m: string, endOfMonth: boolean): Date {
  const [y, mo] = m.split("-").map(Number);
  return endOfMonth ? new Date(y, mo, 0) : new Date(y, mo - 1, 1);
}

export function itemStart(item: RoadmapItem): Date | null {
  if (item.startDate) return startOfDay(item.startDate);
  if (item.startMonth) return monthStringToDate(item.startMonth, false);
  return null;
}

export function itemEnd(item: RoadmapItem): Date | null {
  if (item.endDate) return startOfDay(item.endDate);
  if (item.endMonth) return monthStringToDate(item.endMonth, true);
  if (item.startDate) return startOfDay(item.startDate);
  if (item.startMonth) return monthStringToDate(item.startMonth, true);
  return null;
}

export function isPlanned(item: RoadmapItem): boolean {
  return itemStart(item) !== null;
}

// (Le regroupement par couloir a été retiré : chaque étape occupe sa
// propre ligne sur la timeline.)

// ── Manipulation de dates (sans dépendance externe) ──────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d: Date): Date {
  // Semaine ISO : commence le lundi.
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  return addDays(startOfDay(d), -day);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function bucketStartFor(scale: Scale, d: Date): Date {
  switch (scale) {
    case "day":
      return startOfDay(d);
    case "week":
      return startOfWeek(d);
    case "month":
      return startOfMonth(d);
    case "year":
      return startOfYear(d);
  }
}

function nextBucketStart(scale: Scale, d: Date): Date {
  switch (scale) {
    case "day":
      return addDays(d, 1);
    case "week":
      return addDays(d, 7);
    case "month":
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    case "year":
      return new Date(d.getFullYear() + 1, 0, 1);
  }
}

function labelFor(scale: Scale, start: Date, isFirst: boolean): { label: string; subLabel?: string } {
  switch (scale) {
    case "day": {
      const showMonth = isFirst || start.getDate() === 1;
      return {
        label: String(start.getDate()),
        subLabel: showMonth ? MONTH_ABBR[start.getMonth()] : undefined,
      };
    }
    case "week": {
      return {
        label: `${start.getDate()} ${MONTH_ABBR[start.getMonth()]}`,
        subLabel: isFirst || start.getMonth() === 0 ? String(start.getFullYear()) : undefined,
      };
    }
    case "month": {
      const withYear = isFirst || start.getMonth() === 0;
      return {
        label: MONTH_ABBR[start.getMonth()],
        subLabel: withYear ? String(start.getFullYear()) : undefined,
      };
    }
    case "year":
      return { label: String(start.getFullYear()) };
  }
}

// ── Génération des colonnes ──────────────────────────────────────────────────

export function buildBuckets(items: RoadmapItem[], scale: Scale): Bucket[] {
  const now = new Date();
  const starts = items.map(itemStart).filter(Boolean) as Date[];
  const ends = items.map(itemEnd).filter(Boolean) as Date[];

  // Fenêtre par défaut (rien de planifié) centrée autour d'aujourd'hui.
  const defaultSpan: Record<Scale, number> = { day: 21, week: 10, month: 6, year: 5 };
  let minDate = bucketStartFor(scale, now);
  let maxDate = bucketStartFor(scale, now);

  if (starts.length > 0) {
    minDate = bucketStartFor(scale, new Date(Math.min(...starts.map((d) => d.getTime()))));
    const latest = new Date(Math.max(...ends.map((d) => d.getTime())));
    maxDate = bucketStartFor(scale, latest);
  } else {
    maxDate = bucketStartFor(scale, addDays(now, defaultSpan.day));
    if (scale !== "day") {
      // pour les autres échelles, étend via nextBucketStart
      let c = minDate;
      for (let i = 0; i < defaultSpan[scale]; i++) c = nextBucketStart(scale, c);
      maxDate = c;
    }
  }

  const buckets: Bucket[] = [];
  const todayBucket = bucketStartFor(scale, now).getTime();
  let cursor = minDate;
  let first = true;

  while (cursor.getTime() <= maxDate.getTime() && buckets.length < SCALE_MAX_COLS[scale]) {
    const end = nextBucketStart(scale, cursor);
    const { label, subLabel } = labelFor(scale, cursor, first);
    buckets.push({
      key: cursor.toISOString(),
      label,
      subLabel,
      start: cursor,
      end,
      isNow: cursor.getTime() === todayBucket,
      isWeekend: scale === "day" && (cursor.getDay() === 0 || cursor.getDay() === 6),
    });
    cursor = end;
    first = false;
  }

  // Minimum de colonnes pour que le tableau respire.
  const minCols = 5;
  while (buckets.length < minCols) {
    const last = buckets[buckets.length - 1];
    const start = last.end;
    const end = nextBucketStart(scale, start);
    const { label, subLabel } = labelFor(scale, start, false);
    buckets.push({
      key: start.toISOString(),
      label,
      subLabel,
      start,
      end,
      isNow: start.getTime() === todayBucket,
      isWeekend: scale === "day" && (start.getDay() === 0 || start.getDay() === 6),
    });
  }

  return buckets;
}

// Place une barre : index de première et dernière colonne chevauchées.
export function placeItem(
  item: RoadmapItem,
  buckets: Bucket[]
): { startIdx: number; endIdx: number } | null {
  const s = itemStart(item);
  const e = itemEnd(item) ?? s;
  if (!s || !e) return null;

  let startIdx = buckets.findIndex((b) => b.end.getTime() > s.getTime());
  if (startIdx === -1) startIdx = buckets.length - 1;

  let endIdx = -1;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].start.getTime() <= e.getTime()) endIdx = i;
  }
  if (endIdx === -1) endIdx = startIdx;
  if (endIdx < startIdx) endIdx = startIdx;

  return { startIdx, endIdx };
}
