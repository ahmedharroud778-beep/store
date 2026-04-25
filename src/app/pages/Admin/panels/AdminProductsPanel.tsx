// src/app/pages/Admin/panels/AdminProductsPanel.tsx
// Extracted from AdminDashboard.tsx – all products and sections management UI

import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Product } from "../../../data/products";

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder?: number;
  children: StoreCategory[];
}

interface Section {
  name: string;
  children: string[];
}

interface ProductCounts {
  mainCounts: Map<string, number>;
  childCounts: Map<string, Map<string, number>>;
  noChildCounts: Map<string, number>;
}

interface Props {
  products: Product[];
  categories: StoreCategory[];
  mainCategories: StoreCategory[];
  categoriesTree: StoreCategory[];
  displaySections: Section[];
  productCountsBySection: ProductCounts;
  visibleProducts: Product[];
  productSearchQuery: string;
  setProductSearchQuery: (v: string) => void;
  productMainSection: string;
  setProductMainSection: (v: string) => void;
  productChildSection: string;
  setProductChildSection: (v: string) => void;
  newMainCategoryName: string;
  setNewMainCategoryName: (v: string) => void;
  newChildCategoryName: string;
  setNewChildCategoryName: (v: string) => void;
  selectedParentCategoryId: number | "";
  setSelectedParentCategoryId: (v: number | "") => void;
  editingCategoryId: number | null;
  setEditingCategoryId: (v: number | null) => void;
  editingCategoryName: string;
  setEditingCategoryName: (v: string) => void;
  savingCategoryId: number | null;
  productsView: "products" | "sections";
  setProductsView: (v: "products" | "sections") => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onCreateCategory: (payload: { name: string; parentId?: number | null }) => void;
  onDeleteCategory: (id: number) => void;
  onRenameCategory: (id: number, name: string) => Promise<void>;
}

