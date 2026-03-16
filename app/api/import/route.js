import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity, user } = body;

    if (!product_id || !quantity) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    /* =========================
       GET EMAIL
    ========================= */

    const email = user || "admin";

    /* =========================
       GET USERNAME FROM DB
    ========================= */

    let username = email;

    if (email && email !== "admin") {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("email", email)
        .single();

      if (data?.username) {
        username = data.username;
      }
    }

    /* =========================
       INSERT LOG
    ========================= */

    const { error } = await supabase.from("stock_movements").insert({
      product_id,
      type: "import",
      quantity,
      created_by: username,
    });

    if (error) {
      return Response.json({
        error: error.message,
      });
    }

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    return Response.json({
      error: "Server error",
    });
  }
}
