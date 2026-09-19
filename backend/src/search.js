const prisma = require("./db");
const { OllamaEmbeddings } = require("@langchain/ollama");

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

const TYPE_WEIGHTS = {
  incident: 2,
  postmortem: 2,
  deployment: 1,
  troubleshooting: 1,
  customer_complaint: 1,
  architecture: 0,
};

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

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

  if (!documents.length) {
    return [];
  }

  const queryEmbedding = await embeddings.embedQuery(query);

  const documentTexts = documents.map(
    (doc) =>
      `${doc.title}
${doc.type}
${doc.service || ""}
${doc.version || ""}
${doc.content}`
  );

  const documentEmbeddings = await embeddings.embedDocuments(documentTexts);

  const scored = documents.map((doc, index) => {
    const text = documentTexts[index].toLowerCase();

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

    const semanticSimilarity = cosineSimilarity(
      queryEmbedding,
      documentEmbeddings[index]
    );

    const semanticScore = Math.round(semanticSimilarity * 10);

    const score =
      semanticScore +
      keywordScore +
      phraseScore +
      typeScore;

    return {
      ...doc,
      score,
      scoreBreakdown: {
        semanticScore,
        semanticSimilarity: Number(semanticSimilarity.toFixed(3)),
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

module.exports = {
  searchDocuments,
};