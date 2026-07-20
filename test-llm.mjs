import OpenAI from "openai";

async function test() {
  const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });

  console.log("Testing NVIDIA NIM LLM...");
  try {
    const completion = await client.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct", // use a standard fast model for testing
      messages: [{ role: "user", content: "Hello! Who are you?" }],
      max_tokens: 50,
    });
    console.log("SUCCESS. Response:");
    console.log(completion.choices[0]?.message?.content);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

test();
