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
      testNodes: { orderBy: { createdAt: "asc" } },
      testEdges: true,
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

// Enregistre le contenu d'un bloc-notes (type note). Scopé au tenant.
export async function updateNoteContent(
  roadmapId: string,
  tenantId: string,
  content: string
) {
  await prisma.roadmap.updateMany({
    where: { id: roadmapId, tenantId },
    data: { noteContent: content.slice(0, 100_000) },
  });
}

const NODE_COLORS = ["violet", "blue", "emerald", "amber", "rose", "cyan"];

// Découpe le texte d'une note en idées : une ligne = un bloc. On retire les
// marqueurs Markdown courants (titres #, puces -, numéros 1., cases [ ]).
function parseNoteToBlocks(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*(#{1,6}\s+|[-*+•]\s+|\d+[.)]\s+)/, "")
        .replace(/^\s*\[[ xX]\]\s*/, "")
        .trim()
    )
    .filter((line) => line.length > 0)
    .slice(0, 60)
    .map((line) => line.slice(0, 200));
}

// Convertit une note en un nouveau Canvas : chaque idée devient un bloc,
// disposé en grille, prêt à être relié et réorganisé. La note est conservée.
export async function convertNoteToCanvas(
  noteRoadmapId: string,
  userId: string,
  tenantId: string
): Promise<string> {
  const note = await prisma.roadmap.findFirst({
    where: { id: noteRoadmapId, tenantId },
    select: { title: true, description: true, noteContent: true },
  });
  if (!note) throw new Error("Note introuvable");

  const blocks = parseNoteToBlocks(note.noteContent ?? "");
  if (blocks.length === 0) {
    throw new Error("La note est vide — écrivez quelques idées avant de convertir.");
  }

  // Même limite d'abonnement que la création classique (une nouvelle roadmap).
  if (!(await isPremium(userId))) {
    const count = await prisma.roadmap.count({ where: { tenantId } });
    if (count >= FREE_LIMITS.maxRoadmaps) {
      throw new Error(
        `Plan gratuit limité à ${FREE_LIMITS.maxRoadmaps} roadmap. Passez en Premium pour en créer plus.`
      );
    }
  }

  const canvas = await prisma.roadmap.create({
    data: {
      title: `${note.title} — Canvas`.slice(0, 200),
      description: note.description,
      type: "test",
      tenantId,
      createdById: userId,
    },
  });

  const COLS = 4;
  const GAP_X = 260;
  const GAP_Y = 150;
  await prisma.testNode.createMany({
    data: blocks.map((title, i) => ({
      roadmapId: canvas.id,
      title,
      x: 40 + (i % COLS) * GAP_X,
      y: 40 + Math.floor(i / COLS) * GAP_Y,
      color: NODE_COLORS[i % NODE_COLORS.length],
    })),
  });

  return canvas.id;
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
