from datetime import datetime

from database.connection import SessionLocal
from database.models import Conversation, Message


def create_chat(model="qwen3:8b"):

    db = SessionLocal()

    chat = Conversation(
        model=model
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)
    db.close()

    return chat


def get_chats():

    db = SessionLocal()

    chats = (
        db.query(Conversation)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    db.close()

    return chats


def get_chat(chat_id: int):

    db = SessionLocal()

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    db.close()

    return chat


def search_chats(query: str):

    db = SessionLocal()

    chats = (
        db.query(Conversation)
        .filter(
            Conversation.title.ilike(
                f"%{query}%"
            )
        )
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    db.close()

    return chats


def delete_chat(chat_id: int):

    db = SessionLocal()

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    if chat:

        db.delete(chat)
        db.commit()

    db.close()


def update_chat_title(chat_id: int, title: str):

    db = SessionLocal()

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    if chat:

        chat.title = title
        chat.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(chat)

    db.close()

    return chat


def add_message(chat_id: int, role: str, content: str):

    db = SessionLocal()

    message = Message(
        conversation_id=chat_id,
        role=role,
        content=content
    )

    db.add(message)

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    if chat:

        chat.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(message)
    db.close()

    return message


def get_messages(chat_id: int):

    db = SessionLocal()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    db.close()

    return messages


def get_conversation_context(chat_id: int):

    db = SessionLocal()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    db.close()

    context = ""

    for message in messages:

        context += (
            f"{message.role}: "
            f"{message.content}\n"
        )

    return context


def export_chat(chat_id: int):

    db = SessionLocal()

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    if not chat:

        db.close()

        return None

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    data = {
        "id": chat.id,
        "title": chat.title,
        "model": chat.model,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at,
        "messages": []
    }

    for message in messages:

        data["messages"].append(
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at
            }
        )

    db.close()

    return data


def import_chat(data: dict):

    db = SessionLocal()

    chat = Conversation(
        title=data.get("title", "Imported Chat"),
        model=data.get("model", "qwen3:8b")
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    messages = data.get("messages", [])

    for item in messages:

        message = Message(
            conversation_id=chat.id,
            role=item["role"],
            content=item["content"]
        )

        db.add(message)

    db.commit()
    db.refresh(chat)

    db.close()

    return chat