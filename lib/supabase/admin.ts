import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for the auth admin API (creating users, looking up
// emails). Server-only: SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix,
// so Next.js never exposes it to the browser. Tenant-scoped table writes must
// NOT use this client — they go through the caller's session client so RLS
// stays the enforcement boundary.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Copy it from the Supabase dashboard (Settings → API) into .env.local.",
    );
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
