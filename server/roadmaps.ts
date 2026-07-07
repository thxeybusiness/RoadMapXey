import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
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

const NODE_COLORS = ["violet", "blue", "amber", "rose", "cyan", "emerald"];

// ── Analyse structurée d'une note ────────────────────────────────────────────
// Objectif : comprendre la note, pas la recopier ligne à ligne.
// - Le premier titre `#` devient le SUJET (bloc central du Canvas).
// - Chaque titre suivant (`#`, `##`, …) devient un THÈME (un bloc).
// - Les puces / numéros / cases sous un thème deviennent ses OBJECTIFS
//   cochables ([x] = déjà coché).
// - Sans titres : chaque ligne de 1er niveau devient un bloc, ses sous-puces
//   indentées deviennent ses objectifs ; les étapes numérotées (1. 2. 3.)
//   sont reliées entre elles en séquence.
// - Tous les thèmes sont reliés au sujet central (carte mentale).

type ParsedObjective = { label: string; done: boolean };
type ParsedBlock = {
  title: string;
  objectives: ParsedObjective[];
  numbered: boolean;
};

function cleanText(s: string): string {
  return s.replace(/\*\*|__|`/g, "").trim().slice(0, 200);
}

// Structure « en ligne » : « Titre : élément / élément / élément » devient un
// bloc « Titre » avec chaque élément en objectif. Séparateurs reconnus après
// les deux-points : / ; | · — et sans deux-points, une ligne « a / b / c »
// donne un bloc « a » avec b et c en objectifs.
const INLINE_SEP = /\s*[/;|·]\s*/;

function explodeInline(text: string): {
  title: string;
  objectives: ParsedObjective[];
} {
  const colon = text.match(/^(.{2,120}?)\s*:\s+(.+)$/);
  if (colon) {
    const parts = colon[2]
      .split(INLINE_SEP)
      .map((s) => cleanText(s))
      .filter(Boolean);
    if (parts.length > 0) {
      return {
        title: cleanText(colon[1]),
        objectives: parts.map((label) => ({ label, done: false })),
      };
    }
  }
  const parts = text.split(INLINE_SEP).map((s) => cleanText(s)).filter(Boolean);
  if (parts.length >= 3) {
    return {
      title: parts[0],
      objectives: parts.slice(1).map((label) => ({ label, done: false })),
    };
  }
  return { title: cleanText(text), objectives: [] };
}

function parseNoteStructure(content: string): {
  subject: string | null;
  blocks: ParsedBlock[];
} {
  const lines = content.split(/\r?\n/);
  const hasHeadings = lines.some((l) => /^\s*#{1,6}\s+\S/.test(l));
  let subject: string | null = null;
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;

  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const raw of lines) {
    if (!raw.trim()) continue;

    const heading = raw.match(/^\s*#{1,6}\s+(.+)$/);
    if (heading) {
      const ex = explodeInline(cleanText(heading[1]));
      if (!ex.title) continue;
      if (
        subject === null &&
        blocks.length === 0 &&
        current === null &&
        ex.objectives.length === 0
      ) {
        subject = ex.title; // premier titre « simple » = sujet central
      } else {
        flush();
        current = { title: ex.title, objectives: [...ex.objectives], numbered: false };
      }
      continue;
    }

    const checkbox = raw.match(/^(\s*)(?:[-*+•]\s*)?\[([ xX])\]\s+(.+)$/);
    const numbered = checkbox ? null : raw.match(/^(\s*)\d+[.)]\s+(.+)$/);
    const bullet = checkbox || numbered ? null : raw.match(/^(\s*)[-*+•]\s+(.+)$/);
    const matched = checkbox ?? numbered ?? bullet;
    const indent = matched ? matched[1].length : (raw.match(/^\s*/)?.[0].length ?? 0);
    const text = cleanText(checkbox ? checkbox[3] : matched ? matched[2] : raw);
    if (!text) continue;
    const done = checkbox ? checkbox[2].toLowerCase() === "x" : false;

    if (hasHeadings) {
      // Mode « titres » : le contenu appartient au thème courant.
      if (current) current.objectives.push({ label: text, done });
      else {
        const ex = explodeInline(text);
        blocks.push({ title: ex.title, objectives: ex.objectives, numbered: !!numbered });
      }
    } else if (indent >= 2 && current) {
      // Mode « liste » : ligne indentée = objectif du bloc précédent.
      current.objectives.push({ label: text, done });
    } else {
      // Mode « liste » (1er niveau) : une ligne « Titre : a / b / c » (ou
      // « a / b / c ») devient un bloc titré avec ses éléments en objectifs.
      flush();
      const ex = explodeInline(text);
      current = { title: ex.title, objectives: ex.objectives, numbered: !!numbered };
    }
  }
  flush();

  return {
    subject,
    blocks: blocks
      .slice(0, 30)
      .map((b) => ({ ...b, objectives: b.objectives.slice(0, 30) })),
  };
}

// Convertit une note en un nouveau Canvas structuré : sujet au centre,
// thèmes autour (reliés au sujet), objectifs cochables dans chaque bloc,
// étapes numérotées chaînées entre elles. La note d'origine est conservée.
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

  const { subject, blocks } = parseNoteStructure(note.noteContent ?? "");
  if (blocks.length === 0) {
    throw new Error(
      "La note ne contient pas encore d'idées à structurer — listez des points (- idée) ou des thèmes (# Titre) avant de convertir."
    );
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

  const toObjectives = (list: ParsedObjective[]) =>
    list.map((o) => ({
      id: randomUUID(),
      label: o.label.slice(0, 300),
      done: o.done,
    })) as unknown as Prisma.InputJsonValue;

  // Un bloc central n'existe QUE s'il y a un vrai sujet (« # Titre » seul).
  // Sinon on ne relie rien artificiellement — juste une grille de blocs.
  const n = blocks.length;
  const hasCenter = subject !== null && n > 1;

  let center: { id: string } | null = null;
  const positions: { x: number; y: number }[] = [];

  if (hasCenter) {
    // Carte mentale : sujet au centre, thèmes en cercle autour.
    const cx = 720;
    const cy = 470;
    const radius = n <= 4 ? 300 : n <= 7 ? 390 : 470;
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      positions.push({
        x: Math.max(40, Math.round(cx + radius * Math.cos(angle) - 110)),
        y: Math.max(40, Math.round(cy + radius * Math.sin(angle) - 50)),
      });
    }
    center = await prisma.testNode.create({
      data: {
        roadmapId: canvas.id,
        title: subject!.slice(0, 200),
        x: cx - 110,
        y: cy - 50,
        color: "emerald",
      },
    });
  } else {
    // Grille simple (blocs indépendants).
    for (let i = 0; i < n; i++) {
      positions.push({ x: 60 + (i % 3) * 320, y: 60 + Math.floor(i / 3) * 260 });
    }
  }

  const ids: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const node = await prisma.testNode.create({
      data: {
        roadmapId: canvas.id,
        title: blocks[i].title,
        x: positions[i].x,
        y: positions[i].y,
        color: NODE_COLORS[i % NODE_COLORS.length],
        objectives: toObjectives(blocks[i].objectives),
      },
    });
    ids.push(node.id);
  }

  // Liens (uniquement quand ils ont un sens) :
  // - étapes numérotées : chaînées entre elles (1 → 2 → 3…) ;
  // - s'il y a un sujet central : chaque bloc (hors suite de chaîne) y est relié.
  const edges: { sourceId: string; targetId: string }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const continuesChain = blocks[i].numbered && i > 0 && blocks[i - 1].numbered;
    if (continuesChain) {
      edges.push({ sourceId: ids[i - 1], targetId: ids[i] });
    } else if (center) {
      edges.push({ sourceId: center.id, targetId: ids[i] });
    }
  }
  if (edges.length > 0) {
    await prisma.testEdge.createMany({
      data: edges.map((e) => ({ roadmapId: canvas.id, ...e })),
    });
  }

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
