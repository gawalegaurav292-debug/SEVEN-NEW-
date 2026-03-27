import os
import sys
from openai import OpenAI

task = sys.argv[1] if len(sys.argv) > 1 else "fix repo"

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def read_file(path):
    with open(path, "r") as f:
        return f.read()


def write_file(path, content):
    with open(path, "w") as f:
        f.write(content)

FILES = [
    "seven-backend/app/services/style_service.py",
    "seven-backend/app/scraper/hm_scraper.py"
]

for file_path in FILES:
    if not os.path.exists(file_path):
        continue

    original_code = read_file(file_path)

    prompt = f"""
You are a senior backend engineer.

Task: {task}

Fix and improve this code:
- Fix bugs
- Fix imports
- Improve structure
- Keep it working

Return ONLY updated code.

CODE:
{original_code}
"""

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}]
    )

    new_code = response.choices[0].message.content.strip()

    if new_code and new_code != original_code:
        write_file(file_path, new_code)
        print(f"Updated: {file_path}")
    else:
        print(f"No change: {file_path}")
