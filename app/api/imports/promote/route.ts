import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.organization_id || !body.file_name || !Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: "Organization, file, and reviewed rows are required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("promote_product_import", {
      p_organization_id: body.organization_id,
      p_file_name: body.file_name,
      p_column_mapping: body.mapping ?? {},
      p_rows: body.rows,
    });

    if (error) {
      console.error("Import promotion error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("POST /api/imports/promote error:", error);
    return NextResponse.json({ error: "Could not promote this import" }, { status: 500 });
  }
}
