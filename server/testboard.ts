import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Roadmap « canvas » : blocs (TestNode) reliés par des liens (TestEdge).
// Tout est scopé au tenant via la roadmap.

export type Objective = { id: string; label: string; done: boolean };

async function assertRoadmap(roadmapId: string, tenantId: string) {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, tenantId },
    select: { id: true },
  });
  if (!roadmap) throw new Error("Roadmap introuvable");
  return roadmap.id;
}

export async function createTestNode(roadmapId: string, tenantId: string) {
  await assertRoadmap(roadmapId, tenantId);
  // Décalage léger pour ne pas empiler les nouveaux blocs.
  const count = await prisma.testNode.count({ where: { roadmapId } });
  return prisma.testNode.create({
    data: {
      roadmapId,
      x: 40 + (count % 5) * 40,
      y: 40 + (count % 5) * 40,
    },
  });
}

export async function updateTestNode(
  nodeId: string,
  tenantId: string,
  patch: {
    title?: string;
    x?: number;
    y?: number;
    color?: string;
    objectives?: Objective[];
  }
) {
  const data: Prisma.TestNodeUpdateManyMutationInput = {};
  if (patch.title !== undefined) data.title = patch.title.slice(0, 200);
  if (patch.x !== undefined) data.x = Math.round(patch.x);
  if (patch.y !== undefined) data.y = Math.round(patch.y);
  if (patch.color !== undefined) data.color = patch.color;
  if (patch.objectives !== undefined) {
    data.objectives = patch.objectives.slice(0, 100).map((o) => ({
      id: String(o.id),
      label: String(o.label).slice(0, 300),
      done: Boolean(o.done),
    })) as unknown as Prisma.InputJsonValue;
  }
  await prisma.testNode.updateMany({
    where: { id: nodeId, roadmap: { tenantId } },
    data,
  });
}

export async function deleteTestNode(nodeId: string, tenantId: string) {
  // Supprime aussi les liens attachés à ce bloc.
  const node = await prisma.testNode.findFirst({
    where: { id: nodeId, roadmap: { tenantId } },
    select: { roadmapId: true },
  });
  if (!node) return;
  await prisma.testEdge.deleteMany({
    where: { roadmapId: node.roadmapId, OR: [{ sourceId: nodeId }, { targetId: nodeId }] },
  });
  await prisma.testNode.deleteMany({
    where: { id: nodeId, roadmap: { tenantId } },
  });
}

export async function createTestEdge(
  roadmapId: string,
  tenantId: string,
  sourceId: string,
  targetId: string
) {
  await assertRoadmap(roadmapId, tenantId);
  if (sourceId === targetId) throw new Error("Un bloc ne peut pas se relier à lui-même");
  // Évite les doublons (dans un sens ou l'autre).
  const existing = await prisma.testEdge.findFirst({
    where: {
      roadmapId,
      OR: [
        { sourceId, targetId },
        { sourceId: targetId, targetId: sourceId },
      ],
    },
  });
  if (existing) return existing;
  return prisma.testEdge.create({ data: { roadmapId, sourceId, targetId } });
}

export async function deleteTestEdge(edgeId: string, tenantId: string) {
  await prisma.testEdge.deleteMany({
    where: { id: edgeId, roadmap: { tenantId } },
  });
}
