"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinTeamAction } from "@/server/actions";
import { Button } from "@/components/ui/button";

export function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await joinTeamAction(token);
            if (!r.ok) setError(r.error);
            else router.push("/dashboard");
          })
        }
      >
        {pending ? "Adhésion…" : "Rejoindre l'équipe"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
