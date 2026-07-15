"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/session";
import { auth, signIn, signOut } from "@/lib/auth";
import { recordAttempt, tooManyAttempts } from "@/lib/rate-limit";
import {
  dayBlockSchema,
  roadmapItemSchema,
  roadmapSchema,
  signupSchema,
} from "@/lib/validations";
import { registerUser, deleteAccount } from "@/server/users";
import {
  convertNoteToCanvas,
  createDayBlock,
  createRoadmap,
  createRoadmapItem,
  deleteDayBlock,
  deleteRoadmap,
  deleteRoadmapItem,
  updateItemStatus,
  updateNoteContent,
} from "@/server/roadmaps";
import {
  createTestEdge,
  createTestNode,
  deleteTestEdge,
  deleteTestNode,
  updateTestNode,
  type Objective,
} from "@/server/testboard";
import {
  declineInvitation,
  inviteMember,
  joinTeam,
  leaveTeam,
  renameTeam,
  revokeInvitation,
} from "@/server/team";
import { setUsername } from "@/server/account";
import { resetAccountToFree } from "@/server/admin";
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

// Adresse IP de l'appelant (derrière le proxy Vercel).
async function callerIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
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

  // Anti-création massive de comptes : max 6 inscriptions / heure / IP.
  const ipKey = `signup:${await callerIp()}`;
  if (await tooManyAttempts(ipKey, 6, 60 * 60 * 1000)) {
    return {
      ok: false,
      error: "Trop d'inscriptions depuis ce réseau. Réessayez plus tard.",
    };
  }
  await recordAttempt(ipKey);

  try {
    await registerUser(parsed.data);
  } catch (error) {
    return toError(error);
  }

  // Connexion automatique après inscription.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: safeRedirect(formData.get("callbackUrl")),
  });
  return { ok: true };
}

// N'autorise que des chemins internes en redirection (pas d'URL externe).
function safeRedirect(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeRedirect(formData.get("callbackUrl")),
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

// ── Bloc-notes (type note) ───────────────────────────────────────────────────

export async function saveNoteAction(
  roadmapId: string,
  content: string
): Promise<ActionResult> {
  // Pas de redirect ici : une expiration de session en pleine saisie renvoie
  // une erreur affichable au lieu de détourner la page.
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { ok: false, error: "Session expirée — reconnectez-vous" };
  }
  try {
    await updateNoteContent(roadmapId, session.user.tenantId, content);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// Convertit une note en Canvas (chaque idée → un bloc). Renvoie l'id créé.
export async function convertNoteToCanvasAction(
  noteRoadmapId: string
): Promise<ActionResult<{ id: string }>> {
  const { userId, tenantId } = await requireUser();
  try {
    const id = await convertNoteToCanvas(noteRoadmapId, userId, tenantId);
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (error) {
    return toError(error);
  }
}

// ── Espaces d'équipe partagés ────────────────────────────────────────────────

export async function renameTeamAction(formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await renameTeam(tenantId, String(formData.get("name") ?? ""));
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function inviteMemberAction(formData: FormData): Promise<ActionResult> {
  const { userId, tenantId } = await requireUser();
  // On accepte un email OU un nom d'utilisateur (@pseudo) : la résolution
  // se fait côté serveur (server/team.ts → resolveInviteEmail).
  const target = String(formData.get("target") ?? "").trim();
  if (!target) {
    return { ok: false, error: "Indiquez un email ou un nom d'utilisateur" };
  }
  try {
    await inviteMember(userId, tenantId, target);
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// Choisir / changer son nom d'utilisateur depuis les paramètres.
export async function setUsernameAction(formData: FormData): Promise<ActionResult> {
  const { userId } = await requireUser();
  try {
    await setUsername(userId, String(formData.get("username") ?? ""));
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// Refuser une invitation reçue (adressée à mon email).
export async function declineInvitationAction(
  invitationId: string
): Promise<ActionResult> {
  const { email } = await requireUser();
  try {
    await declineInvitation(invitationId, email);
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function revokeInvitationAction(
  invitationId: string
): Promise<ActionResult> {
  const { tenantId } = await requireUser();
  try {
    await revokeInvitation(invitationId, tenantId);
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function joinTeamAction(token: string): Promise<ActionResult> {
  const { userId } = await requireUser();
  try {
    await joinTeam(userId, token);
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function leaveTeamAction(): Promise<ActionResult> {
  const { userId, tenantId } = await requireUser();
  try {
    await leaveTeam(userId, tenantId);
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

// ── Administration (Fondateur uniquement) ────────────────────────────────────

export async function resetAccountToFreeAction(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const { email } = await requireUser();
  try {
    const r = await resetAccountToFree(email, String(formData.get("email") ?? ""));
    revalidatePath("/settings");
    return {
      ok: true,
      data: {
        message: r.hadSubscription
          ? `${r.email} : abonnement annulé, compte repassé en gratuit.`
          : `${r.email} était déjà en gratuit.`,
      },
    };
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
