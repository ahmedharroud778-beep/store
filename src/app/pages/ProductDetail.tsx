import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { SITE_CONFIG, createWhatsAppLink } from '../../utils/siteConfig';
import { ThemeToggle } from '../components/ThemeToggle';

function getSelectableSizes(product: any) {
  const explicitSizes = Array.isArray(product?.details?.sizeOptions)
    ? product.details.sizeOptions.map((size: string) => String(size || '').trim()).filter(Boolean)
    : [];

  if (explicitSizes.length > 0) return explicitSizes;
  if (product?.category === 'Handmade') return [];

  return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
}

function getColorOptions(product: any) {
  const explicitColors = Array.isArray(product?.details?.colorOptions)
    ? product.details.colorOptions.map((color: string) => String(color || '').trim()).filter(Boolean)
    : [];

  if (explicitColors.length > 0) {
    return explicitColors.map((name: string) => ({ name, value: '#E5E7EB' }));
  }

  return [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Beige', value: '#D4A574' },
  ];
}

function getSizeStock(product: any, size: string) {
  const stockMap = product?.details?.sizeStock;
  if (!stockMap || typeof stockMap !== 'object') return null;

  const value = Number(stockMap[size]);
  return Number.isFinite(value) ? value : null;
}

function getColorStock(product: any, color: string) {
  const stockMap = product?.details?.colorStock;
  if (!stockMap || typeof stockMap !== 'object') return null;

  const value = Number(stockMap[color]);
  return Number.isFinite(value) ? value : null;
}

interface ProductDetailProps {
  onAddToCart: (product: any) => void;
}

