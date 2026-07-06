import type { ComponentType } from "react";
import { CountUp } from "@/components/count-up";

type IconType = ComponentType<{ className?: string }>;

// Petite carte statistique avec compteur animé et accent coloré.
export function StatCard({
  label,
  value,
  Icon,
  accent,
  index,
}: {
  label: string;
  value: number;
  Icon: IconType;
  accent: "emerald" | "sky" | "teal" | "violet" | "amber" | "orange";
  index: number;
}) {
  const tones: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300",
    violet:
      "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  };

  return (
    <div
      className="rb-reveal flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-emerald-950/60 dark:bg-zinc-950"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[accent]}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight tabular-nums">
          <CountUp value={value} />
        </p>
        <p className="truncate text-xs font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </p>
      </div>
    </div>
  );
}
