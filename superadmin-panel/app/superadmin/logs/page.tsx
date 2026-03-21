import { redirect } from "next/navigation";

export default function SuperAdminLogsPage() {
  redirect("/superadmin?tab=logs");
}
