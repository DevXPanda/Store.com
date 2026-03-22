import { redirect } from "next/navigation";

export default function AdminLoginRedirect() {
  redirect("/?signin=1");
}
