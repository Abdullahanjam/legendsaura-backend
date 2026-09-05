// Simple file-based JSON "database".
// Yeh production ke liye ek badi e-commerce site ke liye ideal nahi hai (bohat zyada
// traffic par slow ho sakta hai), lekin ek chhoti/medium store ke liye reliable,
// dependency-free aur samajhne me aasan hai. Baad me chahein to isay MySQL/MongoDB
// me migrate kiya ja sakta hai bina API routes ka structure badle.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function ensureFile(name, defaultValue) {
  const p = filePath(name);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(defaultValue, null, 2));
  }
}

function readData(name) {
  const p = filePath(name);
  ensureFile(name, Array.isArray(name) ? [] : []);
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error(`Error reading ${name}.json:`, err.message);
    return [];
  }
}

function writeData(name, data) {
  const p = filePath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  return data;
}

// Settings is a single object, not an array
function readSettings() {
  const p = filePath("settings");
  if (!fs.existsSync(p)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function writeSettings(obj) {
  writeData("settings", obj);
  return obj;
}

module.exports = { readData, writeData, readSettings, writeSettings, DATA_DIR };
