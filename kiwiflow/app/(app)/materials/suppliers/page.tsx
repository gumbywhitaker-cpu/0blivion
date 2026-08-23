import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NewSupplierForm } from "./NewSupplierForm";

export default async function SuppliersPage() {
  const session = await requireSession();

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">Suppliers</h1>
          <p className="text-kf-muted">Fertiliser, chemicals, packaging, fuel — your own supplier list.</p>
        </div>
        <Link href="/materials" className="text-sm font-medium text-kf-green-600 underline">
          Back to orders
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Add a supplier</h2>
          <NewSupplierForm />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Existing suppliers</h2>
          {suppliers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
              No suppliers yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {suppliers.map((s) => (
                <li key={s.id} className="rounded-lg border border-kf-border bg-kf-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-kf-charcoal">{s.name}</span>
                    <span className="text-xs uppercase text-kf-muted">{s.category}</span>
                  </div>
                  {(s.contactName || s.phone || s.email) && (
                    <p className="mt-1 text-sm text-kf-muted">
                      {[s.contactName, s.phone, s.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
