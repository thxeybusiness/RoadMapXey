import type { Roadmap, RoadmapItem, Subscription, User } from "@prisma/client";

export type Plan = "free" | "premium";

export type RoadmapWithItems = Roadmap & { items: RoadmapItem[] };

export type UserWithSubscription = User & { subscription: Subscription | null };

// Résultat standard des Server Actions : jamais de crash silencieux,
// toujours un succès ou une erreur explicite affichable.
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
