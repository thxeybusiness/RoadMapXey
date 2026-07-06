import { PrismaClient } from "@prisma/client";

// Singleton Prisma : évite d'épuiser le pool de connexions en dev
// (chaque hot-reload créerait sinon un nouveau client).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
