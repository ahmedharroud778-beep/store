import React, { useState } from "react";
import { ShoppingBag, Sparkles, Heart, Menu, Search, X } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { CheckoutForm } from "../components/CheckoutForm";
import { Sidebar } from "../components/Sidebar";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";
import { useLanguage } from "../contexts/LanguageContext";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { SITE_CONFIG, createWhatsAppLink } from "../../utils/siteConfig";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  size?: string;
  color?: string;
  quantity?: number;
}

interface HomeProps {
  cart: CartItem[];
  onAddToCart: (product: CartItem) => void;
  onClearCart: () => void;
}

export function Home({ cart, onAddToCart, onClearCart }: HomeProps) {
  const { t } = useLanguage();
  const [showCheckout, setShowCheckout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { products, loading: loadingProducts, error: productsError } = useProducts();
  const { categoriesTree } = useCategories();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const filteredSections = categoriesTree
    .map((category) => ({
      ...category,
      products: products.filter(
        (product) =>
          product.category === category.name &&
          product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.products.length > 0);

  const hasSearchResults = filteredSections.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex w-10 h-10 rounded-full hover:bg-muted items-center justify-center transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1
                  className="hidden sm:block"
                  style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 600 }}
                >
                  {t("header.store")}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />

              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              <button
                onClick={() => cartCount > 0 && setShowCheckout(true)}
                className="relative bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">{t("header.cart")}</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="mt-4 animate-in fade-in slide-in-from-top duration-300">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("header.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-input-background rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {!searchQuery && (
        <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2
              className="mb-4 animate-in fade-in slide-in-from-bottom duration-700"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
            >
              {t("home.hero.title")}
            </h2>
            <p
              className="text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-100"
              style={{ fontSize: "1.125rem" }}
            >
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={createWhatsAppLink("Hello, I want to ask about products on Noor Store.")}
                target="_blank"
                rel="noreferrer"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all"
              >
                Chat on WhatsApp
              </a>
              <div className="text-sm text-muted-foreground">
                {SITE_CONFIG.city} · {SITE_CONFIG.responseTime}
              </div>
            </div>
          </div>
        </section>
      )}

      {loadingProducts && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      )}
      {productsError && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-destructive">Error loading products: {productsError}</p>
        </div>
      )}

      {searchQuery && !hasSearchResults && !loadingProducts && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground" style={{ fontSize: "1.125rem" }}>
            No products found for "{searchQuery}"
          </p>
        </div>
      )}

      {filteredSections.map((section, sectionIndex) => {
        const isHandmade = section.name.toLowerCase().includes("handmade");
        const Icon = isHandmade ? Heart : ShoppingBag;

        return (
          <section
            key={section.id}
            id={section.slug}
            className={`py-16 px-4 ${sectionIndex % 2 === 1 ? "bg-muted/30" : ""}`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${isHandmade ? "bg-secondary/20" : "bg-primary/10"} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${isHandmade ? "text-secondary" : "text-primary"}`} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 600 }}>
                      {section.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {section.children.length > 0
                        ? `${section.children.length} ${t('menu.sections')}`
                        : t('home.browseCollection')}
                    </p>
                  </div>
                </div>
                <a
                  href={`/category/${section.slug}`}
                  className={`${isHandmade ? "text-secondary hover:text-primary" : "text-primary hover:text-accent"} transition-colors text-sm font-medium`}
                >
                  {t('menu.viewAll')}
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.products.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ProductCard {...product} category={product.category ?? ""} onAddToCart={onAddToCart} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {!searchQuery && (
        <section id="about" className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 600 }}>
              {t("home.about.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{t("home.about.text")}</p>
          </div>
        </section>
      )}

      {!searchQuery && (
        <section id="contact" className="py-16 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 600 }}>
              {t("home.contact.title")}
            </h2>
            <p className="text-muted-foreground mb-6">{t("home.contact.text")}</p>
            <div className="bg-card rounded-xl p-8 border border-border">
              <p className="mb-4">
                <strong>{t("home.contact.email")}:</strong> {SITE_CONFIG.email}
              </p>
              <p className="mb-4">
                <strong>{t("home.contact.phone")}:</strong> {SITE_CONFIG.phoneNumber}
              </p>
              <p className="mb-4">
                <strong>WhatsApp:</strong> {SITE_CONFIG.whatsappNumber}
              </p>
              <p className="mb-4">
                <strong>Location:</strong> {SITE_CONFIG.city}
              </p>
              <p className="text-muted-foreground text-sm">{t("home.contact.hours")}</p>
              <p className="text-muted-foreground text-sm mt-2">{SITE_CONFIG.checkoutMessage}</p>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-card border-t border-border py-12 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 600 }}>Noor Store</h3>
          </div>
          <p className="text-muted-foreground mb-2">{t("common.tagline")}</p>
          <p className="text-muted-foreground mb-2">{SITE_CONFIG.phoneNumber} · {SITE_CONFIG.city}</p>
          <p className="text-sm text-muted-foreground">{t("common.copyright")}</p>
        </div>
      </footer>

      {showCheckout && <CheckoutForm cart={cart} onClose={() => setShowCheckout(false)} onClearCart={onClearCart} />}
    </div>
  );
}
