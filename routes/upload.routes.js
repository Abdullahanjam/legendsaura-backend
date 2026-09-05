const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { requireAuth } = require("../middleware/authMiddleware");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Sirf image files allowed hain (jpg, jpeg, png, webp, gif)."));
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/upload (protected) - form-data field name: "image"
router.post("/", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Koi image upload nahi hui." });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Multer errors ko handle karne ke liye
router.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;
