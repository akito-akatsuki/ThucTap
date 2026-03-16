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

    let email = user;

    if (!email) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      email = authUser?.email;
    }

    /* =========================
       GET USERNAME FROM users
    ========================= */

    let username = "POS";

    if (email) {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .ilike("email", email) // 👈 tránh lỗi chữ hoa chữ thường
        .single();

      if (!error && data?.username) {
        username = data.username;
      }
    }

    /* =========================
       INSERT STOCK MOVEMENT
    ========================= */

    const { error } = await supabase.from("stock_movements").insert({
      product_id,
      type: "import",
      quantity,
      created_by: username,
    });

    if (error) {
      return Response.json({ error: error.message });
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
