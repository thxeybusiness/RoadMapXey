import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { getAuthSecret } from "@/lib/env";
import { recordAttempt, tooManyAttempts } from "@/lib/rate-limit";

// Auth déléguée à NextAuth (Auth.js) — on ne code pas la crypto de session
// soi-même. Sessions JWT : pas de table de sessions à gérer.
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const key = `login:${email}`;

        // Trop d'échecs récents sur ce compte → on refuse (anti-force brute).
        if (await tooManyAttempts(key, 8, 15 * 60 * 1000)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = user
          ? await bcrypt.compare(parsed.data.password, user.passwordHash)
          : false;

        if (!user || !valid) {
          await recordAttempt(key);
          return null;
        }

        return { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
  },
});
