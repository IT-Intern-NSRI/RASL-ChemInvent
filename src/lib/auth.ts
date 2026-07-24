// Better Auth server-side configuration.
//
// This is the single source of truth for how logging in works: a plain
// email/password form, no SSO, no magic links, no multi-factor step - per
// the requirement that the whole app sits behind one simple username +
// password screen. Lab staff use the "email" field as a username; Better
// Auth still calls it "email" internally regardless of what's typed there.
//
// Pure configuration wiring - nothing to implement here. If you change
// providers or add fields later, this is the only file that needs to know.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
