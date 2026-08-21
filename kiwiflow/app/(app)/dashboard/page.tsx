import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardRedirect() {
  const session = await requireSession();
  // Role-based, checked first: a DRIVER can belong to a CONTRACTOR or a
  // dedicated TRANSPORT org, so this can't be decided by orgType alone.
  if (session.role === "DRIVER") redirect("/driver");
  if (session.orgType === "GROWER") redirect("/grower");
  if (session.orgType === "CONTRACTOR") redirect("/contractor");
  if (session.orgType === "PACKHOUSE") redirect("/packhouse");
  if (session.orgType === "ADMIN") redirect("/admin");
  redirect("/jobs");
}
