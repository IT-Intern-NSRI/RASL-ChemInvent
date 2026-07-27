// Pure wiring around verifyPin/createSessionToken - see pin-session.ts for
// the actual logic.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPin, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/pin-session";

const bodySchema = z.object({ pin: z.string() });

// POST /api/login
// Input: JSON body { pin: string } - what the user typed into the login
// form. Output: on a correct PIN, sets the signed session cookie and
// returns { ok: true }; on an incorrect PIN, returns 401 with no cookie.
export async function POST(request: NextRequest) {
  const body = bodySchema.parse(await request.json());

  const isCorrect = await verifyPin(body.pin);
  if (!isCorrect) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days, matches SESSION_DURATION_MS in pin-session.ts
  });
  return response;
}
