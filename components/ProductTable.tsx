"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import DeleteModal from "./DeleteModal";
import { useRouter } from "next/navigation";

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (products.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-gray-400"
        data-testid="empty-state"
      >
        <Package size={40} className="mb-3 opacity-40" />
        <p className="text-base font-medium">No products found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto" data-testid="product-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Updated
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition-colors group"
                data-testid="product-row"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Package size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 leading-tight" data-testid="product-name">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600" data-testid="product-category">
                  {product.category}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900" data-testid="product-price">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-4 py-3 text-right" data-testid="product-stock">
                  <span
                    className={`font-medium ${product.stock < 10 ? "text-amber-600" : "text-gray-900"}`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3" data-testid="product-status">
                  <span className={product.status === "active" ? "badge-active" : "badge-inactive"}>
                    {product.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDate(product.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      data-testid="btn-edit"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      data-testid="btn-delete"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        productName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </>
  );
}
