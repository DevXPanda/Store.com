import { redirect } from "next/navigation";

export default function SuperAdminOrdersPage() {
  redirect("/superadmin?tab=orders");
}
