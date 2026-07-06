"use client";

import { useState, useTransition } from "react";
import { AtSign, Check } from "lucide-react";
import { setUsernameAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Choix / modification du nom d'utilisateur. Sert d'identifiant public :
// on peut être invité dans une équipe via son @pseudo (sans email).
export function UsernameCard({ username }: { username: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const r = await setUsernameAction(formData);
      if (!r.ok) setError(r.error);
      else setDone(true);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nom d&apos;utilisateur</CardTitle>
        <CardDescription>
          Votre identifiant public. Vos collègues peuvent vous inviter dans une
          équipe grâce à lui, sans connaître votre email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={submit} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label htmlFor="username" className="text-xs text-zinc-500">
              @pseudo
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="username"
                name="username"
                defaultValue={username}
                pattern="[a-z0-9_]{3,20}"
                title="3 à 20 caractères : minuscules, chiffres et tiret bas"
                className="pl-9"
                required
              />
            </div>
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            Enregistrer
          </Button>
        </form>
        {done && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Nom d&apos;utilisateur mis à jour
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
