const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { requireAuth } = require("../middleware/authMiddleware");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/categories (public)
router.get("/", (req, res) => {
  res.json(readData("categories"));
});

// POST /api/categories (protected)
router.post("/", requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category ka naam zaroori hai." });

  const categories = readData("categories");
  const newCategory = { id: uuidv4(), name, slug: slugify(name) };
  categories.push(newCategory);
  writeData("categories", categories);
  res.status(201).json(newCategory);
});

// PUT /api/categories/:id (protected)
router.put("/:id", requireAuth, (req, res) => {
  const categories = readData("categories");
  const idx = categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Category nahi mili." });

  if (req.body.name) {
    categories[idx].name = req.body.name;
    categories[idx].slug = slugify(req.body.name);
  }
  writeData("categories", categories);
  res.json(categories[idx]);
});

// DELETE /api/categories/:id (protected)
router.delete("/:id", requireAuth, (req, res) => {
  const categories = readData("categories");
  const filtered = categories.filter((c) => c.id !== req.params.id);
  if (filtered.length === categories.length) {
    return res.status(404).json({ error: "Category nahi mili." });
  }
  writeData("categories", filtered);
  res.json({ message: "Category delete ho gayi." });
});

module.exports = router;
