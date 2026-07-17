"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { OrganizationOption, Product, ProductFormData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Shampoo & Grooming",
  "Food & Treats",
  "Toys",
  "Accessories",
  "Health & Wellness",
  "Carriers & Travel",
  "Bedding & Furniture",
  "Training",
];

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
  organizations?: OrganizationOption[];
}

const defaultFormData: ProductFormData = {
  name: "",
  category: "",
  price: 0,
  stock: 0,
  status: "active",
  image_url: "",
  description: "",
};

export default function ProductForm({ initialData, isEdit = false, organizations = [] }: ProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>(
    initialData
      ? {
          name: initialData.name,
          organization_id: initialData.organization_id,
          category: initialData.category,
          price: initialData.price,
          stock: initialData.stock,
          status: initialData.status,
          image_url: initialData.image_url ?? "",
          description: initialData.description ?? "",
        }
      : defaultFormData
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image_url ?? "");
  const [imageError, setImageError] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) return;
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (organizations.length > 0 && !formData.organization_id) {
      newErrors.organization_id = "Workspace is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (formData.stock < 0) {
      newErrors.stock = "Stock cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      let nextFormData = formData;
      if (imageFile) {
        const organizationId = formData.organization_id ?? initialData?.organization_id;
        if (!organizationId) throw new Error("Choose a workspace before uploading an image");

        const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${organizationId}/${crypto.randomUUID()}.${extension}`;
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
        nextFormData = { ...formData, image_url: publicUrl.publicUrl };
      }

      const url = isEdit ? `/api/products/${initialData!.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/products");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be 5 MB or smaller");
      return;
    }
    setImageFile(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
    setFormData((previous) => ({ ...previous, image_url: "" }));
    setImageError("");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="product-form" noValidate className="space-y-6">
      {serverError && (
        <div
          className="border-l-2 border-rose-400 dark:border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
          data-testid="form-error"
        >
          {serverError}
        </div>
      )}

      <div className="border-t-2 border-stone-900 bg-surface shadow-sm">
      <div className="space-y-5 p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Product details</p>

        {organizations.length > 0 && (!isEdit || !initialData?.organization_id) && (
          <div>
            <label htmlFor="organization_id" className="form-label">
              Workspace <span className="text-rose-500">*</span>
            </label>
            <select id="organization_id" name="organization_id" className="form-input" required value={formData.organization_id ?? ""} onChange={handleChange} data-testid="input-organization">
              <option value="">Select a workspace</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
            {errors.organization_id && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.organization_id}</p>}
            {isEdit && !initialData?.organization_id && (
              <p className="mt-1 text-xs text-amber-600">
                This older product is not assigned to a workspace yet. Choose one to enable image uploads.
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="name" className="form-label">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? "border-rose-400 dark:border-rose-600 focus:border-rose-400 focus:ring-rose-400" : ""}`}
            placeholder="e.g. Golden Retriever Shampoo"
            data-testid="input-name"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" data-testid="error-name">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="form-label">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-input ${errors.category ? "border-rose-400 dark:border-rose-600 focus:border-rose-400 focus:ring-rose-400" : ""}`}
            data-testid="input-category"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" data-testid="error-category">
              {errors.category}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="price" className="form-label">
              Price (USD) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 text-sm">
                $
              </span>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className={`form-input pl-7 ${errors.price ? "border-rose-400 dark:border-rose-600 focus:border-rose-400 focus:ring-rose-400" : ""}`}
                placeholder="0.00"
                data-testid="input-price"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" data-testid="error-price">
                {errors.price}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="stock" className="form-label">
              Stock Quantity
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              className={`form-input ${errors.stock ? "border-rose-400 dark:border-rose-600 focus:border-rose-400 focus:ring-rose-400" : ""}`}
              placeholder="0"
              data-testid="input-stock"
            />
            {errors.stock && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" data-testid="error-stock">
                {errors.stock}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="status" className="form-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-input"
            data-testid="input-status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="space-y-5 border-t border-stone-200 p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Additional info</p>

        <div>
          <label className="form-label">Product image</label>
          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 sm:h-32 sm:w-32 sm:shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={30} className="text-stone-300" />
              )}
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={selectImage} className="hidden" data-testid="input-product-image" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={selectImage} className="hidden" data-testid="input-product-camera" />
              <button type="button" className="btn-secondary" onClick={() => uploadInputRef.current?.click()}>
                <ImagePlus size={16} /> Upload image
              </button>
              <button type="button" className="btn-secondary" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={16} /> Take photo
              </button>
              {imagePreview && (
                <button type="button" className="btn-secondary text-rose-600" onClick={removeImage}>
                  <Trash2 size={16} /> Remove
                </button>
              )}
              <p className="w-full text-xs text-stone-400">JPG, PNG, WebP or GIF · maximum 5 MB</p>
              {imageError && <p className="w-full text-xs text-rose-600" role="alert">{imageError}</p>}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="form-input resize-none"
            placeholder="Describe the product..."
            data-testid="input-description"
          />
        </div>
      </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/products" className="btn-secondary" data-testid="btn-cancel">
          Cancel
        </Link>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
          data-testid="btn-submit"
        >
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> {imageFile ? "Uploading..." : isEdit ? "Saving..." : "Adding..."}</>
            : isEdit
            ? "Save Changes"
            : "Add Product"}
        </button>
      </div>
    </form>
  );
}
