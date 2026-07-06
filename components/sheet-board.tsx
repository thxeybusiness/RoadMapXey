"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  Underline,
} from "lucide-react";
import { updateSheetCellAction } from "@/server/actions";
import {
  colName,
  evaluateSheet,
  refOf,
  SHEET_COLS,
  SHEET_ROWS,
  type CellStyle,
} from "@/lib/sheet";
import { cn } from "@/lib/utils";

type CellData = { value: string; style: CellStyle | null };

const BG_SWATCHES: { name: string; class: string; swatch: string }[] = [
  { name: "violet", class: "bg-violet-100 dark:bg-violet-950/50", swatch: "bg-violet-300" },
  { name: "blue", class: "bg-blue-100 dark:bg-blue-950/50", swatch: "bg-blue-300" },
  { name: "emerald", class: "bg-emerald-100 dark:bg-emerald-950/50", swatch: "bg-emerald-300" },
  { name: "amber", class: "bg-amber-100 dark:bg-amber-950/50", swatch: "bg-amber-300" },
  { name: "rose", class: "bg-rose-100 dark:bg-rose-950/50", swatch: "bg-rose-300" },
  { name: "cyan", class: "bg-cyan-100 dark:bg-cyan-950/50", swatch: "bg-cyan-300" },
];
const BG_CLASS = Object.fromEntries(BG_SWATCHES.map((s) => [s.name, s.class]));

