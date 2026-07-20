/**
 * LLM Provider abstraction for DeliteX AI Agent.
 * Uses NVIDIA NIM API (OpenAI-compatible) with nvidia/nemotron-4-340b-instruct.
 * Falls back gracefully if NVIDIA_API_KEY is not set.
 */
import OpenAI from "openai";

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
  if (!process.env.NVIDIA_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
    });
  }
  return _client;
}

/**
 * Call NVIDIA NIM with a message array. Returns structured LLMResponse.
 * If no API key is configured, returns null so callers can fall back to
 * keyword matching (app stays functional without the key).
 */
export async function callLLM(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<LLMResponse | null> {
  const client = getClient();
  if (!client) return null;

  const start = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
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
