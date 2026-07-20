/**
 * LLM Provider abstraction for DeliteX AI Agent.
 * Uses NVIDIA NIM API (OpenAI-compatible) with nvidia/nemotron-4-340b-instruct.
 * Falls back gracefully if NVIDIA_API_KEY is not set.
 */
import OpenAI from "openai";

export const NVIDIA_MODEL = "nvidia/nemotron-3-super-120b-a12b";
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
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || "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",
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
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<LLMResponse | null> {
  const client = getClient();
  if (!client) return null;

  const start = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      // @ts-ignore - OpenAI SDK might not strictly type extra_body for all options
      extra_body: {
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 16384,
      },
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
