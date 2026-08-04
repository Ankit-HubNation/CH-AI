from typing import Optional

from fastapi import APIRouter
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


@router.post("/chat")
def chat(request: ChatRequest):

    print("STEP 1")

    chat_data = get_chat(
        request.conversation_id
    )

    print("STEP 2")

    if (
        chat_data
        and chat_data.title == "New Chat"
    ):

        title = request.message[:40]

        update_chat_title(
            request.conversation_id,
            title
        )

    print("STEP 3")

    add_message(
        request.conversation_id,
        "user",
        request.message
    )

    print("STEP 4")

    history = get_conversation_context(
        request.conversation_id
    )

    print("STEP 5")
    print(history)

    response = service.generate(
        prompt=history,
        model=request.model
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