// src/app.js

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { logger } = require("./middleware/logger");
const app = express();

app.use(cors());
app.use(express.json());

app.use(logger);
// prefix cho auth service
app.use("/auth", authRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
