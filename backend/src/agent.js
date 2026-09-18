const { StateGraph, START, END } = require("@langchain/langgraph");

const { searchDocuments } = require("./search");

const InvestigationState = {
  question: null,
  evidence: [],
  searches: [],
  findings: [],
  finalReport: null,
};

async function searchNode(state) {
  const results = await searchDocuments(state.question);

  return {
    evidence: results,
    searches: [state.question],
  };
}

async function analyzeNode(state) {
  const findings = state.evidence.map((doc) => ({
    documentId: doc.id,
    title: doc.title,
    type: doc.type,
    service: doc.service,
    version: doc.version,
    content: doc.content,
  }));

  return {
    findings,
  };
}

async function reportNode(state) {
  return {
    finalReport: {
      question: state.question,
      summary: "Investigation completed using available evidence.",
      findings: state.findings,
      evidence: state.evidence.map((doc) => doc.id),
      confidence: state.evidence.length > 0 ? "medium" : "low",
    },
  };
}

const graph = new StateGraph({
  channels: InvestigationState,
})
  .addNode("search", searchNode)
  .addNode("analyze", analyzeNode)
  .addNode("report", reportNode)
  .addEdge(START, "search")
  .addEdge("search", "analyze")
  .addEdge("analyze", "report")
  .addEdge("report", END);

const investigationGraph = graph.compile();

async function runInvestigation(question) {
  return investigationGraph.invoke({
    question,
    evidence: [],
    searches: [],
    findings: [],
    finalReport: null,
  });
}

module.exports = { runInvestigation };  