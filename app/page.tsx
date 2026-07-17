export const dynamic = "force-dynamic";

import Link from "next/link";
import { Package, CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import StatStrip from "@/components/StatStrip";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/lib/types";

async function getDashboardData() {
  const supabase = await createClient();
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
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div data-testid="dashboard-page">
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.14em] text-accent">{today}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900">
          Here&apos;s what&apos;s moving.
        </h1>
      </div>

      <StatStrip
        items={[
          { label: "Total products", value: stats?.totalProducts ?? 0, icon: Package, color: "brand" },
          { label: "Active", value: stats?.activeProducts ?? 0, icon: CheckCircle, color: "emerald", description: "Currently listed" },
          { label: "Inactive", value: stats?.inactiveProducts ?? 0, icon: XCircle, color: "stone", description: "Unlisted" },
          { label: "Low stock", value: stats?.lowStockProducts ?? 0, icon: AlertTriangle, color: "amber", description: "Under 10 units" },
        ]}
      />

      <div className="mt-10" data-testid="recent-products">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Recent products</h2>
          <Link href="/products" className="flex items-center gap-1 text-sm text-accent hover:opacity-75 font-medium">
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <p className="text-sm">No products yet.</p>
            <Link href="/products/new" className="mt-3 inline-block btn-primary text-xs">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentProducts.map((product: Product, index: number) => (
              <div key={product.id} className="flex items-center gap-4 py-3.5 hover:bg-stone-50 transition-colors">
                <span className="w-5 shrink-0 text-right font-mono text-xs text-stone-300 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                  <p className="text-xs text-stone-400">{product.category}</p>
                </div>
                <span className="text-sm font-medium text-stone-900 hidden sm:block tabular-nums">
                  {formatCurrency(product.price)}
                </span>
                <span className={product.status === "active" ? "badge-active" : "badge-inactive"}>
                  {product.status === "active" ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-stone-400 hidden md:block w-24 shrink-0">
                  {formatDate(product.updated_at)}
                </span>
                <Link href={`/products/${product.id}/edit`} className="text-xs text-accent hover:opacity-75 font-medium shrink-0">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
