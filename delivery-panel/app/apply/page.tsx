import { redirect } from "next/navigation";

/** Legacy URL: partner apply form now opens as a modal on the home page. */
export default function ApplyRedirectPage() {
  redirect("/?apply=1");
}
