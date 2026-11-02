
def generate_playbook(data: dict) -> dict:
    tasks = data.get("tasks", [])
    people = data.get("people", [])
    dependencies = data.get("dependencies", [])
    decisions = data.get("decisions", [])
    issues = data.get("verification_issues", [])

    responsibilities = {}

    for task in tasks:
        owner = task.get("owner")
        if owner:
            responsibilities.setdefault(owner, []).append(
                task["description"]
            )

    team_members = [
        {
            "name": person,
            "responsibilities": responsibilities.get(person, [])
        }
        for person in people
    ]

    for owner, assigned_tasks in responsibilities.items():
        if owner not in people:
            team_members.append({
                "name": owner,
                "responsibilities": assigned_tasks
            })

    task_handover = []
    priority_tasks = []
    ownership_gaps = []

    for task in tasks:
        owner = task.get("owner")
        deadline = task.get("deadline")
        description = task["description"]

        task_info = {
            "task": description,
            "owner": owner,
            "deadline": deadline,
            "status": task.get("status"),
            "evidence": task.get("evidence")
        }

        task_handover.append(task_info)

        if not owner:
            ownership_gaps.append(description)

        if not owner or not deadline:
            priority_tasks.append({
                "task": description,
                "reason": "Missing ownership or deadline"
            })

    blocked_tasks = [
        {
            "task": dependency.get("source_task"),
            "blocked_by": dependency.get("depends_on")
        }
        for dependency in dependencies
        if dependency.get("source_task")
        and dependency.get("depends_on")
    ]

    unresolved_items = [
        {
            "task": issue.get("task") or issue.get("task_description"),
            "missing_fields": issue.get("missing_fields", []),
            "status": issue.get("status")
        }
        for issue in issues
    ]

    successor_guidance = []

    if ownership_gaps:
        successor_guidance.append(
            "Assign owners to tasks that currently have no owner."
        )

    if unresolved_items:
        successor_guidance.append(
            "Resolve outstanding verification issues before proceeding."
        )

    if blocked_tasks:
        successor_guidance.append(
            "Review dependencies and unblock dependent tasks."
        )

    return {
        "project_handover": {
            "team_members": team_members,
            "tasks": task_handover,
            "dependencies": dependencies,
            "decisions": decisions,
            "priority_tasks": priority_tasks,
            "blocked_tasks": blocked_tasks,
            "ownership_gaps": ownership_gaps,
            "unresolved_items": unresolved_items,
            "successor_guidance": successor_guidance
        },
        "summary": {
            "total_team_members": len(team_members),
            "total_tasks": len(tasks),
            "total_dependencies": len(dependencies),
            "total_decisions": len(decisions),
            "priority_tasks": len(priority_tasks),
            "blocked_tasks": len(blocked_tasks),
            "ownership_gaps": len(ownership_gaps),
            "unresolved_items": len(unresolved_items)
        }
    }
