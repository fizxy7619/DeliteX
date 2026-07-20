import { callLLM } from "./src/lib/ai/provider";

async function main() {
  const res = await callLLM([{ role: "user", content: "Allocate 20% to savings" }]);
  console.log(res);
}

main().catch(console.error);
