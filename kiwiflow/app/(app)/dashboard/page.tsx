import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardRedirect() {
  const session = await requireSession();
  if (session.orgType === "GROWER") redirect("/grower");
  if (session.orgType === "CONTRACTOR") redirect("/contractor");
  redirect("/jobs");
}
