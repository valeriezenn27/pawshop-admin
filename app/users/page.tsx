export const dynamic = "force-dynamic";

import UserManager from "@/components/UserManager";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationOption, OrganizationRole, OrgMember } from "@/lib/types";

export const metadata = { title: "Users · PawShop Ops" };

interface MembershipRow {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  organizations: { name: string } | null;
}

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: membershipRows }, { data: organizations }, { data: platformAdmin }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, user_id, role, organizations(name)"),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("platform_admins").select("user_id").eq("user_id", user?.id ?? "").maybeSingle(),
  ]);

  const rows = (membershipRows ?? []) as unknown as MembershipRow[];
  const isPlatformAdmin = Boolean(platformAdmin);

  const manageableOrgIds = new Set(
    isPlatformAdmin
      ? (organizations ?? []).map((org: OrganizationOption) => org.id)
      : rows
          .filter((row) => row.user_id === user?.id && (row.role === "owner" || row.role === "admin"))
          .map((row) => row.organization_id),
  );

  // Emails live in auth.users, which RLS-scoped clients cannot read; the
  // service-role admin API maps the ids we already got through RLS. If the
  // key isn't configured the page still works, minus emails.
  const emails = new Map<string, string>();
  let serviceKeyMissing = false;
  try {
    const admin = createAdminClient();
    const uniqueIds = [...new Set(rows.map((row) => row.user_id))];
    await Promise.all(
      uniqueIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data?.user?.email) emails.set(id, data.user.email);
      }),
    );
  } catch {
    serviceKeyMissing = true;
  }

  const members: OrgMember[] = rows
    .map((row) => ({
      organization_id: row.organization_id,
      organization_name: row.organizations?.name ?? "Unknown workspace",
      user_id: row.user_id,
      email: emails.get(row.user_id) ?? null,
      role: row.role,
    }))
    .sort((a, b) =>
      a.organization_name.localeCompare(b.organization_name) || (a.email ?? "").localeCompare(b.email ?? ""),
    );

  const manageableOrganizations = (organizations ?? []).filter((org: OrganizationOption) =>
    manageableOrgIds.has(org.id),
  );

  return (
    <UserManager
      members={members}
      organizations={manageableOrganizations}
      currentUserId={user?.id ?? ""}
      serviceKeyMissing={serviceKeyMissing}
    />
  );
}
