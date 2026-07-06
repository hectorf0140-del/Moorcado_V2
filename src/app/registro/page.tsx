import RegistroClient from "@/components/RegistroClient";
import type { PlanId } from "@/lib/types";

const PLANES_VALIDOS: PlanId[] = ["gratuito", "basico", "premium"];

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlan = PLANES_VALIDOS.includes(plan as PlanId)
    ? (plan as PlanId)
    : undefined;
  return <RegistroClient initialPlan={initialPlan} />;
}
