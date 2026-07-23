import { LoginForm } from "@/components/LoginForm";

// PURE FRONTEND (server component): The one unauthenticated page in the
// app. Renders LoginForm centered on the page.
export default function LoginPage() {
  return <LoginForm />;
}
