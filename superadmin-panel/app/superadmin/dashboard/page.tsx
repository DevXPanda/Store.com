import { redirect } from "next/navigation";

export default function SuperAdminDashboardPage() {
  redirect("/superadmin?tab=dashboard");
}
