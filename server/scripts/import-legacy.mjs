import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Set it before running import.");
  process.exit(1);
}

const CLEAR_FIRST = String(process.env.CLEAR_FIRST || "").trim() === "1";

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readJsonArray(filePath) {
  const exists = await fs.pathExists(filePath);
  if (!exists) return [];
  const data = await fs.readJson(filePath).catch(() => []);
  return Array.isArray(data) ? data : [];
}

function normalizeProduct(raw) {
  const images = Array.isArray(raw?.images) ? raw.images.map((v) => String(v || "").trim()).filter(Boolean) : [];
  const image = String(raw?.image || images[0] || "").trim();
  const details = raw?.details && typeof raw.details === "object" ? raw.details : {};
  return {
    id: Number(raw?.id) || Date.now(),
    name: String(raw?.name || "").trim(),
    price: Number(raw?.price || 0),
    image,
    category: String(raw?.category || "").trim(),
    subcategory: String(raw?.subcategory || "").trim() || null,
    description: String(raw?.description || "").trim(),
    images,
    details,
  };
}

function buildCategoriesFromProducts(products) {
  // Mirrors the app's category model:
  // - main categories have parentId = null
  // - subcategories have parentId pointing to their main category
  const mainIdByName = new Map();
  const categories = [];
  let nextId = 1;
  let nextSortOrder = 1;

  for (const product of products) {
    const main = String(product.category || "").trim();
    if (!main) continue;
    if (!mainIdByName.has(main)) {
      const id = nextId++;
      mainIdByName.set(main, id);
      categories.push({
        id,
        name: main,
        slug: slugify(main),
        parentId: null,
        sortOrder: nextSortOrder++,
      });
    }
  }

  const childKeySet = new Set();
  for (const product of products) {
    const main = String(product.category || "").trim();
    const child = String(product.subcategory || "").trim();
    if (!main || !child) continue;
    const parentId = mainIdByName.get(main);
    if (!parentId) continue;
    const key = `${parentId}:${child.toLowerCase()}`;
    if (childKeySet.has(key)) continue;
    childKeySet.add(key);
    categories.push({
      id: nextId++,
      name: child,
      slug: slugify(child),
      parentId,
      sortOrder: nextSortOrder++,
    });
  }

  return categories;
}

