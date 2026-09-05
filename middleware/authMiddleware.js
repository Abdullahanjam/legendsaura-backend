const { verifyToken } = require("../utils/auth");

// Yeh middleware check karta hai ke request ke saath valid admin token hai ya nahi.
// Dashboard ke saare "edit/add/delete" routes is middleware se protect kiye gaye hain.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Login required. Token missing." });
  }

  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired ya invalid token. Dobara login karein." });
  }
}

module.exports = { requireAuth };
