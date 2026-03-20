import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VegFru Delivery",
  description: "VegFru Delivery Partner App",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin:0, padding:0, background:"#0a0d14", overscrollBehavior:"none" }}>
        {children}
      </body>
    </html>
  );
}
