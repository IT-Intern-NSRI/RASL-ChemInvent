"use client";

// Wraps the app in a single shared TanStack Query client so
// useDocuments / useDocument / useUpdateEntry all share one cache.
// Pure infrastructure - no UI of its own, nothing to implement.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
