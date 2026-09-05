import numpy as np

from services.embedding_service import EmbeddingService


embedding_service = EmbeddingService()


class VectorStore:

    def __init__(self):

        self.chunks = []
        self.vectors = []

    def add_chunks(self, chunks):

        self.chunks = chunks

        self.vectors = []

        for chunk in chunks:

            vector = embedding_service.embed(chunk)

            self.vectors.append(vector)

    def search(self, query, top_k=3):

        query_vector = np.array(
            embedding_service.embed(query)
        )

        scores = []

        for i, vector in enumerate(self.vectors):

            vector = np.array(vector)

            score = np.dot(
                query_vector,
                vector
            )

            scores.append(
                (score, self.chunks[i])
            )

        scores.sort(
            reverse=True,
            key=lambda x: x[0]
        )

        return [
            chunk
            for score, chunk in scores[:top_k]
        ]