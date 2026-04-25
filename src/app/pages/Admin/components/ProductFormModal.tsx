// src/app/pages/Admin/components/ProductFormModal.tsx
// Extracted from AdminDashboard.tsx — product add/edit modal

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
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

interface Props {
  product: Product | null;
  categories: StoreCategory[];
  onSave: (payload: FormData) => void;
  isSaving?: boolean;
  onClose: () => void;
}

export function ProductFormModal({ product, categories, onSave, isSaving = false, onClose }: Props) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Product>(
    product || {
      id: 0,
      name: "",
      price: 0,
      image: "",
      category: "From Shein",
      subcategory: "",
      description: "",
      images: [],
      details: {
        material: "",
        size: "",
        sizeOptions: [],
        color: "",
        care: "",
        origin: "",
      },
    }
  );
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images?.length ? product.images : product?.image ? [product.image] : []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(() => {
    const baseImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];
    const productMainImage = product?.image || "";
    const foundIndex = baseImages.findIndex((image) => image === productMainImage);
    return foundIndex >= 0 ? foundIndex : 0;
  });
  const [sizeOptionsText, setSizeOptionsText] = useState(
    Array.isArray(product?.details?.sizeOptions) ? product.details.sizeOptions.join(", ") : "",
  );
  const [colorOptionsText, setColorOptionsText] = useState(
    Array.isArray(product?.details?.colorOptions) ? product.details.colorOptions.join(", ") : "",
  );
  const parsedColorOptions = useMemo(() => {
    const items = colorOptionsText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return unique;
  }, [colorOptionsText]);
  const parsedSizeOptions = useMemo(() => {
    const items = sizeOptionsText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return unique;
  }, [sizeOptionsText]);

  const [sizeStockMap, setSizeStockMap] = useState<Record<string, string>>(() => {
    const stock = product?.details?.sizeStock;
    if (!stock || typeof stock !== "object") return {};
    return Object.fromEntries(Object.entries(stock).map(([size, value]) => [size, String(value ?? "")]));
  });

  const [colorStockMap, setColorStockMap] = useState<Record<string, string>>(() => {
    const stock = product?.details?.colorStock;
    if (!stock || typeof stock !== "object") return {};
    return Object.fromEntries(Object.entries(stock).map(([color, value]) => [color, String(value ?? "")]));
  });

  const uploadedPreviews = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      uploadedPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadedPreviews]);

  const combinedPreviewImages = [...imageUrls, ...uploadedPreviews];
  const selectedCategory = categories.find((category) => category.name === formData.category);
  const childCategories = selectedCategory?.children || [];

  useEffect(() => {
    // if product prop changes (editing), sync into form
    if (!product) return;
    setFormData(product);
    setImageUrls(product.images?.length ? product.images : product.image ? [product.image] : []);
    setSelectedFiles([]);
    setSizeOptionsText(Array.isArray(product.details?.sizeOptions) ? product.details.sizeOptions.join(", ") : "");
    setColorOptionsText(Array.isArray(product.details?.colorOptions) ? product.details.colorOptions.join(", ") : "");
    const nextStock = product.details?.sizeStock;
    setSizeStockMap(() => {
      if (!nextStock || typeof nextStock !== "object") return {};
      return Object.fromEntries(Object.entries(nextStock).map(([size, value]) => [size, String(value ?? "")]));
    });
    const nextColorStock = product.details?.colorStock;
    setColorStockMap(() => {
      if (!nextColorStock || typeof nextColorStock !== "object") return {};
      return Object.fromEntries(Object.entries(nextColorStock).map(([color, value]) => [color, String(value ?? "")]));
    });
    const existingImages = product.images?.length ? product.images : product.image ? [product.image] : [];
    const foundIndex = existingImages.findIndex((image) => image === product.image);
    setMainImageIndex(foundIndex >= 0 ? foundIndex : 0);
  }, [product]);

  useEffect(() => {
    setSizeStockMap((current) => {
      const next: Record<string, string> = {};
      parsedSizeOptions.forEach((size) => {
        next[size] = current[size] ?? "";
      });
      return next;
    });
  }, [parsedSizeOptions]);

  useEffect(() => {
    setColorStockMap((current) => {
      const next: Record<string, string> = {};
      parsedColorOptions.forEach((color) => {
        next[color] = current[color] ?? "";
      });
      return next;
    });
  }, [parsedColorOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (combinedPreviewImages.length === 0) {
      window.alert("Please add at least one product image using a URL or device upload.");
      return;
    }

    const payload = {
      id: formData.id,
      name: formData.name,
      price: formData.price,
      category: formData.category,
      subcategory: formData.subcategory || "",
      description: formData.description,
      images: imageUrls.filter(Boolean),
      mainImageIndex,
      details: {
        material: formData.details.material || "",
        size: formData.details.size || "",
        sizeOptions: parsedSizeOptions,
        colorOptions: parsedColorOptions,
        sizeStock: Object.fromEntries(
          parsedSizeOptions
            .map((size) => {
              const raw = sizeStockMap[size];
              if (raw == null || raw === "") return null;
              const parsed = Number(raw);
              if (!Number.isFinite(parsed)) return [size, 0] as const;
              return [size, Math.max(0, Math.floor(parsed))] as const;
            })
            .filter(Boolean) as Array<readonly [string, number]>,
        ),
        colorStock: Object.fromEntries(
          parsedColorOptions
            .map((color) => {
              const raw = colorStockMap[color];
              if (raw == null || raw === "") return null;
              const parsed = Number(raw);
              if (!Number.isFinite(parsed)) return [color, 0] as const;
              return [color, Math.max(0, Math.floor(parsed))] as const;
            })
            .filter(Boolean) as Array<readonly [string, number]>,
        ),
        color: formData.details.color || "",
        care: formData.details.care || "",
        origin: formData.details.origin || "",
      },
    };

    const requestBody = new FormData();
    requestBody.append("payload", JSON.stringify(payload));
    selectedFiles.forEach((file) => {
      requestBody.append("images", file);
    });
    onSave(requestBody);
  };

  const updateImageUrl = (index: number, value: string) => {
    setImageUrls((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMainImageIndex((current) => {
      if (current === index) return 0;
      if (current > index) return current - 1;
      return current;
    });
  };

  const removeUploadedFile = (index: number) => {
    const absoluteIndex = imageUrls.length + index;
    setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMainImageIndex((current) => {
      if (current === absoluteIndex) return 0;
      if (current > absoluteIndex) return current - 1;
      return current;
    });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= combinedPreviewImages.length) return;

    if (index < imageUrls.length && targetIndex < imageUrls.length) {
      setImageUrls((current) => {
        const next = [...current];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next;
      });
    } else if (index >= imageUrls.length && targetIndex >= imageUrls.length) {
      const fileIndex = index - imageUrls.length;
      const targetFileIndex = targetIndex - imageUrls.length;
      setSelectedFiles((current) => {
        const next = [...current];
        [next[fileIndex], next[targetFileIndex]] = [next[targetFileIndex], next[fileIndex]];
        return next;
      });
    }

    setMainImageIndex((current) => {
      if (current === index) return targetIndex;
      if (current === targetIndex) return index;
      return current;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => !isSaving && onClose()}>
      <div className="min-h-full w-full flex items-start justify-center p-4 py-8">
        <div className="bg-card rounded-2xl p-6 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>{product ? t("admin.editProduct") : t("admin.addProduct")}</h3>
          <button onClick={onClose} disabled={isSaving} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm">Price *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    subcategory: "",
                  })
                }
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm">Child Section</label>
              <select
                value={formData.subcategory || ""}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No child section</option>
                {childCategories.map((child) => (
                  <option key={child.id} value={child.name}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm">Selectable Sizes</label>
              <input
                type="text"
                value={sizeOptionsText}
                onChange={(e) => setSizeOptionsText(e.target.value)}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="XS, S, M, L"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm">Selectable Colors</label>
              <input
                type="text"
                value={colorOptionsText}
                onChange={(e) => setColorOptionsText(e.target.value)}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Black, White, Beige"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm">Color Details</label>
              <input
                type="text"
                value={formData.details.color || ""}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, color: e.target.value } })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Matte Black, Sand Beige..."
              />
            </div>
          </div>

          {parsedSizeOptions.length > 0 ? (
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-3">
                <h4 className="font-medium">Stock By Size</h4>
                <p className="text-sm text-muted-foreground">Set how many pieces are available for each selectable size.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {parsedSizeOptions.map((size) => (
                  <div key={size}>
                    <label className="block mb-2 text-sm">{size}</label>
                    <input
                      type="number"
                      min="0"
                      value={sizeStockMap[size] ?? ""}
                      onChange={(e) =>
                        setSizeStockMap((current) => ({
                          ...current,
                          [size]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {parsedColorOptions.length > 0 ? (
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-3">
                <h4 className="font-medium">Stock By Color</h4>
                <p className="text-sm text-muted-foreground">Set how many pieces are available for each selectable color.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {parsedColorOptions.map((color) => (
                  <div key={color}>
                    <label className="block mb-2 text-sm">{color}</label>
                    <input
                      type="number"
                      min="0"
                      value={colorStockMap[color] ?? ""}
                      onChange={(e) =>
                        setColorStockMap((current) => ({
                          ...current,
                          [color]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="block mb-2 text-sm">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
          </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">Material</label>
              <input
                type="text"
                value={formData.details.material || ""}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, material: e.target.value } })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Displayed Size Details</label>
              <input
                type="text"
                value={formData.details.size || ""}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, size: e.target.value } })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="S, M, L available"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Care</label>
              <input
                type="text"
                value={formData.details.care || ""}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, care: e.target.value } })}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm">Origin</label>
            <input
              type="text"
              value={formData.details.origin || ""}
              onChange={(e) => setFormData({ ...formData, details: { ...formData.details, origin: e.target.value } })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-medium">Product Images</h4>
                <p className="text-sm text-muted-foreground">Add image URLs, upload from your device, choose the main photo, and reorder images.</p>
              </div>
              <button
                type="button"
                onClick={() => setImageUrls((current) => [...current, ""])}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
              >
                Add URL
              </button>
            </div>

            <div className="space-y-3">
              {imageUrls.map((imageUrl, index) => (
                <div key={`image-url-${index}`} className="flex gap-3">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block mb-2 text-sm">Upload From Device</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setSelectedFiles((current) => [...current, ...files]);
                }}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border"
              />
            </div>

            {combinedPreviewImages.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {combinedPreviewImages.map((image, index) => {
                  const isUploadedImage = index >= imageUrls.length;
                  const uploadedIndex = index - imageUrls.length;

                  return (
                    <div key={`${image}-${index}`} className="rounded-xl border border-border overflow-hidden bg-background">
                      <img src={image} alt={`Product preview ${index + 1}`} className="w-full h-40 object-cover" />
                      <div className="p-3 space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="main-image"
                            checked={mainImageIndex === index}
                            onChange={() => setMainImageIndex(index)}
                          />
                          <span>Use as main image</span>
                        </label>
                        <p className="text-xs text-muted-foreground break-all">
                          {isUploadedImage ? `Uploaded file: ${selectedFiles[uploadedIndex]?.name || "image"}` : image}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => moveImage(index, "left")}
                            disabled={index === 0 || (isUploadedImage && index - 1 < imageUrls.length)}
                            className="px-3 py-2 rounded-lg bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Move Left
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, "right")}
                            disabled={index === combinedPreviewImages.length - 1 || (!isUploadedImage && index + 1 >= imageUrls.length)}
                            className="px-3 py-2 rounded-lg bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Move Right
                          </button>
                        </div>
                        {isUploadedImage ? (
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(uploadedIndex)}
                            className="w-full px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                          >
                            Remove Upload
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="w-full px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                          >
                            Remove URL Image
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 border border-dashed border-border p-6 text-sm text-muted-foreground">
                No images added yet.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-full bg-muted hover:bg-muted/70 transition-all disabled:opacity-50">
              {t("admin.cancel")}
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50">
              {isSaving ? "Saving..." : t("admin.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
