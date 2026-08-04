from services.chunk_service import split_text
from services.vector_store import VectorStore


text = """
Python is a programming language.

FastAPI is a web framework.

Ollama runs AI models.

SQLite stores data.

Machine learning uses vectors.
"""


chunks = split_text(
    text,
    chunk_size=100,
    overlap=20
)


store = VectorStore()

store.add_chunks(chunks)


results = store.search(
    "Which framework is used for APIs?"
)


print(results)