const axios = require("axios");
const fs = require("fs");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;

async function getFile(path, branch="main") {
  try {
    const res = await axios.get(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    return res.data;
  } catch (e) {
    if (e.response && e.response.status === 404) return null;
    throw e;
  }
}

async function upsertFile(path, content, message, branch="main") {
  const existing = await getFile(path, branch);

  const encoded = Buffer.from(content).toString("base64");

  const body = {
    message,
    content: encoded,
    branch
  };

  if (existing && existing.sha) {
    body.sha = existing.sha;
  }

  await axios.put(`https://api.github.com/repos/${REPO}/contents/${path}`, body, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
}

async function applyActions(actions) {
  for (const a of actions) {
    if (a.type === "create_file" || a.type === "update_file") {
      await upsertFile(a.path, a.content, "AI Level 4 Upsert Commit");
    }
  }
}

module.exports = { applyActions };
