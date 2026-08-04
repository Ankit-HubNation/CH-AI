from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

GENERATE_URL = f"{OLLAMA_HOST}/api/generate"
TAGS_URL = f"{OLLAMA_HOST}/api/tags"

DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen3:8b")