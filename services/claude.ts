// WARNING: This key is bundled client-side via EXPO_PUBLIC_. Before production
// launch, move Claude API calls to a Firebase Cloud Function or similar backend
// so the key is never shipped inside the app binary.
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface OracleOptions {
  useHaiku?: boolean;
  systemPrompt?: string;
  maxTokens?: number;
}

export async function askTheOracle(
  userMessage: string,
  options: OracleOptions = {},
): Promise<string> {
  const { useHaiku = false, systemPrompt, maxTokens = 4096 } = options;

  const model = useHaiku
    ? "claude-haiku-4-5-20251001"
    : "claude-sonnet-4-5-20250929";

  try {
    const body: any = {
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    };

    // Add system prompt with caching if provided
    if (systemPrompt) {
      body.system = [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }, // Cache this prompt for cost savings
        },
      ];
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API error: ${response.status} - ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();

    // Log cache usage for monitoring
    if (data.usage) {
      console.log("=== CLAUDE API USAGE ===");
      console.log("Model:", model);
      console.log("Input tokens:", data.usage.input_tokens);
      console.log(
        "Cache read tokens:",
        data.usage.cache_read_input_tokens || 0,
      );
      console.log(
        "Cache creation tokens:",
        data.usage.cache_creation_input_tokens || 0,
      );
      console.log("Output tokens:", data.usage.output_tokens);
    }

    return data.content[0].text;
  } catch (error) {
    console.error("Oracle malfunction:", error);
    throw new Error("The brass gears have slipped. Please try again.");
  }
}
