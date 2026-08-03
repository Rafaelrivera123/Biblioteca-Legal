import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

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
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/users/:path*",
    "/api/companies/:path*",
    "/api/validate-documents",
    "/api/documents/import",
    "/api/dashboard/:path*",
  ],
};
