from fastapi import APIRouter
import requests

from config.settings import TAGS_URL

router = APIRouter()

@router.get("/health")
def health():
    try:
        requests.get(TAGS_URL, timeout=5)

        return {
            "backend": "online",
            "ollama": "online"
        }

    except Exception:
        return {
            "backend": "online",
            "ollama": "offline"
        }