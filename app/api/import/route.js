import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity, user } = body;

    /* =========================
       VALIDATE
    ========================= */
    if (!product_id || !quantity) {
      return Response.json(
        { error: "Missing product_id or quantity" },
        { status: 400 },
      );
    }

    if (!user) {
      return Response.json({ error: "User not provided" }, { status: 401 });
    }

    /* =========================
       USER INFO
    ========================= */
    const email = user.email;
    const name = user.user_metadata?.name || "Unknown";
    const username = `${email} (${name})`;

    /* =========================
       🔥 CREATE INVOICE (QUAN TRỌNG)
    ========================= */
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        total: 0, // import không cần total
        created_name: username,
      })
      .select()
      .single();

    if (invoiceError) {
      return Response.json({ error: invoiceError.message }, { status: 500 });
    }

    /* =========================
       🔥 INSERT STOCK MOVEMENT
    ========================= */
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        product_id,
        type: "import",
        quantity: Number(quantity),
        created_by: username,
        invoice_id: invoice.id, // ✅ FIX QUAN TRỌNG
      });

    if (movementError) {
      return Response.json({ error: movementError.message }, { status: 500 });
    }

    /* =========================
       RESPONSE
    ========================= */
    return Response.json({
      success: true,
      invoice_id: invoice.id,
      created_by: username,
    });
  } catch (err) {
    console.log("IMPORT API ERROR:", err);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
