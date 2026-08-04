from fastapi import APIRouter
from pydantic import BaseModel

from database.crud import (
    create_chat,
    get_chats,
    get_chat,
    search_chats,
    export_chat,
    import_chat,
    delete_chat,
    update_chat_title
)

router = APIRouter()


class RenameRequest(BaseModel):
    title: str


class ImportRequest(BaseModel):
    data: dict


@router.post("/conversation")
def new_chat():

    return create_chat()


@router.get("/conversation")
def conversations():

    return get_chats()


@router.get("/conversation/search")
def search(query: str):

    return search_chats(query)


@router.get("/conversation/{chat_id}")
def conversation(chat_id: int):

    return get_chat(chat_id)


@router.get("/conversation/{chat_id}/export")
def export(chat_id: int):

    return export_chat(chat_id)


@router.post("/conversation/import")
def import_conversation(request: ImportRequest):

    return import_chat(request.data)


@router.patch("/conversation/{chat_id}")
def rename_chat(
    chat_id: int,
    request: RenameRequest
):

    chat = update_chat_title(
        chat_id,
        request.title
    )

    return chat


@router.delete("/conversation/{chat_id}")
def remove_chat(chat_id: int):

    delete_chat(chat_id)

    return {
        "message": "Conversation deleted"
    }