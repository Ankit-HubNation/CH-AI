from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from sse_starlette.sse import EventSourceResponse

from services.stream_service import StreamService

router = APIRouter()

service = StreamService()


class StreamRequest(BaseModel):
    message: str
    model: Optional[str] = None


@router.post("/stream")
async def stream(request: StreamRequest):

    async def event_generator():

        for token in service.stream(
            request.message,
            request.model
        ):
            yield {
                "event": "message",
                "data": token
            }

    return EventSourceResponse(event_generator())