import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NewMaterialOrderForm } from "./NewMaterialOrderForm";

export default async function NewMaterialOrderPage() {
  const session = await requireSession();

  const [suppliers, orchards] = await Promise.all([
    prisma.supplier.findMany({ where: { organizationId: session.organizationId }, orderBy: { name: "asc" } }),
    prisma.orchard.findMany({ where: { organizationId: session.organizationId }, orderBy: { name: "asc" } }),
  ]);

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          Add a supplier before placing an order.
        </p>
        <Link href="/materials/suppliers" className="text-sm font-medium text-kf-green-600 underline">
          Add a supplier
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-kf-charcoal">New material order</h1>
      <NewMaterialOrderForm
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        orchards={orchards.map((o) => ({ id: o.id, name: o.name }))}
      />
    </div>
  );
}
