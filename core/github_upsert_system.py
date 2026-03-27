import requests
import base64

GITHUB_API = "https://api.github.com"

class GitHubClient:
    def __init__(self, token, owner, repo):
        self.token = token
        self.owner = owner
        self.repo = repo
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def get_file(self, path, branch="main"):
        url = f"{GITHUB_API}/repos/{self.owner}/{self.repo}/contents/{path}?ref={branch}"
        res = requests.get(url, headers=self.headers)

        if res.status_code == 200:
            return res.json()
        elif res.status_code == 404:
            return None
        else:
            raise Exception(res.text)

    def upsert_file(self, path, content, message, branch="main"):
        existing = self.get_file(path, branch)

        encoded_content = base64.b64encode(content.encode()).decode()

        url = f"{GITHUB_API}/repos/{self.owner}/{self.repo}/contents/{path}"

        data = {
            "message": message,
            "content": encoded_content,
            "branch": branch
        }

        if existing and "sha" in existing:
            data["sha"] = existing["sha"]

        res = requests.put(url, headers=self.headers, json=data)

        if res.status_code not in [200, 201]:
            raise Exception(res.text)

        return res.json()
