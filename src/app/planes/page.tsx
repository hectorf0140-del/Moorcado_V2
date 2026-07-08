import { Suspense } from "react";
import PlanesClient from "@/components/PlanesClient";

export default function PlanesPage() {
  return (
    <Suspense>
      <PlanesClient />
    </Suspense>
  );
}
