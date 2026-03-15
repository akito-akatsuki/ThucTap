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

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    // 1️⃣ tạo invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({ total })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    for (const item of items) {
      // 2️⃣ lưu invoice items
      await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        product_id: item.id,
        qty: item.qty,
        price: item.price,
      });

      // 3️⃣ lấy stock
      const { data: stockData, error } = await supabase
        .from("inventory")
        .select("stock")
        .eq("product_id", item.id)
        .single();

      if (error || !stockData) {
        throw new Error("Inventory not found");
      }

      const newStock = stockData.stock - item.qty;
      // LOW STOCK ALERT
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

      // 4️⃣ update stock
      await supabase
        .from("inventory")
        .update({ stock: newStock })
        .eq("product_id", item.id);

      // 5️⃣ lưu sales (dataset cho AI)
      await supabase.from("sales").insert({
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
      });

      // 6️⃣ log stock movement
      await supabase.from("stock_movements").insert({
        product_id: item.id,
        type: "export",
        quantity: item.qty,
        price: item.price,
        created_by: "POS",
        note: "sale",
      });
    }

    return Response.json({
      success: true,
      invoice_id: invoice.id,
    });
  } catch (err) {
    console.log(err);

    return Response.json({
      success: false,
      error: "Checkout failed",
    });
  }
}
