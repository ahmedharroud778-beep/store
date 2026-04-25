import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft, PackageCheck, Search, Sparkles } from "lucide-react";
import { apiJson } from "../../utils/api";
import { useLanguage } from "../contexts/LanguageContext";
import { ThemeToggle } from "../components/ThemeToggle";

type TrackMode = "order" | "request";

interface TrackedOrder {
  id: string;
  date?: string;
  createdAt?: string;
  status?: string;
  notes?: string;
  total?: number;
  paymentMethod?: string;
  items?: Array<{
    id?: string | number;
    name?: string;
    price?: number;
    quantity?: number;
    image?: string;
    size?: string;
    color?: string;
  }>;
  customer?: {
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
}

interface TrackedRequest {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  adminNotes?: string;
  customer?: {
    name?: string;
    phone?: string;
    city?: string;
    notes?: string;
  };
  product?: {
    website?: string;
    description?: string;
    size?: string;
    color?: string;
    quantity?: number;
    productLink?: string;
  };
  images?: string[];
}

function normalizeLookupId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const digitMatches = trimmed.match(/\d+/g);
  if (digitMatches?.length) {
    return digitMatches.join("");
  }

  return trimmed.replace(/^order\s*id[:#-]?\s*/i, "").replace(/^request\s*id[:#-]?\s*/i, "").trim();
}

function readStoredOrders() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("baraa-orders");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as TrackedOrder[]) : [];
  } catch {
    return [];
  }
}

function findStoredOrder(orderId: string) {
  return readStoredOrders().find((item) => normalizeLookupId(String(item?.id || "")) === orderId) || null;
}

function formatStatus(status?: string) {
  const normalized = String(status || "new").toLowerCase();
  if (normalized === "contacted") return "Contacted";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "completed") return "Completed";
  if (normalized === "canceled") return "Canceled";
  return "New";
}

function getInitialMode(pathname: string, search: string): TrackMode {
  const params = new URLSearchParams(search);
  if (params.get("type") === "request") return "request";
  if (pathname.includes("request")) return "request";
  return "order";
}

