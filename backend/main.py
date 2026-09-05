from datetime import datetime, timezone
import json
import os
import subprocess
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from document_reader import extract_docx, list_docx_files, safe_document_path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
STATE_FILE = PROJECT_DIR / "data" / "backend_state.json"
UPLOAD_DIR = PROJECT_DIR / "uploads"
STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_state() -> dict[str, Any]:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    return {"next_conversation_id": 1, "conversations": [], "messages": {}}


state = load_state()


def save_state() -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def find_conversation(conversation_id: int) -> dict[str, Any] | None:
    return next(
        (item for item in state["conversations"] if item["id"] == conversation_id),
        None,
    )


class ChatRequest(BaseModel):
    conversation_id: int | None = None
    message: str
    model: str = "qwen2.5:3b"
    attachments: list[dict[str, str]] = []


class RenameRequest(BaseModel):
    title: str


class DocumentChatRequest(BaseModel):
    question: str
    model: str = "qwen2.5:3b"
    filename: str


app = FastAPI(
    title="CH-AI",
    version="1.0.0",
    description="Offline AI Assistant Backend",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "running", "project": "CH-AI", "version": "1.0.0"}


@app.get("/hardware")
def get_hardware() -> dict[str, int]:
    try:
        result = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        vram = int(result.strip().splitlines()[0])
    except (FileNotFoundError, IndexError, ValueError, subprocess.CalledProcessError):
        vram = 0
    return {"vram_mb": vram}


@app.get("/models")
def models() -> list[dict[str, Any]]:
    return [
        {
            "id": "qwen2.5:3b",
            "name": "Qwen 2.5 3B",
            "provider": "Local",
            "description": "Local assistant model",
            "tag": "Local",
            "supportsRAG": True,
        },
        {
            "id": "ch-ai-intelligence",
            "name": "CH-AI Intelligence",
            "provider": "CH-AI",
            "description": "General purpose assistant",
            "tag": "Recommended",
            "supportsRAG": True,
        },
    ]


@app.get("/documents")
def documents() -> list[dict[str, Any]]:
    return list_docx_files(PROJECT_DIR)


@app.get("/documents/{filename}")
def document(filename: str) -> dict[str, Any]:
    try:
        path = safe_document_path(PROJECT_DIR, filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="DOCX document not found")
    return {
        "filename": path.name,
        "source": path.parent.name,
        "content": extract_docx(path),
    }


@app.get("/conversation")
def list_conversations() -> list[dict[str, Any]]:
    return sorted(state["conversations"], key=lambda item: item["created_at"], reverse=True)


@app.post("/conversation")
def create_conversation() -> dict[str, Any]:
    conversation_id = state["next_conversation_id"]
    state["next_conversation_id"] += 1
    conversation = {
        "id": conversation_id,
        "title": "New Chat",
        "created_at": now(),
        "last_message": "",
        "model": "qwen2.5:3b",
    }
    state["conversations"].append(conversation)
    state["messages"][str(conversation_id)] = []
    save_state()
    return conversation


@app.get("/conversation/{conversation_id}/message")
def list_messages(conversation_id: int) -> list[dict[str, Any]]:
    if find_conversation(conversation_id) is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return state["messages"].get(str(conversation_id), [])


@app.patch("/conversation/{conversation_id}")
def rename_conversation(conversation_id: int, request: RenameRequest) -> dict[str, Any]:
    conversation = find_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation["title"] = request.title.strip() or "New Chat"
    save_state()
    return conversation


@app.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: int) -> dict[str, bool]:
    if find_conversation(conversation_id) is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    state["conversations"] = [
        item for item in state["conversations"] if item["id"] != conversation_id
    ]
    state["messages"].pop(str(conversation_id), None)
    save_state()
    return {"deleted": True}


def openrouter_token() -> str | None:
    token = os.getenv("OPENROUTER_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN")
    if token:
        return token
    settings_file = Path.home() / ".claude" / "settings.json"
    try:
        settings = json.loads(settings_file.read_text(encoding="utf-8"))
        return settings.get("env", {}).get("ANTHROPIC_AUTH_TOKEN")
    except (OSError, json.JSONDecodeError, AttributeError):
        return None


