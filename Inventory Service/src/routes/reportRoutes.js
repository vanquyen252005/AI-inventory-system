// src/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const reportService = require("../services/reportService");
const { authGuard } = require("../middleware/authGuard");

// GET /reports/summary - Get summary statistics
router.get("/reports/summary", authGuard(), async (req, res, next) => {
  try {
    const summary = await reportService.getSummary();
    return res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /reports/trends - Get trend data
router.get("/reports/trends", authGuard(), async (req, res, next) => {
  try {
    const trends = await reportService.getTrends(req.query.startDate, req.query.endDate);
    return res.json(trends);
  } catch (err) {
    next(err);
  }
});

// GET /reports/issues - Get issue distribution
router.get("/reports/issues", authGuard(), async (req, res, next) => {
  try {
    const distribution = await reportService.getIssueDistribution();
    return res.json(distribution);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