function getProductTotalStock(product: Product) {
  const details = product?.details && typeof product.details === "object" ? product.details : {};
  const sizeStock = (details as any)?.sizeStock;
  const colorStock = (details as any)?.colorStock;

  const stockSource =
    sizeStock && typeof sizeStock === "object"
      ? sizeStock
      : colorStock && typeof colorStock === "object"
        ? colorStock
        : null;

  if (!stockSource) return null;

  const values = Object.values(stockSource)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

export function AdminProductsPanel({
  products,
  mainCategories,
  categoriesTree,
  displaySections,
  productCountsBySection,
  visibleProducts,
  productSearchQuery,
  setProductSearchQuery,
  productMainSection,
  setProductMainSection,
  productChildSection,
  setProductChildSection,
  newMainCategoryName,
  setNewMainCategoryName,
  newChildCategoryName,
  setNewChildCategoryName,
  selectedParentCategoryId,
  setSelectedParentCategoryId,
  editingCategoryId,
  setEditingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  savingCategoryId,
  productsView,
  setProductsView,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onCreateCategory,
  onDeleteCategory,
  onRenameCategory,
}: Props) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>
          {t("admin.products")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setProductsView("products")}
              className={`px-4 py-2 rounded-md text-sm transition-all ${
                productsView === "products" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setProductsView("sections")}
              className={`px-4 py-2 rounded-md text-sm transition-all ${
                productsView === "sections" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sections
            </button>
          </div>

          {productsView === "products" ? (
            <button
              type="button"
              onClick={onAddProduct}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>{t("admin.addProduct")}</span>
            </button>
          ) : null}
        </div>
      </div>

      {productsView === "sections" ? (
        <SectionManagerView
          mainCategories={mainCategories}
          categoriesTree={categoriesTree}
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
          onCreateCategory={onCreateCategory}
          onDeleteCategory={onDeleteCategory}
          onRenameCategory={onRenameCategory}
        />
      ) : (
        <ProductListView
          products={products}
          displaySections={displaySections}
          productCountsBySection={productCountsBySection}
          visibleProducts={visibleProducts}
          productSearchQuery={productSearchQuery}
          setProductSearchQuery={setProductSearchQuery}
          productMainSection={productMainSection}
          setProductMainSection={setProductMainSection}
          productChildSection={productChildSection}
          setProductChildSection={setProductChildSection}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Manager sub-view
// ---------------------------------------------------------------------------

function SectionManagerView({
  mainCategories,
  categoriesTree,
  newMainCategoryName,
  setNewMainCategoryName,
  newChildCategoryName,
  setNewChildCategoryName,
  selectedParentCategoryId,
  setSelectedParentCategoryId,
  editingCategoryId,
  setEditingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  savingCategoryId,
  onCreateCategory,
  onDeleteCategory,
  onRenameCategory,
}: {
  mainCategories: StoreCategory[];
  categoriesTree: StoreCategory[];
  newMainCategoryName: string;
  setNewMainCategoryName: (v: string) => void;
  newChildCategoryName: string;
  setNewChildCategoryName: (v: string) => void;
  selectedParentCategoryId: number | "";
  setSelectedParentCategoryId: (v: number | "") => void;
  editingCategoryId: number | null;
  setEditingCategoryId: (v: number | null) => void;
  editingCategoryName: string;
  setEditingCategoryName: (v: string) => void;
  savingCategoryId: number | null;
  onCreateCategory: (payload: { name: string; parentId?: number | null }) => void;
  onDeleteCategory: (id: number) => void;
  onRenameCategory: (id: number, name: string) => Promise<void>;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-5">
      <div>
        <h3 className="font-medium">Section Manager</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add or remove main store sections and the child sections shown underneath them.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Add Main Section */}
        <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-3">
          <h4 className="font-medium">Add Main Section</h4>
          <input
            type="text"
            value={newMainCategoryName}
            onChange={(e) => setNewMainCategoryName(e.target.value)}
            placeholder="From Zara"
            className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => {
              const trimmedName = newMainCategoryName.trim();
              if (!trimmedName) return;
              onCreateCategory({ name: trimmedName, parentId: null });
              setNewMainCategoryName("");
            }}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground"
          >
            Add Main Section
          </button>
        </div>

        {/* Add Child Section */}
        <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-3">
          <h4 className="font-medium">Add Child Section</h4>
          <select
            value={selectedParentCategoryId}
            onChange={(e) => setSelectedParentCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Choose main section</option>
            {mainCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newChildCategoryName}
            onChange={(e) => setNewChildCategoryName(e.target.value)}
            placeholder="Clothes"
            className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => {
              const trimmedName = newChildCategoryName.trim();
              if (!trimmedName || selectedParentCategoryId === "") return;
              onCreateCategory({ name: trimmedName, parentId: Number(selectedParentCategoryId) });
              setNewChildCategoryName("");
            }}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground"
          >
            Add Child Section
          </button>
        </div>
      </div>

      {/* Category tree */}
      <div className="grid gap-4 md:grid-cols-2">
        {categoriesTree.map((category) => (
          <div key={category.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editingCategoryId === category.id ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await onRenameCategory(category.id, editingCategoryName);
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                        }}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
                        disabled={savingCategoryId === category.id}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }}
                        className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate">{category.name}</p>
                    <p className="text-sm text-muted-foreground">Main section</p>
                  </>
                )}
              </div>
              {editingCategoryId !== category.id && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Rename"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category.id)}
                    className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {category.children.length > 0 ? (
              <div className="mt-4 space-y-2">
                {category.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      {editingCategoryId === child.id ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onRenameCategory(child.id, editingCategoryName);
                                setEditingCategoryId(null);
                                setEditingCategoryName("");
                              }}
                              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60 text-sm"
                              disabled={savingCategoryId === child.id}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }}
                              className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium truncate">{child.name}</p>
                          <p className="text-xs text-muted-foreground">Child section</p>
                        </>
                      )}
                    </div>
                    {editingCategoryId !== child.id && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingCategoryId(child.id); setEditingCategoryName(child.name); }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(child.id)}
                          className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No child sections yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product list sub-view
// ---------------------------------------------------------------------------

function ProductListView({
  products,
  displaySections,
  productCountsBySection,
  visibleProducts,
  productSearchQuery,
  setProductSearchQuery,
  productMainSection,
  setProductMainSection,
  productChildSection,
  setProductChildSection,
  onEditProduct,
  onDeleteProduct,
}: {
  products: Product[];
  displaySections: Section[];
  productCountsBySection: ProductCounts;
  visibleProducts: Product[];
  productSearchQuery: string;
  setProductSearchQuery: (v: string) => void;
  productMainSection: string;
  setProductMainSection: (v: string) => void;
  productChildSection: string;
  setProductChildSection: (v: string) => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: number) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar filter */}
      <div className="bg-card border border-border rounded-2xl p-4 h-fit sticky top-24">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-medium">Sections</h3>
          <button
            type="button"
            onClick={() => { setProductMainSection(""); setProductChildSection(""); }}
            className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm"
            disabled={!productMainSection && !productChildSection}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setProductMainSection(""); setProductChildSection(""); }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
            !productMainSection && !productChildSection ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <span>All products</span>
          <span className="text-xs text-muted-foreground">{products.length}</span>
        </button>

        <div className="mt-3 space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {displaySections.map((section) => {
            const mainCount = productCountsBySection.mainCounts.get(section.name) || 0;
            const isSelectedMain = productMainSection === section.name && !productChildSection;
            const isSelectedAnyInMain = productMainSection === section.name;
            const childMap = productCountsBySection.childCounts.get(section.name) || new Map<string, number>();
            const noChildCount = productCountsBySection.noChildCounts.get(section.name) || 0;

            return (
              <div key={section.name} className="rounded-xl border border-border/60 bg-background/50">
                <button
                  type="button"
                  onClick={() => { setProductMainSection(section.name); setProductChildSection(""); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    isSelectedMain ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="text-sm font-medium">{section.name}</span>
                  <span className="text-xs text-muted-foreground">{mainCount}</span>
                </button>

                {isSelectedAnyInMain && (
                  <div className="px-3 pb-3 space-y-1">
                    <button
                      type="button"
                      onClick={() => setProductChildSection("")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        isSelectedMain ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm">All in {section.name}</span>
                      <span className="text-xs text-muted-foreground">{mainCount}</span>
                    </button>

                    {noChildCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setProductChildSection("__none__")}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          productChildSection === "__none__" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        <span className="text-sm">No child section</span>
                        <span className="text-xs text-muted-foreground">{noChildCount}</span>
                      </button>
                    )}

                    {section.children.map((child) => {
                      const count = childMap.get(child) || 0;
                      if (count === 0) return null;
                      return (
                        <button
                          key={child}
                          type="button"
                          onClick={() => setProductChildSection(child)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            productChildSection === child ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          }`}
                        >
                          <span className="text-sm">{child}</span>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                className="w-full pl-11 pr-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {visibleProducts.length} / {products.length}
              </div>
              <button
                type="button"
                onClick={() => { setProductSearchQuery(""); setProductMainSection(""); setProductChildSection(""); }}
                className="px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm"
                disabled={!productSearchQuery && !productMainSection && !productChildSection}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No products found.
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleProducts.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    {(() => {
                      const totalStock = getProductTotalStock(product);
                      if (totalStock === null) return null;
                      if (totalStock <= 0) {
                        return (
                          <span className="px-2 py-1 rounded-full text-[11px] bg-destructive/10 text-destructive whitespace-nowrap">
                            Out of stock
                          </span>
                        );
                      }
                      if (totalStock <= 3) {
                        return (
                          <span className="px-2 py-1 rounded-full text-[11px] bg-amber-500/15 text-amber-700 whitespace-nowrap">
                            Low stock: {totalStock}
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-1 rounded-full text-[11px] bg-emerald-500/15 text-emerald-700 whitespace-nowrap">
                          In stock: {totalStock}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {product.category}
                    {product.subcategory ? ` / ${product.subcategory}` : ""}
                  </p>
                  <p className="text-primary" style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem" }}>
                    ${product.price}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
