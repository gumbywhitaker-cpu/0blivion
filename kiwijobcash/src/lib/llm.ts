import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (client !== undefined) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  client = apiKey ? new Anthropic({ apiKey }) : null;
  return client;
}

export function llmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Optional LLM polish layer. The whole app works without this — every agent
 * and Ask Kiwi produce deterministic, template-based output by default.
 * When ANTHROPIC_API_KEY is set, this can rephrase a draft in the business's
 * voice. Never used to invent facts: callers pass already-computed data in,
 * this only rewords it. Returns null on any failure so callers always have
 * the deterministic fallback to use instead.
 */
export async function polishWithLLM(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: params.maxTokens ?? 400,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text.trim() : null;
  } catch (err) {
    console.error("LLM call failed, falling back to deterministic output:", err);
    return null;
  }
}
