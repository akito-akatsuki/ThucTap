import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({
        success: false,
        error: "No items",
      });
    }

    /* =========================
       GET USER (OPTIONAL)
    ========================= */
    let userId = "system";
    let name = "POS";
    let username = "POS";

    // ⚠️ client supabase ở server thường KHÔNG có session
    // nên đoạn này có thể fail → fallback vẫn chạy
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;

        const email = user.email || "POS";
        name = user.user_metadata?.name || "Unknown";

        username = `${email} (${name})`;
      }
    } catch (e) {
      console.log("Auth fallback:", e.message);
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
        created_by: username,
        note: "sale",
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
