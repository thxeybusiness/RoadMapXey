import { Crown } from "lucide-react";

// Grade « Fondateur » : badge distinctif doré/violet, accès illimité.
export function FounderBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-violet-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
      <Crown className="h-3.5 w-3.5" />
      Fondateur
    </span>
  );
}
