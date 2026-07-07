import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select("status, stock");

    if (error) throw error;

    const stats = {
      totalProducts: data.length,
      activeProducts: data.filter((p) => p.status === "active").length,
      inactiveProducts: data.filter((p) => p.status === "inactive").length,
      lowStockProducts: data.filter((p) => p.stock < 10).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
