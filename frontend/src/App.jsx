import { useEffect, useRef, useState } from "react";
import "./App.css";

const initialDocuments = [
  {
    id: "INC-1042",
    name: "Order API latency spike",
    type: "Incident Report",
    date: "Sep 16, 2026",
    status: "Indexed",
  },
  {
    id: "DEP-882",
    name: "Orders deployment v2.8.1",
    type: "Deployment Note",
    date: "Sep 15, 2026",
    status: "Indexed",
  },
  {
    id: "PM-211",
    name: "Previous latency incident",
    type: "Postmortem",
    date: "May 03, 2026",
    status: "Indexed",
  },
  {
    id: "GUIDE-41",
    name: "Service A incident procedure",
    type: "Troubleshooting",
    date: "Aug 10, 2026",
    status: "Indexed",
  },
];

const suggestions = [
  "Why did the Order API become slow on September 16?",
  "Was the latest deployment related to the incident?",
  "Has this type of failure happened before?",
  "What should the on-call engineer check first?",
];

const evidence = [
  {
    id: "INC-1042",
    type: "INCIDENT REPORT",
    title: "Order API latency spike",
    description:
      "P95 latency increased significantly after the latest deployment.",
    date: "Sep 16, 2026",
  },
  {
    id: "DEP-882",
    type: "DEPLOYMENT NOTE",
    title: "Orders deployment",
    description:
      "Version v2.8.1 was deployed to production at 18:10 UTC.",
    date: "Sep 15, 2026",
  },
  {
    id: "PM-211",
    type: "POSTMORTEM",
    title: "Previous latency incident",
    description:
      "A previous latency incident involved database connection saturation.",
    date: "May 03, 2026",
  },
];

const timeline = [
  {
    time: "18:10",
    date: "SEP 15",
    title: "orders-api v2.8.1 deployed",
    type: "DEPLOYMENT",
  },
  {
    time: "14:32",
    date: "SEP 16",
    title: "Latency spike detected",
    type: "INCIDENT",
  },
  {
    time: "14:41",
    date: "SEP 16",
    title: "INC-1042 created",
    type: "INCIDENT",
  },
];

function App() {
  const [page, setPage] = useState("overview");

  const [question, setQuestion] = useState("");

  const [investigating, setInvestigating] = useState(false);

  const [result, setResult] = useState(null);

  const fileInput = useRef(null);

  const investigationLock = useRef(false);
const [documents, setDocuments] = useState(initialDocuments);

 useEffect(() => {
  fetch("http://localhost:5000/api/documents")
    .then((response) => response.json())
    .then((data) => {
      const formattedDocuments = data.map((doc) => ({
        id: doc.id,
        name: doc.title,
        type: doc.type,
        date: new Date(doc.date).toLocaleDateString(),
        status: "Indexed",
      }));

      setDocuments(formattedDocuments);
    })
    .catch((error) => {
      console.error("Failed to load documents:", error);
    });
}, []);

 const startInvestigation = async () => {
  if (!question.trim() || investigating || investigationLock.current) {
    return;
  }

  investigationLock.current = true;
  setInvestigating(true);
  setResult(null);

  try {
    const response = await fetch("http://localhost:5000/api/investigate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "Investigation failed");
    }

    const hasContradiction = data.contradictions?.length > 0;
    const hasHistorical = data.historicalIncidentFound;

    let type = "deployment";
    let title = "Investigation finding";

    if (data.confidence === "low") {
      type = "insufficient";
      title = "Insufficient evidence";
    } else if (hasContradiction) {
      type = "contradiction";
      title = "Contradiction detected";
    } else if (hasHistorical) {
      title = "Related incident found";
    }

    setResult({
      type,
      title,
      confidence: `${(data.confidence || "unknown").toUpperCase()} CONFIDENCE`,
      evidenceStatus:
        data.confidence === "low"
          ? "Insufficient evidence"
          : hasContradiction
            ? "Conflicting evidence"
            : "Strong evidence",
      evidenceCount: data.evidence?.length || 0,
      summary: data.summary,
      evidence: data.evidence || [],
      findings: data.findings || [],
      contradictions: data.contradictions || [],
    });
  } catch (error) {
    console.error(error);

    setResult({
      type: "insufficient",
      title: "Investigation failed",
      confidence: "LOW CONFIDENCE",
      evidenceStatus: "Unable to investigate",
      evidenceCount: 0,
      summary:
        "Could not connect to the investigation backend. Make sure the backend is running on port 5000.",
    });
  } finally {
    setInvestigating(false);
    investigationLock.current = false;
  }
};

  const chooseSuggestion = (text) => {
    setQuestion(text);
  };

  const handleFiles = async (event) => {
  const files = Array.from(event.target.files);

  if (!files.length) return;

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await fetch(
      "http://localhost:5000/api/documents/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    setDocuments((prev) => [...data.documents, ...prev]);

    alert(`${data.documents.length} document(s) uploaded and indexed.`);
  } catch (error) {
    console.error(error);
    alert("Upload failed. Check the backend.");
  }

   event.target.value = "";
};

  return (
    <div className="app">

      <Sidebar
        page={page}
        setPage={setPage}
      />

      <div className="main">

        <Topbar page={page} />

        {page === "investigate" && (
          <InvestigationPage
            question={question}
            setQuestion={setQuestion}
            investigating={investigating}
            result={result}
            startInvestigation={startInvestigation}
            suggestions={suggestions}
            chooseSuggestion={chooseSuggestion}
            setPage={setPage}
          />
        )}

        {page === "evidence" && (
          <DocumentsPage
            documents={documents}
            fileInput={fileInput}
            handleFiles={handleFiles}
          />
        )}

        {page === "timeline" && (
          <TimelinePage />
        )}

        {page === "overview" && (
          <OverviewPage
            documents={documents}
            setPage={setPage}
          />
        )}

      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={handleFiles}
      />

    </div>
  );
}

