import { supabase } from "@/lib/supabase";

/* =========================
   GET ALL LOGS
========================= */
export async function GET() {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
      id,
      quantity,
      price,
      type,
      created_at,
      created_by,
      invoice_id,
      products ( name ),
      invoices (
        id,
        created_at,
        created_name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.log("LOG API ERROR:", error);
    return Response.json({ error: error.message });
  }

  return Response.json({ data });
}

/* =========================
   CREATE LOG (IMPORT / EXPORT)
========================= */
export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id, quantity, type, user } = body;

    if (!product_id || !quantity || !type) {
      return Response.json({
        error: "Missing fields",
      });
    }

    /* =========================
       GET PRODUCT
    ========================= */
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("price, name")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return Response.json({
        error: "Product not found",
      });
    }

    const price = product.price || 0;
    const total = quantity * price;

    /* =========================
       USER INFO
    ========================= */
    const email = user?.email || "unknown@email.com";
    const nameUser = user?.user_metadata?.full_name || "Unknown";
    const username = `${email} (${nameUser})`;

    /* =========================
       CREATE INVOICE
    ========================= */
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        total,
        created_name: username,
      })
      .select()
      .single();

    if (invoiceError) {
      return Response.json({
        error: invoiceError.message,
      });
    }

    /* =========================
       INSERT LOG
    ========================= */
    const { error: logError } = await supabase.from("stock_movements").insert({
      product_id,
      quantity,
      price, // 🔥 lấy từ product
      type,
      created_by: username,
      invoice_id: invoice.id,
    });

    if (logError) {
      return Response.json({
        error: logError.message,
      });
    }

    /* =========================
       UPDATE INVENTORY (AUTO)
    ========================= */
    const { data: inventory } = await supabase
      .from("inventory")
      .select("stock")
      .eq("product_id", product_id)
      .single();

    const currentStock = inventory?.stock || 0;

    let newStock = currentStock;

    if (type === "import") {
      newStock += quantity;
    } else if (type === "export") {
      if (currentStock < quantity) {
        return Response.json({
          error: "Not enough stock",
        });
      }
      newStock -= quantity;
    }

    await supabase
      .from("inventory")
      .update({ stock: newStock })
      .eq("product_id", product_id);

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.log("LOG POST ERROR:", err);
    return Response.json({
      error: "Server error",
    });
  }
}
