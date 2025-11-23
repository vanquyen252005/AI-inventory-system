// src/server.js
const app = require("./app");
const { port } = require("./config/env");

app.listen(port, () => {
  console.log(`Inventory service listening on port ${port}`);
});

