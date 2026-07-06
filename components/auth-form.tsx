"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthForm({
  mode,
  callbackUrl,
}: {
  mode: "login" | "signup";
  callbackUrl?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignup = mode === "signup";
  const cbSuffix = callbackUrl
    ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "";

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isSignup
        ? await signupAction(formData)
        : await loginAction(formData);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignup ? "Créer un compte" : "Connexion"}</CardTitle>
        <CardDescription>
          {isSignup
            ? "Commencez gratuitement, sans carte bancaire."
            : "Content de vous revoir !"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          {callbackUrl && (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          )}
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" placeholder="Marie Dupont" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Chargement…"
              : isSignup
                ? "Créer mon compte"
                : "Se connecter"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          {isSignup ? (
            <>
              Déjà un compte ?{" "}
              <Link href={`/login${cbSuffix}`} className="underline">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href={`/signup${cbSuffix}`} className="underline">
                S&apos;inscrire
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
