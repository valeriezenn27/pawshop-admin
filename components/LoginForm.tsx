"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Loader2 } from "lucide-react";
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
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50" data-testid="login-form">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white"><LockKeyhole size={21} /></div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">Sign in to PawShop</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use your Supabase user credentials. Your organization access is enforced by Row Level Security.</p>
      {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">{error}</div>}
      <div className="mt-6 space-y-4">
        <div><label className="form-label" htmlFor="email">Email</label><input id="email" data-testid="login-email" className="form-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="wanda@example.com" /></div>
        <div><label className="form-label" htmlFor="password">Password</label><input id="password" data-testid="login-password" className="form-input" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
      </div>
      <button data-testid="login-submit" className="btn-primary mt-6 w-full justify-center" disabled={loading}>{loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign in"}</button>
      <p className="mt-5 text-center text-xs text-slate-400">Accounts are provisioned by your workspace administrator.</p>
    </form>
  );
}
