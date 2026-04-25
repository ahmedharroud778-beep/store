import { useState } from 'react';
import { X, ShoppingCart, Check } from 'lucide-react';

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

interface ProductOptionsModalProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    images?: string[];
    category: string;
    details?: {
      sizeOptions?: string[];
      colorOptions?: string[];
      sizeStock?: Record<string, number>;
      colorStock?: Record<string, number>;
    };
  };
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export function ProductOptionsModal({ product, onClose, onAddToCart }: ProductOptionsModalProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine if this product needs size/color options based on category
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
  const colors = getColorOptions(product);
  const needsColor = colors.length > 0;
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
      ...product,
      size: selectedSize,
      color: selectedColor,
      quantity,
    };
    onAddToCart(productWithOptions);
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const canAddToCart =
    (!needsSize || selectedSize) &&
    (!needsColor || selectedColor) &&
    quantity > 0 &&
    (maxAllowedQuantity == null || quantity <= maxAllowedQuantity);

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Added to Cart!</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 max-w-md w-full animate-in fade-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h3 className="mb-1 line-clamp-2" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
              {product.name}
            </h3>
            <p className="text-primary" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600 }}>
              ${product.price}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Image */}
        <div className="mb-6">
          <img src={product.images?.[0] || product.image} alt={product.name} className="w-full h-48 object-cover rounded-lg" />
        </div>

        {/* Size Selection */}
        {needsSize && (
          <div className="mb-6">
            <label className="block mb-3 text-sm text-foreground">Select Size *</label>
            <div className="grid grid-cols-6 gap-2">
              {sizeOptions.map((sizeOption) => (
                <button
                  key={sizeOption.value}
                  type="button"
                  onClick={() => !sizeOption.isOutOfStock && setSelectedSize(sizeOption.value)}
                  disabled={sizeOption.isOutOfStock}
                  className={`py-2 rounded-lg border-2 transition-all ${
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
          <div className="mb-6">
            <label className="block mb-3 text-sm text-foreground">Select Color *</label>
            <div className="grid grid-cols-3 gap-3">
              {colors.map((color) => {
                const stock = getColorStock(product, color.name);
                const isOutOfStock = stock !== null && stock <= 0;
                return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => !isOutOfStock && setSelectedColor(color.name)}
                  disabled={isOutOfStock}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    selectedColor === color.name
                      ? 'border-primary bg-primary/10'
                      : isOutOfStock
                        ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="min-w-0 text-left">
                    <div className="text-sm leading-none">{color.name}</div>
                    {stock !== null ? (
                      <div className="text-[10px] mt-1 leading-none">
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
        <div className="mb-6">
          <label className="block mb-3 text-sm text-foreground">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full border border-border hover:bg-muted transition-colors"
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
              className="w-20 text-center px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setQuantity(maxAllowedQuantity != null ? Math.min(quantity + 1, maxAllowedQuantity) : quantity + 1)}
              className="w-10 h-10 rounded-full border border-border hover:bg-muted transition-colors"
            >
              +
            </button>
          </div>
          {maxAllowedQuantity != null ? (
            <p className="text-sm text-muted-foreground mt-2">Available stock: {maxAllowedQuantity}</p>
          ) : null}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`w-full py-4 rounded-full transition-all duration-200 flex items-center justify-center gap-3 ${
            canAddToCart
              ? 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          style={{ fontSize: '1.125rem' }}
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>

        {!canAddToCart && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            {maxAllowedQuantity === 0
              ? 'This option is out of stock'
              : maxAllowedQuantity && quantity > maxAllowedQuantity
                ? `Only ${maxAllowedQuantity} available`
                : 'Please select all required options'}
          </p>
        )}
      </div>
    </div>
  );
}
