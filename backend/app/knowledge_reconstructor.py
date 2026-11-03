import re


def reconstruct_knowledge(text: str, filename: str = "unknown") -> dict:
    lines = [
        sentence.strip()
        for line in text.splitlines()
        for sentence in re.split(r'(?<=[.!?])\s+', line)
        if sentence.strip()
    ]

    people = set()
    tasks = []
    modules = set()
    dependencies = []
    decisions = []

    task_keywords = [
        "complete", "develop", "implement", "create", "build",
        "fix", "test", "design", "update", "review", "integrate",
        "deploy", "configure", "prepare", "maintain", "manage",
        "analyze", "validate", "document", "install"
    ]

    decision_keywords = [
        "decided", "decision", "agreed", "selected",
        "chosen", "will use", "opted for", "approved"
    ]

    dependency_keywords = [
        "depends on", "dependency", "after completing",
        "requires", "blocked by", "before",
        "must be completed"
    ]

    # 1. Identify people and roles
    for line in lines:
        # Examples: Name: Nikitha, Owner: Nikitha
        labelled_match = re.search(
            r"\b(?:person|name|owner|assigned to|responsible person)"
            r"\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            line,
            re.IGNORECASE
        )

        if labelled_match:
            people.add(labelled_match.group(1).strip())

        # Examples: Nikitha will develop the backend.
        action_match = re.match(
            r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+"
            r"(?:will|is|has|can|should|must)\b",
            line
        )

        if action_match:
            people.add(action_match.group(1).strip())

        # Examples: Developer: Nikitha
        role_match = re.search(
            r"\b(?:developer|manager|designer|tester|lead|"
            r"administrator|analyst)\s*:\s*"
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            line,
            re.IGNORECASE
        )

        if role_match:
            people.add(role_match.group(1).strip())

    # 2. Identify dependencies
    for line in lines:
        match = re.search(
            r"(.+?)\s+depends on\s+(.+)",
            line,
            re.IGNORECASE
        )

        if match:
            dependencies.append({
                "source_task": match.group(1).strip(" -*."),
                "depends_on": match.group(2).strip(" -*."),
                "relationship": "blocked_by",
                "original_text": line
            })
            continue

        before_match = re.search(
            r"(.+?)\s+must be completed\s+before\s+(.+)",
            line,
            re.IGNORECASE
        )

        if before_match:
            dependencies.append({
                "source_task": before_match.group(2).strip(" -*."),
                "depends_on": before_match.group(1).strip(" -*."),
                "relationship": "blocked_by",
                "original_text": line
            })
            continue

        if any(word in line.lower() for word in dependency_keywords):
            dependencies.append({
                "original_text": line,
                "relationship": "unclassified"
            })

    # 3. Identify tasks, owners and deadlines
    for line in lines:
        lower_line = line.lower()

        if any(word in lower_line for word in dependency_keywords):
            continue

        has_task_keyword = any(
            re.search(r"\b" + re.escape(keyword) + r"\b", lower_line)
            for keyword in task_keywords
        )

        if not has_task_keyword:
            continue

        owner_match = re.match(
            r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+will\s+",
            line
        )

        owner = owner_match.group(1) if owner_match else None

        if owner:
            people.add(owner)

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

        description = description.strip(" -*.")

        if description:
            tasks.append({
                "description": description,
                "owner": owner,
                "deadline": deadline,
                "status": "identified",
                "evidence": line,
                "source_document": filename
            })

    # 4. Identify modules
    for line in lines:
        labelled_module = re.search(
            r"\bmodule\s*:\s*(.+)",
            line,
            re.IGNORECASE
        )

        if labelled_module:
            modules.add(labelled_module.group(1).strip(" -*."))

        reverse_module = re.search(
            r"\b([A-Za-z][A-Za-z0-9_-]*)\s+module\b",
            line,
            re.IGNORECASE
        )

        if reverse_module:
            modules.add(reverse_module.group(1))

    # 5. Identify decisions
    for line in lines:
        if any(word in line.lower() for word in decision_keywords):
            decisions.append(line)

    # 6. Identify verification issues
    verification_issues = []

    for task in tasks:
        missing_fields = []

        if not task["owner"]:
            missing_fields.append("owner")

        if not task["deadline"]:
            missing_fields.append("deadline")

        if not task["evidence"]:
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
