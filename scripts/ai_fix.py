import os
import sys
from openai import OpenAI

task = sys.argv[1] if len(sys.argv) > 1 else "fix repo issues"

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

prompt = f"""
You are a senior backend engineer.

Fix this repo based on task:
{task}

Rules:
- Fix code issues
- Fix imports
- Fix structure
- Ensure production ready
- Modify files directly
"""

response = client.chat.completions.create(
    model="gpt-4.1",
    messages=[{"role": "user", "content": prompt}]
)

print(response.choices[0].message.content)
