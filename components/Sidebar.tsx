"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PlusCircle } from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/products",
    label: "Products",
    icon: Package,
    exact: false,
  },
  {
    href: "/products/new",
    label: "Add Product",
    icon: PlusCircle,
    exact: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 shrink-0"
      data-testid="sidebar"
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
          🐾
        </div>
        <div>
          <p className="font-semibold text-gray-900 leading-tight">PawShop</p>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">PawShop Admin v1.0</p>
      </div>
    </aside>
  );
}
