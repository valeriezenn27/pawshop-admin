"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountMenu({ email, role }: { email: string; role: string }) {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="truncate text-xs font-semibold text-slate-800">{email}</p><span className="mt-1 block text-[11px] capitalize text-indigo-600">{role.replace("_", " ")}</span><button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" aria-label="Sign out"><LogOut size={14} /> Sign out</button></div>;
}
