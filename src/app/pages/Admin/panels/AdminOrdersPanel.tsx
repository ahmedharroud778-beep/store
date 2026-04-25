// src/app/pages/Admin/panels/AdminOrdersPanel.tsx
// Extracted from AdminDashboard.tsx – all orders management UI

import { ChartColumn, Archive, ClipboardList, ShoppingCart, Package, Download, Printer, Trash2, Search } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { DebouncedNotesField } from "../components/DebouncedNotesField";

export interface Order {
  id: string;
  date?: string;
  createdAt?: string;
  status?: string;
  notes?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
  };
  items: any[];
  total: number;
  paymentMethod: string;
}

interface AnalyticsData {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  dailySales: Array<{ label: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
}

interface OrderMetrics {
  activeCount: number;
  historyCount: number;
  newCount: number;
  confirmedCount: number;
  activeRevenue: number;
  historyRevenue: number;
}

interface Props {
  orders: Order[];
  orderHistory: Order[];
  visibleActiveOrders: Order[];
  visibleOrderHistory: Order[];
  ordersView: "active" | "history";
  setOrdersView: (v: "active" | "history") => void;
  activeOrdersFilter: "all" | "new" | "contacted" | "confirmed" | "canceled";
  setActiveOrdersFilter: (v: "all" | "new" | "contacted" | "confirmed" | "canceled") => void;
  orderSearchQuery: string;
  setOrderSearchQuery: (v: string) => void;
  ordersDateFrom: string;
  setOrdersDateFrom: (v: string) => void;
  ordersDateTo: string;
  setOrdersDateTo: (v: string) => void;
  clearOrdersDateRange: () => void;
  selectedOrderIds: string[];
  bulkOrderStatus: "contacted" | "confirmed" | "canceled" | "completed";
  setBulkOrderStatus: (v: "contacted" | "confirmed" | "canceled" | "completed") => void;
  analyticsRangeDays: 7 | 14 | 30;
  setAnalyticsRangeDays: (v: 7 | 14 | 30) => void;
  analytics: AnalyticsData;
  orderMetrics: OrderMetrics;
  todayQueue: Order[];
  orderDateRange: { label: string };
  onUpdateOrder: (id: string, updates: { status: string; notes: string }) => void;
  onDeleteOrder: (id: string, source: "active" | "history") => void;
  onBulkUpdateOrders: () => void;
  onBulkDeleteOrders: () => void;
  toggleOrderSelection: (id: string) => void;
  toggleSelectAllVisibleOrders: () => void;
  onSaveOrderNotes: (id: string, notes: string) => void;
  onExportOrders: (source: Order[], filename: string) => void;
  onPrintOrders: (source: Order[], title: string) => void;
}

function formatCurrency(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
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

export function AdminOrdersPanel({
  orders,
  orderHistory,
  visibleActiveOrders,
  visibleOrderHistory,
  ordersView,
  setOrdersView,
  activeOrdersFilter,
  setActiveOrdersFilter,
  orderSearchQuery,
  setOrderSearchQuery,
  ordersDateFrom,
  setOrdersDateFrom,
  ordersDateTo,
  setOrdersDateTo,
  clearOrdersDateRange,
  selectedOrderIds,
  bulkOrderStatus,
  setBulkOrderStatus,
  analyticsRangeDays,
  setAnalyticsRangeDays,
  analytics,
  orderMetrics,
  todayQueue,
  orderDateRange,
  onUpdateOrder,
  onDeleteOrder,
  onBulkUpdateOrders,
  onBulkDeleteOrders,
  toggleOrderSelection,
  toggleSelectAllVisibleOrders,
  onSaveOrderNotes,
  onExportOrders,
  onPrintOrders,
}: Props) {
  const { t } = useLanguage();

  return (
    <div>
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Active Orders", value: orderMetrics.activeCount, sub: `${orderMetrics.newCount} new orders need review`, Icon: ClipboardList },
          { label: "Confirmed Orders", value: orderMetrics.confirmedCount, sub: "Ready for delivery follow-up", Icon: ChartColumn },
          { label: "Open Pipeline Value", value: formatCurrency(orderMetrics.activeRevenue), sub: "From currently active orders", Icon: ShoppingCart },
          { label: "Completed Revenue", value: formatCurrency(orderMetrics.historyRevenue), sub: `${orderMetrics.historyCount} orders in history`, Icon: Archive },
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

      {/* Analytics + Today Queue */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] mb-6">
        {/* Sales Snapshot */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Sales Snapshot</h3>
              <p className="text-sm text-muted-foreground">Track store performance across active and completed orders</p>
            </div>
            <ChartColumn className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => { clearOrdersDateRange(); setAnalyticsRangeDays(days); }}
                className={`px-3 py-2 rounded-full text-sm transition-all ${
                  analyticsRangeDays === days ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From</label>
              <input type="date" value={ordersDateFrom} onChange={(e) => setOrdersDateFrom(e.target.value)}
                className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To</label>
              <input type="date" value={ordersDateTo} onChange={(e) => setOrdersDateTo(e.target.value)}
                className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {(ordersDateFrom || ordersDateTo) && (
              <button type="button" onClick={clearOrdersDateRange}
                className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm w-fit">
                Clear
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-5">
            {[
              { label: "Total Revenue", value: formatCurrency(analytics.totalRevenue) },
              { label: "Average Order", value: formatCurrency(analytics.averageOrderValue) },
              { label: "Total Orders", value: String(analytics.totalOrders) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {analytics.dailySales.map((day) => (
              <div key={day.label} className="rounded-xl border border-border bg-background p-3 text-center min-w-[140px] flex-shrink-0">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{day.label}</p>
                <p className="mt-3 text-sm font-medium">{formatCurrency(day.revenue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{day.orders} order{day.orders === 1 ? "" : "s"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Today Queue */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Today Queue</h3>
              <p className="text-sm text-muted-foreground">Orders created today that still need action</p>
            </div>
            <Package className="w-5 h-5 text-primary" />
          </div>
          {todayQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new or contacted orders were created today.</p>
          ) : (
            <div className="space-y-3">
              {todayQueue.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{order.customer.name || `Order #${order.id}`}</p>
                      <p className="text-sm text-muted-foreground mt-1">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground mt-1">{formatDateTime(order.createdAt || order.date)}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </div>
                      <p className="text-primary font-medium mt-2">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Top Products</h3>
            <p className="text-sm text-muted-foreground">Best revenue performers from the selected range</p>
          </div>
          <Archive className="w-5 h-5 text-primary" />
        </div>
        {analytics.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No product sales yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {analytics.topProducts.map((product, index) => (
              <div key={`${product.name}-${index}`} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{product.units} unit{product.units === 1 ? "" : "s"} sold</p>
                  </div>
                  <p className="text-primary font-medium">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders header + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>
          {ordersView === "active"
            ? `${t("admin.orders")} (${visibleActiveOrders.length})`
            : `Order History (${visibleOrderHistory.length})`}
        </h2>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <button onClick={() => setOrdersView("active")}
            className={`px-4 py-2 rounded-md text-sm transition-all ${ordersView === "active" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            Active Orders
          </button>
          <button onClick={() => setOrdersView("history")}
            className={`px-4 py-2 rounded-md text-sm transition-all ${ordersView === "history" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            Order History
          </button>
        </div>
      </div>

      {/* Search + filters toolbar */}
      <div className="mb-6 bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer, phone, email, city, or product..."
              className="w-full pl-11 pr-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From</label>
              <input type="date" value={ordersDateFrom} onChange={(e) => setOrdersDateFrom(e.target.value)}
                className="px-3 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To</label>
              <input type="date" value={ordersDateTo} onChange={(e) => setOrdersDateTo(e.target.value)}
                className="px-3 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {(ordersDateFrom || ordersDateTo) && (
              <button type="button" onClick={clearOrdersDateRange}
                className="px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm w-fit">
                Clear
              </button>
            )}
          </div>
          <button type="button"
            onClick={() => onPrintOrders(ordersView === "active" ? visibleActiveOrders : visibleOrderHistory, ordersView === "active" ? "Active Orders" : "Order History")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
          <button type="button"
            onClick={() => onExportOrders(ordersView === "active" ? visibleActiveOrders : visibleOrderHistory, ordersView === "active" ? "active-orders.csv" : "order-history.csv")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Active orders filter pills + bulk actions */}
      {ordersView === "active" && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "new", "contacted", "confirmed", "canceled"] as const).map((f) => (
              <button key={f} onClick={() => setActiveOrdersFilter(f)}
                className={`px-4 py-2 rounded-full text-sm transition-all capitalize ${
                  activeOrdersFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                }`}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <label className="inline-flex items-center gap-3 text-sm">
                <input type="checkbox"
                  checked={visibleActiveOrders.length > 0 && visibleActiveOrders.every((o) => selectedOrderIds.includes(o.id))}
                  onChange={toggleSelectAllVisibleOrders}
                  className="h-4 w-4 rounded border-border" />
                <span>Select all visible orders</span>
              </label>
              <div className="flex-1 text-sm text-muted-foreground">{selectedOrderIds.length} selected</div>
              <select value={bulkOrderStatus} onChange={(e) => setBulkOrderStatus(e.target.value as typeof bulkOrderStatus)}
                className="px-3 py-2 bg-input-background rounded-lg border border-border text-sm">
                <option value="contacted">Mark as Contacted</option>
                <option value="confirmed">Mark as Confirmed</option>
                <option value="canceled">Mark as Canceled</option>
                <option value="completed">Mark as Completed</option>
              </select>
              <button type="button" onClick={onBulkUpdateOrders} disabled={selectedOrderIds.length === 0}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                Apply Bulk Action
              </button>
              <button type="button"
                onClick={() => onExportOrders(orders.filter((o) => selectedOrderIds.includes(o.id)), "selected-orders.csv")}
                disabled={selectedOrderIds.length === 0}
                className="px-4 py-2 rounded-lg bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                Export Selected
              </button>
              <button type="button" onClick={onBulkDeleteOrders} disabled={selectedOrderIds.length === 0}
                className="px-4 py-2 rounded-lg bg-destructive text-white disabled:opacity-50 disabled:cursor-not-allowed">
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      {(ordersView === "active" ? visibleActiveOrders : visibleOrderHistory).length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {orderSearchQuery.trim()
              ? `No orders found for ID "${orderSearchQuery.trim()}"`
              : ordersView === "active"
                ? activeOrdersFilter === "all"
                  ? t("admin.noOrders")
                  : `No ${activeOrdersFilter} orders right now`
                : "No completed orders in history yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(ordersView === "active" ? visibleActiveOrders : visibleOrderHistory).map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  {ordersView === "active" && (
                    <input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleOrderSelection(order.id)}
                      className="mt-1 h-4 w-4 rounded border-border" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt || order.date)}</p>
                    <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-sm ${getStatusBadgeClass(order.status)}`}>
                      {ordersView === "active" ? getStatusLabel(order.status) : "Completed"}
                    </div>
                    {ordersView === "active" && (
                      <div className="mt-2">
                        <select value={order.status || "new"}
                          onChange={(e) => onUpdateOrder(order.id, { status: e.target.value, notes: order.notes || "" })}
                          className="px-3 py-2 bg-input-background rounded-lg border border-border text-sm">
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="canceled">Canceled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p className="text-primary" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 600 }}>
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                  </div>
                  <button type="button"
                    onClick={() => onDeleteOrder(order.id, ordersView === "active" ? "active" : "history")}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    title={ordersView === "active" ? "Delete active order" : "Delete order from history"}>
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-2">{t("admin.customer")}</h4>
                  <p className="text-sm">{order.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                  {order.customer.city && <p className="text-sm text-muted-foreground">{order.customer.city}</p>}
                  <p className="text-sm text-muted-foreground">{order.customer.address}</p>
                  <p className="text-sm text-muted-foreground mt-2">Payment: {order.paymentMethod}</p>
                </div>
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-2">Quick Summary</h4>
                  <p className="text-sm text-muted-foreground">Order value: {formatCurrency(order.total)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Items: {order.items.reduce((s, i) => s + Number(i?.quantity || 1), 0)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Latest status: {getStatusLabel(order.status)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Saved: {formatDateTime(order.createdAt || order.date)}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium mb-2">Admin Notes</h4>
                {ordersView === "active" ? (
                  <DebouncedNotesField
                    value={order.notes || ""}
                    placeholder="Write notes about customer follow-up, delivery, or payment."
                    onSave={(notes) => onSaveOrderNotes(order.id, notes)}
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-input-background rounded-lg border border-border min-h-[84px] text-sm text-muted-foreground">
                    {order.notes || "No admin notes saved for this order."}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium mb-2">{t("admin.items")}</h4>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p>{item.name}</p>
                        {item.size && <p className="text-muted-foreground">Size: {item.size}</p>}
                        {item.color && <p className="text-muted-foreground">Color: {item.color}</p>}
                        {item.quantity && <p className="text-muted-foreground">Qty: {item.quantity}</p>}
                      </div>
                      <p className="text-primary">{formatCurrency(Number(item.price || 0))}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
