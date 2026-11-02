
import re


def reconstruct_knowledge(text: str, filename: str = "unknown") -> dict:

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    people = set()
    tasks = []
    modules = set()
    dependencies = []
    decisions = []

    task_keywords = [
        "complete", "develop", "implement",
        "create", "build", "fix", "test",
        "design", "update", "review"
    ]

    dependency_keywords = [
        "depends on", "dependency",
        "after completing", "requires", "blocked by",
        "before", "must be completed"
    ]

    decision_keywords = [
        "decided", "decision", "agreed",
        "selected", "chosen", "will use"
    ]

    # 1. Identify likely people
    for line in lines:
        matches = re.findall(
            r"\b([A-Z][a-z]+)(?=\s+(?:will|is|has|can|should|must))",
            line
        )
        people.update(matches)

    
    
    # 2. Identify and structure dependencies
    for line in lines:

        match = re.search(
            r"(.+?)\s+depends on\s+(.+)",
            line,
            re.IGNORECASE
        )

        if match:
            source_task = match.group(1).strip()
            depends_on = match.group(2).strip().rstrip(".")

            dependencies.append({
                "source_task": source_task,
                "depends_on": depends_on,
                "relationship": "blocked_by",
                "original_text": line
            })

        else:
            before_match = re.search(
                r"(.+?)\s+must be completed\s+before\s+(.+)",
                line,
                re.IGNORECASE
            )

            if before_match:
                prerequisite = before_match.group(1).strip()
                following_task = before_match.group(2).strip().rstrip(".")

                dependencies.append({
                    "source_task": following_task,
                    "depends_on": prerequisite,
                    "relationship": "blocked_by",
                    "original_text": line
                })

            elif any(word in line.lower() for word in dependency_keywords):
                dependencies.append({
                    "original_text": line,
                    "relationship": "unclassified"
                })

    # 3. Identify tasks, owners and deadlines
    for line in lines:

        is_dependency = any(
            word in line.lower() for word in dependency_keywords
        )

        has_task_keyword = any(
            re.search(r"\b" + re.escape(keyword) + r"\b", line.lower())
            for keyword in task_keywords
        )

        if not is_dependency and has_task_keyword:

            # Identify task owner
            owner_match = re.match(
                r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+will\s+",
                line
            )

            owner = owner_match.group(1) if owner_match else None

            # Identify deadline
            deadline_match = re.search(
                r"\b(?:by|before|on|due(?:\s+by)?)\s+"
                r"((?:January|February|March|April|May|June|July|"
                r"August|September|October|November|December)"
                r"\s+\d{1,2}(?:,?\s+\d{4})?|"
                r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
                line,
                re.IGNORECASE
            )

            deadline = deadline_match.group(1) if deadline_match else None

            # Create a cleaner task description
            description = line

            if owner_match:
                description = description[owner_match.end():]

            if deadline_match:
                description = re.sub(
                    r"\s+(?:by|before|on|due(?:\s+by)?)\s+"
                    + re.escape(deadline) + r"\.?\s*$",
                    "",
                    description,
                    flags=re.IGNORECASE
                )

            description = description.strip(" .")

            tasks.append({
                "description": description,
                "owner": owner,
                "deadline": deadline,
                "status": "identified",
                "evidence": line,
                "source_document": filename,
            })

    # 4. Identify modules
    for line in lines:
        matches = re.findall(
            r"\b([A-Za-z][A-Za-z0-9_-]*)\s+module\b",
            line,
            re.IGNORECASE
        )
        modules.update(matches)

    # 5. Identify decisions
    for line in lines:
        if any(word in line.lower() for word in decision_keywords):
            decisions.append(line)
        
    # 6. Identify verification issues
    verification_issues = []
    for index, task in enumerate(tasks):
        missing_fields = []

        if not task.get("owner"):
            missing_fields.append("owner")

        if not task.get("deadline"):
            missing_fields.append("deadline")

        if not task.get("evidence"):
            missing_fields.append("evidence")

        if missing_fields:
            verification_issues.append({
                "task": task["description"],
                "missing_fields": missing_fields,
                "status": "needs_review"
            })
    return {
        "people": sorted(people),
        "tasks": tasks,
        "modules": sorted(modules),
        "dependencies": dependencies,
        "decisions": decisions,
        "verification_issues": verification_issues
    }
