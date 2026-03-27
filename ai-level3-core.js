const fs = require("fs");
const axios = require("axios");
const { execSync } = require("child_process");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function getIssueTask() {
  // GitHub provides event payload
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  return event.issue?.title + "\n" + (event.issue?.body || "");
}

async function openai(task) {
  const res = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-5",
    messages: [
      { role: "system", content: "Return ONLY JSON with actions." },
      { role: "user", content: task }
    ]
  }, { headers: { Authorization: `Bearer ${OPENAI_KEY}` } });

  return res.data.choices[0].message.content;
}

async function geminiValidate(json) {
  // placeholder for real validation
  return json;
}

function apply(actions) {
  actions.forEach(a => {
    if (a.type === "create_file" || a.type === "update_file") {
      fs.mkdirSync(require("path").dirname(a.path), { recursive: true });
      fs.writeFileSync(a.path, a.content);
    }
  });
}

function gitOps(branch) {
  execSync(`git checkout -b ${branch}`);
  execSync("git add .");
  execSync('git commit -m "AI Level 3 changes" || echo skip');
  execSync(`git push origin ${branch}`);
}

async function main() {
  const task = await getIssueTask();

  let output = await openai(task);

  let parsed;
  try { parsed = JSON.parse(output); } catch { console.log("Bad JSON"); return; }

  const validated = await geminiValidate(parsed);

  apply(validated.actions);

  const branch = "ai-auto-" + Date.now();
  gitOps(branch);

  console.log("Level 3 execution done");
}

main();
