import { Suspense } from "react";
import PanelHome from "@/components/PanelHome";

export default function Root() {
  return (
    <Suspense fallback={null}>
      <PanelHome />
    </Suspense>
  );
}
