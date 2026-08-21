"use client";

import { useActionState, type ReactNode } from "react";
import {
  assignContractorAction,
  transitionJobAction,
  type FormState,
} from "../actions";
import { canManage } from "@/lib/auth/requireRole";
import type { JobStatus, OrgType, UserRole } from "@/lib/types";

type Option = { id: string; name: string };

function ErrorText({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="mt-1 text-sm font-medium text-kf-red" role="alert">
      {state.error}
    </p>
  );
}

function AssignContractorForm({ jobId, contractors }: { jobId: string; contractors: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(assignContractorAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <label htmlFor="contractorOrgId" className="text-sm font-medium text-kf-charcoal">
        Assign a contractor to schedule this job
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id="contractorOrgId"
          name="contractorOrgId"
          required
          defaultValue=""
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          <option value="" disabled>
            Choose a contractor
          </option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Assigning…" : "Assign & schedule"}
        </button>
      </div>
      <ErrorText state={state} />
    </form>
  );
}

function TransitionButton({
  jobId,
  toStatus,
  label,
}: {
  jobId: string;
  toStatus: JobStatus;
  label: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(transitionJobAction, undefined);
  return (
    <form action={action} className="inline-block">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-green-600 px-5 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Working…" : label}
      </button>
      <ErrorText state={state} />
    </form>
  );
}

function CompleteJobForm({ jobId, unit }: { jobId: string; unit: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(transitionJobAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="toStatus" value="COMPLETE" />
      <label htmlFor="quantity" className="text-sm font-medium text-kf-charcoal">
        Quantity completed{unit ? ` (${unit})` : ""}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="quantity"
          name="quantity"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-32 rounded-md border border-kf-border bg-white px-3 py-3 text-lg outline-none focus:border-kf-green-600"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-md bg-kf-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Finishing…" : "Mark complete"}
        </button>
      </div>
      <ErrorText state={state} />
    </form>
  );
}

function CancelForm({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(transitionJobAction, undefined);
  return (
    <form action={action} className="inline-block">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="toStatus" value="CANCELLED" />
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md border border-kf-red px-4 py-2 text-sm font-medium text-kf-red hover:bg-kf-red/5 disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Cancel job"}
      </button>
      <ErrorText state={state} />
    </form>
  );
}

export function JobActions({
  job,
  session,
  contractors,
}: {
  job: { id: string; status: JobStatus; growerOrgId: string; contractorOrgId: string | null; unit: string | null };
  session: { organizationId: string; orgType: OrgType; role: UserRole };
  contractors: Option[];
}) {
  const isGrower = session.organizationId === job.growerOrgId;
  const isContractor = job.contractorOrgId !== null && session.organizationId === job.contractorOrgId;
  const manages = canManage(session.role);

  const buttons: ReactNode[] = [];

  if (job.status === "NEW" && isGrower && manages && contractors.length > 0) {
    buttons.push(<AssignContractorForm key="assign" jobId={job.id} contractors={contractors} />);
  }
  if (job.status === "SCHEDULED" && isContractor && manages) {
    buttons.push(<TransitionButton key="confirm" jobId={job.id} toStatus="CONFIRMED" label="Confirm job" />);
  }
  if (job.status === "CONFIRMED" && isContractor) {
    buttons.push(<TransitionButton key="start" jobId={job.id} toStatus="IN_PROGRESS" label="Start job" />);
  }
  if (job.status === "IN_PROGRESS" && isContractor) {
    buttons.push(<CompleteJobForm key="complete" jobId={job.id} unit={job.unit} />);
  }
  if (["NEW", "SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(job.status) && (isGrower || isContractor) && manages) {
    buttons.push(<CancelForm key="cancel" jobId={job.id} />);
  }

  if (buttons.length === 0) return null;

  return <div className="flex flex-wrap items-start gap-3">{buttons}</div>;
}
