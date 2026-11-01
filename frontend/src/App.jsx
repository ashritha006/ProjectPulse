
import { useState } from "react";
import "./App.css";

const navigation = [
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Source Upload" },
  { id: "extracted", label: "Extracted Knowledge" },
  { id: "mapper", label: "MAPPER" },
  { id: "graph", label: "Knowledge Graph" },
  { id: "gaps", label: "Knowledge Gaps" },
  { id: "handover", label: "Handover Playbook" },
];

function App() {
  const [activeSection, setActiveSection] = useState("overview");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [projectName, setProjectName] = useState("My Project");

  const navigateTo = (section) => {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const allowedExtensions = [".pdf", ".docx", ".csv"];

    const validFiles = selectedFiles.filter((file) => {
      const extension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      return allowedExtensions.includes(extension);
    });

    const invalidCount = selectedFiles.length - validFiles.length;

    setFiles((previousFiles) => {
      const newFiles = validFiles.filter(
        (file) =>
          !previousFiles.some(
            (existing) =>
              existing.name === file.name &&
              existing.size === file.size
          )
      );

      return [...previousFiles, ...newFiles];
    });

    if (invalidCount > 0) {
      setMessage("Some files were skipped. Only PDF, DOCX and CSV are accepted.");
    } else if (validFiles.length > 0) {
      setMessage("Files selected successfully. They are ready for backend processing.");
    } else {
      setMessage("No supported files were selected.");
    }

    event.target.value = "";
  };

  const removeFile = (indexToRemove) => {
    setFiles((previousFiles) =>
      previousFiles.filter((_, index) => index !== indexToRemove)
    );
    setMessage("File removed from the upload list.");
  };

  const prepareExtraction = () => {
    if (files.length === 0) {
      setMessage("Please select at least one project document.");
      return;
    }

    setMessage(
      "Upload selection is ready. Connect the FastAPI document-processing endpoint to start actual extraction."
    );
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>ProjectPulse</h2>
        <p className="tagline">Intelligent Knowledge Handover</p>

        <nav>
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeSection === item.id ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                navigateTo(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>CodeNova</p>
          <span>Project Knowledge Platform</span>
        </div>
      </aside>

      <main className="main-content">
        {/* OVERVIEW */}
        <section id="overview" className="page-section">
          <header>
            <div>
              <h1>Project Knowledge Overview</h1>
              <p>Reconstruct, connect and preserve project knowledge.</p>
            </div>
          </header>

          <section className="welcome">
            <h2>Welcome to ProjectPulse</h2>
            <p>
              Transform scattered project information into connected,
              reviewable and actionable knowledge for smoother employee
              handovers.
            </p>
          </section>

          <section className="project-info">
            <label htmlFor="projectName">Project name</label>
            <input
              id="projectName"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Enter your project name"
            />
          </section>

          <div className="section-heading">
            <h2>Knowledge Categories</h2>
            <p>The four main categories organised by ProjectPulse.</p>
          </div>

          <section className="knowledge-grid">
            <div className="knowledge-card">
              <h3>People</h3>
              <p>Team members, responsibilities and contributors.</p>
            </div>

            <div className="knowledge-card">
              <h3>Tasks</h3>
              <p>Active work, completed tasks, pending work and blockers.</p>
            </div>

            <div className="knowledge-card">
              <h3>Modules</h3>
              <p>Project components, services and architecture.</p>
            </div>

            <div className="knowledge-card">
              <h3>Dependencies</h3>
              <p>Relationships between people, tasks and modules.</p>
            </div>
          </section>

          <section className="workflow">
            <h2>Knowledge Reconstruction Workflow</h2>
            {[
              "Select authorised project sources",
              "Extract project information",
              "MAPPER – Organise and normalise knowledge",
              "GRAPH – Connect project relationships",
              "Reconstruct decisions and context",
              "Validate evidence and identify knowledge gaps",
              "Generate the handover playbook",
              "Review and export",
            ].map((step, index) => (
              <div className="workflow-step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </section>
        </section>

        {/* SOURCE UPLOAD */}
        <section id="sources" className="feature-section page-section">
          <div className="section-heading">
            <h2>Source Upload</h2>
            <p>
              Select project documents that contain project activities,
              responsibilities and technical information.
            </p>
          </div>

          <div className="upload-area">
            <h3>Select project documents</h3>
            <p>Supported formats: PDF, DOCX and CSV</p>

            <label className="upload-button">
              Choose Files
              <input
                type="file"
                accept=".pdf,.docx,.csv"
                multiple
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {message && (
            <p className="status-message" role="status">
              {message}
            </p>
          )}

          <div className="uploaded-heading">
            <h3>Selected Files</h3>
            <span>{files.length} file(s)</span>
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <p>No project documents selected yet.</p>
            </div>
          ) : (
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`}>
                  <div className="file-details">
                    <strong>{file.name}</strong>
                    <span>{formatSize(file.size)}</span>
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removeFile(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            className="primary-button"
            onClick={prepareExtraction}
            disabled={files.length === 0}
            type="button"
          >
            Prepare for Information Extraction
          </button>
        </section>

        {/* EXTRACTED KNOWLEDGE */}
        <section id="extracted" className="feature-section page-section">
          <div className="section-heading">
            <h2>Extracted Knowledge</h2>
            <p>
              Review information extracted from the selected project sources.
            </p>
          </div>

          <div className="empty-state">
            <h3>Extraction results will appear here</h3>
            <p>
              Actual extracted records will be displayed after connecting
              the document-processing backend.
            </p>
          </div>
        </section>

        {/* MAPPER */}
        <section id="mapper" className="feature-section page-section">
          <div className="section-heading">
            <h2>MAPPER – Knowledge Organisation</h2>
            <p>
              MAPPER categorises and normalises extracted information into
              four entity types.
            </p>
          </div>

          <div className="knowledge-grid">
            <div className="knowledge-card">
              <h3>PEOPLE</h3>
              <p>Team members, owners, contributors and stakeholders.</p>
            </div>
            <div className="knowledge-card">
              <h3>TASKS</h3>
              <p>Activities, backlog items, blockers and pending work.</p>
            </div>
            <div className="knowledge-card">
              <h3>MODULES</h3>
              <p>Components, services and functional areas.</p>
            </div>
            <div className="knowledge-card">
              <h3>DEPENDENCIES</h3>
              <p>Connections between people, tasks and modules.</p>
            </div>
          </div>

          <div className="empty-state">
            <p>Normalised records will appear after backend integration.</p>
          </div>
        </section>

        {/* KNOWLEDGE GRAPH */}
        <section id="graph" className="feature-section page-section">
          <div className="section-heading">
            <h2>Knowledge Graph</h2>
            <p>
              Explore relationships between people, tasks and project modules.
            </p>
          </div>

          <div className="graph-placeholder">
            <div className="graph-node">People</div>
            <div className="graph-connection">↕</div>
            <div className="graph-node">Tasks</div>
            <div className="graph-connection">↕</div>
            <div className="graph-node">Modules</div>
            <p>
              Illustrative relationship layout. Actual project relationships
              will be loaded from the knowledge graph backend.
            </p>
          </div>
        </section>

        {/* KNOWLEDGE GAPS */}
        <section id="gaps" className="feature-section page-section">
          <div className="section-heading">
            <h2>Knowledge Gaps</h2>
            <p>
              Identify missing information, conflicting records and
              unverified relationships.
            </p>
          </div>

          <div className="empty-state">
            <h3>No validation results yet</h3>
            <p>
              Evidence matching and knowledge-gap detection require
              processed project data from the backend.
            </p>
          </div>
        </section>

        {/* HANDOVER PLAYBOOK */}
        <section id="handover" className="feature-section page-section">
          <div className="section-heading">
            <h2>Handover Playbook</h2>
            <p>
              A structured summary of verified project knowledge for
              incoming employees.
            </p>
          </div>

          <div className="playbook-preview">
            <h3>{projectName || "Project Name"}</h3>
            <div className="playbook-item">
              <strong>1. Project Overview</strong>
              <p>Project description and architecture.</p>
            </div>
            <div className="playbook-item">
              <strong>2. Team and Responsibilities</strong>
              <p>People, owners and contributors.</p>
            </div>
            <div className="playbook-item">
              <strong>3. Modules and Dependencies</strong>
              <p>Components and their relationships.</p>
            </div>
            <div className="playbook-item">
              <strong>4. Tasks and Pending Work</strong>
              <p>Current status, blockers and next actions.</p>
            </div>
            <div className="playbook-item">
              <strong>5. Decisions and Knowledge Gaps</strong>
              <p>Evidence, unresolved questions and risks.</p>
            </div>
            <p className="preview-note">
              This is a playbook structure preview, not generated project data.
              Connect the backend to populate and export a verified playbook.
            </p>
          </div>
        </section>

        <footer className="app-footer">
          ProjectPulse | CodeNova | Intelligent Knowledge Handover
        </footer>
      </main>
    </div>
  );
}

export default App;
