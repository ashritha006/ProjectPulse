
from app.database import get_connection
from app.knowledge_reconstructor import reconstruct_knowledge
from app.clarification import apply_clarifications


def aggregate_documents(document_ids: list) -> dict:
    document_ids = list(dict.fromkeys(document_ids))
    if not document_ids:
        raise ValueError("At least one document ID is required")

    # Retrieve uploaded documents
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, filename, extracted_text
                FROM documents
                WHERE id = ANY(%s)
                """,
                (document_ids,)
            )
            rows = cur.fetchall()

    documents = {
        row[0]: {
            "filename": row[1],
            "text": row[2]
        }
        for row in rows
    }

    missing_ids = [
        document_id for document_id in document_ids
        if document_id not in documents
    ]

    if missing_ids:
        raise ValueError(
            f"Documents not found: {', '.join(missing_ids)}"
        )

    # Initialize aggregated project knowledge
    aggregated = {
        "people": [],
        "tasks": [],
        "modules": [],
        "dependencies": [],
        "decisions": [],
        "verification_issues": []
    }

    seen = {
        "people": set(),
        "modules": set(),
        "decisions": set()
    }

    # Process every document
    for document_id in document_ids:

        document = documents[document_id]

        data = reconstruct_knowledge(
            document["text"],
            document["filename"]
        )

        # Incorporate CLARIFY responses
        data = apply_clarifications(document_id, data)

        # Merge people
        for person in data.get("people", []):
            if person not in seen["people"]:
                aggregated["people"].append(person)
                seen["people"].add(person)

        # Merge tasks while preserving their source
        for task in data.get("tasks", []):
            task["source_document_id"] = document_id
            aggregated["tasks"].append(task)

        # Merge modules
        for module in data.get("modules", []):
            if module not in seen["modules"]:
                aggregated["modules"].append(module)
                seen["modules"].add(module)

        # Merge dependencies
        for dependency in data.get("dependencies", []):
            dependency["source_document_id"] = document_id
            aggregated["dependencies"].append(dependency)

        # Merge decisions
        for decision in data.get("decisions", []):
            if decision not in seen["decisions"]:
                aggregated["decisions"].append(decision)
                seen["decisions"].add(decision)

        # Merge verification issues
        for issue in data.get("verification_issues", []):
            issue["source_document_id"] = document_id
            aggregated["verification_issues"].append(issue)

    return {
        "documents_processed": len(document_ids),
        "document_ids": document_ids,
        "project_knowledge": aggregated
    }
