# The Investigation Nobody Could Answer

> **An agentic incident investigator that follows evidence across scattered internal documents to explain what happened, connect related events, and produce a traceable investigation report.**

---

## 1. Overview

When an operational incident happens, the answer is rarely contained in one document.

Incident reports, deployment notes, postmortems, troubleshooting guides, architecture documents, and other records may each contain one piece of the story. Engineers often have to search through these sources manually, connect clues, compare dates and versions, and determine whether older incidents are actually related.

**The Investigation Nobody Could Answer** is an agentic investigation system designed to do that work systematically.

Instead of answering from a single search result, the investigator follows discovered clues, searches for additional evidence, connects related documents, considers timelines and versions, identifies contradictions, and produces an evidence-backed investigation report.

---

# 2. Problem Statement

## The Investigation Nobody Could Answer

Build an Incident Investigation Agent that investigates operational incidents across a collection of internal documents.

A question should be answerable only after the agent connects evidence from multiple sources such as:

* Incident reports
* Deployment notes
* Architecture documents
* Troubleshooting guides
* Customer complaints
* Postmortems

The agent should be able to perform additional searches based on what it discovers, rather than relying on a single fixed search.

It should also consider:

* Document dates
* Software versions
* Conflicting information
* Similar but different incidents
* Whether there is enough evidence to support a conclusion

The final answer should clearly identify the supporting evidence and document IDs.

---

# 3. TL;DR

**Problem:**
Incident evidence is scattered across documents, making root-cause investigation slow and difficult.

**Solution:**
An investigation agent connects evidence across documents to investigate incidents and produce evidence-backed findings.

**Who benefits:**
Engineers and on-call teams get faster, traceable investigations and clearer incident insights.

---

# 4. What We Are Building

We are building an **AI-powered incident investigation system** that takes a question about an operational incident and investigates it across a controlled collection of internal documents.

The system can:

1. Understand the investigation question.
2. Identify important entities such as services, dates, versions, and incident IDs.
3. Search relevant documents.
4. Extract useful evidence.
5. Follow clues discovered during the investigation.
6. Search for related deployments and historical incidents.
7. Compare evidence across sources.
8. Identify contradictions or outdated information.
9. Decide when enough evidence has been collected.
10. Produce a structured investigation report.

### Core Features

* **Multi-source investigation** across incidents, deployments, and postmortems.
* **Iterative evidence search** where findings determine the next search.
* **Evidence-backed reports** with timelines, findings, contradictions, and document IDs.

### Deliberately Out of Scope

We are not integrating with live production infrastructure or automatically changing production systems. The hackathon version uses a controlled document dataset and focuses on investigation and evidence synthesis.

---

# 5. Why an Agentic Approach?

## What does the agent decide?

The investigator decides which evidence matters, what information is missing, and where to look next.

It follows connections between incidents, deployments, versions, and previous reports until it has enough evidence to explain what happened.

## Why not use a fixed script or simple chatbot?

Every incident is different.

The useful documents, terminology, and evidence trail change from case to case. A fixed workflow would follow the same path every time, while our system can change its investigation path based on what it discovers.

---

# 6. Who It's For

### Target Users

* Software engineers
* DevOps engineers
* SRE teams
* On-call engineers
* Incident response teams
* Engineering managers

### The World Today

When an incident occurs, engineers search through incident reports, deployment notes, postmortems, and troubleshooting guides manually.

Evidence is scattered across documents, older information may conflict with newer guidance, and connecting related incidents takes time.

### The World With Our Solution

An engineer can ask an investigation question and receive a connected view of:

* What happened
* When it happened
* Which services and versions were involved
* What evidence supports each finding
* Whether a deployment may be related
* Whether similar incidents occurred before
* Where evidence conflicts
* What remains uncertain

### What Our Hackathon Build Delivers

A working investigation workflow over a controlled document dataset.

It searches multiple document types, follows relevant clues, connects evidence, considers dates and versions, identifies contradictions, and produces a structured investigation report.

---

# 7. Before vs. After

| What Changes              | Today                           | Our Current Build               | Production Scale                           |
| ------------------------- | ------------------------------- | ------------------------------- | ------------------------------------------ |
| Finding relevant evidence | Manual search                   | Automated multi-source search   | Automated enterprise-wide search           |
| Connecting incident clues | Engineers connect them manually | Agent builds an evidence chain  | Continuous cross-system investigation      |
| Historical comparison     | Manual document comparison      | Searches related incidents      | Automated historical pattern analysis      |
| Conflicting information   | Manually identified             | Flags conflicting evidence      | Automated evidence/version reconciliation  |
| Investigation output      | Notes assembled manually        | Structured investigation report | Integrated incident investigation workflow |

