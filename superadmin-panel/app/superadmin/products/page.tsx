import { redirect } from "next/navigation";

export default function SuperAdminProductsPage() {
  redirect("/superadmin?tab=products");
}
