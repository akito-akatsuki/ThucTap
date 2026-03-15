import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity, user } = body;

    if (!product_id || !quantity || !user) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    /* SAVE LOG - trigger sẽ update stock */

    const { error } = await supabase.from("stock_movements").insert({
      product_id,
      type: "import",
      quantity,
      created_by: user,
    });

    if (error) {
      return Response.json({ error: error.message });
    }

    return Response.json({
      success: true,
    });
  } catch (err) {
    return Response.json({
      error: "Server error",
    });
  }
}
