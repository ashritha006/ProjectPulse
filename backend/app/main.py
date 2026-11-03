from fastapi import FastAPI, UploadFile, File, HTTPException
from uuid import uuid4
from app.knowledge_graph import build_knowledge_graph
from app.document_extractor import extract_text
from app.knowledge_reconstructor import reconstruct_knowledge
from app.database import get_connection
from app.database_setup import create_tables
from app.clarification import save_clarification, apply_clarifications
from app.playbook_generator import generate_playbook
from fastapi.responses import FileResponse
from app.playbook_exporter import export_playbook
from pydantic import BaseModel
from app.project_aggregator import aggregate_documents
from fastapi.middleware.cors import CORSMiddleware
def save_document_to_database(
    document_id: str,
    filename: str,
    extracted_text: str,
    data: dict
):
    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                INSERT INTO documents (id, filename, extracted_text)
                VALUES (%s, %s, %s)
                """,
                (document_id, filename, extracted_text)
            )

            for person in data.get("people", []):
                cur.execute(
                    "INSERT INTO people (document_id, name) VALUES (%s, %s)",
                    (document_id, person)
                )

            for task in data.get("tasks", []):
                cur.execute(
                    """
                    INSERT INTO tasks
                    (document_id, description, owner, deadline,
                     status, evidence, source_document)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        document_id,
                        task["description"],
                        task.get("owner"),
                        task.get("deadline"),
                        task.get("status"),
                        task.get("evidence"),
                        task.get("source_document")
                    )
                )

            for module in data.get("modules", []):
                cur.execute(
                    "INSERT INTO modules (document_id, name) VALUES (%s, %s)",
                    (document_id, module)
                )

            for dependency in data.get("dependencies", []):
                cur.execute(
                    """
                    INSERT INTO dependencies
                    (document_id, source_task, depends_on,
                     relationship, original_text)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        document_id,
                        dependency.get("source_task"),
                        dependency.get("depends_on"),
                        dependency.get("relationship"),
                        dependency.get("original_text")
                    )
                )

            for decision in data.get("decisions", []):
                cur.execute(
                    """
                    INSERT INTO decisions (document_id, description)
                    VALUES (%s, %s)
                    """,
                    (document_id, decision)
                )

            for issue in data.get("verification_issues", []):
                cur.execute(
                    """
                    INSERT INTO verification_issues
                    (document_id, task_description, missing_fields, status)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        document_id,
                        issue.get("task"),
                        issue.get("missing_fields"),
                        issue.get("status")
                    )
                )

    return True
class ProjectAggregationRequest(BaseModel):
    document_ids: list[str]
app = FastAPI(title="ProjectPulse API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://project-pulse-rho-three.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ProjectPulse API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/v1/documents/extract")
async def extract_document(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided"
        )

    try:
        # Step 1: Read the uploaded document
        file_content = await file.read()

        # Step 2: Extract document text
        extracted_text = extract_text(
            file_content,
            file.filename
        )

        # Step 3: Reconstruct project knowledge
        reconstructed_data = reconstruct_knowledge(
            extracted_text,
            file.filename
        )

        document_id = f"doc_{uuid4().hex[:8]}"

        save_document_to_database(
              document_id,
              file.filename,
              extracted_text,
              reconstructed_data
        )
        knowledge_graph = build_knowledge_graph(reconstructed_data, document_id)
        # Step 4: Return the result
        return {
            "document_id": document_id,
            "filename": file.filename,
            "status": "success",
            "extracted_text": extracted_text,
            "extracted_data": reconstructed_data,
            "knowledge_graph": knowledge_graph
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Document extraction failed: {str(error)}"
        )
@app.post("/api/v1/clarifications")
async def submit_clarification(
    document_id: str,
    task_description: str,
    field_name: str,
    clarified_value: str
):
    try:
        clarification_id = save_clarification(
            document_id=document_id,
            task_description=task_description,
            field_name=field_name,
            original_value=None,
            clarified_value=clarified_value
        )

        return {
            "status": "success",
            "message": "Clarification saved successfully",
            "clarification_id": clarification_id
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save clarification: {str(error)}"
        )

@app.get("/api/v1/documents/{document_id}/knowledge-graph")
def get_updated_knowledge_graph(document_id: str):
    try:
        # 1. Retrieve the original document text
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT filename, extracted_text FROM documents WHERE id = %s",
                    (document_id,)
                )
                document = cur.fetchone()

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        filename, extracted_text = document

        # 2. Reconstruct the original project knowledge
        reconstructed_data = reconstruct_knowledge(
            extracted_text,
            filename
        )

        # 3. Apply saved CLARIFY responses
        updated_data = apply_clarifications(
            document_id,
            reconstructed_data
        )

        # 4. Rebuild the MAPPER knowledge graph
        updated_graph = build_knowledge_graph(updated_data, document_id)

        return {
            "document_id": document_id,
            "status": "success",
            "updated_data": updated_data,
            "updated_knowledge_graph": updated_graph
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Knowledge graph update failed: {str(error)}"
        )        
@app.get("/api/v1/documents/{document_id}/playbook")
def get_project_playbook(document_id: str):
    try:
        # Retrieve document
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT filename, extracted_text
                    FROM documents
                    WHERE id = %s
                    """,
                    (document_id,)
                )
                document = cur.fetchone()

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        filename, extracted_text = document

        # Reconstruct project knowledge
        reconstructed_data = reconstruct_knowledge(
            extracted_text,
            filename
        )

        # Apply user clarifications
        updated_data = apply_clarifications(
            document_id,
            reconstructed_data
        )

        # Generate project handover
        playbook = generate_playbook(updated_data)

        return {
            "document_id": document_id,
            "status": "success",
            "playbook": playbook
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Playbook generation failed: {str(error)}"
        )
@app.get("/api/v1/documents/{document_id}/playbook/download")
def download_playbook(document_id: str):
    try:
        # Retrieve document
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT filename, extracted_text FROM documents WHERE id = %s",
                    (document_id,)
                )
                document = cur.fetchone()

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        filename, extracted_text = document

        # Reconstruct knowledge
        data = reconstruct_knowledge(extracted_text, filename)

        # Apply clarifications
        updated_data = apply_clarifications(document_id, data)

        # Generate playbook
        playbook = generate_playbook(updated_data)

        # Export Markdown file
        file_path = export_playbook(playbook, document_id)

        return FileResponse(
            path=file_path,
            media_type="text/markdown",
            filename=f"{document_id}_handover.md"
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Playbook download failed: {str(error)}"
        )

@app.post("/api/v1/projects/aggregate")
def aggregate_project(request: ProjectAggregationRequest):
    try:
        result = aggregate_documents(request.document_ids)

        project_data = result["project_knowledge"]

        graph = build_knowledge_graph(
            project_data,
            "project_aggregate"
        )

        playbook = generate_playbook(project_data)

        return {
            "status": "success",
            "documents_processed": result["documents_processed"],
            "project_knowledge": project_data,
            "knowledge_graph": graph,
            "playbook": playbook
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Project aggregation failed: {str(error)}"
        )        