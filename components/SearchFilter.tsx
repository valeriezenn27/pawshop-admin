"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3" data-testid="search-filter">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search products by name or category..."
          defaultValue={search}
          onChange={(e) => updateParams("search", e.target.value)}
          className="form-input pl-9 w-full"
          data-testid="search-input"
          aria-label="Search products"
        />
      </div>

      <div className="relative flex items-center gap-2 shrink-0">
        <SlidersHorizontal size={16} className="text-gray-400" />
        <select
          value={status}
          onChange={(e) => updateParams("status", e.target.value)}
          className="form-input pr-8 min-w-[130px]"
          data-testid="status-filter"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
