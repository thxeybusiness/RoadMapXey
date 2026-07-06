"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Crown, CreditCard, LayoutDashboard, LogOut, Settings, Star } from "lucide-react";
import { logoutAction } from "@/server/actions";
import { GradeBadge } from "@/components/grade-badge";
import type { Grade } from "@/lib/grades";

// Symbole du grade affiché en pastille sur l'avatar.
const GRADE_MARK: Record<Grade, { Icon: typeof Crown; className: string }> = {
  founder: { Icon: Crown, className: "bg-gradient-to-br from-emerald-400 to-emerald-600" },
  vip: { Icon: Star, className: "bg-gradient-to-br from-yellow-400 to-amber-500" },
};

// Rond avec l'initiale du prénom → menu déroulant (tableau de bord,
// abonnement, paramètres, déconnexion).
export function UserMenu({
  name,
  email,
  grade,
}: {
  name: string;
  email: string;
  grade: Grade | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const item =
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu du compte"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-base font-semibold text-zinc-900 transition hover:border-emerald-400 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-zinc-700 dark:text-zinc-100"
      >
        {initial}
      </button>

      {/* Symbole du grade en bas à droite de l'avatar */}
      {grade &&
        (() => {
          const { Icon, className } = GRADE_MARK[grade];
          return (
            <span
              aria-hidden
              className={`pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#dceee2] shadow-sm dark:border-[#0a1210] ${className}`}
            >
              <Icon className="h-2.5 w-2.5 text-white" />
            </span>
          );
        })()}

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center gap-3 px-2.5 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-sm font-semibold dark:border-zinc-700">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name || "Mon compte"}</p>
              <p className="truncate text-xs text-zinc-400">{email}</p>
            </div>
          </div>
          {grade && (
            <div className="mx-2.5 mb-1">
              <GradeBadge grade={grade} />
            </div>
          )}

          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          <Link href="/dashboard" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4 text-zinc-400" />
            Tableau de bord
          </Link>
          <Link href="/settings" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <CreditCard className="h-4 w-4 text-zinc-400" />
            Abonnement & facturation
          </Link>
          <Link href="/settings" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4 text-zinc-400" />
            Paramètres du compte
          </Link>

          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className={`${item} w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40`}
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
