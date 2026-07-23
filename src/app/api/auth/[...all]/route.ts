// Mounts every Better Auth endpoint (sign-in, sign-out, session check,
// etc.) under /api/auth/*. Pure wiring - Better Auth owns the actual logic,
// so there is nothing to implement here.
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