---

# 8. Architecture

```text
                         ┌───────────────────┐
                         │   React Dashboard │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Express Backend  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │ LangGraph Investigation │
                      │          Agent          │
                      └───────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ Retrieval/Search │        │ Evidence Analysis│
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                       ┌───────────────────┐
                       │ SQLite + Prisma   │
                       │ Documents/State   │
                       └─────────┬─────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ Incident Documents  │
                      │ Deployments         │
                      │ Postmortems        │
                      │ Troubleshooting     │
                      └─────────────────────┘
```

The system is deliberately kept lightweight for the hackathon.

We are using **SQLite + Prisma** for structured data rather than introducing unnecessary infrastructure. Vector search is not required for the initial MVP and can be added later if needed.

---

# 9. Investigation Workflow

```text
User Question
      │
      ▼
Understand Investigation
      │
      ▼
Initial Search
      │
      ▼
Find Relevant Evidence
      │
      ▼
Extract Clues
      │
      ├── Service
      ├── Version
      ├── Date
      ├── Incident ID
      └── Related Component
      │
      ▼
Decide What To Search Next
      │
      ▼
Additional Search
      │
      ▼
Connect Evidence
      │
      ▼
Compare Timeline / Versions
      │
      ▼
Detect Conflicts
      │
      ▼
Is Evidence Sufficient?
      │
   ┌──┴──┐
   │     │
  No    Yes
   │     │
   ▼     ▼
Search   Final
Again    Report
```

The important part is that the investigation **does not follow one fixed path**.

A discovery from one document can determine what the investigator searches for next.

---

# 10. Agents

## 🧠 Agent Whisperer — Investigation Agent

Responsible for the investigation workflow, reasoning, search planning, evidence synthesis, and final report.

The agent receives the user's question, determines what information is needed, uses retrieval tools, follows discovered clues, and decides when the available evidence is sufficient.

**Technology:** LangGraph + LLM.

---

## 🕵️ Evidence Architect — Evidence Analysis

Responsible for retrieving and organizing relevant evidence.

It works with document metadata, dates, versions, incident IDs, services, and relationships between documents.

It helps the investigation workflow compare evidence and identify conflicts.

---

# 11. Services & Data

### SQLite + Prisma

Stores structured information such as:

* Documents
* Document metadata
* Incident IDs
* Dates
* Software versions
* Evidence relationships
* Investigation state
* Investigation history

### Document Dataset

The initial dataset contains controlled examples such as:

```text
data/
├── incidents/
├── deployments/
├── postmortems/
└── troubleshooting/
```

---

# 12. Memory & State

The investigation maintains state throughout a query.

The state can include:

* Current investigation question
* Documents already discovered
* Facts extracted from documents
* Searches already performed
* Services and versions identified
* Evidence collected
* Conflicting information
* Investigation conclusion

This allows later investigation steps to build on earlier discoveries.

---

# 13. Example Investigation

### Example Input

> Why did the Order API become slow on September 16, and has this happened before?

### Step 1 — Initial Investigation

The investigator identifies:

```text
Service: orders-api
Date: September 16
Issue: latency
```

It searches incident reports.

### Step 2 — Incident Found

The investigator finds a relevant incident and extracts:

```text
Incident ID: INC-1042
Service: orders-api
Version: v2.8.1
```

### Step 3 — Follow the Clue

The investigator now has a version to investigate.

Instead of stopping, it searches deployment records for:

```text
orders-api
v2.8.1
```

### Step 4 — Deployment Evidence

A deployment record confirms that the version was deployed around the relevant time.

### Step 5 — Historical Investigation

The investigator searches previous incidents for:

```text
orders-api
latency
similar incident
```

### Step 6 — Compare Evidence

The system compares:

* Dates
* Versions
* Services
* Symptoms
* Documented causes

It distinguishes a genuinely related historical incident from one that only looks similar.

### Step 7 — Final Report

The system produces:

