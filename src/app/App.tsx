import { useState, useMemo, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { createRouter } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from 'next-themes';

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

const CART_STORAGE_KEY = 'baraa-cart';

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [cart]);

  const handleAddToCart = (product: CartItem) => {
    const incomingQty = Math.max(1, Math.floor(Number(product.quantity ?? 1) || 1));
    const sizeKey = String(product.size || "");
    const colorKey = String(product.color || "");

    setCart((prev) => {
      const matchIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          String(item.size || "") === sizeKey &&
          String(item.color || "") === colorKey,
      );

      if (matchIndex === -1) {
        return [...prev, { ...product, quantity: incomingQty }];
      }

      const next = [...prev];
      const existing = next[matchIndex];
      const existingQty = Math.max(1, Math.floor(Number(existing.quantity ?? 1) || 1));
      next[matchIndex] = { ...existing, ...product, quantity: existingQty + incomingQty };
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const router = useMemo(
    () => createRouter(cart, handleAddToCart, handleClearCart),
    [cart]
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
