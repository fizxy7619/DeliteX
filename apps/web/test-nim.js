const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: "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",
  baseURL: "https://integrate.api.nvidia.com/v1"
});

async function run() {
  try {
    const completion = await client.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b",
      messages: [{ role: "user", content: "Hello" }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      chat_template_kwargs: { enable_thinking: true },
      reasoning_budget: 16384
    });
    console.log("SUCCESS");
    console.log(completion.choices[0].message);
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}

run();
