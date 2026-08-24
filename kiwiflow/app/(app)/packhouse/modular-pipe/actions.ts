"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { recordAuditLog } from "@/lib/audit";
import { ingestAndProcessDocument, type PipelineDocumentResult } from "@/lib/modularPipe/pipeline";
import { updateModularPipeConfig } from "@/lib/modularPipe/config";
import { ACTIVE_PACKS } from "@/lib/modularPipe/types";

export type FormState = { error?: string; result?: PipelineDocumentResult } | undefined;
export type ConfigFormState = { error?: string; success?: boolean } | undefined;
export type ResolveFormState = { error?: string } | undefined;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Manual "upload" / "text_blob" ingestion (spec Section 1.1) — the only two channels
 * actually wired to a UI in this build (see docs/BLUEPRINT.md's scope note; email and
 * API-source ingestion are documented, not implemented). */
export async function ingestDocumentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") return { error: "Only pack house organisations can use the Data Bridge." };

  const text = formData.get("text");
  const file = formData.get("file");
  const sourceTypeHintRaw = formData.get("sourceTypeHint");
  const sourceTypeHint = typeof sourceTypeHintRaw === "string" && sourceTypeHintRaw ? sourceTypeHintRaw : null;

  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasFile = file instanceof File && file.size > 0;
  if (!hasText && !hasFile) return { error: "Paste some text or choose a file." };

  let imageBase64: string | null = null;
  let mimeType: string | null = null;
  let originalFilename: string | null = null;

  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_IMAGE_BYTES) return { error: "File is too large (max 8MB)." };
    if (!f.type.startsWith("image/")) {
      return { error: "Only image files (photos/scans) are supported for upload right now — paste text for PDFs/CSVs." };
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    imageBase64 = bytes.toString("base64");
    mimeType = f.type;
    originalFilename = f.name;
  }

  const result = await ingestAndProcessDocument({
    organizationId: session.organizationId,
    operatorId: session.userId,
    channel: hasFile ? "upload" : "text_blob",
    originalFilename,
    mimeType,
    sourceTypeHint,
    text: hasText ? (text as string) : null,
    imageBase64,
    imageMediaType: mimeType,
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "modular_pipe.document_ingested",
    entityType: "ModularPipeDocument",
    entityId: result.document_id,
    detail: { sourceType: result.source_type, status: result.status },
  });

  revalidatePath("/packhouse/modular-pipe");
  revalidatePath("/packhouse/modular-pipe/queue");
  return { result };
}

const configSchema = z.object({
  activePack: z.enum(ACTIVE_PACKS),
  enabledQualityLog: z.string().optional(),
  enabledBinOrigin: z.string().optional(),
  enabledRseTimesheet: z.string().optional(),
  maxShiftHours: z.coerce.number().min(1).max(48),
  ocrConfidenceThreshold: z.coerce.number().min(0).max(1),
  hoursRoundingToleranceMinutes: z.coerce.number().min(0).max(120),
  strictCrossDocChecks: z.string().optional(),
});

/** God Mode's validation-rule config (spec Section 4.2) — sliders/dropdowns bound
 * directly to ModularPipeConfig, never free text. OWNER/MANAGER only. */
export async function updateModularPipeConfigAction(_prev: ConfigFormState, formData: FormData): Promise<ConfigFormState> {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") return { error: "Only pack house organisations can use the Data Bridge." };
  try {
    assertCanManage(session.role);
  } catch {
    return { error: "Only an OWNER or MANAGER can change Data Bridge settings." };
  }

  const parsed = configSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const enabledDocTypes = [
    data.enabledQualityLog ? "quality_log" : null,
    data.enabledBinOrigin ? "bin_origin" : null,
    data.enabledRseTimesheet ? "rse_timesheet" : null,
  ].filter((v): v is string => v !== null);

  await updateModularPipeConfig(session.organizationId, {
    activePack: data.activePack,
    enabledDocTypes,
    maxShiftHours: data.maxShiftHours,
    ocrConfidenceThreshold: data.ocrConfidenceThreshold,
    hoursRoundingToleranceMinutes: data.hoursRoundingToleranceMinutes,
    strictCrossDocChecks: data.strictCrossDocChecks === "on",
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "modular_pipe.config_updated",
    entityType: "ModularPipeConfig",
    entityId: session.organizationId,
    detail: data,
  });

  revalidatePath("/packhouse/modular-pipe");
  return { success: true };
}

/** Manual conflict/exception resolution (spec Section 4.3) — mark one issue resolved
 * with a note. Deliberately does not auto-patch the underlying record value: the admin
 * picks the correct value themselves and the note is the audit trail of that choice. */
export async function resolveIssueAction(_prev: ResolveFormState, formData: FormData): Promise<ResolveFormState> {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") return { error: "Only pack house organisations can use the Data Bridge." };
  try {
    assertCanManage(session.role);
  } catch {
    return { error: "Only an OWNER or MANAGER can resolve Data Bridge issues." };
  }

  const issueId = formData.get("issueId");
  const note = formData.get("note");
  if (typeof issueId !== "string" || !issueId) return { error: "Missing issue." };

  const issue = await prisma.modularPipeIssue.findFirst({ where: { id: issueId, organizationId: session.organizationId } });
  if (!issue) return { error: "Issue not found." };

  await prisma.modularPipeIssue.update({
    where: { id: issue.id },
    data: {
      resolved: true,
      resolutionNote: typeof note === "string" && note.trim() ? note.trim() : null,
      resolvedById: session.userId,
      resolvedAt: new Date(),
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "modular_pipe.issue_resolved",
    entityType: "ModularPipeIssue",
    entityId: issue.id,
    detail: { documentId: issue.documentId, code: issue.code },
  });

  revalidatePath(`/packhouse/modular-pipe/documents/${issue.documentId}`);
  revalidatePath("/packhouse/modular-pipe/queue");
}
