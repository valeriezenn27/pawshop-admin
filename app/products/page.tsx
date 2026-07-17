export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductTable from "@/components/ProductTable";
import SearchFilter from "@/components/SearchFilter";
import { Suspense } from "react";
import type { ProductStatus } from "@/lib/types";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

async function getProducts(search: string, status: string) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status as ProductStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Products fetch error:", error);
    return [];
  }

  return data ?? [];
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { search = "", status = "all" } = await searchParams;
  const products = await getProducts(search, status);

  return (
    <div data-testid="products-page">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-400">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-stone-900">Products</h1>
      </div>

      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<div className="h-10 w-full max-w-xl bg-stone-100 rounded-md animate-pulse" />}>
          <div className="max-w-xl flex-1">
            <SearchFilter />
          </div>
        </Suspense>
        <Link href="/products/new" className="btn-primary shrink-0" data-testid="btn-add-product">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <ProductTable products={products} />
    </div>
  );
}
