"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteRoadmapAction } from "@/server/actions";
import { Button } from "@/components/ui/button";

export function DeleteRoadmapButton({ roadmapId }: { roadmapId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Supprimer la roadmap"
      onClick={() => {
        if (!confirm("Supprimer cette roadmap et toutes ses étapes ?")) return;
        startTransition(async () => {
          await deleteRoadmapAction(roadmapId);
        });
      }}
    >
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  );
}
