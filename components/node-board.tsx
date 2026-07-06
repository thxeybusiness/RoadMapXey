"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Link2, Plus, Trash2, X } from "lucide-react";
import {
  createTestEdgeAction,
  createTestNodeAction,
  deleteTestEdgeAction,
  deleteTestNodeAction,
  updateTestNodeAction,
} from "@/server/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Objective = { id: string; label: string; done: boolean };
type Node = {
  id: string;
  title: string;
  x: number;
  y: number;
  color: string;
  objectives: Objective[];
};
type Edge = { id: string; sourceId: string; targetId: string };

const NODE_WIDTH = 236;
const COLORS = ["violet", "blue", "emerald", "amber", "rose", "cyan"];

const CARD_COLORS: Record<string, string> = {
  violet: "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40",
  blue: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
  emerald: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
  amber: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
  rose: "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40",
  cyan: "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/40",
};
const DOT_COLORS: Record<string, string> = {
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  cyan: "bg-cyan-400",
};
// Couleur de trait (dégradé des liens) par couleur de bloc.
const STROKE_HEX: Record<string, string> = {
  violet: "#8b5cf6",
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
};

const CANVAS_W = 6000;
const CANVAS_H = 4000;

function isComplete(n: Node) {
  return n.objectives.length > 0 && n.objectives.every((o) => o.done);
}

// Couleur effective d'un bloc : vert s'il est complet, sinon sa couleur.
function edgeColor(n: Node) {
  return isComplete(n) ? STROKE_HEX.emerald : STROKE_HEX[n.color] ?? STROKE_HEX.violet;
}