export function Track() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<TrackMode>(() => getInitialMode(location.pathname, location.search));
  const [lookupId, setLookupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [request, setRequest] = useState<TrackedRequest | null>(null);

  const statusLabel = useMemo(
    () => formatStatus(mode === "order" ? order?.status : request?.status),
    [mode, order?.status, request?.status],
  );

  const isOrderMode = mode === "order";

  const handleModeChange = (nextMode: TrackMode) => {
    setMode(nextMode);
    setLookupId("");
    setError("");
    setOrder(null);
    setRequest(null);
    navigate(nextMode === "order" ? "/track" : "/track?type=request", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedId = normalizeLookupId(lookupId);
    if (!normalizedId) {
      setError(isOrderMode ? "Please enter your order ID." : "Please enter your custom request ID.");
      setOrder(null);
      setRequest(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isOrderMode) {
        const result = await apiJson<TrackedOrder>(`/api/orders/${encodeURIComponent(normalizedId)}`);
        setOrder(result);
        setRequest(null);
      } else {
        const result = await apiJson<TrackedRequest>(`/api/custom-requests/${encodeURIComponent(normalizedId)}`);
        setRequest(result);
        setOrder(null);
      }
    } catch (err: any) {
      setOrder(null);
      setRequest(null);

      if (isOrderMode) {
        const storedOrder = findStoredOrder(normalizedId);
        if (storedOrder) {
          setOrder(storedOrder);
          setError("");
          return;
        }
      }

      if (err?.status === 404) {
        setError(
          isOrderMode
            ? "We couldn't find an order with that ID."
            : "We couldn't find a custom request with that ID.",
        );
      } else {
        setError(
          isOrderMode
            ? "Could not check the order right now."
            : "Could not check the custom request right now.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>{t("common.back")}</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            {isOrderMode ? <PackageCheck className="w-8 h-8 text-primary" /> : <Sparkles className="w-8 h-8 text-secondary" />}
          </div>
          <h1 className="mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700 }}>
            {isOrderMode ? t("track.title") : t("trackRequest.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isOrderMode ? t("track.subtitle") : t("trackRequest.subtitle")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 bg-muted p-1 rounded-xl mb-6 w-fit">
            <button
              type="button"
              onClick={() => handleModeChange("order")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${isOrderMode ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {t("menu.track")}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("request")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${!isOrderMode ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {t("menu.trackRequest")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder={isOrderMode ? t("track.placeholder") : t("trackRequest.placeholder")}
                className="w-full pl-12 pr-4 py-3 bg-input-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-60"
            >
              {loading ? t("track.searching") : t("track.search")}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          {isOrderMode && order && (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl bg-muted/40 border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("track.status")}</p>
                    <p className="text-lg font-semibold">{statusLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("track.total")}</p>
                    <p className="text-lg font-semibold">${Number(order.total || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-5">
                  <h2 className="mb-3 font-medium">{t("track.orderDetails")}</h2>
                  <p className="text-sm text-muted-foreground">{t("track.placedOn")}: {order.date || order.createdAt || "-"}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t("track.payment")}: {order.paymentMethod || "-"}</p>
                  {order.notes ? <p className="text-sm text-muted-foreground mt-2">{t("track.notes")}: {order.notes}</p> : null}
                </div>
                <div className="rounded-xl border border-border p-5">
                  <h2 className="mb-3 font-medium">{t("track.delivery")}</h2>
                  <p className="text-sm text-muted-foreground">{order.customer?.name || "-"}</p>
                  <p className="text-sm text-muted-foreground mt-2">{order.customer?.phone || "-"}</p>
                  {order.customer?.city ? <p className="text-sm text-muted-foreground mt-2">{order.customer.city}</p> : null}
                  {order.customer?.address ? <p className="text-sm text-muted-foreground mt-2">{order.customer.address}</p> : null}
                </div>
              </div>

              <div className="rounded-xl border border-border p-5">
                <h2 className="mb-4 font-medium">{t("track.items")}</h2>
                <div className="space-y-3">
                  {(order.items || []).map((item, index) => (
                    <div key={`${item.id || item.name || "item"}-${index}`} className="flex items-center gap-3">
                      {item.image ? <img src={item.image} alt={item.name || "Order item"} className="w-14 h-14 object-cover rounded-lg" /> : <div className="w-14 h-14 rounded-lg bg-muted" />}
                      <div className="flex-1">
                        <p>{item.name || "Product"}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity || 1}
                          {item.size ? ` / Size: ${item.size}` : ""}
                          {item.color ? ` / Color: ${item.color}` : ""}
                        </p>
                      </div>
                      <p className="text-primary">${Number(item.price || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isOrderMode && request && (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl bg-muted/40 border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Request ID</p>
                    <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{request.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("track.status")}</p>
                    <p className="text-lg font-semibold">{statusLabel}</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-5">
                  <h2 className="mb-3 font-medium">{t("trackRequest.requestDetails")}</h2>
                  <p className="text-sm text-muted-foreground">{t("trackRequest.createdOn")}: {request.createdAt || "-"}</p>
                  {request.adminNotes ? <p className="text-sm text-muted-foreground mt-2">{t("track.notes")}: {request.adminNotes}</p> : null}
                </div>
                <div className="rounded-xl border border-border p-5">
                  <h2 className="mb-3 font-medium">{t("track.delivery")}</h2>
                  <p className="text-sm text-muted-foreground">{request.customer?.name || "-"}</p>
                  <p className="text-sm text-muted-foreground mt-2">{request.customer?.phone || "-"}</p>
                  {request.customer?.city ? <p className="text-sm text-muted-foreground mt-2">{request.customer.city}</p> : null}
                  {request.customer?.notes ? <p className="text-sm text-muted-foreground mt-2">{request.customer.notes}</p> : null}
                </div>
              </div>

              <div className="rounded-xl border border-border p-5">
                <h2 className="mb-4 font-medium">{t("trackRequest.productInfo")}</h2>
                <p className="text-sm text-muted-foreground">Website: {request.product?.website || "-"}</p>
                <p className="text-sm text-muted-foreground mt-2">Description: {request.product?.description || "-"}</p>
                {request.product?.size ? <p className="text-sm text-muted-foreground mt-2">Size: {request.product.size}</p> : null}
                {request.product?.color ? <p className="text-sm text-muted-foreground mt-2">Color: {request.product.color}</p> : null}
                <p className="text-sm text-muted-foreground mt-2">Quantity: {request.product?.quantity || 1}</p>
                {request.product?.productLink ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Link: <a href={request.product.productLink} target="_blank" rel="noreferrer" className="text-primary underline">{request.product.productLink}</a>
                  </p>
                ) : null}
                {Array.isArray(request.images) && request.images.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {request.images.map((image, index) => (
                      <img key={`${image}-${index}`} src={image} alt="Uploaded request" className="w-24 h-24 rounded-lg object-cover border border-border" />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
