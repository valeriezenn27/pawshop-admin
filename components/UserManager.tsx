"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import type { OrganizationOption, OrganizationRole, OrgMember } from "@/lib/types";

const ROLE_OPTIONS: { value: OrganizationRole; label: string; description: string }[] = [
  { value: "viewer", label: "Viewer", description: "Read-only access to products and imports" },
  { value: "operator", label: "Operator", description: "Create and edit products and imports" },
  { value: "admin", label: "Admin", description: "Everything operators do, plus manage members" },
  { value: "owner", label: "Owner", description: "Full control of the workspace" },
];

interface UserManagerProps {
  members: OrgMember[];
  organizations: OrganizationOption[];
  currentUserId: string;
  serviceKeyMissing: boolean;
}

export default function UserManager({ members, organizations, currentUserId, serviceKeyMissing }: UserManagerProps) {
  const router = useRouter();
  const canManage = organizations.length > 0;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [role, setRole] = useState<OrganizationRole>("viewer");
  const [errors, setErrors] = useState<{ email?: string; password?: string; organizationId?: string }>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingMemberKey, setSavingMemberKey] = useState("");
  const [roleError, setRoleError] = useState("");

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim() || !email.includes("@")) next.email = "A valid email is required";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (!organizationId) next.organizationId = "Workspace is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError("");
    setSuccessMessage("");
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, organization_id: organizationId, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");
      setSuccessMessage(`${data.email} added as ${role}`);
      setEmail("");
      setPassword("");
      setRole("viewer");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changeRole(member: OrgMember, nextRole: OrganizationRole) {
    const key = `${member.organization_id}:${member.user_id}`;
    setSavingMemberKey(key);
    setRoleError("");
    try {
      const response = await fetch(`/api/users/${member.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: member.organization_id, role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role");
      router.refresh();
    } catch (error) {
      setRoleError(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setSavingMemberKey("");
    }
  }

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === role);

  return (
    <div data-testid="users-page">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-400">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-stone-900">Users</h1>
      </div>

      {serviceKeyMissing && (
        <p className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          SUPABASE_SERVICE_ROLE_KEY is not configured, so member emails cannot be shown and new users cannot be
          created. Copy it from the Supabase dashboard (Settings → API) into .env.local.
        </p>
      )}

      {canManage ? (
        <form onSubmit={handleSubmit} data-testid="user-form" noValidate className="mb-8 border-t-2 border-stone-900 bg-surface shadow-sm">
          <div className="space-y-5 p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Add a user</p>

            {serverError && (
              <div className="border-l-2 border-rose-400 dark:border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300" data-testid="user-form-error">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="border-l-2 border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400" data-testid="user-form-success">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="user-email" className="form-label">Email <span className="text-rose-500">*</span></label>
                <input id="user-email" type="email" autoComplete="off" className={`form-input ${errors.email ? "border-rose-400 dark:border-rose-600" : ""}`} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" data-testid="input-user-email" />
                {errors.email && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="user-password" className="form-label">Temporary password <span className="text-rose-500">*</span></label>
                <input id="user-password" type="password" autoComplete="new-password" className={`form-input ${errors.password ? "border-rose-400 dark:border-rose-600" : ""}`} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" data-testid="input-user-password" />
                {errors.password && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="user-org" className="form-label">Workspace <span className="text-rose-500">*</span></label>
                <select id="user-org" className="form-input" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} data-testid="input-user-org">
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
                {errors.organizationId && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.organizationId}</p>}
              </div>
              <div>
                <label htmlFor="user-role" className="form-label">Role</label>
                <select id="user-role" className="form-input" value={role} onChange={(event) => setRole(event.target.value as OrganizationRole)} data-testid="input-user-role">
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {selectedRole && <p className="mt-1 text-xs text-stone-400">{selectedRole.description}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={isSubmitting || serviceKeyMissing} data-testid="btn-create-user">
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><UserPlus size={16} /> Create user</>}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mb-8 text-sm text-stone-500">
          Only workspace owners and admins can add members or change roles.
        </p>
      )}

      {roleError && (
        <p className="mb-3 text-sm text-rose-600 dark:text-rose-400" role="alert" data-testid="role-error">{roleError}</p>
      )}

      <div className="overflow-x-auto bg-surface shadow-sm" data-testid="members-table">
        <table className="w-full text-sm">
          <thead>
            <tr data-table-head className="bg-gradient-to-b from-inverse-from to-inverse-to shadow-sm">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wide">Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wide">Workspace</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wide">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-stone-400">No members visible to your account.</td>
              </tr>
            )}
            {members.map((member) => {
              const key = `${member.organization_id}:${member.user_id}`;
              const isSelf = member.user_id === currentUserId;
              const editable = canManage && !isSelf && organizations.some((org) => org.id === member.organization_id);
              return (
                <tr key={key} data-testid="member-row">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">
                      {member.email ?? `${member.user_id.slice(0, 8)}…`}
                      {isSelf && <span className="ml-2 text-xs font-normal text-stone-400">(you)</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{member.organization_name}</td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <select
                        aria-label={`Role for ${member.email ?? member.user_id}`}
                        className="form-input max-w-[160px]"
                        value={member.role}
                        disabled={savingMemberKey === key}
                        onChange={(event) => changeRole(member, event.target.value as OrganizationRole)}
                        data-testid="member-role-select"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize text-stone-600">{member.role}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-b border-stone-200" />
    </div>
  );
}
