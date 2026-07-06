import { z } from "zod";

// Toutes les entrées utilisateur passent par Zod avant de toucher la DB.

export const signupSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const ROADMAP_TYPES = ["board", "test"] as const;

export const roadmapSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(ROADMAP_TYPES).default("board"),
});

export const ITEM_COLORS = [
  "violet",
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
] as const;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");

export const roadmapItemSchema = z
  .object({
    roadmapId: z.string().cuid(),
    title: z.string().min(1, "Le titre est requis").max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).default("PLANNED"),
    track: z.string().max(60).optional().or(z.literal("")),
    startDate: dateString.optional().or(z.literal("")),
    endDate: dateString.optional().or(z.literal("")),
    color: z.enum(ITEM_COLORS).default("violet"),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "La date de fin doit être après la date de début" }
  );

const halfHour = z
  .number()
  .int()
  .min(0)
  .max(1440)
  .refine((v) => v % 30 === 0, "Créneau de 30 min attendu");

export const dayBlockSchema = z
  .object({
    roadmapId: z.string().cuid(),
    day: dateString,
    title: z.string().min(1, "Le titre est requis").max(200),
    startMinutes: halfHour,
    endMinutes: halfHour,
    color: z.enum(ITEM_COLORS).default("violet"),
  })
  .refine((d) => d.endMinutes > d.startMinutes, {
    message: "L'heure de fin doit être après l'heure de début",
  });

export const checkoutSchema = z.object({
  priceId: z.string().startsWith("price_"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoadmapInput = z.infer<typeof roadmapSchema>;
export type RoadmapItemInput = z.infer<typeof roadmapItemSchema>;
export type DayBlockInput = z.infer<typeof dayBlockSchema>;
