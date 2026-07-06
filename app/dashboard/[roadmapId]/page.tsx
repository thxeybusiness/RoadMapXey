import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getRoadmap } from "@/server/roadmaps";
import { RoadmapBoard } from "@/components/roadmap-board";
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Mes roadmaps
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{roadmap.title}</h1>
          {roadmap.description && (
            <p className="mt-1 text-zinc-500">{roadmap.description}</p>
          )}
        </div>
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
      </div>

      <RoadmapBoard
        items={roadmap.items}
        roadmapId={roadmap.id}
        dayBlocks={roadmap.dayBlocks}
      />

      <ItemForm roadmapId={roadmap.id} />
    </div>
  );
}
