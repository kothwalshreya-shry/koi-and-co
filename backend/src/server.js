const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { runInvestigation } = require("./agent");
const { investigate } = require("./investigation");
const prisma = require("./db");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const upload = multer({
  storage: multer.memoryStorage(),
});


const app = express();
const upload = multer({ storage: multer.memoryStorage() });

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
app.get("/api/documents", async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: {
        date: "desc",
      },
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch documents",
      message: error.message,
    });
  }
});
const PORT = process.env.PORT || 5000;

app.get("/api/documents", async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: {
        date: "desc",
      },
    });

    res.json(documents);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch documents",
      message: error.message,
    });
  }
});

app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const fileName = req.file.originalname;
    const extension = fileName.split(".").pop().toLowerCase();

    if (!["txt", "md"].includes(extension)) {
      return res.status(400).json({
        error: "Only .txt and .md files are supported right now",
      });
    }

    const content = req.file.buffer.toString("utf-8");

    const document = await prisma.document.create({
      data: {
        id: `UPLOAD-${Date.now()}`,
        title: fileName,
        type: extension === "md" ? "markdown" : "text",
        date: new Date(),
        content,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to upload document",
      message: error.message,
    });
  }
});

app.post("/api/investigate", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const result = await runInvestigation(question);

    res.json(result.finalReport);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Investigation failed",
      message: error.message,
    });
  }
});
app.post(
  "/api/documents/upload",
  (req, res, next) => {
    upload.array("files")(req, res, (error) => {
      if (error) {
        console.error("🔥 MULTER ERROR:", error);

        return res.status(400).json({
          error: "Upload middleware failed",
          message: error.message,
          code: error.code,
        });
      }

      next();
    });
  },
  async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        error: "No files uploaded",
      });
    }

    const createdDocuments = [];

    for (const file of files) {
      let content = "";

      if (
        file.mimetype === "text/plain" ||
        file.originalname.endsWith(".txt") ||
        file.originalname.endsWith(".md")
      ) {
        content = file.buffer.toString("utf-8");
      } else if (file.mimetype === "application/pdf") {
        const parser = new PDFParse({
  data: file.buffer,
});

const parsed = await parser.getText();
content = parsed.text;

await parser.destroy();
      } else if (
        file.mimetype.includes("wordprocessingml") ||
        file.originalname.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        content = result.value;
      } else {
        continue;
      }

      const document = await prisma.document.create({
        data: {
          id: `UPLOAD-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          title: file.originalname,
          type: getUploadedDocumentType(file.originalname),
          date: new Date(),
          content,
        },
      });

      createdDocuments.push(document);
    }

    res.json({
      message: "Documents uploaded and indexed",
      documents: createdDocuments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
});
function getUploadedDocumentType(filename) {
  const name = filename.toLowerCase();

  if (name.includes("incident")) return "incident";
  if (name.includes("deploy")) return "deployment";
  if (name.includes("postmort")) return "postmortem";
  if (name.includes("guide")) return "troubleshooting";
  if (name.includes("architecture")) return "architecture";
  if (name.includes("complaint")) return "customer_complaint";

  return "document";
}
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});