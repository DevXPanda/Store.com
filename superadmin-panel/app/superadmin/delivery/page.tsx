import { redirect } from "next/navigation";

export default function SuperAdminDeliveryPage() {
  redirect("/superadmin?tab=delivery");
}
