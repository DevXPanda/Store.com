import { redirect } from "next/navigation";

export default function SuperAdminSystemPage() {
  redirect("/superadmin?tab=system");
}
