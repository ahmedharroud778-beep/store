import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ShoppingBag, Heart, Search, X, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { getTotalStock, useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoryPageProps {
  onAddToCart: (product: any) => void;
}

export function CategoryPage({ onAddToCart }: CategoryPageProps) {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { products, loading, error } = useProducts();
  const { categoriesTree } = useCategories();

  const categoryData = useMemo(() => {
    const mainCategory = categoriesTree.find((item) => item.slug === category);
    if (!mainCategory) return null;

    const childCategory = subcategory
      ? mainCategory.children.find((item) => item.slug === subcategory)
      : null;

    const baseProducts = products.filter((product) => product.category === mainCategory.name);
    const title = childCategory ? childCategory.name : mainCategory.name;
    const subtitle = childCategory ? `Inside ${mainCategory.name}` : `Browse everything in ${mainCategory.name}`;
    const icon = String(mainCategory.name).toLowerCase().includes('handmade') ? Heart : ShoppingBag;

    const visibleProducts = childCategory
      ? baseProducts.filter((p) => p.subcategory === childCategory.name)
      : baseProducts;

    return {
      mainCategory,
      childCategory,
      title,
      subtitle,
      icon,
      products: visibleProducts,
    };
  }, [categoriesTree, category, products, subcategory]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const min = minPrice.trim() === '' ? null : Number(minPrice);
    const max = maxPrice.trim() === '' ? null : Number(maxPrice);

    const baseProducts = categoryData?.products ?? [];
    const base = baseProducts.filter((product) => {
      if (query && !String(product.name || '').toLowerCase().includes(query)) return false;
      if (Number.isFinite(min as number) && Number(product.price || 0) < (min as number)) return false;
      if (Number.isFinite(max as number) && Number(product.price || 0) > (max as number)) return false;
      if (inStockOnly) {
        const stock = getTotalStock(product as any);
        if (stock !== null && stock <= 0) return false;
      }
      return true;
    });

    const sorted = [...base];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'name-asc') {
      sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }
    return sorted;
  }, [categoryData?.products, inStockOnly, maxPrice, minPrice, searchQuery, sortBy]);

  if (!categoryData) {
    const isInitialLoading = loading || categoriesTree.length === 0;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            {isInitialLoading ? t('common.loading') : t('common.notFound')}
          </h2>
          {!isInitialLoading && (
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all"
            >
              {t('common.backHome')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const Icon = categoryData.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </button>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4 animate-in fade-in slide-in-from-top duration-300">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('header.search')}
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

      {/* Category Header */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          {subcategory && (
            <div className="flex items-center gap-2 mb-6 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                {t('common.home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link
                to={`/category/${category}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {categoryData.mainCategory.name}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{categoryData.title}</span>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mb-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1
                className="animate-in fade-in slide-in-from-bottom duration-700 truncate"
                style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}
              >
                {categoryData.title}
              </h1>
              <p
                className="text-muted-foreground animate-in fade-in slide-in-from-bottom duration-700 delay-100"
                style={{ fontSize: '1.125rem' }}
              >
                {categoryData.subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 bg-card border border-border rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'name-asc')}
                className="px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min price"
                className="px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max price"
                className="px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-input-background">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span className="text-sm">In stock only</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSortBy('featured');
                  setInStockOnly(false);
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
              >
                Reset filters
              </button>
            </div>
          </div>

          {loading && <p className="text-center text-muted-foreground mb-6">Loading products...</p>}
          {error && <p className="text-center text-destructive mb-6">{error}</p>}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
                {t('common.noResults')}{searchQuery && ` ${t('common.for')} "${searchQuery}"`}
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                {filteredProducts.length} {filteredProducts.length === 1 ? t('product.product') : t('product.products')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ProductCard {...product} onAddToCart={onAddToCart} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
