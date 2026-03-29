import { supabase } from "@/lib/supabase";

/* =========================
HELPERS
========================= */
// Smooth the values a bit so it doesn't jump too sharply
const smooth = (arr) =>
  arr.map((v, i, a) => {
    const prev = a[i - 1] ?? v;
    const next = a[i + 1] ?? v;
    return Math.round(prev * 0.2 + v * 0.6 + next * 0.2);
  });

// Generate prediction with daily ups and downs
const linearTrendPrediction = (history, days) => {
  const base = history.length
    ? history.reduce((a, b) => a + b, 0) / history.length
    : 5; // default base if no history

  const prediction = Array.from({ length: days }).map((_, i) => {
    // small random daily fluctuation
    const dailyFluctuation = (Math.random() - 0.5) * base * 0.4; // ±20% of base
    const smallRandom = Math.floor(Math.random() * 3 - 1); // -1,0,1
    return Math.max(0, base + dailyFluctuation + smallRandom);
  });

  return smooth(prediction).map((n) => Math.round(n));
};
const generateImportPrediction = (exportArr, stock = 10) => {
  let currentStock = stock;

  return exportArr.map((exp) => {
    let importQty = 0;

    // Nếu tồn kho sắp hết → nhập thêm
    if (currentStock < exp * 2) {
      importQty = Math.round(exp * (1.2 + Math.random() * 0.3)); // nhập hơn bán
    } else {
      importQty = Math.round(exp * (0.3 + Math.random() * 0.2)); // nhập ít
    }

    currentStock = currentStock + importQty - exp;

    return Math.max(0, importQty);
  });
};
/* =========================
MAIN
========================= */
export async function POST(req) {
  try {
    const body = await req.json();
    const products = body.products || [];
    const mode = body.mode || "week";

    const DAYS = mode === "month" ? 30 : 7;

    if (!products.length) {
      return Response.json({ data: [] });
    }

    /* GET SALES LAST 30 DAYS */
    const { data: sales, error } = await supabase
      .from("sales")
      .select("product_id, quantity, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (error) {
      console.error(error);
      return Response.json({ data: [] });
    }

    /* GROUP SALES BY PRODUCT + DAY */
    const map = {};
    sales.forEach((s) => {
      const day = new Date(s.created_at).toISOString().slice(0, 10);
      if (!map[s.product_id]) map[s.product_id] = {};
      if (!map[s.product_id][day]) map[s.product_id][day] = 0;
      map[s.product_id][day] += s.quantity;
    });

    /* BUILD PREDICTION */
    const result = products.map((p) => {
      const history = Object.values(map[p.id] || {});
      const prediction = linearTrendPrediction(history, DAYS);

      const predictedSales = prediction.reduce((a, b) => a + b, 0);

      const avgDaily = history.length
        ? history.reduce((a, b) => a + b, 0) / history.length
        : 1;

      const daysLeft = Math.max(
        1,
        Math.floor((p.inventory?.stock || 10) / (avgDaily || 1)),
      );

      const stock = p.inventory?.stock || 10;

      // export = prediction (giữ nguyên)
      const exportPrediction = prediction;

      // import = AI tính thêm
      const importPrediction = generateImportPrediction(
        exportPrediction,
        stock,
      );

      return {
        name: p.name,
        export: exportPrediction,
        import: importPrediction,
        predictedSales,
        daysLeft,
      };
    });

    return Response.json({ data: result });
  } catch (err) {
    console.error("Predict error:", err);
    return Response.json({ data: [], error: err.message });
  }
}
