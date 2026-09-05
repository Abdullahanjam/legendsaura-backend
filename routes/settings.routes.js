const express = require("express");
const router = express.Router();
const { readSettings, writeSettings } = require("../utils/db");
const { requireAuth } = require("../middleware/authMiddleware");

// GET /api/settings (public) - storefront homepage content ke liye
router.get("/", (req, res) => {
  res.json(readSettings() || {});
});

// PUT /api/settings (protected) - dashboard se site ka content update karne ke liye
router.put("/", requireAuth, (req, res) => {
  const current = readSettings() || {};
  const updated = { ...current, ...req.body };
  writeSettings(updated);
  res.json(updated);
});

module.exports = router;
