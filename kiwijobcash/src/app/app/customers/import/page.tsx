import { requireBusiness } from "@/lib/session";
import { CsvImportClient } from "@/components/app/customers/CsvImportClient";

export const metadata = { title: "Import customers" };

export default async function ImportCustomersPage() {
  await requireBusiness();
  return <CsvImportClient />;
}
