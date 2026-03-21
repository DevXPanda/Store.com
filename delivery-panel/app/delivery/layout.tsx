import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "VegFru Delivery",
  description: "VegFru Delivery Partner App",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
