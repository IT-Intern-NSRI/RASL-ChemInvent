import { StartupScreen } from "@/components/StartupScreen";

// PURE FRONTEND (server component): The app's root route. Renders
// StartupScreen. Because of middleware.ts, this route is only ever reached
// by an authenticated user - an unauthenticated visit is redirected to
// /login before this component runs.
export default function HomePage() {
  return <StartupScreen />;
}
