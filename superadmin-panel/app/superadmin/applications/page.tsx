import { redirect } from "next/navigation";

/** Deep link parity with other tabs — main UI is query-driven on /superadmin */
export default function SuperadminApplicationsRedirect() {
  redirect("/superadmin?tab=applications");
}
