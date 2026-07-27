// Pure wiring - clears the session cookie.
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/pin-session";

// POST /api/logout
// Input: none. Output: clears the session cookie and returns { ok: true }.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
