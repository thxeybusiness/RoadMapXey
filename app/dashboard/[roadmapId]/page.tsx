import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getRoadmap } from "@/server/roadmaps";
import { RoadmapBoard } from "@/components/roadmap-board";
import { NodeBoard } from "@/components/node-board";
import { ItemForm } from "@/components/item-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { tenantId } = await requireUser();
  const { roadmapId } = await params;

  // Scopé au tenant : impossible d'ouvrir la roadmap d'une autre équipe.
  const roadmap = await getRoadmap(roadmapId, tenantId);
  if (!roadmap) notFound();

  const typeLabel = roadmap.type === "test" ? "Canvas" : "Tableau";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="-ml-1 h-8 w-8 shrink-0">
            <Link href="/dashboard" aria-label="Mes roadmaps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-bold">{roadmap.title}</h1>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            {typeLabel}
          </span>
        </div>
        {roadmap.type === "board" && (
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-zinc-400" />
              Prévu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-amber-500 bg-amber-200" />
              En cours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Terminé
            </span>
          </div>
        )}
      </div>

      {/* Description sous le titre */}
      {roadmap.description && (
        <p className="mt-3 pl-9 text-sm text-zinc-500">{roadmap.description}</p>
      )}

      {/* Espace généreux entre l'en-tête et le contenu de la roadmap */}
      <div className="mt-12 space-y-6">
        {roadmap.type === "test" ? (
          <NodeBoard
            roadmapId={roadmap.id}
            initialNodes={roadmap.testNodes.map((n) => ({
              id: n.id,
              title: n.title,
              x: n.x,
              y: n.y,
              color: n.color,
              objectives: Array.isArray(n.objectives)
                ? (n.objectives as { id: string; label: string; done: boolean }[])
                : [],
            }))}
            initialEdges={roadmap.testEdges.map((e) => ({
              id: e.id,
              sourceId: e.sourceId,
              targetId: e.targetId,
            }))}
          />
        ) : (
          <>
            <RoadmapBoard
              items={roadmap.items}
              roadmapId={roadmap.id}
              dayBlocks={roadmap.dayBlocks}
            />
            <ItemForm roadmapId={roadmap.id} />
          </>
        )}
      </div>
    </div>
  );
}
