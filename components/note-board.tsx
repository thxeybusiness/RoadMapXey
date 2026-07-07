"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveNoteAction } from "@/server/actions";

// Bloc-notes plein écran avec enregistrement automatique (débounce 800 ms).
export function NoteBoard({
  roadmapId,
  initialContent,
}: {
  roadmapId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-400">
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
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => save(content)}
        placeholder="Écrivez vos notes ici… (enregistrement automatique)"
        spellCheck
        className="min-h-[70vh] w-full resize-y rounded-2xl border border-amber-200 bg-white p-6 text-[15px] leading-relaxed text-zinc-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-amber-900/60 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </div>
  );
}
