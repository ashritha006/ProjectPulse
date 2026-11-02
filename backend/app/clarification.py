from app.database import get_connection


def save_clarification(
    document_id: str,
    task_description: str,
    field_name: str,
    original_value: str,
    clarified_value: str
):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO clarifications (
                    document_id,
                    task_description,
                    field_name,
                    original_value,
                    clarified_value
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    document_id,
                    task_description,
                    field_name,
                    original_value,
                    clarified_value
                )
            )

            clarification_id = cur.fetchone()[0]

            allowed_fields = {"owner", "deadline", "status"}

            if field_name not in allowed_fields:
                raise ValueError("Unsupported clarification field")

            cur.execute(
                f"""
                UPDATE tasks
                SET {field_name} = %s
                WHERE document_id = %s
                AND description = %s
                """,
                (clarified_value, document_id, task_description)
            )

            if cur.rowcount == 0:
                raise ValueError("Matching task not found")

    return clarification_id

def get_clarifications(document_id: str) -> list:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT task_description, field_name, clarified_value
                FROM clarifications
                WHERE document_id = %s
                ORDER BY id
                """,
                (document_id,)
            )

            rows = cur.fetchall()

    return [
        {
            "task_description": row[0],
            "field_name": row[1],
            "clarified_value": row[2]
        }
        for row in rows
    ]    

def apply_clarifications(document_id: str, data: dict) -> dict:
    clarifications = get_clarifications(document_id)

    for clarification in clarifications:
        for task in data.get("tasks", []):
            if task["description"] == clarification["task_description"]:
                field = clarification["field_name"]

                if field in ("owner", "deadline", "status"):
                    task[field] = clarification["clarified_value"]

    # Remove verification issues whose missing fields are now resolved
    remaining_issues = []

    for issue in data.get("verification_issues", []):
        issue_task = issue.get("task_description") or issue.get("task")

        matching_task = next(
            (
                task for task in data.get("tasks", [])
                if task["description"] == issue_task
            ),
            None
        )

        if matching_task:
            issue["missing_fields"] = [
                field for field in issue.get("missing_fields", [])
                if not matching_task.get(field)
            ]

        if issue.get("missing_fields"):
            remaining_issues.append(issue)

    data["verification_issues"] = remaining_issues

    return data    