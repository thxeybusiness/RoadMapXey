"use client";

import { useTransition } from "react";
import { Check, CircleDashed, LoaderCircle, Trash2 } from "lucide-react";
import type { RoadmapItem } from "@prisma/client";
import { deleteItemAction, updateItemStatusAction } from "@/server/actions";
import { cn } from "@/lib/utils";

// Barre colorée de la timeline (façon Whimsical). Cliquer sur l'icône de
// statut fait tourner Prévu → En cours → Terminé.

const COLOR_CLASSES: Record<string, string> = {
  violet:
    "bg-violet-100 border-violet-300 text-violet-950 dark:bg-violet-950/60 dark:border-violet-800 dark:text-violet-100",
  blue: "bg-blue-100 border-blue-300 text-blue-950 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-100",
  emerald:
    "bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100",
  amber:
    "bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100",
  rose: "bg-rose-100 border-rose-300 text-rose-950 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100",
  cyan: "bg-cyan-100 border-cyan-300 text-cyan-950 dark:bg-cyan-950/60 dark:border-cyan-800 dark:text-cyan-100",
};

const NEXT_STATUS: Record<RoadmapItem["status"], RoadmapItem["status"]> = {
  PLANNED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PLANNED",
};

const STATUS_TITLE: Record<RoadmapItem["status"], string> = {
  PLANNED: "Prévu — cliquer pour passer En cours",
  IN_PROGRESS: "En cours — cliquer pour passer Terminé",
  DONE: "Terminé — cliquer pour repasser Prévu",
};

function StatusIcon({ status }: { status: RoadmapItem["status"] }) {
  if (status === "DONE") return <Check className="h-3.5 w-3.5" />;
  if (status === "IN_PROGRESS")
    return <LoaderCircle className="h-3.5 w-3.5 animate-[spin_3s_linear_infinite]" />;
  return <CircleDashed className="h-3.5 w-3.5" />;
}

export function ItemBar({
  item,
  fill = false,
}: {
  item: RoadmapItem;
  fill?: boolean; // remplit la largeur proportionnelle sur la timeline
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "group relative z-10 flex items-center gap-1 overflow-hidden rounded-full border px-2 py-1 shadow-sm transition-all hover:z-30 hover:shadow-md",
        fill && "h-7 w-full",
        COLOR_CLASSES[item.color] ?? COLOR_CLASSES.violet,
        item.status === "DONE" && "opacity-60",
        pending && "opacity-40"
      )}
    >
      <button
        type="button"
        disabled={pending}
        title={STATUS_TITLE[item.status]}
        aria-label={STATUS_TITLE[item.status]}
        className="shrink-0 rounded-full p-0.5 hover:bg-white/60 dark:hover:bg-black/30"
        onClick={() =>
          startTransition(async () => {
            await updateItemStatusAction(item.id, item.roadmapId, NEXT_STATUS[item.status]);
          })
        }
      >
        <StatusIcon status={item.status} />
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-medium",
          item.status === "DONE" && "line-through"
        )}
        title={item.description ? `${item.title} — ${item.description}` : item.title}
      >
        {item.title}
      </span>
      <button
        type="button"
        disabled={pending}
        aria-label="Supprimer l'étape"
        className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-white/60 group-hover:opacity-100 dark:hover:bg-black/30"
        onClick={() =>
          startTransition(async () => {
            await deleteItemAction(item.id, item.roadmapId);
          })
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
