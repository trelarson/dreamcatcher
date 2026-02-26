import Anthropic from "@anthropic-ai/sdk";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

interface OracleRequest {
  userMessage: string;
  systemPrompt?: string;
  useHaiku?: boolean;
  maxTokens?: number;
}

export const askOracle = onCall({ secrets: [anthropicApiKey], timeoutSeconds: 120 }, async (request) => {
  // Require Firebase auth (email/password or anonymous — both are accepted)
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to consult the oracle.",
    );
  }

  const { userMessage, systemPrompt, useHaiku, maxTokens } =
    request.data as OracleRequest;

  if (!userMessage) {
    throw new HttpsError("invalid-argument", "userMessage is required.");
  }

  const client = new Anthropic({ apiKey: anthropicApiKey.value() });

  const model = useHaiku
    ? "claude-haiku-4-5-20251001"
    : "claude-sonnet-4-5-20250929";

  const body: Anthropic.Messages.MessageCreateParamsNonStreaming = {
    model,
    max_tokens: maxTokens ?? 4096,
    messages: [{ role: "user", content: userMessage }],
  };

  if (systemPrompt) {
    body.system = [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ];
  }

  let response: Anthropic.Messages.Message | null = null;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await client.messages.create(body);
      break;
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.statusCode;
      // Retry on rate-limit (429) or overload (529) with backoff
      if ((status === 429 || status === 529) && attempt < 2) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      throw err;
    }
  }
  if (!response) throw lastError;

  if (response.usage) {
    console.log("Oracle usage", {
      model,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new HttpsError("internal", "No text returned from oracle.");
  }

  return { text: textBlock.text };
});
