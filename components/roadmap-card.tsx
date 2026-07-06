import Link from "next/link";
import { ArrowUpRight, Map, Network, ListChecks } from "lucide-react";
import { DeleteRoadmapButton } from "@/components/delete-roadmap-button";

type RoadmapType = "board" | "test" | string;

const META: Record<
  string,
  { label: string; Icon: typeof Map; chip: string; bar: string; glow: string }
> = {
  board: {
    label: "Tableau",
    Icon: Map,
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    bar: "from-emerald-400 to-teal-500",
    glow: "hover:shadow-emerald-500/25",
  },
  test: {
    label: "Canvas",
    Icon: Network,
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    bar: "from-violet-400 to-fuchsia-500",
    glow: "hover:shadow-violet-500/25",
  },
};

export function RoadmapCard({
  id,
  title,
  description,
  type,
  itemCount,
  index,
}: {
  id: string;
  title: string;
  description: string | null;
  type: RoadmapType;
  itemCount: number;
  index: number;
}) {
  const meta = META[type] ?? META.board;
  const { Icon } = meta;

  return (
    <div
      className="rb-reveal group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-emerald-950/60 dark:bg-zinc-950"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Barre d'accent dégradée en haut, qui grandit au survol */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${meta.bar} origin-left transition-transform duration-300 group-hover:scale-y-[1.6]`}
      />

      <Link href={`/dashboard/${id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${meta.chip}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <ArrowUpRight className="h-5 w-5 text-zinc-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500" />
        </div>

        <h3 className="mt-4 truncate text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-500 dark:text-zinc-400">
          {description || "Sans description"}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-1 font-semibold ${meta.chip}`}
          >
            {meta.label}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-zinc-400">
            <ListChecks className="h-3.5 w-3.5" />
            {itemCount} étape{itemCount > 1 ? "s" : ""}
          </span>
        </div>
      </Link>

      {/* Suppression : hors du Link pour éviter la navigation */}
      <div className="absolute bottom-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <DeleteRoadmapButton roadmapId={id} />
      </div>
    </div>
  );
}
