import ImportWorkspace from "@/components/ImportWorkspace";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Import products · PawShop Ops" };

export default async function ImportsPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase.from("organizations").select("id, name").order("name");
  return <ImportWorkspace organizations={organizations ?? []} />;
}
