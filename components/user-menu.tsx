"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CreditCard, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/server/actions";

// Rond avec l'initiale du prénom → menu déroulant (tableau de bord,
// abonnement, paramètres, déconnexion).
export function UserMenu({
  name,
  email,
  founder,
}: {
  name: string;
  email: string;
  founder: boolean;
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
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-base font-semibold text-zinc-900 transition hover:border-violet-400 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-zinc-700 dark:text-zinc-100"
      >
        {initial}
      </button>

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
          {founder && (
            <span className="mx-2.5 mb-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-violet-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              Fondateur
            </span>
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
