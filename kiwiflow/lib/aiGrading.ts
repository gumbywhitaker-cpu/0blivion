import "server-only";

/**
 * AI-assisted fruit grading estimate — a cross-check for the packhouse's
 * own manual grading entry (see app/(app)/packhouse/GradingForm.tsx), not a
 * replacement for it. This is a vision-model *impression* of a photo, not a
 * calibrated measurement: an LLM cannot determine Brix (needs a
 * refractometer) or a precise size count (needs a reference object or real
 * sizing equipment) from a single image, so this deliberately never claims
 * either. It also deliberately never writes to GradingResult — the packhouse
 * reads the estimate and still enters their own numbers.
 *
 * Adapter-point pattern, same as lib/notify.ts's email/SMS stubs: fails
 * closed with a clear reason when ANTHROPIC_API_KEY isn't configured,
 * rather than throwing and breaking the grading form around it.
 */

export type GradingEstimate = {
  sizeImpression: "SMALL" | "MEDIUM" | "LARGE" | "MIXED" | "UNCLEAR";
  colorNote: string;
  visibleDefectPercent: number | null;
  qualityImpression: "LOOKS_CONSISTENT_WITH_CLASS_1" | "VISIBLE_DEFECTS" | "UNCLEAR";
  confidence: "LOW" | "MEDIUM";
  notes: string;
};

export type GradingEstimateResult = { ok: true; estimate: GradingEstimate } | { ok: false; reason: string };

const SYSTEM_PROMPT = `You are helping a kiwifruit packhouse worker sanity-check a load by eye, from a single
photo. You are NOT a calibrated grading instrument: you cannot measure Brix (needs a refractometer) or an
exact size count (needs a reference object or real sizing equipment) from an image, and must never imply
you can. Give only a cautious visual impression, always at LOW or MEDIUM confidence, never higher — a
single photo is not enough evidence for more than that. Respond with strict JSON only, matching this
shape exactly, no markdown fences, no extra text:
{
  "sizeImpression": "SMALL" | "MEDIUM" | "LARGE" | "MIXED" | "UNCLEAR",
  "colorNote": "one short sentence describing what's visually apparent",
  "visibleDefectPercent": number | null (rough % of visible fruit surface showing blemish/scarring/damage, null if you can't tell),
  "qualityImpression": "LOOKS_CONSISTENT_WITH_CLASS_1" | "VISIBLE_DEFECTS" | "UNCLEAR",
  "confidence": "LOW" | "MEDIUM",
  "notes": "one short sentence of caveats or what would improve the estimate"
}`;

export async function estimateGradingFromPhoto(imageBase64: string, mediaType: string): Promise<GradingEstimateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[ai-grading] ANTHROPIC_API_KEY not configured — AI grading estimate unavailable");
    return { ok: false, reason: "AI estimate isn't configured on this deployment yet." };
  }

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
        model: process.env.ANTHROPIC_MODEL_ID || "claude-sonnet-5",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: "Give your visual impression of this kiwifruit load as JSON." },
            ],
          },
        ],
      }),
    });
  } catch {
    return { ok: false, reason: "Couldn't reach the AI estimate service — try again shortly." };
  }

  if (!response.ok) {
    return { ok: false, reason: `AI estimate service returned an error (${response.status}).` };
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) return { ok: false, reason: "AI estimate returned no readable response." };

  try {
    const parsed = JSON.parse(text) as GradingEstimate;
    return { ok: true, estimate: parsed };
  } catch {
    return { ok: false, reason: "AI estimate response wasn't valid — try again." };
  }
}
