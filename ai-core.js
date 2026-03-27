const fs = require("fs");
const axios = require("axios");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function getTask() {
  return "Build a responsive landing page with HTML, CSS, JS";
}

async function openaiGenerate(task) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-5",
      messages: [
        { role: "system", content: "Return JSON actions only." },
        { role: "user", content: task }
      ]
    },
    {
      headers: { Authorization: `Bearer ${OPENAI_KEY}` }
    }
  );

  return res.data.choices[0].message.content;
}

async function geminiValidate(data) {
  // simple placeholder for validation
  return data;
}

function applyChanges(actions) {
  actions.forEach(a => {
    if (a.type === "create_file" || a.type === "update_file") {
      fs.writeFileSync(a.path, a.content);
    }
  });
}

async function main() {
  const task = await getTask();

  const aiOutput = await openaiGenerate(task);

  let parsed;
  try {
    parsed = JSON.parse(aiOutput);
  } catch {
    console.log("Invalid JSON");
    return;
  }

  const validated = await geminiValidate(parsed);

  applyChanges(validated.actions);

  console.log("Level 2 execution complete");
}

main();
