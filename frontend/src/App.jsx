import { useState } from "react";
import "./App.css";

const sections = [
  ["overview", "Overview"],
  ["sources", "Source Upload"],
  ["extracted", "Extracted Knowledge"],
  ["mapper", "MAPPER"],
  ["graph", "Knowledge Graph"],
  ["gaps", "Knowledge Gaps"],
  ["handover", "Handover Playbook"]
];

const sample = {
  people: [
    { name: "Aarav Sharma", role: "Project Lead", responsibility: "Planning and team coordination" },
    { name: "Maya Patel", role: "Frontend Developer", responsibility: "Dashboard UI & responsiveness" },
    { name: "Rohan Das", role: "Backend Developer", responsibility: "API design and database" }
  ],
  tasks: [
    { name: "Build professional dashboard UI", owner: "Maya Patel", status: "Completed" },
    { name: "Configure document extraction pipeline", owner: "Rohan Das", status: "In progress" },
    { name: "Validate team handover playbook", owner: "Aarav Sharma", status: "Pending" }
  ],
  modules: [
    { name: "ProjectPulse Core", details: "State management and layout hierarchy." },
    { name: "Source Ingestion", details: "File processing for PDF, DOCX, CSV, TXT, and MD." },
    { name: "Knowledge Matrix", details: "Visualizes personnel, tasks, and dependency links." }
  ],
  dependencies: [
    "ProjectPulse Core → manages state for → Source Ingestion",
    "Source Ingestion → feeds data into → Knowledge Matrix",
    "Aarav Sharma → oversees → Validation Tasks",
    "Rohan Das → implements → API & Database Modules"
  ],
  gaps: [
    "Confirm final cloud deployment URLs with the infrastructure team.",
    "Document automated database backup and recovery procedures.",
    "Finalize strict acceptance criteria for playbook validation milestones."
  ]
};

export default function App() {
  const [files, setFiles] = useState([]);
  const [extractedDocuments, setExtractedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("CODENOVA Enterprise Project");
  const [message, setMessage] = useState("");
  const [active, setActive] = useState("overview");
  const [ready, setReady] = useState(false);
  const [projectResult, setProjectResult] = useState(null);
  const [aggregationError, setAggregationError] = useState("");
  const extractedData = extractedDocuments.reduce(
  (combined, document) => {
    const data = document.extracted_data || {};
  
    return {
      people: [...combined.people, ...(data.people || [])],
      tasks: [...combined.tasks, ...(data.tasks || [])],
      modules: [...combined.modules, ...(data.modules || [])],
      dependencies: [...combined.dependencies, ...(data.dependencies || [])],
      decisions: [...combined.decisions, ...(data.decisions || [])],
      verification_issues: [
        ...combined.verification_issues,
        ...(data.verification_issues || []),
      ],
    };
  },
  {
    people: [],
    tasks: [],
    modules: [],
    dependencies: [],
    decisions: [],
    verification_issues: [],
  }
);
console.log("TASK TRACKER DATA:", extractedData.tasks);
console.log("DEPENDENCY DATA:", extractedData.dependencies);
  function handleFiles(event) {
    const picked = Array.from(event.target.files || []);
    const allowed = [".pdf", ".docx", ".txt", ".md"];
    const valid = picked.filter(file =>
      allowed.some(ext => file.name.toLowerCase().endsWith(ext))
    );

    setFiles(old => [
      ...old,
      ...valid
    ].filter((file, index, arr) => 
      arr.findIndex(item => item.name === file.name && item.size === file.size) === index
    ));

    setMessage(
      valid.length !== picked.length
        ? "Some files were skipped. Allowed formats: PDF, DOCX, CSV, TXT, MD."
        : valid.length
        ? "Documents loaded successfully. Click 'Initialize Extraction' below."
        : ""
    );
    event.target.value = "";
  }

  function removeFile(index) {
    setFiles(old => old.filter((_, i) => i !== index));
    setMessage("File removed from staging list.");
  }

  
async function runExtraction() {
  if (!files.length) {
    setMessage("Please select at least one document source first.");
    return;
  }

  setLoading(true);
  setReady(false);
  setMessage("Uploading documents and extracting information...");

  try {
    const results = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/documents/extract",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${file.name}: ${errorText}`);
      }

      const result = await response.json();
      results.push(result);
    }

    setExtractedDocuments(results);

try {
  const aggregateResponse = await fetch(
    "http://127.0.0.1:8000/api/v1/projects/aggregate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_ids: results.map(doc => doc.document_id),
      }),
    }
  );

  if (!aggregateResponse.ok) {
    throw new Error(await aggregateResponse.text());
  }

  const aggregateData = await aggregateResponse.json();
  console.log("FULL AGGREGATION RESPONSE:", aggregateData);
  console.log("PLAYBOOK RESPONSE:", aggregateData.playbook);
  console.log(
  "PROJECT HANDOVER DETAILS:",
  JSON.stringify(aggregateData.playbook.project_handover, null, 2)
);
  setProjectResult(aggregateData);
  setAggregationError("");
} catch (error) {
  console.error("Aggregation error:", error);
  setAggregationError(error.message);
}

