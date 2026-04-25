import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../utils/api";

export interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder?: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiJson<StoreCategory[]>("/api/categories")
      .then((data) => {
        if (!mounted) return;
        setCategories(Array.isArray(data) ? data : []);
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

  const mainCategories = useMemo(
    () => categories.filter((category) => category.parentId == null),
    [categories],
  );

  const categoriesTree = useMemo(
    () =>
      mainCategories.map((category) => ({
        ...category,
        children: categories.filter((child) => child.parentId === category.id),
      })),
    [categories, mainCategories],
  );

  return {
    categories,
    mainCategories,
    categoriesTree,
    loading,
    error,
  };
}
