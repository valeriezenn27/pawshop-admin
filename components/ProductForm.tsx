"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OrganizationOption, Product, ProductFormData } from "@/lib/types";

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

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!isEdit && organizations.length > 0 && !formData.organization_id) {
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
      const url = isEdit ? `/api/products/${initialData!.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

        {!isEdit && organizations.length > 0 && (
          <div>
            <label htmlFor="organization_id" className="form-label">Workspace <span className="text-rose-500">*</span></label>
            <select id="organization_id" name="organization_id" className="form-input" required value={formData.organization_id ?? ""} onChange={handleChange} data-testid="input-organization">
              <option value="">Select a workspace</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
            {errors.organization_id && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.organization_id}</p>}
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
          <label htmlFor="image_url" className="form-label">
            Image URL
          </label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            className="form-input"
            placeholder="https://example.com/image.jpg"
            data-testid="input-image-url"
          />
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
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
            ? "Save Changes"
            : "Add Product"}
        </button>
      </div>
    </form>
  );
}
