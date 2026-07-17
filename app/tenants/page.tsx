export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import TenantManager from "@/components/TenantManager";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tenants · PawShop Ops" };

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  if (!platformAdmin) notFound();

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return <TenantManager organizations={organizations ?? []} />;
}
