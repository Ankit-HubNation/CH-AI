from datetime import datetime

from database.connection import SessionLocal
from database.models import Conversation, Message


def serialize_chat(chat):
    if not chat:
        return None

    return {
        "id": chat.id,
        "title": chat.title,
        "model": chat.model,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at
    }


def serialize_message(message):
    if not message:
        return None

    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at
    }


def create_chat(model="qwen2.5:3b"):

    db = SessionLocal()

    chat = Conversation(
        model=model
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)
    result = serialize_chat(chat)

    db.close()

    return result


def get_chats():

    db = SessionLocal()

    chats = (
        db.query(Conversation)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    result = [
        serialize_chat(chat)
        for chat in chats
    ]

    db.close()

    return result


def get_chat(chat_id: int):

    db = SessionLocal()

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    result = serialize_chat(chat)

    db.close()

    return result


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

    result = [
        serialize_chat(chat)
        for chat in chats
    ]

    db.close()

    return result


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

    result = serialize_chat(chat)

    db.close()

    return result


def add_message(chat_id: int, role: str, content: str):

    db = SessionLocal()

    chat = (
        db.query(Conversation)
        .filter(Conversation.id == chat_id)
        .first()
    )

    if not chat:

        db.close()

        return None

    message = Message(
        conversation_id=chat_id,
        role=role,
        content=content
    )

    db.add(message)

    chat.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(message)
    result = serialize_message(message)
    db.close()

    return result


def get_messages(chat_id: int):

    db = SessionLocal()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    result = [
        serialize_message(message)
        for message in messages
    ]

    db.close()

    return result


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
        model=data.get("model", "qwen2.5:3b")
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
    result = serialize_chat(chat)
    db.close()

    return result
