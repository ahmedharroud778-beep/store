import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ShoppingBag, Heart, Search, X, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { useProducts } from '../../hooks/useProducts';
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
  const { products, loading, error } = useProducts();
  const { categoriesTree } = useCategories();

  const getCategoryData = () => {
    const mainCategory = categoriesTree.find((item) => item.slug === category);
    if (!mainCategory) return null;

    const childCategory = subcategory
      ? mainCategory.children.find((item) => item.slug === subcategory)
      : null;

    const baseProducts = products.filter((product) => product.category === mainCategory.name);
    const title = childCategory ? childCategory.name : mainCategory.name;
    const subtitle = childCategory ? `Inside ${mainCategory.name}` : `Browse everything in ${mainCategory.name}`;
    const icon = String(mainCategory.name).toLowerCase().includes('handmade') ? Heart : ShoppingBag;

    // Filter by subcategory if provided
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
  };

  const categoryData = getCategoryData();

  if (!categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            {t('common.notFound')}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all"
          >
            {t('common.backHome')}
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = categoryData.products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Icon = categoryData.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.back')}</span>
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

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1
                className="animate-in fade-in slide-in-from-bottom duration-700"
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
