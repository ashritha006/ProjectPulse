
import { useState } from "react";

const sections = [
  ["overview", "Overview"],
  ["sources", "Source Upload"],
  ["extracted", "Extracted Knowledge"],
  ["mapper", "MAPPER"],
  ["graph", "Knowledge Graph"],
  ["gaps", "Knowledge Gaps"],
  ["handover", "Handover Playbook"],
];

function App() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [projectName, setProjectName] = useState("My Project");
  const [activeSection, setActiveSection] = useState("overview");

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const allowed = [".pdf", ".docx", ".csv"];

    const validFiles = selectedFiles.filter((file) =>
      allowed.some((extension) =>
        file.name.toLowerCase().endsWith(extension)
      )
    );

    setFiles((previous) => {
      const combined = [...previous, ...validFiles];
      return combined.filter(
        (file, index, array) =>
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size
          ) === index
      );
    });

    if (validFiles.length !== selectedFiles.length) {
      setMessage("Only PDF, DOCX and CSV files are supported.");
    } else if (validFiles.length > 0) {
      setMessage("Files selected successfully. Ready for backend processing.");
    }

    event.target.value = "";
  }

  function removeFile(indexToRemove) {
    setFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
    setMessage("File removed.");
  }

  function prepareExtraction() {
    if (files.length === 0) {
      setMessage("Please select at least one PDF, DOCX or CSV file first.");
      return;
    }

    setMessage(
      "Your files are selected successfully. Actual extraction will begin after connecting the FastAPI backend."
    );
  }

  function navigateTo(id) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function formatSize(bytes) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (
    <div className="app-container">
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: #f3f6fa;
          color: #243b53;
          font-family: Arial, sans-serif;
        }
        .app-container { min-height: 100vh; }
        .sidebar {
          width: 245px;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          padding: 28px 18px;
          background: #102a43;
          color: white;
          overflow-y: auto;
        }
        .brand { font-size: 23px; font-weight: bold; margin-bottom: 5px; }
        .brand-sub { color: #bcccdc; font-size: 13px; margin-bottom: 35px; }
        .nav-button {
          display: block;
          width: 100%;
          text-align: left;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #d9e2ec;
          padding: 12px;
          margin: 5px 0;
          cursor: pointer;
          font-size: 14px;
        }
        .nav-button:hover, .nav-button.active {
          background: #2563eb;
          color: white;
        }
        .main-content {
          margin-left: 245px;
          padding: 35px;
          max-width: 1500px;
        }
        .top-label { color: #2563eb; font-size: 13px; font-weight: bold; }
        h1 { color: #102a43; font-size: 30px; margin-bottom: 10px; }
        h2 { color: #102a43; font-size: 23px; }
        h3 { color: #102a43; }
        .section { padding: 20px 0 35px; scroll-margin-top: 20px; }
        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          margin: 15px 0;
          box-shadow: 0 3px 12px rgba(16,42,67,.04);
        }
        .welcome {
          background: linear-gradient(120deg,#102a43,#0f766e);
          color: white;
          padding: 30px;
          border-radius: 13px;
          margin: 25px 0;
        }
        .welcome h2 { color: white; }
        .grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 15px;
        }
        .category { border-left: 4px solid #2563eb; }
        .muted { color: #627d98; line-height: 1.6; }
        .primary-button {
          background: #2563eb;
          color: white;
          border: 0;
          padding: 12px 20px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 12px;
        }
        .primary-button:hover { background: #1d4ed8; }
        .file-input {
          display: block;
          margin: 15px 0;
          padding: 12px;
          border: 1px dashed #829ab1;
          border-radius: 8px;
          width: 100%;
          background: #f8fafc;
        }
        .file-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .remove-button {
          border: 0;
          color: #b42318;
          background: #fff1f0;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        .status {
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 13px;
          margin-top: 15px;
          border-radius: 5px;
          line-height: 1.5;
        }
        .step {
          padding: 12px;
          margin: 8px 0;
          background: #f8fafc;
          border-radius: 7px;
        }
        .graph {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 25px 5px;
        }
        .graph-node {
          background: #eaf2ff;
          border: 1px solid #93c5fd;
          border-radius: 9px;
          padding: 16px;
          font-weight: bold;
        }
        footer {
          border-top: 1px solid #d9e2ec;
          padding: 20px 0;
          color: #627d98;
          font-size: 13px;
        }
        @media(max-width:750px) {
          .sidebar {
            position: relative;
            width: 100%;
            padding: 18px;
          }
          .main-content { margin-left: 0; padding: 18px; }
          .grid { grid-template-columns: 1fr; }
          .file-row { align-items: flex-start; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand">ProjectPulse</div>
        <div className="brand-sub">Intelligent Knowledge Handover</div>

        {sections.map(([id, label]) => (
          <button
            key={id}
            className={`nav-button ${activeSection === id ? "active" : ""}`}
            onClick={() => navigateTo(id)}
          >
            {label}
          </button>
        ))}

        <p style={{ marginTop: 35, color: "#bcccdc", fontSize: 13 }}>
          CodeNova
        </p>
        <p style={{ color: "#bcccdc", fontSize: 12 }}>
          Project Knowledge Platform
        </p>
      </aside>

      <main className="main-content">
        <section id="overview" className="section">
          <div className="top-label">CODENOVA · PROJECT KNOWLEDGE PLATFORM</div>
          <h1>Project Knowledge Overview</h1>
          <p className="muted">
            Reconstruct, connect and preserve project knowledge.
          </p>

          <div className="welcome">
            <h2>Welcome to ProjectPulse</h2>
            <p>
              Transform scattered project information into connected,
              reviewable and actionable knowledge for smoother employee handovers.
            </p>
          </div>

          <div className="card">
            <h3>Project name</h3>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              style={{ padding: 11, width: "100%", maxWidth: 400 }}
              placeholder="Enter project name"
            />
          </div>

          <h2>Knowledge Categories</h2>
          <p className="muted">The four main categories organised by ProjectPulse.</p>

          <div className="grid">
            <div className="card category">
              <h3>People</h3>
              Team members, responsibilities and contributors.
            </div>
            <div className="card category">
              <h3>Tasks</h3>
              Active work, completed tasks, pending work and blockers.
            </div>
            <div className="card category">
              <h3>Modules</h3>
              Project components, services and architecture.
            </div>
            <div className="card category">
              <h3>Dependencies</h3>
              Relationships between people, tasks and modules.
            </div>
          </div>

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
            <div className="step" key={step}>
              <strong>{index + 1}.</strong> {step}
            </div>
          ))}
        </section>

        <section id="sources" className="section">
          <h2>Source Upload</h2>
          <p className="muted">
            Select project documents that contain project activities,
            responsibilities and technical information.
          </p>

          <div className="card">
            <h3>Select project documents</h3>
            <p className="muted">Supported formats: PDF, DOCX and CSV</p>

            <input
              className="file-input"
              type="file"
              accept=".pdf,.docx,.csv"
              multiple
              onChange={handleFileChange}
            />

            <h3>Selected Files ({files.length})</h3>

            {files.length === 0 ? (
              <p className="muted">No files selected yet.</p>
            ) : (
              files.map((file, index) => (
                <div className="file-row" key={`${file.name}-${index}`}>
                  <div>
                    <strong>{file.name}</strong>
                    <p className="muted" style={{ margin: "5px 0" }}>
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}

            <button className="primary-button" onClick={prepareExtraction}>
              Prepare for Information Extraction
            </button>

            {message && (
              <div className="status" role="status">
                {message}
              </div>
            )}
          </div>
        </section>

        <section id="extracted" className="section">
          <h2>Extracted Knowledge</h2>
          <div className="card">
            <h3>Extraction results will appear here</h3>
            <p className="muted">
              Actual extracted records will be displayed after connecting
              the document-processing backend.
            </p>
          </div>
        </section>

        <section id="mapper" className="section">
          <h2>MAPPER – Knowledge Organisation</h2>
          <p className="muted">
            MAPPER categorises and normalises extracted information into four entity types.
          </p>
          <div className="grid">
            {["PEOPLE", "TASKS", "MODULES", "DEPENDENCIES"].map((item) => (
              <div className="card" key={item}>
                <h3>{item}</h3>
                <p className="muted">
                  Normalised records will appear after backend integration.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="graph" className="section">
          <h2>Knowledge Graph</h2>
          <p className="muted">
            Explore relationships between people, tasks and project modules.
          </p>
          <div className="card">
            <div className="graph">
              <div className="graph-node">People</div>
              <span>↔</span>
              <div className="graph-node">Tasks</div>
              <span>↔</span>
              <div className="graph-node">Modules</div>
            </div>
            <p className="muted">
              Illustrative relationship layout. Actual project relationships
              will be loaded from the knowledge graph backend.
            </p>
          </div>
        </section>

        <section id="gaps" className="section">
          <h2>Knowledge Gaps</h2>
          <div className="card">
            <h3>No validation results yet</h3>
            <p className="muted">
              Evidence matching and knowledge-gap detection require
              processed project data from the backend.
            </p>
          </div>
        </section>

        <section id="handover" className="section">
          <h2>Handover Playbook</h2>
          <p className="muted">
            A structured summary of verified project knowledge for incoming employees.
          </p>
          <div className="card">
            <h3>{projectName}</h3>
            {[
              "Project Overview – Project description and architecture.",
              "Team and Responsibilities – People, owners and contributors.",
              "Modules and Dependencies – Components and their relationships.",
              "Tasks and Pending Work – Current status, blockers and next actions.",
              "Decisions and Knowledge Gaps – Evidence, unresolved questions and risks.",
            ].map((item, index) => (
              <div className="step" key={index}>
                <strong>{index + 1}.</strong> {item}
              </div>
            ))}
            <p className="muted">
              This is a playbook structure preview, not generated project data.
              Connect the backend to populate and export a verified playbook.
            </p>
          </div>
        </section>

        <footer>
          ProjectPulse | CodeNova | Intelligent Knowledge Handover
        </footer>
      </main>
    </div>
  );
}

export default App;
