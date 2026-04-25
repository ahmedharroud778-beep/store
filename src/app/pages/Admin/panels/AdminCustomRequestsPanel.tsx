// src/app/pages/Admin/panels/AdminCustomRequestsPanel.tsx
// Extracted from AdminDashboard.tsx – all custom requests management UI

import { ClipboardList, Package, ChartColumn, Archive, Search, Download, Trash2 } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { DebouncedNotesField } from "../components/DebouncedNotesField";

export interface CustomRequest {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  adminNotes?: string;
  images?: string[];
  customer?: {
    name?: string;
    email?: string;
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
}

interface CustomRequestMetrics {
  total: number;
  newCount: number;
  contactedCount: number;
  confirmedCount: number;
}

interface Props {
  visibleCustomRequests: CustomRequest[];
  customRequestsFilter: "all" | "new" | "contacted" | "confirmed" | "canceled";
  setCustomRequestsFilter: (v: "all" | "new" | "contacted" | "confirmed" | "canceled") => void;
  customRequestSearchQuery: string;
  setCustomRequestSearchQuery: (v: string) => void;
  customRequestMetrics: CustomRequestMetrics;
  onUpdateCustomRequest: (id: string, updates: { status: string; adminNotes: string }) => void;
  onDeleteCustomRequest: (id: string) => void;
  onSaveCustomRequestNotes: (id: string, notes: string) => void;
  onExportCustomRequests: () => void;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function getStatusBadgeClass(status?: string) {
  const n = String(status || "new").toLowerCase();
  if (n === "contacted") return "bg-sky-500/10 text-sky-700 border-sky-500/20";
  if (n === "confirmed") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (n === "completed") return "bg-secondary/10 text-secondary border-secondary/20";
  if (n === "canceled") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

function getStatusLabel(status?: string) {
  const n = String(status || "new").toLowerCase();
  if (n === "contacted") return "Contacted";
  if (n === "confirmed") return "Confirmed";
  if (n === "completed") return "Completed";
  if (n === "canceled") return "Canceled";
  return "New";
}

export function AdminCustomRequestsPanel({
  visibleCustomRequests,
  customRequestsFilter,
  setCustomRequestsFilter,
  customRequestSearchQuery,
  setCustomRequestSearchQuery,
  customRequestMetrics,
  onUpdateCustomRequest,
  onDeleteCustomRequest,
  onSaveCustomRequestNotes,
  onExportCustomRequests,
}: Props) {
  const { t } = useLanguage();

  return (
    <div>
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Total Requests", value: customRequestMetrics.total, sub: "All sourcing requests saved", Icon: ClipboardList },
          { label: "New Requests", value: customRequestMetrics.newCount, sub: "Waiting for first response", Icon: Package },
          { label: "Contacted", value: customRequestMetrics.contactedCount, sub: "Requests already in discussion", Icon: ChartColumn },
          { label: "Confirmed", value: customRequestMetrics.confirmedCount, sub: "Requests ready to source", Icon: Archive },
        ].map(({ label, value, sub, Icon }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-6" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>
        {t("admin.customRequests")} ({visibleCustomRequests.length})
      </h2>

      {/* Search + export toolbar */}
      <div className="mb-6 bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={customRequestSearchQuery}
              onChange={(e) => setCustomRequestSearchQuery(e.target.value)}
              placeholder="Search by request ID, customer, phone, city, website, or description..."
              className="w-full pl-11 pr-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="button" onClick={onExportCustomRequests}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all", "new", "contacted", "confirmed", "canceled"] as const).map((f) => (
          <button key={f} onClick={() => setCustomRequestsFilter(f)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              customRequestsFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
            }`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {visibleCustomRequests.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">
            {customRequestSearchQuery.trim()
              ? `No custom requests found for ID "${customRequestSearchQuery.trim()}"`
              : customRequestsFilter === "all"
                ? "No custom requests found."
                : `No ${customRequestsFilter} custom requests right now`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleCustomRequests.map((req) => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Request #{req.id}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(req.createdAt)}</p>
                  <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-sm ${getStatusBadgeClass(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </div>
                  <div className="mt-2">
                    <select
                      value={req.status || "new"}
                      onChange={(e) => onUpdateCustomRequest(req.id, { status: e.target.value, adminNotes: req.adminNotes || "" })}
                      className="px-3 py-2 bg-input-background rounded-lg border border-border text-sm">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={() => onDeleteCustomRequest(req.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  title="Delete custom request">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-2">Customer</h4>
                <p className="text-sm">{req.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{req.customer?.email}</p>
                <p className="text-sm text-muted-foreground">{req.customer?.phone}</p>
                {req.customer?.city && <p className="text-sm text-muted-foreground">{req.customer.city}</p>}
                {req.customer?.notes && <p className="text-sm text-muted-foreground">Notes: {req.customer.notes}</p>}
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium mb-2">Admin Notes</h4>
                <DebouncedNotesField
                  value={req.adminNotes || ""}
                  placeholder="Write notes about sourcing, follow-up, or customer updates."
                  onSave={(notes) => onSaveCustomRequestNotes(req.id, notes)}
                />
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium mb-2">Product Info</h4>
                <p className="text-sm">Website: {req.product?.website}</p>
                <p className="text-sm">Description: {req.product?.description}</p>
                <p className="text-sm">Size: {req.product?.size}</p>
                <p className="text-sm">Color: {req.product?.color}</p>
                <p className="text-sm">Quantity: {req.product?.quantity}</p>
                {req.product?.productLink && (
                  <p className="text-sm">
                    Link:{" "}
                    <a href={req.product.productLink} target="_blank" rel="noopener noreferrer"
                      className="text-primary underline">{req.product.productLink}</a>
                  </p>
                )}
                {Array.isArray(req.images) && req.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {req.images.map((imgUrl: string, idx: number) => (
                      <img key={idx} src={imgUrl} alt="uploaded" className="w-24 h-24 object-cover rounded border" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
