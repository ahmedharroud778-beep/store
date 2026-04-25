import { useEffect, useMemo, useState } from "react";
import { apiJson, resolveAssetUrl } from "../utils/api";

export interface StoreProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory?: string;
  description: string;
  images: string[];
  details: Record<string, any>;
}

function normalizeProductAssets(product: StoreProduct): StoreProduct {
  const normalizedImages = Array.isArray(product.images)
    ? product.images.map((value) => resolveAssetUrl(String(value || ""))).filter(Boolean)
    : [];
  const normalizedMainImage =
    resolveAssetUrl(product.image) || normalizedImages[0] || "";

  return {
    ...product,
    image: normalizedMainImage,
    images: normalizedImages.length > 0 ? normalizedImages : normalizedMainImage ? [normalizedMainImage] : [],
  };
}

export function getTotalStock(product: StoreProduct) {
  const details = product?.details && typeof product.details === "object" ? product.details : {};
  const sizeStock = (details as any)?.sizeStock;
  const colorStock = (details as any)?.colorStock;

  const preferredStock =
    sizeStock && typeof sizeStock === "object"
      ? sizeStock
      : colorStock && typeof colorStock === "object"
        ? colorStock
        : null;

  if (!preferredStock) return null;

  const values = Object.values(preferredStock)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

export function useProducts() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiJson<StoreProduct[]>("/api/products")
      .then((data: StoreProduct[]) => {
        if (!mounted) return;
        const normalizedProducts = Array.isArray(data) ? data.map(normalizeProductAssets) : [];
        setProducts(normalizedProducts);
        setError(null);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const curatedProducts = useMemo(
    () => products.filter((product) => (product.category || "").toLowerCase() !== "handmade"),
    [products],
  );
  const handmadeProducts = useMemo(
    () => products.filter((product) => (product.category || "").toLowerCase() === "handmade"),
    [products],
  );

  return {
    products,
    curatedProducts,
    handmadeProducts,
    loading,
    error,
  };
}
