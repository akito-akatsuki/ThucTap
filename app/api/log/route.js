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
      users ( name, email ),
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

  // Map lại dữ liệu để Frontend dễ dùng (nếu muốn)
  const formattedData = data.map((log) => ({
    ...log,
    creator_display: log.users
      ? `${log.users.email} (${log.users.name})`
      : "Unknown",
  }));

  return Response.json({ data: formattedData });
}

/* =========================
   CREATE LOG (IMPORT / EXPORT)
========================= */
export async function POST(req) {
  try {
    const body = await req.json();
    // 1. Nhận thêm id từ body (hoặc từ supabase.auth.getUser() nếu bạn làm backend chuẩn)
    const { product_id, quantity, type, user } = body;

    if (!product_id || !quantity || !type || !user?.id) {
      return Response.json({
        error: "Missing fields or User ID",
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

    // 2. Chuẩn bị thông tin để ghi vào hóa đơn (vẫn giữ text nếu bảng invoices chưa đổi)
    const email = user?.email || "unknown@email.com";
    const nameUser = user?.user_metadata?.full_name || user?.name || "Unknown";
    const username = `${email} (${nameUser})`;
    /* =========================
       CREATE INVOICE
    ========================= */
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        total,
        created_name: username, // Nếu bảng invoices bạn cũng đổi sang UUID thì chỗ này phải sửa tiếp
      })
      .select()
      .single();

    if (invoiceError) {
      return Response.json({ error: invoiceError.message });
    }
    /* =========================
       INSERT LOG
    ========================= */
    const { error: logError } = await supabase.from("stock_movements").insert({
      product_id,
      quantity,
      price,
      type,
      created_by: user.id, // 🔥 QUAN TRỌNG: Truyền UUID thay vì String
      invoice_id: invoice.id,
    });

    if (logError) {
      return Response.json({ error: logError.message });
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
