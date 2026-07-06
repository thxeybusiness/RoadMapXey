"use client";

import { useEffect, useRef, useState } from "react";
import { saveSheetDataAction } from "@/server/actions";
import { roadmapTheme } from "@/lib/univer-theme";

import "@univerjs/presets/lib/styles/preset-sheets-core.css";
import "@univerjs/presets/lib/styles/preset-sheets-conditional-formatting.css";
import "@univerjs/presets/lib/styles/preset-sheets-data-validation.css";
import "@univerjs/presets/lib/styles/preset-sheets-drawing.css";
import "@univerjs/presets/lib/styles/preset-sheets-filter.css";
import "@univerjs/presets/lib/styles/preset-sheets-find-replace.css";
import "@univerjs/presets/lib/styles/preset-sheets-hyper-link.css";
import "@univerjs/presets/lib/styles/preset-sheets-note.css";
import "@univerjs/presets/lib/styles/preset-sheets-sort.css";
import "@univerjs/presets/lib/styles/preset-sheets-table.css";
import "@univerjs/presets/lib/styles/preset-sheets-thread-comment.css";

// Feuille de calcul complète propulsée par Univer (open source, moteur
// type Excel : ~500 formules, poignée de recopie, fusion, filtres, tri,
// formats, mise en forme conditionnelle, undo/redo, multi-feuilles…).
// Le classeur est sauvegardé automatiquement (snapshot JSON débouncé).

type SaveState = "idle" | "saving" | "saved" | "error";

export function ExcelBoard({
  roadmapId,
  initialData,
}: {
  roadmapId: string;
  initialData: unknown | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let univer: { dispose: () => void } | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let lastSerialized = "";
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    async function boot() {
      const [presets, corePreset, frFR] = await Promise.all([
        import("@univerjs/presets"),
        import("@univerjs/presets/preset-sheets-core"),
        import("@univerjs/presets/preset-sheets-core/locales/fr-FR"),
      ]);
      const [cf, cfFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-conditional-formatting"),
        import("@univerjs/presets/preset-sheets-conditional-formatting/locales/fr-FR"),
      ]);
      const [dv, dvFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-data-validation"),
        import("@univerjs/presets/preset-sheets-data-validation/locales/fr-FR"),
      ]);
      const [drawing, drawingFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-drawing"),
        import("@univerjs/presets/preset-sheets-drawing/locales/fr-FR"),
      ]);
      const [filter, filterFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-filter"),
        import("@univerjs/presets/preset-sheets-filter/locales/fr-FR"),
      ]);
      const [findReplace, findReplaceFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-find-replace"),
        import("@univerjs/presets/preset-sheets-find-replace/locales/fr-FR"),
      ]);
      const [link, linkFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-hyper-link"),
        import("@univerjs/presets/preset-sheets-hyper-link/locales/fr-FR"),
      ]);
      const [note, noteFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-note"),
        import("@univerjs/presets/preset-sheets-note/locales/fr-FR"),
      ]);
      const [sort, sortFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-sort"),
        import("@univerjs/presets/preset-sheets-sort/locales/fr-FR"),
      ]);
      const [table, tableFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-table"),
        import("@univerjs/presets/preset-sheets-table/locales/fr-FR"),
      ]);
      const [comment, commentFr] = await Promise.all([
        import("@univerjs/presets/preset-sheets-thread-comment"),
        import("@univerjs/presets/preset-sheets-thread-comment/locales/fr-FR"),
      ]);

      if (disposed || !containerRef.current) return;

      const { createUniver, LocaleType, mergeLocales } = presets;
      const darkMode =
        typeof document !== "undefined" &&
        (document.documentElement.getAttribute("data-theme") === "dark" ||
          (document.documentElement.getAttribute("data-theme") !== "light" &&
            window.matchMedia?.("(prefers-color-scheme: dark)").matches));
      const result = createUniver({
        locale: LocaleType.FR_FR,
        theme: roadmapTheme,
        darkMode,
        locales: {
          [LocaleType.FR_FR]: mergeLocales(
            frFR.default,
            cfFr.default,
            dvFr.default,
            drawingFr.default,
            filterFr.default,
            findReplaceFr.default,
            linkFr.default,
            noteFr.default,
            sortFr.default,
            tableFr.default,
            commentFr.default
          ),
        },
        presets: [
          corePreset.UniverSheetsCorePreset({ container: containerRef.current }),
          cf.UniverSheetsConditionalFormattingPreset(),
          dv.UniverSheetsDataValidationPreset(),
          drawing.UniverSheetsDrawingPreset(),
          filter.UniverSheetsFilterPreset(),
          findReplace.UniverSheetsFindReplacePreset(),
          link.UniverSheetsHyperLinkPreset(),
          note.UniverSheetsNotePreset(),
          sort.UniverSheetsSortPreset(),
          table.UniverSheetsTablePreset(),
          comment.UniverSheetsThreadCommentPreset(),
        ],
      });
      univer = result.univer;
      const univerAPI = result.univerAPI;

      const snapshot =
        initialData && typeof initialData === "object"
          ? (initialData as Record<string, unknown>)
          : { name: "Feuille de calcul", sheetOrder: [], sheets: {} };
      univerAPI.createWorkbook(snapshot as Parameters<typeof univerAPI.createWorkbook>[0]);
      lastSerialized = JSON.stringify(
        univerAPI.getActiveWorkbook()?.save() ?? null
      );
      setReady(true);

      // Sauvegarde automatique : on compare le snapshot toutes les 2 s et on
      // envoie (débouncé) dès qu'il a changé.
      const trySave = () => {
        const wb = univerAPI.getActiveWorkbook();
        if (!wb) return;
        const snap = wb.save();
        const serialized = JSON.stringify(snap);
        if (serialized === lastSerialized) return;
        lastSerialized = serialized;
        setSaveState("saving");
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          const res = await saveSheetDataAction(roadmapId, snap);
          setSaveState(res.ok ? "saved" : "error");
        }, 600);
      };
      timer = setInterval(trySave, 2000);
    }

    boot().catch((e) => {
      console.error("[excel] échec d'initialisation", e);
      setSaveState("error");
    });

    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      if (saveTimeout) clearTimeout(saveTimeout);
      univer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId]);

  return (
    // Pleine largeur : on casse la contrainte max-w du conteneur de page.
    <div className="relative left-1/2 w-[100vw] -translate-x-1/2 space-y-2 px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>Légende des fonds :</span>
          {[
            { name: "Violet", class: "bg-violet-300" },
            { name: "Bleu", class: "bg-blue-300" },
            { name: "Vert", class: "bg-emerald-300" },
            { name: "Ambre", class: "bg-amber-300" },
            { name: "Rose", class: "bg-rose-300" },
            { name: "Cyan", class: "bg-cyan-300" },
          ].map((c) => (
            <span key={c.name} className="flex items-center gap-1">
              <span className={`h-3 w-3 rounded-full ${c.class}`} />
              {c.name}
            </span>
          ))}
        </div>
        <span className="text-xs text-zinc-400">
          {saveState === "saving" && "Enregistrement…"}
          {saveState === "saved" && "✓ Enregistré"}
          {saveState === "error" && (
            <span className="text-red-500">Erreur d&apos;enregistrement</span>
          )}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800">
        {!ready && (
          <div className="flex h-[86vh] items-center justify-center text-sm text-zinc-400">
            Chargement de la feuille de calcul…
          </div>
        )}
        <div
          ref={containerRef}
          style={{ height: ready ? "86vh" : 0 }}
          className="univer-container"
        />
      </div>
    </div>
  );
}
