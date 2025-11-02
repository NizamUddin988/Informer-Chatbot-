// ✅ Import dependencies
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

// ✅ Load environment variables from .env
dotenv.config();

const app = express();

// ✅ Allow frontend (HTML/JS) access
app.use(cors());

// ✅ Parse JSON requests
app.use(express.json());

// ✅ Optional: Fix Content Security Policy (removes Chrome warnings)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

// ✅ API key and Gemini endpoint
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("❌ ERROR: Missing API_KEY in .env file!");
  process.exit(1);
}

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

// ✅ Handle POST requests from frontend
app.post("/generate", async (req, res) => {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    // Handle API errors
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
app.get("/", (req, res) => {
  res.send("✅ Chatbot backend is running! Use POST /generate for AI responses.");
});


// ✅ Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running safely at http://localhost:${PORT}`);
});
