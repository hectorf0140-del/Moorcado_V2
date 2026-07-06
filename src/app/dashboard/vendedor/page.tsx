import { redirect } from "next/navigation";

// Vista antigua con datos mock — el dashboard unificado la reemplaza.
export default function DashboardVendedor() {
  redirect("/dashboard");
}
