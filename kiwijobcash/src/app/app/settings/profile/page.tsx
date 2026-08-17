import { requireBusiness } from "@/lib/session";
import { ProfileFormClient } from "@/components/app/settings/ProfileFormClient";

export default async function ProfileSettingsPage() {
  const { business } = await requireBusiness();

  return (
    <ProfileFormClient
      business={{
        name: business.name,
        businessType: business.businessType ?? "",
        industry: business.industry ?? "",
        phone: business.phone ?? "",
        email: business.email ?? "",
        website: business.website ?? "",
        address: business.address ?? "",
        city: business.city ?? "",
        employeeCount: business.employeeCount ?? "",
        averageJobValue: business.averageJobValue ?? undefined,
      }}
    />
  );
}
