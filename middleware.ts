import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

const adminMatcher = [/^\/admin(\/.*)?$/, /^\/api\/v1\/admin(\/.*)?$/];

export default withAuth(
  function middleware(req: NextRequest) {
    const { nextUrl } = req;
    const authData = (req as NextRequest & { nextauth?: { token?: { role?: string } } }).nextauth;
    const isAdminRoute = adminMatcher.some((pattern) => pattern.test(nextUrl.pathname));
    const role = authData?.token?.role;
    if (isAdminRoute && role !== "ADMIN" && role !== "EDITOR") {
      const url = new URL("/auth/sign-in", req.url);
      url.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token?.id),
    },
    pages: {
      signIn: "/auth/sign-in",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/compare/:path*",
    "/bookmarks",
    "/bookmarks/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/compare/library",
    "/api/v1/admin/:path*",
  ],
};
