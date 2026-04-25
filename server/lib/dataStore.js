import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.resolve(__dirname, "../server/data");
export const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
export const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
export const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
export const ORDER_HISTORY_FILE = path.join(DATA_DIR, "order-history.json");
export const CUSTOM_REQUESTS_FILE = path.join(DATA_DIR, "custom-requests.json");
export const DATABASE_FILE = process.env.DB_PATH || path.join(DATA_DIR, "baraa-store.db");

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DATABASE_FILE);
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0,
        image TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        subcategory TEXT,
        description TEXT NOT NULL DEFAULT '',
        images_json TEXT NOT NULL DEFAULT '[]',
        details_json TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        parent_id INTEGER,
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
        total REAL NOT NULL DEFAULT 0,
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
        total REAL NOT NULL DEFAULT 0,
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

  return db;
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapProductRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    price: Number(row.price || 0),
    image: row.image || "",
    category: row.category || "",
    subcategory: row.subcategory || "",
    description: row.description || "",
    images: safeJsonParse(row.images_json, []),
    details: safeJsonParse(row.details_json, {}),
  };
}

function mapCategoryRow(row) {
  return {
    id: Number(row.id),
    name: row.name || "",
    slug: row.slug || "",
    parentId: row.parent_id == null ? null : Number(row.parent_id),
    sortOrder: Number(row.sort_order || 0),
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapOrderRow(row) {
  return {
    id: String(row.id),
    date: row.date || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    status: row.status || "new",
    notes: row.notes || "",
    customer: safeJsonParse(row.customer_json, {}),
    items: safeJsonParse(row.items_json, []),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method || "cash",
  };
}

function mapCustomRequestRow(row) {
  return {
    id: String(row.id),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    status: row.status || "new",
    source: row.source || "website",
    type: row.type || "custom-request",
    customer: safeJsonParse(row.customer_json, {}),
    product: safeJsonParse(row.product_json, {}),
    images: safeJsonParse(row.images_json, []),
    adminNotes: row.admin_notes || "",
  };
}

function replaceProducts(products) {
  const database = getDb();
  database.exec("BEGIN");

  try {
    // Collect incoming IDs so we can delete only removed products
    const incomingIds = products.map((p) => Number(p.id)).filter((id) => Number.isFinite(id));

    // Delete products that are no longer in the list
    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => "?").join(",");
      database.prepare(`DELETE FROM products WHERE id NOT IN (${placeholders})`).run(...incomingIds);
    } else {
      database.exec("DELETE FROM products");
    }

    const upsert = database.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, price, image, category, subcategory, description, images_json, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of products) {
      upsert.run(
        Number(product.id),
        product.name || "",
        Number(product.price || 0),
        product.image || "",
        product.category || "",
        product.subcategory || "",
        product.description || "",
        JSON.stringify(Array.isArray(product.images) ? product.images : []),
        JSON.stringify(product.details || {}),
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function replaceCategories(categories) {
  const database = getDb();
  database.exec("BEGIN");

  try {
    database.exec("DELETE FROM categories");
    const insert = database.prepare(`
      INSERT INTO categories (
        id, name, slug, parent_id, sort_order
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const category of categories) {
      insert.run(
        Number(category.id),
        category.name || "",
        category.slug || slugify(category.name),
        category.parentId == null ? null : Number(category.parentId),
        Number(category.sortOrder || 0),
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function replaceOrders(tableName, orders) {
  const database = getDb();
  database.exec("BEGIN");

  try {
    // Delete only orders that are no longer present
    const incomingIds = orders.map((o) => String(o.id)).filter(Boolean);
    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => "?").join(",");
      database.prepare(`DELETE FROM ${tableName} WHERE id NOT IN (${placeholders})`).run(...incomingIds);
    } else {
      database.exec(`DELETE FROM ${tableName}`);
    }

    const upsert = database.prepare(`
      INSERT OR REPLACE INTO ${tableName} (
        id, date, created_at, updated_at, status, notes, customer_json, items_json, total, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const order of orders) {
      upsert.run(
        String(order.id),
        order.date || "",
        order.createdAt || "",
        order.updatedAt || "",
        order.status || "new",
        order.notes || "",
        JSON.stringify(order.customer || {}),
        JSON.stringify(Array.isArray(order.items) ? order.items : []),
        Number(order.total || 0),
        order.paymentMethod || order.customer?.paymentMethod || "cash",
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function replaceCustomRequests(requests) {
  const database = getDb();
  database.exec("BEGIN");

  try {
    // Delete only requests that are no longer present
    const incomingIds = requests.map((r) => String(r.id)).filter(Boolean);
    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => "?").join(",");
      database.prepare(`DELETE FROM custom_requests WHERE id NOT IN (${placeholders})`).run(...incomingIds);
    } else {
      database.exec("DELETE FROM custom_requests");
    }

    const upsert = database.prepare(`
      INSERT OR REPLACE INTO custom_requests (
        id, created_at, updated_at, status, source, type, customer_json, product_json, images_json, admin_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const request of requests) {
      upsert.run(
        String(request.id),
        request.createdAt || "",
        request.updatedAt || "",
        request.status || "new",
        request.source || "website",
        request.type || "custom-request",
        JSON.stringify(request.customer || {}),
        JSON.stringify(request.product || {}),
        JSON.stringify(Array.isArray(request.images) ? request.images : []),
        request.adminNotes || "",
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

async function readJsonArrayIfExists(filePath) {
  if (!(await fs.pathExists(filePath))) return [];
  const data = await fs.readJson(filePath).catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function migrateJsonDataIfNeeded() {
  const database = getDb();
  const counts = {
    products: Number(database.prepare("SELECT COUNT(*) AS count FROM products").get().count || 0),
    categories: Number(database.prepare("SELECT COUNT(*) AS count FROM categories").get().count || 0),
    orders: Number(database.prepare("SELECT COUNT(*) AS count FROM orders").get().count || 0),
    orderHistory: Number(database.prepare("SELECT COUNT(*) AS count FROM order_history").get().count || 0),
    customRequests: Number(database.prepare("SELECT COUNT(*) AS count FROM custom_requests").get().count || 0),
  };

  if (Object.values(counts).some((count) => count > 0)) return;

  const [products, categories, orders, orderHistory, customRequests] = await Promise.all([
    readJsonArrayIfExists(PRODUCTS_FILE),
    readJsonArrayIfExists(CATEGORIES_FILE),
    readJsonArrayIfExists(ORDERS_FILE),
    readJsonArrayIfExists(ORDER_HISTORY_FILE),
    readJsonArrayIfExists(CUSTOM_REQUESTS_FILE),
  ]);

  if (products.length > 0) replaceProducts(products);
  if (categories.length > 0) replaceCategories(categories);
  if (orders.length > 0) replaceOrders("orders", orders);
  if (orderHistory.length > 0) replaceOrders("order_history", orderHistory);
  if (customRequests.length > 0) replaceCustomRequests(customRequests);
}

async function migrateCompletedOrdersToHistory() {
  const orders = await readOrders();
  const completedOrders = orders.filter(
    (order) => String(order?.status || "").toLowerCase() === "completed",
  );

  if (completedOrders.length === 0) return;

  const activeOrders = orders.filter(
    (order) => String(order?.status || "").toLowerCase() !== "completed",
  );

  const history = await readOrderHistory();
  const historyIds = new Set(history.map((order) => String(order.id)));
  const mergedHistory = [
    ...completedOrders.filter((order) => !historyIds.has(String(order.id))),
    ...history,
  ];

  await writeOrders(activeOrders);
  await writeOrderHistory(mergedHistory);
}

async function migrateCategoriesFromProductsIfNeeded() {
  const database = getDb();
  const existingCount = Number(database.prepare("SELECT COUNT(*) AS count FROM categories").get().count || 0);
  if (existingCount > 0) return;

  const products = await readProducts();
  if (products.length === 0) return;

  let nextId = 1;
  let nextSortOrder = 1;
  const categories = [];
  const parentIdByName = new Map();

  for (const product of products) {
    const categoryName = String(product.category || "").trim();
    if (!categoryName) continue;

    if (!parentIdByName.has(categoryName)) {
      const id = nextId++;
      parentIdByName.set(categoryName, id);
      categories.push({
        id,
        name: categoryName,
        slug: slugify(categoryName),
        parentId: null,
        sortOrder: nextSortOrder++,
      });
    }
  }

  const childKeySet = new Set();
  for (const product of products) {
    const categoryName = String(product.category || "").trim();
    const subcategoryName = String(product.subcategory || "").trim();
    if (!categoryName || !subcategoryName) continue;

    const parentId = parentIdByName.get(categoryName);
    const key = `${parentId}:${subcategoryName.toLowerCase()}`;
    if (!parentId || childKeySet.has(key)) continue;

    childKeySet.add(key);
    categories.push({
      id: nextId++,
      name: subcategoryName,
      slug: slugify(subcategoryName),
      parentId,
      sortOrder: nextSortOrder++,
    });
  }

  if (categories.length > 0) {
    replaceCategories(categories);
  }
}

export async function ensureDataFiles() {
  await fs.ensureDir(DATA_DIR);
  getDb();
  await migrateJsonDataIfNeeded();
  await migrateCategoriesFromProductsIfNeeded();
  await migrateCompletedOrdersToHistory();
}

export async function readProducts() {
  const rows = getDb()
    .prepare("SELECT * FROM products ORDER BY id ASC")
    .all();
  return rows.map(mapProductRow);
}

export async function readCategories() {
  const rows = getDb()
    .prepare("SELECT * FROM categories ORDER BY parent_id IS NOT NULL ASC, sort_order ASC, id ASC")
    .all();
  return rows.map(mapCategoryRow);
}

export async function writeCategories(categories) {
  replaceCategories(categories);
}

export async function writeProducts(products) {
  replaceProducts(products);
}

export async function readOrders() {
  const rows = getDb()
    .prepare("SELECT * FROM orders ORDER BY datetime(created_at) DESC, id DESC")
    .all();
  return rows.map(mapOrderRow);
}

export async function writeOrders(orders) {
  replaceOrders("orders", orders);
}

export async function readOrderHistory() {
  const rows = getDb()
    .prepare("SELECT * FROM order_history ORDER BY datetime(updated_at, created_at) DESC, id DESC")
    .all();
  return rows.map(mapOrderRow);
}

export async function writeOrderHistory(history) {
  replaceOrders("order_history", history);
}

export async function readCustomRequests() {
  const rows = getDb()
    .prepare("SELECT * FROM custom_requests ORDER BY datetime(created_at) DESC, id DESC")
    .all();
  return rows.map(mapCustomRequestRow);
}

export async function writeCustomRequests(requests) {
  replaceCustomRequests(requests);
}
