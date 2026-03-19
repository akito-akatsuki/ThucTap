import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/* GET ALL CATEGORIES */
export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true, data });
}

/* CREATE CATEGORY */
export async function POST(req) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name required" });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({ name })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" });
  }
}

/* DELETE CATEGORY BUT KEEP PRODUCTS */
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID required" });
    }

    // Update tất cả product liên quan, đặt category_id = null
    const { error: updateErr } = await supabase
      .from("products")
      .update({ category_id: null })
      .eq("category_id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message });
    }

    // Xóa category
    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message });
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted, products are kept",
      data,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" });
  }
}
