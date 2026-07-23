// Redirects any request without a valid session to /login, so the entire
// app - not just individual pages - sits behind the single username +
// password screen. Runs before any page or API route is reached, except
// the ones excluded by `config.matcher` below.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
