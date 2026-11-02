
from pathlib import Path


def generate_markdown(playbook: dict, document_id: str) -> str:
    handover = playbook["project_handover"]
    summary = playbook["summary"]

    lines = [
        "# ProjectPulse — Project Handover",
        "",
        f"**Document ID:** {document_id}",
        "",
        "## 1. Project Summary",
        f"- Team members: {summary['total_team_members']}",
        f"- Total tasks: {summary['total_tasks']}",
        f"- Dependencies: {summary['total_dependencies']}",
        f"- Decisions: {summary['total_decisions']}",
        f"- Priority tasks: {summary['priority_tasks']}",
        f"- Blocked tasks: {summary['blocked_tasks']}",
        f"- Ownership gaps: {summary['ownership_gaps']}",
        f"- Unresolved issues: {summary['unresolved_items']}",
        "",
        "## 2. Team Members and Responsibilities",
    ]

    for person in handover["team_members"]:
        lines.append(f"### {person['name']}")
        for task in person["responsibilities"]:
            lines.append(f"- {task}")

    lines.extend(["", "## 3. Task Handover"])

    for task in handover["tasks"]:
        lines.extend([
            f"### {task['task']}",
            f"- Owner: {task['owner'] or 'Unassigned'}",
            f"- Deadline: {task['deadline'] or 'Not specified'}",
            f"- Status: {task['status'] or 'Unknown'}",
            f"- Evidence: {task['evidence'] or 'Not available'}",
            ""
        ])

    lines.extend(["## 4. Priority Tasks"])

    for item in handover["priority_tasks"]:
        lines.append(f"- {item['task']} — {item['reason']}")

    lines.extend(["", "## 5. Blocked Tasks"])

    for item in handover["blocked_tasks"]:
        lines.append(
            f"- {item['task']} — Blocked by: {item['blocked_by']}"
        )

    lines.extend(["", "## 6. Dependencies"])

    for dependency in handover["dependencies"]:
        lines.append(
            f"- {dependency.get('source_task', 'Unknown')} "
            f"→ {dependency.get('depends_on', 'Unknown')}"
        )

    lines.extend(["", "## 7. Project Decisions"])

    for decision in handover["decisions"]:
        lines.append(f"- {decision}")

    lines.extend(["", "## 8. Ownership Gaps"])

    for task in handover["ownership_gaps"]:
        lines.append(f"- {task}")

    lines.extend(["", "## 9. Unresolved Issues"])

    for issue in handover["unresolved_items"]:
        lines.append(
            f"- {issue['task']}: "
            f"Missing {', '.join(issue['missing_fields'])}"
        )

    lines.extend(["", "## 10. Successor Guidance"])

    for guidance in handover["successor_guidance"]:
        lines.append(f"- {guidance}")

    output_dir = Path(__file__).resolve().parent.parent / "exports"
    output_dir.mkdir(exist_ok=True)

    output_file = output_dir / f"{document_id}_handover.md"
    output_file.write_text("\n".join(lines), encoding="utf-8")

    return str(output_file)


# Maintain compatibility with the existing API
def export_playbook(playbook: dict, document_id: str) -> str:
    return generate_markdown(playbook, document_id)
