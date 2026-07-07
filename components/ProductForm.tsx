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
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          data-testid="form-error"
        >
          {serverError}
        </div>
      )}

      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Product Details</h2>

        {!isEdit && organizations.length > 0 && (
          <div>
            <label htmlFor="organization_id" className="form-label">Workspace <span className="text-red-500">*</span></label>
            <select id="organization_id" name="organization_id" className="form-input" required value={formData.organization_id ?? ""} onChange={handleChange} data-testid="input-organization">
              <option value="">Select a workspace</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
            {errors.organization_id && <p className="mt-1 text-xs text-red-600">{errors.organization_id}</p>}
          </div>
        )}

        <div>
          <label htmlFor="name" className="form-label">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
            placeholder="e.g. Golden Retriever Shampoo"
            data-testid="input-name"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600" data-testid="error-name">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="form-label">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-input ${errors.category ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
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
            <p className="mt-1 text-xs text-red-600" data-testid="error-category">
              {errors.category}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="price" className="form-label">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm">
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
                className={`form-input pl-7 ${errors.price ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
                placeholder="0.00"
                data-testid="input-price"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-price">
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
              className={`form-input ${errors.stock ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
              placeholder="0"
              data-testid="input-stock"
            />
            {errors.stock && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-stock">
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

      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Additional Info</h2>

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
