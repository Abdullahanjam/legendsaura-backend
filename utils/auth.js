const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "legendsaura-fallback-secret";
const TOKEN_EXPIRY = "7d";

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
