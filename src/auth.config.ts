import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-compatible Auth.js config (no Prisma / Node-only imports).
 * Used by middleware. Providers that need the DB live in `auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  providers: [],
  callbacks: {
    authorized() {
      // Route protection is handled explicitly in middleware.ts
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role;
        if ((user as { accountCompleted?: boolean }).accountCompleted !== undefined) {
          token.accountCompleted = (
            user as { accountCompleted?: boolean }
          ).accountCompleted;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.accountCompleted = token.accountCompleted !== false;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