```text
INVESTIGATION RESULT
────────────────────────────

Incident:
Order API latency spike

Timeline:
Sept 15 → v2.8.1 deployed
Sept 16 → latency spike detected

Evidence:
✓ INC-1042 — latency incident
✓ DEP-882 — v2.8.1 deployment
✓ PM-211 — previous latency incident

Finding:
The deployment is temporally associated with the
latency spike, but available evidence does not
establish it as the root cause.

Historical comparison:
A previous latency incident was found, but its
documented cause was different.

Evidence:
INC-1042
DEP-882
PM-211
```

The system should **not invent a root cause when the evidence does not support one**.

---

# 14. Tech Stack

| Layer            | Technology               |
| ---------------- | ------------------------ |
| Frontend         | React.js                 |
| Backend          | Node.js + Express        |
| Agent Framework  | LangGraph                |
| Database         | SQLite                   |
| ORM              | Prisma                   |
| LLM              | LLM API                  |
| Document Storage | Local controlled dataset |
| Hosting          | Local machine / Docker   |
| Version Control  | Git + GitHub             |

### Why this stack?

We are intentionally keeping the infrastructure lightweight.

SQLite provides simple local persistence, Prisma provides structured database access, Express connects the application components, and LangGraph manages the investigation workflow.

We are not adding additional infrastructure unless it directly improves the MVP.

---

# 15. Team

## 🧠 Agent Whisperer

**Agents • Prompts • LLMs • Reasoning**

Owns the investigation agent, LangGraph workflow, prompts, search planning, reasoning, and evidence synthesis.

## 🕵️ Evidence Architect

**RAG • Retrieval • Data • Knowledge**

Owns document ingestion, metadata, database models, retrieval, evidence relationships, and search quality.

## ⚙️ Systems Alchemist

**Backend • APIs • Orchestration**

Owns the Express backend, APIs, system integration, agent/database communication, logging, and application reliability.

## 🎨 Interface Architect

**Frontend • UI/UX • Visualization**

Owns the investigation dashboard, evidence-chain visualization, timeline, investigation progress, and user experience.

---

# 16. Current Build Scope

## Working

The project is being developed as a hackathon prototype around a controlled incident-document dataset.

## Partly Working / Mocked

The initial version uses sample incident, deployment, and postmortem documents rather than live production systems.

## Not Yet Built

* Full investigation agent
* Retrieval pipeline
* Backend APIs
* Frontend dashboard
* Evidence visualization
* Final end-to-end workflow

These components are part of the implementation plan and are not being represented as completed before they are actually built.

---

# 17. What We Want Judges to Focus On

The core investigation concept:

> **Can the system follow clues across different documents, connect the evidence, handle conflicting or outdated information, and produce a clear and traceable investigation result?**

The main differentiator is the **investigation loop** rather than simply retrieving documents and generating an answer.

---

# 18. Future Scope

## Production System Integration

Connect the investigator to live incident-management, deployment, monitoring, ticketing, and internal knowledge systems.

**Goal:** Investigate real operational incidents using current evidence from multiple systems.

---

## Continuous Incident Intelligence

Allow the system to monitor incidents and identify recurring patterns, related historical events, and emerging failure trends.

**Goal:** Help teams identify recurring problems earlier.

---

## Automated Investigation Actions

Extend the investigator from explaining incidents to suggesting approved remediation steps and creating follow-up tasks.

**Goal:** Reduce the gap between discovering a problem and taking action while keeping humans in control of production changes.

---

# 19. MVP Definition

Our MVP is complete when a user can:

```text
1. Enter an incident investigation question
                  ↓
2. Start an investigation
                  ↓
3. Watch the system search relevant documents
                  ↓
4. See discovered evidence
                  ↓
5. See the agent follow at least one discovered clue
                  ↓
6. See related evidence connected
                  ↓
7. See conflicts / uncertainty where applicable
                  ↓
8. Receive a structured final investigation report
                  ↓
9. Trace findings back to document IDs
```

---

# 20. Demo Goal

Our ideal hackathon demonstration will show a judge asking one investigation question and watching the system **discover its own investigation path**.

The key moment is:

> **The agent finds a clue → uses that clue to decide what to search next → connects the new evidence → produces a traceable conclusion.**

That is what makes this an investigation system rather than a simple document chatbot.

---

# 21. Project Philosophy

We are building for a hackathon, not pretending to have a production-ready incident response platform.

Our priority is:

**Working core > unnecessary complexity**

**Clear evidence > impressive-sounding claims**

**Traceable investigation > unexplained answers**

**A small working system > a large unfinished architecture**

---
