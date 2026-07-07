import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProductFormData } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";

    let query = supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: ProductFormData = await request.json();

    const { name, category, price, stock, status, image_url, description } = body;
    const requestedOrganizationId = (body as ProductFormData & { organization_id?: string }).organization_id;
    let organizationId = requestedOrganizationId;
    if (!organizationId) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(1)
        .maybeSingle();
      organizationId = membership?.organization_id;
    }
    if (!organizationId) {
      return NextResponse.json({ error: "Choose an organization before adding a product" }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!price || price <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        category,
        price,
        stock: stock ?? 0,
        status: status ?? "active",
        image_url: image_url || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
