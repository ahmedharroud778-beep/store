import express from "express";
import upload, { UPLOADS_DIR } from "./lib/upload.js";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import adminRouter from "./routes/admin.js";
import protectedAdminRouter from "./routes/protectedAdmin.js";
import { adminAuth } from "./middleware/adminAuth.js";
import {
  ensureDataFiles,
  readCategories,
  readCustomRequests,
  readOrderHistory,
  readOrders,
  readProducts,
  writeCustomRequests,
  writeOrders,
  writeProducts,
} from "./lib/dataStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  }),
);
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

// Rate limiters for public-facing mutation endpoints
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout attempts. Please try again in 15 minutes." },
});

const customRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many custom requests. Please try again in 15 minutes." },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

await ensureDataFiles();

const existingProducts = await readProducts();
if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
  const sample = [
    { id: 1, name: "Blue Shirt", price: 25, image: "/assets/shirt.png", stock: 10, category: "curated" },
    { id: 2, name: "Sneakers", price: 50, image: "/assets/shoes.png", stock: 5, category: "curated" },
  ];
  await writeProducts(sample);
}

app.get("/api/products", async (_req, res) => {
  const products = await readProducts();
  res.json(products);
});

app.get("/api/categories", async (_req, res) => {
  const categories = await readCategories();
  res.json(categories);
});

app.post("/api/cart", (req, res) => {
  const { productId, qty = 1 } = req.body;
  res.json({ success: true, message: `Added product ${productId}`, productId, qty });
});

