// server/routes/protectedAdmin.js
import express from "express";
import upload from "../lib/upload.js";
import {
  readCategories,
  readCustomRequests,
  readOrderHistory,
  readOrders,
  readProducts,
  writeCategories,
  writeOrderHistory,
  writeOrders,
  writeProducts,
} from "../lib/dataStore.js";

const router = express.Router();

function parseProductPayload(req) {
  const rawPayload = req.body?.payload;

  if (typeof rawPayload === "string") {
    try {
      return JSON.parse(rawPayload);
    } catch {
      return {};
    }
  }

  return req.body || {};
}

function normalizeProductInput(req, fallbackProduct = null) {
  const payload = parseProductPayload(req);
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  const uploadedUrls = uploadedFiles.map((file) => `/uploads/${file.filename}`);
  const remoteImages = Array.isArray(payload.images)
    ? payload.images.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const allImages = [...remoteImages, ...uploadedUrls];
  const requestedMainImageIndex = Number(payload.mainImageIndex);
  const safeMainImageIndex =
    Number.isInteger(requestedMainImageIndex) && requestedMainImageIndex >= 0 && requestedMainImageIndex < allImages.length
      ? requestedMainImageIndex
      : 0;
  const details = payload.details && typeof payload.details === "object" ? payload.details : {};
  const normalizedSizeOptions = Array.isArray(details.sizeOptions)
    ? details.sizeOptions.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  return {
    ...(fallbackProduct || {}),
    ...payload,
    id: fallbackProduct?.id || payload.id,
    name: String(payload.name || fallbackProduct?.name || "").trim(),
    price: Number(payload.price || fallbackProduct?.price || 0),
    category: String(payload.category || fallbackProduct?.category || "").trim(),
    subcategory: String(payload.subcategory || fallbackProduct?.subcategory || "").trim(),
    description: String(payload.description || fallbackProduct?.description || "").trim(),
    image: allImages[safeMainImageIndex] || fallbackProduct?.image || "",
    images: allImages.length > 0 ? allImages : fallbackProduct?.images || [],
    details: {
      ...(fallbackProduct?.details || {}),
      ...details,
      sizeOptions: normalizedSizeOptions,
    },
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET products
router.get("/products", async (req, res) => {
  const products = await readProducts();
  res.json(products);
});

router.get("/categories", async (_req, res) => {
  const categories = await readCategories();
  res.json(categories);
});

router.post("/categories", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const parentId = req.body?.parentId == null || req.body?.parentId === "" ? null : Number(req.body.parentId);
  if (!name) return res.status(400).json({ error: "Category name is required" });

  const categories = await readCategories();
  if (parentId != null && !categories.some((category) => category.id === parentId)) {
    return res.status(400).json({ error: "Parent category was not found" });
  }

  const duplicate = categories.find(
    (category) =>
      String(category.name).toLowerCase() === name.toLowerCase() &&
      (category.parentId ?? null) === parentId,
  );
  if (duplicate) {
    return res.status(400).json({ error: "A category with that name already exists here" });
  }

  const newCategory = {
    id: Date.now(),
    name,
    slug: slugify(name),
    parentId,
    sortOrder: categories.length + 1,
  };

  await writeCategories([...categories, newCategory]);
  res.json(newCategory);
});

router.put("/categories/:id", async (req, res) => {
  const categoryId = Number(req.params.id);
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Category name is required" });

  const categories = await readCategories();
  const targetIndex = categories.findIndex((category) => category.id === categoryId);
  if (targetIndex === -1) return res.status(404).json({ error: "Category not found" });

  const target = categories[targetIndex];
  const parentId = target.parentId ?? null;

  const duplicate = categories.find(
    (category) =>
      category.id !== categoryId &&
      String(category.name).toLowerCase() === name.toLowerCase() &&
      (category.parentId ?? null) === parentId,
  );
  if (duplicate) {
    return res.status(400).json({ error: "A category with that name already exists here" });
  }

  const previousName = String(target.name || "");
  const updatedCategory = {
    ...target,
    name,
    slug: slugify(name),
  };

  const nextCategories = [...categories];
  nextCategories[targetIndex] = updatedCategory;

  let updatedProducts = null;
  if (previousName && previousName !== name) {
    const products = await readProducts();
    if (parentId == null) {
      updatedProducts = products.map((product) => {
        if (String(product.category || "") !== previousName) return product;
        return { ...product, category: name };
      });
    } else {
      const parentCategory = categories.find((category) => category.id === parentId);
      const parentName = String(parentCategory?.name || "");
      updatedProducts = products.map((product) => {
        if (String(product.category || "") !== parentName) return product;
        if (String(product.subcategory || "") !== previousName) return product;
        return { ...product, subcategory: name };
      });
    }
  }

  await writeCategories(nextCategories);
  if (updatedProducts) {
    await writeProducts(updatedProducts);
  }

  res.json(updatedCategory);
});

router.delete("/categories/:id", async (req, res) => {
  const categoryId = Number(req.params.id);
  const categories = await readCategories();
  const target = categories.find((category) => category.id === categoryId);
  if (!target) return res.status(404).json({ error: "Category not found" });

  const childCategories = categories.filter((category) => category.parentId === categoryId);
  if (childCategories.length > 0) {
    return res.status(400).json({ error: "Delete child sections first before removing this main section" });
  }

  const products = await readProducts();
  const linkedProducts = products.filter((product) => {
    if (target.parentId == null) {
      return String(product.category || "").toLowerCase() === String(target.name).toLowerCase();
    }

    return (
      String(product.category || "").toLowerCase() ===
        String(categories.find((category) => category.id === target.parentId)?.name || "").toLowerCase() &&
      String(product.subcategory || "").toLowerCase() === String(target.name).toLowerCase()
    );
  });

  if (linkedProducts.length > 0) {
    return res.status(400).json({ error: "Reassign or delete products in this section before deleting it" });
  }

  await writeCategories(categories.filter((category) => category.id !== categoryId));
  res.json({ success: true });
});

// POST create product
router.post("/products", upload.array("images", 10), async (req, res) => {
  const products = await readProducts();
  const normalizedProduct = normalizeProductInput(req);
  const newProduct = { id: Date.now(), ...normalizedProduct };
  products.push(newProduct);
  await writeProducts(products);
  res.json(newProduct);
});

// PUT update product
router.put("/products/:id", upload.array("images", 10), async (req, res) => {
  const id = Number(req.params.id);
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  products[idx] = normalizeProductInput(req, products[idx]);
  await writeProducts(products);
  res.json(products[idx]);
});

// DELETE product
router.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  let products = await readProducts();
  products = products.filter((p) => p.id !== id);
  await writeProducts(products);
  res.json({ success: true });
});

