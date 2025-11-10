import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "src")));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("ERROR: Missing API_KEY in .env file!");
  process.exit(1);
}

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "api.html"));
});
app.post("/generate", async (req, res) => {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return res
        .status(response.status)
        .json({ error: "Gemini API request failed." });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Failed to connect to Gemini API." });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
