import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;

    console.log("BODY:", body);

    if (!product_id || !quantity) {
      return Response.json(
        { error: "Missing product_id or quantity" },
        { status: 400 },
      );
    }

    /* =========================
       GET CURRENT USER
    ========================= */

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log("AUTH ERROR:", authError);
    }

    if (!user) {
      return Response.json({ error: "User not logged in" }, { status: 401 });
    }

    const email = user.email;
    const name = user.user_metadata?.name || "Unknown";

    const username = `${email} (${name})`;

    console.log("USERNAME:", username);

    /* =========================
       INSERT STOCK MOVEMENT
    ========================= */

    const { error } = await supabase.from("stock_movements").insert({
      product_id,
      type: "import",
      quantity: Number(quantity),
      created_by: username,
    });

    if (error) {
      console.log("INSERT ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      created_by: username,
    });
  } catch (err) {
    console.log("SERVER ERROR:", err);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
