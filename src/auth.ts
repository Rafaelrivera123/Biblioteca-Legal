import { getUserByEmail, getUserById } from "@/helper/user";
import { prisma } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";

function splitFullName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

const oauthProviders: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauthProviders.push(
    Google({ allowDangerousEmailAccountLinking: true })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  oauthProviders.push(
    Facebook({ allowDangerousEmailAccountLinking: true })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Keep JWT sessions (existing app) while still using the adapter to
  // create/link User + Account rows for OAuth providers.
  session: { strategy: "jwt" },
  providers: [
    ...oauthProviders,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await getUserByEmail(email);
        if (!user?.password) return null;
        if (!user.emailVerified) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name:
            [user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.email,
          role: user.role,
          accountCompleted: user.accountCompleted,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      const { first_name, last_name } = splitFullName(user.name);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          first_name,
          last_name,
          // OAuth users must confirm their account details once.
          accountCompleted: false,
          emailVerified: new Date(),
        },
      });
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      // Always require a real email so we can keep a registry of contacts.
      if (!user.email) {
        return "/login?error=EmailRequired";
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: Role }).role;
        token.accountCompleted = (
          user as { accountCompleted?: boolean }
        ).accountCompleted;
      }

      // Refresh from DB on sign-in and while the account is still incomplete
      // (so /sign-up/complete can unlock the session after saving).
      const shouldRefresh =
        !!token.sub &&
        (!!user || trigger === "update" || token.accountCompleted === false);

      if (shouldRefresh && token.sub) {
        const dbUser = await getUserById(token.sub);
        if (dbUser) {
          token.role = dbUser.role;
          token.accountCompleted = dbUser.accountCompleted;
          token.email = dbUser.email;
          token.name =
            [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") ||
            dbUser.email;
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
  pages: {
    signIn: "/login",
    // New OAuth users land here to confirm name + email and accept terms.
    newUser: "/sign-up/complete",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
