from fastapi import APIRouter
from pydantic import BaseModel

from database.crud import (
    add_message,
    get_messages
)

router = APIRouter()


class MessageRequest(BaseModel):
    role: str
    content: str


@router.post("/conversation/{chat_id}/message")
def save_message(chat_id: int, request: MessageRequest):
    return add_message(
        chat_id,
        request.role,
        request.content
    )


@router.get("/conversation/{chat_id}/message")
def read_messages(chat_id: int):
    return get_messages(chat_id)