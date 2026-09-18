const prisma = require("./db");

async function searchDocuments(query) {
  const words = query
    .toLowerCase()
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

    let score = 0;

    for (const word of words) {
      if (text.includes(word)) {
        score++;
      }
    }

    return {
      ...doc,
      score,
    };
  });

  return scored
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

module.exports = { searchDocuments };