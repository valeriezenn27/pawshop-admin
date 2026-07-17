"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Package, PlusCircle, Upload, Users, ShieldCheck } from "lucide-react";
import AccountMenu from "./AccountMenu";

const navItems = [
  {
    href: "/imports",
    label: "Data imports",
    icon: Upload,
    exact: false,
  },
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
  {
    href: "/users",
    label: "Users",
    icon: Users,
    exact: false,
  },
];

interface SidebarProps {
  account: { email: string; role: string } | null;
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ account, mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const visibleNavItems = account?.role === "platform_admin"
    ? [...navItems, { href: "/tenants", label: "Tenants", icon: Building2, exact: false }]
    : navItems;

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside
      id={mobile ? "mobile-navigation" : undefined}
      className={`${mobile ? "flex h-full flex-col" : "hidden md:flex md:flex-col"} w-64 bg-surface border-r border-stone-200 shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.03)]`}
      data-testid={mobile ? "mobile-sidebar" : "sidebar"}
    >
      <div data-sidebar-header className="flex items-center gap-3 bg-gradient-to-b from-inverse-from to-inverse-to px-6 py-5 shadow-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-b from-brand-500 to-brand-600 font-display text-lg italic text-white shadow-sm shadow-brand-900/40 ring-1 ring-inset ring-white/15">
          P
        </div>
        <div>
          <p data-brand-text className="font-display font-semibold text-white leading-tight tracking-tight">PawShop</p>
          <p data-brand-subtext className="text-[11px] uppercase tracking-[0.14em] text-brand-300">Commerce Ops</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleNavItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              data-nav-active={active || undefined}
              className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-900/30 ring-1 ring-inset ring-white/15"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-stone-200">
        {account && <div className="mb-3"><AccountMenu email={account.email} role={account.role} /></div>}
        <div data-chip="emerald" className="mb-3 flex items-center gap-2 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-900/20 ring-1 ring-inset ring-white/15"><ShieldCheck size={14} /> Tenant data protected</div>
        <p className="text-xs text-stone-400 text-center">PawShop Ops v2.0</p>
      </div>
    </aside>
  );
}
