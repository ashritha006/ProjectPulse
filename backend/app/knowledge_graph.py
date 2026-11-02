
import re


STOP_WORDS = {
    "the", "and", "for", "from", "with", "being",
    "after", "before", "task", "module", "should",
    "will", "has", "have", "that", "this"
}


def normalize_words(text: str) -> set:
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())

    normalized = set()

    for word in words:
        if word in STOP_WORDS or len(word) < 3:
            continue

        # Basic normalization for common verb endings
        if word.endswith("ing") and len(word) > 5:
            word = word[:-3]
        elif word.endswith("ed") and len(word) > 4:
            word = word[:-2]

        normalized.add(word)

    return normalized


def build_knowledge_graph(data: dict, document_id: str = None) -> dict:
    nodes = []
    edges = []

    existing_nodes = {}
    existing_edges = set()

    prefix = f"doc:{document_id}:" if document_id else ""

    def add_node(node_id, label, node_type, **properties):
        if node_id not in existing_nodes:
            node = {
                "id": node_id,
                "label": label,
                "type": node_type,
                **properties
            }
            nodes.append(node)
            existing_nodes[node_id] = node

        return node_id

    def add_edge(source, target, relationship):
        edge_key = (source, target, relationship)

        if edge_key not in existing_edges:
            edges.append({
                "source": source,
                "target": target,
                "relationship": relationship
            })
            existing_edges.add(edge_key)

    def find_matching_task(description):
        target_words = normalize_words(description)

        if not target_words:
            return None

        best_match = None
        best_score = 0

        for task_id, task in task_nodes.items():
            task_words = normalize_words(task["description"])

            overlap = len(target_words & task_words)

            if overlap == 0:
                continue

            score = overlap / len(target_words | task_words)

            if score > best_score:
                best_score = score
                best_match = task_id

        # Avoid weak or accidental matches
        if best_score >= 0.35:
            return best_match

        return None

    # 1. People
    for person in data.get("people", []):
        person_id = prefix + f"person:{person.lower().replace(' ', '_')}"
        add_node(person_id, person, "person")

    # 2. Tasks
    task_nodes = {}

    for index, task in enumerate(data.get("tasks", [])):
        task_id = prefix + f"task:{index + 1}"

        add_node(
            task_id,
            task["description"],
            "task",
            owner=task.get("owner"),
            deadline=task.get("deadline"),
            status=task.get("status"),
            evidence=task.get("evidence"),
            source_document=(
                             task.get("source_document_id")
                             or task.get("source_document")
                            )
        )

        task_nodes[task_id] = task

        owner = task.get("owner")

        if owner:
            person_id = prefix + f"person:{owner.lower().replace(' ', '_')}"

            add_node(person_id, owner, "person")
            add_edge(person_id, task_id, "owns")

    # 3. Modules
    for index, module in enumerate(data.get("modules", [])):
        module_id = prefix + f"module:{index + 1}"

        add_node(module_id, module, "module")

        for task_id, task in task_nodes.items():
            if module.lower() in task["description"].lower():
                add_edge(task_id, module_id, "belongs_to")

    # 4. Dependencies
    for index, dependency in enumerate(data.get("dependencies", [])):
        source_name = dependency.get("source_task")
        target_name = dependency.get("depends_on")

        if not source_name or not target_name:
            continue

        source_id = find_matching_task(source_name)

        if not source_id:
            source_id = prefix + f"dependency_task:{index + 1}"

            add_node(
                source_id,
                source_name,
                "task",
                extracted_from_dependency=True,
                evidence=dependency.get("original_text")
            )

        target_id = find_matching_task(target_name)

        if not target_id:
            target_id = prefix + f"dependency_target:{index + 1}"

            add_node(
                target_id,
                target_name,
                "task",
                extracted_from_dependency=True,
                evidence=dependency.get("original_text")
            )

        add_edge(
            source_id,
            target_id,
            dependency.get("relationship", "depends_on")
        )

    # 5. Decisions
    for index, decision in enumerate(data.get("decisions", [])):
        decision_id = prefix + f"decision:{index + 1}"

        add_node(decision_id, decision, "decision")

    # 6. Verification issues
    for index, issue in enumerate(data.get("verification_issues", [])):
        issue_task = (
            issue.get("task_description")
            or issue.get("task", "")
        )

        task_id = find_matching_task(issue_task)

        issue_id = prefix + f"verification:{index + 1}"

        source_document = None

        if task_id:
            source_document = task_nodes[task_id].get("source_document")

        add_node(
            issue_id,
            f"Review: {issue_task or 'Unknown task'}",
            "verification_issue",
            missing_fields=issue.get("missing_fields", []),
            status=issue.get("status"),
            source_document=source_document
        )

        if task_id:
            add_edge(task_id, issue_id, "needs_review")

    return {
        "nodes": nodes,
        "edges": edges
    }
