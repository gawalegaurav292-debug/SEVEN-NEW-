from fastapi import FastAPI
import requests, os, base64

app = FastAPI()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO = "gawalegaurav292-debug/SEVEN-NEW-"
BASE = f"https://api.github.com/repos/{REPO}"
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}

@app.get("/mcp/tools")
def tools():
    return {"tools": ["list_files","create_file","update_file"]}

@app.get("/mcp/list-files")
def list_files():
    return requests.get(f"{BASE}/contents", headers=HEADERS).json()

@app.post("/mcp/create-file")
def create_file(path: str, content: str):
    data = {"message": "create via MCP","content": base64.b64encode(content.encode()).decode()}
    return requests.put(f"{BASE}/contents/{path}", headers=HEADERS, json=data).json()

@app.post("/mcp/update-file")
def update_file(path: str, content: str, sha: str):
    data = {"message": "update via MCP","content": base64.b64encode(content.encode()).decode(),"sha": sha}
    return requests.put(f"{BASE}/contents/{path}", headers=HEADERS, json=data).json()
