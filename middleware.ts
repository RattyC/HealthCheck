import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

const adminMatcher = [/^\/admin(\/.*)?$/, /^\/api\/v1\/admin(\/.*)?$/];
const authRequiredMatcher = [
  /^\/admin(\/.*)?$/,
  /^\/api\/v1\/admin(\/.*)?$/,
  /^\/compare(\/.*)?$/,
  /^\/bookmarks(\/.*)?$/,
  /^\/dashboard(\/.*)?$/,
];

const isProd = process.env.NODE_ENV === "production";

function applySecurityHeaders(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), accelerometer=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "font-src 'self' data:",
    ].join("; ")
  );
  if (isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  return response;
}

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

    if (pathname === "/api/healthz") {
      return applySecurityHeaders(NextResponse.next(), requestId);
    }

    const authData = (req as NextRequest & { nextauth?: { token?: { role?: string } } }).nextauth;
    const role = authData?.token?.role;
    const isAdminRoute = adminMatcher.some((pattern) => pattern.test(pathname));
    if (isAdminRoute && role !== "ADMIN" && role !== "EDITOR") {
      const url = new URL("/auth/sign-in", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return applySecurityHeaders(NextResponse.redirect(url), requestId);
    }

    return applySecurityHeaders(NextResponse.next(), requestId);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = (req as NextRequest).nextUrl.pathname;
        const requiresAuth = authRequiredMatcher.some((pattern) => pattern.test(pathname));
        if (!requiresAuth) return true;
        return Boolean(token?.id);
      },
    },
    pages: {
      signIn: "/auth/sign-in",
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
