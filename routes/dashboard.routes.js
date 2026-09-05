const express = require("express");
const router = express.Router();
const { readData } = require("../utils/db");
const { requireAuth } = require("../middleware/authMiddleware");

// GET /api/dashboard/stats (protected) - overview cards ke liye
router.get("/stats", requireAuth, (req, res) => {
  const products = readData("products");
  const orders = readData("orders");
  const categories = readData("categories");

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => p.stock <= 5).length;

  res.json({
    totalProducts: products.length,
    totalCategories: categories.length,
    totalOrders: orders.length,
    pendingOrders,
    totalRevenue,
    lowStock,
    recentOrders: orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5),
  });
});

module.exports = router;
