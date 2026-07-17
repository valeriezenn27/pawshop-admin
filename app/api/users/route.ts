import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateUserPayload, OrganizationRole } from "@/lib/types";

const VALID_ROLES: OrganizationRole[] = ["owner", "admin", "operator", "viewer"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: CreateUserPayload = await request.json();
    const email = body.email?.trim().toLowerCase();
    const { password, organization_id, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!organization_id) {
      return NextResponse.json({ error: "Workspace is required" }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Role must be owner, admin, operator, or viewer" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      const alreadyExists =
        createError?.code === "email_exists" || /already.*registered|exists/i.test(createError?.message ?? "");
      if (alreadyExists) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      throw createError ?? new Error("User creation returned no user");
    }

    // Membership is inserted with the caller's own client: RLS
    // ("org admins add members") is the authorization boundary, not this route.
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .insert({ organization_id, user_id: created.user.id, role })
      .select("organization_id, user_id, role")
      .single();

    if (membershipError) {
      // Roll back the orphaned auth user so a denied caller leaves no trace.
      await admin.auth.admin.deleteUser(created.user.id);
      if (membershipError.code === "42501") {
        return NextResponse.json(
          { error: "Only workspace owners and admins can add members" },
          { status: 403 },
        );
      }
      throw membershipError;
    }

    return NextResponse.json({ ...membership, email }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    const message = error instanceof Error && /SUPABASE_SERVICE_ROLE_KEY/.test(error.message)
      ? error.message
      : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
