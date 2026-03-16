import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    /* GET CURRENT USER */

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const email = session?.user?.email;

    if (!email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* SAVE STOCK MOVEMENT */

    const { error } = await supabase.from("stock_movements").insert({
      product_id,
      type: "import",
      quantity,
      created_by: email,
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
