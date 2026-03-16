import { supabase } from "@/lib/supabase";

/* GET ALL CATEGORIES */

export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }

  return Response.json({
    success: true,
    data,
  });
}

/* CREATE CATEGORY */

export async function POST(req) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return Response.json({
        error: "Category name required",
      });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({ name })
      .select()
      .single();

    if (error) {
      return Response.json({
        error: error.message,
      });
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (err) {
    return Response.json({
      error: "Server error",
    });
  }
}
