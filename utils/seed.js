// Yeh script pehli baar chalane par:
// - Ek default admin account banata hai (username/password .env se aate hain)
// - Sample categories aur products dalta hai (aap dashboard se inhe edit/delete kar sakte hain)
// - Site settings (homepage content) ka default set karta hai
// Chalane ka tareeqa: npm run seed

require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData, readSettings, writeSettings } = require("./db");
const { hashPassword } = require("./auth");

function seedAdmin() {
  const admins = readData("admins");
  if (admins.length > 0) {
    console.log("Admin already exists, skipping admin seed.");
    return;
  }
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Legendsaura@123";
  admins.push({
    id: uuidv4(),
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  writeData("admins", admins);
  console.log(`Admin created -> username: ${username}, password: ${password}`);
}

function seedCategories() {
  const categories = readData("categories");
  if (categories.length > 0) return;
  const defaults = [
    { id: uuidv4(), name: "Streetwear", slug: "streetwear" },
    { id: uuidv4(), name: "Accessories", slug: "accessories" },
    { id: uuidv4(), name: "Footwear", slug: "footwear" },
  ];
  writeData("categories", defaults);
  return defaults;
}

function seedProducts(categories) {
  const products = readData("products");
  if (products.length > 0) return;
  const cat = (name) => categories.find((c) => c.name === name)?.id || categories[0].id;
  const defaults = [
    {
      id: uuidv4(),
      name: "Legendsaura Oversized Hoodie",
      description: "Heavyweight cotton hoodie with signature aura print. Sample product - dashboard se edit karein.",
      price: 4999,
      compareAtPrice: 6499,
      image: "",
      categoryId: cat("Streetwear"),
      stock: 25,
      featured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Aura Chain Necklace",
      description: "Stainless steel chain with brand pendant. Sample product - dashboard se edit karein.",
      price: 1499,
      compareAtPrice: 0,
      image: "",
      categoryId: cat("Accessories"),
      stock: 40,
      featured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Legends Runner Sneakers",
      description: "Everyday comfort sneakers. Sample product - dashboard se edit karein.",
      price: 7999,
      compareAtPrice: 0,
      image: "",
      categoryId: cat("Footwear"),
      stock: 15,
      featured: false,
      createdAt: new Date().toISOString(),
    },
  ];
  writeData("products", defaults);
}

function seedSettings() {
  const existing = readSettings();
  if (existing) return;
  writeSettings({
    siteName: "Legendsaura",
    logoUrl: "",
    heroTitle: "Wear the Legend",
    heroSubtitle: "Premium streetwear drops for those who leave an aura behind.",
    heroImage: "",
    aboutTitle: "About Legendsaura",
    aboutText: "Legendsaura is a premium streetwear label built for people who set trends, not follow them. Yeh text dashboard se change kar sakte hain.",
    contactEmail: "info@legendsaura.com",
    contactPhone: "+92 300 0000000",
    address: "Faisalabad, Punjab, Pakistan",
    instagram: "https://instagram.com/legendsaura",
    facebook: "https://facebook.com/legendsaura",
    tiktok: "",
    whatsapp: "",
    currency: "PKR",
    shippingFee: 200,
    announcementBar: "Free shipping on orders above Rs. 5000",
  });
}

function seedOrders() {
  const orders = readData("orders");
  if (orders.length > 0) return;
  writeData("orders", []);
}

function run() {
  seedAdmin();
  const categories = seedCategories() || readData("categories");
  seedProducts(categories);
  seedSettings();
  seedOrders();
  console.log("Seeding complete.");
}

run();
