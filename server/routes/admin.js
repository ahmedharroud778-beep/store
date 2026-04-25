import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

const DEFAULT_SECRET = "change_this_secret";
const SECRET = String(process.env.ADMIN_JWT_SECRET || "").trim();
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || "").trim();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";

if (!SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error(
    "Missing required admin env vars. Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_JWT_SECRET.",
  );
}

if (SECRET === DEFAULT_SECRET) {
  throw new Error(
    "ADMIN_JWT_SECRET is using an insecure default value. Set a strong secret before starting the server.",
  );
}

if (isProduction) {
  if (ADMIN_USERNAME.toLowerCase() === "admin" || ADMIN_PASSWORD === "admin123") {
    throw new Error(
      "Insecure default admin credentials are not allowed in production. Change ADMIN_USERNAME and ADMIN_PASSWORD.",
    );
  }
}

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