/* =================================
   SIDEBAR
================================= */

/* =================================
   SIDEBAR
================================= */

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-icon">
          ⌕
        </div>

        <div>
          <div className="brand-name">
            Incident
          </div>

          <div className="brand-subtitle">
            INVESTIGATOR
          </div>
        </div>

      </div>


      <div className="menu-label">
        WORKSPACE
      </div>


      <nav className="navigation">

        <Nav
          active={page === "overview"}
          onClick={() => setPage("overview")}
          icon="⌂"
        >
          Overview
        </Nav>

        <Nav
          active={page === "investigate"}
          onClick={() => setPage("investigate")}
          icon="⌕"
        >
          Investigate
        </Nav>

        <Nav
          active={page === "evidence"}
          onClick={() => setPage("evidence")}
          icon="▤"
        >
          Organization Docs
        </Nav>

        <Nav
          active={page === "timeline"}
          onClick={() => setPage("timeline")}
          icon="◷"
        >
          Timeline
        </Nav>

      </nav>


      <div className="agent-status">

        <div className="agent-status-title">
          <span className="online-dot"></span>
          Investigator online
        </div>

        <p>
          Knowledge base connected
          <br />
          {page === "evidence"
            ? "Document repository active"
            : "Ready for investigation"}
        </p>

      </div>

    </aside>
  );
}


function Nav({ children, icon, active, onClick }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span>{icon}</span>
      {children}
    </button>
  );
}


/* =================================
   TOPBAR
================================= */

function Topbar({ page }) {
  const names = {
    overview: "Overview",
    investigate: "Investigate",
    evidence: "Organization Docs",
    timeline: "Timeline",
  };

  return (
    <header className="topbar">

      <div className="breadcrumb">
        INCIDENT INVESTIGATOR
        <span>/</span>
        <strong>{names[page]}</strong>
      </div>

      <div className="system-status">
        <span className="online-dot"></span>
        Knowledge base online
      </div>

    </header>
  );
}


/* =================================
   INVESTIGATION PAGE
================================= */

