import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 30 ngày trước
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // 1️⃣ Lấy stock_movements export trong 30 ngày
    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("product_id, quantity, created_at")
      .eq("type", "export")
      .gte("created_at", thirtyDaysAgo);

    if (movementsError) throw movementsError;

    // 2️⃣ Lấy tất cả products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");
    if (productsError) throw productsError;

    // 3️⃣ Lấy inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from("inventory")
      .select("*");
    if (inventoryError) throw inventoryError;

    // 4️⃣ Lấy categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*");
    if (categoriesError) throw categoriesError;

    // 5️⃣ Merge dữ liệu
    const productMap = {};

    movements.forEach((m) => {
      const product = products.find((p) => p.id === m.product_id);
      if (!product) return;

      const stock =
        inventory.find((i) => i.product_id === m.product_id)?.stock || 0;
      const categoryName =
        categories.find((c) => c.id === product.category_id)?.name || "";

      if (!productMap[m.product_id]) {
        productMap[m.product_id] = {
          ...product,
          stock,
          category_name: categoryName,
          total_exported: 0,
          speedDays: new Set(),
        };
      }

      productMap[m.product_id].total_exported += m.quantity;
      productMap[m.product_id].speedDays.add(m.created_at.slice(0, 10));
    });

    // 6️⃣ Tạo topProducts
    const topProducts = Object.values(productMap)
      .map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        price: p.price,
        category_name: p.category_name,
        stock: p.stock,
        total_exported: p.total_exported,
        speed: (p.total_exported / Math.max(p.speedDays.size, 1)).toFixed(1),
      }))
      .sort((a, b) => b.total_exported - a.total_exported)
      .slice(0, 10);

    return new Response(JSON.stringify({ success: true, data: topProducts }), {
      status: 200,
    });
  } catch (err) {
    console.error("Error fetching top products:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Server error" }),
      { status: 500 },
    );
  }
}
