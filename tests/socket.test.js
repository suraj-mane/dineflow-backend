const { io } = require("socket.io-client");
const fetch   = require("node-fetch");

const BASE = "http://localhost:5000";

async function run() {
  // Login
  const res  = await fetch(`${BASE}/api/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: "suraj@test.com", password: "secret123" }),
  });

  const json = await res.json();
  console.log("Login response:", JSON.stringify(json, null, 2));

  const token = json?.data?.accessToken;

  if (!token) {
    console.error("❌ No token found in response");
    process.exit(1);
  }

  console.log("✅ Got token:", token.slice(0, 20) + "...");

  // Connect socket with token
  const socket = io(BASE, {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("join-restaurant", 1);
  });

  socket.on("joined", (data) => {
    console.log("✅ Joined room:", data.room);
    socket.disconnect();
    process.exit(0);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection error:", err.message);
    process.exit(1);
  });

  // Timeout after 5 seconds
  setTimeout(() => {
    console.error("❌ Timeout — no response from server");
    process.exit(1);
  }, 5000);
}

run().catch(console.error);