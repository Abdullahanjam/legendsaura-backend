const express = require("express");
const router = express.Router();
const { readData, writeData } = require("../utils/db");
const { comparePassword, hashPassword, generateToken } = require("../utils/auth");
const { requireAuth } = require("../middleware/authMiddleware");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username aur password dono zaroori hain." });
  }

  const admins = readData("admins");
  const admin = admins.find((a) => a.username.toLowerCase() === String(username).toLowerCase());

  if (!admin || !comparePassword(password, admin.passwordHash)) {
    return res.status(401).json({ error: "Username ya password ghalat hai." });
  }

  const token = generateToken({ id: admin.id, username: admin.username });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

// GET /api/auth/me  (protected) - dashboard load hote hi verify karne ke liye
router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

// POST /api/auth/change-password (protected)
router.post("/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current aur new password dono chahiye." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Naya password kam az kam 6 characters ka ho." });
  }

  const admins = readData("admins");
  const admin = admins.find((a) => a.id === req.admin.id);
  if (!admin || !comparePassword(currentPassword, admin.passwordHash)) {
    return res.status(401).json({ error: "Current password ghalat hai." });
  }

  admin.passwordHash = hashPassword(newPassword);
  writeData("admins", admins);
  res.json({ message: "Password successfully update ho gaya." });
});

module.exports = router;
