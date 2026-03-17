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

    /* GET USER */

    const email = user?.email || "POS";
    const name = user?.user_metadata?.name || "Unknown";
    const username = `${email} (${name})`;

    /* TOTAL */

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    /* CREATE INVOICE */

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({ total })
      .select()
      .single();

    if (invoiceError) {
      console.log("Invoice error:", invoiceError);
      throw invoiceError;
    }

    /* PROCESS ITEMS (PARALLEL) */

    const tasks = items.map(async (item) => {
      if (!item.id) {
        throw new Error("Product id missing");
      }

      /* SAVE INVOICE ITEM */
      const itemInsert = supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        product_id: item.id,
        qty: item.qty,
        price: item.price,
      });

      /* SALES DATASET */
      const salesInsert = supabase.from("sales").insert({
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
      });

      /* STOCK MOVEMENT (trigger sẽ update stock) */
      const movementInsert = supabase.from("stock_movements").insert({
        product_id: item.id,
        type: "export",
        quantity: item.qty,
        price: item.price,
        created_by: username,
        note: "sale",
      });

      /* LOW STOCK ALERT (KHÔNG BLOCK) */
      fetch(`${req.nextUrl.origin}/api/low-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: item.name,
        }),
      }).catch((err) => console.log("Low stock error:", err));

      /* chạy song song 3 query */
      const [itemRes, salesRes, movementRes] = await Promise.all([
        itemInsert,
        salesInsert,
        movementInsert,
      ]);

      if (itemRes.error) {
        console.log("Invoice item error:", itemRes.error);
        throw itemRes.error;
      }

      if (salesRes.error) {
        console.log("Sales error:", salesRes.error);
      }

      if (movementRes.error) {
        console.log("Movement error:", movementRes.error);
        throw movementRes.error;
      }
    });

    /* đợi tất cả items xử lý xong */
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
