import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: platformAdmin } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!platformAdmin) {
      return NextResponse.json(
        { error: "Only platform super admins can create tenants" },
        { status: 403 },
      );
    }

    const body: { name?: string } = await request.json();
    const name = body.name?.trim();
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Tenant name must be between 2 and 100 characters" },
        { status: 400 },
      );
    }

    // Use the signed-in caller so the platform-admin RLS policy remains the
    // final authorization boundary.
    const { data: organization, error } = await supabase
      .from("organizations")
      .insert({ name })
      .select("id, name")
      .single();

    if (error) {
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Only platform super admins can create tenants" },
          { status: 403 },
        );
      }
      throw error;
    }

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("POST /api/organizations error:", error);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
