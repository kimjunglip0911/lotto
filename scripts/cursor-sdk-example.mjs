/**
 * Cursor SDK 로컬 에이전트 예제.
 * 루트의 .env.local 에 CURSOR_API_KEY 가 있어야 합니다.
 */
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent } from "@cursor/sdk";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(repoRoot, ".env.local") });

const apiKey = process.env.CURSOR_API_KEY;
if (!apiKey) {
  console.error(
    "CURSOR_API_KEY 가 없습니다. 루트 .env.local 을 만들거나 환경 변수를 설정하세요.",
  );
  process.exit(1);
}

const agent = await Agent.create({
  apiKey,
  model: { id: "composer-2" },
  local: { cwd: repoRoot },
});

try {
  const run = await agent.send("Summarize what this repository does");

  for await (const event of run.stream()) {
    console.log(event);
  }
} finally {
  agent.close();
}
