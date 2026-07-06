"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Map, Network, Plus, Table2 } from "lucide-react";
import { createRoadmapAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPES = [
  {
    value: "board",
    label: "Tableau",
    hint: "Timeline",
    Icon: Map,
    active: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    value: "test",
    label: "Canvas",
    hint: "Blocs & objectifs",
    Icon: Network,
    active: "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    value: "test2",
    label: "Feuille",
    hint: "Type Excel",
    Icon: Table2,
    active: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
] as const;

export function RoadmapForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("board");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    startTransition(async () => {
      const result = await createRoadmapAction(formData);
      if (!result.ok) setError(result.error);
      else {
        formRef.current?.reset();
        setType("board");
      }
    });
  }

  return (
    <Card className="rb-reveal overflow-hidden">
      <div className="rb-gradient h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Plus className="h-4 w-4" />
          </span>
          Nouvelle roadmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" placeholder="Roadmap produit 2026" required />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(({ value, label, hint, Icon, active }) => {
                const selected = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? `${active} shadow-sm`
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-semibold leading-none">{label}</span>
                    <span className="text-[10px] leading-none opacity-70">{hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Les grands chantiers de l'année…"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            disabled={pending}
            className="w-full"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Création…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Créer la roadmap
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
