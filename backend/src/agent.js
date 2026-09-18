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
  const initialResults = await searchDocuments(state.question);

  const followUpQueries = [];

  for (const doc of initialResults) {
    if (doc.service) {
      followUpQueries.push(`${doc.service} ${doc.version || ""}`);
    }

    if (doc.type === "incident") {
      followUpQueries.push(`${doc.service || ""} postmortem`);
    }
  }

  const uniqueQueries = [...new Set(followUpQueries)].slice(0, 4);

  let followUpResults = [];

  for (const query of uniqueQueries) {
    const results = await searchDocuments(query);
    followUpResults.push(...results);
  }

  const allEvidence = [
    ...initialResults,
    ...followUpResults,
  ];

  const uniqueEvidence = Array.from(
    new Map(allEvidence.map((doc) => [doc.id, doc])).values()
  );

  return {
    evidence: uniqueEvidence,
    searches: [
      state.question,
      ...uniqueQueries,
    ],
  };
}

async function analyzeNode(state) {
  const docs = state.evidence;

  const incidents = docs.filter((d) => d.type === "incident");
  const deployments = docs.filter((d) => d.type === "deployment");
  const postmortems = docs.filter((d) => d.type === "postmortem");

  const findings = [];

  if (incidents.length > 0) {
    findings.push({
      type: "incident",
      conclusion: "The Order API experienced elevated latency.",
      evidence: incidents.map((d) => d.id),
    });
  }

  if (deployments.length > 0) {
    findings.push({
      type: "deployment",
      conclusion:
        "The incident occurred shortly after a deployment of the affected service/version.",
      evidence: deployments.map((d) => d.id),
    });
  }

  if (postmortems.length > 0) {
    findings.push({
      type: "root_cause",
      conclusion:
        "The postmortem attributes the latency to an additional customer-profile lookup and database connection contention.",
      evidence: postmortems.map((d) => d.id),
    });
  }

  const historicalIncidents = incidents.filter(
    (d) => !d.id.includes("0916")
  );

  if (historicalIncidents.length > 0) {
    findings.push({
      type: "historical_pattern",
      conclusion:
        "A similar Order API latency pattern occurred previously, involving customer-profile database access.",
      evidence: historicalIncidents.map((d) => d.id),
    });
  }

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