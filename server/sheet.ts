import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Feuille de calcul (moteur Univer) : le classeur complet est stocké en
// snapshot JSON sur la roadmap, scopé au tenant.

const MAX_SNAPSHOT_BYTES = 8_000_000; // ~8 Mo, large pour un classeur

export async function updateSheetData(
  roadmapId: string,
  tenantId: string,
  data: unknown
) {
  const serialized = JSON.stringify(data);
  if (serialized.length > MAX_SNAPSHOT_BYTES) {
    throw new Error("Feuille trop volumineuse pour être sauvegardée");
  }

  const result = await prisma.roadmap.updateMany({
    where: { id: roadmapId, tenantId },
    data: { sheetData: JSON.parse(serialized) as Prisma.InputJsonValue },
  });
  if (result.count === 0) throw new Error("Roadmap introuvable");
}
