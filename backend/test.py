from services.chunk_service import split_text


text = """
This is a very long document.
""" * 100


chunks = split_text(text)


print(f"Number of chunks: {len(chunks)}")

for i, chunk in enumerate(chunks):

    print(f"\nChunk {i + 1}")

    print(chunk[:100])