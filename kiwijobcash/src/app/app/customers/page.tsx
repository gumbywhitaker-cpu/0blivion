import { Suspense } from "react";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CustomersListClient } from "@/components/app/customers/CustomersListClient";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const { business } = await requireBusiness();

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
        <p className="mt-1 text-muted">{customers.length} total</p>
      </div>
      <Suspense fallback={null}>
        <CustomersListClient
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            companyName: c.companyName,
            email: c.email,
            phone: c.phone,
            customerStatus: c.customerStatus,
            lifetimeValue: c.lifetimeValue,
            lastJobDate: c.lastJobDate?.toISOString() ?? null,
          }))}
        />
      </Suspense>
    </div>
  );
}
