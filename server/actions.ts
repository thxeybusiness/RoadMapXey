"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { auth, signIn, signOut } from "@/lib/auth";
import {
  dayBlockSchema,
  roadmapItemSchema,
  roadmapSchema,
  signupSchema,
} from "@/lib/validations";
import { registerUser, deleteAccount } from "@/server/users";
import {
  createDayBlock,
  createRoadmap,
  createRoadmapItem,
  deleteDayBlock,
  deleteRoadmap,
  deleteRoadmapItem,
  updateItemStatus,
} from "@/server/roadmaps";
import {
  createTestEdge,
  createTestNode,
  deleteTestEdge,
  deleteTestNode,
  updateTestNode,
  type Objective,
} from "@/server/testboard";
import { updateSheetData } from "@/server/sheet";
import type { ActionResult } from "@/types";

// Server Actions : la seule porte d'entrée des mutations depuis l'UI.
// Chaque action re-vérifie la session côté serveur et valide avec Zod.

function toError(error: unknown): { ok: false; error: string } {
  console.error("[action]", error);
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Une erreur est survenue",
  };
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    return toError(error);
  }

  // Connexion automatique après inscription.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
  return { ok: true };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (error) {
    // NextAuth lance une erreur de redirection en cas de succès — la relancer.
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { ok: false, error: "Email ou mot de passe incorrect" };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createRoadmapAction(formData: FormData): Promise<ActionResult> {
  const { userId, tenantId } = await requireUser();

  const parsed = roadmapSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type") ?? "board",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await createRoadmap(userId, tenantId, parsed.data);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteRoadmapAction(roadmapId: string): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await deleteRoadmap(roadmapId, tenantId);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function createItemAction(formData: FormData): Promise<ActionResult> {
  const { userId, tenantId } = await requireUser();

  const parsed = roadmapItemSchema.safeParse({
    roadmapId: formData.get("roadmapId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") ?? "PLANNED",
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    color: formData.get("color") ?? "violet",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await createRoadmapItem(userId, tenantId, parsed.data);
    revalidatePath(`/dashboard/${parsed.data.roadmapId}`);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function updateItemStatusAction(
  itemId: string,
  roadmapId: string,
  status: "PLANNED" | "IN_PROGRESS" | "DONE"
): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await updateItemStatus(itemId, tenantId, status);
    revalidatePath(`/dashboard/${roadmapId}`);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteItemAction(
  itemId: string,
  roadmapId: string
): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await deleteRoadmapItem(itemId, tenantId);
    revalidatePath(`/dashboard/${roadmapId}`);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// ── Planificateur intra-journalier ──────────────────────────────────────────

export async function createDayBlockAction(
  formData: FormData
): Promise<ActionResult> {
  const { tenantId } = await requireUser();

  const parsed = dayBlockSchema.safeParse({
    roadmapId: formData.get("roadmapId"),
    day: formData.get("day"),
    title: formData.get("title"),
    startMinutes: Number(formData.get("startMinutes")),
    endMinutes: Number(formData.get("endMinutes")),
    color: formData.get("color") ?? "violet",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await createDayBlock(tenantId, parsed.data);
    revalidatePath(`/dashboard/${parsed.data.roadmapId}`);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteDayBlockAction(
  blockId: string,
  roadmapId: string
): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await deleteDayBlock(blockId, tenantId);
    revalidatePath(`/dashboard/${roadmapId}`);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// ── Roadmap « canvas » (blocs + liens + objectifs) ──────────────────────────

export async function createTestNodeAction(
  roadmapId: string
): Promise<ActionResult<{ id: string; x: number; y: number }>> {
  const { tenantId } = await requireUser();
  try {
    const node = await createTestNode(roadmapId, tenantId);
    return { ok: true, data: { id: node.id, x: node.x, y: node.y } };
  } catch (error) {
    return toError(error);
  }
}

export async function updateTestNodeAction(
  nodeId: string,
  patch: {
    title?: string;
    x?: number;
    y?: number;
    color?: string;
    objectives?: Objective[];
  }
): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await updateTestNode(nodeId, tenantId, patch);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteTestNodeAction(nodeId: string): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await deleteTestNode(nodeId, tenantId);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function createTestEdgeAction(
  roadmapId: string,
  sourceId: string,
  targetId: string
): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireUser();
  try {
    const edge = await createTestEdge(roadmapId, tenantId, sourceId, targetId);
    return { ok: true, data: { id: edge.id } };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteTestEdgeAction(edgeId: string): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await deleteTestEdge(edgeId, tenantId);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// ── Feuille de calcul (snapshot Univer) ─────────────────────────────────────

export async function saveSheetDataAction(
  roadmapId: string,
  data: unknown
): Promise<ActionResult> {
  // Pas de redirect ici : si la session a expiré en pleine édition, on
  // renvoie une erreur affichable au lieu de détourner la page.
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { ok: false, error: "Session expirée — reconnectez-vous" };
  }
  try {
    await updateSheetData(roadmapId, session.user.tenantId, data);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// RGPD : suppression du compte et de toutes les données, puis déconnexion.
export async function deleteAccountAction(): Promise<ActionResult> {
  const { userId } = await requireUser();
  try {
    await deleteAccount(userId);
  } catch (error) {
    return toError(error);
  }
  await signOut({ redirect: false });
  redirect("/");
}
