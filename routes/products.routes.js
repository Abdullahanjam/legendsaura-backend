const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { requireAuth } = require("../middleware/authMiddleware");

// GET /api/products  (public) - storefront ke liye. Query: ?category=&search=&featured=true
router.get("/", (req, res) => {
  let products = readData("products");
  const { category, search, featured } = req.query;

  if (category) {
    products = products.filter((p) => p.categoryId === category);
  }
  if (featured === "true") {
    products = products.filter((p) => p.featured);
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
    );
  }

  res.json(products);
});

// GET /api/products/:id (public)
router.get("/:id", (req, res) => {
  const products = readData("products");
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product nahi mila." });
  res.json(product);
});

// POST /api/products (protected)
router.post("/", requireAuth, (req, res) => {
  const { name, description, price, compareAtPrice, image, categoryId, stock, featured } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: "Product name aur price zaroori hain." });
  }

  const products = readData("products");
  const newProduct = {
    id: uuidv4(),
    name,
    description: description || "",
    price: Number(price),
    compareAtPrice: Number(compareAtPrice) || 0,
    image: image || "",
    categoryId: categoryId || null,
    stock: Number(stock) || 0,
    featured: Boolean(featured),
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  writeData("products", products);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id (protected)
router.put("/:id", requireAuth, (req, res) => {
  const products = readData("products");
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product nahi mila." });

  const allowedFields = ["name", "description", "price", "compareAtPrice", "image", "categoryId", "stock", "featured"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      products[idx][field] = ["price", "compareAtPrice", "stock"].includes(field)
        ? Number(req.body[field])
        : req.body[field];
    }
  });
  products[idx].updatedAt = new Date().toISOString();

  writeData("products", products);
  res.json(products[idx]);
});

// DELETE /api/products/:id (protected)
router.delete("/:id", requireAuth, (req, res) => {
  const products = readData("products");
  const filtered = products.filter((p) => p.id !== req.params.id);
  if (filtered.length === products.length) {
    return res.status(404).json({ error: "Product nahi mila." });
  }
  writeData("products", filtered);
  res.json({ message: "Product delete ho gaya." });
});

module.exports = router;
