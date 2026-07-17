"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

interface AppShellProps {
  account: { email: string; role: string } | null;
  children: React.ReactNode;
}

export default function AppShell({ account, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar account={account} />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/45"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative h-full shadow-2xl">
            <Sidebar account={account} mobile onNavigate={() => setMobileMenuOpen(false)} />
            <button
              type="button"
              className="absolute left-full top-3 ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-stone-700 shadow-lg"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-surface px-4 shadow-sm md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-b from-brand-500 to-brand-600 font-display italic text-white shadow-sm">P</div>
            <div>
              <p className="font-display text-sm font-semibold leading-tight text-stone-900">PawShop</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-accent">Commerce Ops</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-surface text-stone-700"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            data-testid="mobile-menu-trigger"
          >
            <Menu size={21} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
