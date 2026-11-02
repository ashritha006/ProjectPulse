from io import BytesIO
from pypdf import PdfReader
from docx import Document


def extract_text(file_content: bytes, filename: str) -> str:
    extension = filename.lower().rsplit(".", 1)[-1]

    if extension == "pdf":
        reader = PdfReader(BytesIO(file_content))
        return "\n".join(
            page.extract_text() or "" for page in reader.pages
        )

    elif extension == "docx":
        document = Document(BytesIO(file_content))
        return "\n".join(
            paragraph.text for paragraph in document.paragraphs
        )

    elif extension in ("txt", "md"):
        return file_content.decode("utf-8", errors="replace")

    else:
        raise ValueError("Unsupported file format")