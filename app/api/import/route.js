import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity, user } = body;

    console.log("BODY:", body);

    if (!product_id || !quantity) {
      return Response.json(
        { error: "Missing product_id or quantity" },
        { status: 400 },
      );
    }

    /* =========================
       GET EMAIL
    ========================= */

    let email = user;

    if (!email) {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log("AUTH ERROR:", error);
      }

      email = data?.user?.email;
    }

    console.log("EMAIL:", email);

    /* =========================
       GET USERNAME
    ========================= */

    let username = "POS";

    if (email) {
      const { data, error } = await supabase
        .from("users")
        .select("name")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log("USER QUERY ERROR:", error);
      }

      if (data?.name) {
        username = data.name;
      } else {
        username = email;
      }
    }

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
