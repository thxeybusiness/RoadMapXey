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
  day: 44,
  week: 128,
  month: 92,
  year: 220,
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

const MONTH_FULL = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const WEEKDAY_ABBR = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

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

// ── Fenêtres fixes par échelle (navigation par drill-down) ───────────────────
// year : 3 années centrées sur l'ancre
// month : 12 mois de l'année de l'ancre
// day : tous les jours du mois de l'ancre (28–31)
// week : 5 semaines à partir du lundi du mois de l'ancre

function windowStart(scale: Scale, anchor: Date): Date {
  switch (scale) {
    case "day":
      return startOfMonth(anchor);
    case "week":
      return startOfWeek(startOfMonth(anchor));
    case "month":
      return startOfYear(anchor);
    case "year":
      return new Date(anchor.getFullYear() - 1, 0, 1);
  }
}

function windowCount(scale: Scale, anchor: Date): number {
  switch (scale) {
    case "day":
      return new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    case "week":
      return 5;
    case "month":
      return 12;
    case "year":
      return 3;
  }
}

function labelFor(scale: Scale, start: Date): { label: string; subLabel?: string } {
  switch (scale) {
    case "day":
      return {
        label: String(start.getDate()),
        subLabel: WEEKDAY_ABBR[(start.getDay() + 6) % 7],
      };
    case "week":
      return {
        label: `${start.getDate()} ${MONTH_ABBR[start.getMonth()]}`,
        subLabel: "sem.",
      };
    case "month":
      return { label: MONTH_ABBR[start.getMonth()] };
    case "year":
      return { label: String(start.getFullYear()) };
  }
}

// ── Génération des colonnes pour la fenêtre courante ─────────────────────────

export function buildBuckets(scale: Scale, anchor: Date): Bucket[] {
  const now = startOfDay(new Date());
  const count = windowCount(scale, anchor);
  const buckets: Bucket[] = [];
  let cursor = windowStart(scale, anchor);

  for (let i = 0; i < count; i++) {
    const end = nextBucketStart(scale, cursor);
    const { label, subLabel } = labelFor(scale, cursor);
    buckets.push({
      key: cursor.toISOString(),
      label,
      subLabel,
      start: cursor,
      end,
      isNow: now.getTime() >= cursor.getTime() && now.getTime() < end.getTime(),
      isWeekend: scale === "day" && (cursor.getDay() === 0 || cursor.getDay() === 6),
    });
    cursor = end;
  }
  return buckets;
}

// Décale l'ancre d'une fenêtre vers l'avant (+1) ou l'arrière (-1).
export function shiftAnchor(scale: Scale, anchor: Date, dir: 1 | -1): Date {
  switch (scale) {
    case "day":
      return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
    case "week":
      return addDays(anchor, dir * 35);
    case "month":
      return new Date(anchor.getFullYear() + dir, anchor.getMonth(), 1);
    case "year":
      return new Date(anchor.getFullYear() + dir * 3, anchor.getMonth(), 1);
  }
}

// Libellé de la période affichée (barre de navigation).
export function periodLabel(scale: Scale, anchor: Date): string {
  switch (scale) {
    case "day":
      return `${MONTH_FULL[anchor.getMonth()]} ${anchor.getFullYear()}`;
    case "week": {
      const s = windowStart("week", anchor);
      const e = addDays(s, 34);
      return `${s.getDate()} ${MONTH_ABBR[s.getMonth()]} – ${e.getDate()} ${MONTH_ABBR[e.getMonth()]} ${e.getFullYear()}`;
    }
    case "month":
      return String(anchor.getFullYear());
    case "year":
      return `${anchor.getFullYear() - 1} – ${anchor.getFullYear() + 1}`;
  }
}

// Coordonnée continue d'une date sur l'axe (0 = bord gauche de la 1re
// colonne, n = bord droit de la dernière). Interpole DANS la colonne pour
// un rendu proportionnel, tout en restant aligné sur les colonnes égales.
export function dateCoord(date: Date, buckets: Bucket[]): number {
  const n = buckets.length;
  if (date.getTime() <= buckets[0].start.getTime()) return 0;
  if (date.getTime() >= buckets[n - 1].end.getTime()) return n;
  for (let i = 0; i < n; i++) {
    const b = buckets[i];
    if (date.getTime() < b.end.getTime()) {
      const frac =
        (date.getTime() - b.start.getTime()) /
        (b.end.getTime() - b.start.getTime());
      return i + frac;
    }
  }
  return n;
}

// Position proportionnelle d'une barre, en % de la largeur totale.
// La date de fin est inclusive → on ajoute un jour pour couvrir sa journée.
export function itemSpanPercent(
  item: RoadmapItem,
  buckets: Bucket[]
): { leftPct: number; widthPct: number } | null {
  const s = itemStart(item);
  if (!s) return null;
  const eInclusive = itemEnd(item) ?? s;
  const eExclusive = new Date(
    eInclusive.getFullYear(),
    eInclusive.getMonth(),
    eInclusive.getDate() + 1
  );

  const n = buckets.length;
  const startCoord = dateCoord(s, buckets);
  let endCoord = dateCoord(eExclusive, buckets);
  if (endCoord <= startCoord) endCoord = startCoord + 0.02; // reste visible

  return {
    leftPct: (startCoord / n) * 100,
    widthPct: ((endCoord - startCoord) / n) * 100,
  };
}

// L'étape chevauche-t-elle la fenêtre visible ?
export function overlapsWindow(item: RoadmapItem, buckets: Bucket[]): boolean {
  const s = itemStart(item);
  if (!s) return false;
  const eInclusive = itemEnd(item) ?? s;
  const eExclusive = new Date(
    eInclusive.getFullYear(),
    eInclusive.getMonth(),
    eInclusive.getDate() + 1
  );
  const winStart = buckets[0].start.getTime();
  const winEnd = buckets[buckets.length - 1].end.getTime();
  return s.getTime() < winEnd && eExclusive.getTime() > winStart;
}
