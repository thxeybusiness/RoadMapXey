import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getRoadmap } from "@/server/roadmaps";
import { ItemForm } from "@/components/item-form";
import { ItemRow } from "@/components/item-row";
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </Button>
        <h1 className="mt-4 text-3xl font-bold">{roadmap.title}</h1>
        {roadmap.description && (
          <p className="mt-2 text-zinc-500">{roadmap.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {roadmap.items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucun item — ajoutez le premier ci-dessous.
          </p>
        ) : (
          roadmap.items.map((item) => <ItemRow key={item.id} item={item} />)
        )}
      </div>

      <ItemForm roadmapId={roadmap.id} />
    </div>
  );
}
