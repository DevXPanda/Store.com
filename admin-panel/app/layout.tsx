import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VegFru Admin",
  description: "VegFru Admin Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0f1117" }}>
        {children}
      </body>
    </html>
  );
}
