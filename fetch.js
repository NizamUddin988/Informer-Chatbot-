
let chatHistory = [];

try {
  const saved = localStorage.getItem("chatHistory");
  if (saved) chatHistory = JSON.parse(saved);
} catch (e) {
  chatHistory = [];
}

function displayChat() {
  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";

  chatHistory.forEach(msg => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", msg.role);
    msgDiv.textContent = msg.text;
    chatBody.appendChild(msgDiv);
  });

  chatBody.scrollTop = chatBody.scrollHeight;
}

async function generateContent() {
  const userInput = document.getElementById("userInput");
  const prompt = userInput.value.trim();
  if (!prompt) return;

  userInput.value = "";
  userInput.disabled = true;
  document.getElementById("sendBtn").disabled = true;

  chatHistory.push({ role: "user", text: prompt });
  displayChat();

  // Typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("typing-indicator");
  typingIndicator.innerHTML = `
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  document.getElementById("chatBody").appendChild(typingIndicator);
  document.getElementById("chatBody").scrollTop = document.getElementById("chatBody").scrollHeight;

  // ✅ Build conversation history in Gemini format (multi-turn)
  const contents = chatHistory
    .filter(msg => msg.role !== "bot" || msg.text !== "Hi! I'm your AI ChatBot. How can I assist you today?")
    .map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 512 }
  };

  try {
    const response = await fetch("api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    const botReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

    typingIndicator.remove();
    chatHistory.push({ role: "bot", text: botReply });

    // ✅ Save to localStorage safely
    try {
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    } catch (e) {}

    displayChat();
  } catch (err) {
    console.error(err);
    typingIndicator.remove();
    chatHistory.push({ role: "bot", text: "Something went wrong. Please try again." });
    displayChat();
  } finally {
    userInput.disabled = false;
    document.getElementById("sendBtn").disabled = false;
    userInput.focus();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (chatHistory.length === 0) {
    chatHistory.push({
      role: "bot",
      text: "Hi! I'm your AI ChatBot. How can I assist you today?"
    });
    try {
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    } catch (e) {}
  }
  displayChat();

  document.getElementById("userInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      generateContent();
    }
  });

  document.getElementById("sendBtn").addEventListener("click", generateContent);

  const suggestions = {
    b1: "How can I develop English communication skills?",
    b2: "Which is the best programming language to learn?",
    b3: "Suggest some best internships for my skill development."
  };

  Object.entries(suggestions).forEach(([id, text]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", () => {
        document.getElementById("userInput").value = text;
        document.getElementById("userInput").focus();
      });
    }
  });
});
