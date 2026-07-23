import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "U.P. NSRI - RASL Chemical Inventory",
  description: "Digital quarterly inventory of priority chemicals",
};

// Root layout: wraps every page in the shared Providers (TanStack Query).
// Pure structural wiring - no visual content of its own beyond <html>/<body>.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
