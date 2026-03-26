import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "VegFru Delivery",
  description: "VegFru Delivery Partner App",
  icons: {
    icon: [{ url: '/images/Vegfru.png' }],
    apple: '/images/Vegfru.png',
    shortcut: '/images/Vegfru.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#14532d" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="grain-overlay min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
