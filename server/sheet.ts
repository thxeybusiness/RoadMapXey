import { prisma } from "@/lib/prisma";
import { parseRef, type CellStyle } from "@/lib/sheet";
import { Prisma } from "@prisma/client";

// Feuille de calcul : une ligne SheetCell par cellule non vide,
// scopée au tenant via la roadmap.

export async function upsertSheetCell(
  roadmapId: string,
  tenantId: string,
  ref: string,
  value: string,
  style: CellStyle | null
) {
  const normalized = ref.toUpperCase();
  if (!parseRef(normalized)) throw new Error("Référence de cellule invalide");

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, tenantId },
    select: { id: true },
  });
  if (!roadmap) throw new Error("Roadmap introuvable");

  const trimmedValue = value.slice(0, 500);
  const hasStyle =
    style && Object.values(style).some((v) => v !== undefined && v !== null && v !== false);

  // Cellule vide et sans style → on supprime la ligne.
  if (trimmedValue === "" && !hasStyle) {
    await prisma.sheetCell.deleteMany({
      where: { roadmapId: roadmap.id, ref: normalized },
    });
    return;
  }

  const styleJson = (hasStyle ? style : Prisma.JsonNull) as Prisma.InputJsonValue;
  await prisma.sheetCell.upsert({
    where: { roadmapId_ref: { roadmapId: roadmap.id, ref: normalized } },
    create: { roadmapId: roadmap.id, ref: normalized, value: trimmedValue, style: styleJson },
    update: { value: trimmedValue, style: styleJson },
  });
}
