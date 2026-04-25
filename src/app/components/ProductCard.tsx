import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { ProductOptionsModal } from './ProductOptionsModal';
import { getTotalStock } from '../../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  details?: {
    sizeOptions?: string[];
    sizeStock?: Record<string, number>;
    colorStock?: Record<string, number>;
  };
  onAddToCart: (product: { id: number; name: string; price: number; image: string; category: string }) => void;
}

export function ProductCard({ id, name, price, image, images, category, details, onAddToCart }: ProductCardProps) {
  const { t } = useLanguage();
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const totalStock = getTotalStock({
    id,
    name,
    price,
    image,
    category,
    description: "",
    images: images || [],
    details: details || {},
  });
  const isSoldOut = totalStock !== null && totalStock <= 0;
  const isLowStock = totalStock !== null && totalStock > 0 && totalStock <= 5;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    setShowOptionsModal(true);
  };

  return (
    <>
      <div className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <Link to={`/product/${id}`} className="block aspect-[3/4] overflow-hidden bg-muted">
          <div className="relative w-full h-full">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {isSoldOut ? (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-destructive text-white text-xs font-medium">
                {t('product.soldOut')}
              </span>
            ) : isLowStock ? (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-medium">
                {t('product.onlyLeft').replace('{n}', String(totalStock))}
              </span>
            ) : totalStock !== null ? (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium">
                {t('product.inStock')}
              </span>
            ) : null}
          </div>
        </Link>
        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>
            {category}
          </p>
          <Link to={`/product/${id}`}>
            <h3 className="mb-2 line-clamp-2 min-h-[3rem] hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
              {name}
            </h3>
          </Link>
          <div className="flex items-center justify-between mt-3">
            <span className="text-primary" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600 }}>
              ${price}
            </span>
            <button
              onClick={handleAddClick}
              disabled={isSoldOut}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm">{isSoldOut ? t('product.soldOut') : t('product.add')}</span>
            </button>
          </div>
        </div>
      </div>

      {showOptionsModal && (
        <ProductOptionsModal
          product={{ id, name, price, image, images, category, details }}
          onClose={() => setShowOptionsModal(false)}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
}
