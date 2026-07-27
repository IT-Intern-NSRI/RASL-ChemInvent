// Replaces Better Auth entirely: instead of individual accounts, the whole
// app sits behind one shared PIN. This is a deliberate simplification for
// a small internal tool - see README.md "Authentication" for the reasoning
// and trade-offs.
//
// Built entirely on the Web Crypto API (globalThis.crypto.subtle) rather
// than Node's `crypto` module on purpose: this same code needs to run both
// in middleware.ts (Next.js Middleware always runs on the Edge Runtime,
// which cannot use Node's `crypto` module) and in ordinary API routes
// (normal Node.js runtime). Web Crypto is available and identical in both,
// which sidesteps the exact class of bug that broke the previous
// Prisma-based auth check in middleware.

const PIN_HASH_HEX =
  "9452686aafa83b54443517bef9b0855e22fd5afe3cb7fdc57480ff27f05acb33"; // sha256("raslrasl")

export const SESSION_COOKIE_NAME = "chem_inventory_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env."
    );
  }
  return secret;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares two strings without short-circuiting on the first mismatched
// character, to avoid leaking information via response-time differences.
// Not critical for a low-stakes internal tool, but cheap to do properly.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// def verifyPin(pin): Input is the plaintext PIN the user typed into the
// login form. Output is a boolean - true if it hashes to the hardcoded
// PIN_HASH_HEX above.
export async function verifyPin(pin: string): Promise<boolean> {
  const candidateHash = await sha256Hex(pin);
  return timingSafeEqual(candidateHash, PIN_HASH_HEX);
}

// def createSessionToken(): Input is nothing. Output is a signed token
// string (an expiry timestamp plus an HMAC signature over it, both hex-
// encoded) suitable for storing directly as a cookie value. Called once,
// right after a correct PIN is submitted.
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const signature = await hmacHex(getSecret(), String(expiresAt));
  return `${expiresAt}.${signature}`;
}

// def verifySessionToken(token): Input is a cookie value (or undefined, if
// no cookie was sent). Output is a boolean - true only if the token is
// well-formed, its signature matches (proving it was issued by this
// server, not forged), and it hasn't expired.
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = await hmacHex(getSecret(), expiresAtRaw);
  return timingSafeEqual(signature, expectedSignature);
}

// def isAuthenticated(request): Input is an incoming API request. Output
// is a boolean - true if it carries a valid session cookie. A thin
// convenience wrapper so every API route does the same
// "read cookie, verify it" two-liner instead of repeating
// request.cookies.get(...) + verifySessionToken(...) five times over.
export async function isAuthenticated(request: {
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
