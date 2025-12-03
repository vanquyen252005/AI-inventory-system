// src/server.js
const app = require("./app");
const { port } = require("./config/env");

app.listen(port, () => {
  console.log(`🚀 API Gateway listening on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Auth Service: http://localhost:${port}/api/auth`);
  console.log(`📦 Inventory Service: http://localhost:${port}/api/inventory`);
  console.log(`🤖 AI Scan Service: http://localhost:${port}/api/ai-scan`);
});

