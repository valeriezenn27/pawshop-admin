import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationRole } from "@/lib/types";

const VALID_ROLES: OrganizationRole[] = ["owner", "admin", "operator", "viewer"];

// Changes a member's role within one organization. RLS ("org admins change
// member roles") is the boundary: non-admins and self-role-changes match zero
// rows, which surfaces here as a 403.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: userId } = await params;
    const body: { organization_id?: string; role?: OrganizationRole } = await request.json();
    const { organization_id, role } = body;

    if (!organization_id) {
      return NextResponse.json({ error: "Workspace is required" }, { status: 400 });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Role must be owner, admin, operator, or viewer" }, { status: 400 });
    }
    if (userId === user.id) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("organization_id", organization_id)
      .eq("user_id", userId)
      .select("organization_id, user_id, role")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Member not found, or you are not an owner/admin of this workspace" },
        { status: 403 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
