const prisma = require("./db");

const TYPE_WEIGHTS = {
  incident: 2,
  postmortem: 2,
  deployment: 1,
  troubleshooting: 1,
  customer_complaint: 1,
  architecture: 0,
};

async function searchDocuments(query) {
  const normalizedQuery = query.toLowerCase().trim();

  const words = normalizedQuery
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const documents = await prisma.document.findMany({
    orderBy: {
      date: "desc",
    },
  });

  const scored = documents.map((doc) => {
    const text = `
      ${doc.title}
      ${doc.type}
      ${doc.service || ""}
      ${doc.version || ""}
      ${doc.content}
    `.toLowerCase();

    let keywordScore = 0;

    for (const word of words) {
      if (text.includes(word)) {
        keywordScore++;
      }
    }

    const exactPhraseMatch =
      normalizedQuery.length > 0 && text.includes(normalizedQuery);

    const phraseScore = exactPhraseMatch ? 3 : 0;
    const typeScore = TYPE_WEIGHTS[doc.type] || 0;

    const score = keywordScore + phraseScore + typeScore;

    return {
      ...doc,
      score,
      scoreBreakdown: {
        keywordScore,
        phraseScore,
        typeScore,
      },
    };
  });

  return scored
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
module.exports = { searchDocuments };