// Point où le segment (centre→cible) coupe le bord du rectangle du bloc,
// pour que le trait frôle le bord au lieu de passer derrière.
function borderPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  tx: number,
  ty: number
) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale = Math.min(
    dx !== 0 ? w / 2 / Math.abs(dx) : Infinity,
    dy !== 0 ? h / 2 / Math.abs(dy) : Infinity
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function NodeBoard({
  roadmapId,
  initialNodes,
  initialEdges,
}: {
  roadmapId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [connecting, setConnecting] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const observers = useRef<Record<string, ResizeObserver>>({});

  // Mesure la taille réelle de chaque bloc (hauteur variable selon les
  // objectifs) pour ancrer les liens sur les bords.
  const measureRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (!el) {
        observers.current[id]?.disconnect();
        delete observers.current[id];
        return;
      }
      const update = () =>
        setSizes((s) => {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          if (s[id]?.w === w && s[id]?.h === h) return s;
          return { ...s, [id]: { w, h } };
        });
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      observers.current[id] = ro;
    },
    []
  );

  function sizeOf(id: string) {
    return sizes[id] ?? { w: NODE_WIDTH, h: 90 };
  }

  // Persiste un bloc (patch complet) en base, sans recharger le canvas.
  const persist = useCallback((n: Node) => {
    updateTestNodeAction(n.id, {
      title: n.title,
      x: n.x,
      y: n.y,
      color: n.color,
      objectives: n.objectives,
    });
  }, []);

  function patchNode(id: string, patch: Partial<Node>, save = true) {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const next = { ...n, ...patch };
        if (save) persist(next);
        return next;
      })
    );
  }

  async function addNode() {
    const result = await createTestNodeAction(roadmapId);
    if (result.ok && result.data) {
      setNodes((prev) => [
        ...prev,
        {
          id: result.data!.id,
          title: "Nouveau bloc",
          x: result.data!.x,
          y: result.data!.y,
          color: "violet",
          objectives: [],
        },
      ]);
    }
  }

  function removeNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.sourceId !== id && e.targetId !== id));
    deleteTestNodeAction(id);
  }

  function removeEdge(id: string) {
    setEdges((prev) => prev.filter((e) => e.id !== id));
    deleteTestEdgeAction(id);
  }

  // ── Objectifs ──
  function addObjective(nodeId: string, label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const obj: Objective = { id: crypto.randomUUID(), label: trimmed, done: false };
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const next = { ...n, objectives: [...n.objectives, obj] };
        persist(next);
        return next;
      })
    );
  }
  function toggleObjective(nodeId: string, objId: string) {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const next = {
          ...n,
          objectives: n.objectives.map((o) =>
            o.id === objId ? { ...o, done: !o.done } : o
          ),
        };
        persist(next);
        return next;
      })
    );
  }
  function removeObjective(nodeId: string, objId: string) {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const next = { ...n, objectives: n.objectives.filter((o) => o.id !== objId) };
        persist(next);
        return next;
      })
    );
  }

  // ── Liens ──
  function onNodeSelect(id: string) {
    if (!connecting) return;
    if (linkSource === null) {
      setLinkSource(id);
    } else if (linkSource !== id) {
      createTestEdgeAction(roadmapId, linkSource, id).then((r) => {
        if (r.ok && r.data) {
          setEdges((prev) =>
            prev.some((e) => e.id === r.data!.id)
              ? prev
              : [...prev, { id: r.data!.id, sourceId: linkSource!, targetId: id }]
          );
        }
      });
      setLinkSource(null);
      setConnecting(false);
    }
  }

  // ── Drag : cliquer-glisser n'importe où sur le bloc (sauf les contrôles) ──
  function onCardPointerDown(e: React.PointerEvent, node: Node) {
    if (connecting) {
      onNodeSelect(node.id);
      return;
    }
    // Ne pas déclencher le déplacement en interagissant avec un champ/bouton.
    if ((e.target as HTMLElement).closest("input, button, textarea")) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    drag.current = {
      id: node.id,
      offX: e.clientX - rect.left + canvasRef.current!.scrollLeft - node.x,
      offY: e.clientY - rect.top + canvasRef.current!.scrollTop - node.y,
    };
    canvasRef.current!.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left + canvasRef.current!.scrollLeft - drag.current.offX);
    const y = Math.max(0, e.clientY - rect.top + canvasRef.current!.scrollTop - drag.current.offY);
    patchNode(drag.current.id, { x, y }, false);
  }
  function onPointerUp() {
    if (!drag.current) return;
    const node = nodes.find((n) => n.id === drag.current!.id);
    if (node) persist(node);
    drag.current = null;
  }

  // Points d'ancrage des liens sur les bords des deux blocs.
  function edgePoints(edge: Edge) {
    const s = nodes.find((n) => n.id === edge.sourceId);
    const t = nodes.find((n) => n.id === edge.targetId);
    if (!s || !t) return null;
    const ss = sizeOf(s.id);
    const ts = sizeOf(t.id);
    const sc = { x: s.x + ss.w / 2, y: s.y + ss.h / 2 };
    const tc = { x: t.x + ts.w / 2, y: t.y + ts.h / 2 };
    return {
      a: borderPoint(sc.x, sc.y, ss.w, ss.h, tc.x, tc.y),
      b: borderPoint(tc.x, tc.y, ts.w, ts.h, sc.x, sc.y),
      colorA: edgeColor(s),
      colorB: edgeColor(t),
    };
  }

  return (
    <div className="space-y-3">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={addNode}>
          <Plus className="h-4 w-4" /> Ajouter un bloc
        </Button>
        <Button
          size="sm"
          variant={connecting ? "default" : "outline"}
          onClick={() => {
            setConnecting((c) => !c);
            setLinkSource(null);
          }}
        >
          <Link2 className="h-4 w-4" />
          {connecting ? "Choisissez deux blocs…" : "Relier"}
        </Button>
        {connecting && (
          <Button size="sm" variant="ghost" onClick={() => { setConnecting(false); setLinkSource(null); }}>
            <X className="h-4 w-4" /> Annuler
          </Button>
        )}
        <p className="text-xs text-zinc-400">
          Glissez les blocs pour les déplacer. Cochez les objectifs — un bloc
          entièrement coché passe en vert.
        </p>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative h-[70vh] overflow-auto rounded-2xl border border-zinc-200 bg-[radial-gradient(circle,theme(colors.zinc.200)_1px,transparent_1px)] [background-size:20px_20px] dark:border-zinc-800 dark:bg-[radial-gradient(circle,theme(colors.zinc.800)_1px,transparent_1px)]"
      >
        <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
          {/* Liens : trait qui frôle les bords, dégradé entre les 2 couleurs */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              {edges.map((e) => {
                const p = edgePoints(e);
                if (!p) return null;
                return (
                  <linearGradient
                    key={`grad-${e.id}`}
                    id={`grad-${e.id}`}
                    gradientUnits="userSpaceOnUse"
                    x1={p.a.x}
                    y1={p.a.y}
                    x2={p.b.x}
                    y2={p.b.y}
                  >
                    <stop offset="0%" stopColor={p.colorA} />
                    <stop offset="100%" stopColor={p.colorB} />
                  </linearGradient>
                );
              })}
            </defs>
            {edges.map((e) => {
              const p = edgePoints(e);
              if (!p) return null;
              const mx = (p.a.x + p.b.x) / 2;
              const my = (p.a.y + p.b.y) / 2;
              return (
                <g key={e.id}>
                  <line
                    x1={p.a.x}
                    y1={p.a.y}
                    x2={p.b.x}
                    y2={p.b.y}
                    stroke={`url(#grad-${e.id})`}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={mx}
                    cy={my}
                    r={8}
                    className="pointer-events-auto cursor-pointer fill-white stroke-zinc-300 hover:fill-red-50 dark:fill-zinc-900"
                    onClick={() => removeEdge(e.id)}
                  />
                  <text
                    x={mx}
                    y={my + 3}
                    textAnchor="middle"
                    className="pointer-events-none fill-red-500 text-[10px]"
                  >
                    ×
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Blocs */}
          {nodes.map((node) => {
            const complete = isComplete(node);
            const done = node.objectives.filter((o) => o.done).length;
            return (
              <div
                key={node.id}
                ref={measureRef(node.id)}
                onPointerDown={(e) => onCardPointerDown(e, node)}
                className={cn(
                  "absolute w-[236px] rounded-xl border shadow-sm transition-[background,border-color] duration-500",
                  connecting
                    ? "cursor-pointer"
                    : "cursor-grab active:cursor-grabbing",
                  complete
                    ? "border-emerald-400 bg-gradient-to-br from-emerald-100 to-emerald-300 dark:from-emerald-900/60 dark:to-emerald-700/50"
                    : CARD_COLORS[node.color] ?? CARD_COLORS.violet,
                  connecting && "ring-2 ring-offset-2 dark:ring-offset-zinc-950",
                  connecting && linkSource === node.id
                    ? "ring-violet-500"
                    : connecting
                      ? "ring-transparent hover:ring-violet-300"
                      : ""
                )}
                style={{ left: node.x, top: node.y }}
              >
                {/* En-tête */}
                <div className="flex items-center gap-1 rounded-t-xl px-2 py-1.5">
                  {complete && <Check className="h-4 w-4 shrink-0 text-emerald-700" />}
                  <input
                    value={node.title}
                    onChange={(e) => patchNode(node.id, { title: e.target.value }, false)}
                    onBlur={() => persist(node)}
                    onPointerDown={(e) => !connecting && e.stopPropagation()}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Supprimer le bloc"
                    onClick={() => removeNode(node.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-white/60 hover:text-red-600 dark:hover:bg-black/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Objectifs */}
                <div className="space-y-1 px-2 pb-2">
                  {node.objectives.map((o) => (
                    <div key={o.id} className="group flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={o.done}
                        onChange={() => toggleObjective(node.id, o.id)}
                        className="h-3.5 w-3.5 shrink-0 accent-emerald-600"
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-xs",
                          o.done && "text-zinc-400 line-through"
                        )}
                      >
                        {o.label}
                      </span>
                      <button
                        type="button"
                        aria-label="Supprimer l'objectif"
                        onClick={() => removeObjective(node.id, o.id)}
                        className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-white/60 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <ObjectiveInput onAdd={(label) => addObjective(node.id, label)} />

                  {/* Pied : compteur + palette de couleurs */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-400">
                      {node.objectives.length > 0
                        ? `${done}/${node.objectives.length} objectif(s)`
                        : "Aucun objectif"}
                    </span>
                    <div className="flex items-center gap-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Couleur ${c}`}
                          onClick={() => patchNode(node.id, { color: c })}
                          className={cn(
                            "h-3 w-3 rounded-full",
                            DOT_COLORS[c],
                            node.color === c && "ring-2 ring-zinc-900 ring-offset-1 dark:ring-zinc-100"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {nodes.length === 0 && (
            <p className="absolute left-1/2 top-24 -translate-x-1/2 text-sm text-zinc-400">
              Cliquez sur « Ajouter un bloc » pour commencer votre roadmap.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ObjectiveInput({ onAdd }: { onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onAdd(value);
          setValue("");
        }
      }}
      placeholder="+ objectif (Entrée)"
      className="w-full rounded border border-transparent bg-white/40 px-1.5 py-0.5 text-xs outline-none placeholder:text-zinc-400 focus:border-zinc-300 dark:bg-black/20 dark:focus:border-zinc-700"
    />
  );
}
