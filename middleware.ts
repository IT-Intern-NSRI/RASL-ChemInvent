// Redirects any request without a session cookie to /login, so the entire
// app - not just individual pages - sits behind the single username +
// password screen.
//
// Important: this deliberately checks only whether a session cookie is
// *present* (via Better Auth's getSessionCookie), not whether it's still
// valid - Next.js Middleware always runs on the Edge Runtime, which cannot
// run Prisma's standard client (it needs Node.js APIs/native binaries that
// don't exist on Edge). Calling the database-backed auth.api.getSession()
// here would silently fail to work at all - which is exactly what an
// earlier version of this file did: it looked correct, but the redirect
// never actually fired, logged in or not.
//
// Real validation still happens downstream: every API route already calls
// auth.api.getSession() itself (route handlers run in the normal Node.js
// runtime, where Prisma works fine), so a present-but-expired/invalid
// cookie still gets correctly rejected with a 401 there - this middleware
// is just a fast, database-free first gate to keep a logged-out visitor
// from seeing any page at all.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
