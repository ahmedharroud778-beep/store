// src/pages/Admin/AdminDashboard.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "../../contexts/LanguageContext";
import { Package, ShoppingCart, LogOut, ChartColumn, Archive, ClipboardList } from "lucide-react";
import { curatedProducts, handmadeProducts, Product } from "../../data/products";
import { ThemeToggle } from "../../components/ThemeToggle";
import useAdminAuth from "../../../hooks/useAdminAuth";
import { fetchProtected } from "../../../utils/adminApi";
import { AdminProductsPanel } from "./panels/AdminProductsPanel";
import { AdminOrdersPanel, type Order } from "./panels/AdminOrdersPanel";
import { AdminCustomRequestsPanel, type CustomRequest } from "./panels/AdminCustomRequestsPanel";
import { ProductFormModal } from "./components/ProductFormModal";

// All type definitions are now imported from their respective panel files

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder?: number;
  children: StoreCategory[];
}

function normalizeOrder(raw: any): Order {
  return {
    id: String(raw?.id ?? ""),
    date: raw?.date || raw?.createdAt || "",
    createdAt: raw?.createdAt,
    customer: {
      name: raw?.customer?.name || "",
      email: raw?.customer?.email || "",
      phone: raw?.customer?.phone || "",
      address: raw?.customer?.address || "",
      city: raw?.customer?.city || "",
    },
    items: Array.isArray(raw?.items) ? raw.items : [],
    total: Number(raw?.total || 0),
    paymentMethod: raw?.paymentMethod || raw?.customer?.paymentMethod || "cash",
    status: raw?.status || "new",
    notes: raw?.notes || "",
  };
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function formatCurrency(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getOrderDateValue(order: Order) {
  const source = order.createdAt || order.date;
  if (!source) return null;

  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

function parseDateInput(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isDateWithinRange(value: Date, start: Date | null, end: Date | null) {
  if (start && value < start) return false;
  if (end && value > end) return false;
  return true;
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusBadgeClass(status?: string) {
  const normalized = String(status || "new").toLowerCase();

  if (normalized === "contacted") return "bg-sky-500/10 text-sky-700 border-sky-500/20";
  if (normalized === "confirmed") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (normalized === "completed") return "bg-secondary/10 text-secondary border-secondary/20";
  if (normalized === "canceled") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

function getStatusLabel(status?: string) {
  const normalized = String(status || "new").toLowerCase();
  if (normalized === "contacted") return "Contacted";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "completed") return "Completed";
  if (normalized === "canceled") return "Canceled";
  return "New";
}

function matchesOrderSearch(order: Order, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const haystack = [
    order.id,
    order.customer?.name,
    order.customer?.email,
    order.customer?.phone,
    order.customer?.city,
    order.customer?.address,
    order.paymentMethod,
    order.status,
    ...order.items.map((item) => item?.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function matchesCustomRequestSearch(request: CustomRequest, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const haystack = [
    request.id,
    request.customer?.name,
    request.customer?.email,
    request.customer?.phone,
    request.customer?.city,
    request.customer?.notes,
    request.product?.website,
    request.product?.description,
    request.product?.color,
    request.product?.size,
    request.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (typeof window === "undefined" || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}



export function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // enforce auth (redirects to login if no token)
  const { forceLogout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "customRequests">("products");
  const [productsView, setProductsView] = useState<"products" | "sections">("products");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productMainSection, setProductMainSection] = useState("");
  const [productChildSection, setProductChildSection] = useState("");
  const [ordersView, setOrdersView] = useState<"active" | "history">("active");
  const [activeOrdersFilter, setActiveOrdersFilter] = useState<
    "all" | "new" | "contacted" | "confirmed" | "canceled"
  >("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [customRequestsFilter, setCustomRequestsFilter] = useState<
    "all" | "new" | "contacted" | "confirmed" | "canceled"
  >("all");
  const [customRequestSearchQuery, setCustomRequestSearchQuery] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkOrderStatus, setBulkOrderStatus] = useState<"contacted" | "confirmed" | "canceled" | "completed">("contacted");
  const [analyticsRangeDays, setAnalyticsRangeDays] = useState<7 | 14 | 30>(7);
  const [ordersDateFrom, setOrdersDateFrom] = useState("");
  const [ordersDateTo, setOrdersDateTo] = useState("");
  const [ordersLastSeenAt, setOrdersLastSeenAt] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("baraa-admin-orders-last-seen") || "";
    } catch {
      return "";
    }
  });
  const [requestsLastSeenAt, setRequestsLastSeenAt] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("baraa-admin-requests-last-seen") || "";
    } catch {
      return "";
    }
  });
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [newMainCategoryName, setNewMainCategoryName] = useState("");
  const [newChildCategoryName, setNewChildCategoryName] = useState("");
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<number | "">("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [savingCategoryId, setSavingCategoryId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    // Load custom requests
    useEffect(() => {
      if (activeTab !== "customRequests") return;
      (async () => {
        try {
          const requests = await fetchProtected("/custom-requests");
          setCustomRequests(Array.isArray(requests) ? requests : []);
        } catch (err) {
          setCustomRequests([]);
        }
      })();
    }, [activeTab]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const clearOrdersDateRange = () => {
    setOrdersDateFrom("");
    setOrdersDateTo("");
  };

  useEffect(() => {
    setSelectedOrderIds([]);
  }, [ordersView, activeOrdersFilter, orderSearchQuery]);

  useEffect(() => {
    if (activeTab !== "products") return;
    setProductsView("products");
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "orders") return;
    const next = new Date().toISOString();
    setOrdersLastSeenAt(next);
    try {
      localStorage.setItem("baraa-admin-orders-last-seen", next);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    // If you're already viewing orders, treat incoming updates as seen.
    if (activeTab !== "orders") return;
    const next = new Date().toISOString();
    setOrdersLastSeenAt(next);
    try {
      localStorage.setItem("baraa-admin-orders-last-seen", next);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, orders.length]);

  useEffect(() => {
    if (activeTab !== "customRequests") return;
    const next = new Date().toISOString();
    setRequestsLastSeenAt(next);
    try {
      localStorage.setItem("baraa-admin-requests-last-seen", next);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    const activeIds = new Set(orders.map((order) => order.id));
    setSelectedOrderIds((current) => current.filter((id) => activeIds.has(id)));
  }, [orders]);

  useEffect(() => {
    // Try to load products from protected backend first.
    (async () => {
      setLoadingProducts(true);
      try {
        // expects server route GET /admin-api/protected/products
        const serverProducts = await fetchProtected("/products");
        if (Array.isArray(serverProducts)) {
          setProducts(serverProducts);
          // keep a local cache for offline/dev fallback
          try {
            localStorage.setItem("baraa-products", JSON.stringify(serverProducts));
          } catch {}
        } else {
          throw new Error("Invalid products response");
        }
      } catch (err: any) {
        // If protected fetch fails (no endpoint or offline), fallback to localStorage/defaults
        console.warn("Failed to load products from server, falling back to local data:", err?.message || err);
        const savedProducts = localStorage.getItem("baraa-products");
        if (savedProducts) {
          try {
            setProducts(JSON.parse(savedProducts));
          } catch {
            setProducts([]);
          }
        } else {
          const allProducts = [...curatedProducts, ...handmadeProducts];
          setProducts(allProducts);
          try {
            localStorage.setItem("baraa-products", JSON.stringify(allProducts));
          } catch {}
        }
      } finally {
        setLoadingProducts(false);
      }
    })();

    // Load orders from protected backend first
    (async () => {
      setLoadingOrders(true);
      try {
        const [serverOrders, serverOrderHistory] = await Promise.all([
          fetchProtected("/orders"),
          fetchProtected("/orders-history"),
        ]);

        if (Array.isArray(serverOrders) && Array.isArray(serverOrderHistory)) {
          const normalizedOrders = serverOrders.map(normalizeOrder);
          const normalizedHistory = serverOrderHistory.map(normalizeOrder);
          setOrders(normalizedOrders);
          setOrderHistory(normalizedHistory);
          try {
            localStorage.setItem("baraa-orders", JSON.stringify(normalizedOrders));
            localStorage.setItem("baraa-order-history", JSON.stringify(normalizedHistory));
          } catch {}
        } else {
          throw new Error("Invalid orders response");
        }
      } catch (err: any) {
        console.warn("Failed to load orders from server, falling back to local data:", err?.message || err);
        const savedOrders = localStorage.getItem("baraa-orders");
        const savedOrderHistory = localStorage.getItem("baraa-order-history");
        if (savedOrders) {
          try {
            setOrders(JSON.parse(savedOrders).map(normalizeOrder));
          } catch {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
        if (savedOrderHistory) {
          try {
            setOrderHistory(JSON.parse(savedOrderHistory).map(normalizeOrder));
          } catch {
            setOrderHistory([]);
          }
        } else {
          setOrderHistory([]);
        }
      } finally {
        setLoadingOrders(false);
      }
    })();

    (async () => {
      try {
        const serverCategories = await fetchProtected("/categories");
        setCategories(Array.isArray(serverCategories) ? serverCategories : []);
      } catch (err) {
        console.warn("Failed to load categories from server:", err);
        setCategories([]);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    // prefer the centralized logout
    forceLogout();
  };

  const handleUpdateOrder = async (orderId: string, updates: Pick<Order, "status" | "notes">) => {
    try {
      const response = await fetchProtected(`/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      const normalized = normalizeOrder(response?.order ?? response);
      const movedToHistory = Boolean(response?.movedToHistory);

      if (movedToHistory) {
        const updatedOrders = orders.filter((order) => order.id !== orderId);
        const updatedHistory = [normalized, ...orderHistory.filter((order) => order.id !== orderId)];
        setOrders(updatedOrders);
        setOrderHistory(updatedHistory);
        localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
        localStorage.setItem("baraa-order-history", JSON.stringify(updatedHistory));
        return;
      }

      const updatedOrders = orders.map((order) => (order.id === orderId ? normalized : order));
      setOrders(updatedOrders);
      localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
    } catch (err) {
      console.warn("Server order update failed, updating locally:", err);
      const normalizedStatus = String(updates.status || "").toLowerCase();

      if (normalizedStatus === "completed") {
        const completedOrder = orders.find((order) => order.id === orderId);
        if (!completedOrder) return;

        const movedOrder = {
          ...completedOrder,
          ...updates,
        };
        const updatedOrders = orders.filter((order) => order.id !== orderId);
        const updatedHistory = [movedOrder, ...orderHistory.filter((order) => order.id !== orderId)];
        setOrders(updatedOrders);
        setOrderHistory(updatedHistory);
        localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
        localStorage.setItem("baraa-order-history", JSON.stringify(updatedHistory));
        return;
      }

      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, ...updates } : order));
      setOrders(updatedOrders);
      localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
    }
  };

  const handleDeleteOrder = async (orderId: string, source: "active" | "history") => {
    const isHistory = source === "history";
    const confirmed = window.confirm(
      isHistory
        ? "Are you sure you want to delete this order from history?"
        : "Are you sure you want to delete this active order?",
    );

    if (!confirmed) return;

    try {
      await fetchProtected(isHistory ? `/orders-history/${orderId}` : `/orders/${orderId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Server order delete failed, deleting locally:", err);
    }

    if (isHistory) {
      const updatedHistory = orderHistory.filter((order) => order.id !== orderId);
      setOrderHistory(updatedHistory);
      localStorage.setItem("baraa-order-history", JSON.stringify(updatedHistory));
      return;
    }

    const updatedOrders = orders.filter((order) => order.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
  };

  const handleBulkUpdateOrders = async () => {
    if (selectedOrderIds.length === 0) return;

    const selectedIdSet = new Set(selectedOrderIds);
    const activeSelectedOrders = orders.filter((order) => selectedIdSet.has(order.id));
    if (activeSelectedOrders.length === 0) return;

    const confirmed = window.confirm(
      `Apply "${getStatusLabel(bulkOrderStatus)}" to ${activeSelectedOrders.length} selected order${activeSelectedOrders.length === 1 ? "" : "s"}?`,
    );
    if (!confirmed) return;

    const nextTimestamp = new Date().toISOString();

    try {
      await Promise.all(
        activeSelectedOrders.map((order) =>
          fetchProtected(`/orders/${order.id}`, {
            method: "PUT",
            body: JSON.stringify({
              status: bulkOrderStatus,
              notes: order.notes || "",
            }),
          }),
        ),
      );
    } catch (err) {
      console.warn("Bulk order update partially failed, applying local fallback:", err);
    }

    if (bulkOrderStatus === "completed") {
      const completedOrders = activeSelectedOrders.map((order) =>
        normalizeOrder({ ...order, status: "completed", updatedAt: nextTimestamp }),
      );
      const updatedOrders = orders.filter((order) => !selectedIdSet.has(order.id));
      const updatedHistory = [
        ...completedOrders,
        ...orderHistory.filter((order) => !selectedIdSet.has(order.id)),
      ];
      setOrders(updatedOrders);
      setOrderHistory(updatedHistory);
      localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
      localStorage.setItem("baraa-order-history", JSON.stringify(updatedHistory));
    } else {
      const updatedOrders = orders.map((order) =>
        selectedIdSet.has(order.id)
          ? { ...order, status: bulkOrderStatus, updatedAt: nextTimestamp }
          : order,
      );
      setOrders(updatedOrders);
      localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
    }

    setSelectedOrderIds([]);
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;

    const selectedIdSet = new Set(selectedOrderIds);
    const selectedOrders = orders.filter((order) => selectedIdSet.has(order.id));
    if (selectedOrders.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedOrders.length} selected active order${selectedOrders.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedOrders.map((order) =>
          fetchProtected(`/orders/${order.id}`, {
            method: "DELETE",
          }),
        ),
      );
    } catch (err) {
      console.warn("Bulk delete failed on server, applying local fallback:", err);
    }

    const updatedOrders = orders.filter((order) => !selectedIdSet.has(order.id));
    setOrders(updatedOrders);
    localStorage.setItem("baraa-orders", JSON.stringify(updatedOrders));
    setSelectedOrderIds([]);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  };

  const toggleSelectAllVisibleOrders = () => {
    const visibleIds = visibleActiveOrders.map((order) => order.id);
    const everyVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedOrderIds.includes(id));

    setSelectedOrderIds((current) => {
      if (everyVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  };

  const handleSaveOrderNotes = async (orderId: string, notes: string) => {
    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder) return;
    await handleUpdateOrder(orderId, {
      status: currentOrder.status || "new",
      notes,
    });
  };

  const handleSaveCustomRequestNotes = async (requestId: string, adminNotes: string) => {
    const currentRequest = customRequests.find((request) => request.id === requestId);
    if (!currentRequest) return;
    await handleUpdateCustomRequest(requestId, {
      status: currentRequest.status || "new",
      adminNotes,
    });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    // Try server delete first (if endpoint exists)
    try {
      // expects server route DELETE /admin-api/protected/products/:id
      await fetchProtected(`/products/${id}`, { method: "DELETE" });
      // refresh products from server
      try {
        const serverProducts = await fetchProtected("/products");
        setProducts(serverProducts);
        localStorage.setItem("baraa-products", JSON.stringify(serverProducts));
      } catch {
        // if refresh fails, remove locally
        const updated = products.filter((p) => p.id !== id);
        setProducts(updated);
        localStorage.setItem("baraa-products", JSON.stringify(updated));
      }
      return;
    } catch (err) {
      // fallback to local deletion
      console.warn("Server delete failed, deleting locally:", err);
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      try {
        localStorage.setItem("baraa-products", JSON.stringify(updated));
      } catch {}
    }
  };

  const handleCreateCategory = async (payload: { name: string; parentId?: number | null }) => {
    try {
      const createdCategory = await fetchProtected("/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCategories((current) => [...current, createdCategory]);
    } catch (err: any) {
      window.alert(err?.message || "Could not create the section right now.");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this section?");
    if (!confirmed) return;

    try {
      await fetchProtected(`/categories/${categoryId}`, {
        method: "DELETE",
      });
      setCategories((current) => current.filter((category) => category.id !== categoryId));
    } catch (err: any) {
      window.alert(err?.message || "Could not delete this section.");
    }
  };

  const handleRenameCategory = async (categoryId: number, nextName: string) => {
    const trimmedName = String(nextName || "").trim();
    if (!trimmedName) return;

    const existingCategory = categories.find((category) => category.id === categoryId);
    if (!existingCategory) return;

    const previousName = String(existingCategory.name || "").trim();
    const parentId = existingCategory.parentId ?? null;
    const parentName =
      parentId == null ? "" : String(categories.find((category) => category.id === parentId)?.name || "");

    setSavingCategoryId(categoryId);
    try {
      const updated = await fetchProtected(`/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify({ name: trimmedName }),
      });

      const updatedName = String(updated?.name || trimmedName);
      setCategories((current) =>
        current.map((category) =>
          category.id === categoryId ? { ...category, name: updatedName, slug: updated?.slug || category.slug } : category,
        ),
      );

      setProducts((current) => {
        const nextProducts =
          parentId == null
            ? current.map((product) => (String(product.category || "") === previousName ? { ...product, category: updatedName } : product))
            : current.map((product) => {
                if (String(product.category || "") !== parentName) return product;
                if (String(product.subcategory || "") !== previousName) return product;
                return { ...product, subcategory: updatedName };
              });

        try {
          localStorage.setItem("baraa-products", JSON.stringify(nextProducts));
        } catch {}

        return nextProducts;
      });

      if (parentId == null) {
        if (productMainSection === previousName) setProductMainSection(updatedName);
      } else {
        if (productMainSection === parentName && productChildSection === previousName) setProductChildSection(updatedName);
      }
    } catch (err: any) {
      window.alert(err?.message || "Could not update this section.");
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleUpdateCustomRequest = async (
    requestId: string,
    updates: Pick<CustomRequest, "status" | "adminNotes">,
  ) => {
    try {
      const updatedRequest = await fetchProtected(`/custom-requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const nextRequests = customRequests.map((request) =>
        request.id === requestId ? updatedRequest : request,
      );
      setCustomRequests(nextRequests);
    } catch (err) {
      console.warn("Server custom request update failed, updating locally:", err);
      const nextRequests = customRequests.map((request) =>
        request.id === requestId ? { ...request, ...updates } : request,
      );
      setCustomRequests(nextRequests);
    }
  };

  const handleDeleteCustomRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to delete this custom request?")) return;

    try {
      await fetchProtected(`/custom-requests/${requestId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Server custom request delete failed, deleting locally:", err);
    }

    setCustomRequests(customRequests.filter((request) => request.id !== requestId));
  };

  const handleSaveProduct = async (productFormData: FormData) => {
    const rawPayload = productFormData.get("payload");
    const parsedPayload =
      typeof rawPayload === "string"
        ? JSON.parse(rawPayload)
        : {
            name: "",
            price: 0,
            image: "",
            category: "",
            subcategory: "",
            description: "",
            images: [],
            details: {},
          };
    // If editingProduct exists -> update, else create
    if (editingProduct) {
      // Try server update (PUT)
      try {
        // expects server route PUT /admin-api/protected/products/:id
        await fetchProtected(`/products/${editingProduct.id}`, {
          method: "PUT",
          body: productFormData,
        });
        // refresh from server
        try {
          const serverProducts = await fetchProtected("/products");
          setProducts(serverProducts);
          localStorage.setItem("baraa-products", JSON.stringify(serverProducts));
        } catch {
          // fallback to local update
          const updatedProduct = {
            ...editingProduct,
            ...parsedPayload,
            image: parsedPayload.images?.[parsedPayload.mainImageIndex || 0] || parsedPayload.images?.[0] || editingProduct.image,
            images: Array.isArray(parsedPayload.images) ? parsedPayload.images : editingProduct.images,
          };
          const updated = products.map((p) => (p.id === editingProduct.id ? updatedProduct : p));
          setProducts(updated);
          localStorage.setItem("baraa-products", JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Server update failed, updating locally:", err);
        const updatedProduct = {
          ...editingProduct,
          ...parsedPayload,
          image: parsedPayload.images?.[parsedPayload.mainImageIndex || 0] || parsedPayload.images?.[0] || editingProduct.image,
          images: Array.isArray(parsedPayload.images) ? parsedPayload.images : editingProduct.images,
        };
        const updated = products.map((p) => (p.id === editingProduct.id ? updatedProduct : p));
        setProducts(updated);
        try {
          localStorage.setItem("baraa-products", JSON.stringify(updated));
        } catch {}
      }
    } else {
      // Create new product
      try {
        // expects server route POST /admin-api/protected/products
        const created = await fetchProtected("/products", {
          method: "POST",
          body: productFormData,
        });
        // If server returns created product, refresh or append
        if (created && created.id) {
          try {
            const serverProducts = await fetchProtected("/products");
            setProducts(serverProducts);
            localStorage.setItem("baraa-products", JSON.stringify(serverProducts));
          } catch {
            // append locally if refresh fails
            const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
            const appended = [
              ...products,
              {
                ...parsedPayload,
                id: newId,
                image: parsedPayload.images?.[parsedPayload.mainImageIndex || 0] || parsedPayload.images?.[0] || "",
                images: Array.isArray(parsedPayload.images) ? parsedPayload.images : [],
              },
            ];
            setProducts(appended);
            localStorage.setItem("baraa-products", JSON.stringify(appended));
          }
        } else {
          // server didn't return created object; fallback to local
          const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
          const appended = [
            ...products,
            {
              ...parsedPayload,
              id: newId,
              image: parsedPayload.images?.[parsedPayload.mainImageIndex || 0] || parsedPayload.images?.[0] || "",
              images: Array.isArray(parsedPayload.images) ? parsedPayload.images : [],
            },
          ];
          setProducts(appended);
          localStorage.setItem("baraa-products", JSON.stringify(appended));
        }
      } catch (err) {
        console.warn("Server create failed, saving locally:", err);
        const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
        const appended = [
          ...products,
          {
            ...parsedPayload,
            id: newId,
            image: parsedPayload.images?.[parsedPayload.mainImageIndex || 0] || parsedPayload.images?.[0] || "",
            images: Array.isArray(parsedPayload.images) ? parsedPayload.images : [],
          },
        ];
        setProducts(appended);
        try {
          localStorage.setItem("baraa-products", JSON.stringify(appended));
        } catch {}
      }
    }

    setEditingProduct(null);
    setShowProductForm(false);
  };

  const filteredActiveOrders = orders.filter((order) => {
    if (activeOrdersFilter === "all") return true;
    return String(order.status || "new").toLowerCase() === activeOrdersFilter;
  });

  const filteredOrdersBySearch = (ordersToFilter: Order[]) =>
    ordersToFilter.filter((order) => matchesOrderSearch(order, orderSearchQuery));

  const orderDateRange = useMemo(() => {
    const parsedStart = ordersDateFrom ? parseDateInput(ordersDateFrom) : null;
    const parsedEnd = ordersDateTo ? parseDateInput(ordersDateTo) : null;

    const start = parsedStart ? startOfDay(parsedStart) : null;
    const end = parsedEnd ? endOfDay(parsedEnd) : null;

    const labelParts: string[] = [];
    if (ordersDateFrom) labelParts.push(`From ${ordersDateFrom}`);
    if (ordersDateTo) labelParts.push(`To ${ordersDateTo}`);
    const label = labelParts.length ? labelParts.join(" ") : "";

    return { start, end, label };
  }, [ordersDateFrom, ordersDateTo]);

  const filteredOrdersByDate = (ordersToFilter: Order[]) => {
    if (!orderDateRange.start && !orderDateRange.end) return ordersToFilter;

    return ordersToFilter.filter((order) => {
      const orderDate = getOrderDateValue(order);
      if (!orderDate) return false;
      return isDateWithinRange(orderDate, orderDateRange.start, orderDateRange.end);
    });
  };

  const visibleActiveOrders = filteredOrdersBySearch(filteredOrdersByDate(filteredActiveOrders));
  const visibleOrderHistory = filteredOrdersBySearch(filteredOrdersByDate(orderHistory));

  const filteredCustomRequests = customRequests.filter((request) => {
    if (customRequestsFilter === "all") return true;
    return String(request.status || "new").toLowerCase() === customRequestsFilter;
  });

  const visibleCustomRequests = filteredCustomRequests.filter((request) =>
    matchesCustomRequestSearch(request, customRequestSearchQuery),
  );

  const orderMetrics = useMemo(() => {
    const activeRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const historyRevenue = orderHistory.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      activeCount: orders.length,
      historyCount: orderHistory.length,
      newCount: orders.filter((order) => String(order.status || "new").toLowerCase() === "new").length,
      confirmedCount: orders.filter((order) => String(order.status || "").toLowerCase() === "confirmed").length,
      activeRevenue,
      historyRevenue,
    };
  }, [orders, orderHistory]);

  const unseenNewOrdersCount = useMemo(() => {
    if (activeTab === "orders") return 0;

    const seenAt = ordersLastSeenAt ? new Date(ordersLastSeenAt) : null;
    const validSeenAt = seenAt && !Number.isNaN(seenAt.getTime()) ? seenAt : null;

    return orders.filter((order) => {
      const status = String(order.status || "new").toLowerCase();
      if (status !== "new") return false;
      if (!validSeenAt) return true;

      const orderDate = getOrderDateValue(order);
      if (!orderDate) return true;
      return orderDate > validSeenAt;
    }).length;
  }, [activeTab, orders, ordersLastSeenAt]);

  const unseenNewRequestsCount = useMemo(() => {
    if (activeTab === "customRequests") return 0;

    const seenAt = requestsLastSeenAt ? new Date(requestsLastSeenAt) : null;
    const validSeenAt = seenAt && !Number.isNaN(seenAt.getTime()) ? seenAt : null;

    return customRequests.filter((request) => {
      const status = String(request.status || "new").toLowerCase();
      if (status !== "new") return false;
      if (!validSeenAt) return true;

      const source = request.createdAt || request.updatedAt || "";
      const parsed = source ? new Date(source) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) return true;
      return parsed > validSeenAt;
    }).length;
  }, [activeTab, customRequests, requestsLastSeenAt]);

  const customRequestMetrics = useMemo(
    () => ({
      total: customRequests.length,
      newCount: customRequests.filter((request) => String(request.status || "new").toLowerCase() === "new").length,
      contactedCount: customRequests.filter((request) => String(request.status || "").toLowerCase() === "contacted").length,
      confirmedCount: customRequests.filter((request) => String(request.status || "").toLowerCase() === "confirmed").length,
    }),
    [customRequests],
  );

  const mainCategories = useMemo(
    () => categories.filter((category) => category.parentId == null),
    [categories],
  );

  const categoriesTree = useMemo(
    () =>
      mainCategories.map((category) => ({
        ...category,
        children: categories.filter((child) => child.parentId === category.id),
      })),
    [categories, mainCategories],
  );

  const productCountsBySection = useMemo(() => {
    const mainCounts = new Map<string, number>();
    const childCounts = new Map<string, Map<string, number>>();
    const noChildCounts = new Map<string, number>();

    for (const product of products) {
      const main = String(product.category || "").trim();
      if (!main) continue;

      mainCounts.set(main, (mainCounts.get(main) || 0) + 1);

      const childRaw = String(product.subcategory || "").trim();
      if (!childRaw) {
        noChildCounts.set(main, (noChildCounts.get(main) || 0) + 1);
        continue;
      }

      if (!childCounts.has(main)) childCounts.set(main, new Map());
      const inner = childCounts.get(main)!;
      inner.set(childRaw, (inner.get(childRaw) || 0) + 1);
    }

    return { mainCounts, childCounts, noChildCounts };
  }, [products]);

  const displaySections = useMemo(() => {
    const namesFromTree = categoriesTree.map((category) => String(category.name || "").trim()).filter(Boolean);
    const namesFromProducts = products.map((product) => String(product.category || "").trim()).filter(Boolean);
    const allNames = Array.from(new Set([...namesFromTree, ...namesFromProducts])).sort((a, b) => a.localeCompare(b));

    return allNames.map((name) => {
      const treeCategory = categoriesTree.find((category) => category.name === name);
      const childrenFromTree = Array.isArray(treeCategory?.children) ? treeCategory!.children.map((child) => child.name) : [];
      const childrenFromProducts = products
        .filter((product) => String(product.category || "").trim() === name)
        .map((product) => String(product.subcategory || "").trim())
        .filter(Boolean);
      const children = Array.from(new Set([...childrenFromTree, ...childrenFromProducts])).sort((a, b) => a.localeCompare(b));

      return { name, children };
    });
  }, [categoriesTree, products]);

  const visibleProducts = useMemo(() => {
    const query = normalizeSearchValue(productSearchQuery);
    const main = String(productMainSection || "").trim();
    const child = String(productChildSection || "").trim();

    return products.filter((product) => {
      if (main && String(product.category || "").trim() !== main) return false;

      if (child) {
        if (child === "__none__") {
          return !String(product.subcategory || "").trim();
        }
        if (String(product.subcategory || "").trim() !== child) return false;
      }

      if (!query) return true;
      return normalizeSearchValue(product.name || "").includes(query);
    });
  }, [productChildSection, productMainSection, productSearchQuery, products]);

  const analytics = useMemo(() => {
    const allOrders = [...orders, ...orderHistory];

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    let rangeStart = orderDateRange.start;
    let rangeEnd = orderDateRange.end;

    // If only an end date is provided, show a window ending at that date using the preset day count.
    if (!rangeStart && rangeEnd) {
      const start = startOfDay(rangeEnd);
      start.setDate(start.getDate() - (analyticsRangeDays - 1));
      rangeStart = start;
    }

    // If only a start date is provided, end at today.
    if (rangeStart && !rangeEnd) {
      rangeEnd = todayEnd;
    }

    // Default to preset window.
    if (!rangeStart && !rangeEnd) {
      const start = startOfDay(todayStart);
      start.setDate(start.getDate() - (analyticsRangeDays - 1));
      rangeStart = start;
      rangeEnd = todayEnd;
    }

    // Guard: cap chart windows to 366 days to keep the UI responsive.
    if (rangeStart && rangeEnd) {
      const maxDays = 366;
      const diffDays = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      if (diffDays > maxDays) {
        const cappedStart = startOfDay(rangeEnd);
        cappedStart.setDate(cappedStart.getDate() - (maxDays - 1));
        rangeStart = cappedStart;
      }
    }

    const dailySalesMap = new Map<string, { label: string; revenue: number; orders: number }>();
    if (rangeStart && rangeEnd) {
      const cursor = startOfDay(rangeStart);
      const finalDay = startOfDay(rangeEnd);
      const diffDays = Math.floor((finalDay.getTime() - cursor.getTime()) / (24 * 60 * 60 * 1000)) + 1;

      while (cursor <= finalDay) {
        const key = cursor.toISOString().slice(0, 10);
        dailySalesMap.set(key, {
          label:
            diffDays <= 7
              ? cursor.toLocaleDateString(undefined, { weekday: "short" })
              : cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          revenue: 0,
          orders: 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const topProductsMap = new Map<string, { name: string; units: number; revenue: number }>();

    const ordersInRange = allOrders.filter((order) => {
      const orderDate = getOrderDateValue(order);
      if (!orderDate) return false;
      return isDateWithinRange(orderDate, rangeStart, rangeEnd);
    });

    const totalRevenue = ordersInRange.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averageOrderValue = ordersInRange.length ? totalRevenue / ordersInRange.length : 0;

    ordersInRange.forEach((order) => {
      const orderDate = getOrderDateValue(order);
      if (orderDate) {
        const key = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
          .toISOString()
          .slice(0, 10);
        const existingDay = dailySalesMap.get(key);
        if (existingDay) {
          existingDay.revenue += Number(order.total || 0);
          existingDay.orders += 1;
        }
      }

      order.items.forEach((item) => {
        const itemName = String(item?.name || "Unnamed product");
        const existingProduct = topProductsMap.get(itemName) || { name: itemName, units: 0, revenue: 0 };
        existingProduct.units += Number(item?.quantity || 1);
        existingProduct.revenue += Number(item?.price || 0) * Number(item?.quantity || 1);
        topProductsMap.set(itemName, existingProduct);
      });
    });

    return {
      totalRevenue,
      averageOrderValue,
      totalOrders: ordersInRange.length,
      dailySales: Array.from(dailySalesMap.values()),
      topProducts: Array.from(topProductsMap.values())
        .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
        .slice(0, 5),
    };
  }, [analyticsRangeDays, orderDateRange.end, orderDateRange.start, orders, orderHistory]);

  const todayQueue = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return orders.filter((order) => {
      const status = String(order.status || "new").toLowerCase();
      if (status !== "new" && status !== "contacted") return false;

      const orderDate = getOrderDateValue(order);
      return Boolean(orderDate && orderDate >= startOfToday);
    });
  }, [orders]);

  const exportOrders = (source: Order[], filename: string) => {
    downloadCsv(
      filename,
      source.map((order) => ({
        id: order.id,
        status: getStatusLabel(order.status),
        createdAt: formatDateTime(order.createdAt || order.date),
        customerName: order.customer?.name || "",
        email: order.customer?.email || "",
        phone: order.customer?.phone || "",
        city: order.customer?.city || "",
        total: Number(order.total || 0).toFixed(2),
        paymentMethod: order.paymentMethod || "",
        items: order.items.map((item) => `${item?.name || "Item"} x${item?.quantity || 1}`).join(" | "),
        notes: order.notes || "",
      })),
    );
  };

  const printOrdersReport = (source: Order[], title: string) => {
    const totalRevenue = source.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averageOrder = source.length ? totalRevenue / source.length : 0;
    const rangeLabel = orderDateRange.label ? ` (${orderDateRange.label})` : "";

    const rows = source
      .map((order) => {
        const items = Array.isArray(order.items)
          ? order.items
              .map((item) => `${String(item?.name || "Item")} x${Number(item?.quantity || 1)}`)
              .join(" | ")
          : "";

        return `
          <tr>
            <td>${escapeHtml(order.id)}</td>
            <td>${escapeHtml(formatDateTime(order.createdAt || order.date))}</td>
            <td>${escapeHtml(getStatusLabel(order.status))}</td>
            <td>${escapeHtml(order.customer?.name || "")}</td>
            <td>${escapeHtml(order.customer?.phone || "")}</td>
            <td>${escapeHtml(order.customer?.city || "")}</td>
            <td>${escapeHtml(order.paymentMethod || "")}</td>
            <td style="text-align:right;">${escapeHtml(formatCurrency(Number(order.total || 0)))}</td>
            <td>${escapeHtml(items)}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}${escapeHtml(rangeLabel)}</title>
          <style>
            :root { color-scheme: light; }
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #111; }
            h1 { font-size: 18px; margin: 0 0 6px; }
            .meta { font-size: 12px; color: #444; margin-bottom: 14px; }
            .kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 12px 0 18px; }
            .kpi { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
            .kpi .label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: .12em; }
            .kpi .value { margin-top: 6px; font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; vertical-align: top; }
            th { background: #f5f5f5; text-align: left; }
            @media print {
              body { margin: 0.5in; }
              .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}${escapeHtml(rangeLabel)}</h1>
          <div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
          <div class="kpis">
            <div class="kpi"><div class="label">Total Orders</div><div class="value">${escapeHtml(String(source.length))}</div></div>
            <div class="kpi"><div class="label">Total Revenue</div><div class="value">${escapeHtml(formatCurrency(totalRevenue))}</div></div>
            <div class="kpi"><div class="label">Average Order</div><div class="value">${escapeHtml(formatCurrency(averageOrder))}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              ${rows || ""}
            </tbody>
          </table>
          <script>
            window.addEventListener('load', () => {
              window.focus();
              setTimeout(() => window.print(), 250);
            });
          </script>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      window.alert("Pop-up blocked. Please allow pop-ups to print or save as PDF.");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const exportCustomRequests = () => {
    downloadCsv(
      "custom-requests.csv",
      visibleCustomRequests.map((request) => ({
        id: request.id,
        status: getStatusLabel(request.status),
        createdAt: formatDateTime(request.createdAt),
        customerName: request.customer?.name || "",
        email: request.customer?.email || "",
        phone: request.customer?.phone || "",
        city: request.customer?.city || "",
        website: request.product?.website || "",
        description: request.product?.description || "",
        quantity: Number(request.product?.quantity || 1),
        adminNotes: request.adminNotes || "",
      })),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 600 }}>
              {t("admin.dashboard")}
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>{t("admin.logout")}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === "products" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Package className="w-5 h-5" />
              <span>{t("admin.products")}</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{t("admin.orders")}</span>
              {unseenNewOrdersCount > 0 && (
                <span className="px-2 py-1 bg-secondary text-white rounded-full text-xs">{unseenNewOrdersCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("customRequests")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === "customRequests" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <span>{t("admin.customRequests")}</span>
              {unseenNewRequestsCount > 0 && (
                <span className="px-2 py-1 bg-secondary text-white rounded-full text-xs">{unseenNewRequestsCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "products" ? (
          <AdminProductsPanel
            products={products}
            categories={categoriesTree}
            mainCategories={mainCategories}
            categoriesTree={categoriesTree}
            displaySections={displaySections}
            productCountsBySection={productCountsBySection}
            visibleProducts={visibleProducts}
            productSearchQuery={productSearchQuery}
            setProductSearchQuery={setProductSearchQuery}
            productMainSection={productMainSection}
            setProductMainSection={setProductMainSection}
            productChildSection={productChildSection}
            setProductChildSection={setProductChildSection}
            newMainCategoryName={newMainCategoryName}
            setNewMainCategoryName={setNewMainCategoryName}
            newChildCategoryName={newChildCategoryName}
            setNewChildCategoryName={setNewChildCategoryName}
            selectedParentCategoryId={selectedParentCategoryId}
            setSelectedParentCategoryId={setSelectedParentCategoryId}
            editingCategoryId={editingCategoryId}
            setEditingCategoryId={setEditingCategoryId}
            editingCategoryName={editingCategoryName}
            setEditingCategoryName={setEditingCategoryName}
            savingCategoryId={savingCategoryId}
            productsView={productsView}
            setProductsView={setProductsView}
            onAddProduct={() => { setEditingProduct(null); setShowProductForm(true); }}
            onEditProduct={(product) => { setEditingProduct(product); setShowProductForm(true); }}
            onDeleteProduct={handleDeleteProduct}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDeleteCategory}
            onRenameCategory={handleRenameCategory}
          />
        ) : activeTab === "orders" ? (
          <AdminOrdersPanel
            orders={orders}
            orderHistory={orderHistory}
            visibleActiveOrders={visibleActiveOrders}
            visibleOrderHistory={visibleOrderHistory}
            ordersView={ordersView}
            setOrdersView={setOrdersView}
            activeOrdersFilter={activeOrdersFilter}
            setActiveOrdersFilter={setActiveOrdersFilter}
            orderSearchQuery={orderSearchQuery}
            setOrderSearchQuery={setOrderSearchQuery}
            ordersDateFrom={ordersDateFrom}
            setOrdersDateFrom={setOrdersDateFrom}
            ordersDateTo={ordersDateTo}
            setOrdersDateTo={setOrdersDateTo}
            clearOrdersDateRange={clearOrdersDateRange}
            selectedOrderIds={selectedOrderIds}
            bulkOrderStatus={bulkOrderStatus}
            setBulkOrderStatus={setBulkOrderStatus}
            analyticsRangeDays={analyticsRangeDays}
            setAnalyticsRangeDays={setAnalyticsRangeDays}
            analytics={analytics}
            orderMetrics={orderMetrics}
            todayQueue={todayQueue}
            orderDateRange={orderDateRange}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onBulkUpdateOrders={handleBulkUpdateOrders}
            onBulkDeleteOrders={handleBulkDeleteOrders}
            toggleOrderSelection={toggleOrderSelection}
            toggleSelectAllVisibleOrders={toggleSelectAllVisibleOrders}
            onSaveOrderNotes={handleSaveOrderNotes}
            onExportOrders={exportOrders}
            onPrintOrders={printOrdersReport}
          />
        ) : (
          <AdminCustomRequestsPanel
            visibleCustomRequests={visibleCustomRequests}
            customRequestsFilter={customRequestsFilter}
            setCustomRequestsFilter={setCustomRequestsFilter}
            customRequestSearchQuery={customRequestSearchQuery}
            setCustomRequestSearchQuery={setCustomRequestSearchQuery}
            customRequestMetrics={customRequestMetrics}
            onUpdateCustomRequest={handleUpdateCustomRequest}
            onDeleteCustomRequest={handleDeleteCustomRequest}
            onSaveCustomRequestNotes={handleSaveCustomRequestNotes}
            onExportCustomRequests={exportCustomRequests}
          />
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categoriesTree}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
