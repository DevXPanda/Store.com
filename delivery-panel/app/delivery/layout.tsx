import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VegFru Delivery",
  description: "VegFru Delivery Partner App",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
