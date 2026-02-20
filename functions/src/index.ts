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

export const askOracle = onCall({ secrets: [anthropicApiKey] }, async (request) => {
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

  const response = await client.messages.create(body);

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
