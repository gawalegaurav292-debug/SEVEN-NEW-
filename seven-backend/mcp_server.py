from fastapi import FastAPI
import requests
import os

app = FastAPI()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO = "gawalegaurav292-debug/SEVEN-NEW-"

@app.get("/")
def root():
    return {"status": "SÉVEN MCP running"}

@app.get("/tools")
def tools():
    return {
        "tools": [
            {"name": "list_files", "description": "List repo files"},
            {"name": "create_file", "description": "Create file in repo"}
        ]
    }

@app.get("/list-files")
def list_files():
    url = f"https://api.github.com/repos/{REPO}/contents"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    return requests.get(url, headers=headers).json()
