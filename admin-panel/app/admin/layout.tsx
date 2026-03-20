import type { Metadata } from "next";
import "../globals.css";
import { ConvexClientProvider } from "../ConvexClientProvider";
import { AuthProvider } from "../AuthContext";

export const metadata: Metadata = {
  title: "VegFru Admin",
  description: "VegFru Admin Dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexClientProvider>
  );
}
