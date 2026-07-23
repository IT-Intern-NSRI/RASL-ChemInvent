// Better Auth client-side helpers, used from client components: the login
// form (signIn), a logout button (signOut), and anywhere that needs to read
// the current session on the client (useSession).
//
// Pure configuration wiring - nothing to implement here.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
});

export const { signIn, signOut, useSession } = authClient;
