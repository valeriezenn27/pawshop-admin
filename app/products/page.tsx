export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link href="/products/new" className="btn-primary" data-testid="btn-add-product">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse" />}>
            <SearchFilter />
          </Suspense>
        </div>
        <ProductTable products={products} />
      </div>
    </div>
  );
}
