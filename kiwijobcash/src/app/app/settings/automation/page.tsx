import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { AutomationClient } from "@/components/app/settings/AutomationClient";

export default async function AutomationSettingsPage() {
  const { business } = await requireBusiness();

  const settings = await prisma.automationSettings.upsert({
    where: { businessId: business.id },
    update: {},
    create: { businessId: business.id },
  });

  return (
    <AutomationClient
      settings={{
        aiRecommendationsEnabled: settings.aiRecommendationsEnabled,
        dailyReportEnabled: settings.dailyReportEnabled,
        dailyReportTime: settings.dailyReportTime,
        dailyReportEmail: settings.dailyReportEmail,
        dailyReportSms: settings.dailyReportSms,
        emailFollowupSuggestions: settings.emailFollowupSuggestions,
        smsFollowupSuggestions: settings.smsFollowupSuggestions,
        automaticSending: settings.automaticSending,
        quoteReminderDays1: settings.quoteReminderDays1,
        quoteReminderDays2: settings.quoteReminderDays2,
        invoiceReminderDays1: settings.invoiceReminderDays1,
        invoiceReminderDays2: settings.invoiceReminderDays2,
        invoiceReminderDays3: settings.invoiceReminderDays3,
        customerReactivationDays: settings.customerReactivationDays,
        reviewRequestsEnabled: settings.reviewRequestsEnabled,
      }}
    />
  );
}
