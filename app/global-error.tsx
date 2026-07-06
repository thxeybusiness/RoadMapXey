"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Les erreurs de rendu sont catchées et remontées à Sentry —
// jamais de crash silencieux.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 font-sans">
        <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
        <p className="text-zinc-500">Notre équipe a été prévenue.</p>
        <button
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
