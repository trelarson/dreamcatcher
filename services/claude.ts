import { functions } from "@/config/firebase";
import { httpsCallable } from "firebase/functions";

interface OracleOptions {
  useHaiku?: boolean;
  systemPrompt?: string;
  maxTokens?: number;
}

interface OracleResponse {
  text: string;
}

const askOracleCallable = httpsCallable<
  { userMessage: string } & OracleOptions,
  OracleResponse
>(functions, "askOracle");

export async function askTheOracle(
  userMessage: string,
  options: OracleOptions = {},
): Promise<string> {
  try {
    const result = await askOracleCallable({ userMessage, ...options });
    return result.data.text;
  } catch (error) {
    console.error("Oracle malfunction:", error);
    throw error;
  }
}

// Alias used by the questionnaire screen
export const askTheAdvisor = askTheOracle;
