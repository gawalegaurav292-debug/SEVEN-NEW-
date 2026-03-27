const { upsertFile } = require("./github-exec-layer");

const token = process.env.GITHUB_TOKEN;
const repoFull = process.env.GITHUB_REPOSITORY.split("/");

const owner = repoFull[0];
const repo = repoFull[1];

async function run(actions) {
  for (const action of actions) {
    if (action.type === "create_file" || action.type === "update_file") {
      await upsertFile({
        owner,
        repo,
        path: action.path,
        content: action.content,
        message: `AI update: ${action.path}`,
        token
      });
    }
  }
}

module.exports = { run };
