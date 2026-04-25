import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

const DEFAULT_SECRET = "change_this_secret";
const SECRET = process.env.ADMIN_JWT_SECRET || DEFAULT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Warn loudly if the default JWT secret is still in use
if (SECRET === DEFAULT_SECRET) {
  console.warn(
    "\n⚠️  WARNING: ADMIN_JWT_SECRET is using the default value.\n" +
    "   Set a strong, unique secret in your server/.env file before going to production.\n"
  );
}

// Pre-hash the admin password at startup so we never compare plaintext
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ role: "admin", username }, SECRET, {
    expiresIn: "12h",
  });

  return res.json({ token });
});

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default router;
