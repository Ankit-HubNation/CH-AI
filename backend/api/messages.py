from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.crud import (
    add_message,
    get_chat,
    get_messages
)

router = APIRouter()


class MessageRequest(BaseModel):
    role: str
    content: str


@router.post("/conversation/{chat_id}/message")
def save_message(chat_id: int, request: MessageRequest):
    message = add_message(
        chat_id,
        request.role,
        request.content
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return message


@router.get("/conversation/{chat_id}/message")
def read_messages(chat_id: int):
    if not get_chat(chat_id):
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return get_messages(chat_id)
