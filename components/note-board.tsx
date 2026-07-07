"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Network } from "lucide-react";
import { convertNoteToCanvasAction, saveNoteAction } from "@/server/actions";
import { Button } from "@/components/ui/button";

// Bloc-notes plein écran avec enregistrement automatique (débounce 800 ms).
export function NoteBoard({
  roadmapId,
  initialContent,
}: {
  roadmapId: string;
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initialContent);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onChange(value: string) {
    setContent(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), 800);
  }

  async function save(value: string) {
    if (value === lastSaved.current) return;
    setStatus("saving");
    const r = await saveNoteAction(roadmapId, value);
    if (r.ok) {
      lastSaved.current = value;
      setStatus("saved");
    } else {
      setStatus("error");
    }
  }

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Convertit la note en Canvas : chaque ligne devient un bloc réorganisable.
  async function convertToCanvas() {
    setConvertError(null);
    setConverting(true);
    // On enregistre d'abord le texte le plus récent avant de convertir.
    if (timer.current) clearTimeout(timer.current);
    await save(content);
    const r = await convertNoteToCanvasAction(roadmapId);
    if (r.ok && r.data) {
      router.push(`/dashboard/${r.data.id}`);
    } else {
      setConvertError(r.ok ? "Erreur inconnue" : r.error);
      setConverting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>{words} mot{words > 1 ? "s" : ""}</span>
          <span className="flex items-center gap-1.5">
            {status === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…
              </>
            )}
            {status === "saved" && (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Enregistré
              </>
            )}
            {status === "error" && (
              <span className="text-red-500">Échec de l&apos;enregistrement</span>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={convertToCanvas}
          disabled={converting}
          title="Analyse la note (titres, listes, cases, étapes) et génère un Canvas structuré : sujet au centre, thèmes en blocs reliés, sous-points en objectifs cochables"
        >
          {converting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Conversion…
            </>
          ) : (
            <>
              <Network className="h-4 w-4" /> Convertir en Canvas
            </>
          )}
        </Button>
      </div>
      {convertError && <p className="text-sm text-red-600">{convertError}</p>}
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => save(content)}
        placeholder={
          "Écrivez vos notes ici… (enregistrement automatique)\n\n" +
          "Astuce pour la conversion en Canvas :\n" +
          "# Sujet principal\n" +
          "## Un thème\n" +
          "- un sous-point (deviendra un objectif cochable)\n" +
          "[x] une tâche déjà faite\n" +
          "1. des étapes numérotées, reliées dans l'ordre"
        }
        spellCheck
        className="min-h-[70vh] w-full resize-y rounded-2xl border border-amber-200 bg-white p-6 text-[15px] leading-relaxed text-zinc-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-amber-900/60 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <p className="text-xs text-zinc-400">
        Structurez avec <code># Titre</code>, <code>## Thème</code>,{" "}
        <code>- point</code>, <code>[x] tâche</code>, <code>1. étape</code> — la
        conversion en Canvas s&apos;appuie dessus : sujet au centre, thèmes en
        blocs reliés, sous-points en objectifs, étapes chaînées.
      </p>
    </div>
  );
}
