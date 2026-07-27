// Redirects any request without a valid signed session cookie to /login,
// so the entire app - not just individual pages - sits behind the shared
// PIN. Runs before any page or API route is reached, except the ones
// excluded by `config.matcher` below.
//
// This performs full, real verification (signature + expiry), not just a
// presence check - unlike the previous Better-Auth-based version of this
// file, verifySessionToken has no database dependency at all, so there's
// nothing here that's incompatible with the Edge Runtime middleware always
// runs on. See src/lib/pin-session.ts for why that mattered.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/pin-session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);

  if (!isValid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico).*)"],
};
