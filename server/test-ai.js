const { io } = require("socket.io-client");

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
  
  socket.emit("ai-chat", {
    message: "Say hello world!",
    code: null,
    language: "javascript",
    fileName: null,
    history: [],
    mode: "private",
    provider: "gemini",
    apiKey: "" // Uses server env var
  });
});

socket.on("ai-response-chunk", (data) => {
  process.stdout.write(data.chunk);
});

socket.on("ai-response-done", (data) => {
  console.log("\n[DONE]");
  process.exit(0);
});

socket.on("ai-response-error", (data) => {
  console.error("\n[ERROR]", data.error);
  process.exit(1);
});

setTimeout(() => {
  console.error("Timeout waiting for response");
  process.exit(1);
}, 10000);
