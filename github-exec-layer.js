const axios = require("axios");

const BASE = "https://api.github.com";

async function getFile(owner, repo, path, token) {
  try {
    const res = await axios.get(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${token}` }
    });
    return res.data;
  } catch (e) {
    return null;
  }
}

async function upsertFile({ owner, repo, path, content, message, branch = "main", token }) {
  const existing = await getFile(owner, repo, path, token);

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch
  };

  if (existing && existing.sha) {
    body.sha = existing.sha;
  }

  const res = await axios.put(
    `${BASE}/repos/${owner}/${repo}/contents/${path}`,
    body,
    {
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data;
}

module.exports = { upsertFile };
