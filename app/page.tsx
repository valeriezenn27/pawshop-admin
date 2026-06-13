export const dynamic = "force-dynamic";

import Link from "next/link";
import { Package, CheckCircle, XCircle, AlertTriangle, ArrowRight, Plus } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/lib/types";

async function getDashboardData() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Dashboard data error:", error);
    return { stats: null, recentProducts: [] };
  }

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p: Product) => p.status === "active").length,
    inactiveProducts: products.filter((p: Product) => p.status === "inactive").length,
    lowStockProducts: products.filter((p: Product) => p.stock < 10).length,
  };

  return { stats, recentProducts: products.slice(0, 5) };
}

export default async function DashboardPage() {
  const { stats, recentProducts } = await getDashboardData();

  return (
    <div data-testid="dashboard-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back — here&apos;s what&apos;s happening with your store.
          </p>
        </div>
        <Link href="/products/new" className="btn-primary" data-testid="btn-add-product-dash">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="stats-grid">
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="indigo"
        />
        <StatsCard
          title="Active Products"
          value={stats?.activeProducts ?? 0}
          icon={CheckCircle}
          color="green"
          description="Currently listed"
        />
        <StatsCard
          title="Inactive Products"
          value={stats?.inactiveProducts ?? 0}
          icon={XCircle}
          color="gray"
          description="Unlisted products"
        />
        <StatsCard
          title="Low Stock"
          value={stats?.lowStockProducts ?? 0}
          icon={AlertTriangle}
          color="amber"
          description="Under 10 units"
        />
      </div>

      <div className="card" data-testid="recent-products">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Products</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No products yet.</p>
            <Link href="/products/new" className="mt-3 inline-block btn-primary text-xs">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentProducts.map((product: Product) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Package size={15} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-sm font-medium text-gray-900 hidden sm:block">
                    {formatCurrency(product.price)}
                  </span>
                  <span
                    className={product.status === "active" ? "badge-active" : "badge-inactive"}
                  >
                    {product.status === "active" ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-gray-400 hidden md:block">
                    {formatDate(product.updated_at)}
                  </span>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
