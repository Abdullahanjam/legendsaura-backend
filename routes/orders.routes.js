const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { requireAuth } = require("../middleware/authMiddleware");

// POST /api/orders (public) - customer checkout se order aata hai
router.post("/", (req, res) => {
  const { customerName, phone, address, items, notes } = req.body;

  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Naam, phone, address aur kam az kam ek item zaroori hai." });
  }

  const products = readData("products");
  let total = 0;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const price = product ? product.price : 0;
    const qty = Number(item.quantity) || 1;
    total += price * qty;
    return {
      productId: item.productId,
      name: product ? product.name : "Unknown Product",
      price,
      quantity: qty,
    };
  });

  const orders = readData("orders");
  const newOrder = {
    id: uuidv4(),
    orderNumber: `LA-${Date.now().toString().slice(-8)}`,
    customerName,
    phone,
    address,
    notes: notes || "",
    items: orderItems,
    total,
    status: "pending", // pending -> confirmed -> shipped -> delivered -> cancelled
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  writeData("orders", orders);

  res.status(201).json(newOrder);
});

// GET /api/orders (protected) - admin dashboard ke liye
router.get("/", requireAuth, (req, res) => {
  const orders = readData("orders").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

// GET /api/orders/:id (protected)
router.get("/:id", requireAuth, (req, res) => {
  const orders = readData("orders");
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order nahi mila." });
  res.json(order);
});

// PUT /api/orders/:id/status (protected)
router.put("/:id/status", requireAuth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status inme se ek ho: ${validStatuses.join(", ")}` });
  }

  const orders = readData("orders");
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Order nahi mila." });

  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  writeData("orders", orders);
  res.json(orders[idx]);
});

// DELETE /api/orders/:id (protected)
router.delete("/:id", requireAuth, (req, res) => {
  const orders = readData("orders");
  const filtered = orders.filter((o) => o.id !== req.params.id);
  if (filtered.length === orders.length) {
    return res.status(404).json({ error: "Order nahi mila." });
  }
  writeData("orders", filtered);
  res.json({ message: "Order delete ho gaya." });
});

module.exports = router;
