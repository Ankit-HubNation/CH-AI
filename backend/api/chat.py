from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.ollama_service import OllamaService

from database.crud import (
    add_message,
    get_conversation_context,
    get_chat,
    update_chat_title
)

router = APIRouter()

service = OllamaService()


class ChatRequest(BaseModel):
    conversation_id: int
    message: str
    model: Optional[str] = None
    cpu_mode: bool = True


@router.post("/chat")
def chat(request: ChatRequest):

    print("STEP 1")

    chat_data = get_chat(
        request.conversation_id
    )

    print("STEP 2")

    if not chat_data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    if chat_data["title"] == "New Chat":

        title = request.message[:40]

        update_chat_title(
            request.conversation_id,
            title
        )

    print("STEP 3")

    user_message = add_message(
        request.conversation_id,
        "user",
        request.message
    )

    if not user_message:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    print("STEP 4")

    history = get_conversation_context(
        request.conversation_id
    )

    print("STEP 5")
    print(history)

    response, auto_switched = service.generate(
        prompt=history,
        model=request.model,
        cpu_mode=request.cpu_mode
    )

    if auto_switched:
        raise HTTPException(
            status_code=502,
            detail=response
        )

    print("STEP 6")

    add_message(
        request.conversation_id,
        "assistant",
        response
    )

    print("STEP 7")

    return {
        "conversation_id": request.conversation_id,
        "response": response
    }