def assistant_response(
    message: str, model: str, attachments: list[dict[str, str]] | None = None
) -> str:
    if os.getenv("CHAI_PROVIDER", "ollama").lower() == "ollama":
        local_model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
        images = []
        for attachment in attachments or []:
            data_url = attachment.get("data_url", "")
            if data_url.startswith("data:image/") and "," in data_url:
                images.append(data_url.split(",", 1)[1])
        if images:
            return (
                f"The local model {local_model} is text-only and cannot read images. "
                "Use a local vision model such as llava or minicpm-v for image questions."
            )
        try:
            response = httpx.post(
                "http://127.0.0.1:11434/api/chat",
                json={
                    "model": local_model,
                    "messages": [{"role": "user", "content": message}],
                    "stream": False,
                    "options": {"num_ctx": 2048, "num_batch": 128},
                },
                timeout=120.0,
            )
            response.raise_for_status()
            content = response.json().get("message", {}).get("content")
            return content or "The local model returned no assistant content."
        except httpx.HTTPStatusError as error:
            return f"Local Ollama request failed ({error.response.status_code}): {error.response.text[:300]}"
        except httpx.HTTPError as error:
            return f"Could not reach local Ollama: {error}"

    token = openrouter_token()
    if not token:
        return "No OpenRouter API key is configured. Set OPENROUTER_API_KEY and try again."

    provider_model = os.getenv("OPENROUTER_MODEL", "minimax/minimax-m3:free")
    content: list[dict[str, Any]] = [{"type": "text", "text": message}]
    for attachment in attachments or []:
        data_url = attachment.get("data_url", "")
        if data_url.startswith("data:image/"):
            content.append({"type": "image_url", "image_url": {"url": data_url}})
    payload = {
        "model": provider_model,
        "messages": [{"role": "user", "content": content}],
    }
    try:
        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://127.0.0.1:5175",
                "X-Title": "CH-AI",
            },
            json=payload,
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        if content:
            return content
        return "OpenRouter returned no assistant content."
    except httpx.HTTPStatusError as error:
        detail = error.response.text[:300]
        return f"OpenRouter request failed ({error.response.status_code}): {detail}"
    except httpx.HTTPError as error:
        return f"Could not reach OpenRouter: {error}"


@app.post("/chat")
def chat(request: ChatRequest) -> dict[str, Any]:
    conversation_id = request.conversation_id
    if conversation_id is None or find_conversation(conversation_id) is None:
        conversation = create_conversation()
        conversation_id = conversation["id"]
    response_text = assistant_response(request.message, request.model, request.attachments)
    timestamp = now()
    messages = state["messages"].setdefault(str(conversation_id), [])
    messages.extend(
        [
            {
                "id": f"user-{len(messages) + 1}",
                "sender": "user",
                "content": request.message,
                "created_at": timestamp,
            },
            {
                "id": f"assistant-{len(messages) + 2}",
                "sender": "assistant",
                "content": response_text,
                "created_at": timestamp,
            },
        ]
    )
    conversation = find_conversation(conversation_id)
    if conversation:
        conversation["last_message"] = response_text
        conversation["model"] = request.model
    save_state()
    return {"response": response_text, "reasoningTime": 0.1, "conversation_id": conversation_id}


@app.post("/upload")
def upload_document(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = Path(file.filename or "upload.bin").name
    destination = UPLOAD_DIR / filename
    content = file.file.read()
    destination.write_bytes(content)
    return {"filename": filename, "content": content.decode("utf-8", errors="ignore")}


@app.post("/chat-with-document")
def chat_with_document(request: DocumentChatRequest) -> dict[str, Any]:
    try:
        document = safe_document_path(PROJECT_DIR, request.filename)
        document_text = extract_docx(document)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="DOCX document not found")
    context = document_text[:12000]
    response_text = assistant_response(
        f"Use this DOCX context to answer the question.\n\nDOCUMENT:\n{context}\n\nQUESTION:\n{request.question}",
        request.model,
    )
    return {
        "response": response_text,
        "reasoningTime": 0.1,
        "citations": [document.name],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
