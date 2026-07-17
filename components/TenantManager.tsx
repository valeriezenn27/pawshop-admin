"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import type { OrganizationOption } from "@/lib/types";

export default function TenantManager({ organizations }: { organizations: OrganizationOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const tenantName = name.trim();
    if (tenantName.length < 2 || tenantName.length > 100) {
      setError("Tenant name must be between 2 and 100 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tenantName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create tenant");
      setName("");
      setSuccess(`${data.name} created`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create tenant");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div data-testid="tenants-page">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-400">
          {organizations.length} tenant{organizations.length !== 1 ? "s" : ""}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-stone-900">Tenants</h1>
      </div>

      <form onSubmit={handleSubmit} data-testid="tenant-form" className="mb-8 border-t-2 border-stone-900 bg-surface shadow-sm">
        <div className="space-y-5 p-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Super admin</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-stone-900">Create a tenant</h2>
          </div>
          {error && <div className="border-l-2 border-rose-400 bg-rose-50/60 px-4 py-3 text-sm text-rose-700" role="alert">{error}</div>}
          {success && <div className="border-l-2 border-emerald-400 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">{success}</div>}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="tenant-name" className="form-label">Tenant name <span className="text-rose-500">*</span></label>
              <input id="tenant-name" className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Happy Paws Manila" maxLength={100} data-testid="input-tenant-name" />
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting} data-testid="btn-create-tenant">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Building2 size={16} /> Create tenant</>}
            </button>
          </div>
          <p className="text-xs text-stone-400">After creating a tenant, open Users to add its first owner.</p>
        </div>
      </form>

      <div className="overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead><tr data-table-head className="bg-gradient-to-b from-inverse-from to-inverse-to"><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/80">Tenant name</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {organizations.map((organization) => <tr key={organization.id}><td className="px-4 py-3 font-medium text-stone-900">{organization.name}</td></tr>)}
            {organizations.length === 0 && <tr><td className="px-4 py-10 text-center text-stone-400">No tenants yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
