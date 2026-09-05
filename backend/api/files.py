from pathlib import Path

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from pypdf import PdfReader


router = APIRouter()

UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    file_path = UPLOAD_DIR / file.filename

    # Save file

    with open(file_path, "wb") as buffer:

        content = await file.read()

        buffer.write(content)

    text = ""

    # TXT support

    if file.filename.lower().endswith(".txt"):

        try:

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as f:

                text = f.read()

        except Exception as e:

            text = str(e)

    # PDF support

    elif file.filename.lower().endswith(".pdf"):

        try:

            reader = PdfReader(str(file_path))

            pages = []

            for page in reader.pages:

                page_text = page.extract_text()

                if page_text:

                    pages.append(page_text)

            text = "\n".join(pages)

        except Exception as e:

            text = str(e)

    return JSONResponse(
        content={
            "filename": file.filename,
            "path": str(file_path),
            "content": text,
            "message": "File uploaded successfully"
        }
    )