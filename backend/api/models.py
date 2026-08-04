from fastapi import APIRouter

from services.ollama_service import OllamaService

router = APIRouter()

service = OllamaService()

@router.get("/models")
def get_models():
    return service.models()