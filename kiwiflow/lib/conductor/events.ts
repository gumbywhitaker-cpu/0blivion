// The event catalog (docs/BLUEPRINT.md Section 5). A discriminated union so an
// event's payload shape is checked at compile time wherever it's emitted or handled —
// a typo'd event type is a TS error, not a silently-ignored string.

export type ConductorEvent =
  | { type: "JOB_CREATED"; payload: { jobId: string } }
  | {
      type: "JOB_STATUS_CHANGED";
      payload: { jobId: string; fromStatus: string; toStatus: string };
    }
  | { type: "JOB_COMPLETED"; payload: { jobId: string } }
  | {
      type: "CONTRACTOR_ONBOARDED";
      payload: { contractorOrgId: string; growerOrgId: string };
    }
  | { type: "INVOICE_CREATED"; payload: { invoiceId: string } }
  | { type: "INVOICE_SENT"; payload: { invoiceId: string } }
  | { type: "COOLSTORE_TEMP_ALERT"; payload: { logId: string; organizationId: string; facilityName: string; temperatureC: number } }
  | { type: "MATERIAL_ORDER_SUBMITTED"; payload: { materialOrderId: string } }
  | { type: "MATERIAL_ORDER_CONFIRMED"; payload: { materialOrderId: string } }
  | { type: "MATERIAL_ORDER_DELIVERED"; payload: { materialOrderId: string } };

export type ConductorEventType = ConductorEvent["type"];
