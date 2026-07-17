"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, LogOut, Moon, Palette, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "default", label: "Default", icon: Palette },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function AccountMenu({ email, role }: { email: string; role: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>("default");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (current) setThemeState(current);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickAway(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open]);

  function selectTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-md border border-stone-200 bg-surface p-3 shadow-lg" data-testid="account-menu-panel">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Theme</p>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-stone-200 p-1">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectTheme(value)}
                data-testid={`theme-${value}`}
                aria-pressed={theme === value}
                className={`flex flex-col items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  theme === value
                    ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-900/30"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-stone-200 bg-surface px-2 py-1.5 text-xs font-medium text-stone-600 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300"
            aria-label="Sign out"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        data-testid="account-menu-trigger"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-stone-200 bg-stone-50 p-3 text-left transition-colors hover:border-stone-300"
      >
        <span className="min-w-0">
          <p className="truncate text-xs font-semibold text-stone-800">{email}</p>
          <span className="mt-1 block text-[11px] capitalize text-accent">{role.replace("_", " ")}</span>
        </span>
        <ChevronUp size={14} className={`shrink-0 text-stone-400 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}
