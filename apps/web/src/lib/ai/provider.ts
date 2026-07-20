/**
 * LLM Provider abstraction for DeliteX AI Agent.
 * Uses NVIDIA NIM API (OpenAI-compatible) with nvidia/nemotron-4-340b-instruct.
 * Falls back gracefully if NVIDIA_API_KEY is not set.
 */
import OpenAI from "openai";

// Correct model ID for NVIDIA Nemotron-4-340B via NIM API
export const NVIDIA_MODEL = "nvidia/nemotron-4-340b-instruct";
export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  latencyMs: number;
  provider: "nvidia-nim" | "fallback";
}

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  if (!_client) {
    _client = new OpenAI({
      apiKey,
      baseURL: NVIDIA_BASE_URL,
    });
  }
  return _client;
}

/**
 * Call NVIDIA NIM with a message array. Returns structured LLMResponse.
 */
export async function callLLM(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<LLMResponse | null> {
  const client = getClient();
  if (!client) return null;

  const start = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.1,
      top_p: 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return {
      content,
      model: NVIDIA_MODEL,
      latencyMs: Date.now() - start,
      provider: "nvidia-nim",
    };
  } catch (err) {
    console.error("[LLM] NVIDIA NIM call failed:", err);
    return null;
  }
}
