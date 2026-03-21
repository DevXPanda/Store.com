import { redirect } from "next/navigation";

export default function SuperAdminAnalyticsPage() {
  redirect("/superadmin?tab=analytics");
}
