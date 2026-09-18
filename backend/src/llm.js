async function generateInvestigationSummary(context) {
  // Swappable LLM layer.
  // Replace this implementation with any compatible LLM later.

  if (!context.evidence.length) {
    return "Insufficient evidence to determine the cause.";
  }

  const rootCause = context.findings.find(
    (f) => f.type === "root_cause"
  );

  if (rootCause) {
    return rootCause.conclusion;
  }

  return "Evidence was found, but the available documents do not establish a complete root cause.";
}

module.exports = {
  generateInvestigationSummary,
};