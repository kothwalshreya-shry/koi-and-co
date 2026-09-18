const express = require("express");
const cors = require("cors");
const { investigate } = require("./investigation");
const prisma = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Incident Investigator API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.post("/api/investigate", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const result = await investigate(question);

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Investigation failed",
      message: error.message,
    });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});