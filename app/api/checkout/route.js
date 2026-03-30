import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { items, user } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({
        success: false,
        error: "No items",
      });
    }

    /* =========================
       USER (FROM FRONTEND)
    ========================= */
    let userId = null;
    let name = "POS";
    let username = "POS";

    if (user) {
      userId = user.id || null; // Đây là UUID
      name = user.name || "User";
      username = `${user.email} (${name})`;
    }

    console.log("USER:", username);

    /* =========================
       TOTAL
    ========================= */
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    /* =========================
       CREATE INVOICE
    ========================= */
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        total,
        created_by: userId,
        created_name: name,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    /* =========================
       PROCESS ITEMS
    ========================= */
    const tasks = items.map(async (item) => {
      if (!item.id) throw new Error("Product id missing");

      const itemInsert = supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        product_id: item.id,
        qty: item.qty,
        price: item.price,
      });

      const salesInsert = supabase.from("sales").insert({
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
      });
      const movementInsert = supabase.from("stock_movements").insert({
        product_id: item.id,
        type: "export",
        quantity: item.qty,
        price: item.price,
        created_by: userId, // ✅ THAY ĐỔI: Dùng userId (UUID) thay vì username (String)
        note: "sale",
        invoice_id: invoice.id,
      });
      fetch(`${req.nextUrl.origin}/api/low-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: item.name }),
      }).catch(() => {});

      const [itemRes, salesRes, movementRes] = await Promise.all([
        itemInsert,
        salesInsert,
        movementInsert,
      ]);

      if (itemRes.error) throw itemRes.error;
      if (movementRes.error) throw movementRes.error;

      if (salesRes.error) {
        console.log("Sales error:", salesRes.error);
      }
    });

    await Promise.all(tasks);

    return Response.json({
      success: true,
      invoice_id: invoice.id,
    });
  } catch (err) {
    console.log("Checkout error:", err);

    return Response.json({
      success: false,
      error: "Checkout failed",
    });
  }
}
