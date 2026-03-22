import type { ReactNode } from "react";

export const metadata = {
  title: "VegFru API",
  description: "Convex-backed API routes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
