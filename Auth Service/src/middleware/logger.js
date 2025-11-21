// src/middleware/logger.js

const COLORS = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function sanitize(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = { ...obj };
  if (clone.password) clone.password = "***";
  if (clone.refreshToken) clone.refreshToken = "***";
  return clone;
}

function logger(req, res, next) {
  const start = Date.now();

  const oldJson = res.json;

  res.json = function (data) {
    const elapsed = Date.now() - start;

    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    const color =
      status >= 500 ? COLORS.red :
      status >= 400 ? COLORS.yellow :
      COLORS.green;

    const line =
      `${COLORS.cyan}[${method} ${url}]${COLORS.reset} ` +
      `${color}${status}${COLORS.reset} ` +
      `(${elapsed}ms) ` +
      `req=${JSON.stringify(sanitize(req.body))} ` +
      `res=${JSON.stringify(sanitize(data))}`;

    console.log(line);

    return oldJson.call(this, data);
  };

  next();
}

module.exports = { logger };
    