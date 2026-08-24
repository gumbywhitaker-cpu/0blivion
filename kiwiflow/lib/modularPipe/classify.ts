import "server-only";
import { MODULAR_PIPE_SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { modelResponseSchema, type ModelResponse } from "./types";

export type ClassifyInput = {
  documentId: string;
  channel: string;
  originalFilename?: string | null;
  sourceTypeHint?: string | null;
  text?: string | null;
  imageBase64?: string | null;
  imageMediaType?: string | null;
  testMode?: boolean;
};

export type ClassifyResult =
  | { ok: true; response: ModelResponse; modelVersion: string }
  | { ok: false; reason: string };

/**
 * Ingestion + Refinement's classification/extraction step, in one model call — same
 * adapter-point pattern as lib/aiGrading.ts: fails closed with a clear reason when
 * ANTHROPIC_API_KEY isn't configured or the call/parse fails, rather than throwing and
 * taking the ingest endpoint down with it. This is the ONLY step in the pipeline that
 * trusts the model's own judgement; everything downstream (validate.ts) recomputes the
 * business-critical numbers itself rather than trusting what the model reports.
 */
export async function classifyAndExtract(input: ClassifyInput): Promise<ClassifyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[modular-pipe] ANTHROPIC_API_KEY not configured — classification unavailable");
    return { ok: false, reason: "Document classification isn't configured on this deployment yet." };
  }
  if (!input.text && !input.imageBase64) {
    return { ok: false, reason: "No document content to classify (no text and no image)." };
  }

  const userText = buildUserMessage(input);
  const content: Record<string, unknown>[] = [];
  if (input.imageBase64 && input.imageMediaType) {
    content.push({ type: "image", source: { type: "base64", media_type: input.imageMediaType, data: input.imageBase64 } });
  }
  content.push({ type: "text", text: userText });

  const modelId = process.env.ANTHROPIC_MODEL_ID || "claude-sonnet-5";

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4000,
        system: MODULAR_PIPE_SYSTEM_PROMPT + (input.testMode ? "\n\ntest_mode is true for this call: be extra strict about reporting any ambiguity instead of smoothing it over." : ""),
        messages: [{ role: "user", content }],
      }),
    });
  } catch {
    return { ok: false, reason: "Couldn't reach the document classification service — try again shortly." };
  }

  if (!response.ok) {
    return { ok: false, reason: `Document classification service returned an error (${response.status}).` };
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) return { ok: false, reason: "Classification returned no readable response." };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { ok: false, reason: "Classification response wasn't valid JSON." };
  }

  const parsed = modelResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error("[modular-pipe] model response failed schema validation", parsed.error.message);
    return { ok: false, reason: "Classification response didn't match the expected schema." };
  }

  return { ok: true, response: parsed.data, modelVersion: modelId };
}
