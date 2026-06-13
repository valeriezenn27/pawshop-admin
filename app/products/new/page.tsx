import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div data-testid="new-product-page">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          data-testid="btn-back"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details to add a new product.</p>
      </div>

      <div className="max-w-2xl">
        <ProductForm />
      </div>
    </div>
  );
}
