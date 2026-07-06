"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Mail, UserMinus, UserPlus, X } from "lucide-react";
import {
  declineInvitationAction,
  inviteMemberAction,
  joinTeamAction,
  leaveTeamAction,
  renameTeamAction,
  revokeInvitationAction,
} from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Member = { id: string; email: string; name: string | null };
type Invitation = { id: string; email: string };
type ReceivedInvitation = { id: string; token: string; teamName: string };

export function TeamSection({
  teamName,
  members,
  invitations,
  received,
  currentUserId,
  canInvite,
}: {
  teamName: string;
  members: Member[];
  invitations: Invitation[];
  received: ReceivedInvitation[];
  currentUserId: string;
  canInvite: boolean;
}) {
  const inviteRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function renameTeam(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await renameTeamAction(formData);
      if (!r.ok) setError(r.error);
    });
  }

  function invite(formData: FormData) {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const r = await inviteMemberAction(formData);
      if (!r.ok) setError(r.error);
      else {
        setDone("Invitation envoyée ✓");
        inviteRef.current?.reset();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Équipe
          <Badge variant="secondary">{members.length} membre(s)</Badge>
        </CardTitle>
        <CardDescription>
          Invitez des collaborateurs : ils partagent toutes les roadmaps de cet
          espace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Invitations reçues : accepter/refuser directement sur le site */}
        {received.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Invitations reçues
            </p>
            {received.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"
              >
                <span className="min-w-0 truncate">
                  Rejoindre <strong>{inv.teamName}</strong>
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await joinTeamAction(inv.token);
                        if (!r.ok) setError(r.error);
                      })
                    }
                  >
                    <UserPlus className="h-4 w-4" /> Accepter
                  </Button>
                  <button
                    type="button"
                    aria-label="Refuser l'invitation"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await declineInvitationAction(inv.id);
                      })
                    }
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nom de l'équipe */}
        <form action={renameTeam} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label htmlFor="team-name" className="text-xs text-zinc-500">
              Nom de l&apos;espace
            </label>
            <Input id="team-name" name="name" defaultValue={teamName} required />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            Renommer
          </Button>
        </form>

        {/* Membres */}
        <div className="space-y-1.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-emerald-100 px-3 py-2 text-sm dark:border-emerald-950/60"
            >
              <div className="min-w-0">
                <span className="font-medium">{m.name || m.email}</span>
                {m.name && (
                  <span className="ml-2 text-xs text-zinc-400">{m.email}</span>
                )}
              </div>
              {m.id === currentUserId && <Badge variant="secondary">Vous</Badge>}
            </div>
          ))}
        </div>

        {/* Invitations en attente */}
        {invitations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Invitations en attente
            </p>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
              >
                <span className="flex items-center gap-2 text-zinc-500">
                  <Mail className="h-4 w-4" /> {inv.email}
                </span>
                <button
                  type="button"
                  aria-label="Annuler l'invitation"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await revokeInvitationAction(inv.id);
                    })
                  }
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inviter */}
        {canInvite ? (
          <form ref={inviteRef} action={invite} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label htmlFor="invite-target" className="text-xs text-zinc-500">
                Inviter par email ou nom d&apos;utilisateur
              </label>
              <Input
                id="invite-target"
                name="target"
                placeholder="collegue@exemple.com ou @pseudo"
                required
              />
            </div>
            <Button type="submit" variant="primary" disabled={pending}>
              Inviter
            </Button>
          </form>
        ) : (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Les espaces d&apos;équipe sont inclus dans le forfait{" "}
            <strong>Business</strong>. Passez à un forfait payant pour inviter
            des collaborateurs.
          </p>
        )}

        {done && (
          <p className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> {done}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Quitter l'équipe (si plusieurs membres) */}
        {members.length > 1 && (
          <div className="border-t border-emerald-100 pt-4 dark:border-emerald-950/60">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (!confirm("Quitter cette équipe ? Vous repartirez avec un espace personnel vide.")) return;
                startTransition(async () => {
                  const r = await leaveTeamAction();
                  if (!r.ok) setError(r.error);
                });
              }}
            >
              <UserMinus className="h-4 w-4" /> Quitter l&apos;équipe
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
