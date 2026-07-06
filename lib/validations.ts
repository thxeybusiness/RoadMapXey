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

export const roadmapSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().max(2000).optional(),
});

export const ITEM_COLORS = [
  "violet",
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
] as const;

const monthString = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format attendu : "2026-07"');

export const roadmapItemSchema = z
  .object({
    roadmapId: z.string().cuid(),
    title: z.string().min(1, "Le titre est requis").max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).default("PLANNED"),
    track: z.string().max(60).optional().or(z.literal("")),
    startMonth: monthString.optional().or(z.literal("")),
    endMonth: monthString.optional().or(z.literal("")),
    color: z.enum(ITEM_COLORS).default("violet"),
  })
  .refine(
    (data) =>
      !data.startMonth || !data.endMonth || data.endMonth >= data.startMonth,
    { message: "Le mois de fin doit être après le mois de début" }
  );

export const checkoutSchema = z.object({
  priceId: z.string().startsWith("price_"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoadmapInput = z.infer<typeof roadmapSchema>;
export type RoadmapItemInput = z.infer<typeof roadmapItemSchema>;
