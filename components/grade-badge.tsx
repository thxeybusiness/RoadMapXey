import { Crown, Star } from "lucide-react";
import { GRADE_LABEL, type Grade } from "@/lib/grades";

// Badge de grade : Fondateur (vert) ou VIP (or). Accès illimité.
const STYLES: Record<Grade, { className: string; Icon: typeof Crown }> = {
  founder: {
    className: "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600",
    Icon: Crown,
  },
  vip: {
    className: "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500",
    Icon: Star,
  },
};

export function GradeBadge({ grade }: { grade: Grade }) {
  const { className, Icon } = STYLES[grade];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {GRADE_LABEL[grade]}
    </span>
  );
}