app.get("/api/orders/:id", async (req, res) => {
  const orderId = String(req.params.id || "").trim();
  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  const [orders, orderHistory] = await Promise.all([readOrders(), readOrderHistory()]);
  const order =
    orders.find((item) => String(item.id) === orderId) ||
    orderHistory.find((item) => String(item.id) === orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json(order);
});

app.get("/api/custom-requests/:id", async (req, res) => {
  const requestId = String(req.params.id || "").trim();
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  const requests = await readCustomRequests();
  const request = requests.find((item) => String(item.id) === requestId);

  if (!request) {
    return res.status(404).json({ error: "Custom request not found" });
  }

  return res.json(request);
});

// ── Input sanitization helpers ──────────────────────────────────────────
function stripTags(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

function sanitizeString(value, maxLength = 500) {
  return stripTags(String(value || "")).slice(0, maxLength);
}

function isValidEmail(value) {
  if (!value) return true; // email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeCustomer(raw) {
  const obj = raw && typeof raw === "object" ? raw : {};
  return {
    name: sanitizeString(obj.name, 200),
    email: sanitizeString(obj.email, 200),
    phone: sanitizeString(obj.phone, 50),
    city: sanitizeString(obj.city, 100),
    address: sanitizeString(obj.address, 500),
    notes: sanitizeString(obj.notes, 1000),
    paymentMethod: ["cash", "bank_transfer"].includes(obj.paymentMethod) ? obj.paymentMethod : "cash",
  };
}

function sanitizeItem(raw) {
  const obj = raw && typeof raw === "object" ? raw : {};
  return {
    id: Number(obj.id) || 0,
    name: sanitizeString(obj.name, 300),
    price: Math.max(0, Number(obj.price) || 0),
    image: sanitizeString(obj.image, 1000),
    category: sanitizeString(obj.category, 200),
    size: sanitizeString(obj.size, 50),
    color: sanitizeString(obj.color, 50),
    quantity: Math.max(1, Math.min(100, Math.floor(Number(obj.quantity) || 1))),
  };
}

function getStockValueAndKey(stockMap, selectedOption) {
  if (!stockMap || typeof stockMap !== "object") return null;
  const option = String(selectedOption || "").trim();
  if (!option) return null;

  if (Object.prototype.hasOwnProperty.call(stockMap, option)) {
    const value = Number(stockMap[option]);
    return Number.isFinite(value) ? { key: option, value } : { key: option, value: 0 };
  }

  const match = Object.keys(stockMap).find((entry) => entry.toLowerCase() === option.toLowerCase());
  if (!match) return { key: option, value: 0 };

  const value = Number(stockMap[match]);
  return Number.isFinite(value) ? { key: match, value } : { key: match, value: 0 };
}
// ────────────────────────────────────────────────────────────────────────

app.post("/api/checkout", checkoutLimiter, async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  const customer = sanitizeCustomer(req.body?.customer);

  // Validate required fields
  if (!customer.name) {
    return res.status(400).json({ error: "Customer name is required." });
  }
  if (!customer.phone) {
    return res.status(400).json({ error: "Phone number is required." });
  }
  if (!customer.address) {
    return res.status(400).json({ error: "Delivery address is required." });
  }
  if (customer.email && !isValidEmail(customer.email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }
  if (rawItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }
  if (rawItems.length > 50) {
    return res.status(400).json({ error: "Too many items in cart." });
  }

  const requestedItems = rawItems.map(sanitizeItem);
  const products = await readProducts();
  const nextProducts = products.map((product) => ({
    ...product,
    details: product?.details && typeof product.details === "object" ? { ...product.details } : {},
  }));
  const productsById = new Map(nextProducts.map((product) => [Number(product.id), product]));
  const items = [];
  let stockWasUpdated = false;

  for (const requestItem of requestedItems) {
    const canonicalProduct = productsById.get(Number(requestItem.id));
    if (!canonicalProduct) {
      return res.status(400).json({ error: `Invalid product in cart: ${requestItem.id}` });
    }

    const sizeStockMatch = getStockValueAndKey(canonicalProduct?.details?.sizeStock, requestItem.size);
    const colorStockMatch = getStockValueAndKey(canonicalProduct?.details?.colorStock, requestItem.color);
    const stockCandidates = [sizeStockMatch?.value, colorStockMatch?.value].filter(
      (value) => typeof value === "number" && Number.isFinite(value),
    );
    const availableStock = stockCandidates.length > 0 ? Math.min(...stockCandidates) : null;

    if (availableStock !== null && requestItem.quantity > availableStock) {
      return res.status(400).json({
        error: `Not enough stock for ${canonicalProduct.name}. Available: ${Math.max(0, availableStock)}.`,
      });
    }

    items.push({
      ...requestItem,
      name: sanitizeString(canonicalProduct.name, 300),
      price: Math.max(0, Number(canonicalProduct.price) || 0),
      image: sanitizeString(canonicalProduct.image, 1000),
      category: sanitizeString(canonicalProduct.category, 200),
    });

    if (sizeStockMatch) {
      if (!canonicalProduct.details || typeof canonicalProduct.details !== "object") canonicalProduct.details = {};
      if (!canonicalProduct.details.sizeStock || typeof canonicalProduct.details.sizeStock !== "object") {
        canonicalProduct.details.sizeStock = {};
      }
      const current = Number(canonicalProduct.details.sizeStock[sizeStockMatch.key] ?? 0);
      canonicalProduct.details.sizeStock[sizeStockMatch.key] = Math.max(
        0,
        (Number.isFinite(current) ? current : 0) - requestItem.quantity,
      );
      stockWasUpdated = true;
    }

    if (colorStockMatch) {
      if (!canonicalProduct.details || typeof canonicalProduct.details !== "object") canonicalProduct.details = {};
      if (!canonicalProduct.details.colorStock || typeof canonicalProduct.details.colorStock !== "object") {
        canonicalProduct.details.colorStock = {};
      }
      const current = Number(canonicalProduct.details.colorStock[colorStockMatch.key] ?? 0);
      canonicalProduct.details.colorStock[colorStockMatch.key] = Math.max(
        0,
        (Number.isFinite(current) ? current : 0) - requestItem.quantity,
      );
      stockWasUpdated = true;
    }
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentMethod = customer.paymentMethod;

  const order = {
    id: String(Date.now()),
    date: new Date().toLocaleDateString(),
    createdAt: new Date().toISOString(),
    items,
    customer,
    total,
    paymentMethod,
    status: "new",
    notes: "",
  };

  const orders = await readOrders();
  orders.push(order);
  await writeOrders(orders);
  if (stockWasUpdated) {
    await writeProducts(nextProducts);
  }
  res.json({ success: true, orderId: order.id });
});

app.post("/api/custom-request", customRequestLimiter, upload.array("images", 5), async (req, res) => {
  let payload = {};
  try {
    payload = req.body && typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    payload = req.body || {};
  }

  // Sanitize customer fields
  const rawCustomer = payload.customer || payload;
  const customer = {
    name: sanitizeString(rawCustomer.name, 200),
    email: sanitizeString(rawCustomer.email, 200),
    phone: sanitizeString(rawCustomer.phone, 50),
    city: sanitizeString(rawCustomer.city, 100),
    notes: sanitizeString(rawCustomer.notes, 1000),
  };

  // Sanitize product fields
  const rawProduct = payload.product || {};
  const product = {
    website: sanitizeString(rawProduct.website, 500),
    description: sanitizeString(rawProduct.description, 2000),
    size: sanitizeString(rawProduct.size, 50),
    color: sanitizeString(rawProduct.color, 50),
    quantity: Math.max(1, Math.min(100, Math.floor(Number(rawProduct.quantity) || 1))),
    productLink: sanitizeString(rawProduct.productLink, 1000),
  };

  // Validate required fields
  if (!customer.name) {
    return res.status(400).json({ error: "Customer name is required." });
  }
  if (!customer.phone) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  const imageFiles = req.files || [];
  const imageUrls = imageFiles.map((file) => `/uploads/${file.filename}`);
  const customRequest = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    status: "new",
    source: "website",
    customer,
    product,
    images: imageUrls,
  };

  const requests = await readCustomRequests();
  requests.push(customRequest);
  await writeCustomRequests(requests);
  res.json({ success: true, requestId: customRequest.id, images: imageUrls });
});

app.use("/admin-api/login", adminLoginLimiter);
app.use("/admin-api", adminRouter);
app.use("/admin-api/protected", adminAuth, protectedAdminRouter);

app.get("/admin-api/protected/stats", adminAuth, async (_req, res) => {
  const orders = await readOrders();
  const products = await readProducts();
  res.json({
    uptime: process.uptime(),
    ordersCount: orders.length,
    productsCount: products.length,
    message: "Protected admin stats",
  });
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
