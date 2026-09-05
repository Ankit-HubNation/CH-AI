import requests

payload = {
    "model": "qwen2.5:3b",
    "prompt": "What is 10 + 20?",
    "stream": False
}

response = requests.post(
    "http://localhost:11434/api/generate",
    json=payload,
    timeout=300
)

print(response.status_code)
print(response.text)