export function SheetBoard({
  roadmapId,
  initialCells,
}: {
  roadmapId: string;
  initialCells: { ref: string; value: string; style: CellStyle | null }[];
}) {
  const [cells, setCells] = useState<Map<string, CellData>>(
    () =>
      new Map(
        initialCells.map((c) => [c.ref, { value: c.value, style: c.style }])
      )
  );
  const [sel, setSel] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [draft, setDraft] = useState<string | null>(null); // édition en cours
  const editing = useRef(false); // miroir synchrone de draft (frappe rapide)
  const gridRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLInputElement>(null);

  const selRef = refOf(sel.r, sel.c);
  const selCell = cells.get(selRef);

  // Valeurs affichées (formules évaluées).
  const display = useMemo(() => {
    const raw = new Map<string, string>();
    for (const [ref, d] of cells) raw.set(ref, d.value);
    return evaluateSheet(raw);
  }, [cells]);

  function persist(ref: string, data: CellData) {
    updateSheetCellAction(roadmapId, ref, data.value, data.style);
  }

  function setCell(ref: string, patch: Partial<CellData>) {
    setCells((prev) => {
      const nextMap = new Map(prev);
      const current = nextMap.get(ref) ?? { value: "", style: null };
      const next = { ...current, ...patch };
      if (next.value === "" && !next.style) nextMap.delete(ref);
      else nextMap.set(ref, next);
      persist(ref, next);
      return nextMap;
    });
  }

  function commitDraft(move?: { dr: number; dc: number }) {
    if (draft !== null) {
      setCell(selRef, { value: draft });
      setDraft(null);
    }
    editing.current = false;
    if (move) moveSel(move.dr, move.dc);
  }

  function moveSel(dr: number, dc: number) {
    setSel((s) => ({
      r: Math.min(SHEET_ROWS - 1, Math.max(0, s.r + dr)),
      c: Math.min(SHEET_COLS - 1, Math.max(0, s.c + dc)),
    }));
    gridRef.current?.focus();
  }

  function patchStyle(patch: Partial<CellStyle>) {
    const current = cells.get(selRef)?.style ?? {};
    const next = { ...current, ...patch };
    setCell(selRef, { style: next });
    gridRef.current?.focus();
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    // Frappe très rapide : la 2e touche arrive avant que l'éditeur ait le
    // focus → on l'ajoute au brouillon au lieu de l'écraser.
    if (editing.current) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setDraft((d) => (d ?? "") + e.key);
      }
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveSel(...moves[e.key]);
      return;
    }
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      editing.current = true;
      setDraft(selCell?.value ?? "");
      setTimeout(() => editorRef.current?.focus(), 0);
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      setCell(selRef, { value: "" });
      return;
    }
    // Taper directement remplace le contenu (comme Excel).
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      editing.current = true;
      setDraft(e.key);
      setTimeout(() => {
        editorRef.current?.focus();
        const len = editorRef.current?.value.length ?? 1;
        editorRef.current?.setSelectionRange(len, len);
      }, 0);
    }
  }

  const toolBtn =
    "flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800";
  const toolActive = "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300";

  return (
    <div className="space-y-2">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="w-12 select-none rounded-md bg-zinc-100 px-2 py-1.5 text-center text-sm font-semibold dark:bg-zinc-900">
          {selRef}
        </span>
        <input
          value={draft ?? selCell?.value ?? ""}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => { if (draft === null) { editing.current = true; setDraft(selCell?.value ?? ""); } }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitDraft({ dr: 1, dc: 0 }); }
            if (e.key === "Escape") { editing.current = false; setDraft(null); gridRef.current?.focus(); }
          }}
          placeholder="Saisie ou formule, ex. =SOMME(A1:A5)"
          className="h-8 min-w-40 flex-1 rounded-md border border-zinc-200 bg-transparent px-2 font-mono text-sm outline-none focus:border-violet-400 dark:border-zinc-800"
        />
        <span className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
        <button type="button" title="Gras" className={cn(toolBtn, selCell?.style?.bold && toolActive)} onClick={() => patchStyle({ bold: !selCell?.style?.bold })}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="Italique" className={cn(toolBtn, selCell?.style?.italic && toolActive)} onClick={() => patchStyle({ italic: !selCell?.style?.italic })}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" title="Souligné" className={cn(toolBtn, selCell?.style?.underline && toolActive)} onClick={() => patchStyle({ underline: !selCell?.style?.underline })}>
          <Underline className="h-4 w-4" />
        </button>
        <span className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(
          ([al, Icon]) => (
            <button key={al} type="button" title={`Aligner ${al}`} className={cn(toolBtn, (selCell?.style?.align ?? "left") === al && toolActive)} onClick={() => patchStyle({ align: al })}>
              <Icon className="h-4 w-4" />
            </button>
          )
        )}
        <span className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
        {BG_SWATCHES.map((s) => (
          <button
            key={s.name}
            type="button"
            title={`Fond ${s.name}`}
            onClick={() => patchStyle({ bg: selCell?.style?.bg === s.name ? null : s.name })}
            className={cn(
              "h-5 w-5 rounded-full",
              s.swatch,
              selCell?.style?.bg === s.name && "ring-2 ring-zinc-900 ring-offset-1 dark:ring-zinc-100"
            )}
          />
        ))}
        <button type="button" title="Effacer la cellule" className={toolBtn} onClick={() => setCell(selRef, { value: "", style: null })}>
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      {/* Grille */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onGridKeyDown}
        className="max-h-[72vh] overflow-auto rounded-2xl border border-zinc-200 bg-white outline-none focus-visible:ring-2 focus-visible:ring-violet-300 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <table className="border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 h-7 w-10 border-b border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
              {Array.from({ length: SHEET_COLS }, (_, c) => (
                <th
                  key={c}
                  className={cn(
                    "sticky top-0 z-20 h-7 min-w-24 border-b border-r border-zinc-200 bg-zinc-50 px-2 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900",
                    sel.c === c && "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                  )}
                >
                  {colName(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SHEET_ROWS }, (_, r) => (
              <tr key={r}>
                <td
                  className={cn(
                    "sticky left-0 z-10 h-7 border-b border-r border-zinc-200 bg-zinc-50 px-1 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900",
                    sel.r === r && "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                  )}
                >
                  {r + 1}
                </td>
                {Array.from({ length: SHEET_COLS }, (_, c) => {
                  const ref = refOf(r, c);
                  const data = cells.get(ref);
                  const isSel = sel.r === r && sel.c === c;
                  const shown = display.get(ref) ?? "";
                  const st = data?.style;
                  return (
                    <td
                      key={c}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commitDraft();
                        setSel({ r, c });
                        gridRef.current?.focus();
                      }}
                      onDoubleClick={() => {
                        editing.current = true;
                        setDraft(data?.value ?? "");
                        setTimeout(() => editorRef.current?.focus(), 0);
                      }}
                      className={cn(
                        "relative h-7 min-w-24 max-w-48 cursor-cell truncate border-b border-r border-zinc-100 px-1.5 text-sm dark:border-zinc-800/70",
                        st?.bg && BG_CLASS[st.bg],
                        st?.bold && "font-bold",
                        st?.italic && "italic",
                        st?.underline && "underline",
                        st?.align === "center" && "text-center",
                        st?.align === "right" && "text-right",
                        shown.startsWith("#") && "text-red-500",
                        isSel && "outline outline-2 -outline-offset-1 outline-violet-500"
                      )}
                    >
                      {isSel && draft !== null ? (
                        <input
                          ref={editorRef}
                          value={draft}
                          autoFocus
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => commitDraft()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); commitDraft({ dr: 1, dc: 0 }); }
                            else if (e.key === "Tab") { e.preventDefault(); commitDraft({ dr: 0, dc: 1 }); }
                            else if (e.key === "Escape") { editing.current = false; setDraft(null); gridRef.current?.focus(); }
                            e.stopPropagation();
                          }}
                          className="absolute inset-0 z-10 border-2 border-violet-500 bg-white px-1 font-mono text-sm outline-none dark:bg-zinc-950"
                        />
                      ) : (
                        shown
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-400">
        Cliquez une cellule puis tapez. Entrée valide, Tab passe à droite,
        flèches pour naviguer. Formules : =A1+B2, =SOMME(A1:A5), =MOYENNE(…),
        =MIN, =MAX, =NB.
      </p>
    </div>
  );
}