export function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const { products, loading } = useProducts();
  const { categoriesTree } = useCategories();

  const product = useMemo(() => products.find((p) => p.id === Number(id)), [id, products]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  const subcategoryNames: { [key: string]: string } = {
    dresses: 'Dresses',
    suits: 'Suits & Sets',
    coats: 'Coats & Jackets',
    casual: 'Casual Wear',
    heels: 'Heels',
    flats: 'Flats',
    boots: 'Boots',
    bags: 'Bags',
    jewelry: 'Jewelry',
    scarves: 'Scarves',
    bowls: 'Bowls',
    vases: 'Vases',
    plates: 'Plates',
    cups: 'Cups & Mugs',
    decorative: 'Decorative',
    'wall-art': 'Wall Art',
    candles: 'Candle Holders',
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            Product Not Found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const mainCategory = categoriesTree.find((category) => category.name === product.category);
  const childCategory = mainCategory?.children.find((category) => category.name === product.subcategory);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const productImages = product.images?.length ? product.images : [product.image];
  const sizes = getSelectableSizes(product);
  const sizeOptions = sizes.map((size) => {
    const stock = getSizeStock(product, size);
    return {
      value: size,
      stock,
      isOutOfStock: stock !== null && stock <= 0,
    };
  });
  const needsSize = sizes.length > 0;
  const needsColor = getColorOptions(product).length > 0;
  const colors = getColorOptions(product);
  const selectedSizeStock = selectedSize ? getSizeStock(product, selectedSize) : null;
  const selectedColorStock = selectedColor ? getColorStock(product, selectedColor) : null;
  const candidates = [
    selectedSizeStock !== null ? selectedSizeStock : null,
    selectedColorStock !== null ? selectedColorStock : null,
  ].filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0) as number[];
  const maxAllowedQuantity = candidates.length ? Math.min(...candidates) : null;

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    const productWithOptions = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      size: selectedSize,
      color: selectedColor,
      quantity,
    };
    onAddToCart(productWithOptions);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const canAddToCart =
    (!needsSize || selectedSize) &&
    (!needsColor || selectedColor) &&
    quantity > 0 &&
    (maxAllowedQuantity == null || quantity <= maxAllowedQuantity);

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
              <span>Back to Store</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-sm flex-wrap">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Link
            to={mainCategory ? `/category/${mainCategory.slug}` : "/"}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          {product.subcategory && childCategory && mainCategory && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link
                to={`/category/${mainCategory.slug}/${childCategory.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {childCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4 animate-in fade-in slide-in-from-left duration-500">
            {/* Main Image */}
            <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden group">
                <img
                src={productImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card border border-border"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card border border-border"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index
                        ? 'border-primary scale-95'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                {product.category}
              </p>
              <h1
                className="mb-4"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 }}
              >
                {product.name}
              </h1>
              <p
                className="text-primary mb-6"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 600 }}
              >
                ${product.price}
              </p>
            </div>

            <div className="border-t border-b border-border py-6">
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                Description
              </h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="space-y-4">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Details</h3>
              <dl className="space-y-3">
                {product.details.material && (
                  <div className="flex items-start gap-4">
                    <dt className="text-muted-foreground min-w-[100px]">Material:</dt>
                    <dd>{product.details.material}</dd>
                  </div>
                )}
                {product.details.size && (
                  <div className="flex items-start gap-4">
                    <dt className="text-muted-foreground min-w-[100px]">Size:</dt>
                    <dd>{product.details.size}</dd>
                  </div>
                )}
                {product.details.color && (
                  <div className="flex items-start gap-4">
                    <dt className="text-muted-foreground min-w-[100px]">Color:</dt>
                    <dd>{product.details.color}</dd>
                  </div>
                )}
                {product.details.care && (
                  <div className="flex items-start gap-4">
                    <dt className="text-muted-foreground min-w-[100px]">Care:</dt>
                    <dd>{product.details.care}</dd>
                  </div>
                )}
                {product.details.origin && (
                  <div className="flex items-start gap-4">
                    <dt className="text-muted-foreground min-w-[100px]">Origin:</dt>
                    <dd>{product.details.origin}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Size Selection */}
            {needsSize && (
              <div className="space-y-3">
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>Select Size *</h3>
                <div className="grid grid-cols-6 gap-2">
                  {sizeOptions.map((sizeOption) => (
                    <button
                      key={sizeOption.value}
                      type="button"
                      onClick={() => !sizeOption.isOutOfStock && setSelectedSize(sizeOption.value)}
                      disabled={sizeOption.isOutOfStock}
                      className={`py-3 rounded-lg border-2 transition-all ${
                        selectedSize === sizeOption.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : sizeOption.isOutOfStock
                            ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div>{sizeOption.value}</div>
                      {sizeOption.stock !== null ? <div className="text-[10px] mt-1">{sizeOption.stock > 0 ? `${sizeOption.stock} left` : 'Sold out'}</div> : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {needsColor && (
              <div className="space-y-3">
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>Select Color *</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {colors.map((color) => {
                    const stock = getColorStock(product, color.name);
                    const isOutOfStock = stock !== null && stock <= 0;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => !isOutOfStock && setSelectedColor(color.name)}
                        disabled={isOutOfStock}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedColor === color.name
                            ? 'border-primary bg-primary/10'
                            : isOutOfStock
                              ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-border"
                          style={{ backgroundColor: color.value }}
                        />
                        <div className="min-w-0 text-left">
                          <div className="leading-none">{color.name}</div>
                          {stock !== null ? (
                            <div className="text-[10px] mt-1 leading-none text-muted-foreground">
                              {stock > 0 ? `${stock} left` : 'Sold out'}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-border hover:bg-muted transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxAllowedQuantity ?? undefined}
                  value={quantity}
                  onChange={(e) => {
                    const nextValue = Math.max(1, parseInt(e.target.value) || 1);
                    setQuantity(maxAllowedQuantity != null ? Math.min(nextValue, maxAllowedQuantity) : nextValue);
                  }}
                  className="w-24 text-center px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(maxAllowedQuantity != null ? Math.min(quantity + 1, maxAllowedQuantity) : quantity + 1)}
                  className="w-12 h-12 rounded-full border-2 border-border hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>
              {maxAllowedQuantity != null ? (
                <p className="text-sm text-muted-foreground">Available stock: {maxAllowedQuantity}</p>
              ) : null}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full py-4 rounded-full transition-all duration-200 flex items-center justify-center gap-3 mt-8 ${
                canAddToCart
                  ? 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              style={{ fontSize: '1.125rem' }}
            >
              <ShoppingCart className="w-5 h-5" />
              {showSuccess ? 'Added to Cart!' : 'Add to Cart'}
            </button>

            {!canAddToCart && (
              <p className="text-sm text-muted-foreground text-center">
                {maxAllowedQuantity === 0
                  ? 'This option is out of stock'
                  : maxAllowedQuantity && quantity > maxAllowedQuantity
                    ? `Only ${maxAllowedQuantity} available`
                    : 'Please select all required options'}
              </p>
            )}

            <div className="bg-muted/50 rounded-xl p-6 mt-6">
              <h4 className="mb-3" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
                How to Order
              </h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Add items to your cart</li>
                <li>2. Click on the cart to proceed to checkout</li>
                <li>3. Fill in your contact and delivery details</li>
                <li>4. Choose your payment method (Cash or Bank Transfer)</li>
                <li>5. We'll contact you shortly to confirm your order</li>
              </ol>
              <a
                href={createWhatsAppLink(`Hello, I want to ask about ${product.name}.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-4 text-primary hover:text-accent transition-colors"
              >
                Ask on WhatsApp
              </a>
              <p className="text-sm text-muted-foreground mt-2">{SITE_CONFIG.checkoutMessage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
