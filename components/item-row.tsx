"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { RoadmapItem } from "@prisma/client";
import { deleteItemAction, updateItemStatusAction } from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<RoadmapItem["status"], string> = {
  PLANNED: "Prévu",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

export function ItemRow({ item }: { item: RoadmapItem }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.title}</p>
        {item.description && (
          <p className="truncate text-sm text-zinc-500">{item.description}</p>
        )}
      </div>
      {item.quarter && <Badge variant="outline">{item.quarter}</Badge>}
      <select
        className="h-8 rounded-md border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        value={item.status}
        disabled={pending}
        aria-label="Statut"
        onChange={(e) =>
          startTransition(() =>
            updateItemStatusAction(
              item.id,
              item.roadmapId,
              e.target.value as RoadmapItem["status"]
            ).then(() => undefined)
          )
        }
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label="Supprimer l'item"
        onClick={() =>
          startTransition(() =>
            deleteItemAction(item.id, item.roadmapId).then(() => undefined)
          )
        }
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
