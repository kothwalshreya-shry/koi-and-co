const { ChatOllama } = require("@langchain/ollama");

const model = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0,
});

async function generateInvestigationSummary(context) {
  if (!context.evidence.length) {
    return "Insufficient evidence to determine the cause.";
  }

  const evidenceText = context.evidence
    .map(
      (doc) =>
        `DOCUMENT: ${doc.title}
TYPE: ${doc.type}
DATE: ${doc.date}
CONTENT:
${doc.content}`
    )
    .join("\n\n---\n\n");

  const findingsText = context.findings
    .map((f) => `${f.type}: ${f.conclusion}`)
    .join("\n");

  const prompt = `
You are an incident investigation assistant.

Analyze ONLY the evidence provided below.

Question:
${context.question || "What happened?"}

Existing findings:
${findingsText}

Evidence:
${evidenceText}

Rules:
- Use ONLY facts explicitly stated in the provided evidence.
- Do not invent technical details, causes, fixes, versions, architecture details, or actions.
- Every important factual claim must be traceable to one or more document IDs.
- When stating a cause, mention the supporting document ID.
- If the evidence does not establish something, say "The available evidence does not establish this."
- Historical evidence must be clearly described as historical, not as proof of the current incident.
- Do not use your general knowledge.
- Keep the answer concise.

Format:
Summary: <evidence-grounded summary>

Supporting evidence:
- <document ID>: <what it supports>
- <document ID>: <what it supports>

Return only the investigation summary.
`;

  const response = await model.invoke(prompt);

  return response.content;
}

module.exports = {
  generateInvestigationSummary,
};