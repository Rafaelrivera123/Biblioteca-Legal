import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { ensureAuthUrl } from "./lib/ensure-auth-url";

ensureAuthUrl();

// Use the Edge-safe config only — never import `./auth` here (that pulls Prisma).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";
  const accountCompleted = req.auth?.user?.accountCompleted !== false;

  // Force OAuth users to finish creating their account (confirm name + email).
  if (
    isLoggedIn &&
    !accountCompleted &&
    !pathname.startsWith("/sign-up/complete") &&
    !pathname.startsWith("/api/auth") &&
    pathname !== "/logout"
  ) {
    return NextResponse.redirect(new URL("/sign-up/complete", req.url));
  }

  if (pathname.startsWith("/dashboard") && (!isLoggedIn || !isAdmin)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && (!isLoggedIn || !isAdmin)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const adminApiPrefixes = [
    "/api/users",
    "/api/companies",
    "/api/validate-documents",
    "/api/documents/import",
    "/api/dashboard",
  ];

  const isProtectedApi = adminApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedApi && (!isLoggedIn || !isAdmin)) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: isLoggedIn ? 403 : 401 }
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Account-completion gate + admin route protection.
     * Skip static assets, payment webhooks, and local /dev labs.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhook|api/gacetas/upload|dev(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
