require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/products.routes");
const categoryRoutes = require("./routes/categories.routes");
const orderRoutes = require("./routes/orders.routes");
const settingsRoutes = require("./routes/settings.routes");
const uploadRoutes = require("./routes/upload.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Make sure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Server start hote hi admin account + sample data khud ban jaye (agar pehle se nahi hai).
// Yeh un hosting plans ke liye zaroori hai jahan Shell/SSH access nahi milta.
require("./utils/seed");

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded product images publicly accessible
app.use("/uploads", express.static(uploadsDir));

// Admin Dashboard (CMS) - static files, isay browser me /admin par kholein
app.use("/admin", express.static(path.join(__dirname, "admin")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send(
    "Legendsaura backend chal raha hai. Admin dashboard ke liye /admin par jayein."
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route nahi mila." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error. Baad me try karein." });
});

app.listen(PORT, () => {
  console.log(`Legendsaura backend http://localhost:${PORT} par chal raha hai`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});
