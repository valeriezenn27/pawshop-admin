export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { createClient } from "@/lib/supabase/server";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const supabase = await createClient();
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

  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div data-testid="edit-product-page">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-4"
          data-testid="btn-back"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">Edit Product</h1>
        <p className="text-sm text-stone-500 mt-1">
          Editing <span className="font-medium text-stone-700">{product.name}</span>
        </p>
      </div>

      <div className="max-w-2xl">
        <ProductForm initialData={product} isEdit organizations={organizations ?? []} />
      </div>
    </div>
  );
}
