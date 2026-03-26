import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VegFru Admin",
  description: "VegFru Admin Dashboard",
  icons: {
    icon: [{ url: '/images/Vegfru.png' }],
    apple: '/images/Vegfru.png',
    shortcut: '/images/Vegfru.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased grain-overlay bg-[#FEFAE0] text-gray-900 m-0">
        {children}
      </body>
    </html>
  );
}
