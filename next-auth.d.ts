import { Role } from "@prisma/client";
import { type DefaultSession } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";

export type ExtendedUser = DefaultSession["user"] & {
  role: Role;
  accountCompleted: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  interface User {
    role?: Role;
    accountCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: Role;
    accountCompleted?: boolean;
  }
}
