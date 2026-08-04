from fastapi import FastAPI

from api.chat import router as chat_router
from api.models import router as model_router
from api.system import router as system_router
from api.stream import router as stream_router
from api.conversation import router as conversation_router
from api.messages import router as message_router
from api.files import router as file_router
from api.document_chat import router as document_chat_router

from database.connection import engine
from database.models import Base


# Create database tables automatically

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="CH-AI",
    version="1.0.0",
    description="Offline AI Assistant Backend"
)


# Register routes

app.include_router(chat_router)

app.include_router(model_router)

app.include_router(system_router)

app.include_router(stream_router)

app.include_router(conversation_router)

app.include_router(message_router)

app.include_router(file_router)

app.include_router(document_chat_router)


@app.get("/")
def root():

    return {
        "status": "running",
        "project": "CH-AI",
        "version": "1.0.0"
    }