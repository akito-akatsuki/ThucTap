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

    /* PROCESS ITEMS */

    for (const item of items) {
      if (!item.id) {
        throw new Error("Product id missing");
      }

      /* SAVE INVOICE ITEM */

      const { error: itemError } = await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        product_id: item.id,
        qty: item.qty,
        price: item.price,
      });

      if (itemError) {
        console.log("Invoice item error:", itemError);
        throw itemError;
      }

      /* GET CURRENT STOCK */

      const { data: stockData, error: stockError } = await supabase
        .from("inventory")
        .select("stock")
        .eq("product_id", item.id)
        .single();

      if (stockError || !stockData) {
        console.log("Inventory error:", stockError);
        throw new Error("Inventory not found");
      }

      const newStock = stockData.stock - item.qty;

      /* LOW STOCK ALERT */

      if (newStock <= 5) {
        await fetch(`${req.nextUrl.origin}/api/low-stock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: item.name,
            stock: newStock,
          }),
        });
      }

      /* SALES DATASET */

      const { error: salesError } = await supabase.from("sales").insert({
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
      });

      if (salesError) {
        console.log("Sales error:", salesError);
      }

      /* EXPORT STOCK MOVEMENT (TRIGGER UPDATE STOCK) */

      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          product_id: item.id,
          type: "export",
          quantity: item.qty,
          price: item.price,
          created_by: username,
          note: "sale",
        });

      if (movementError) {
        console.log("Movement error:", movementError);
        throw movementError;
      }
    }

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
