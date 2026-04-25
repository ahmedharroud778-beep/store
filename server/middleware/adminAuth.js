// server/middleware/adminAuth.js
import jwt from "jsonwebtoken";

const DEFAULT_SECRET = "change_this_secret";
const SECRET = process.env.ADMIN_JWT_SECRET || DEFAULT_SECRET;

if (SECRET === DEFAULT_SECRET) {
  console.warn(
    "\n⚠️  WARNING: ADMIN_JWT_SECRET is using the default value in adminAuth middleware.\n" +
    "   Set a strong, unique secret in your server/.env file before going to production.\n"
  );
}

export function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