// GET orders
router.get("/orders", async (req, res) => {
  const orders = await readOrders();
  res.json(orders);
});

router.get("/orders-history", async (_req, res) => {
  const history = await readOrderHistory();
  res.json(history);
});

router.delete("/orders/:id", async (req, res) => {
  const orders = await readOrders();
  const filteredOrders = orders.filter((order) => String(order.id) !== String(req.params.id));

  if (filteredOrders.length === orders.length) {
    return res.status(404).json({ error: "Order not found" });
  }

  await writeOrders(filteredOrders);
  res.json({ success: true });
});

router.delete("/orders-history/:id", async (req, res) => {
  const history = await readOrderHistory();
  const filteredHistory = history.filter((order) => String(order.id) !== String(req.params.id));

  if (filteredHistory.length === history.length) {
    return res.status(404).json({ error: "Order not found in history" });
  }

  await writeOrderHistory(filteredHistory);
  res.json({ success: true });
});

router.get("/custom-requests", async (_req, res) => {
  const requests = await readCustomRequests();
  res.json(requests);
});

router.put("/custom-requests/:id", async (req, res) => {
  const requests = await readCustomRequests();
  const idx = requests.findIndex((request) => String(request.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Custom request not found" });

  requests[idx] = {
    ...requests[idx],
    status: req.body?.status || requests[idx].status || "new",
    adminNotes:
      typeof req.body?.adminNotes === "string"
        ? req.body.adminNotes
        : requests[idx].adminNotes || "",
    updatedAt: new Date().toISOString(),
  };

  await writeCustomRequests(requests);
  res.json(requests[idx]);
});

router.delete("/custom-requests/:id", async (req, res) => {
  const requests = await readCustomRequests();
  const filteredRequests = requests.filter((request) => String(request.id) !== String(req.params.id));

  if (filteredRequests.length === requests.length) {
    return res.status(404).json({ error: "Custom request not found" });
  }

  await writeCustomRequests(filteredRequests);
  res.json({ success: true });
});

router.put("/orders/:id", async (req, res) => {
  const orders = await readOrders();
  const idx = orders.findIndex((order) => String(order.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });

  const updatedOrder = {
    ...orders[idx],
    status: req.body?.status || orders[idx].status || "new",
    notes: typeof req.body?.notes === "string" ? req.body.notes : orders[idx].notes || "",
    updatedAt: new Date().toISOString(),
  };

  if (String(updatedOrder.status).toLowerCase() === "completed") {
    const history = await readOrderHistory();
    const filteredOrders = orders.filter((order) => String(order.id) !== String(req.params.id));
    await writeOrders(filteredOrders);
    await writeOrderHistory([updatedOrder, ...history]);
    return res.json({ movedToHistory: true, order: updatedOrder });
  }

  orders[idx] = updatedOrder;
  await writeOrders(orders);
  res.json({ movedToHistory: false, order: updatedOrder });
});

export default router;
