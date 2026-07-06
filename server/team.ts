import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/subscription";
import { sendTeamInviteEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/env";

// Espaces d'équipe partagés : plusieurs utilisateurs dans un même tenant
// partagent toutes ses roadmaps. Invitations par email.

export async function getTeam(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { acceptedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function renameTeam(tenantId: string, name: string) {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) throw new Error("Le nom de l'équipe est requis");
  await prisma.tenant.update({ where: { id: tenantId }, data: { name: trimmed } });
}

export async function inviteMember(
  userId: string,
  tenantId: string,
  email: string
) {
  // L'invitation d'équipe est une fonctionnalité des forfaits payants.
  if (!(await isPremium(userId))) {
    throw new Error(
      "Les espaces d'équipe sont réservés aux forfaits payants (Business)."
    );
  }

  const normalized = email.trim().toLowerCase();

  // Déjà membre de l'équipe ?
  const existingMember = await prisma.user.findFirst({
    where: { email: normalized, tenantId },
    select: { id: true },
  });
  if (existingMember) throw new Error("Cette personne fait déjà partie de l'équipe");

  // Invitation en attente déjà existante ?
  const pending = await prisma.invitation.findFirst({
    where: { tenantId, email: normalized, acceptedAt: null },
  });
  const invitation =
    pending ??
    (await prisma.invitation.create({
      data: { tenantId, email: normalized, invitedBy: userId },
    }));

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  await sendTeamInviteEmail(
    normalized,
    tenant?.name ?? "une équipe",
    `${getBaseUrl()}/join/${invitation.token}`
  );

  return invitation;
}

export async function revokeInvitation(invitationId: string, tenantId: string) {
  await prisma.invitation.deleteMany({
    where: { id: invitationId, tenantId },
  });
}

// L'utilisateur connecté rejoint l'équipe liée au token.
export async function joinTeam(userId: string, token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.acceptedAt) {
    throw new Error("Invitation invalide ou déjà utilisée");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });
  if (!user) throw new Error("Compte introuvable");

  if (user.tenantId === invitation.tenantId) {
    // Déjà dans cette équipe : on marque simplement l'invitation acceptée.
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return;
  }

  const oldTenantId = user.tenantId;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { tenantId: invitation.tenantId },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  // Supprime l'ancien espace personnel s'il est désormais vide.
  const remaining = await prisma.user.count({ where: { tenantId: oldTenantId } });
  if (remaining === 0) {
    await prisma.tenant.delete({ where: { id: oldTenantId } }).catch(() => {});
  }
}

// Quitter l'équipe : l'utilisateur repart avec un nouvel espace personnel.
export async function leaveTeam(userId: string, tenantId: string) {
  const memberCount = await prisma.user.count({ where: { tenantId } });
  if (memberCount <= 1) {
    throw new Error("Vous êtes seul dans cet espace — rien à quitter.");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      tenant: { create: { name: `Espace de ${user?.name ?? "mon compte"}` } },
    },
  });
}

export async function getInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: { tenant: { select: { name: true } } },
  });
}
