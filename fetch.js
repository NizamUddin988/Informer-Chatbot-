let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

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

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 256 }
  };

  try {
    const response = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("API request failed.");
    const data = await response.json();

    const botReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

    typingIndicator.remove();
    chatHistory.push({ role: "bot", text: botReply });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    displayChat();
  } catch (err) {
    console.error(err);
    typingIndicator.remove();
    chatHistory.push({ role: "bot", text: "⚠️ Something went wrong. Try again." });
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
      text: "👋 Hi! I'm your AI ChatBot. How can I assist you today?"
    });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
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
