import { prisma } from "@/lib/prisma";
import { FREE_LIMITS, isPremium } from "@/lib/subscription";
import type {
  DayBlockInput,
  RoadmapInput,
  RoadmapItemInput,
} from "@/lib/validations";

// Fonctionnalité core : les roadmaps produit.
// Chaque requête est scopée au tenantId — un utilisateur ne peut JAMAIS
// lire ou modifier les données d'un autre tenant.

export async function listRoadmaps(tenantId: string) {
  return prisma.roadmap.findMany({
    where: { tenantId },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRoadmap(id: string, tenantId: string) {
  return prisma.roadmap.findFirst({
    where: { id, tenantId },
    include: {
      items: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
      dayBlocks: { orderBy: [{ day: "asc" }, { startMinutes: "asc" }] },
    },
  });
}

// ── Planificateur intra-journalier (créneaux de 30 min) ──────────────────────

export async function createDayBlock(tenantId: string, input: DayBlockInput) {
  // Scopé au tenant via la roadmap : impossible d'écrire chez un autre tenant.
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: input.roadmapId, tenantId },
    select: { id: true },
  });
  if (!roadmap) throw new Error("Roadmap introuvable");

  return prisma.dayBlock.create({
    data: {
      roadmapId: roadmap.id,
      day: input.day,
      title: input.title,
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      color: input.color,
    },
  });
}

export async function deleteDayBlock(blockId: string, tenantId: string) {
  await prisma.dayBlock.deleteMany({
    where: { id: blockId, roadmap: { tenantId } },
  });
}

export async function createRoadmap(
  userId: string,
  tenantId: string,
  input: RoadmapInput
) {
  // Gating d'abonnement vérifié côté serveur, jamais juste côté client.
  if (!(await isPremium(userId))) {
    const count = await prisma.roadmap.count({ where: { tenantId } });
    if (count >= FREE_LIMITS.maxRoadmaps) {
      throw new Error(
        `Plan gratuit limité à ${FREE_LIMITS.maxRoadmaps} roadmap. Passez en Premium pour en créer plus.`
      );
    }
  }

  return prisma.roadmap.create({
    data: {
      title: input.title,
      description: input.description || null,
      type: input.type,
      tenantId,
      createdById: userId,
    },
  });
}

export async function deleteRoadmap(id: string, tenantId: string) {
  // deleteMany + filtre tenant : ne supprime que si la roadmap appartient au tenant.
  await prisma.roadmap.deleteMany({ where: { id, tenantId } });
}

export async function createRoadmapItem(
  userId: string,
  tenantId: string,
  input: RoadmapItemInput
) {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: input.roadmapId, tenantId },
    include: { _count: { select: { items: true } } },
  });
  if (!roadmap) throw new Error("Roadmap introuvable");

  if (!(await isPremium(userId)) && roadmap._count.items >= FREE_LIMITS.maxItemsPerRoadmap) {
    throw new Error(
      `Plan gratuit limité à ${FREE_LIMITS.maxItemsPerRoadmap} étapes par roadmap. Passez en Premium pour en ajouter plus.`
    );
  }

  const start = input.startDate ? new Date(`${input.startDate}T00:00:00`) : null;
  const end = input.endDate
    ? new Date(`${input.endDate}T00:00:00`)
    : start;

  return prisma.roadmapItem.create({
    data: {
      roadmapId: roadmap.id,
      title: input.title,
      description: input.description || null,
      status: input.status,
      track: input.track || null,
      startDate: start,
      endDate: end,
      color: input.color,
      position: roadmap._count.items,
    },
  });
}

export async function updateItemStatus(
  itemId: string,
  tenantId: string,
  status: "PLANNED" | "IN_PROGRESS" | "DONE"
) {
  await prisma.roadmapItem.updateMany({
    where: { id: itemId, roadmap: { tenantId } },
    data: { status },
  });
}

export async function deleteRoadmapItem(itemId: string, tenantId: string) {
  await prisma.roadmapItem.deleteMany({
    where: { id: itemId, roadmap: { tenantId } },
  });
}
