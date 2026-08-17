export type ActionType =
  | "LEAD_FOLLOWUP"
  | "QUOTE_FOLLOWUP"
  | "INVOICE_CHASE"
  | "CUSTOMER_REACTIVATION"
  | "REVIEW_REQUEST"
  | "JOB_REVIEW"
  | "PROFIT_ALERT"
  | "REVENUE_OPPORTUNITY"
  | "GENERAL_TASK";

export type EntityType = "Lead" | "Quote" | "Invoice" | "Customer" | "Job" | "Business";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

/**
 * The structured shape every agent must return — see product spec section 62
 * (AI Response Format). No hidden chain-of-thought, just a concise business
 * reason a real person could read and trust, and every number traceable back
 * to the source record via entityId.
 */
export type ActionCandidate = {
  type: ActionType;
  entityType: EntityType;
  entityId: string;
  title: string;
  description: string;
  estimatedValue: number | null;
  priority: Priority;
  aiReasoningSummary: string;
  suggestedMessage: string | null;
  customerId?: string | null;
  leadId?: string | null;
  quoteId?: string | null;
  invoiceId?: string | null;
  jobId?: string | null;
};

export function priorityFromValue(value: number | null, ageDays: number): Priority {
  const v = value ?? 0;
  if (v >= 2000 || ageDays >= 14) return "HIGH";
  if (v >= 500 || ageDays >= 5) return "MEDIUM";
  return "LOW";
}
