import { getUserByEmail } from "@/helper/user";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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

        // Slim user for the JWT — no password hash.
        return {
          id: user.id,
          email: user.email,
          name:
            [user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.email,
          role: user.role,
        };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
