from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel
from pypdf import PdfReader

from services.ollama_service import OllamaService
from services.chunk_service import split_text


router = APIRouter()

service = OllamaService()


class DocumentRequest(BaseModel):

    filename: str
    question: str
    model: str = "qwen2.5:3b"
    cpu_mode: bool = False


@router.post("/chat-with-document")
def chat_with_document(request: DocumentRequest):

    try:

        file_path = Path("uploads") / request.filename

        if not file_path.exists():

            return {
                "error": "File not found"
            }

        text = ""

        if request.filename.lower().endswith(".pdf"):

            reader = PdfReader(str(file_path))

            pages = []

            for page in reader.pages:

                page_text = page.extract_text()

                if page_text:

                    pages.append(page_text)

            text = "\n".join(pages)

        elif request.filename.lower().endswith(".txt"):

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as f:

                text = f.read()

        else:

            return {
                "error": "Unsupported file format"
            }

        chunks = split_text(
            text,
            chunk_size=100,
            overlap=20
        )

        try:
            from services.vector_store import VectorStore
        except ModuleNotFoundError as exc:
            if exc.name == "sentence_transformers":
                return {
                    "error": "Document chat requires sentence-transformers. Install backend requirements to enable RAG."
                }
            raise

        store = VectorStore()

        store.add_chunks(chunks)

        relevant_chunks = store.search(
            request.question,
            top_k=1
        )

        context = "\n\n".join(relevant_chunks)

        prompt = f"""
Use the context below to answer.

Context:

{context}

Question:

{request.question}

Answer:
"""

        answer, auto_switched = service.generate(
            prompt=prompt,
            model=request.model,
            cpu_mode=request.cpu_mode
        )

        if auto_switched:
            return {
                "error": "Model failed to load. CPU fallback enabled."
            }

        return {
            "filename": request.filename,
            "question": request.question,
            "chunks_used": len(relevant_chunks),
            "answer": answer
        }

    except Exception as e:

        return {
            "error": str(e),
            "type": type(e).__name__
        }