setReady(true);
setMessage(`Successfully processed ${results.length} document(s).`);
  } catch (error) {
    console.error("Extraction error:", error);
    setMessage(`Extraction failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}


  function navigate(id) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  
function exportPlaybook() {
  const generatedPlaybook = projectResult?.playbook;

  if (!generatedPlaybook) {
    setMessage("No generated playbook is available. Run extraction first.");
    return;
  }

  const content =
    typeof generatedPlaybook === "string"
      ? generatedPlaybook
      : JSON.stringify(generatedPlaybook, null, 2);

  const blob = new Blob([content], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ProjectPulse_Handover_Playbook.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  setMessage("Generated handover playbook downloaded successfully.");
}


  return (
    <div className="app-container">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <h2>ProjectPulse</h2>
          <span>Intelligent Handover</span>
        </div>

        <nav className="sidebar-nav">
          {sections.map(([id, label]) => (
            <button
              key={id}
              className={`nav-link ${active === id ? "active" : ""}`}
              onClick={() => navigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>CODENOVA</strong>
          <small>Enterprise Knowledge Platform</small>
        </div>
      </aside>

      <main className="app-main">
        {ready && (
          <div className="banner-notice">
            SYSTEM STATUS: Extraction pipeline active. Knowledge graph synchronized.
          </div>
        )}

        <section id="overview" className="content-section">
          <div className="section-eyebrow">CODENOVA · ENTERPRISE KNOWLEDGE PLATFORM</div>
          <h1>Project Knowledge Overview</h1>
          <p className="section-subtitle">Reconstruct, connect, and preserve critical engineering knowledge seamlessly.</p>

          <div className="hero-banner">
            <h2>Welcome to ProjectPulse</h2>
            <p>
              Transform scattered documentation and team updates into connected, structured, and actionable intelligence for frictionless employee onboarding and handovers.
            </p>
          </div>

          <div className="card input-card">
            <h3>Active Project Name</h3>
            <input
              className="text-input"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Enter enterprise project name"
            />
          </div>

          <h2>Core Knowledge Categories</h2>
          <div className="grid-2col">
            {[
              ["People", "Mapping key team members, structural roles, and individual ownership."],
              ["Tasks", "Tracking active milestones, completed objectives, and pending deliverables."],
              ["Modules", "Cataloging technical subsystems, services, and architectural components."],
              ["Dependencies", "Defining relationships across people, workflows, and core architecture."]
            ].map(([title, desc]) => (
              <div className="card feature-card" key={title}>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>

          <h2>Platform Workflow</h2>
          <div className="workflow-container">
            {[
              "Upload multi-format project sources",
              "Execute automated information extraction",
              "MAPPER categorizes structural knowledge",
              "GRAPH visualizes relational dependencies",
              "Highlight structural knowledge gaps",
              "Compile comprehensive handover playbook",
              "Review, export, and distribute across team laptops"
            ].map((step, i) => (
              <div className="workflow-step-item" key={step}>
                <span className="step-badge">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="sources" className="content-section">
          <h2>Source Document Upload</h2>
          <p className="section-subtitle">Supported file formats: PDF, DOCX, CSV, TXT, and Markdown (.md).</p>

          <div className="card upload-card">
            <h3>Staging Area</h3>
            <label className="browse-button">
              Browse Local Files
              <input
  type="file"
  accept=".pdf,.docx,.txt,.md"
  multiple
  onChange={handleFiles}
/>
            </label>

            <div className="file-heading">
              <h3>Staged Documents ({files.length})</h3>
              <span>{files.length > 0 ? "Ready for extraction" : "Queue empty"}</span>
            </div>

            {!files.length ? (
              <p className="section-subtitle">No files selected yet.</p>
            ) : (
              files.map((file, i) => (
                <div className="file-row" key={`${file.name}-${i}`}>
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <small>{(file.size / 1024).toFixed(1)} KB</small>
                  </div>
                  <button className="remove-btn" onClick={() => removeFile(i)}>Remove</button>
                </div>
              ))
            )}

            <button className="primary-action-btn" onClick={runExtraction} style={{ marginTop: "20px" }}>
              Initialize Extraction Pipeline
            </button>

            {message && <div className="status-toast">{message}</div>}
          </div>
        </section>

        <section id="extracted" className="content-section">
          <h2>Extracted Knowledge Matrix</h2>
          {!ready ? (
            <div className="card">
              <p className="section-subtitle">Upload documentation and initialize extraction to populate structured records.</p>
            </div>
          ) : (
            <div className="grid-2col">
              <div className="card">
                <h3>People Directory</h3>
                {extractedData.people.map((person, i) => (
  <div className="data-row" key={i}>
    <strong>{person.name || "Unnamed person"}</strong>
    <p>Role: {person.role || "Not specified"}</p>
  </div>
))}
              </div>

              <div className="card">
                <h3>Task Tracker</h3>
                {extractedData.tasks.map((task, i) => (
  <div className="data-row" key={i}>
    <strong>
  {task.description || task.name || task.title || task.task || "Unnamed task"}
</strong>
    <p>Status: {task.status || "Not specified"}</p>
    <p>Owner: {task.owner || "Unassigned"}</p>
    <p>Deadline: {task.deadline || "Not specified"}</p>
  </div>
))}
              </div>
            </div>
          )}
        </section>

        
<section id="mapper" className="content-section">
  <h2>MAPPER – Knowledge Organisation</h2>

  <div className="grid-2col">
    <div className="card">
      <h3>PEOPLE</h3>
      {extractedData.people.map((person, i) => (
        <div className="data-row" key={i}>
          <strong>{person.name || "Unnamed person"}</strong>
          <p>{person.role || person.responsibility || "Responsibility not specified"}</p>
        </div>
      ))}
      {!extractedData.people.length && <p>No people identified.</p>}
    </div>

    <div className="card">
      <h3>TASKS</h3>
      {extractedData.tasks.map((task, i) => (
        <div className="data-row" key={i}>
          <strong>
            {task.description || task.name || task.title || task.task || "Unnamed task"}
          </strong>
          <p>Owner: {task.owner || "Unassigned"}</p>
          <p>Status: {task.status || "Not specified"}</p>
        </div>
      ))}
      {!extractedData.tasks.length && <p>No tasks identified.</p>}
    </div>

    <div className="card">
      <h3>MODULES</h3>
      {extractedData.modules.map((module, i) => (
        <div className="data-row" key={i}>
          <strong>{module.name || module.module || module}</strong>
        </div>
      ))}
      {!extractedData.modules.length && <p>No modules identified.</p>}
    </div>

    <div className="card">
      <h3>DEPENDENCIES</h3>
      {extractedData.dependencies.map((dep, i) => (
        <div className="data-row" key={i}>
          <strong>{dep.source_task || "Unknown task"}</strong>
          <p>{dep.relationship || "depends on"}</p>
          <strong>{dep.depends_on || "Unknown dependency"}</strong>
        </div>
      ))}
      {!extractedData.dependencies.length && <p>No dependencies identified.</p>}
    </div>
  </div>
</section>


        <section id="graph" className="content-section">
          <h2>Knowledge Graph & Relationships</h2>
          <div className="card">
            {!ready ? (
              <p className="section-subtitle">Run extraction to render interactive relationship graphs.</p>
            ) : (
              <div>
                <div className="card">
  <h3>People</h3>
  {(projectResult?.knowledge_graph?.nodes || [])
    .filter(node => node.type === "person")
    .map(node => (
      <div className="data-row" key={node.id}>
        <strong>{node.label}</strong>
      </div>
    ))}

  <h3>Tasks</h3>
  {(projectResult?.knowledge_graph?.nodes || [])
    .filter(node => node.type === "task" && !node.extracted_from_dependency)
    .map(node => (
      <div className="data-row" key={node.id}>
        <strong>{node.label}</strong>
        <p>Owner: {node.owner || "Unassigned"}</p>
        <p>Deadline: {node.deadline || "Not specified"}</p>
        <p>Status: {node.status || "Not specified"}</p>
      </div>
    ))}

  <h3>Modules</h3>
  {(projectResult?.knowledge_graph?.nodes || [])
    .filter(node => node.type === "module")
    .map(node => (
      <div className="data-row" key={node.id}>
        {node.label}
      </div>
    ))}

  <h3>Dependencies</h3>
  {(projectResult?.knowledge_graph?.edges || []).map((edge, i) => {
    const nodes = projectResult?.knowledge_graph?.nodes || [];
    const source = nodes.find(node => node.id === edge.source);
    const target = nodes.find(node => node.id === edge.target);

    return (
      <div className="data-row" key={i}>
        <strong>{source?.label || edge.source}</strong>
        <p>Relationship: {edge.relationship}</p>
        <strong>{target?.label || edge.target}</strong>
      </div>
    );
  })}

  <h3>Decisions</h3>
  {(projectResult?.knowledge_graph?.nodes || [])
    .filter(node => node.type === "decision")
    .map(node => (
      <div className="data-row" key={node.id}>
        {node.label}
      </div>
    ))}
</div>
                <h3 style={{ margin: "25px 0 15px" }}>Active Dependencies</h3>
                {extractedData.dependencies.map((dep, i) => (
                  <div className="data-row" key={i}>
                    <p>{dep.source_task} → {dep.relationship} → {dep.depends_on}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="gaps" className="content-section">
          <h2>Knowledge Gaps & Risk Analysis</h2>
          <div className="card">
            {!ready ? (
              <p className="section-subtitle">Initialize extraction to run heuristic risk analysis.</p>
            ) : (extractedData.verification_issues || []).length ? (
  extractedData.verification_issues.map((gap, i) => (
    <div className="data-row warning-row" key={i}>
      <h3>Risk Item #{i + 1}</h3>

      <p>
        <strong>Task:</strong>{" "}
        {gap.task || "Unspecified task"}
      </p>

      <p>
        <strong>Missing information:</strong>{" "}
        {gap.missing_fields?.join(", ") || "None"}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {gap.status || "Needs review"}
      </p>
    </div>
  ))
) : (
  <p>No verification issues were identified.</p>
)}
          </div>
        </section>

        <section id="handover" className="content-section">
          <h2>Handover Playbook</h2>
          <div className="card playbook-card">
  <h3>{projectName}</h3>

  {!ready ? (
    <p className="section-subtitle">
      Complete prior steps to compile the final exportable playbook.
    </p>
  ) : (
    <div>
      <div className="section-subtitle" style={{ marginBottom: "20px" }}>
        
<pre>
{(() => {
  const handover = projectResult?.playbook?.project_handover || {};
  const summary = projectResult?.playbook?.summary || {};

  return `PROJECT HANDOVER PLAYBOOK
${projectName}

========================================
1. TEAM MEMBERS
========================================
${(handover.team_members || []).map(person =>
  `${person.name}\nResponsibilities: ${person.responsibilities?.join(", ") || "Not specified"}`
).join("\n\n") || "No team members identified."}

========================================
2. TASKS
========================================
${(handover.tasks || []).map((task, i) =>
  `${i + 1}. ${task.task}
   Owner: ${task.owner || "Unassigned"}
   Deadline: ${task.deadline || "Not specified"}
   Status: ${task.status || "Not specified"}
   Evidence: ${task.evidence || "Not available"}`
).join("\n\n") || "No tasks identified."}

========================================
3. DEPENDENCIES
========================================
${(handover.dependencies || []).map(dep =>
  `${dep.source_task} ${dep.relationship} ${dep.depends_on}`
).join("\n") || "No dependencies identified."}

========================================
4. DECISIONS
========================================
${(handover.decisions || []).map((decision, i) =>
  `${i + 1}. ${decision}`
).join("\n") || "No decisions identified."}

========================================
5. PRIORITY TASKS
========================================
${(handover.priority_tasks || []).map(item =>
  `- ${item.task}\n  Reason: ${item.reason}`
).join("\n") || "No priority tasks identified."}

========================================
6. BLOCKED TASKS
========================================
${(handover.blocked_tasks || []).map(item =>
  `- ${item.task}\n  Blocked by: ${item.blocked_by}`
).join("\n") || "No blocked tasks identified."}

========================================
7. OWNERSHIP GAPS
========================================
${(handover.ownership_gaps || []).map(item => `- ${item}`).join("\n") || "No ownership gaps identified."}

========================================
8. UNRESOLVED ITEMS
========================================
${(handover.unresolved_items || []).map(item =>
  `- Task: ${item.task}
  Missing: ${item.missing_fields?.join(", ") || "Not specified"}
  Status: ${item.status || "Needs review"}`
).join("\n\n") || "No unresolved items identified."}

========================================
9. SUCCESSOR GUIDANCE
========================================
${(handover.successor_guidance || []).map((item, i) =>
  `${i + 1}. ${item}`
).join("\n") || "No guidance available."}

========================================
10. SUMMARY
========================================
Team Members: ${summary.total_team_members ?? handover.team_members?.length ?? 0}
Tasks: ${summary.total_tasks ?? handover.tasks?.length ?? 0}
Dependencies: ${summary.total_dependencies ?? handover.dependencies?.length ?? 0}
Decisions: ${summary.total_decisions ?? handover.decisions?.length ?? 0}
Priority Tasks: ${summary.priority_tasks ?? handover.priority_tasks?.length ?? 0}
`;
})()}
</pre>

      </div>

      <button className="primary-action-btn" onClick={exportPlaybook}>
        Download Handover Playbook (.txt)
      </button>
    </div>
  )}
</div>
        </section>

        <footer className="app-footer">
          ProjectPulse &copy; 2026 CodeNova &bull; Enterprise Knowledge Platform
        </footer>
      </main>
    </div>
  );
}