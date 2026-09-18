const { searchDocuments } = require("./search");

async function investigate(question) {
  const initialEvidence = await searchDocuments(question);

  return {
    question,
    summary: "Initial investigation complete",
    findings: initialEvidence.map((doc) => ({
      documentId: doc.id,
      title: doc.title,
      type: doc.type,
      service: doc.service,
      version: doc.version,
      relevance: doc.score,
    })),
    evidence: initialEvidence.map((doc) => doc.id),
    timeline: initialEvidence.map((doc) => ({
      date: doc.date,
      documentId: doc.id,
      title: doc.title,
    })),
    confidence: initialEvidence.length > 0 ? "medium" : "low",
  };
}

module.exports = { investigate };