async function ensureTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      subcategory TEXT,
      description TEXT NOT NULL DEFAULT '',
      images_json TEXT NOT NULL DEFAULT '[]',
      details_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS categories (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      parent_id BIGINT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      date TEXT,
      created_at TEXT,
      updated_at TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT NOT NULL DEFAULT '',
      customer_json TEXT NOT NULL DEFAULT '{}',
      items_json TEXT NOT NULL DEFAULT '[]',
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash'
    );
    CREATE TABLE IF NOT EXISTS order_history (
      id TEXT PRIMARY KEY,
      date TEXT,
      created_at TEXT,
      updated_at TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT NOT NULL DEFAULT '',
      customer_json TEXT NOT NULL DEFAULT '{}',
      items_json TEXT NOT NULL DEFAULT '[]',
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash'
    );
    CREATE TABLE IF NOT EXISTS custom_requests (
      id TEXT PRIMARY KEY,
      created_at TEXT,
      updated_at TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT NOT NULL DEFAULT 'website',
      type TEXT NOT NULL DEFAULT 'custom-request',
      customer_json TEXT NOT NULL DEFAULT '{}',
      product_json TEXT NOT NULL DEFAULT '{}',
      images_json TEXT NOT NULL DEFAULT '[]',
      admin_notes TEXT NOT NULL DEFAULT ''
    );
  `);
}

async function clearAll(pool) {
  await pool.query("BEGIN");
  try {
    await pool.query("DELETE FROM custom_requests");
    await pool.query("DELETE FROM order_history");
    await pool.query("DELETE FROM orders");
    await pool.query("DELETE FROM categories");
    await pool.query("DELETE FROM products");
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }
}

async function main() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl:
      DATABASE_URL.includes("sslmode=require") || DATABASE_URL.includes("render.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const legacyDir = path.resolve(__dirname, "../server/data");
  const legacyProductsPath = path.join(legacyDir, "products.json");
  const legacyOrdersPath = path.join(legacyDir, "orders.json");
  const legacyHistoryPath = path.join(legacyDir, "order-history.json");
  const legacyRequestsPath = path.join(legacyDir, "custom-requests.json");

  // also support old doc path: server/server/data/*
  const fallbackDir = path.resolve(__dirname, "../server/server/data");
  const productsPath = (await fs.pathExists(legacyProductsPath)) ? legacyProductsPath : path.join(fallbackDir, "products.json");
  const ordersPath = (await fs.pathExists(legacyOrdersPath)) ? legacyOrdersPath : path.join(fallbackDir, "orders.json");
  const historyPath = (await fs.pathExists(legacyHistoryPath)) ? legacyHistoryPath : path.join(fallbackDir, "order-history.json");
  const requestsPath = (await fs.pathExists(legacyRequestsPath)) ? legacyRequestsPath : path.join(fallbackDir, "custom-requests.json");

  const rawProducts = await readJsonArray(productsPath);
  const rawOrders = await readJsonArray(ordersPath);
  const rawHistory = await readJsonArray(historyPath);
  const rawRequests = await readJsonArray(requestsPath);

  const products = rawProducts.map(normalizeProduct).filter((p) => p.name);
  const categories = buildCategoriesFromProducts(products);

  await ensureTables(pool);
  if (CLEAR_FIRST) await clearAll(pool);

  await pool.query("BEGIN");
  try {
    for (const product of products) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        `
          INSERT INTO products (
            id, name, price, image, category, subcategory, description, images_json, details_json
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            image = EXCLUDED.image,
            category = EXCLUDED.category,
            subcategory = EXCLUDED.subcategory,
            description = EXCLUDED.description,
            images_json = EXCLUDED.images_json,
            details_json = EXCLUDED.details_json
        `,
        [
          product.id,
          product.name,
          product.price,
          product.image || "",
          product.category || "",
          product.subcategory,
          product.description || "",
          JSON.stringify(product.images || []),
          JSON.stringify(product.details || {}),
        ],
      );
    }

    for (const category of categories) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        `
          INSERT INTO categories (id, name, slug, parent_id, sort_order)
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            parent_id = EXCLUDED.parent_id,
            sort_order = EXCLUDED.sort_order
        `,
        [category.id, category.name, category.slug, category.parentId, category.sortOrder],
      );
    }

    for (const order of rawOrders) {
      const id = String(order?.id || "").trim();
      if (!id) continue;
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        `
          INSERT INTO orders (
            id, date, created_at, updated_at, status, notes, customer_json, items_json, total, payment_method
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO UPDATE SET
            date = EXCLUDED.date,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            customer_json = EXCLUDED.customer_json,
            items_json = EXCLUDED.items_json,
            total = EXCLUDED.total,
            payment_method = EXCLUDED.payment_method
        `,
        [
          id,
          String(order?.date || ""),
          String(order?.createdAt || ""),
          String(order?.updatedAt || ""),
          String(order?.status || "new"),
          String(order?.notes || ""),
          JSON.stringify(order?.customer || {}),
          JSON.stringify(Array.isArray(order?.items) ? order.items : []),
          Number(order?.total || 0),
          String(order?.paymentMethod || order?.customer?.paymentMethod || "cash"),
        ],
      );
    }

    for (const order of rawHistory) {
      const id = String(order?.id || "").trim();
      if (!id) continue;
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        `
          INSERT INTO order_history (
            id, date, created_at, updated_at, status, notes, customer_json, items_json, total, payment_method
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO UPDATE SET
            date = EXCLUDED.date,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            customer_json = EXCLUDED.customer_json,
            items_json = EXCLUDED.items_json,
            total = EXCLUDED.total,
            payment_method = EXCLUDED.payment_method
        `,
        [
          id,
          String(order?.date || ""),
          String(order?.createdAt || ""),
          String(order?.updatedAt || ""),
          String(order?.status || "completed"),
          String(order?.notes || ""),
          JSON.stringify(order?.customer || {}),
          JSON.stringify(Array.isArray(order?.items) ? order.items : []),
          Number(order?.total || 0),
          String(order?.paymentMethod || order?.customer?.paymentMethod || "cash"),
        ],
      );
    }

    for (const req of rawRequests) {
      const id = String(req?.id || "").trim();
      if (!id) continue;
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        `
          INSERT INTO custom_requests (
            id, created_at, updated_at, status, source, type, customer_json, product_json, images_json, admin_notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO UPDATE SET
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            status = EXCLUDED.status,
            source = EXCLUDED.source,
            type = EXCLUDED.type,
            customer_json = EXCLUDED.customer_json,
            product_json = EXCLUDED.product_json,
            images_json = EXCLUDED.images_json,
            admin_notes = EXCLUDED.admin_notes
        `,
        [
          id,
          String(req?.createdAt || ""),
          String(req?.updatedAt || ""),
          String(req?.status || "new"),
          String(req?.source || "website"),
          String(req?.type || "custom-request"),
          JSON.stringify(req?.customer || {}),
          JSON.stringify(req?.product || {}),
          JSON.stringify(Array.isArray(req?.images) ? req.images : []),
          String(req?.adminNotes || ""),
        ],
      );
    }

    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  } finally {
    await pool.end();
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        imported: {
          products: products.length,
          categories: categories.length,
          orders: rawOrders.length,
          orderHistory: rawHistory.length,
          customRequests: rawRequests.length,
        },
        sourcePaths: { productsPath, ordersPath, historyPath, requestsPath },
        clearFirst: CLEAR_FIRST,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