function InvestigationPage({
  question,
  setQuestion,
  investigating,
  result,
  startInvestigation,
  suggestions,
  chooseSuggestion,
  setPage,
}) {
  return (
    <main className="content">

      <div className="page-header">

        <div className="eyebrow">
          INCIDENT INTELLIGENCE
        </div>

        <h1>
          What are you trying to understand?
        </h1>

        <p>
          Ask a question and I'll connect evidence across
          your organization's documents.
        </p>

      </div>


      {/* QUESTION + SUGGESTIONS */}

      <div className="investigation-layout">

        <section className="question-card">

          <div className="card-label">
            INVESTIGATION QUESTION
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Describe what you want to investigate..."
          />

          <div className="question-footer">

            <span>
              {question.trim()
                ? "Ready to investigate"
                : "Start with a question"}
            </span>

            <button
              className="primary-button"
              onClick={startInvestigation}
              disabled={!question.trim() || investigating}
            >
              {investigating
                ? "Investigating..."
                : "Investigate"}

              <span>→</span>
            </button>

          </div>

        </section>


        {/* SUGGESTIONS */}

        <aside className="suggestions-card">

          <div className="card-label">
            NEED A START?
          </div>

          <h3>
            Try asking
          </h3>

          <p>
            Pick a question or write your own.
          </p>

          <div className="suggestions">

            {suggestions.map((item, index) => (

              <button
                key={index}
                className="suggestion"
                onClick={() => chooseSuggestion(item)}
              >
                <span>↗</span>
                {item}
              </button>

            ))}

          </div>

        </aside>

      </div>


      {/* EMPTY STATE */}

      {!result && !investigating && (

        <div className="empty-investigation">

          <div className="empty-icon">
            ⌕
          </div>

          <h2>
            Your investigation will appear here
          </h2>

          <p>
            The investigator will search incidents, deployments,
            postmortems, guides and other organizational evidence.
          </p>

        </div>

      )}


      {/* SEARCHING */}

      {investigating && (

        <section className="investigating-card">

          <div className="search-animation">
            <span></span>
          </div>

          <div>

            <div className="search-title">
              Looking through your organization&apos;s knowledge...
            </div>

            <p>
              Connecting incidents, deployments, historical
              records and related evidence.
            </p>

          </div>

        </section>

      )}


      {/* RESULT */}

      {result && (

        <>
        <section className="evidence-status-card">

  <div>
    <div className="card-label">
      EVIDENCE STATUS
    </div>

    <h3>
      {result.evidenceStatus}
    </h3>
  </div>

  <div className="evidence-count">
    {result.evidenceCount}
    <span>relevant documents</span>
  </div>

</section>

          <section className="result-card">

            <div className="result-header">

              <div>
                <div className="card-label">
                  INVESTIGATION FINDING
                </div>

                <h2>
                  {result.title}
                </h2>
              </div>

              <span className="confidence">
                ● {result.confidence}
              </span>

            </div>


            <p className="result-summary">
              {result.summary}
            </p>


            <div className="result-footer">

              <span>
                Based on {result.evidenceCount} connected sources
              </span>

              <button
                onClick={() => setPage("evidence")}
              >
                View evidence →
              </button>

            </div>

          </section>


          {/* EVIDENCE */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <div className="card-label">
                  EVIDENCE
                </div>

                <h2>
                  What supports this finding?
                </h2>

              </div>

              <span className="source-count">
                 {result.evidenceCount} SOURCES
              </span>

            </div>


            <div className="evidence-grid">

             {(result.evidence || []).map((item) => (
  <EvidenceCard
    key={item.documentId}
    item={{
      id: item.documentId,
      type: item.type?.replace("_", " ").toUpperCase(),
      title: item.title,
      description: "Retrieved from the investigation knowledge base.",
      date: new Date(item.date).toLocaleDateString(),
    }}
  />
))}

            </div>

          </section>


          {/* TIMELINE */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <div className="card-label">
                  TIMELINE
                </div>

                <h2>
                  How the incident unfolded
                </h2>

              </div>

            </div>

            <MiniTimeline events={result.evidence || []} />
          </section>


          {/* EVIDENCE CHECK */}

{result.type === "contradiction" && (
  <section className="contradiction-card">

    <div className="contradiction-header">

      <div className="warning-icon">
        ⚠
      </div>

      <div>
        <div className="card-label">
          CONTRADICTION DETECTED
        </div>

        <h3>
          Conflicting evidence was found
        </h3>
      </div>

    </div>

    {(result.contradictions || []).map((contradiction, index) => {

      const contradictionDocs = (contradiction.evidence || [])
        .map((id) =>
          (result.evidence || []).find(
            (doc) => doc.documentId === id
          )
        )
        .filter(Boolean);

      return (
        <div key={index} className="guidance-grid">

          {contradictionDocs.map((doc) => (
            <div
              key={doc.documentId}
              className="guidance-item"
            >

              <div className="guidance-meta">
                {doc.documentId}
                {doc.version ? ` · ${doc.version}` : ""}
              </div>

              <p>
                {doc.title}
              </p>

              <small>
                {doc.type?.replace("_", " ").toUpperCase()}
                {" · "}
                {new Date(doc.date).toLocaleDateString()}
              </small>

            </div>
          ))}

          <div className="contradiction-note">
            {contradiction.description}
          </div>

        </div>
      );

    })}

  </section>
)}

{result.type === "insufficient" && (

  <section className="incident-match-card">

    <div className="card-label">
      INCIDENT MATCH
    </div>


    <div className="incident-comparison">

      <div className="incident-item">

        <strong>INC-300</strong>

        <span>
          Catalog API
        </span>

        <small>
          Database saturation
        </small>

        <b>
          Different service
        </b>

      </div>


      <div className="incident-item">

        <strong>INC-301</strong>

        <span>
          Orders API
        </span>

        <small>
          Expired certificate
        </small>

        <b>
          Different failure mode
        </b>

      </div>

    </div>


    <div className="match-conclusion">

      <span>
        CONCLUSION
      </span>

      <p>
        Not enough evidence to say the exact same failure
        happened before.
      </p>

    </div>

  </section>

)}


{result.type === "deployment" && (

  <section className="panel">

    <div className="panel-header">

      <div>

        <div className="card-label">
          EVIDENCE CHECK
        </div>

        <h2>
          Root cause certainty
        </h2>

      </div>

    </div>


    <div className="evidence-note">

      <div className="note-icon">
        ?
      </div>

      <div>

        <strong>
          The evidence is suggestive, not conclusive.
        </strong>

        <p>
          The deployment happened shortly before the
          incident, but the documents do not prove that
          the deployment caused the failure. A previous
          incident shows a similar symptom with a
          different underlying cause.
        </p>

      </div>

    </div>

  </section>

)}

          
        </>

      )}

    </main>
  );
}


/* =================================
   ORGANIZATION DOCUMENTS
================================= */

function DocumentsPage({
  documents,
  fileInput,
  handleFiles,
}) {
  const [search, setSearch] = useState("");

  const filtered = documents.filter((doc) =>
    `${doc.id} ${doc.name} ${doc.type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="content">

      <div className="page-header document-header">

        <div>

          <div className="eyebrow">
            ORGANIZATION KNOWLEDGE
          </div>

          <h1>
            Your investigation knowledge base.
          </h1>

          <p>
            Upload the documents your investigator can search
            when answering incident questions.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={() => fileInput.current.click()}
        >
          + Add documents
        </button>

      </div>


      {/* UPLOAD */}

      <section className="upload-card">

        <div className="upload-symbol">
          ↑
        </div>

        <div>

          <h2>
            Add organization documents
          </h2>

          <p>
            Upload incident reports, deployment notes,
            architecture docs, troubleshooting guides,
            complaints, discussions and postmortems.
          </p>

        </div>

        <button
          className="secondary-button"
          onClick={() => fileInput.current.click()}
        >
          Choose files
        </button>

      </section>


      {/* DOCUMENT TYPES */}

      <div className="document-types">

        {[
          "Incident reports",
          "Deployment notes",
          "Architecture",
          "Troubleshooting",
          "Complaints",
          "Engineering discussions",
          "Postmortems",
        ].map((type) => (

          <span key={type}>
            {type}
          </span>

        ))}

      </div>


      {/* SEARCH */}

      <section className="panel">

        <div className="document-toolbar">

          <div>

            <div className="card-label">
              DOCUMENT REPOSITORY
            </div>

            <h2>
              {documents.length} documents available
            </h2>

          </div>


          <input
            className="document-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
          />

        </div>


        <div className="document-list">

          {filtered.map((doc) => (

            <div
              className="document-row"
              key={doc.id}
            >

              <div className="document-file-icon">
                ▤
              </div>

              <div className="document-info">

                <strong>
                  {doc.name}
                </strong>

                <span>
                  {doc.id} · {doc.type}
                </span>

              </div>

              <div className="document-date">
                {doc.date}
              </div>

              <span className="indexed">
                ● {doc.status}
              </span>

            </div>

          ))}

          {filtered.length === 0 && (

            <div className="no-results">
              No documents match your search.
            </div>

          )}

        </div>

      </section>

    </main>
  );
}


/* =================================
   OVERVIEW
================================= */

function OverviewPage({ documents, setPage }) {
  return (
    <main className="content">

      <div className="page-header">

        <div className="eyebrow">
          INCIDENT INTELLIGENCE
        </div>

        <h1>
          Investigation workspace.
        </h1>

        <p>
          Search your organization&apos;s accumulated knowledge
          to understand what happened.
        </p>

      </div>


      <div className="stats-grid">

        <Stat
          label="KNOWLEDGE BASE"
          value={documents.length}
          text="Documents indexed"
        />

        <Stat
          label="INCIDENTS"
          value="12"
          text="Available reports"
        />

        <Stat
          label="DEPLOYMENTS"
          value="8"
          text="Available records"
        />

        <Stat
          label="INVESTIGATIONS"
          value="24"
          text="Completed"
        />

      </div>


      <section className="overview-hero">

        <div>

          <div className="card-label">
            START HERE
          </div>

          <h2>
            Something went wrong?
          </h2>

          <p>
            Ask the investigator. It will search across your
            organization&apos;s documents and connect the evidence.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() => setPage("investigate")}
        >
          Start investigation →
        </button>

      </section>


      <section className="panel">

        <div className="panel-header">

          <div>

            <div className="card-label">
              KNOWLEDGE BASE
            </div>

            <h2>
              What can the investigator search?
            </h2>

          </div>

        </div>


        <div className="knowledge-grid">

          <Knowledge icon="▤" text="Incident reports" />
          <Knowledge icon="↗" text="Deployment notes" />
          <Knowledge icon="◇" text="Architecture documents" />
          <Knowledge icon="!" text="Troubleshooting guides" />
          <Knowledge icon="◌" text="Customer complaints" />
          <Knowledge icon="◎" text="Engineering discussions" />

        </div>

      </section>

    </main>
  );
}


/* =================================
   TIMELINE PAGE
================================= */

function TimelinePage() {
  const [timelineDocuments, setTimelineDocuments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/documents")
      .then((response) => response.json())
      .then((data) => {
        setTimelineDocuments(data);
      })
      .catch((error) => {
        console.error("Failed to load timeline documents:", error);
      });
  }, []);

  return (
    <main className="content">

      <div className="page-header">

        <div className="eyebrow">
          INCIDENT TIMELINE
        </div>

        <h1>
          Follow the story.
        </h1>

        <p>
          See connected events in chronological order.
        </p>

      </div>

      <section className="panel">

        <MiniTimeline events={timelineDocuments} />

      </section>

    </main>
  );
}


/* =================================
   COMPONENTS
================================= */

function EvidenceCard({ item }) {
  return (
    <div className="evidence-card">

      <div className="evidence-top">

        <span className="evidence-icon">
          ▤
        </span>

        <span>
          {item.type}
        </span>

      </div>

      <strong className="evidence-id">
        {item.id}
      </strong>

      <h3>
        {item.title}
      </h3>

      <p>
        {item.description}
      </p>

      <small>
        {item.date}
      </small>

    </div>
  );
}


function MiniTimeline({ events = [] }) {
  return (
    <div className="timeline">
      {[...events]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((event, index) => (
          <div
            className="timeline-event"
            key={event.documentId || index}
          >
            <div className="timeline-time">
              <strong>
                {new Date(event.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>

              <span>
                {new Date(event.date).toLocaleDateString()}
              </span>
            </div>

            <div className="timeline-line">
              <span></span>
            </div>

            <div className="timeline-info">
              <small>
                {event.type?.toUpperCase()}
              </small>

              <strong>
                {event.title}
              </strong>
            </div>
          </div>
        ))}
    </div>
  );
}

function Stat({ label, value, text }) {
  return (
    <div className="stat-card">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {text}
      </small>

    </div>
  );
}

function Knowledge({ icon, text }) {
  return (
    <div className="knowledge-item">

      <span>
        {icon}
      </span>

      <strong>
        {text}
      </strong>

    </div>
  );
}
export default App;