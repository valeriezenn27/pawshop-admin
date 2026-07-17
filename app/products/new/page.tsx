import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase.from("organizations").select("id, name").order("name");
  return (
    <div data-testid="new-product-page">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-4"
          data-testid="btn-back"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">Add Product</h1>
        <p className="text-sm text-stone-500 mt-1">Fill in the details to add a new product.</p>
      </div>

      <div className="max-w-2xl">
        <ProductForm organizations={organizations ?? []} />
      </div>
    </div>
  );
}
