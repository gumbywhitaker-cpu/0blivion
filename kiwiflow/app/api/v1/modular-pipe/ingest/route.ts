import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { ingestAndProcessDocument } from "@/lib/modularPipe/pipeline";

// POST /api/v1/modular-pipe/ingest — the Ingestion stage's entry point (spec Section
// 1.1). Only "upload" (base64 file) and "text_blob"/"manual_entry" (pasted text) are
// wired — email and API-source ingestion are documented in the spec as future
// channels, not implemented here (see docs/BLUEPRINT.md's Modular AI Data Bridge
// section). Runs the full Ingestion -> Refinement -> Delivery pipeline synchronously,
// matching the Conductor's own MVP posture (docs/BLUEPRINT.md Section 1) — this is not
// high enough volume yet to justify a queue.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;

const bodySchema = z
  .object({
    channel: z.enum(["upload", "text_blob", "manual_entry"]),
    sourceTypeHint: z.enum(["quality_log", "bin_origin", "rse_timesheet", "mixed", "unknown"]).nullish(),
    originalFilename: z.string().max(255).nullish(),
    mimeType: z.string().max(100).nullish(),
    text: z.string().max(MAX_TEXT_CHARS).nullish(),
    imageBase64: z.string().nullish(),
    testMode: z.boolean().optional().default(false),
  })
  .refine((v) => Boolean(v.text?.trim()) || Boolean(v.imageBase64), {
    message: "Provide either text or an image to ingest.",
  });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const body = parsed.data;

  if (body.imageBase64) {
    const approxBytes = (body.imageBase64.length * 3) / 4;
    if (approxBytes > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
    }
    if (!body.mimeType?.startsWith("image/")) {
      return Response.json({ error: "mimeType must be an image type when imageBase64 is provided." }, { status: 400 });
    }
  }

  const result = await ingestAndProcessDocument({
    organizationId: session.organizationId,
    operatorId: session.userId,
    channel: body.channel,
    originalFilename: body.originalFilename,
    mimeType: body.mimeType,
    sourceTypeHint: body.sourceTypeHint,
    text: body.text,
    imageBase64: body.imageBase64,
    imageMediaType: body.mimeType,
    testMode: body.testMode,
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "modular_pipe.document_ingested",
    entityType: "ModularPipeDocument",
    entityId: result.document_id,
    detail: { sourceType: result.source_type, status: result.status },
  });

  return Response.json({ documents: [result] }, { status: 201 });
}
