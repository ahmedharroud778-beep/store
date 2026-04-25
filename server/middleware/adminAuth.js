// server/middleware/adminAuth.js
import jwt from "jsonwebtoken";

const DEFAULT_SECRET = "change_this_secret";
const SECRET = String(process.env.ADMIN_JWT_SECRET || "").trim();

if (!SECRET) {
  throw new Error("Missing ADMIN_JWT_SECRET. Set it before starting the server.");
}

if (SECRET === DEFAULT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET is using an insecure default value. Set a strong secret.");
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

