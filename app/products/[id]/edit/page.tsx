export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { supabase } from "@/lib/supabase";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div data-testid="edit-product-page">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          data-testid="btn-back"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Editing <span className="font-medium text-gray-700">{product.name}</span>
        </p>
      </div>

      <div className="max-w-2xl">
        <ProductForm initialData={product} isEdit />
      </div>
    </div>
  );
}
