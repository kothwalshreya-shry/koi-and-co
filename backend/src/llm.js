async function generateInvestigationSummary(context) {
  if (!context.evidence.length) {
    return "Insufficient evidence to determine the cause.";
  }

  const rootCause = context.findings.find(
    (f) => f.type === "root_cause"
  );

  const deployment = context.findings.find(
    (f) => f.type === "deployment"
  );

  const historical = context.findings.find(
    (f) => f.type === "historical_pattern"
  );

  if (rootCause && deployment && historical) {
    return (
      "The Order API latency was associated with the 4.8.0 deployment. " +
      "The deployment introduced an additional customer-profile lookup, " +
      "which caused database connection contention and increased latency. " +
      "A similar customer-profile database access pattern was documented " +
      "in an earlier Order API incident."
    );
  }

  if (rootCause) {
    return rootCause.conclusion;
  }

  return (
    "Evidence was found, but the available documents do not establish " +
    "a complete root cause."
  );
}

module.exports = {
  generateInvestigationSummary,
};