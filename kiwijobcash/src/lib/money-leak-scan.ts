export type MoneyLeakScanInput = {
  businessType?: string;
  monthlyRevenue: number;
  employeeCount: number;
  averageJobValue: number;
  monthlyEnquiries: number;
  monthlyQuotes: number;
  overdueInvoiceCount: number;
  overdueInvoiceValue: number;
  dormantCustomerCount: number;
};

export type MoneyLeakScanResult = {
  leadLeak: number;
  quoteLeak: number;
  invoiceLeak: number;
  dormantLeak: number;
  total: number;
};

/**
 * Illustrative estimate, not a promise of savings — every number here is
 * clearly labelled "estimated opportunity" wherever it's shown. Assumptions:
 *  - ~15% of monthly enquiries go uncontacted or cold before they convert
 *  - ~20% of monthly quotes could convert with a timely follow-up
 *  - overdue invoice value is used directly — it's already a real number
 *  - ~40% of dormant customers could plausibly be reactivated for one job
 */
export function calculateMoneyLeak(input: MoneyLeakScanInput): MoneyLeakScanResult {
  const jobValue = Math.max(input.averageJobValue, 0);

  const leadLeak = round(input.monthlyEnquiries * jobValue * 0.15);
  const quoteLeak = round(input.monthlyQuotes * jobValue * 0.2);
  const invoiceLeak = round(input.overdueInvoiceValue);
  const dormantLeak = round(input.dormantCustomerCount * jobValue * 0.4);

  return {
    leadLeak,
    quoteLeak,
    invoiceLeak,
    dormantLeak,
    total: leadLeak + quoteLeak + invoiceLeak + dormantLeak,
  };
}

function round(n: number) {
  return Math.round(Math.max(0, n) / 10) * 10;
}
