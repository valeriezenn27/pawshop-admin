"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.replace(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm" data-testid="login-form">
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 font-display text-base italic text-white">P</div>
        <span className="font-display font-semibold text-stone-900">PawShop</span>
      </div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Sign in</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-950">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">Use your Supabase user credentials — organization access is enforced by Row Level Security.</p>
      {error && (
        <div className="mt-6 border-l-2 border-rose-400 dark:border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300" role="alert">
          {error}
        </div>
      )}
      <div className="mt-8 space-y-5">
        <div><label className="form-label" htmlFor="email">Email</label><input id="email" data-testid="login-email" className="form-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="wanda@example.com" /></div>
        <div><label className="form-label" htmlFor="password">Password</label><input id="password" data-testid="login-password" className="form-input" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
      </div>
      <button data-testid="login-submit" className="btn-primary mt-8 w-full justify-center" disabled={loading}>{loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign in"}</button>
      <p className="mt-6 text-xs text-stone-400">Accounts are provisioned by your workspace administrator.</p>
    </form>
  );
}
