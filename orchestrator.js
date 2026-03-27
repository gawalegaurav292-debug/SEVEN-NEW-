const axios = require("axios");
const { run } = require("./ai-executor");
const fs = require("fs");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function generate(task) {
  const prompt = fs.readFileSync("system/god-prompt.txt", "utf8");

  const res = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-5",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: task }
    ]
  }, {
    headers: { Authorization: `Bearer ${OPENAI_KEY}` }
  });

  return res.data.choices[0].message.content;
}

async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const task = event.issue.title + "\n" + (event.issue.body || "");

  let output = await generate(task);

  let parsed;
  try { parsed = JSON.parse(output); } catch {
    console.log("Invalid JSON, retry");
    output = await generate(task + " fix JSON");
    parsed = JSON.parse(output);
  }

  await run(parsed.actions);

  console.log("Orchestration complete");
}

main();
