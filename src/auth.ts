import { getUserByEmail, getUserById } from "@/helper/user";
import { Role } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await getUserByEmail(credentials.email as string);
        if (!user) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.role = token.role as Role;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      const data = await getUserById(token.sub);
      if (!data) return token;
      token.role = data.role;
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
