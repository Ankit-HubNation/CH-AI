from fastapi import APIRouter, HTTPException

from services.ollama_service import OllamaService

router = APIRouter()

service = OllamaService()

@router.get("/models")
def get_models():
    try:
        return {
            "models": service.models()
        }
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch Ollama models: {exc}"
        )
