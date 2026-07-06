"use client";

import dynamic from "next/dynamic";

// Univer est un moteur 100 % navigateur : chargement dynamique sans SSR.
export const ExcelBoardLazy = dynamic(
  () => import("@/components/excel-board").then((m) => m.ExcelBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[75vh] items-center justify-center rounded-2xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800">
        Chargement de la feuille de calcul…
      </div>
    ),
  }
);
